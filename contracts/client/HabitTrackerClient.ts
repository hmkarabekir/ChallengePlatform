import algosdk from 'algosdk';
import { AlgorandClient } from '@algorandfoundation/algokit-utils';
import { HabitTrackerChallenge } from '../HabitTrackerChallenge.algo';

export interface CreateChallengeParams {
  entryFee: number;
  startTime: number;
  maxParticipants: number;
  challengeName: string;
  challengeDesc: string;
}

export interface ChallengeResult {
  challengeId: number;
  txnId: string;
  success: boolean;
}

export interface JoinResult {
  success: boolean;
  txnId: string;
  participantLocalState: ParticipantState;
}

export interface TaskData {
  taskId: number;
  pointsEarned: number;
  week: number;
}

export interface TaskResult {
  success: boolean;
  txnId: string;
  newPoints: number;
  totalPoints: number;
}

export interface ParticipantState {
  isParticipant: number;
  week1Points: number;
  week2Points: number;
  week3Points: number;
  totalPoints: number;
  isEliminated: number;
  eliminationWeek: number;
  lastTaskTime: number;
}

export interface ChallengeInfo {
  challengeId: number;
  entryFee: number;
  startTime: number;
  currentWeek: number;
  totalParticipants: number;
  maxParticipants: number;
  isActive: number;
  creator: string;
  week1Pool: number;
  week2Pool: number;
  week3Pool: number;
  challengeName: string;
  challengeDesc: string;
}

export class HabitTrackerClient {
  private algorandClient: AlgorandClient;
  private contract: HabitTrackerChallenge;
  private appId: number;
  
  constructor(algorandClient: AlgorandClient, appId: number) {
    this.algorandClient = algorandClient;
    this.appId = appId;
    this.contract = new HabitTrackerChallenge(appId, algorandClient.client.algod);
  }

  /**
   * Challenge oluştur
   */
  async createChallenge(params: CreateChallengeParams, signer: algosdk.Account): Promise<ChallengeResult> {
    try {
      const txn = await this.contract.createChallenge(
        params.entryFee,
        params.startTime,
        params.maxParticipants,
        params.challengeName,
        params.challengeDesc,
        { sender: signer.addr }
      );
      
      const signedTxn = txn.signTxn(signer.sk);
      const txnResult = await this.algorandClient.client.algod.sendRawTransaction(signedTxn).do();
      
      return {
        challengeId: this.appId,
        txnId: txnResult.txId,
        success: true
      };
    } catch (error) {
      console.error('Challenge creation failed:', error);
      throw new Error(`Failed to create challenge: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Challenge'a katıl
   */
  async joinChallenge(participant: algosdk.Account, entryFee: number): Promise<JoinResult> {
    try {
      // Payment transaction oluştur
      const paymentTxn = await this.algorandClient.transactions.payment({
        sender: participant.addr,
        receiver: algosdk.getApplicationAddress(this.appId),
        amount: algosdk.microAlgosToAlgos(entryFee)
      });

      // Join transaction oluştur
      const joinTxn = await this.contract.joinChallenge(paymentTxn, {
        sender: participant.addr
      });

      // Transaction'ları grupla ve imzala
      const groupedTxns = algosdk.assignGroupID([paymentTxn, joinTxn]);
      const signedPayment = groupedTxns[0].signTxn(participant.sk);
      const signedJoin = groupedTxns[1].signTxn(participant.sk);

      const txnResult = await this.algorandClient.client.algod.sendRawTransaction([signedPayment, signedJoin]).do();
      
      // Katılımcı durumunu al
      const participantState = await this.getParticipantState(participant.addr);
      
      return {
        success: true,
        txnId: txnResult.txId,
        participantLocalState: participantState
      };
    } catch (error) {
      console.error('Join challenge failed:', error);
      throw new Error(`Failed to join challenge: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Görev tamamla
   */
  async completeTask(
    participant: algosdk.Account, 
    taskData: TaskData
  ): Promise<TaskResult> {
    try {
      const txn = await this.contract.completeTask(
        taskData.taskId,
        taskData.pointsEarned,
        taskData.week,
        { sender: participant.addr }
      );

      const signedTxn = txn.signTxn(participant.sk);
      const txnResult = await this.algorandClient.client.algod.sendRawTransaction(signedTxn).do();

      const newState = await this.getParticipantState(participant.addr);
      
      return {
        success: true,
        txnId: txnResult.txId,
        newPoints: taskData.pointsEarned,
        totalPoints: newState.totalPoints
      };
    } catch (error) {
      console.error('Complete task failed:', error);
      throw new Error(`Failed to complete task: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Haftalık eleme yap
   */
  async weeklyElimination(
    creator: algosdk.Account,
    week: number,
    eliminatedParticipant: string
  ): Promise<{ success: boolean; txnId: string }> {
    try {
      const txn = await this.contract.weeklyElimination(
        week,
        eliminatedParticipant,
        { sender: creator.addr }
      );

      const signedTxn = txn.signTxn(creator.sk);
      const txnResult = await this.algorandClient.client.algod.sendRawTransaction(signedTxn).do();

      return {
        success: true,
        txnId: txnResult.txId
      };
    } catch (error) {
      console.error('Weekly elimination failed:', error);
      throw new Error(`Failed to eliminate participant: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Haftalık ödül dağıt
   */
  async distributeWeeklyRewards(
    creator: algosdk.Account,
    week: number,
    winner1: string,
    winner2: string,
    winner3: string
  ): Promise<{ success: boolean; txnId: string }> {
    try {
      const txn = await this.contract.distributeWeeklyRewards(
        week,
        winner1,
        winner2,
        winner3,
        { sender: creator.addr }
      );

      const signedTxn = txn.signTxn(creator.sk);
      const txnResult = await this.algorandClient.client.algod.sendRawTransaction(signedTxn).do();

      return {
        success: true,
        txnId: txnResult.txId
      };
    } catch (error) {
      console.error('Distribute rewards failed:', error);
      throw new Error(`Failed to distribute rewards: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Challenge'ı sonlandır
   */
  async endChallenge(creator: algosdk.Account): Promise<{ success: boolean; txnId: string }> {
    try {
      const txn = await this.contract.endChallenge({ sender: creator.addr });

      const signedTxn = txn.signTxn(creator.sk);
      const txnResult = await this.algorandClient.client.algod.sendRawTransaction(signedTxn).do();

      return {
        success: true,
        txnId: txnResult.txId
      };
    } catch (error) {
      console.error('End challenge failed:', error);
      throw new Error(`Failed to end challenge: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Katılımcı durumunu al
   */
  async getParticipantState(address: string): Promise<ParticipantState> {
    try {
      const accountInfo = await this.algorandClient.client.algod.accountInformation(address).do();
      const localState = accountInfo['apps-local-state']?.find((app: any) => app.id === this.appId);
      
      if (!localState) {
        return {
          isParticipant: 0,
          week1Points: 0,
          week2Points: 0,
          week3Points: 0,
          totalPoints: 0,
          isEliminated: 0,
          eliminationWeek: 0,
          lastTaskTime: 0
        };
      }

      return {
        isParticipant: this.parseLocalState(localState, 'isParticipant'),
        week1Points: this.parseLocalState(localState, 'week1Points'),
        week2Points: this.parseLocalState(localState, 'week2Points'),
        week3Points: this.parseLocalState(localState, 'week3Points'),
        totalPoints: this.parseLocalState(localState, 'totalPoints'),
        isEliminated: this.parseLocalState(localState, 'isEliminated'),
        eliminationWeek: this.parseLocalState(localState, 'eliminationWeek'),
        lastTaskTime: this.parseLocalState(localState, 'lastTaskTime')
      };
    } catch (error) {
      console.error('Get participant state failed:', error);
      throw new Error(`Failed to get participant state: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Challenge bilgilerini al
   */
  async getChallengeInfo(): Promise<ChallengeInfo> {
    try {
      const appInfo = await this.algorandClient.client.algod.getApplicationByID(this.appId).do();
      const globalState = appInfo.params['global-state'] || [];
      
      const stateMap = new Map();
      globalState.forEach((state: any) => {
        const key = Buffer.from(state.key, 'base64').toString();
        stateMap.set(key, state.value);
      });

      return {
        challengeId: this.appId,
        entryFee: this.parseGlobalState(stateMap, 'entryFee'),
        startTime: this.parseGlobalState(stateMap, 'startTime'),
        currentWeek: this.parseGlobalState(stateMap, 'currentWeek'),
        totalParticipants: this.parseGlobalState(stateMap, 'totalParticipants'),
        maxParticipants: this.parseGlobalState(stateMap, 'maxParticipants'),
        isActive: this.parseGlobalState(stateMap, 'isActive'),
        creator: this.parseGlobalStateString(stateMap, 'creator'),
        week1Pool: this.parseGlobalState(stateMap, 'week1Pool'),
        week2Pool: this.parseGlobalState(stateMap, 'week2Pool'),
        week3Pool: this.parseGlobalState(stateMap, 'week3Pool'),
        challengeName: this.parseGlobalStateString(stateMap, 'challengeName'),
        challengeDesc: this.parseGlobalStateString(stateMap, 'challengeDesc')
      };
    } catch (error) {
      console.error('Get challenge info failed:', error);
      throw new Error(`Failed to get challenge info: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Local state'i parse et
   */
  private parseLocalState(localState: any, key: string): number {
    const keyValue = localState?.['key-value']?.find((kv: any) => 
      Buffer.from(kv.key, 'base64').toString() === key
    );
    return keyValue?.value?.uint || 0;
  }

  /**
   * Global state'i parse et (uint64)
   */
  private parseGlobalState(stateMap: Map<string, any>, key: string): number {
    const value = stateMap.get(key);
    return value?.uint || 0;
  }

  /**
   * Global state'i parse et (string)
   */
  private parseGlobalStateString(stateMap: Map<string, any>, key: string): string {
    const value = stateMap.get(key);
    return value?.bytes ? Buffer.from(value.bytes, 'base64').toString() : '';
  }
}
