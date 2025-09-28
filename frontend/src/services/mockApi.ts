// Mock API service for testing without backend
import { 
  Challenge, 
  User, 
  WeeklyRanking, 
  ChatMessage, 
  Task,
  ChallengeStatus
} from '../types';

// Mock data
const mockUsers: User[] = [
  {
    id: "user-1",
    address: "ALGORAND_ADDRESS_1",
    username: "fitness_lover",
    email: "fitness@example.com",
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    healthData: {
      steps: 8500,
      activeMinutes: 45,
      caloriesBurned: 320,
      lastUpdated: new Date()
    }
  },
  {
    id: "user-2",
    address: "ALGORAND_ADDRESS_2", 
    username: "challenge_master",
    email: "master@example.com",
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
    healthData: {
      steps: 12000,
      activeMinutes: 60,
      caloriesBurned: 450,
      lastUpdated: new Date()
    }
  }
];

const mockChallenges: Challenge[] = [
  {
    id: "challenge-1",
    name: "30-Day Fitness Challenge",
    description: "Complete daily workouts and stay active for 30 days. Perfect for beginners!",
    stakeAmount: 10000,
    maxParticipants: 20,
    currentParticipants: 15,
    startTime: Math.floor((Date.now() - 5 * 24 * 60 * 60 * 1000) / 1000),
    endTime: Math.floor((Date.now() + 16 * 24 * 60 * 60 * 1000) / 1000),
    startDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now() + 16 * 24 * 60 * 60 * 1000),
    status: ChallengeStatus.ACTIVE,
    poolAmount: 150000,
    creatorId: "user-1",
    creator: "GGL3NXK742UDBECIESQW7JAXMXFEL5H7QW7TTRPDEGDTXK5KUI5CWMQGSM",
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    participants: [],
    tasks: [],
    contractAddress: "MOCK_CONTRACT_1",
    contractId: 12345
  },
  {
    id: "challenge-2",
    name: "Marathon Training Challenge", 
    description: "Train for a marathon with daily running goals and strength training.",
    stakeAmount: 25000,
    maxParticipants: 10,
    currentParticipants: 8,
    startTime: Math.floor((Date.now() + 3 * 24 * 60 * 60 * 1000) / 1000),
    endTime: Math.floor((Date.now() + 24 * 24 * 60 * 60 * 1000) / 1000),
    startDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now() + 24 * 24 * 60 * 60 * 1000),
    status: ChallengeStatus.UPCOMING,
    poolAmount: 200000,
    creatorId: "user-2",
    creator: "GGL3NXK742UDBECIESQW7JAXMXFEL5H7QW7TTRPDEGDTXK5KUI5CWMQGSM",
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    participants: [],
    tasks: [],
    contractAddress: "MOCK_CONTRACT_2",
    contractId: 12346
  },
  {
    id: "challenge-3",
    name: "Weight Loss Challenge",
    description: "Lose weight through consistent exercise and healthy habits.",
    stakeAmount: 15000,
    maxParticipants: 15,
    currentParticipants: 12,
    startTime: Math.floor((Date.now() - 20 * 24 * 60 * 60 * 1000) / 1000),
    endTime: Math.floor((Date.now() - 1 * 24 * 60 * 60 * 1000) / 1000),
    startDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    status: ChallengeStatus.COMPLETED,
    poolAmount: 180000,
    creatorId: "user-3",
    creator: "GGL3NXK742UDBECIESQW7JAXMXFEL5H7QW7TTRPDEGDTXK5KUI5CWMQGSM",
    createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
    participants: [],
    tasks: [],
    contractAddress: "MOCK_CONTRACT_3",
    contractId: 12347
  }
];

const mockChatMessages: ChatMessage[] = [
  {
    id: "msg-1",
    challengeId: "challenge-1",
    userId: "user-1",
    username: "fitness_lover",
    sender: "user-1",
    content: "Good morning everyone! Ready for today's workout? 💪",
    message: "Good morning everyone! Ready for today's workout? 💪",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    isSystemMessage: false
  },
  {
    id: "msg-2",
    challengeId: "challenge-1",
    userId: "user-2",
    username: "challenge_master",
    sender: "user-2",
    content: "Let's crush it! I did 10k steps already today 🏃‍♂️",
    message: "Let's crush it! I did 10k steps already today 🏃‍♂️",
    timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
    isSystemMessage: false
  },
  {
    id: "msg-3",
    challengeId: "challenge-1",
    userId: "",
    username: "System",
    sender: "system",
    content: "workout_warrior has been eliminated from the challenge!",
    message: "workout_warrior has been eliminated from the challenge!",
    timestamp: new Date(Date.now() - 30 * 60 * 1000),
    isSystemMessage: true
  }
];

const mockTasks: Task[] = [
  {
    id: "task-1",
    challengeId: "challenge-1",
    name: "10,000 Steps Daily",
    title: "10,000 Steps Daily",
    description: "Walk or run to achieve 10,000 steps every day",
    requiredValue: 10000,
    dataType: "number",
    points: 10,
    dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
    isCompleted: false,
    isActive: true,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    completedBy: undefined,
    completedAt: undefined
  },
  {
    id: "task-2",
    challengeId: "challenge-1",
    name: "30 Minutes Cardio",
    title: "30 Minutes Cardio",
    description: "Complete 30 minutes of cardio exercise",
    requiredValue: 30,
    dataType: "number",
    points: 15,
    dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
    isCompleted: true,
    isActive: true,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    completedBy: "user-1",
    completedAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
  },
  {
    id: "task-3",
    challengeId: "challenge-1",
    name: "Strength Training",
    title: "Strength Training",
    description: "Complete a strength training workout",
    requiredValue: 1,
    dataType: "boolean",
    points: 20,
    dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
    isCompleted: false,
    isActive: true,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    completedBy: undefined,
    completedAt: undefined
  }
];

// Mock API functions
export const mockApi = {
  // Users
  getUsers: async (): Promise<User[]> => {
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
    return mockUsers;
  },

  // Challenges
  getChallenges: async (status?: string): Promise<Challenge[]> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    if (status && status !== 'all') {
      return mockChallenges.filter(c => c.status === status);
    }
    return mockChallenges;
  },

  getChallenge: async (id: string): Promise<Challenge | null> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockChallenges.find(c => c.id === id) || null;
  },

  createChallenge: async (data: any): Promise<Challenge> => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    const newChallenge: Challenge = {
      id: `challenge-${Date.now()}`,
      ...data,
      currentParticipants: 1,
      poolAmount: data.stakeAmount,
      status: ChallengeStatus.UPCOMING,
      createdAt: new Date(),
      participants: [],
      tasks: [],
      contractAddress: `MOCK_CONTRACT_${Date.now()}`,
      contractId: Math.floor(Math.random() * 100000)
    };
    mockChallenges.push(newChallenge);
    return newChallenge;
  },

  joinChallenge: async (id: string): Promise<{ message: string }> => {
    await new Promise(resolve => setTimeout(resolve, 800));
    const challenge = mockChallenges.find(c => c.id === id);
    if (challenge) {
      challenge.currentParticipants += 1;
      challenge.poolAmount += challenge.stakeAmount;
    }
    return { message: "Successfully joined challenge!" };
  },

  // Chat
  getChatMessages: async (challengeId: string): Promise<ChatMessage[]> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockChatMessages.filter(m => m.challengeId === challengeId);
  },

  sendMessage: async (challengeId: string, message: string): Promise<ChatMessage> => {
    await new Promise(resolve => setTimeout(resolve, 200));
    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      challengeId,
      userId: "current-user",
      username: "You",
      sender: "current-user",
      content: message,
      message,
      timestamp: new Date(),
      isSystemMessage: false
    };
    mockChatMessages.push(newMessage);
    return newMessage;
  },

  // Tasks
  getTasks: async (challengeId: string): Promise<Task[]> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockTasks.filter(t => t.challengeId === challengeId);
  },

  createTask: async (challengeId: string, data: any): Promise<Task> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    const newTask: Task = {
      id: `task-${Date.now()}`,
      challengeId,
      ...data,
      isCompleted: false,
      completedBy: undefined,
      completedAt: undefined
    };
    mockTasks.push(newTask);
    return newTask;
  },

  completeTask: async (taskId: string): Promise<{ message: string }> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const task = mockTasks.find(t => t.id === taskId);
    if (task) {
      task.isCompleted = true;
      task.completedBy = "current-user";
      task.completedAt = new Date();
    }
    return { message: "Task completed successfully!" };
  },

  // Rankings
  getRankings: async (challengeId: string): Promise<WeeklyRanking[]> => {
    await new Promise(resolve => setTimeout(resolve, 400));
    return [
      {
        id: "ranking-1",
        challengeId,
        week: 1,
        participants: [
          {
            participantId: "participant-1",
            userId: "user-1",
            username: "fitness_lover",
            tasksCompleted: 5,
            tasksMissed: 0,
            rank: 1,
            points: 50.0
          },
          {
            participantId: "participant-2",
            userId: "user-2", 
            username: "challenge_master",
            tasksCompleted: 4,
            tasksMissed: 1,
            rank: 2,
            points: 40.0
          }
        ],
        eliminatedParticipantId: "participant-3",
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000)
      }
    ];
  }
};

export default mockApi;
