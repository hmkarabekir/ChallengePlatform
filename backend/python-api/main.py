# FastAPI Python backend for challenge platform
from fastapi import FastAPI, HTTPException, Depends, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer
from sqlalchemy.orm import Session
from typing import List, Optional
import asyncio
import json
from datetime import datetime, timedelta

from .database import get_db, engine, Base
from .models import User, Challenge, ChallengeParticipant, WeeklyRanking, ChatMessage, Task
from .schemas import (
    UserCreate, UserResponse, ChallengeCreate, ChallengeResponse,
    ChallengeParticipantCreate, WeeklyRankingResponse, ChatMessageCreate,
    TaskCreate, TaskResponse
)
from .services import (
    ChallengeService, UserService, RankingService, 
    ChatService, TaskService, ContractService
)
from .websocket_manager import WebSocketManager
from .mock_data import (
    get_mock_users, get_mock_challenges, get_mock_participants,
    get_mock_rankings, get_mock_chat_messages, get_mock_tasks
)

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Challenge Platform API",
    description="Backend API for fitness challenge platform with staking and eliminations",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],  # Frontend URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# WebSocket manager
websocket_manager = WebSocketManager()

# Services
challenge_service = ChallengeService()
user_service = UserService()
ranking_service = RankingService()
chat_service = ChatService()
task_service = TaskService()
contract_service = ContractService()

security = HTTPBearer()

# Dependency to get current user (placeholder - implement JWT auth)
async def get_current_user(token: str = Depends(security)) -> User:
    # TODO: Implement JWT token validation
    # For now, return a mock user
    return User(
        id="mock-user-id",
        address="mock-address",
        username="mock-user",
        email="mock@example.com",
        createdAt=datetime.now()
    )

# WebSocket endpoint for real-time communication
@app.websocket("/ws/{challenge_id}")
async def websocket_endpoint(websocket: WebSocket, challenge_id: str):
    await websocket_manager.connect(websocket, challenge_id)
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            # Handle different message types
            if message["type"] == "chat_message":
                await chat_service.handle_websocket_message(websocket, message, challenge_id)
            elif message["type"] == "ranking_update":
                await ranking_service.handle_websocket_message(websocket, message, challenge_id)
            
    except WebSocketDisconnect:
        websocket_manager.disconnect(websocket, challenge_id)

# User endpoints
@app.post("/users", response_model=UserResponse)
async def create_user(user: UserCreate, db: Session = Depends(get_db)):
    """Create a new user."""
    return await user_service.create_user(user, db)

@app.get("/users/{user_id}", response_model=UserResponse)
async def get_user(user_id: str, db: Session = Depends(get_db)):
    """Get user by ID."""
    user = await user_service.get_user(user_id, db)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

# Mock data endpoints for testing
@app.get("/mock/users")
async def get_mock_users_endpoint():
    """Get mock users for testing."""
    return get_mock_users()

@app.get("/mock/challenges")
async def get_mock_challenges_endpoint():
    """Get mock challenges for testing."""
    return get_mock_challenges()

@app.get("/mock/participants")
async def get_mock_participants_endpoint():
    """Get mock participants for testing."""
    return get_mock_participants()

@app.get("/mock/rankings")
async def get_mock_rankings_endpoint():
    """Get mock rankings for testing."""
    return get_mock_rankings()

@app.get("/mock/chat")
async def get_mock_chat_endpoint():
    """Get mock chat messages for testing."""
    return get_mock_chat_messages()

@app.get("/mock/tasks")
async def get_mock_tasks_endpoint():
    """Get mock tasks for testing."""
    return get_mock_tasks()

# Challenge endpoints
@app.post("/challenges", response_model=ChallengeResponse)
async def create_challenge(
    challenge: ChallengeCreate, 
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new challenge."""
    return await challenge_service.create_challenge(challenge, current_user, db)

@app.get("/challenges", response_model=List[ChallengeResponse])
async def get_challenges(
    status: Optional[str] = None,
    limit: int = 20,
    offset: int = 0,
    db: Session = Depends(get_db)
):
    """Get all challenges with optional filtering."""
    # For testing, return mock data
    if status == "mock" or not db:
        return get_mock_challenges()
    return await challenge_service.get_challenges(status, limit, offset, db)

@app.get("/challenges/{challenge_id}", response_model=ChallengeResponse)
async def get_challenge(challenge_id: str, db: Session = Depends(get_db)):
    """Get challenge by ID."""
    # For testing, return mock data
    if challenge_id.startswith("challenge-"):
        mock_challenges = get_mock_challenges()
        for challenge in mock_challenges:
            if challenge["id"] == challenge_id:
                return challenge
        raise HTTPException(status_code=404, detail="Challenge not found")
    
    challenge = await challenge_service.get_challenge(challenge_id, db)
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")
    return challenge

@app.post("/challenges/{challenge_id}/join")
async def join_challenge(
    challenge_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Join a challenge by staking the required amount."""
    return await challenge_service.join_challenge(challenge_id, current_user, db)

@app.post("/challenges/{challenge_id}/leave")
async def leave_challenge(
    challenge_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Leave a challenge (forfeit stake)."""
    return await challenge_service.leave_challenge(challenge_id, current_user, db)

# Ranking endpoints
@app.get("/challenges/{challenge_id}/rankings", response_model=List[WeeklyRankingResponse])
async def get_weekly_rankings(
    challenge_id: str,
    db: Session = Depends(get_db)
):
    """Get weekly rankings for a challenge."""
    return await ranking_service.get_weekly_rankings(challenge_id, db)

@app.post("/challenges/{challenge_id}/process-elimination")
async def process_weekly_elimination(
    challenge_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Process weekly elimination (admin only)."""
    return await ranking_service.process_weekly_elimination(challenge_id, current_user, db)

# Chat endpoints
@app.get("/challenges/{challenge_id}/messages")
async def get_chat_messages(
    challenge_id: str,
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db)
):
    """Get chat messages for a challenge."""
    return await chat_service.get_messages(challenge_id, limit, offset, db)

@app.post("/challenges/{challenge_id}/messages")
async def send_chat_message(
    challenge_id: str,
    message: ChatMessageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Send a chat message."""
    return await chat_service.send_message(challenge_id, message, current_user, db)

# Task endpoints
@app.get("/challenges/{challenge_id}/tasks", response_model=List[TaskResponse])
async def get_tasks(
    challenge_id: str,
    db: Session = Depends(get_db)
):
    """Get tasks for a challenge."""
    return await task_service.get_tasks(challenge_id, db)

@app.post("/challenges/{challenge_id}/tasks", response_model=TaskResponse)
async def create_task(
    challenge_id: str,
    task: TaskCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new task for a challenge."""
    return await task_service.create_task(challenge_id, task, current_user, db)

@app.post("/tasks/{task_id}/complete")
async def complete_task(
    task_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark a task as completed."""
    return await task_service.complete_task(task_id, current_user, db)

# Health check
@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "timestamp": datetime.now()}

# Background task for processing weekly eliminations
@app.on_event("startup")
async def startup_event():
    """Start background tasks on startup."""
    asyncio.create_task(process_weekly_eliminations())

async def process_weekly_eliminations():
    """Background task to process weekly eliminations."""
    while True:
        try:
            # Check for challenges that need weekly processing
            # This would be implemented in the ranking service
            await ranking_service.process_due_eliminations()
            await asyncio.sleep(3600)  # Check every hour
        except Exception as e:
            print(f"Error processing eliminations: {e}")
            await asyncio.sleep(3600)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
