// Blockchain API for Algorand Smart Contract integration
import { 
  Challenge, 
  ChallengeCreate, 
  WeeklyRanking, 
  ChatMessage, 
  Task,
  TaskCreate
} from '../types';

// TypeScript Smart Contract Client
// Note: These imports will work once the TypeScript smart contract is properly set up
// import { HabitTrackerClient } from '../../../contracts/client/HabitTrackerClient';
// import { AlgorandClient } from '@algorandfoundation/algokit-utils';
import algosdk from 'algosdk';

// Smart Contract Configuration
const CONTRACT_APP_ID = parseInt((import.meta as any).env?.VITE_CONTRACT_APP_ID || '123');
// const ALGOD_SERVER = (import.meta as any).env?.VITE_ALGOD_SERVER || 'https://testnet-api.algonode.cloud';
// const ALGOD_TOKEN = (import.meta as any).env?.VITE_ALGOD_TOKEN || '';

// Mock Algorand Client for now
// const algorandClient = AlgorandClient.fromConfig({
//   algodConfig: {
//     server: ALGOD_SERVER,
//     port: 443,
//     token: ALGOD_TOKEN,
//   },
//   indexerConfig: {
//     server: ALGOD_SERVER.replace('api', 'idx2'),
//     port: 443,
//     token: ALGOD_TOKEN,
//   },
// });

// Mock Smart Contract Client for now
// const contractClient = new HabitTrackerClient(algorandClient, CONTRACT_APP_ID);

// Mock data for now - will be replaced with real blockchain calls
const mockChallenges: Challenge[] = [
  {
    id: 'challenge-1',
    name: 'Fitness Challenge',
    description: 'Complete daily workouts for 21 days',
    stakeAmount: 0,
    maxParticipants: 10,
    currentParticipants: 3,
    startTime: Math.floor(Date.now() / 1000) + 86400, // Tomorrow
    endTime: Math.floor(Date.now() / 1000) + 1814400, // 21 days from now
    startDate: new Date(Date.now() + 86400000), // Tomorrow
    endDate: new Date(Date.now() + 1814400000), // 21 days from now
    status: 'upcoming' as any,
    poolAmount: 0,
    creatorId: 'creator-1',
    creator: 'GGL3NXK742UDBECIESQW7JAXMXFEL5H7QW7TTRPDEGDTXK5KUI5CWMQGSM',
    createdAt: new Date(),
    participants: [],
    tasks: []
  },
  {
    id: 'challenge-2',
    name: 'Running Challenge',
    description: 'Run 5km every day for 2 weeks',
    stakeAmount: 0,
    maxParticipants: 15,
    currentParticipants: 7,
    startTime: Math.floor(Date.now() / 1000) - 86400, // Yesterday
    endTime: Math.floor(Date.now() / 1000) + 1209600, // 14 days from now
    startDate: new Date(Date.now() - 86400000), // Yesterday
    endDate: new Date(Date.now() + 1209600000), // 14 days from now
    status: 'active' as any,
    poolAmount: 0,
    creatorId: 'creator-2',
    creator: 'GGL3NXK742UDBECIESQW7JAXMXFEL5H7QW7TTRPDEGDTXK5KUI5CWMQGSM',
    createdAt: new Date(),
    participants: [],
    tasks: []
  }
];

export const blockchainApi = {
  // Challenge operations
  getChallenges: async (): Promise<Challenge[]> => {
    try {
      console.log('Reading challenges from TypeScript smart contract...');
      
      // TODO: Implement real smart contract integration
      // For now, return mock data with TypeScript smart contract fields
      const enhancedMockChallenges = mockChallenges.map(challenge => ({
        ...challenge,
        contractAddress: algosdk.getApplicationAddress(CONTRACT_APP_ID).toString(),
        contractId: CONTRACT_APP_ID,
        currentWeek: 1,
        week1Pool: 1000000, // 1 ALGO
        week2Pool: 0,
        week3Pool: 0,
        isActive: true
      }));
      
      return enhancedMockChallenges;
    } catch (error) {
      console.error('Error reading challenges from smart contract:', error);
      // Fallback to mock data
      return mockChallenges;
    }
  },

  getChallenge: async (id: string): Promise<Challenge | null> => {
    try {
      console.log(`Reading challenge ${id} from TypeScript smart contract...`);
      
      // TODO: Implement real smart contract integration
      // For now, return mock data with TypeScript smart contract fields
      const challenge = mockChallenges.find(c => c.id === id);
      if (!challenge) return null;
      
      return {
        ...challenge,
        contractAddress: algosdk.getApplicationAddress(CONTRACT_APP_ID).toString(),
        contractId: CONTRACT_APP_ID,
        currentWeek: 1,
        week1Pool: 1000000, // 1 ALGO
        week2Pool: 0,
        week3Pool: 0,
        isActive: true
      };
    } catch (error) {
      console.error('Error reading challenge from smart contract:', error);
      // Fallback to mock data
      return mockChallenges.find(c => c.id === id) || null;
    }
  },

  createChallenge: async (data: ChallengeCreate): Promise<Challenge> => {
    console.log('Creating challenge...', data);
    
    const newChallenge: Challenge = {
      id: `challenge-${Date.now()}`,
      name: data.name,
      description: data.description || '',
      stakeAmount: 0, // No stake
      maxParticipants: data.maxParticipants,
      currentParticipants: 0,
      startTime: data.startTime,
      endTime: data.endTime,
      startDate: new Date(data.startTime * 1000), // Use actual start time
      endDate: new Date(data.endTime * 1000), // Use actual end time
      status: 'active' as any,
      poolAmount: 0,
      creatorId: data.creator || '',
      creator: data.creator || '',
      createdAt: new Date(),
      participants: [],
      tasks: []
    };
    
    mockChallenges.push(newChallenge);
    return newChallenge;
  },

  joinChallenge: async (challengeId: string, stakeAmount: number = 0): Promise<{ success: boolean; message: string; txId?: string }> => {
    console.log(`Joining challenge ${challengeId} with stake: ${stakeAmount} microAlgos...`);
    
    try {
      // Get user's wallet from Pera Wallet service
      const { peraWalletService } = await import('./peraWalletService');
      const userAddress = await peraWalletService.getConnectedAddress();
      
      if (!userAddress) {
        return { success: false, message: 'Please connect your wallet first' };
      }

      // TODO: Implement real TypeScript smart contract integration
      // For now, simulate the transaction
      const mockTxId = 'mock-tx-' + Date.now();
      
      // Update challenge data
      const challenge = mockChallenges.find(c => c.id === challengeId);
      if (challenge) {
        challenge.currentParticipants += 1;
        challenge.poolAmount += stakeAmount;
      }
      
      return { 
        success: true, 
        message: `Successfully joined challenge with ${stakeAmount} microAlgos stake!`,
        txId: mockTxId
      };
    } catch (error) {
      console.error('Join challenge failed:', error);
      return { 
        success: false, 
        message: 'Failed to join challenge: ' + (error as Error).message 
      };
    }
  },

  // New function for staking to a challenge
  stakeToChallenge: async (challengeId: string, stakeAmount: number, userAddress: string): Promise<{ success: boolean; message: string; txId?: string }> => {
    console.log(`Staking ${stakeAmount} microAlgos to challenge ${challengeId}...`);
    
    try {
      // Import the real Pera Wallet service
      const { peraWalletService } = await import('./peraWalletService');
      const result = await peraWalletService.stakeToChallenge(challengeId, stakeAmount, userAddress);
      
      if (result.success) {
        // Update challenge pool
        const challenge = mockChallenges.find(c => c.id === challengeId);
        if (challenge) {
          challenge.poolAmount += stakeAmount;
          console.log('Updated pool amount:', challenge.poolAmount);
        }
      }
      
      return result;
      
    } catch (error) {
      console.error('Stake transaction failed:', error);
      return { 
        success: false, 
        message: 'Stake transaction failed: ' + (error as Error).message 
      };
    }
  },

  leaveChallenge: async (challengeId: string): Promise<{ success: boolean; message: string }> => {
    // TODO: Call smart contract leave_challenge method
    console.log(`Leaving challenge ${challengeId}...`);
    
    const challenge = mockChallenges.find(c => c.id === challengeId);
    if (!challenge) {
      return { success: false, message: 'Challenge not found' };
    }
    
    // Remove participant from challenge
    challenge.participants = challenge.participants.filter((p: any) => p.participantAddress !== 'user-address');
    challenge.currentParticipants = challenge.participants.length;
    
    return { success: true, message: 'Successfully left challenge!' };
  },

  // Chat operations
  getChatMessages: async (challengeId: string): Promise<ChatMessage[]> => {
    // TODO: Read chat messages from smart contract
    console.log(`Reading chat messages for challenge ${challengeId}...`);
    return [];
  },

  sendMessage: async (challengeId: string, message: string): Promise<ChatMessage> => {
    // TODO: Call smart contract send_chat_message method
    console.log(`Sending message to challenge ${challengeId}: ${message}`);
    
    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      challengeId,
      userId: 'user-address',
      username: 'User',
      sender: 'user-address',
      content: message,
      message: message, // for backward compatibility
      timestamp: new Date(),
      isSystemMessage: false
    };
    
    return newMessage;
  },

  // Task operations
  getTasks: async (challengeId: string): Promise<Task[]> => {
    // TODO: Read tasks from smart contract
    console.log(`Reading tasks for challenge ${challengeId}...`);
    return [];
  },

  createTask: async (challengeId: string, data: TaskCreate): Promise<Task> => {
    // TODO: Call smart contract create_task method
    console.log(`Creating task for challenge ${challengeId}:`, data);
    
    const newTask: Task = {
      id: `task-${Date.now()}`,
      challengeId,
      title: data.name,
      name: data.name,
      description: data.description,
      requiredValue: data.requiredValue,
      dataType: data.dataType,
      points: data.points,
      dueDate: data.dueDate,
      isCompleted: false,
      isActive: true,
      createdAt: new Date()
    };
    
    return newTask;
  },

  completeTask: async (taskId: string): Promise<{ success: boolean; message: string; txId?: string }> => {
    try {
      console.log(`Completing task ${taskId} using TypeScript smart contract...`);
      
      // Get user's wallet from Pera Wallet service
      const { peraWalletService } = await import('./peraWalletService');
      const userAddress = await peraWalletService.getConnectedAddress();
      
      if (!userAddress) {
        return { success: false, message: 'Please connect your wallet first' };
      }

      // TODO: Implement real TypeScript smart contract integration
      // For now, simulate the transaction
      const mockTxId = 'mock-task-tx-' + Date.now();
      const pointsEarned = 10;
      const totalPoints = 50; // Mock total points
      
      return { 
        success: true, 
        message: `Task completed successfully! Earned ${pointsEarned} points. Total: ${totalPoints} points.`,
        txId: mockTxId
      };
    } catch (error) {
      console.error('Complete task failed:', error);
      return { 
        success: false, 
        message: 'Failed to complete task: ' + (error as Error).message 
      };
    }
  },

  // Ranking operations
  getWeeklyRankings: async (challengeId: string): Promise<WeeklyRanking[]> => {
    // TODO: Read rankings from smart contract
    console.log(`Reading weekly rankings for challenge ${challengeId}...`);
    return [];
  },

  processElimination: async (challengeId: string): Promise<{ success: boolean; message: string }> => {
    // TODO: Call smart contract process_weekly_elimination method
    console.log(`Processing elimination for challenge ${challengeId}...`);
    
    return { success: true, message: 'Elimination processed successfully!' };
  },

  // Health data operations
  submitHealthData: async (challengeId: string, data: any): Promise<{ success: boolean; message: string }> => {
    // TODO: Call smart contract submit_health_data method
    console.log(`Submitting health data for challenge ${challengeId}:`, data);
    
    return { success: true, message: 'Health data submitted successfully!' };
  }
};

export default blockchainApi;
