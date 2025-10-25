// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title PrepO
 * 1. Course/Bounty Registration with hidden platform fees
 * 2. Bounty Prize Distribution
 * 3. AI Quiz Rewards (earn/lose 0.20 CELO per answer)
 */

contract PrepO {
    
    // =====================================================================
    // STATE VARIABLES
    // =====================================================================
    
    address public platformOwner;           // Your wallet address (receives 0.005 CELO fees)
    uint256 public constant PLATFORM_FEE = 0.005 ether;  // Hidden platform fee (0.005 CELO)
    uint256 public constant REWARD_PER_ANSWER = 0.20 ether;  // 0.20 CELO per correct/incorrect answer
    
    // =====================================================================
    // STRUCTS
    // =====================================================================
    
    struct Course {
        address mentor;              // Mentor's wallet who created the course
        string courseId;             // MongoDB course ID
        uint256 price;               // Course price in CELO (without platform fee)
        bool exists;
    }
    
    struct Bounty {
        address mentor;              // Mentor's wallet who created the bounty
        string bountyId;             // MongoDB bounty ID
        uint256 entryFee;            // Entry fee in CELO (without platform fee)
        uint256 prizePool;           // Total prize pool locked
        uint256 topX;                // Number of winners (top X on leaderboard)
        bool isActive;               // Bounty status
        bool exists;
    }
    
    struct Registration {
        address user;
        uint256 amountPaid;          // Amount paid by user (including platform fee)
        uint256 timestamp;
    }
    
    // =====================================================================
    // MAPPINGS
    // =====================================================================
    
    mapping(string => Course) public courses;                    // courseId => Course
    mapping(string => Bounty) public bounties;                   // bountyId => Bounty
    mapping(string => mapping(address => bool)) public courseEnrollments;   // courseId => user => enrolled
    mapping(string => mapping(address => bool)) public bountyRegistrations; // bountyId => user => registered
    mapping(string => Registration[]) public courseRegistrationHistory;     // courseId => registrations
    mapping(string => Registration[]) public bountyRegistrationHistory;     // bountyId => registrations
    // pending enrollments: courseId => user => amount paid (held in contract until owner confirms)
    mapping(string => mapping(address => uint256)) public pendingEnrollments;
    
    // =====================================================================
    // EVENTS
    // =====================================================================
    
    event CourseCreated(string courseId, address mentor, uint256 price);
    event CourseEnrollment(string courseId, address user, uint256 amountPaid, uint256 platformFee);
    
    event BountyCreated(string bountyId, address mentor, uint256 entryFee, uint256 prizePool, uint256 topX);
    event BountyRegistration(string bountyId, address user, uint256 amountPaid, uint256 platformFee, bool discounted);
    event BountyPrizeDistributed(string bountyId, address[] winners, uint256[] amounts);
    
    event QuizReward(address user, uint256 amount, bool earned);
    
    event PlatformFeeCollected(address from, uint256 amount);
    
    // =====================================================================
    // MODIFIERS
    // =====================================================================
    
    modifier onlyOwner() {
        require(msg.sender == platformOwner, "Only platform owner");
        _;
    }

    // Simple reentrancy guard
    bool private locked = false;
    modifier nonReentrant() {
        require(!locked, "Reentrant call");
        locked = true;
        _;
        locked = false;
    }
    
    // =====================================================================
    // CONSTRUCTOR
    // =====================================================================
    
    constructor() {
        platformOwner = msg.sender;  // Your wallet becomes the platform owner
    }
    
    // =====================================================================
    // 1. COURSE REGISTRATION FUNCTIONS
    // =====================================================================
    
    /**
     * @dev Create a new course (called from backend after course creation in MongoDB)
     * @param _courseId MongoDB course ID
     * @param _mentor Mentor's wallet address
     * @param _price Course price in CELO (will add 0.005 CELO platform fee on enrollment)
     */
    function createCourse(
        string memory _courseId,
        address _mentor,
        uint256 _price
    ) external onlyOwner {
        require(!courses[_courseId].exists, "Course already exists");
        require(_mentor != address(0), "Invalid mentor address");
        require(_price > 0, "Price must be greater than 0");
        
        courses[_courseId] = Course({
            mentor: _mentor,
            courseId: _courseId,
            price: _price,
            exists: true
        });
        
        emit CourseCreated(_courseId, _mentor, _price);
    }
    
    /**
     * @dev Enroll in a course
     * @param _courseId MongoDB course ID
     * User must send: course price + 0.005 CELO platform fee
     * Distribution: the paid amount is split on-chain: 80% to the mentor, remaining 20% to the platform owner
     */
    function enrollInCourse(string memory _courseId) external payable {
        Course memory course = courses[_courseId];
        require(course.exists, "Course does not exist");
        require(!courseEnrollments[_courseId][msg.sender], "Already enrolled");

        // Accept payment >= course.price. Hold funds in contract until owner confirmation.
        require(msg.value >= course.price, "Insufficient payment amount");

        // Store pending enrollment amount (escrow)
        pendingEnrollments[_courseId][msg.sender] = msg.value;

        emit CourseEnrollment(_courseId, msg.sender, msg.value, PLATFORM_FEE);
    }

    /**
     * @dev Owner confirms enrollment and releases funds to mentor/platform
     * This performs the 80/20 split: 80% to mentor, 20% to platform owner
     */
    function confirmEnrollment(string memory _courseId, address _student) external onlyOwner nonReentrant {
        uint256 amount = pendingEnrollments[_courseId][_student];
        require(amount > 0, "No pending enrollment for student");

        Course memory course = courses[_courseId];
        require(course.exists, "Course does not exist");

        // Effects: clear pending and mark enrolled
        pendingEnrollments[_courseId][_student] = 0;
        courseEnrollments[_courseId][_student] = true;

        // Record enrollment history
        courseRegistrationHistory[_courseId].push(Registration({
            user: _student,
            amountPaid: amount,
            timestamp: block.timestamp
        }));

        // Interactions: transfer funds
        uint256 mentorShare = (amount * 80) / 100;
        uint256 platformShare = amount - mentorShare;

        (bool mentorSuccess, ) = payable(course.mentor).call{value: mentorShare}("");
        require(mentorSuccess, "Transfer to mentor failed");

        (bool ownerSuccess, ) = payable(platformOwner).call{value: platformShare}("");
        require(ownerSuccess, "Platform fee transfer failed");

        emit PlatformFeeCollected(_student, PLATFORM_FEE);
    }
    
    // =====================================================================
    // 2. BOUNTY REGISTRATION & DISTRIBUTION FUNCTIONS
    // =====================================================================
    
    /**
     * @dev Create a new bounty (mentor must fund the prize pool)
     * @param _bountyId MongoDB bounty ID
     * @param _courseId Associated course ID (for discount eligibility)
     * @param _entryFee Entry fee in CELO (will add 0.005 CELO platform fee on registration)
     * @param _topX Number of top winners
     * Mentor must send the full prize pool when creating bounty
     */
    function createBounty(
        string memory _bountyId,
        string memory _courseId,
        uint256 _entryFee,
        uint256 _topX
    ) external payable {
        require(!bounties[_bountyId].exists, "Bounty already exists");
        require(courses[_courseId].exists, "Course does not exist");
        require(_entryFee > 0, "Entry fee must be greater than 0");
        require(_topX > 0, "Must have at least 1 winner");
        require(msg.value > 0, "Must fund prize pool");
        
        bounties[_bountyId] = Bounty({
            mentor: msg.sender,
            bountyId: _bountyId,
            entryFee: _entryFee,
            prizePool: msg.value,
            topX: _topX,
            isActive: true,
            exists: true
        });
        
        emit BountyCreated(_bountyId, msg.sender, _entryFee, msg.value, _topX);
    }
    
    /**
     * @dev Register for a bounty
     * @param _bountyId MongoDB bounty ID
     * @param _courseId Associated course ID
     * If enrolled in course: pay 20% of entry fee + 0.005 CELO (80% discount)
     * If not enrolled: pay full entry fee + 0.005 CELO
     * Distribution: entry fee goes to mentor, 0.005 CELO goes to platform owner
     */
    function registerForBounty(
        string memory _bountyId,
        string memory _courseId
    ) external payable {
        Bounty memory bounty = bounties[_bountyId];
        require(bounty.exists, "Bounty does not exist");
        require(bounty.isActive, "Bounty is not active");
        require(!bountyRegistrations[_bountyId][msg.sender], "Already registered");
        
        bool isEnrolled = courseEnrollments[_courseId][msg.sender];
        uint256 entryFee;

        if (isEnrolled) {
            // 50% discount for enrolled students
            entryFee = (bounty.entryFee * 50) / 100;
        } else {
            // Full entry fee
            entryFee = bounty.entryFee;
        }

        uint256 totalRequired = entryFee + PLATFORM_FEE;
        require(msg.value == totalRequired, "Incorrect payment amount");

        // Allocate 90% of entry fee to prize pool, 10% to platform owner (immediate)
        uint256 toPrize = (entryFee * 90) / 100;
        uint256 platformCut = entryFee - toPrize; // 10%

        // Update prize pool
        bounties[_bountyId].prizePool += toPrize;

        // Transfer platform portion (10% of entry fee + platform fee)
        uint256 platformTotal = platformCut + PLATFORM_FEE;
        (bool ownerSuccess, ) = payable(platformOwner).call{value: platformTotal}("");
        require(ownerSuccess, "Platform fee transfer failed");

        // Record registration
        bountyRegistrations[_bountyId][msg.sender] = true;
        bountyRegistrationHistory[_bountyId].push(Registration({
            user: msg.sender,
            amountPaid: msg.value,
            timestamp: block.timestamp
        }));

        emit BountyRegistration(_bountyId, msg.sender, msg.value, PLATFORM_FEE, isEnrolled);
        emit PlatformFeeCollected(msg.sender, PLATFORM_FEE);
    }
    
    /**
     * @dev Distribute bounty prizes to top X winners
     * @param _bountyId MongoDB bounty ID
     * @param _winners Array of winner addresses (from leaderboard)
     * @param _amounts Array of prize amounts for each winner
     * Can only be called by platform owner after bounty ends
     */
    function distributeBountyPrizes(
        string memory _bountyId,
        address[] memory _winners,
        uint256[] memory _amounts
    ) external onlyOwner {
        Bounty storage bounty = bounties[_bountyId];
        require(bounty.exists, "Bounty does not exist");
        require(bounty.isActive, "Bounty already concluded");
        require(_winners.length == _amounts.length, "Winners and amounts mismatch");
        require(_winners.length <= bounty.topX, "Too many winners");
        
        uint256 totalDistribution = 0;
        for (uint256 i = 0; i < _amounts.length; i++) {
            totalDistribution += _amounts[i];
        }
        require(totalDistribution <= bounty.prizePool, "Insufficient prize pool");
        
        // Distribute prizes
        for (uint256 i = 0; i < _winners.length; i++) {
            require(_winners[i] != address(0), "Invalid winner address");
            require(bountyRegistrations[_bountyId][_winners[i]], "Winner not registered");
            
            (bool success, ) = payable(_winners[i]).call{value: _amounts[i]}("");
            require(success, "Prize transfer failed");
        }
        
        // If there's remaining prize pool, return to mentor
        uint256 remaining = bounty.prizePool - totalDistribution;
        if (remaining > 0) {
            (bool refundSuccess, ) = payable(bounty.mentor).call{value: remaining}("");
            require(refundSuccess, "Refund to mentor failed");
        }
        
        bounty.isActive = false;
        bounty.prizePool = 0;
        
        emit BountyPrizeDistributed(_bountyId, _winners, _amounts);
    }
    
    // =====================================================================
    // 3. AI QUIZ REWARD FUNCTIONS
    // =====================================================================
    
    /**
     * @dev Process AI quiz results and distribute/deduct CELO
     * @param _user Mentee's wallet address
     * @param _correctAnswers Number of correct answers
     * @param _incorrectAnswers Number of incorrect answers
     * Earn 0.20 CELO per correct answer, lose 0.20 CELO per incorrect answer
     * Contract must have sufficient balance to pay rewards
     */
    function processQuizRewards(
        address _user,
        uint256 _correctAnswers,
        uint256 _incorrectAnswers
    ) external payable onlyOwner {
        require(_user != address(0), "Invalid user address");
        
        uint256 earnedAmount = _correctAnswers * REWARD_PER_ANSWER;
        uint256 lostAmount = _incorrectAnswers * REWARD_PER_ANSWER;
        
        if (earnedAmount > lostAmount) {
            // Net positive: pay user
            uint256 netReward = earnedAmount - lostAmount;
            require(address(this).balance >= netReward, "Insufficient contract balance");
            
            (bool success, ) = payable(_user).call{value: netReward}("");
            require(success, "Reward transfer failed");
            
            emit QuizReward(_user, netReward, true);
            
        } else if (lostAmount > earnedAmount) {
            // Net negative: deduct from user
            uint256 netDeduction = lostAmount - earnedAmount;
            require(msg.value == netDeduction, "Incorrect deduction amount");
            
            // Keep the deduction in contract for future rewards
            emit QuizReward(_user, netDeduction, false);
            
        } else {
            // Net zero: no transaction needed
            emit QuizReward(_user, 0, true);
        }
    }
    
    /**
     * @dev Alternative: User sends CELO upfront for quiz participation
     * @param _maxQuestions Maximum questions in quiz (8, 10, or 20)
     * User must send enough CELO to cover maximum possible losses
     */
    function startQuiz(uint256 _maxQuestions) external payable {
        uint256 requiredDeposit = _maxQuestions * REWARD_PER_ANSWER;
        require(msg.value >= requiredDeposit, "Insufficient deposit for quiz");
        
        // Store deposit in contract
        // After quiz completion, call settleQuiz to finalize rewards
    }
    
    /**
     * @dev Settle quiz and refund/reward based on performance
     * @param _user User address
     * @param _correctAnswers Correct answers
     * @param _incorrectAnswers Incorrect answers
     * @param _depositAmount Amount user deposited
     */
    function settleQuiz(
        address _user,
        uint256 _correctAnswers,
        uint256 _incorrectAnswers,
        uint256 _depositAmount
    ) external onlyOwner {
        require(_user != address(0), "Invalid user address");
        
        uint256 earnedAmount = _correctAnswers * REWARD_PER_ANSWER;
        uint256 lostAmount = _incorrectAnswers * REWARD_PER_ANSWER;
        
        if (earnedAmount > lostAmount) {
            // User earned more: refund deposit + reward
            uint256 netReward = earnedAmount - lostAmount;
            uint256 totalReturn = _depositAmount + netReward;
            
            require(address(this).balance >= totalReturn, "Insufficient contract balance");
            (bool success, ) = payable(_user).call{value: totalReturn}("");
            require(success, "Settlement transfer failed");
            
            emit QuizReward(_user, netReward, true);
            
        } else {
            // User lost or broke even: refund remaining deposit
            uint256 netLoss = lostAmount - earnedAmount;
            uint256 refundAmount = _depositAmount > netLoss ? _depositAmount - netLoss : 0;
            
            if (refundAmount > 0) {
                (bool success, ) = payable(_user).call{value: refundAmount}("");
                require(success, "Refund transfer failed");
            }
            
            emit QuizReward(_user, netLoss, false);
        }
    }
    
    // =====================================================================
    // UTILITY & ADMIN FUNCTIONS
    // =====================================================================
    
    /**
     * @dev Fund contract for quiz rewards (platform owner adds CELO)
     */
    function fundQuizRewards() external payable onlyOwner {
        require(msg.value > 0, "Must send CELO");
    }
    
    /**
     * @dev Check if user is enrolled in a course
     */
    function isEnrolledInCourse(string memory _courseId, address _user) external view returns (bool) {
        return courseEnrollments[_courseId][_user];
    }
    
    /**
     * @dev Check if user is registered for a bounty
     */
    function isRegisteredForBounty(string memory _bountyId, address _user) external view returns (bool) {
        return bountyRegistrations[_bountyId][_user];
    }
    
    /**
     * @dev Get course details
     */
    function getCourse(string memory _courseId) external view returns (Course memory) {
        return courses[_courseId];
    }
    
    /**
     * @dev Get bounty details
     */
    function getBounty(string memory _bountyId) external view returns (Bounty memory) {
        return bounties[_bountyId];
    }
    
    /**
     * @dev Get contract balance
     */
    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }
    
    /**
     * @dev Emergency withdraw (only owner)
     */
    function emergencyWithdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No balance to withdraw");
        
        (bool success, ) = payable(platformOwner).call{value: balance}("");
        require(success, "Withdrawal failed");
    }
    
    /**
     * @dev Change platform owner
     */
    function transferOwnership(address _newOwner) external onlyOwner {
        require(_newOwner != address(0), "Invalid new owner");
        platformOwner = _newOwner;
    }
    
    /**
     * @dev Receive function to accept CELO
     */
    receive() external payable {}
    
    /**
     * @dev Fallback function
     */
    fallback() external payable {}
}