# Challenge Platform Setup Guide

This guide will help you set up and run the fullstack challenge platform application.

## Prerequisites

- Node.js 18+ and npm
- Python 3.11+
- PostgreSQL 15+
- Redis 7+
- Docker and Docker Compose (optional)

## Quick Start with Docker

1. **Clone and navigate to the project:**
   ```bash
   cd challenge-platform
   ```

2. **Copy environment variables:**
   ```bash
   cp env.example .env
   ```

3. **Start all services:**
   ```bash
   docker-compose up -d
   ```

4. **Access the application:**
   - Frontend: http://localhost:3000
   - Python API: http://localhost:8000
   - Node.js Services: http://localhost:3001

## Manual Setup

### 1. Database Setup

**PostgreSQL:**
```bash
# Install PostgreSQL
sudo apt-get install postgresql postgresql-contrib

# Create database
sudo -u postgres createdb challenge_platform

# Create user (optional)
sudo -u postgres createuser --interactive
```

**Redis:**
```bash
# Install Redis
sudo apt-get install redis-server

# Start Redis
sudo systemctl start redis-server
```

### 2. Backend Setup

**Python API:**
```bash
cd backend/python-api

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set environment variables
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/challenge_platform"
export REDIS_URL="redis://localhost:6379"

# Run database migrations
alembic upgrade head

# Start the server
uvicorn main:app --reload
```

**Node.js Services:**
```bash
cd backend/node-services

# Install dependencies
npm install

# Build TypeScript
npm run build

# Start the server
npm run dev
```

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

### 4. Smart Contract Setup

```bash
cd contracts

# Install Python dependencies
pip install algosdk

# Deploy contracts (requires funded testnet account)
python deploy.py
```

## Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/challenge_platform
REDIS_URL=redis://localhost:6379

# Algorand
ALGORAND_NETWORK=testnet
ALGORAND_API_URL=https://testnet-api.algonode.cloud
ALGORAND_API_TOKEN=your_token_here

# Application
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
API_URL=http://localhost:8000
WS_URL=http://localhost:3001

# JWT
JWT_SECRET=your-secret-key-here
JWT_EXPIRATION=7d

# Platform Settings
PLATFORM_FEE_PERCENTAGE=5
CHALLENGE_DURATION_DAYS=21
WEEKLY_ELIMINATION_DAYS=7
```

### Algorand Testnet Setup

1. **Get testnet ALGOs:**
   - Visit https://testnet.algoexplorer.io/dispenser
   - Enter your wallet address
   - Request testnet ALGOs

2. **Configure wallet:**
   - Use Algorand Wallet or MyAlgo
   - Connect to testnet
   - Import your account

## Project Structure

```
challenge-platform/
├── frontend/                 # React + TypeScript frontend
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── contexts/       # React contexts
│   │   ├── services/       # API services
│   │   └── utils/          # Utility functions
│   └── package.json
├── backend/
│   ├── python-api/         # FastAPI Python backend
│   │   ├── services/       # Business logic services
│   │   ├── models.py       # Database models
│   │   ├── schemas.py      # API schemas
│   │   └── main.py         # FastAPI application
│   └── node-services/      # Node.js services
│       ├── src/
│       │   └── services/   # WebSocket, Cron, Contract services
│       └── package.json
├── contracts/              # Algorand smart contracts
│   ├── challenge_contract.py
│   ├── types.py
│   └── deploy.py
├── shared/                 # Shared types and utilities
│   └── types.ts
└── docker-compose.yml
```

## Key Features

### 1. Challenge Management
- Create 21-day fitness challenges
- Set stake amounts and participant limits
- Track challenge progress and status

### 2. Staking System
- Users stake ALGO tokens to join challenges
- Smart contract manages staking and pool distribution
- Early exit forfeits stake (remains in pool)

### 3. Weekly Eliminations
- Automatic elimination of lowest performers every 7 days
- Eliminated participants' stakes remain in pool
- Real-time notifications via WebSocket

### 4. Pool Distribution
- Final ranking-based distribution at challenge end
- Platform takes 5% fee
- Remaining participants split pool by ranking

### 5. Private Chatrooms
- Challenge-specific chat for participants
- Real-time messaging via WebSocket
- System messages for eliminations and updates

### 6. Health Integration (Placeholder)
- Ready for Google Fit/Apple Health integration
- Proof-of-work system for task verification
- Future: Automatic health data verification

## API Endpoints

### Challenges
- `GET /challenges` - List all challenges
- `POST /challenges` - Create new challenge
- `GET /challenges/{id}` - Get challenge details
- `POST /challenges/{id}/join` - Join challenge
- `POST /challenges/{id}/leave` - Leave challenge

### Rankings
- `GET /challenges/{id}/rankings` - Get weekly rankings
- `POST /challenges/{id}/process-elimination` - Process elimination

### Chat
- `GET /challenges/{id}/messages` - Get chat messages
- `POST /challenges/{id}/messages` - Send message

### Tasks
- `GET /challenges/{id}/tasks` - Get challenge tasks
- `POST /challenges/{id}/tasks` - Create task
- `POST /tasks/{id}/complete` - Complete task

## Smart Contract Integration

The smart contract is based on the Algorand digital marketplace template and includes:

- **Staking Management**: Deposit/withdraw functionality
- **Challenge State**: Participant tracking and challenge lifecycle
- **Weekly Eliminations**: Automated elimination logic
- **Pool Distribution**: Ranking-based reward distribution
- **Task Completion**: Proof-of-work verification system

## Development

### Running Tests
```bash
# Python tests
cd backend/python-api
pytest

# Node.js tests
cd backend/node-services
npm test

# Frontend tests
cd frontend
npm test
```

### Code Quality
```bash
# Python linting
cd backend/python-api
flake8 .
black .

# TypeScript linting
cd frontend
npm run lint

# Node.js linting
cd backend/node-services
npm run lint
```

## Deployment

### Production Environment
1. Set `NODE_ENV=production`
2. Use production database and Redis
3. Configure proper JWT secrets
4. Set up SSL certificates
5. Use production Algorand network

### Docker Production
```bash
docker-compose -f docker-compose.prod.yml up -d
```

## Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Check PostgreSQL is running
   - Verify DATABASE_URL is correct
   - Ensure database exists

2. **Redis Connection Error**
   - Check Redis is running
   - Verify REDIS_URL is correct

3. **Algorand Connection Error**
   - Check network connectivity
   - Verify API token is valid
   - Ensure testnet access

4. **WebSocket Connection Issues**
   - Check CORS configuration
   - Verify WebSocket URL
   - Check firewall settings

### Logs
```bash
# Docker logs
docker-compose logs -f [service_name]

# Python API logs
cd backend/python-api
uvicorn main:app --log-level debug

# Node.js logs
cd backend/node-services
npm run dev
```

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review the logs
3. Check GitHub issues
4. Contact the development team

## License

This project is licensed under the MIT License.
