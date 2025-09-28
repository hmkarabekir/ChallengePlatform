# Smart contract types for challenge platform
from algopy import UInt64, arc4


class Challenge(arc4.Struct, frozen=True):
    """Challenge data structure stored on-chain."""
    challenge_id: arc4.UInt64
    name: arc4.String
    description: arc4.String
    stake_amount: arc4.UInt64
    max_participants: arc4.UInt64
    creator: arc4.Address
    start_time: arc4.UInt64
    end_time: arc4.UInt64
    total_staked: arc4.UInt64
    is_active: arc4.Bool
    current_week: arc4.UInt64


class Participant(arc4.Struct, frozen=True):
    """Participant data structure stored on-chain."""
    address: arc4.Address
    stake_amount: arc4.UInt64
    joined_at: arc4.UInt64
    is_active: arc4.Bool
    tasks_completed: arc4.UInt64
    current_rank: arc4.UInt64


class WeeklyRanking(arc4.Struct, frozen=True):
    """Weekly ranking data structure."""
    week: arc4.UInt64
    eliminated_participant: arc4.Address
    timestamp: arc4.UInt64


class TaskCompletion(arc4.Struct, frozen=True):
    """Task completion record."""
    participant_address: arc4.Address
    task_id: arc4.UInt64
    completed_at: arc4.UInt64
    proof_data: arc4.String  # Placeholder for health data verification


class PoolDistribution(arc4.Struct, frozen=True):
    """Pool distribution record."""
    participant_address: arc4.Address
    amount: arc4.UInt64
    rank: arc4.UInt64
    timestamp: arc4.UInt64


class ChatMessage(arc4.Struct, frozen=True):
    """Chat message in challenge room."""
    message_id: arc4.UInt64
    sender: arc4.Address
    content: arc4.String
    timestamp: arc4.UInt64
    is_system_message: arc4.Bool


class HealthData(arc4.Struct, frozen=True):
    """Health data verification for tasks."""
    participant_address: arc4.Address
    data_type: arc4.String  # "steps", "calories", "heart_rate", etc.
    value: arc4.UInt64
    timestamp: arc4.UInt64
    source: arc4.String  # "google_fit", "apple_health", "manual"
    verification_hash: arc4.String


class PlatformRevenue(arc4.Struct, frozen=True):
    """Platform revenue tracking."""
    total_fees_collected: arc4.UInt64
    interest_earned: arc4.UInt64
    last_updated: arc4.UInt64


class Task(arc4.Struct, frozen=True):
    """Task definition for challenges."""
    task_id: arc4.UInt64
    challenge_id: arc4.UInt64
    name: arc4.String
    description: arc4.String
    required_value: arc4.UInt64  # e.g., 10000 steps
    data_type: arc4.String  # "steps", "calories", "workout_duration"
    points: arc4.UInt64
    is_active: arc4.Bool
