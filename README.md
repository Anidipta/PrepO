# PrepO

> **Learn. Earn. Compete.**  
> A decentralized, AI-driven learning ecosystem where knowledge meets rewards.

---

## 🚀 Overview  

This platform combines **AI**, **blockchain**, and **gamified incentives** to transform how people learn and teach.  
Built on the **CELO blockchain**, it enables **mentors** to create courses and **mentees** to learn, earn, and compete — all transparently and on-chain.  

---

## ✨ Key Features  

### 🎓 For Mentors  
- Create structured, reward-based courses directly on-chain.  
- Upload PDFs — the AI generates quizzes automatically.  
- Set pricing in CELO and choose course durations:  
  - **GO:** 1 day  
  - **GOA:** 1 week  
  - **GONE:** 2 weeks  
- Launch bounties with custom prize pools and leaderboard rewards.  

### 🧠 For Mentees  
- Enroll in courses, access uploaded PDFs, and take AI-generated quizzes.  
- Earn **CELO tokens** for correct answers.  
- Compete on **leaderboards** based on accuracy and quiz completion time.  
- Participate in **bounties** and earn bonus rewards.  
- Upload any PDF to generate instant quizzes and earn from self-assessments.  

---

## ⚙️ Tech Stack  

- **Frontend:** Next.js + Tailwind CSS + RainbowKit + Wagmi  
- **Blockchain:** CELO (Testnet: Celo Sepolia)  
- **Backend:** Node.js / RestAPI 
- **AI Engine:** LangChain for quiz generation  
- **Storage:** IPFS / MongoDB (for PDFs and metadata)  
- **Wallet Integration:** MetaMask, Trust Wallet  (via 
rainbow Kit)

---

## 🔗 Live Demo  

🌍 **Live App:** [https://prep-o.vercel.app](https://prep-o.vercel.app)  

📜 **Deployed Contract:** 

[0xFDcCd57d423EC8E3DbA325cecB5560cdC2BC9cbb](https://celo-sepolia.blockscout.com/address/0xFDcCd57d423EC8E3DbA325cecB5560cdC2BC9cbb?tab=index)  , 
[0x0BC8dCb2c6F6AA1dFD236c985241dad86C6593DF](https://celo-sepolia.blockscout.com/address/0x0BC8dCb2c6F6AA1dFD236c985241dad86C6593DF?tab=txs)

🧱 **Network:** CELO Sepolia Testnet  

**Live Backend AI:** [Here](https://prepo-ai.onrender.com)

---

## 🧩 Smart Contract Overview  

| Contract | Description | Network |
|-----------|--------------|----------|
| **PrepO.sol** | Handles course creation, enrollment, and AI quiz registration. Manages bounty creation, prize pools, and rewards. Manages CELO reward distribution and learner incentives. | CELO Sepolia |

---

## 🪙 Tokenomics  

| Action | Reward / Penalty |
|--------|------------------|
| ✅ Correct Answer | +0.20 CELO |
| ❌ Incorrect Answer | -0.20 CELO |
| 🏆 Bounty Win | Up to 80% of pool distributed to top mentees |
| 💡 Course Creation Fee | Paid by mentors in CELO |

---

## 💡 Why This?  

> Because traditional learning is passive.  
> This platform makes learning **interactive, rewarding, and decentralized** — powered by AI and verified on-chain.  

---

## 🧭 Roadmap  

| Phase | Milestone | Status |
|-------|------------|--------|
| **1** | AI Quiz Generator from PDF | ✅ Complete |
| **2** | Course Creation & Enrollment | ✅ Complete |
| **3** | CELO Wallet Integration | ✅ Complete |
| **4** | Bounty System & Leaderboards | 🚀 Live |
| **5** | DAO-based Community Curation | 🔜 Upcoming |

---

## 🛠️ Getting Started  

### Clone the Repo
```bash
git clone https://github.com/Anidipta/PrepO.git
cd PrepO
````

### Install Dependencies

```bash
npm install
```

### Run Locally

```bash
npm run dev
```

### Deploy Contracts (Hardhat)

```bash
npx hardhat run scripts/deploy.ts --network celoSepolia
```

---

## 🧾 Environment Setup

Create a `.env` file in the root:

```bash
PRIVATE_KEY=your_wallet_private_key
CELO_RPC_URL=https://forno.celo-sepolia.celo-testnet.org
MONGODB_URI = mongodb+srv://
A
```

---

## 👥 Contributors

| Name              | Role                     | Contact                                               |
| ----------------- | ------------------------ | ----------------------------------------------------- |
| **Anidipta Pal**  | Founder / Lead Developer | [anidiptapal@gmail.com](mailto:anidiptapal@gmail.com) |

---

## 📜 License

MIT License © 2025 Anidipta Pal

---

### 💬 “Learn. Earn. Compete. Repeat.”

> The future of education is decentralized, AI-driven, and rewarding.
