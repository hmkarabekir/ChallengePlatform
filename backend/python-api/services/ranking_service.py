# Ranking service for managing weekly rankings and eliminations
from sqlalchemy.orm import Session
from sqlalchemy import and_, desc
from typing import List, Optional
from datetime import datetime, timedelta

from ..models import Challenge, ChallengeParticipant, WeeklyRanking, ParticipantRanking, TaskCompletion
from ..schemas import WeeklyRankingResponse, ParticipantRankingBase
from .contract_service import ContractService

class RankingService:
    def __init__(self):
        self.contract_service = ContractService()

    async def get_weekly_rankings(
        self, 
        challenge_id: str, 
        db: Session
    ) -> List[WeeklyRankingResponse]:
        """Get weekly rankings for a challenge."""
        
        rankings = db.query(WeeklyRanking).filter(
            WeeklyRanking.challenge_id == challenge_id
        ).order_by(WeeklyRanking.week).all()
        
        result = []
        for ranking in rankings:
            # Get participant rankings for this week
            participant_rankings = db.query(ParticipantRanking).filter(
                ParticipantRanking.ranking_id == ranking.id
            ).order_by(ParticipantRanking.rank).all()
            
            ranking_data = WeeklyRankingResponse.from_orm(ranking)
            ranking_data.participants = [
                ParticipantRankingBase.from_orm(pr) for pr in participant_rankings
            ]
            result.append(ranking_data)
        
        return result

    async def process_weekly_elimination(
        self, 
        challenge_id: str, 
        user: User, 
        db: Session
    ) -> dict:
        """Process weekly elimination (admin only)."""
        
        challenge = db.query(Challenge).filter(Challenge.id == challenge_id).first()
        
        if not challenge:
            raise ValueError("Challenge not found")
        
        if challenge.status != "active":
            raise ValueError("Challenge is not active")
        
        # Check if user is the creator (admin check)
        if challenge.creator_id != user.id:
            raise ValueError("Only challenge creator can process eliminations")
        
        # Check if it's time for weekly elimination
        now = datetime.utcnow()
        time_since_start = now - challenge.start_date
        current_week = time_since_start.days // 7
        
        if current_week <= 0:
            raise ValueError("Not time for elimination yet")
        
        # Get active participants
        participants = db.query(ChallengeParticipant).filter(
            and_(
                ChallengeParticipant.challenge_id == challenge_id,
                ChallengeParticipant.is_active == True
            )
        ).all()
        
        if len(participants) <= 1:
            raise ValueError("Not enough participants for elimination")
        
        # Calculate task completions for each participant
        participant_stats = []
        for participant in participants:
            # Count completed tasks in the current week
            week_start = challenge.start_date + timedelta(weeks=current_week-1)
            week_end = challenge.start_date + timedelta(weeks=current_week)
            
            completed_tasks = db.query(TaskCompletion).filter(
                and_(
                    TaskCompletion.user_id == participant.user_id,
                    TaskCompletion.completed_at >= week_start,
                    TaskCompletion.completed_at < week_end
                )
            ).count()
            
            participant_stats.append({
                "participant": participant,
                "tasks_completed": completed_tasks
            })
        
        # Find participant with lowest task completion
        lowest_performer = min(participant_stats, key=lambda x: x["tasks_completed"])
        eliminated_participant = lowest_performer["participant"]
        
        # Create weekly ranking record
        ranking = WeeklyRanking(
            challenge_id=challenge_id,
            week=current_week,
            eliminated_participant_id=eliminated_participant.id
        )
        
        db.add(ranking)
        db.flush()  # Get the ID
        
        # Create participant rankings
        sorted_participants = sorted(
            participant_stats, 
            key=lambda x: x["tasks_completed"], 
            reverse=True
        )
        
        for i, stat in enumerate(sorted_participants):
            participant_ranking = ParticipantRanking(
                ranking_id=ranking.id,
                participant_id=stat["participant"].id,
                tasks_completed=stat["tasks_completed"],
                tasks_missed=5 - stat["tasks_completed"],  # Assuming 5 tasks per week
                rank=i + 1,
                points=stat["tasks_completed"] * 10  # 10 points per task
            )
            db.add(participant_ranking)
        
        # Mark eliminated participant as inactive
        eliminated_participant.is_active = False
        eliminated_participant.eliminated_at = now
        eliminated_participant.elimination_round = current_week
        
        db.commit()
        
        # Call smart contract to process elimination
        try:
            await self.contract_service.process_weekly_elimination(
                contract_address=challenge.contract_address
            )
        except Exception as e:
            # Rollback database changes if contract call fails
            db.rollback()
            raise Exception(f"Failed to process elimination on smart contract: {str(e)}")
        
        return {
            "message": "Weekly elimination processed successfully",
            "eliminated_participant": {
                "id": eliminated_participant.id,
                "username": eliminated_participant.user.username,
                "tasks_completed": lowest_performer["tasks_completed"]
            },
            "week": current_week
        }

    async def process_due_eliminations(self, db: Session) -> List[dict]:
        """Process eliminations for all challenges that are due."""
        
        # Get all active challenges
        active_challenges = db.query(Challenge).filter(
            Challenge.status == "active"
        ).all()
        
        processed = []
        
        for challenge in active_challenges:
            try:
                # Check if elimination is due
                now = datetime.utcnow()
                time_since_start = now - challenge.start_date
                current_week = time_since_start.days // 7
                
                if current_week > 0:
                    # Check if we already processed this week
                    existing_ranking = db.query(WeeklyRanking).filter(
                        and_(
                            WeeklyRanking.challenge_id == challenge.id,
                            WeeklyRanking.week == current_week
                        )
                    ).first()
                    
                    if not existing_ranking:
                        # Process elimination for this challenge
                        result = await self.process_weekly_elimination(
                            challenge.id, 
                            challenge.creator, 
                            db
                        )
                        processed.append(result)
                        
            except Exception as e:
                print(f"Error processing elimination for challenge {challenge.id}: {e}")
                continue
        
        return processed

    async def get_participant_rankings(
        self, 
        challenge_id: str, 
        db: Session
    ) -> List[dict]:
        """Get current rankings for all participants in a challenge."""
        
        participants = db.query(ChallengeParticipant).filter(
            ChallengeParticipant.challenge_id == challenge_id
        ).all()
        
        # Calculate current stats for each participant
        rankings = []
        for participant in participants:
            # Count total completed tasks
            completed_tasks = db.query(TaskCompletion).filter(
                TaskCompletion.user_id == participant.user_id
            ).count()
            
            rankings.append({
                "participant_id": participant.id,
                "user_id": participant.user_id,
                "username": participant.user.username,
                "tasks_completed": completed_tasks,
                "is_active": participant.is_active,
                "eliminated_at": participant.eliminated_at,
                "final_rank": participant.final_rank
            })
        
        # Sort by tasks completed (descending)
        rankings.sort(key=lambda x: x["tasks_completed"], reverse=True)
        
        # Add rank numbers
        for i, ranking in enumerate(rankings):
            ranking["current_rank"] = i + 1
        
        return rankings

    async def handle_websocket_message(
        self, 
        websocket, 
        message: dict, 
        challenge_id: str
    ) -> None:
        """Handle WebSocket message for ranking updates."""
        
        # This would handle real-time ranking updates
        # For now, just echo the message
        await websocket.send_text(json.dumps({
            "type": "ranking_update",
            "data": message,
            "timestamp": datetime.utcnow().isoformat()
        }))
