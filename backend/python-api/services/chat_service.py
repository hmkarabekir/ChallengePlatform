# Chat service for managing challenge chatrooms
from sqlalchemy.orm import Session
from sqlalchemy import and_, desc
from typing import List, Optional
from datetime import datetime

from ..models import ChatMessage, ChallengeParticipant
from ..schemas import ChatMessageCreate, ChatMessageResponse
from .websocket_manager import WebSocketManager

class ChatService:
    def __init__(self):
        self.websocket_manager = WebSocketManager()

    async def get_messages(
        self, 
        challenge_id: str, 
        limit: int = 50, 
        offset: int = 0,
        db: Session = None
    ) -> List[ChatMessageResponse]:
        """Get chat messages for a challenge."""
        
        messages = db.query(ChatMessage).filter(
            ChatMessage.challenge_id == challenge_id
        ).order_by(desc(ChatMessage.timestamp)).offset(offset).limit(limit).all()
        
        return [ChatMessageResponse.from_orm(message) for message in messages]

    async def send_message(
        self, 
        challenge_id: str, 
        message_data: ChatMessageCreate, 
        user: User, 
        db: Session
    ) -> ChatMessageResponse:
        """Send a chat message."""
        
        # Check if user is participating in the challenge
        participant = db.query(ChallengeParticipant).filter(
            and_(
                ChallengeParticipant.challenge_id == challenge_id,
                ChallengeParticipant.user_id == user.id,
                ChallengeParticipant.is_active == True
            )
        ).first()
        
        if not participant:
            raise ValueError("User is not participating in this challenge")
        
        # Create message
        message = ChatMessage(
            challenge_id=challenge_id,
            user_id=user.id,
            message=message_data.message
        )
        
        db.add(message)
        db.commit()
        db.refresh(message)
        
        # Broadcast to WebSocket clients
        await self.broadcast_message(challenge_id, message)
        
        return ChatMessageResponse.from_orm(message)

    async def send_system_message(
        self, 
        challenge_id: str, 
        message_text: str, 
        db: Session
    ) -> ChatMessageResponse:
        """Send a system message to the challenge chat."""
        
        # Create system message
        message = ChatMessage(
            challenge_id=challenge_id,
            user_id=None,  # System message
            message=message_text,
            is_system_message=True
        )
        
        db.add(message)
        db.commit()
        db.refresh(message)
        
        # Broadcast to WebSocket clients
        await self.broadcast_message(challenge_id, message)
        
        return ChatMessageResponse.from_orm(message)

    async def broadcast_message(
        self, 
        challenge_id: str, 
        message: ChatMessage
    ) -> None:
        """Broadcast message to all WebSocket clients in the challenge."""
        
        message_data = {
            "type": "chat_message",
            "data": {
                "id": message.id,
                "challenge_id": message.challenge_id,
                "user_id": message.user_id,
                "username": message.user.username if message.user else "System",
                "message": message.message,
                "timestamp": message.timestamp.isoformat(),
                "is_system_message": message.is_system_message
            },
            "timestamp": datetime.utcnow().isoformat()
        }
        
        await self.websocket_manager.broadcast_to_challenge(
            challenge_id, 
            message_data
        )

    async def handle_websocket_message(
        self, 
        websocket, 
        message: dict, 
        challenge_id: str
    ) -> None:
        """Handle WebSocket message for chat."""
        
        # This would handle real-time chat messages
        # For now, just echo the message
        await websocket.send_text(json.dumps({
            "type": "chat_message",
            "data": message,
            "timestamp": datetime.utcnow().isoformat()
        }))
