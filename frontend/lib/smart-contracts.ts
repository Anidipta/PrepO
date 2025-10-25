// Smart Contract Interfaces and Utilities for CELO Learning Platform

export interface CourseData {
  id: string
  title: string
  mentor: string
  fee: number
  enrolledStudents: string[]
  totalReward: number
}

export interface BountyData {
  id: string
  title: string
  mentor: string
  prizePool: number
  entryFee: number
  participants: string[]
  winners: string[]
  deadline: number
  escrowAddress: string
}

export interface QuizReward {
  studentAddress: string
  amount: number
  timestamp: number
  quizId: string
}

// Simulated Smart Contract Functions
export const SmartContracts = {
  // Course Management
  enrollInCourse: async (studentAddress: string, courseId: string, fee: number) => {
    console.log(`[Smart Contract] Enrolling ${studentAddress} in course ${courseId}`)
    console.log(`[Smart Contract] Transferring ${fee} CELO from student to mentor`)
    // In production: call actual smart contract via web3.js
    return {
      success: true,
      transactionHash: `0x${Math.random().toString(16).slice(2)}`,
      timestamp: Date.now(),
    }
  },

  // Quiz Rewards
  rewardQuizCompletion: async (studentAddress: string, amount: number, quizId: string) => {
    console.log(`[Smart Contract] Rewarding ${studentAddress} with ${amount} CELO for quiz ${quizId}`)
    // In production: mint CELO tokens to student wallet
    return {
      success: true,
      transactionHash: `0x${Math.random().toString(16).slice(2)}`,
      amount,
      timestamp: Date.now(),
    }
  },

  // Bounty Management
  createBountyEscrow: async (mentorAddress: string, bountyId: string, prizePool: number, deadline: number) => {
    console.log(`[Smart Contract] Creating escrow for bounty ${bountyId}`)
    console.log(`[Smart Contract] Locking ${prizePool} CELO until ${new Date(deadline).toISOString()}`)
    // In production: create escrow contract
    return {
      success: true,
      escrowAddress: `0x${Math.random().toString(16).slice(2)}`,
      transactionHash: `0x${Math.random().toString(16).slice(2)}`,
    }
  },

  enterBounty: async (participantAddress: string, bountyId: string, entryFee: number) => {
    console.log(`[Smart Contract] Registering ${participantAddress} for bounty ${bountyId}`)
    console.log(`[Smart Contract] Transferring ${entryFee} CELO entry fee`)
    // In production: transfer entry fee to escrow
    return {
      success: true,
      transactionHash: `0x${Math.random().toString(16).slice(2)}`,
      timestamp: Date.now(),
    }
  },

  distributeBountyRewards: async (bountyId: string, winners: Array<{ address: string; amount: number }>) => {
    console.log(`[Smart Contract] Distributing rewards for bounty ${bountyId}`)
    winners.forEach((winner) => {
      console.log(`[Smart Contract] Sending ${winner.amount} CELO to ${winner.address}`)
    })
    // In production: distribute from escrow to winners
    return {
      success: true,
      transactionHash: `0x${Math.random().toString(16).slice(2)}`,
      distributedAmount: winners.reduce((sum, w) => sum + w.amount, 0),
    }
  },

  // Leaderboard & Discounts
  applyBountyDiscount: async (studentAddress: string, bountyId: string, discountPercentage: number) => {
    console.log(`[Smart Contract] Applying ${discountPercentage}% discount for ${studentAddress} on bounty ${bountyId}`)
    // In production: verify student is in top 3 of linked course
    return {
      success: true,
      discountApplied: true,
      discountPercentage,
    }
  },

  // Token Transfers
  transferCELO: async (fromAddress: string, toAddress: string, amount: number) => {
    console.log(`[Smart Contract] Transferring ${amount} CELO from ${fromAddress} to ${toAddress}`)
    // In production: use web3.js to execute transfer
    return {
      success: true,
      transactionHash: `0x${Math.random().toString(16).slice(2)}`,
      amount,
      timestamp: Date.now(),
    }
  },
}

// Real on-chain helpers (use a signer from wagmi/ethers)
import { ethers, Signer } from "ethers"

export const CONTRACT_ADDRESS = "0x0BC8dCb2c6F6AA1dFD236c985241dad86C6593DF"

// Platform fee (in CELO) used by frontend to display and include in payments when required
export const PLATFORM_FEE = 0.005
// Platform owner address (receives platform fees / payouts)
export const PLATFORM_OWNER = "0x11C46CB90A9DE1E2191b6545A91Ae67F6eC1Cb98"

export async function sendMentorStake(signer: Signer, mentorStakeCELO: number) {
  if (!signer) throw new Error("No signer provided")
  const value = ethers.parseEther(String(mentorStakeCELO))
  const tx = await signer.sendTransaction({ to: CONTRACT_ADDRESS, value })
  const receipt = await tx.wait()
  return { txHash: tx.hash, receipt }
}

/**
 * Enroll a mentee by transferring 80% to mentor and the rest to the deployed contract address.
 * This performs two native transfers using the signer.
 */
export async function enrollAndSplit(signer: Signer, mentorAddress: string, totalCELO: number) {
  if (!signer) throw new Error("No signer provided")
  const mentorShare = Number((totalCELO * 0.8).toFixed(6))
  const platformShare = Number((totalCELO - mentorShare).toFixed(6))

  const mentorTx = await signer.sendTransaction({ to: mentorAddress, value: ethers.parseEther(String(mentorShare)) })
  const mentorReceipt = await mentorTx.wait()

  const platformTx = await signer.sendTransaction({ to: CONTRACT_ADDRESS, value: ethers.parseEther(String(platformShare)) })
  const platformReceipt = await platformTx.wait()

  return {
    mentor: { txHash: mentorTx.hash, receipt: mentorReceipt },
    platform: { txHash: platformTx.hash, receipt: platformReceipt },
  }
}

// Call the contract's enrollInCourse method (contract does the 80/20 split on-chain)
const ENROLL_ABI = [
  "function enrollInCourse(string _courseId) payable",
]

const CONFIRM_ABI = [
  "function confirmEnrollment(string _courseId, address _student)"
]

export async function enrollInCourseOnChain(signer: Signer, courseCode: string, totalCELO: number) {
  if (!signer) throw new Error("No signer provided")
  const contract = new ethers.Contract(CONTRACT_ADDRESS, ENROLL_ABI, signer)
  const value = ethers.parseEther(String(totalCELO))
  const tx = await contract.enrollInCourse(courseCode, { value })
  const receipt = await tx.wait()
  return { txHash: tx.hash, receipt }
}

// Owner-side confirm call (uses an owner signer)
export async function confirmEnrollmentOnChain(signer: Signer, courseCode: string, studentAddress: string) {
  if (!signer) throw new Error("No signer provided")
  const contract = new ethers.Contract(CONTRACT_ADDRESS, CONFIRM_ABI, signer)
  const tx = await contract.confirmEnrollment(courseCode, studentAddress)
  const receipt = await tx.wait()
  return { txHash: tx.hash, receipt }
}

// Create bounty on-chain: mentor funds prizePool and creates bounty id in contract
const CREATE_BOUNTY_ABI = [
  "function createBounty(string _bountyId, string _courseId, uint256 _entryFee, uint256 _topX) payable",
]

export async function createBountyOnChain(signer: Signer, bountyId: string, courseId: string, entryFee: number, topX: number, prizePoolCELO: number) {
  if (!signer) throw new Error("No signer provided")
  const contract = new ethers.Contract(CONTRACT_ADDRESS, CREATE_BOUNTY_ABI, signer)
  const value = ethers.parseEther(String(prizePoolCELO))
  const tx = await contract.createBounty(bountyId, courseId, ethers.parseEther(String(entryFee)), topX, { value })
  const receipt = await tx.wait()
  return { txHash: tx.hash, receipt }
}

// Register for bounty on-chain (handles discount check via contract view)
const REGISTER_BOUNTY_ABI = [
  "function registerForBounty(string _bountyId, string _courseId) payable",
  "function isEnrolledInCourse(string _courseId, address _user) view returns (bool)",
]

export async function registerForBountyOnChain(signer: Signer, bountyId: string, courseId: string, entryFeeCELO: number) {
  if (!signer) throw new Error("No signer provided")
  const contract = new ethers.Contract(CONTRACT_ADDRESS, REGISTER_BOUNTY_ABI, signer)
  const userAddress = await signer.getAddress()
  const enrolled: boolean = await contract.isEnrolledInCourse(courseId, userAddress)

  const discounted = enrolled ? entryFeeCELO * 0.5 : entryFeeCELO
  const platformFee = 0.005 // CELO
  const total = Number((discounted + platformFee).toFixed(6))

  const value = ethers.parseEther(String(total))
  const tx = await contract.registerForBounty(bountyId, courseId, { value })
  const receipt = await tx.wait()
  return { txHash: tx.hash, receipt, isEnrolled: enrolled, amountPaid: total }
}

// Utility Functions
export const calculateBountyDiscount = (isEnrolled: boolean, isTopPerformer: boolean): number => {
  if (isTopPerformer) return 0.5 // 50% discount for top 3
  if (isEnrolled) return 0.5 // 50% discount for enrolled students
  return 0 // No discount for non-enrolled
}

export const calculateFinalEntryFee = (baseFee: number, discountPercentage: number): number => {
  return baseFee * (1 - discountPercentage)
}

export const formatCELOAmount = (amount: number): string => {
  return `${amount.toFixed(2)} CELO`
}

export const formatWalletAddress = (address: string): string => {
  if (!address) return ""
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}
