# Task service for managing challenge tasks
from sqlalchemy.orm import Session
from sqlalchemy import and_, desc
from typing import List, Optional
from datetime import datetime

from ..models import Task, TaskCompletion, ChallengeParticipant
from ..schemas import TaskCreate, TaskResponse

class TaskService:
    async def get_tasks(
        self, 
        challenge_id: str, 
        db: Session
    ) -> List[TaskResponse]:
        """Get tasks for a challenge."""
        
        tasks = db.query(Task).filter(
            Task.challenge_id == challenge_id
        ).order_by(desc(Task.created_at)).all()
        
        return [TaskResponse.from_orm(task) for task in tasks]

    async def create_task(
        self, 
        challenge_id: str, 
        task_data: TaskCreate, 
        user: User, 
        db: Session
    ) -> TaskResponse:
        """Create a new task for a challenge."""
        
        # Check if user is the challenge creator
        challenge = db.query(Challenge).filter(Challenge.id == challenge_id).first()
        
        if not challenge:
            raise ValueError("Challenge not found")
        
        if challenge.creator_id != user.id:
            raise ValueError("Only challenge creator can create tasks")
        
        # Create task
        task = Task(
            challenge_id=challenge_id,
            title=task_data.title,
            description=task_data.description,
            points=task_data.points,
            due_date=task_data.due_date
        )
        
        db.add(task)
        db.commit()
        db.refresh(task)
        
        return TaskResponse.from_orm(task)

    async def complete_task(
        self, 
        task_id: str, 
        user: User, 
        db: Session
    ) -> dict:
        """Mark a task as completed."""
        
        task = db.query(Task).filter(Task.id == task_id).first()
        
        if not task:
            raise ValueError("Task not found")
        
        # Check if user is participating in the challenge
        participant = db.query(ChallengeParticipant).filter(
            and_(
                ChallengeParticipant.challenge_id == task.challenge_id,
                ChallengeParticipant.user_id == user.id,
                ChallengeParticipant.is_active == True
            )
        ).first()
        
        if not participant:
            raise ValueError("User is not participating in this challenge")
        
        # Check if task is already completed
        if task.is_completed:
            raise ValueError("Task is already completed")
        
        # Check if task is past due date
        if task.due_date and datetime.utcnow() > task.due_date:
            raise ValueError("Task is past due date")
        
        # Mark task as completed
        task.is_completed = True
        task.completed_by = user.id
        task.completed_at = datetime.utcnow()
        
        # Create task completion record
        completion = TaskCompletion(
            task_id=task_id,
            user_id=user.id,
            proof_data="placeholder"  # Placeholder for health data verification
        )
        
        db.add(completion)
        db.commit()
        
        # Update participant's task count
        participant.tasks_completed = (participant.tasks_completed or 0) + 1
        
        db.commit()
        
        # Call smart contract to record completion
        try:
            await self.contract_service.complete_task(
                contract_address=task.challenge.contract_address,
                participant_address=user.address,
                task_id=task_id,
                proof_data="placeholder"
            )
        except Exception as e:
            # Rollback database changes if contract call fails
            db.rollback()
            raise Exception(f"Failed to record task completion on smart contract: {str(e)}")
        
        return {
            "message": "Task completed successfully",
            "task_id": task_id,
            "points": task.points
        }

    async def get_user_tasks(
        self, 
        challenge_id: str, 
        user_id: str, 
        db: Session
    ) -> List[TaskResponse]:
        """Get tasks for a specific user in a challenge."""
        
        # Get all tasks for the challenge
        tasks = db.query(Task).filter(
            Task.challenge_id == challenge_id
        ).all()
        
        # Filter tasks that the user can complete
        user_tasks = []
        for task in tasks:
            # Check if user has already completed this task
            completion = db.query(TaskCompletion).filter(
                and_(
                    TaskCompletion.task_id == task.id,
                    TaskCompletion.user_id == user_id
                )
            ).first()
            
            if not completion:
                user_tasks.append(TaskResponse.from_orm(task))
        
        return user_tasks

    async def get_completed_tasks(
        self, 
        challenge_id: str, 
        user_id: str, 
        db: Session
    ) -> List[TaskResponse]:
        """Get completed tasks for a specific user in a challenge."""
        
        # Get all completed tasks for the user
        completions = db.query(TaskCompletion).join(Task).filter(
            and_(
                Task.challenge_id == challenge_id,
                TaskCompletion.user_id == user_id
            )
        ).all()
        
        tasks = [completion.task for completion in completions]
        return [TaskResponse.from_orm(task) for task in tasks]
