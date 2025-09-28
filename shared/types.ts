// Shared types for the challenge platform
export interface User {
  id: string;
  address: string;
  username: string;
  email: string;
  createdAt: Date;
  healthData?: HealthData;
}

export interface HealthData {
  steps: number;
  activeMinutes: number;
  caloriesBurned: number;
  lastUpdated: Date;
  // Placeholder for future Google Fit/Apple Health integration
}

export interface Challenge {
  id: string;
  name: string;
  description: string;
  stakeAmount: number; // in microAlgos
  maxParticipants: number;
  currentParticipants: number;
  startDate: Date;
  endDate: Date;
  status: ChallengeStatus;
  poolAmount: number; // total staked amount
  creatorId: string;
  createdAt: Date;
  // Smart contract state
  contractAddress?: string;
  contractId?: number;
}

export enum ChallengeStatus {
  UPCOMING = 'upcoming',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export interface ChallengeParticipant {
  id: string;
  challengeId: string;
  userId: string;
  stakeAmount: number;
  joinedAt: Date;
  isActive: boolean;
  eliminatedAt?: Date;
  eliminationRound?: number;
  finalRank?: number;
  // Smart contract state
  participantAddress: string;
}

export interface WeeklyRanking {
  id: string;
  challengeId: string;
  week: number;
  participants: ParticipantRanking[];
  eliminatedParticipantId?: string;
  createdAt: Date;
}

export interface ParticipantRanking {
  participantId: string;
  userId: string;
  username: string;
  tasksCompleted: number;
  tasksMissed: number;
  rank: number;
  points: number;
}

export interface ChatMessage {
  id: string;
  challengeId: string;
  userId: string;
  username: string;
  message: string;
  timestamp: Date;
  isSystemMessage?: boolean;
}

export interface Task {
  id: string;
  challengeId: string;
  title: string;
  description: string;
  points: number;
  dueDate: Date;
  isCompleted: boolean;
  completedBy?: string;
  completedAt?: Date;
}

// Smart Contract Types (based on digital marketplace template)
export interface ChallengeContractState {
  challengeId: string;
  totalStaked: number;
  participants: ParticipantContractState[];
  currentWeek: number;
  isActive: boolean;
  startTime: number;
  endTime: number;
}

export interface ParticipantContractState {
  address: string;
  stakeAmount: number;
  isActive: boolean;
  tasksCompleted: number;
  currentRank: number;
  joinedAt: number;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// WebSocket Message Types
export interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: Date;
}

export interface ChatMessageWS extends WebSocketMessage {
  type: 'chat_message';
  data: ChatMessage;
}

export interface RankingUpdateWS extends WebSocketMessage {
  type: 'ranking_update';
  data: WeeklyRanking;
}

export interface ChallengeUpdateWS extends WebSocketMessage {
  type: 'challenge_update';
  data: Challenge;
}
