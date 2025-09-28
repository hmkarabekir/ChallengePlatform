// Cron service for scheduled tasks
import * as cron from 'node-cron';
import { ContractService } from './contract';
import { WebSocketService } from './websocket';

export class CronService {
  private contractService: ContractService;
  private webSocketService: WebSocketService | null = null;
  private jobs: Map<string, cron.ScheduledTask> = new Map();
  private isRunning: boolean = false;

  constructor() {
    this.contractService = new ContractService();
  }

  setWebSocketService(webSocketService: WebSocketService): void {
    this.webSocketService = webSocketService;
  }

  start(): void {
    if (this.isRunning) {
      console.log('Cron service is already running');
      return;
    }

    console.log('Starting cron service...');

    // Process weekly eliminations every hour
    const eliminationJob = cron.schedule('0 * * * *', async () => {
      await this.processWeeklyEliminations();
    }, {
      scheduled: false
    });

    // Check for completed challenges every 6 hours
    const completionJob = cron.schedule('0 */6 * * *', async () => {
      await this.processCompletedChallenges();
    }, {
      scheduled: false
    });

    // Health check every 5 minutes
    const healthJob = cron.schedule('*/5 * * * *', async () => {
      await this.healthCheck();
    }, {
      scheduled: false
    });

    // Start all jobs
    eliminationJob.start();
    completionJob.start();
    healthJob.start();

    this.jobs.set('elimination', eliminationJob);
    this.jobs.set('completion', completionJob);
    this.jobs.set('health', healthJob);

    this.isRunning = true;
    console.log('Cron service started successfully');
  }

  stop(): void {
    if (!this.isRunning) {
      console.log('Cron service is not running');
      return;
    }

    console.log('Stopping cron service...');

    for (const [name, job] of this.jobs.entries()) {
      job.stop();
      console.log(`Stopped job: ${name}`);
    }

    this.jobs.clear();
    this.isRunning = false;
    console.log('Cron service stopped');
  }

  isRunning(): boolean {
    return this.isRunning;
  }

  private async processWeeklyEliminations(): Promise<void> {
    try {
      console.log('Processing weekly eliminations...');
      
      // Get all active challenges
      const activeChallenges = await this.contractService.getActiveChallenges();
      
      for (const challenge of activeChallenges) {
        try {
          // Check if it's time for elimination
          const shouldEliminate = await this.contractService.shouldProcessElimination(challenge.id);
          
          if (shouldEliminate) {
            console.log(`Processing elimination for challenge ${challenge.id}`);
            
            // Process elimination on smart contract
            const result = await this.contractService.processWeeklyElimination(challenge.id);
            
            if (result.success) {
              console.log(`Elimination processed for challenge ${challenge.id}`);
              
              // Broadcast update via WebSocket
              if (this.webSocketService) {
                this.webSocketService.broadcastElimination(
                  challenge.id, 
                  result.eliminatedParticipant
                );
              }
            }
          }
        } catch (error) {
          console.error(`Error processing elimination for challenge ${challenge.id}:`, error);
        }
      }
    } catch (error) {
      console.error('Error in processWeeklyEliminations:', error);
    }
  }

  private async processCompletedChallenges(): Promise<void> {
    try {
      console.log('Processing completed challenges...');
      
      // Get challenges that should be completed
      const completedChallenges = await this.contractService.getCompletedChallenges();
      
      for (const challenge of completedChallenges) {
        try {
          console.log(`Processing completion for challenge ${challenge.id}`);
          
          // Distribute pool on smart contract
          const result = await this.contractService.distributePool(challenge.id);
          
          if (result.success) {
            console.log(`Pool distributed for challenge ${challenge.id}`);
            
            // Broadcast update via WebSocket
            if (this.webSocketService) {
              this.webSocketService.broadcastChallengeUpdate(
                challenge.id, 
                { ...challenge, status: 'completed' }
              );
            }
          }
        } catch (error) {
          console.error(`Error processing completion for challenge ${challenge.id}:`, error);
        }
      }
    } catch (error) {
      console.error('Error in processCompletedChallenges:', error);
    }
  }

  private async healthCheck(): Promise<void> {
    try {
      // Check contract service health
      const contractHealth = await this.contractService.healthCheck();
      
      if (!contractHealth.healthy) {
        console.warn('Contract service health check failed:', contractHealth.error);
      }
      
      // Check WebSocket service health
      if (this.webSocketService && !this.webSocketService.isConnected()) {
        console.warn('WebSocket service is not connected');
      }
      
    } catch (error) {
      console.error('Error in health check:', error);
    }
  }
}
