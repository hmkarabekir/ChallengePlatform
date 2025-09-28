# Challenge service for managing challenges
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from typing import List, Optional
from datetime import datetime, timedelta
import uuid

from ..models import Challenge, ChallengeParticipant, User
from ..schemas import ChallengeCreate, ChallengeResponse, ChallengeParticipantCreate
from .contract_service import ContractService

class ChallengeService:
    def __init__(self):
        self.contract_service = ContractService()

    async def create_challenge(
        self, 
        challenge_data: ChallengeCreate, 
        creator: User, 
        db: Session
    ) -> ChallengeResponse:
        """Create a new challenge and deploy smart contract."""
        
        # Validate challenge data
        if challenge_data.start_date <= datetime.utcnow():
            raise ValueError("Start date must be in the future")
        
        if challenge_data.end_date <= challenge_data.start_date:
            raise ValueError("End date must be after start date")
        
        if challenge_data.stake_amount <= 0:
            raise ValueError("Stake amount must be positive")
        
        if challenge_data.max_participants <= 0:
            raise ValueError("Max participants must be positive")
        
        # Create challenge in database
        challenge = Challenge(
            name=challenge_data.name,
            description=challenge_data.description,
            stake_amount=challenge_data.stake_amount,
            max_participants=challenge_data.max_participants,
            start_date=challenge_data.start_date,
            end_date=challenge_data.end_date,
            status="upcoming",
            creator_id=creator.id,
            pool_amount=0
        )
        
        db.add(challenge)
        db.commit()
        db.refresh(challenge)
        
        # Deploy smart contract
        try:
            contract_info = await self.contract_service.deploy_challenge_contract(
                challenge_id=challenge.id,
                name=challenge.name,
                description=challenge.description,
                stake_amount=challenge.stake_amount,
                max_participants=challenge.max_participants,
                creator_address=creator.address
            )
            
            # Update challenge with contract info
            challenge.contract_address = contract_info["contract_address"]
            challenge.contract_id = contract_info["contract_id"]
            db.commit()
            
        except Exception as e:
            # If contract deployment fails, delete the challenge
            db.delete(challenge)
            db.commit()
            raise Exception(f"Failed to deploy smart contract: {str(e)}")
        
        return ChallengeResponse.from_orm(challenge)

    async def get_challenges(
        self, 
        status: Optional[str] = None,
        limit: int = 20,
        offset: int = 0,
        db: Session = None
    ) -> List[ChallengeResponse]:
        """Get challenges with optional filtering."""
        
        query = db.query(Challenge)
        
        if status:
            query = query.filter(Challenge.status == status)
        
        challenges = query.offset(offset).limit(limit).all()
        
        return [ChallengeResponse.from_orm(challenge) for challenge in challenges]

    async def get_challenge(self, challenge_id: str, db: Session) -> Optional[ChallengeResponse]:
        """Get challenge by ID."""
        
        challenge = db.query(Challenge).filter(Challenge.id == challenge_id).first()
        
        if not challenge:
            return None
        
        return ChallengeResponse.from_orm(challenge)

    async def join_challenge(
        self, 
        challenge_id: str, 
        user: User, 
        db: Session
    ) -> dict:
        """Join a challenge by staking the required amount."""
        
        challenge = db.query(Challenge).filter(Challenge.id == challenge_id).first()
        
        if not challenge:
            raise ValueError("Challenge not found")
        
        if challenge.status != "upcoming" and challenge.status != "active":
            raise ValueError("Challenge is not accepting participants")
        
        if challenge.current_participants >= challenge.max_participants:
            raise ValueError("Challenge is full")
        
        # Check if user is already participating
        existing_participant = db.query(ChallengeParticipant).filter(
            and_(
                ChallengeParticipant.challenge_id == challenge_id,
                ChallengeParticipant.user_id == user.id
            )
        ).first()
        
        if existing_participant:
            raise ValueError("User is already participating in this challenge")
        
        # Create participant record
        participant = ChallengeParticipant(
            challenge_id=challenge_id,
            user_id=user.id,
            stake_amount=challenge.stake_amount,
            participant_address=user.address,
            is_active=True
        )
        
        db.add(participant)
        
        # Update challenge participant count
        challenge.current_participants += 1
        challenge.pool_amount += challenge.stake_amount
        
        # If this is the first participant after creator, update status to active
        if challenge.status == "upcoming" and challenge.current_participants >= 2:
            challenge.status = "active"
        
        db.commit()
        
        # Call smart contract to join
        try:
            await self.contract_service.join_challenge(
                contract_address=challenge.contract_address,
                participant_address=user.address,
                stake_amount=challenge.stake_amount
            )
        except Exception as e:
            # Rollback database changes if contract call fails
            db.rollback()
            raise Exception(f"Failed to join challenge on smart contract: {str(e)}")
        
        return {
            "message": "Successfully joined challenge",
            "participant_id": participant.id,
            "stake_amount": challenge.stake_amount
        }

    async def leave_challenge(
        self, 
        challenge_id: str, 
        user: User, 
        db: Session
    ) -> dict:
        """Leave a challenge (forfeit stake)."""
        
        challenge = db.query(Challenge).filter(Challenge.id == challenge_id).first()
        
        if not challenge:
            raise ValueError("Challenge not found")
        
        participant = db.query(ChallengeParticipant).filter(
            and_(
                ChallengeParticipant.challenge_id == challenge_id,
                ChallengeParticipant.user_id == user.id,
                ChallengeParticipant.is_active == True
            )
        ).first()
        
        if not participant:
            raise ValueError("User is not participating in this challenge")
        
        # Mark participant as inactive
        participant.is_active = False
        participant.eliminated_at = datetime.utcnow()
        
        # Update challenge participant count
        challenge.current_participants -= 1
        
        db.commit()
        
        # Call smart contract to leave
        try:
            await self.contract_service.leave_challenge(
                contract_address=challenge.contract_address,
                participant_address=user.address
            )
        except Exception as e:
            # Rollback database changes if contract call fails
            db.rollback()
            raise Exception(f"Failed to leave challenge on smart contract: {str(e)}")
        
        return {
            "message": "Successfully left challenge",
            "stake_forfeited": participant.stake_amount
        }

    async def get_challenge_participants(
        self, 
        challenge_id: str, 
        db: Session
    ) -> List[dict]:
        """Get all participants for a challenge."""
        
        participants = db.query(ChallengeParticipant).filter(
            ChallengeParticipant.challenge_id == challenge_id
        ).all()
        
        return [
            {
                "id": p.id,
                "user_id": p.user_id,
                "stake_amount": p.stake_amount,
                "joined_at": p.joined_at,
                "is_active": p.is_active,
                "eliminated_at": p.eliminated_at,
                "final_rank": p.final_rank
            }
            for p in participants
        ]

    async def update_challenge_status(self, challenge_id: str, db: Session) -> None:
        """Update challenge status based on current time."""
        
        challenge = db.query(Challenge).filter(Challenge.id == challenge_id).first()
        
        if not challenge:
            return
        
        now = datetime.utcnow()
        
        if now < challenge.start_date:
            challenge.status = "upcoming"
        elif now >= challenge.start_date and now < challenge.end_date:
            challenge.status = "active"
        else:
            challenge.status = "completed"
        
        db.commit()

    async def distribute_pool(self, challenge_id: str, db: Session) -> dict:
        """Distribute pool to remaining participants based on final ranking."""
        
        challenge = db.query(Challenge).filter(Challenge.id == challenge_id).first()
        
        if not challenge:
            raise ValueError("Challenge not found")
        
        if challenge.status != "completed":
            raise ValueError("Challenge must be completed to distribute pool")
        
        # Get active participants sorted by tasks completed
        participants = db.query(ChallengeParticipant).filter(
            and_(
                ChallengeParticipant.challenge_id == challenge_id,
                ChallengeParticipant.is_active == True
            )
        ).all()
        
        # Sort by tasks completed (descending)
        participants.sort(key=lambda p: p.tasks_completed or 0, reverse=True)
        
        # Calculate distribution
        total_pool = challenge.pool_amount
        platform_fee = int(total_pool * 0.05)  # 5% platform fee
        distribution_pool = total_pool - platform_fee
        
        # Distribute based on ranking
        distributions = []
        for i, participant in enumerate(participants):
            rank = i + 1
            # Higher rank gets larger share
            rank_multiplier = len(participants) - i
            total_multiplier = sum(range(1, len(participants) + 1))
            
            share = int((distribution_pool * rank_multiplier) / total_multiplier)
            
            # Update participant's final rank
            participant.final_rank = rank
            
            distributions.append({
                "participant_id": participant.id,
                "rank": rank,
                "amount": share
            })
        
        db.commit()
        
        # Call smart contract to distribute
        try:
            await self.contract_service.distribute_pool(
                contract_address=challenge.contract_address,
                distributions=distributions
            )
        except Exception as e:
            raise Exception(f"Failed to distribute pool on smart contract: {str(e)}")
        
        return {
            "message": "Pool distributed successfully",
            "total_pool": total_pool,
            "platform_fee": platform_fee,
            "distributions": distributions
        }
