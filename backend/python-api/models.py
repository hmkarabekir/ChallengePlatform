# SQLAlchemy models for challenge platform
from sqlalchemy import Column, String, Integer, DateTime, Boolean, Text, ForeignKey, Float
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    address = Column(String, unique=True, nullable=False)  # Algorand address
    username = Column(String, unique=True, nullable=False)
    email = Column(String, unique=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Health data (placeholder for future integration)
    steps = Column(Integer, default=0)
    active_minutes = Column(Integer, default=0)
    calories_burned = Column(Integer, default=0)
    health_data_updated_at = Column(DateTime)
    
    # Relationships
    created_challenges = relationship("Challenge", back_populates="creator")
    challenge_participants = relationship("ChallengeParticipant", back_populates="user")
    chat_messages = relationship("ChatMessage", back_populates="user")
    task_completions = relationship("TaskCompletion", back_populates="user")

class Challenge(Base):
    __tablename__ = "challenges"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    description = Column(Text)
    stake_amount = Column(Integer, nullable=False)  # in microAlgos
    max_participants = Column(Integer, nullable=False)
    current_participants = Column(Integer, default=0)
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)
    status = Column(String, nullable=False)  # upcoming, active, completed, cancelled
    pool_amount = Column(Integer, default=0)  # total staked amount
    creator_id = Column(String, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Smart contract integration
    contract_address = Column(String)
    contract_id = Column(Integer)
    
    # Relationships
    creator = relationship("User", back_populates="created_challenges")
    participants = relationship("ChallengeParticipant", back_populates="challenge")
    weekly_rankings = relationship("WeeklyRanking", back_populates="challenge")
    chat_messages = relationship("ChatMessage", back_populates="challenge")
    tasks = relationship("Task", back_populates="challenge")

class ChallengeParticipant(Base):
    __tablename__ = "challenge_participants"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    challenge_id = Column(String, ForeignKey("challenges.id"), nullable=False)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    stake_amount = Column(Integer, nullable=False)
    joined_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)
    eliminated_at = Column(DateTime)
    elimination_round = Column(Integer)
    final_rank = Column(Integer)
    
    # Smart contract state
    participant_address = Column(String, nullable=False)
    
    # Relationships
    challenge = relationship("Challenge", back_populates="participants")
    user = relationship("User", back_populates="challenge_participants")

class WeeklyRanking(Base):
    __tablename__ = "weekly_rankings"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    challenge_id = Column(String, ForeignKey("challenges.id"), nullable=False)
    week = Column(Integer, nullable=False)
    eliminated_participant_id = Column(String, ForeignKey("challenge_participants.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    challenge = relationship("Challenge", back_populates="weekly_rankings")
    eliminated_participant = relationship("ChallengeParticipant")

class ParticipantRanking(Base):
    __tablename__ = "participant_rankings"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    ranking_id = Column(String, ForeignKey("weekly_rankings.id"), nullable=False)
    participant_id = Column(String, ForeignKey("challenge_participants.id"), nullable=False)
    tasks_completed = Column(Integer, default=0)
    tasks_missed = Column(Integer, default=0)
    rank = Column(Integer, nullable=False)
    points = Column(Float, default=0.0)
    
    # Relationships
    ranking = relationship("WeeklyRanking")
    participant = relationship("ChallengeParticipant")

class ChatMessage(Base):
    __tablename__ = "chat_messages"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    challenge_id = Column(String, ForeignKey("challenges.id"), nullable=False)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    message = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    is_system_message = Column(Boolean, default=False)
    
    # Relationships
    challenge = relationship("Challenge", back_populates="chat_messages")
    user = relationship("User", back_populates="chat_messages")

class Task(Base):
    __tablename__ = "tasks"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    challenge_id = Column(String, ForeignKey("challenges.id"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text)
    points = Column(Integer, default=1)
    due_date = Column(DateTime)
    is_completed = Column(Boolean, default=False)
    completed_by = Column(String, ForeignKey("users.id"))
    completed_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    challenge = relationship("Challenge", back_populates="tasks")
    completed_by_user = relationship("User")

class TaskCompletion(Base):
    __tablename__ = "task_completions"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    task_id = Column(String, ForeignKey("tasks.id"), nullable=False)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    completed_at = Column(DateTime, default=datetime.utcnow)
    proof_data = Column(Text)  # Placeholder for health data verification
    
    # Relationships
    task = relationship("Task")
    user = relationship("User", back_populates="task_completions")
