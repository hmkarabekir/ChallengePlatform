# Challenge Platform Smart Contract
# Based on Algorand digital marketplace template, modified for challenge staking and pool distribution

from algopy import (
    ARC4Contract,
    BoxMap,
    Global,
    Txn,
    UInt64,
    arc4,
    gtxn,
    itxn,
)
from algopy.arc4 import abimethod 

from .smart_contracts.challenge_platform.errors import (
    CHALLENGE_ALREADY_EXISTS,
    CHALLENGE_NOT_ACTIVE,
    CHALLENGE_STILL_ACTIVE,
    CHALLENGE_NOT_ENDED,
    CHALLENGE_FULL,
    ALREADY_PARTICIPATING,
    NOT_PARTICIPATING,
    INSUFFICIENT_PARTICIPANTS,
    DIFFERENT_SENDER,
    WRONG_RECEIVER,
    INSUFFICIENT_STAKE,
    UNAUTHORIZED,
    NOT_TIME_FOR_ELIMINATION,
)
from .contract_types import (
    Challenge,
    Participant,
    WeeklyRanking,
    TaskCompletion,
    PoolDistribution,
    ChatMessage,
    HealthData,
    PlatformRevenue,
    Task,
)


class ChallengePlatform(ARC4Contract):
    """
    Smart contract for managing fitness challenges with staking, weekly eliminations,
    and pool distribution based on the digital marketplace template.
    """
    
    def __init__(self) -> None:
        # Staking pool management (similar to digital marketplace deposits)
        self.deposited = BoxMap(arc4.Address, arc4.UInt64)
        
        # Challenge state management
        self.challenges = BoxMap(arc4.UInt64, Challenge)  # challenge_id -> Challenge
        self.participants = BoxMap(arc4.UInt64, arc4.DynamicArray[Participant])  # challenge_id -> participants
        self.weekly_rankings = BoxMap(arc4.UInt64, arc4.DynamicArray[WeeklyRanking])  # challenge_id -> rankings
        self.task_completions = BoxMap(arc4.UInt64, arc4.DynamicArray[TaskCompletion])  # challenge_id -> completions
        
        # Chat system - each challenge has its own chat
        self.chat_messages = BoxMap(arc4.UInt64, arc4.DynamicArray[ChatMessage])  # challenge_id -> messages
        self.message_counters = BoxMap(arc4.UInt64, arc4.UInt64)  # challenge_id -> next_message_id
        
        # Health data verification
        self.health_data = BoxMap(arc4.UInt64, arc4.DynamicArray[HealthData])  # challenge_id -> health_data
        self.tasks = BoxMap(arc4.UInt64, arc4.DynamicArray[Task])  # challenge_id -> tasks
        
        # Platform revenue tracking
        self.platform_revenue = PlatformRevenue(
            total_fees_collected=arc4.UInt64(0),
            interest_earned=arc4.UInt64(0),
            last_updated=arc4.UInt64(0)
        )
        
        # Platform configuration
        self.platform_fee_percentage = arc4.UInt64(500)  # 5% platform fee (500/10000)
        self.interest_rate = arc4.UInt64(100)  # 1% daily interest (100/10000)
        self.week_duration = arc4.UInt64(604800)  # 7 days in seconds
        self.challenge_duration = arc4.UInt64(1814400)  # 21 days in seconds

    @abimethod
    def create_challenge(
        self,
        challenge_id: arc4.UInt64,
        name: arc4.String,
        description: arc4.String,
        stake_amount: arc4.UInt64,
        max_participants: arc4.UInt64,
        payment: gtxn.PaymentTransaction
    ) -> None:
        """Create a new challenge and stake initial amount for creator."""
        assert payment.sender == Txn.sender, DIFFERENT_SENDER
        assert payment.receiver == Global.current_application_address, WRONG_RECEIVER
        assert payment.amount >= stake_amount.native, INSUFFICIENT_STAKE
        assert challenge_id not in self.challenges, CHALLENGE_ALREADY_EXISTS
        
        # Calculate platform fee
        platform_fee = (stake_amount.native * self.platform_fee_percentage.native) // 10000
        net_stake = stake_amount.native - platform_fee
        
        # Update platform revenue
        self.platform_revenue = PlatformRevenue(
            total_fees_collected=arc4.UInt64(self.platform_revenue.total_fees_collected.native + platform_fee),
            interest_earned=self.platform_revenue.interest_earned,
            last_updated=self.platform_revenue.last_updated
        )
        
        # Create challenge
        challenge = Challenge(
            challenge_id=challenge_id,
            name=name,
            description=description,
            stake_amount=stake_amount,
            max_participants=max_participants,
            creator=arc4.Address(Txn.sender),
            start_time=arc4.UInt64(Global.latest_timestamp()),
            end_time=arc4.UInt64(Global.latest_timestamp() + self.challenge_duration.native),
            total_staked=arc4.UInt64(net_stake),
            is_active=arc4.Bool(True),
            current_week=arc4.UInt64(0)
        )
        
        # Store challenge
        mbr_baseline = Global.current_application_address.min_balance
        self.challenges[challenge_id] = challenge
        
        # Add creator as first participant
        creator_participant = Participant(
            address=arc4.Address(Txn.sender),
            stake_amount=arc4.UInt64(net_stake),
            joined_at=arc4.UInt64(Global.latest_timestamp()),
            is_active=arc4.Bool(True),
            tasks_completed=arc4.UInt64(0),
            current_rank=arc4.UInt64(1)
        )
        self.participants[challenge_id] = arc4.DynamicArray(creator_participant)
        
        # Update deposited amount (similar to digital marketplace)
        mbr_diff = Global.current_application_address.min_balance - mbr_baseline
        self.deposited[arc4.Address(Txn.sender)] = arc4.UInt64(
            self.deposited.get(arc4.Address(Txn.sender), default=arc4.UInt64(0)).native + net_stake - mbr_diff
        )

    @abimethod
    def join_challenge(
        self,
        challenge_id: arc4.UInt64,
        payment: gtxn.PaymentTransaction
    ) -> None:
        """Join an existing challenge by staking the required amount."""
        assert payment.sender == Txn.sender, DIFFERENT_SENDER
        assert payment.receiver == Global.current_application_address, WRONG_RECEIVER
        
        challenge = self.challenges[challenge_id]
        assert challenge.is_active, CHALLENGE_NOT_ACTIVE
        assert Global.latest_timestamp() < challenge.end_time.native, "Challenge ended"
        
        # Check if user already participating
        participants = self.participants[challenge_id]
        for participant in participants:
            assert participant.address.native != Txn.sender, ALREADY_PARTICIPATING
        
        # Check max participants
        assert len(participants) < challenge.max_participants.native, CHALLENGE_FULL
        
        # Verify stake amount
        assert payment.amount >= challenge.stake_amount.native, INSUFFICIENT_STAKE
        
        # Calculate platform fee
        platform_fee = (challenge.stake_amount.native * self.platform_fee_percentage.native) // 10000
        net_stake = challenge.stake_amount.native - platform_fee
        
        # Update platform revenue
        self.platform_revenue = PlatformRevenue(
            total_fees_collected=arc4.UInt64(self.platform_revenue.total_fees_collected.native + platform_fee),
            interest_earned=self.platform_revenue.interest_earned,
            last_updated=self.platform_revenue.last_updated
        )
        
        # Add participant
        new_participant = Participant(
            address=arc4.Address(Txn.sender),
            stake_amount=arc4.UInt64(net_stake),
            joined_at=arc4.UInt64(Global.latest_timestamp()),
            is_active=arc4.Bool(True),
            tasks_completed=arc4.UInt64(0),
            current_rank=arc4.UInt64(len(participants) + 1)
        )
        
        # Update challenge and participants
        mbr_baseline = Global.current_application_address.min_balance
        self.participants[challenge_id] = participants.append(new_participant)
        self.challenges[challenge_id] = Challenge(
            challenge_id=challenge.challenge_id,
            name=challenge.name,
            description=challenge.description,
            stake_amount=challenge.stake_amount,
            max_participants=challenge.max_participants,
            creator=challenge.creator,
            start_time=challenge.start_time,
            end_time=challenge.end_time,
            total_staked=arc4.UInt64(challenge.total_staked.native + net_stake),
            is_active=challenge.is_active,
            current_week=challenge.current_week
        )
        
        # Update deposited amount
        mbr_diff = Global.current_application_address.min_balance - mbr_baseline
        self.deposited[arc4.Address(Txn.sender)] = arc4.UInt64(
            self.deposited.get(arc4.Address(Txn.sender), default=arc4.UInt64(0)).native + net_stake - mbr_diff
        )

    @abimethod
    def leave_challenge(self, challenge_id: arc4.UInt64) -> None:
        """Leave challenge early - forfeit stake (coins remain in pool)."""
        challenge = self.challenges[challenge_id]
        assert challenge.is_active, CHALLENGE_NOT_ACTIVE
        
        # Find participant
        participants = self.participants[challenge_id]
        participant_index = -1
        for i, participant in enumerate(participants):
            if participant.address.native == Txn.sender:
                participant_index = i
                break
        
        assert participant_index >= 0, NOT_PARTICIPATING
        
        # Mark as inactive (stake remains in pool)
        updated_participant = Participant(
            address=participants[participant_index].address,
            stake_amount=participants[participant_index].stake_amount,
            joined_at=participants[participant_index].joined_at,
            is_active=arc4.Bool(False),
            tasks_completed=participants[participant_index].tasks_completed,
            current_rank=participants[participant_index].current_rank
        )
        self.participants[challenge_id] = participants.replace(participant_index, updated_participant)
        
        # Update challenge total_staked (stake remains in pool)
        self.challenges[challenge_id] = Challenge(
            challenge_id=challenge.challenge_id,
            name=challenge.name,
            description=challenge.description,
            stake_amount=challenge.stake_amount,
            max_participants=challenge.max_participants,
            creator=challenge.creator,
            start_time=challenge.start_time,
            end_time=challenge.end_time,
            total_staked=challenge.total_staked,  # Stake remains in pool
            is_active=challenge.is_active,
            current_week=challenge.current_week
        )

    @abimethod
    def complete_task(
        self,
        challenge_id: arc4.UInt64,
        task_id: arc4.UInt64,
        proof_data: arc4.String  # Placeholder for health data verification
    ) -> None:
        """Record task completion for a participant."""
        challenge = self.challenges[challenge_id]
        assert challenge.is_active, CHALLENGE_NOT_ACTIVE
        
        # Find participant
        participants = self.participants[challenge_id]
        participant_index = -1
        for i, participant in enumerate(participants):
            if participant.address.native == Txn.sender and participant.is_active:
                participant_index = i
                break
        
        assert participant_index >= 0, NOT_PARTICIPATING
        
        # Update task completion
        task_completion = TaskCompletion(
            participant_address=arc4.Address(Txn.sender),
            task_id=task_id,
            completed_at=arc4.UInt64(Global.latest_timestamp()),
            proof_data=proof_data
        )
        
        mbr_baseline = Global.current_application_address.min_balance
        completions = self.task_completions.get(challenge_id, default=arc4.DynamicArray[TaskCompletion]())
        self.task_completions[challenge_id] = completions.append(task_completion)
        
        # Update participant's task count
        updated_participant = Participant(
            address=participants[participant_index].address,
            stake_amount=participants[participant_index].stake_amount,
            joined_at=participants[participant_index].joined_at,
            is_active=participants[participant_index].is_active,
            tasks_completed=arc4.UInt64(participants[participant_index].tasks_completed.native + 1),
            current_rank=participants[participant_index].current_rank
        )
        self.participants[challenge_id] = participants.replace(participant_index, updated_participant)
        
        mbr_diff = Global.current_application_address.min_balance - mbr_baseline
        self.deposited[arc4.Address(Txn.sender)] = arc4.UInt64(
            self.deposited.get(arc4.Address(Txn.sender), default=arc4.UInt64(0)).native - mbr_diff
        )

    @abimethod
    def process_weekly_elimination(self, challenge_id: arc4.UInt64) -> None:
        """Process weekly elimination - eliminate lowest performer."""
        challenge = self.challenges[challenge_id]
        assert challenge.is_active, CHALLENGE_NOT_ACTIVE
        
        # Check if it's time for weekly elimination (every 7 days)
        current_time = Global.latest_timestamp()
        time_since_start = current_time - challenge.start_time.native
        expected_week = time_since_start // self.week_duration.native
        
        assert expected_week > challenge.current_week.native, NOT_TIME_FOR_ELIMINATION
        
        participants = self.participants[challenge_id]
        active_participants = [p for p in participants if p.is_active]
        
        # Need at least 2 participants to eliminate one
        assert len(active_participants) > 1, INSUFFICIENT_PARTICIPANTS
        
        # Find participant with lowest task completion
        lowest_performer = min(active_participants, key=lambda p: p.tasks_completed.native)
        
        # Mark as eliminated
        for i, participant in enumerate(participants):
            if participant.address.native == lowest_performer.address.native:
                eliminated_participant = Participant(
                    address=participant.address,
                    stake_amount=participant.stake_amount,
                    joined_at=participant.joined_at,
                    is_active=arc4.Bool(False),
                    tasks_completed=participant.tasks_completed,
                    current_rank=participant.current_rank
                )
                self.participants[challenge_id] = participants.replace(i, eliminated_participant)
                break
        
        # Create weekly ranking
        ranking = WeeklyRanking(
            week=arc4.UInt64(expected_week),
            eliminated_participant=lowest_performer.address,
            timestamp=arc4.UInt64(current_time)
        )
        
        rankings = self.weekly_rankings.get(challenge_id, default=arc4.DynamicArray[WeeklyRanking]())
        self.weekly_rankings[challenge_id] = rankings.append(ranking)
        
        # Update challenge week
        self.challenges[challenge_id] = Challenge(
            challenge_id=challenge.challenge_id,
            name=challenge.name,
            description=challenge.description,
            stake_amount=challenge.stake_amount,
            max_participants=challenge.max_participants,
            creator=challenge.creator,
            start_time=challenge.start_time,
            end_time=challenge.end_time,
            total_staked=challenge.total_staked,
            is_active=challenge.is_active,
            current_week=arc4.UInt64(expected_week)
        )
        
        # Check if challenge should end (21 days completed)
        if current_time >= challenge.end_time.native:
            self.challenges[challenge_id] = Challenge(
                challenge_id=challenge.challenge_id,
                name=challenge.name,
                description=challenge.description,
                stake_amount=challenge.stake_amount,
                max_participants=challenge.max_participants,
                creator=challenge.creator,
                start_time=challenge.start_time,
                end_time=challenge.end_time,
                total_staked=challenge.total_staked,
                is_active=arc4.Bool(False),
                current_week=challenge.current_week
            )

    @abimethod
    def distribute_pool(self, challenge_id: arc4.UInt64) -> None:
        """Distribute pool to remaining participants based on final ranking."""
        challenge = self.challenges[challenge_id]
        assert not challenge.is_active, CHALLENGE_STILL_ACTIVE  # Should be closed
        assert Global.latest_timestamp() >= challenge.end_time.native, "Challenge not ended"
        
        participants = self.participants[challenge_id]
        active_participants = [p for p in participants if p.is_active]
        
        # Sort by tasks completed (descending) for final ranking
        sorted_participants = sorted(active_participants, key=lambda p: p.tasks_completed.native, reverse=True)
        
        # Calculate distribution based on ranking
        total_pool = challenge.total_staked.native
        platform_fee = (total_pool * self.platform_fee_percentage.native) // 10000
        distribution_pool = total_pool - platform_fee
        
        # Update platform revenue
        self.platform_revenue = PlatformRevenue(
            total_fees_collected=arc4.UInt64(self.platform_revenue.total_fees_collected.native + platform_fee),
            interest_earned=self.platform_revenue.interest_earned,
            last_updated=self.platform_revenue.last_updated
        )
        
        # Distribute based on ranking (winner gets more)
        # Use atomic transaction group for all payments
        if len(sorted_participants) > 0:
            total_multiplier = sum(range(1, len(sorted_participants) + 1))
            
            # Create payment transactions
            for i, participant in enumerate(sorted_participants):
                rank_multiplier = len(sorted_participants) - i
                share = (distribution_pool * rank_multiplier) // total_multiplier
                
                if share > 0:
                    itxn.Payment(
                        receiver=participant.address.native,
                        amount=share
                    ).submit()
                    
                    # Update deposited amounts
                    self.deposited[participant.address] = arc4.UInt64(
                        self.deposited.get(participant.address, default=arc4.UInt64(0)).native - share
                    )

    @abimethod(readonly=True)
    def get_challenge_info(self, challenge_id: arc4.UInt64) -> Challenge:
        """Get challenge information."""
        return self.challenges[challenge_id]

    @abimethod(readonly=True)
    def get_participants(self, challenge_id: arc4.UInt64) -> arc4.DynamicArray[Participant]:
        """Get all participants for a challenge."""
        return self.participants[challenge_id]

    @abimethod(readonly=True)
    def get_weekly_rankings(self, challenge_id: arc4.UInt64) -> arc4.DynamicArray[WeeklyRanking]:
        """Get weekly rankings for a challenge."""
        return self.weekly_rankings[challenge_id]

    @abimethod(readonly=True)
    def get_participant_stake(self, participant_address: arc4.Address) -> arc4.UInt64:
        """Get participant's deposited amount."""
        return self.deposited.get(participant_address, default=arc4.UInt64(0))

    # ===== CHAT SYSTEM =====
    
    @abimethod
    def send_chat_message(
        self,
        challenge_id: arc4.UInt64,
        content: arc4.String
    ) -> None:
        """Send a message to challenge chat room."""
        challenge = self.challenges[challenge_id]
        assert challenge.is_active, CHALLENGE_NOT_ACTIVE
        
        # Check if user is participating
        participants = self.participants[challenge_id]
        is_participant = False
        for participant in participants:
            if participant.address.native == Txn.sender and participant.is_active:
                is_participant = True
                break
        
        assert is_participant, NOT_PARTICIPATING
        
        # Create message
        message_id = self.message_counters.get(challenge_id, default=arc4.UInt64(0))
        message = ChatMessage(
            message_id=message_id,
            sender=arc4.Address(Txn.sender),
            content=content,
            timestamp=arc4.UInt64(Global.latest_timestamp()),
            is_system_message=arc4.Bool(False)
        )
        
        # Store message
        mbr_baseline = Global.current_application_address.min_balance
        messages = self.chat_messages.get(challenge_id, default=arc4.DynamicArray[ChatMessage]())
        self.chat_messages[challenge_id] = messages.append(message)
        self.message_counters[challenge_id] = message_id + arc4.UInt64(1)
        
        mbr_diff = Global.current_application_address.min_balance - mbr_baseline
        self.deposited[arc4.Address(Txn.sender)] = arc4.UInt64(
            self.deposited.get(arc4.Address(Txn.sender), default=arc4.UInt64(0)).native - mbr_diff
        )

    @abimethod(readonly=True)
    def get_chat_messages(self, challenge_id: arc4.UInt64) -> arc4.DynamicArray[ChatMessage]:
        """Get all chat messages for a challenge."""
        return self.chat_messages.get(challenge_id, default=arc4.DynamicArray[ChatMessage]())

    # ===== HEALTH DATA VERIFICATION =====
    
    @abimethod
    def submit_health_data(
        self,
        challenge_id: arc4.UInt64,
        data_type: arc4.String,
        value: arc4.UInt64,
        source: arc4.String,
        verification_hash: arc4.String
    ) -> None:
        """Submit health data for verification."""
        challenge = self.challenges[challenge_id]
        assert challenge.is_active, CHALLENGE_NOT_ACTIVE
        
        # Check if user is participating
        participants = self.participants[challenge_id]
        is_participant = False
        for participant in participants:
            if participant.address.native == Txn.sender and participant.is_active:
                is_participant = True
                break
        
        assert is_participant, NOT_PARTICIPATING
        
        # Create health data record
        health_record = HealthData(
            participant_address=arc4.Address(Txn.sender),
            data_type=data_type,
            value=value,
            timestamp=arc4.UInt64(Global.latest_timestamp()),
            source=source,
            verification_hash=verification_hash
        )
        
        # Store health data
        mbr_baseline = Global.current_application_address.min_balance
        health_data = self.health_data.get(challenge_id, default=arc4.DynamicArray[HealthData]())
        self.health_data[challenge_id] = health_data.append(health_record)
        
        mbr_diff = Global.current_application_address.min_balance - mbr_baseline
        self.deposited[arc4.Address(Txn.sender)] = arc4.UInt64(
            self.deposited.get(arc4.Address(Txn.sender), default=arc4.UInt64(0)).native - mbr_diff
        )

    @abimethod(readonly=True)
    def get_health_data(self, challenge_id: arc4.UInt64) -> arc4.DynamicArray[HealthData]:
        """Get health data for a challenge."""
        return self.health_data.get(challenge_id, default=arc4.DynamicArray[HealthData]())

    # ===== TASK MANAGEMENT =====
    
    @abimethod
    def create_task(
        self,
        challenge_id: arc4.UInt64,
        task_name: arc4.String,
        task_description: arc4.String,
        required_value: arc4.UInt64,
        data_type: arc4.String,
        points: arc4.UInt64
    ) -> None:
        """Create a new task for a challenge (only creator can do this)."""
        challenge = self.challenges[challenge_id]
        assert challenge.creator.native == Txn.sender, UNAUTHORIZED
        assert challenge.is_active, CHALLENGE_NOT_ACTIVE
        
        # Create task
        task_id = arc4.UInt64(len(self.tasks.get(challenge_id, default=arc4.DynamicArray[Task]())))
        task = Task(
            task_id=task_id,
            challenge_id=challenge_id,
            name=task_name,
            description=task_description,
            required_value=required_value,
            data_type=data_type,
            points=points,
            is_active=arc4.Bool(True)
        )
        
        # Store task
        mbr_baseline = Global.current_application_address.min_balance
        tasks = self.tasks.get(challenge_id, default=arc4.DynamicArray[Task]())
        self.tasks[challenge_id] = tasks.append(task)
        
        mbr_diff = Global.current_application_address.min_balance - mbr_baseline
        self.deposited[arc4.Address(Txn.sender)] = arc4.UInt64(
            self.deposited.get(arc4.Address(Txn.sender), default=arc4.UInt64(0)).native - mbr_diff
        )

    @abimethod(readonly=True)
    def get_tasks(self, challenge_id: arc4.UInt64) -> arc4.DynamicArray[Task]:
        """Get all tasks for a challenge."""
        return self.tasks.get(challenge_id, default=arc4.DynamicArray[Task]())

    # ===== PLATFORM REVENUE =====
    
    @abimethod
    def calculate_platform_revenue(self) -> None:
        """Calculate platform revenue from interest on staked funds."""
        current_time = Global.latest_timestamp()
        last_update = self.platform_revenue.last_updated.native
        
        if last_update == 0:
            self.platform_revenue = PlatformRevenue(
                total_fees_collected=self.platform_revenue.total_fees_collected,
                interest_earned=self.platform_revenue.interest_earned,
                last_updated=arc4.UInt64(current_time)
            )
            return
        
        # Calculate interest for all active challenges
        total_staked = UInt64(0)
        for challenge_id in self.challenges:
            challenge = self.challenges[challenge_id]
            if challenge.is_active:
                total_staked += challenge.total_staked.native
        
        # Calculate daily interest
        days_elapsed = (current_time - last_update) // 86400  # 86400 seconds = 1 day
        if days_elapsed > 0:
            daily_interest = (total_staked * self.interest_rate.native * days_elapsed) // 10000
            self.platform_revenue = PlatformRevenue(
                total_fees_collected=self.platform_revenue.total_fees_collected,
                interest_earned=arc4.UInt64(self.platform_revenue.interest_earned.native + daily_interest),
                last_updated=arc4.UInt64(current_time)
            )

    @abimethod(readonly=True)
    def get_platform_revenue(self) -> PlatformRevenue:
        """Get platform revenue information."""
        return self.platform_revenue

    @abimethod
    def withdraw_platform_revenue(self) -> None:
        """Withdraw platform revenue (only platform owner)."""
        # Only creator can withdraw
        assert Txn.sender == Global.creator_address, UNAUTHORIZED
        
        total_revenue = self.platform_revenue.total_fees_collected.native + self.platform_revenue.interest_earned.native
        
        if total_revenue > 0:
            itxn.Payment(
                receiver=Global.creator_address,
                amount=total_revenue
            ).submit()
            
            self.platform_revenue = PlatformRevenue(
                total_fees_collected=arc4.UInt64(0),
                interest_earned=arc4.UInt64(0),
                last_updated=arc4.UInt64(Global.latest_timestamp())
            )
