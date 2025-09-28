// Shared types for the challenge platform
// Note: These imports will work once the TypeScript smart contract is properly set up
// import { 
//   ParticipantState as ContractParticipantState,
//   ChallengeInfo as ContractChallengeInfo 
// } from '../../contracts/types';

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
  startTime: number; // Unix timestamp
  endTime: number; // Unix timestamp
  status: ChallengeStatus;
  poolAmount: number; // total staked amount
  creatorId: string;
  creator: string; // wallet address
  createdAt: Date;
  participants: ChallengeParticipant[];
  tasks: Task[];
  // Smart contract state
  contractAddress?: string;
  contractId?: number;
  // TypeScript smart contract integration
  currentWeek?: number;
  week1Pool?: number;
  week2Pool?: number;
  week3Pool?: number;
  isActive?: boolean;
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
  // TypeScript smart contract integration
  week1Points?: number;
  week2Points?: number;
  week3Points?: number;
  totalPoints?: number;
  isEliminated?: boolean;
  eliminationWeek?: number;
  lastTaskTime?: number;
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
  sender: string; // wallet address
  content: string;
  message: string; // for backward compatibility
  timestamp: Date;
  isSystemMessage?: boolean;
}

export interface Task {
  id: string;
  challengeId: string;
  title: string;
  name: string; // for backward compatibility
  description: string;
  requiredValue: number;
  dataType: string;
  points: number;
  dueDate: Date;
  isCompleted: boolean;
  isActive: boolean;
  completedBy?: string;
  completedAt?: Date;
  createdAt: Date;
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

// Create/Update types
export interface ChallengeCreate {
  name: string;
  description: string;
  maxParticipants: number;
  startTime: number;
  endTime: number;
  creator: string;
}

export interface ChatMessageCreate {
  challengeId: string;
  content: string;
  sender: string;
}

export interface TaskCreate {
  challengeId: string;
  name: string;
  description: string;
  requiredValue: number;
  dataType: string;
  points: number;
  dueDate: Date;
}
