# Mock data for testing without AWS
from datetime import datetime, timedelta
from typing import List, Dict, Any

def get_mock_users() -> List[Dict[str, Any]]:
    return [
        {
            "id": "user-1",
            "address": "ALGORAND_ADDRESS_1",
            "username": "fitness_lover",
            "email": "fitness@example.com",
            "created_at": datetime.now() - timedelta(days=30),
            "steps": 8500,
            "active_minutes": 45,
            "calories_burned": 320
        },
        {
            "id": "user-2", 
            "address": "ALGORAND_ADDRESS_2",
            "username": "challenge_master",
            "email": "master@example.com",
            "created_at": datetime.now() - timedelta(days=15),
            "steps": 12000,
            "active_minutes": 60,
            "calories_burned": 450
        },
        {
            "id": "user-3",
            "address": "ALGORAND_ADDRESS_3", 
            "username": "workout_warrior",
            "email": "warrior@example.com",
            "created_at": datetime.now() - timedelta(days=7),
            "steps": 15000,
            "active_minutes": 75,
            "calories_burned": 520
        }
    ]

def get_mock_challenges() -> List[Dict[str, Any]]:
    return [
        {
            "id": "challenge-1",
            "name": "30-Day Fitness Challenge",
            "description": "Complete daily workouts and stay active for 30 days. Perfect for beginners!",
            "stake_amount": 10000,  # 10 ALGO
            "max_participants": 20,
            "current_participants": 15,
            "start_date": datetime.now() - timedelta(days=5),
            "end_date": datetime.now() + timedelta(days=16),
            "status": "active",
            "pool_amount": 150000,  # 150 ALGO
            "creator_id": "user-1",
            "created_at": datetime.now() - timedelta(days=10),
            "contract_address": "MOCK_CONTRACT_1",
            "contract_id": 12345
        },
        {
            "id": "challenge-2",
            "name": "Marathon Training Challenge",
            "description": "Train for a marathon with daily running goals and strength training.",
            "stake_amount": 25000,  # 25 ALGO
            "max_participants": 10,
            "current_participants": 8,
            "start_date": datetime.now() + timedelta(days=3),
            "end_date": datetime.now() + timedelta(days=24),
            "status": "upcoming",
            "pool_amount": 200000,  # 200 ALGO
            "creator_id": "user-2",
            "created_at": datetime.now() - timedelta(days=5),
            "contract_address": "MOCK_CONTRACT_2",
            "contract_id": 12346
        },
        {
            "id": "challenge-3",
            "name": "Weight Loss Challenge",
            "description": "Lose weight through consistent exercise and healthy habits.",
            "stake_amount": 15000,  # 15 ALGO
            "max_participants": 15,
            "current_participants": 12,
            "start_date": datetime.now() - timedelta(days=20),
            "end_date": datetime.now() - timedelta(days=1),
            "status": "completed",
            "pool_amount": 180000,  # 180 ALGO
            "creator_id": "user-3",
            "created_at": datetime.now() - timedelta(days=25),
            "contract_address": "MOCK_CONTRACT_3",
            "contract_id": 12347
        }
    ]

def get_mock_participants() -> List[Dict[str, Any]]:
    return [
        {
            "id": "participant-1",
            "challenge_id": "challenge-1",
            "user_id": "user-1",
            "stake_amount": 10000,
            "joined_at": datetime.now() - timedelta(days=5),
            "is_active": True,
            "eliminated_at": None,
            "elimination_round": None,
            "final_rank": None,
            "participant_address": "ALGORAND_ADDRESS_1"
        },
        {
            "id": "participant-2",
            "challenge_id": "challenge-1",
            "user_id": "user-2",
            "stake_amount": 10000,
            "joined_at": datetime.now() - timedelta(days=4),
            "is_active": True,
            "eliminated_at": None,
            "elimination_round": None,
            "final_rank": None,
            "participant_address": "ALGORAND_ADDRESS_2"
        },
        {
            "id": "participant-3",
            "challenge_id": "challenge-1",
            "user_id": "user-3",
            "stake_amount": 10000,
            "joined_at": datetime.now() - timedelta(days=3),
            "is_active": False,
            "eliminated_at": datetime.now() - timedelta(days=1),
            "elimination_round": 1,
            "final_rank": None,
            "participant_address": "ALGORAND_ADDRESS_3"
        }
    ]

def get_mock_rankings() -> List[Dict[str, Any]]:
    return [
        {
            "id": "ranking-1",
            "challenge_id": "challenge-1",
            "week": 1,
            "eliminated_participant_id": "participant-3",
            "created_at": datetime.now() - timedelta(days=1),
            "participants": [
                {
                    "participant_id": "participant-1",
                    "tasks_completed": 5,
                    "tasks_missed": 0,
                    "rank": 1,
                    "points": 50.0
                },
                {
                    "participant_id": "participant-2", 
                    "tasks_completed": 4,
                    "tasks_missed": 1,
                    "rank": 2,
                    "points": 40.0
                },
                {
                    "participant_id": "participant-3",
                    "tasks_completed": 2,
                    "tasks_missed": 3,
                    "rank": 3,
                    "points": 20.0
                }
            ]
        }
    ]

def get_mock_chat_messages() -> List[Dict[str, Any]]:
    return [
        {
            "id": "msg-1",
            "challenge_id": "challenge-1",
            "user_id": "user-1",
            "username": "fitness_lover",
            "message": "Good morning everyone! Ready for today's workout? 💪",
            "timestamp": datetime.now() - timedelta(hours=2),
            "is_system_message": False
        },
        {
            "id": "msg-2",
            "challenge_id": "challenge-1",
            "user_id": "user-2",
            "username": "challenge_master",
            "message": "Let's crush it! I did 10k steps already today 🏃‍♂️",
            "timestamp": datetime.now() - timedelta(hours=1),
            "is_system_message": False
        },
        {
            "id": "msg-3",
            "challenge_id": "challenge-1",
            "user_id": None,
            "username": "System",
            "message": "workout_warrior has been eliminated from the challenge!",
            "timestamp": datetime.now() - timedelta(minutes=30),
            "is_system_message": True
        }
    ]

def get_mock_tasks() -> List[Dict[str, Any]]:
    return [
        {
            "id": "task-1",
            "challenge_id": "challenge-1",
            "title": "10,000 Steps Daily",
            "description": "Walk or run to achieve 10,000 steps every day",
            "points": 10,
            "due_date": datetime.now() + timedelta(days=1),
            "is_completed": False,
            "completed_by": None,
            "completed_at": None,
            "created_at": datetime.now() - timedelta(days=5)
        },
        {
            "id": "task-2",
            "challenge_id": "challenge-1",
            "title": "30 Minutes Cardio",
            "description": "Complete 30 minutes of cardio exercise",
            "points": 15,
            "due_date": datetime.now() + timedelta(days=1),
            "is_completed": True,
            "completed_by": "user-1",
            "completed_at": datetime.now() - timedelta(hours=2),
            "created_at": datetime.now() - timedelta(days=5)
        },
        {
            "id": "task-3",
            "challenge_id": "challenge-1",
            "title": "Strength Training",
            "description": "Complete a strength training workout",
            "points": 20,
            "due_date": datetime.now() + timedelta(days=1),
            "is_completed": False,
            "completed_by": None,
            "completed_at": None,
            "created_at": datetime.now() - timedelta(days=5)
        }
    ]
