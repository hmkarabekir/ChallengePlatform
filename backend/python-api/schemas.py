# Pydantic schemas for API request/response models
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum

# Enums
class ChallengeStatus(str, Enum):
    UPCOMING = "upcoming"
    ACTIVE = "active"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

# User schemas
class UserBase(BaseModel):
    address: str
    username: str
    email: str

class UserCreate(UserBase):
    pass

class UserResponse(UserBase):
    id: str
    created_at: datetime
    steps: Optional[int] = 0
    active_minutes: Optional[int] = 0
    calories_burned: Optional[int] = 0
    health_data_updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Challenge schemas
class ChallengeBase(BaseModel):
    name: str
    description: Optional[str] = None
    stake_amount: int = Field(..., description="Stake amount in microAlgos")
    max_participants: int
    start_date: datetime
    end_date: datetime

class ChallengeCreate(ChallengeBase):
    pass

class ChallengeResponse(ChallengeBase):
    id: str
    current_participants: int
    status: ChallengeStatus
    pool_amount: int
    creator_id: str
    created_at: datetime
    contract_address: Optional[str] = None
    contract_id: Optional[int] = None

    class Config:
        from_attributes = True

# Challenge participant schemas
class ChallengeParticipantBase(BaseModel):
    stake_amount: int
    participant_address: str

class ChallengeParticipantCreate(ChallengeParticipantBase):
    challenge_id: str

class ChallengeParticipantResponse(ChallengeParticipantBase):
    id: str
    challenge_id: str
    user_id: str
    joined_at: datetime
    is_active: bool
    eliminated_at: Optional[datetime] = None
    elimination_round: Optional[int] = None
    final_rank: Optional[int] = None

    class Config:
        from_attributes = True

# Weekly ranking schemas
class ParticipantRankingBase(BaseModel):
    participant_id: str
    tasks_completed: int = 0
    tasks_missed: int = 0
    rank: int
    points: float = 0.0

class WeeklyRankingBase(BaseModel):
    week: int
    eliminated_participant_id: Optional[str] = None

class WeeklyRankingResponse(WeeklyRankingBase):
    id: str
    challenge_id: str
    created_at: datetime
    participants: List[ParticipantRankingBase] = []

    class Config:
        from_attributes = True

# Chat message schemas
class ChatMessageBase(BaseModel):
    message: str

class ChatMessageCreate(ChatMessageBase):
    pass

class ChatMessageResponse(ChatMessageBase):
    id: str
    challenge_id: str
    user_id: str
    username: str
    timestamp: datetime
    is_system_message: bool = False

    class Config:
        from_attributes = True

# Task schemas
class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    points: int = 1
    due_date: Optional[datetime] = None

class TaskCreate(TaskBase):
    pass

class TaskResponse(TaskBase):
    id: str
    challenge_id: str
    is_completed: bool
    completed_by: Optional[str] = None
    completed_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True

# Health data schemas (placeholder for future integration)
class HealthDataBase(BaseModel):
    steps: int = 0
    active_minutes: int = 0
    calories_burned: int = 0

class HealthDataUpdate(HealthDataBase):
    pass

class HealthDataResponse(HealthDataBase):
    last_updated: datetime

    class Config:
        from_attributes = True

# API response schemas
class ApiResponse(BaseModel):
    success: bool
    data: Optional[dict] = None
    error: Optional[str] = None
    message: Optional[str] = None

class PaginatedResponse(BaseModel):
    data: List[dict]
    total: int
    page: int
    limit: int
    has_more: bool

# WebSocket message schemas
class WebSocketMessage(BaseModel):
    type: str
    data: dict
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class ChatMessageWS(WebSocketMessage):
    type: str = "chat_message"
    data: ChatMessageResponse

class RankingUpdateWS(WebSocketMessage):
    type: str = "ranking_update"
    data: WeeklyRankingResponse

class ChallengeUpdateWS(WebSocketMessage):
    type: str = "challenge_update"
    data: ChallengeResponse
