import express from 'express';
import cors from 'cors';
import { AlgorandClient, Config } from '@algorandfoundation/algokit-utils';
import { HabitTrackerClient } from '../client/HabitTrackerClient';
import algosdk from 'algosdk';
import {
  CreateChallengeRequest,
  CreateChallengeResponse,
  JoinChallengeRequest,
  JoinChallengeResponse,
  CompleteTaskRequest,
  CompleteTaskResponse,
  WeeklyEliminationRequest,
  WeeklyEliminationResponse,
  DistributeRewardsRequest,
  DistributeRewardsResponse,
  ApiError
} from '../types';

const app = express();
app.use(cors());
app.use(express.json());

// Initialize AlgorandClient
const algorandClient = AlgorandClient.fromConfig({
  algodConfig: Config.getConfigFromEnvironmentOrLocalNet().algodConfig,
  indexerConfig: Config.getConfigFromEnvironmentOrLocalNet().indexerConfig,
});

// Error handler
const handleError = (error: any, res: express.Response, message: string) => {
  console.error(message, error);
  const apiError: ApiError = {
    success: false,
    error: error instanceof Error ? error.message : 'Unknown error',
    code: error.code || 'UNKNOWN_ERROR',
    details: error.details || null
  };
  res.status(500).json(apiError);
};

// Routes

/**
 * Challenge oluştur
 */
app.post('/api/challenges/create', async (req, res) => {
  try {
    const { name, description, entryFee, startTime, maxParticipants, creatorPrivateKey, appId }: 
      CreateChallengeRequest & { creatorPrivateKey: string; appId: number } = req.body;
    
    if (!creatorPrivateKey || !appId) {
      return res.status(400).json({
        success: false,
        error: 'Creator private key and app ID are required'
      });
    }

    const creator = algosdk.mnemonicToSecretKey(creatorPrivateKey);
    const client = new HabitTrackerClient(algorandClient, appId);
    
    const result = await client.createChallenge({
      entryFee: algosdk.algoToMicroAlgos(entryFee),
      startTime: Math.floor(startTime / 1000), // Convert to seconds
      maxParticipants,
      challengeName: name,
      challengeDesc: description
    }, creator);

    const response: CreateChallengeResponse = {
      success: true,
      challengeId: result.challengeId.toString(),
      txnId: result.txnId
    };

    res.json(response);
  } catch (error) {
    handleError(error, res, 'Create challenge failed');
  }
});

/**
 * Challenge'a katıl
 */
app.post('/api/challenges/:id/join', async (req, res) => {
  try {
    const challengeId = parseInt(req.params.id);
    const { participantAddress, privateKey }: JoinChallengeRequest = req.body;
    
    if (!privateKey) {
      return res.status(400).json({
        success: false,
        error: 'Private key is required'
      });
    }

    const participant = algosdk.mnemonicToSecretKey(privateKey);
    const client = new HabitTrackerClient(algorandClient, challengeId);
    
    // Get challenge info to get entry fee
    const challengeInfo = await client.getChallengeInfo();
    const entryFee = challengeInfo.entryFee;
    
    const result = await client.joinChallenge(participant, entryFee);
    
    const response: JoinChallengeResponse = {
      success: true,
      txnId: result.txnId,
      participantState: result.participantLocalState
    };

    res.json(response);
  } catch (error) {
    handleError(error, res, 'Join challenge failed');
  }
});

/**
 * Görev tamamla
 */
app.post('/api/challenges/:id/complete-task', async (req, res) => {
  try {
    const challengeId = parseInt(req.params.id);
    const { taskId, participantAddress, privateKey, pointsEarned, week }: CompleteTaskRequest = req.body;
    
    if (!privateKey) {
      return res.status(400).json({
        success: false,
        error: 'Private key is required'
      });
    }

    const participant = algosdk.mnemonicToSecretKey(privateKey);
    const client = new HabitTrackerClient(algorandClient, challengeId);
    
    const result = await client.completeTask(participant, {
      taskId: parseInt(taskId),
      pointsEarned,
      week
    });
    
    const response: CompleteTaskResponse = {
      success: true,
      txnId: result.txnId,
      newPoints: result.newPoints,
      totalPoints: result.totalPoints
    };

    res.json(response);
  } catch (error) {
    handleError(error, res, 'Complete task failed');
  }
});

/**
 * Haftalık eleme yap
 */
app.post('/api/challenges/:id/eliminate', async (req, res) => {
  try {
    const challengeId = parseInt(req.params.id);
    const { week, eliminatedParticipant, creatorPrivateKey }: WeeklyEliminationRequest = req.body;
    
    if (!creatorPrivateKey) {
      return res.status(400).json({
        success: false,
        error: 'Creator private key is required'
      });
    }

    const creator = algosdk.mnemonicToSecretKey(creatorPrivateKey);
    const client = new HabitTrackerClient(algorandClient, challengeId);
    
    const result = await client.weeklyElimination(creator, week, eliminatedParticipant);
    
    const response: WeeklyEliminationResponse = {
      success: true,
      txnId: result.txnId
    };

    res.json(response);
  } catch (error) {
    handleError(error, res, 'Weekly elimination failed');
  }
});

/**
 * Haftalık ödül dağıt
 */
app.post('/api/challenges/:id/distribute-rewards', async (req, res) => {
  try {
    const challengeId = parseInt(req.params.id);
    const { week, winner1, winner2, winner3, creatorPrivateKey }: DistributeRewardsRequest = req.body;
    
    if (!creatorPrivateKey) {
      return res.status(400).json({
        success: false,
        error: 'Creator private key is required'
      });
    }

    const creator = algosdk.mnemonicToSecretKey(creatorPrivateKey);
    const client = new HabitTrackerClient(algorandClient, challengeId);
    
    const result = await client.distributeWeeklyRewards(creator, week, winner1, winner2, winner3);
    
    // Get challenge info to calculate rewards
    const challengeInfo = await client.getChallengeInfo();
    let poolAmount = 0;
    if (week === 1) poolAmount = challengeInfo.week1Pool;
    else if (week === 2) poolAmount = challengeInfo.week2Pool;
    else poolAmount = challengeInfo.week3Pool;
    
    const response: DistributeRewardsResponse = {
      success: true,
      txnId: result.txnId,
      rewards: {
        first: (poolAmount * 40) / 100,
        second: (poolAmount * 30) / 100,
        third: (poolAmount * 30) / 100
      }
    };

    res.json(response);
  } catch (error) {
    handleError(error, res, 'Distribute rewards failed');
  }
});

/**
 * Challenge'ı sonlandır
 */
app.post('/api/challenges/:id/end', async (req, res) => {
  try {
    const challengeId = parseInt(req.params.id);
    const { creatorPrivateKey }: { creatorPrivateKey: string } = req.body;
    
    if (!creatorPrivateKey) {
      return res.status(400).json({
        success: false,
        error: 'Creator private key is required'
      });
    }

    const creator = algosdk.mnemonicToSecretKey(creatorPrivateKey);
    const client = new HabitTrackerClient(algorandClient, challengeId);
    
    const result = await client.endChallenge(creator);
    
    res.json({
      success: true,
      txnId: result.txnId
    });
  } catch (error) {
    handleError(error, res, 'End challenge failed');
  }
});

/**
 * Challenge bilgilerini al
 */
app.get('/api/challenges/:id', async (req, res) => {
  try {
    const challengeId = parseInt(req.params.id);
    const client = new HabitTrackerClient(algorandClient, challengeId);
    
    const challengeInfo = await client.getChallengeInfo();
    
    res.json({
      success: true,
      challenge: challengeInfo
    });
  } catch (error) {
    handleError(error, res, 'Get challenge info failed');
  }
});

/**
 * Katılımcı durumunu al
 */
app.get('/api/challenges/:id/participants/:address', async (req, res) => {
  try {
    const challengeId = parseInt(req.params.id);
    const participantAddress = req.params.address;
    const client = new HabitTrackerClient(algorandClient, challengeId);
    
    const participantState = await client.getParticipantState(participantAddress);
    
    res.json({
      success: true,
      participant: participantState
    });
  } catch (error) {
    handleError(error, res, 'Get participant state failed');
  }
});

/**
 * Health check
 */
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Challenge Platform API is running',
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Challenge Platform API server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});
