// Node.js services for challenge platform
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

import { WebSocketService } from './services/websocket';
import { CronService } from './services/cron';
import { ContractService } from './services/contract';

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));
app.use(express.json());

// Initialize services
const webSocketService = new WebSocketService(io);
const cronService = new CronService();
const contractService = new ContractService();

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    services: {
      websocket: webSocketService.isConnected(),
      cron: cronService.isRunning(),
      contract: contractService.isConnected()
    }
  });
});

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('join_challenge', (data) => {
    webSocketService.joinChallenge(socket, data.challengeId);
  });
  
  socket.on('leave_challenge', (data) => {
    webSocketService.leaveChallenge(socket, data.challengeId);
  });
  
  socket.on('chat_message', (data) => {
    webSocketService.handleChatMessage(socket, data);
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    webSocketService.handleDisconnect(socket);
  });
});

// Start cron jobs
cronService.start();

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Node.js services running on port ${PORT}`);
  console.log(`WebSocket server ready`);
  console.log(`Cron jobs started`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  cronService.stop();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  cronService.stop();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
