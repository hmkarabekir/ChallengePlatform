// Algorand wallet utilities
import { PeraWalletConnect } from '@perawallet/connect';

// Initialize Pera Wallet
export const peraWallet = new PeraWalletConnect({
  chainId: 416002, // Testnet
  shouldShowSignTxnToast: false
});

// Wallet connection types
export interface WalletAccount {
  address: string;
  name?: string;
}

export interface WalletConnection {
  accounts: WalletAccount[];
  connected: boolean;
}

// Check if wallet is connected
export const isWalletConnected = (): boolean => {
  return peraWallet.isConnected;
};

// Get connected accounts
export const getConnectedAccounts = async (): Promise<WalletAccount[]> => {
  try {
    const accounts = await peraWallet.reconnectSession();
    // Convert string array to WalletAccount array
    if (Array.isArray(accounts)) {
      return accounts.map((account: any) => 
        typeof account === 'string' 
          ? { address: account, name: `Account ${account.slice(-6)}` }
          : account
      );
    }
    return [];
  } catch (error) {
    console.error('Error getting connected accounts:', error);
    return [];
  }
};

// Connect to Pera Wallet
export const connectPeraWallet = async (): Promise<WalletAccount[]> => {
  try {
    // Check if already connected
    if (peraWallet.isConnected) {
      console.log('Wallet already connected, getting accounts...');
      // Get accounts by calling connect again (it returns existing accounts if connected)
      const accounts = await peraWallet.connect();
      console.log('Already connected accounts:', accounts);
      
      // Convert string array to object array if needed
      const formattedAccounts = accounts.map((account: any) => 
        typeof account === 'string' 
          ? { address: account, name: `Account ${account.slice(-6)}` }
          : account
      );
      
      return formattedAccounts;
    }
    
    // Connect fresh - this will show QR code
    console.log('Connecting to Pera Wallet...');
    const accounts = await peraWallet.connect();
    console.log('Connect result:', accounts);
    
    // Convert string array to object array if needed
    const formattedAccounts = accounts.map((account: any) => 
      typeof account === 'string' 
        ? { address: account, name: `Account ${account.slice(-6)}` }
        : account
    );
    
    return formattedAccounts;
  } catch (error) {
    console.error('Error connecting to Pera Wallet:', error);
    throw error;
  }
};

// Disconnect from Pera Wallet
export const disconnectPeraWallet = async (): Promise<void> => {
  try {
    await peraWallet.disconnect();
  } catch (error) {
    console.error('Error disconnecting from Pera Wallet:', error);
    throw error;
  }
};

// Sign transaction
export const signTransaction = async (txn: any): Promise<Uint8Array> => {
  try {
    const signedTxn = await peraWallet.signTransaction([txn]);
    return signedTxn[0];
  } catch (error) {
    console.error('Error signing transaction:', error);
    throw error;
  }
};

