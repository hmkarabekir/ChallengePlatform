Challenge Platform - TypeScript Implementation

A TypeScript-based habit tracker challenge platform built on the Algorand blockchain. Users pay an entry fee to join challenges and earn points by completing tasks.

🚀 Features
Challenge System

3-week challenges

Minimum 10, maximum 30 participants

Entry fee (in ALGO)

Weekly point-based leaderboard

The last participant is eliminated each week

Points & Payment System

Earn points for daily tasks

Weekly ranking based on total points

Eliminated participant loses 30% of their stake

Remaining 70% distributed to top 3:

1st place: 40%

2nd place: 30%

3rd place: 30%

🛠️ Tech Stack

Algorand blockchain

TypeScript (full-stack)

@algorandfoundation/algorand-typescript (Smart contracts)

@algorandfoundation/algokit-utils (Utilities)

algosdk (Core SDK)

Express.js (API Server)

Jest (Testing)

📁 Project Structure
challenge-platform/
├── contracts/
│   ├── HabitTrackerChallenge.algo.ts    # Main smart contract
│   ├── client/
│   │   └── HabitTrackerClient.ts        # TypeScript client
│   ├── types/
│   │   └── index.ts                     # Type definitions
│   ├── api/
│   │   └── server.ts                    # Express.js API server
│   └── deploy.ts                        # Deployment script
├── tests/
│   ├── contracts/
│   │   └── HabitTrackerChallenge.test.ts
│   └── setup.ts
├── package.json
├── tsconfig.json
├── jest.config.js
├── .eslintrc.js
├── algokit.toml
└── README.md
🚀 Setup
1. Install Dependencies
npm install

2. Configure Environment Variables
# Create .env file
cp .env.example .env

# Edit environment variables
DEPLOYER_MNEMONIC="your mnemonic phrase here"
ALGOD_SERVER="https://testnet-api.algonode.cloud"
ALGOD_TOKEN=""

3. Build the Project
npm run build:all

4. Run Tests
npm test

🔧 Development
Smart Contract Development
# Compile contracts
npm run build:contracts

# Run in development mode
npm run dev:contracts

API Server Development
# Run API server in development mode
npm run dev:api

Linting
# Run TypeScript linting
npm run lint

# Fix linting issues
npm run lint:fix

🚀 Deployment
Local Network
# Start local network
algokit localnet start

# Deploy contract
npm run deploy:localnet

Testnet
# Deploy to testnet
npm run deploy:testnet

Mainnet
# Deploy to mainnet
npm run deploy:mainnet

📚 API Usage
Create Challenge
POST /api/challenges/create
{
  "name": "Fitness Challenge",
  "description": "30-day fitness challenge",
  "entryFee": 1.0,
  "startTime": 1700000000000,
  "maxParticipants": 30,
  "creatorPrivateKey": "your private key",
  "appId": 123
}

Join Challenge
POST /api/challenges/:id/join
{
  "participantAddress": "participant address",
  "privateKey": "participant private key"
}

Complete Task
POST /api/challenges/:id/complete-task
{
  "taskId": "1",
  "participantAddress": "participant address",
  "privateKey": "participant private key",
  "pointsEarned": 10,
  "week": 1
}

Weekly Elimination
POST /api/challenges/:id/eliminate
{
  "week": 1,
  "eliminatedParticipant": "participant address",
  "creatorPrivateKey": "creator private key"
}

Reward Distribution
POST /api/challenges/:id/distribute-rewards
{
  "week": 1,
  "winner1": "winner 1 address",
  "winner2": "winner 2 address",
  "winner3": "winner 3 address",
  "creatorPrivateKey": "creator private key"
}

🧪 Testing
Run All Tests
npm test

Contract Tests Only
npm run test:contracts

API Tests Only
npm run test:api

Integration Tests
npm run test:integration

📖 Smart Contract Methods
HabitTrackerChallenge Contract
Global State

challengeId: Challenge ID

entryFee: Entry fee

startTime: Start time

currentWeek: Current week

totalParticipants: Total participants

maxParticipants: Max participants

isActive: Is challenge active

creator: Challenge creator

week1Pool, week2Pool, week3Pool: Weekly reward pools

Local State (Per Participant)

isParticipant: Is participant

week1Points, week2Points, week3Points: Weekly points

totalPoints: Total points

isEliminated: Eliminated or not

eliminationWeek: Week of elimination

lastTaskTime: Last task completion time

Methods

createChallenge(): Create challenge

joinChallenge(): Join challenge

completeTask(): Complete task

weeklyElimination(): Weekly elimination

distributeWeeklyRewards(): Distribute weekly rewards

endChallenge(): End challenge

getParticipantState(): Query participant state

getChallengeInfo(): Query challenge info

🔒 Security

All transactions must be signed

Only the creator can perform certain actions

Participant limits are enforced

Point calculations are verified

Reward distributions are secure

🤝 Contribution

Fork the repo

Create a feature branch (git checkout -b feature/amazing-feature)

Commit changes (git commit -m 'Add amazing feature')

Push to branch (git push origin feature/amazing-feature)

Open a Pull Request

📄 License

This project is licensed under the MIT License. See the LICENSE file for details.
🙏 Acknowledgments

Algorand Foundation

AlgoKit

TypeScript

Express.js
