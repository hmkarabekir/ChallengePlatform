# User service for managing users
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime

from ..models import User
from ..schemas import UserCreate, UserResponse

class UserService:
    async def create_user(self, user_data: UserCreate, db: Session) -> UserResponse:
        """Create a new user."""
        
        # Check if user already exists
        existing_user = db.query(User).filter(
            (User.address == user_data.address) |
            (User.username == user_data.username) |
            (User.email == user_data.email)
        ).first()
        
        if existing_user:
            raise ValueError("User with this address, username, or email already exists")
        
        # Create new user
        user = User(
            address=user_data.address,
            username=user_data.username,
            email=user_data.email
        )
        
        db.add(user)
        db.commit()
        db.refresh(user)
        
        return UserResponse.from_orm(user)

    async def get_user(self, user_id: str, db: Session) -> Optional[UserResponse]:
        """Get user by ID."""
        
        user = db.query(User).filter(User.id == user_id).first()
        
        if not user:
            return None
        
        return UserResponse.from_orm(user)

    async def get_user_by_address(self, address: str, db: Session) -> Optional[UserResponse]:
        """Get user by Algorand address."""
        
        user = db.query(User).filter(User.address == address).first()
        
        if not user:
            return None
        
        return UserResponse.from_orm(user)

    async def update_health_data(
        self, 
        user_id: str, 
        health_data: dict, 
        db: Session
    ) -> UserResponse:
        """Update user's health data (placeholder for future integration)."""
        
        user = db.query(User).filter(User.id == user_id).first()
        
        if not user:
            raise ValueError("User not found")
        
        # Update health data
        user.steps = health_data.get("steps", user.steps)
        user.active_minutes = health_data.get("active_minutes", user.active_minutes)
        user.calories_burned = health_data.get("calories_burned", user.calories_burned)
        user.health_data_updated_at = datetime.utcnow()
        
        db.commit()
        db.refresh(user)
        
        return UserResponse.from_orm(user)
