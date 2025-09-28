// WebSocket service for real-time communication
import { Server, Socket } from 'socket.io';
import { ContractService } from './contract';

export class WebSocketService {
  private io: Server;
  private contractService: ContractService;
  private challengeRooms: Map<string, Set<string>> = new Map();

  constructor(io: Server) {
    this.io = io;
    this.contractService = new ContractService();
  }

  isConnected(): boolean {
    return this.io.engine.clientsCount > 0;
  }

  joinChallenge(socket: Socket, challengeId: string): void {
    // Leave previous challenge if any
    this.leaveAllChallenges(socket);
    
    // Join new challenge room
    socket.join(`challenge:${challengeId}`);
    
    // Track socket in challenge room
    if (!this.challengeRooms.has(challengeId)) {
      this.challengeRooms.set(challengeId, new Set());
    }
    this.challengeRooms.get(challengeId)!.add(socket.id);
    
    console.log(`Socket ${socket.id} joined challenge ${challengeId}`);
    
    // Send confirmation
    socket.emit('joined_challenge', { challengeId });
  }

  leaveChallenge(socket: Socket, challengeId: string): void {
    socket.leave(`challenge:${challengeId}`);
    
    // Remove from tracking
    const room = this.challengeRooms.get(challengeId);
    if (room) {
      room.delete(socket.id);
      if (room.size === 0) {
        this.challengeRooms.delete(challengeId);
      }
    }
    
    console.log(`Socket ${socket.id} left challenge ${challengeId}`);
    
    // Send confirmation
    socket.emit('left_challenge', { challengeId });
  }

  leaveAllChallenges(socket: Socket): void {
    for (const [challengeId, room] of this.challengeRooms.entries()) {
      if (room.has(socket.id)) {
        socket.leave(`challenge:${challengeId}`);
        room.delete(socket.id);
        if (room.size === 0) {
          this.challengeRooms.delete(challengeId);
        }
      }
    }
  }

  handleChatMessage(socket: Socket, data: { challengeId: string; message: string }): void {
    const { challengeId, message } = data;
    
    // Broadcast message to all sockets in the challenge room
    this.io.to(`challenge:${challengeId}`).emit('chat_message', {
      id: this.generateMessageId(),
      challengeId,
      userId: socket.data.userId || 'anonymous',
      username: socket.data.username || 'Anonymous',
      message,
      timestamp: new Date().toISOString(),
      isSystemMessage: false
    });
    
    console.log(`Chat message in challenge ${challengeId}: ${message}`);
  }

  handleDisconnect(socket: Socket): void {
    this.leaveAllChallenges(socket);
  }

  broadcastToChallenge(challengeId: string, event: string, data: any): void {
    this.io.to(`challenge:${challengeId}`).emit(event, data);
  }

  broadcastRankingUpdate(challengeId: string, ranking: any): void {
    this.broadcastToChallenge(challengeId, 'ranking_update', {
      type: 'ranking_update',
      data: ranking,
      timestamp: new Date().toISOString()
    });
  }

  broadcastChallengeUpdate(challengeId: string, challenge: any): void {
    this.broadcastToChallenge(challengeId, 'challenge_update', {
      type: 'challenge_update',
      data: challenge,
      timestamp: new Date().toISOString()
    });
  }

  broadcastElimination(challengeId: string, eliminatedParticipant: any): void {
    this.broadcastToChallenge(challengeId, 'elimination', {
      type: 'elimination',
      data: {
        eliminatedParticipant,
        message: `${eliminatedParticipant.username} has been eliminated!`
      },
      timestamp: new Date().toISOString()
    });
  }

  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
