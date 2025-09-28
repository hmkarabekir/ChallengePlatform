import { HabitTrackerClient } from '../../contracts/client/HabitTrackerClient';
import { AlgorandClient } from '@algorandfoundation/algokit-utils';
import algosdk from 'algosdk';

describe('HabitTrackerChallenge Contract', () => {
  let client: HabitTrackerClient;
  let algorandClient: AlgorandClient;
  let creator: algosdk.Account;
  let participant: algosdk.Account;
  let appId: number;

  beforeAll(async () => {
    algorandClient = (global as any).algorandClient;
    creator = algosdk.generateAccount();
    participant = algosdk.generateAccount();
    
    // For testing, we'll use a mock app ID
    appId = 123;
    client = new HabitTrackerClient(algorandClient, appId);
  });

  describe('Challenge Creation', () => {
    it('should create a challenge successfully', async () => {
      const params = {
        entryFee: algosdk.algoToMicroAlgos(1), // 1 ALGO
        startTime: Math.floor(Date.now() / 1000) + 3600, // Start in 1 hour
        maxParticipants: 30,
        challengeName: 'Test Challenge',
        challengeDesc: 'A test habit tracker challenge'
      };

      // Mock the contract call
      jest.spyOn(client as any, 'contract').mockImplementation(() => ({
        createChallenge: jest.fn().mockResolvedValue({
          signTxn: jest.fn().mockReturnValue(new Uint8Array(0))
        })
      }));

      const result = await client.createChallenge(params, creator);
      
      expect(result.success).toBe(true);
      expect(result.challengeId).toBe(appId);
      expect(result.txnId).toBeDefined();
    });

    it('should fail with invalid parameters', async () => {
      const invalidParams = {
        entryFee: -1, // Invalid negative fee
        startTime: Math.floor(Date.now() / 1000) - 3600, // Past time
        maxParticipants: 0, // Invalid max participants
        challengeName: '',
        challengeDesc: ''
      };

      await expect(client.createChallenge(invalidParams, creator))
        .rejects.toThrow();
    });
  });

  describe('Challenge Participation', () => {
    it('should join challenge successfully', async () => {
      const entryFee = algosdk.algoToMicroAlgos(1);

      // Mock the contract calls
      jest.spyOn(client as any, 'contract').mockImplementation(() => ({
        joinChallenge: jest.fn().mockResolvedValue({
          signTxn: jest.fn().mockReturnValue(new Uint8Array(0))
        })
      }));

      jest.spyOn(client, 'getParticipantState').mockResolvedValue({
        isParticipant: 1,
        week1Points: 0,
        week2Points: 0,
        week3Points: 0,
        totalPoints: 0,
        isEliminated: 0,
        eliminationWeek: 0,
        lastTaskTime: 0
      });

      const result = await client.joinChallenge(participant, entryFee);
      
      expect(result.success).toBe(true);
      expect(result.txnId).toBeDefined();
      expect(result.participantLocalState.isParticipant).toBe(1);
    });

    it('should fail to join with insufficient funds', async () => {
      const insufficientFee = algosdk.algoToMicroAlgos(0.5); // Less than required

      await expect(client.joinChallenge(participant, insufficientFee))
        .rejects.toThrow();
    });
  });

  describe('Task Completion', () => {
    it('should complete task successfully', async () => {
      const taskData = {
        taskId: 1,
        pointsEarned: 10,
        week: 1
      };

      // Mock the contract call
      jest.spyOn(client as any, 'contract').mockImplementation(() => ({
        completeTask: jest.fn().mockResolvedValue({
          signTxn: jest.fn().mockReturnValue(new Uint8Array(0))
        })
      }));

      jest.spyOn(client, 'getParticipantState').mockResolvedValue({
        isParticipant: 1,
        week1Points: 10,
        week2Points: 0,
        week3Points: 0,
        totalPoints: 10,
        isEliminated: 0,
        eliminationWeek: 0,
        lastTaskTime: Date.now()
      });

      const result = await client.completeTask(participant, taskData);
      
      expect(result.success).toBe(true);
      expect(result.txnId).toBeDefined();
      expect(result.newPoints).toBe(10);
      expect(result.totalPoints).toBe(10);
    });

    it('should fail to complete task for non-participant', async () => {
      const taskData = {
        taskId: 1,
        pointsEarned: 10,
        week: 1
      };

      // Mock non-participant state
      jest.spyOn(client, 'getParticipantState').mockResolvedValue({
        isParticipant: 0,
        week1Points: 0,
        week2Points: 0,
        week3Points: 0,
        totalPoints: 0,
        isEliminated: 0,
        eliminationWeek: 0,
        lastTaskTime: 0
      });

      await expect(client.completeTask(participant, taskData))
        .rejects.toThrow();
    });
  });

  describe('Weekly Elimination', () => {
    it('should eliminate participant successfully', async () => {
      const eliminatedAddress = algosdk.generateAccount().addr;

      // Mock the contract call
      jest.spyOn(client as any, 'contract').mockImplementation(() => ({
        weeklyElimination: jest.fn().mockResolvedValue({
          signTxn: jest.fn().mockReturnValue(new Uint8Array(0))
        })
      }));

      const result = await client.weeklyElimination(creator, 1, eliminatedAddress);
      
      expect(result.success).toBe(true);
      expect(result.txnId).toBeDefined();
    });

    it('should fail elimination for non-creator', async () => {
      const eliminatedAddress = algosdk.generateAccount().addr;

      await expect(client.weeklyElimination(participant, 1, eliminatedAddress))
        .rejects.toThrow();
    });
  });

  describe('Reward Distribution', () => {
    it('should distribute rewards successfully', async () => {
      const winner1 = algosdk.generateAccount().addr;
      const winner2 = algosdk.generateAccount().addr;
      const winner3 = algosdk.generateAccount().addr;

      // Mock the contract call
      jest.spyOn(client as any, 'contract').mockImplementation(() => ({
        distributeWeeklyRewards: jest.fn().mockResolvedValue({
          signTxn: jest.fn().mockReturnValue(new Uint8Array(0))
        })
      }));

      const result = await client.distributeWeeklyRewards(creator, 1, winner1, winner2, winner3);
      
      expect(result.success).toBe(true);
      expect(result.txnId).toBeDefined();
    });

    it('should fail reward distribution for non-creator', async () => {
      const winner1 = algosdk.generateAccount().addr;
      const winner2 = algosdk.generateAccount().addr;
      const winner3 = algosdk.generateAccount().addr;

      await expect(client.distributeWeeklyRewards(participant, 1, winner1, winner2, winner3))
        .rejects.toThrow();
    });
  });

  describe('State Queries', () => {
    it('should get participant state', async () => {
      const mockState = {
        isParticipant: 1,
        week1Points: 50,
        week2Points: 30,
        week3Points: 20,
        totalPoints: 100,
        isEliminated: 0,
        eliminationWeek: 0,
        lastTaskTime: Date.now()
      };

      jest.spyOn(client, 'getParticipantState').mockResolvedValue(mockState);

      const state = await client.getParticipantState(participant.addr);
      
      expect(state).toEqual(mockState);
    });

    it('should get challenge info', async () => {
      const mockInfo = {
        challengeId: appId,
        entryFee: algosdk.algoToMicroAlgos(1),
        startTime: Math.floor(Date.now() / 1000),
        currentWeek: 1,
        totalParticipants: 5,
        maxParticipants: 30,
        isActive: 1,
        creator: creator.addr,
        week1Pool: algosdk.algoToMicroAlgos(3.5),
        week2Pool: 0,
        week3Pool: 0,
        challengeName: 'Test Challenge',
        challengeDesc: 'A test challenge'
      };

      jest.spyOn(client, 'getChallengeInfo').mockResolvedValue(mockInfo);

      const info = await client.getChallengeInfo();
      
      expect(info).toEqual(mockInfo);
    });
  });
});
