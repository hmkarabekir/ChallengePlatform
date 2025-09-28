import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { disconnectPeraWallet } from '../utils/wallet';

interface AuthContextType {
  user: User | null;
  connectWallet: (address: string) => void;
  disconnectWallet: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored wallet connection
    const storedAddress = localStorage.getItem('walletAddress');
    if (storedAddress) {
      try {
        // Create user from wallet address
        const userData: User = {
          id: `user-${storedAddress.slice(-8)}`,
          address: storedAddress,
          username: `User_${storedAddress.slice(-6)}`,
          email: `${storedAddress.slice(-8)}@algorand.wallet`,
          createdAt: new Date(),
          healthData: {
            steps: 0,
            activeMinutes: 0,
            caloriesBurned: 0,
            lastUpdated: new Date()
          }
        };
        setUser(userData);
      } catch (error) {
        console.error('Error parsing stored wallet data:', error);
        localStorage.removeItem('walletAddress');
      }
    }
    setIsLoading(false);
  }, []);

  const connectWallet = (address: string) => {
    if (!address || typeof address !== 'string') {
      console.error('Invalid address provided:', address);
      return;
    }
    
    const userData: User = {
      id: `user-${address.slice(-8)}`,
      address: address,
      username: `User_${address.slice(-6)}`,
      email: `${address.slice(-8)}@algorand.wallet`,
      createdAt: new Date(),
      healthData: {
        steps: 0,
        activeMinutes: 0,
        caloriesBurned: 0,
        lastUpdated: new Date()
      }
    };
    
    setUser(userData);
    localStorage.setItem('walletAddress', address);
  };

  const disconnectWallet = async () => {
    try {
      // Disconnect from Pera Wallet
      await disconnectPeraWallet();
    } catch (error) {
      console.error('Error disconnecting from Pera Wallet:', error);
    } finally {
      // Always clear local state
      setUser(null);
      localStorage.removeItem('walletAddress');
    }
  };

  const value = {
    user,
    connectWallet,
    disconnectWallet,
    isLoading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
