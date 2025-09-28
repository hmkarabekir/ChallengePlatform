import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';

interface WebSocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  joinChallenge: (challengeId: string) => void;
  leaveChallenge: (challengeId: string) => void;
  sendMessage: (challengeId: string, message: string) => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

interface WebSocketProviderProps {
  children: ReactNode;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // WebSocket disabled for now - using smart contracts only
    console.log('WebSocket disabled - using smart contracts only');
    setIsConnected(false);
  }, []);

  const joinChallenge = (challengeId: string) => {
    if (socket) {
      socket.emit('join_challenge', { challengeId });
    }
  };

  const leaveChallenge = (challengeId: string) => {
    if (socket) {
      socket.emit('leave_challenge', { challengeId });
    }
  };

  const sendMessage = (challengeId: string, message: string) => {
    if (socket) {
      socket.emit('chat_message', { challengeId, message });
    }
  };

  const value = {
    socket,
    isConnected,
    joinChallenge,
    leaveChallenge,
    sendMessage,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};
