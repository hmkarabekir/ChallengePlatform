import axios from 'axios';
import { 
  Challenge, 
  ChallengeCreate, 
  User, 
  UserCreate, 
  WeeklyRanking, 
  ChatMessage, 
  ChatMessageCreate,
  Task,
  TaskCreate
} from '../types';
import blockchainApi from './blockchainApi';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const USE_BLOCKCHAIN = true; // Always use blockchain

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const user = localStorage.getItem('user');
  if (user) {
    const userData = JSON.parse(user);
    config.headers.Authorization = `Bearer ${userData.token || 'mock-token'}`;
  }
  return config;
});

export const challengeApi = {
  getChallenges: async (status?: string) => {
    if (USE_BLOCKCHAIN) {
      return await blockchainApi.getChallenges(status);
    }
    const params = status ? { status } : {};
    const response = await api.get('/challenges', { params });
    return response.data;
  },

  getChallenge: async (id: string) => {
    if (USE_BLOCKCHAIN) {
      return await blockchainApi.getChallenge(id);
    }
    const response = await api.get(`/challenges/${id}`);
    return response.data;
  },

  createChallenge: async (data: ChallengeCreate) => {
    if (USE_BLOCKCHAIN) {
      return await blockchainApi.createChallenge(data);
    }
    const response = await api.post('/challenges', data);
    return response.data;
  },

  joinChallenge: async (id: string, stakeAmount?: number) => {
    if (USE_BLOCKCHAIN) {
      return await blockchainApi.joinChallenge(id, stakeAmount || 0);
    }
    const response = await api.post(`/challenges/${id}/join`);
    return response.data;
  },

  stakeToChallenge: async (challengeId: string, stakeAmount: number, userAddress: string) => {
    if (USE_BLOCKCHAIN) {
      return await blockchainApi.stakeToChallenge(challengeId, stakeAmount, userAddress);
    }
    const response = await api.post(`/challenges/${challengeId}/stake`, { 
      stakeAmount, 
      userAddress 
    });
    return response.data;
  },

  leaveChallenge: async (id: string) => {
    if (USE_BLOCKCHAIN) {
      return await blockchainApi.leaveChallenge(id);
    }
    const response = await api.post(`/challenges/${id}/leave`);
    return response.data;
  },

  getParticipants: async (id: string) => {
    if (USE_BLOCKCHAIN) {
      const challenge = await blockchainApi.getChallenge(id);
      return challenge?.participants || [];
    }
    const response = await api.get(`/challenges/${id}/participants`);
    return response.data;
  },
};

export const userApi = {
  createUser: async (data: UserCreate) => {
    const response = await api.post('/users', data);
    return response.data;
  },

  getUser: async (id: string) => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  updateHealthData: async (id: string, data: any) => {
    const response = await api.put(`/users/${id}/health`, data);
    return response.data;
  },
};

export const chatApi = {
  getMessages: async (challengeId: string, limit = 50, offset = 0) => {
    if (USE_BLOCKCHAIN) {
      return await blockchainApi.getChatMessages(challengeId);
    }
    const response = await api.get(`/challenges/${challengeId}/messages`, {
      params: { limit, offset }
    });
    return response.data;
  },

  sendMessage: async (challengeId: string, data: ChatMessageCreate) => {
    if (USE_BLOCKCHAIN) {
      return await blockchainApi.sendMessage(challengeId, data.message);
    }
    const response = await api.post(`/challenges/${challengeId}/messages`, data);
    return response.data;
  },
};

export const taskApi = {
  getTasks: async (challengeId: string) => {
    if (USE_BLOCKCHAIN) {
      return await blockchainApi.getTasks(challengeId);
    }
    const response = await api.get(`/challenges/${challengeId}/tasks`);
    return response.data;
  },

  createTask: async (challengeId: string, data: TaskCreate) => {
    if (USE_BLOCKCHAIN) {
      return await blockchainApi.createTask(challengeId, data);
    }
    const response = await api.post(`/challenges/${challengeId}/tasks`, data);
    return response.data;
  },

  completeTask: async (taskId: string) => {
    if (USE_BLOCKCHAIN) {
      return await blockchainApi.completeTask(taskId);
    }
    const response = await api.post(`/tasks/${taskId}/complete`);
    return response.data;
  },
};

export const rankingApi = {
  getWeeklyRankings: async (challengeId: string) => {
    if (USE_BLOCKCHAIN) {
      return await blockchainApi.getWeeklyRankings(challengeId);
    }
    const response = await api.get(`/challenges/${challengeId}/rankings`);
    return response.data;
  },

  processElimination: async (challengeId: string) => {
    if (USE_BLOCKCHAIN) {
      return await blockchainApi.processElimination(challengeId);
    }
    const response = await api.post(`/challenges/${challengeId}/process-elimination`);
    return response.data;
  },
};

export default api;
