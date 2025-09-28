// Challenge Platform TypeScript Types

export interface Challenge {
  id: string;
  name: string;
  description: string;
  entryFee: number;
  startTime: number;
  endTime: number;
  maxParticipants: number;
  currentParticipants: number;
  isActive: boolean;
  creator: string;
  currentWeek: number;
  week1Pool: number;
  week2Pool: number;
  week3Pool: number;
  createdAt: number;
}

export interface Participant {
  address: string;
  isParticipant: boolean;
  week1Points: number;
  week2Points: number;
  week3Points: number;
  totalPoints: number;
  isEliminated: boolean;
  eliminationWeek: number;
  lastTaskTime: number;
  rank: number;
}

export interface Task {
  id: string;
  challengeId: string;
  name: string;
  description: string;
  points: number;
  week: number;
  isCompleted: boolean;
  completedAt?: number;
}

export interface WeeklyRanking {
  week: number;
  participants: Participant[];
  eliminatedParticipant?: string;
  poolAmount: number;
  rewards: {
    first: number;
    second: number;
    third: number;
  };
}

export interface TaskCompletion {
  taskId: string;
  participantAddress: string;
  pointsEarned: number;
  week: number;
  completedAt: number;
  txnId: string;
}

export interface PoolDistribution {
  week: number;
  totalPool: number;
  penalty: number;
  rewards: {
    first: number;
    second: number;
    third: number;
  };
  distributed: boolean;
  txnId?: string;
}

export interface ChatMessage {
  id: string;
  challengeId: string;
  sender: string;
  message: string;
  timestamp: number;
  isSystem: boolean;
}

export interface HealthData {
  participantAddress: string;
  challengeId: string;
  week: number;
  steps: number;
  calories: number;
  sleepHours: number;
  waterIntake: number;
  timestamp: number;
}

export interface PlatformRevenue {
  totalChallenges: number;
  totalParticipants: number;
  totalRevenue: number;
  platformFee: number;
  creatorRevenue: number;
  participantRewards: number;
}

// API Request/Response Types
export interface CreateChallengeRequest {
  name: string;
  description: string;
  entryFee: number;
  startTime: number;
  maxParticipants: number;
}

export interface CreateChallengeResponse {
  success: boolean;
  challengeId: string;
  txnId: string;
  message?: string;
}

export interface JoinChallengeRequest {
  challengeId: string;
  participantAddress: string;
  privateKey: string;
}

export interface JoinChallengeResponse {
  success: boolean;
  txnId: string;
  participantState: Participant;
  message?: string;
}

export interface CompleteTaskRequest {
  challengeId: string;
  taskId: string;
  participantAddress: string;
  privateKey: string;
  pointsEarned: number;
  week: number;
}

export interface CompleteTaskResponse {
  success: boolean;
  txnId: string;
  newPoints: number;
  totalPoints: number;
  message?: string;
}

export interface WeeklyEliminationRequest {
  challengeId: string;
  week: number;
  eliminatedParticipant: string;
  creatorPrivateKey: string;
}

export interface WeeklyEliminationResponse {
  success: boolean;
  txnId: string;
  message?: string;
}

export interface DistributeRewardsRequest {
  challengeId: string;
  week: number;
  winner1: string;
  winner2: string;
  winner3: string;
  creatorPrivateKey: string;
}

export interface DistributeRewardsResponse {
  success: boolean;
  txnId: string;
  rewards: {
    first: number;
    second: number;
    third: number;
  };
  message?: string;
}

// Error Types
export interface ApiError {
  success: false;
  error: string;
  code?: string;
  details?: any;
}

// Utility Types
export type ChallengeStatus = 'upcoming' | 'active' | 'completed' | 'cancelled';
export type ParticipantStatus = 'active' | 'eliminated' | 'winner';
export type TaskStatus = 'pending' | 'completed' | 'expired';

// Constants
export const CHALLENGE_DURATION_WEEKS = 3;
export const MAX_PARTICIPANTS = 30;
export const MIN_PARTICIPANTS = 10;
export const ELIMINATION_PENALTY_PERCENTAGE = 30;
export const REWARD_DISTRIBUTION = {
  FIRST_PLACE: 40,
  SECOND_PLACE: 30,
  THIRD_PLACE: 30
};

export const TASK_CATEGORIES = {
  FITNESS: 'fitness',
  NUTRITION: 'nutrition',
  SLEEP: 'sleep',
  MENTAL_HEALTH: 'mental_health',
  PRODUCTIVITY: 'productivity'
} as const;

export type TaskCategory = typeof TASK_CATEGORIES[keyof typeof TASK_CATEGORIES];
