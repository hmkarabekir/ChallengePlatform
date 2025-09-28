// Pera Wallet Service for real blockchain transactions
import { peraWallet } from '../utils/wallet';
import algosdk from 'algosdk';

// Algorand Configuration
const ALGOD_TOKEN = '';
const ALGOD_SERVER = 'https://testnet-api.algonode.cloud';
const ALGOD_PORT = 443;

// Initialize Algorand client
const algodClient = new algosdk.Algodv2(ALGOD_TOKEN, ALGOD_SERVER, ALGOD_PORT);


export const peraWalletService = {
  // Check wallet connection status
  isWalletConnected: (): boolean => {
    return peraWallet.isConnected;
  },

  // Get user's connected address
  getConnectedAddress: async (): Promise<string | null> => {
    try {
      // Check if wallet is connected
      if (peraWallet.isConnected) {
        // Try to get accounts from reconnect session first
        try {
          const accounts = await peraWallet.reconnectSession();
          console.log('Reconnected accounts:', accounts);
          
          if (Array.isArray(accounts) && accounts.length > 0) {
            const firstAccount = accounts[0];
            return typeof firstAccount === 'string' ? firstAccount : (firstAccount as any).address;
          }
        } catch (reconnectError) {
          console.log('Reconnect failed, trying connect:', reconnectError);
          // If reconnect fails, try connect
          const accounts = await peraWallet.connect();
          console.log('Connected accounts:', accounts);
          
          if (Array.isArray(accounts) && accounts.length > 0) {
            const firstAccount = accounts[0];
            return typeof firstAccount === 'string' ? firstAccount : (firstAccount as any).address;
          }
        }
      }
      return null;
    } catch (error) {
      console.error('Error getting connected address:', error);
      return null;
    }
  },

  // Stake to challenge with real transaction
  stakeToChallenge: async (challengeId: string, stakeAmount: number, userAddress?: string): Promise<{ success: boolean; message: string; txId?: string }> => {
    try {
      // Validate inputs
      if (!challengeId) {
        return { success: false, message: 'Challenge ID is required' };
      }
      
      if (stakeAmount <= 0) {
        return { success: false, message: 'Stake amount must be greater than 0' };
      }

      // Use provided address or get from wallet
      let address = userAddress;
      if (!address) {
        // Check if wallet is connected
        if (!peraWallet.isConnected) {
          return { success: false, message: 'Please connect your wallet first' };
        }
        
        try {
          // Try to get accounts from reconnect session first
          const accounts = await peraWallet.reconnectSession();
          if (Array.isArray(accounts) && accounts.length > 0) {
            const firstAccount = accounts[0];
            address = typeof firstAccount === 'string' ? firstAccount : (firstAccount as any).address;
          } else {
            // If reconnect fails, try connect
            const connectAccounts = await peraWallet.connect();
            if (Array.isArray(connectAccounts) && connectAccounts.length > 0) {
              const firstAccount = connectAccounts[0];
              address = typeof firstAccount === 'string' ? firstAccount : (firstAccount as any).address;
            }
          }
        } catch (walletError) {
          console.error('Wallet connection error:', walletError);
          return { success: false, message: 'Failed to get wallet address. Please try reconnecting your wallet.' };
        }
      }
      
      if (!address) {
        return { success: false, message: 'Could not get wallet address. Please connect your wallet.' };
      }

      console.log('Final address for transaction:', address);
      console.log('Stake amount:', stakeAmount);

      // Check if account has sufficient balance
      const balanceCheck = await peraWalletService.hasSufficientBalance(address, stakeAmount);
      if (!balanceCheck.sufficient) {
        return { 
          success: false, 
          message: `Insufficient balance. You have ${balanceCheck.balance} microAlgos but need ${balanceCheck.required} microAlgos (including transaction fee).` 
        };
      }

      console.log('Balance check passed:', balanceCheck);

      // Get suggested parameters
      const suggestedParams = await algodClient.getTransactionParams().do();
      console.log('Suggested params:', suggestedParams);
      
      // Convert BigInt values to numbers (this is necessary for algosdk)
      const processedParams = {
        ...suggestedParams,
        fee: Number(suggestedParams.fee),
        firstValid: Number(suggestedParams.firstValid),
        lastValid: Number(suggestedParams.lastValid)
      };
      
      console.log('Processed params with BigInt conversion:', processedParams);
      console.log('genesisHash type:', typeof processedParams.genesisHash);
      console.log('genesisHash value:', processedParams.genesisHash);
      console.log('All processedParams keys:', Object.keys(processedParams));
      console.log('All processedParams values:', Object.values(processedParams));
      
      console.log('Creating transaction with address:', address);
      
      // Validate address before creating transaction
      if (!address || typeof address !== 'string' || address.length === 0) {
        throw new Error('Invalid address: address is null, undefined, or empty');
      }
      
      // Validate address format (Algorand addresses are 58 characters)
      if (address.length !== 58) {
        console.warn(`Address length is ${address.length}, expected 58 characters`);
      }
      
      // Create payment transaction
      let paymentTxn;
      try {
        console.log('Attempting to create transaction with params:', {
          from: address,
          to: address,
          amount: stakeAmount,
          suggestedParams: processedParams
        });
        
        // Try creating transaction with completely clean parameters
        const cleanParams = {
          fee: 1000, // Use a fixed fee
          firstValid: processedParams.firstValid,
          lastValid: processedParams.lastValid,
          genesisID: 'testnet-v1.0' // Use a fixed genesis ID
        };
        
        console.log('Clean params for transaction:', cleanParams);
        
        paymentTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
          from: address,
          to: address, // For now, send to same address (will be contract address)
          amount: stakeAmount,
          note: new TextEncoder().encode(`Stake to challenge ${challengeId}`),
          suggestedParams: cleanParams
        } as any);
        console.log('Transaction created successfully with clean params:', paymentTxn);
      } catch (txnError) {
        console.error('Transaction creation with clean params failed, trying ultra minimal params:', txnError);
        
        // Fallback: try with even more minimal parameters
        try {
          console.log('Trying with even more minimal parameters...');
          const ultraMinimalParams = {
            fee: 1000, // Use a fixed fee
            firstValid: processedParams.firstValid,
            lastValid: processedParams.lastValid
          };
          
          console.log('Ultra minimal params:', ultraMinimalParams);
          
          paymentTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
            from: address,
            to: address,
            amount: stakeAmount,
            note: new TextEncoder().encode(`Stake to challenge ${challengeId}`),
            suggestedParams: ultraMinimalParams
          } as any);
          console.log('Transaction created successfully with ultra minimal params:', paymentTxn);
        } catch (fallbackError) {
          console.error('Ultra minimal params failed, trying individual parameter approach:', fallbackError);
          
          // Final fallback: try with individual parameters
          try {
            console.log('Trying with individual parameters...');
            
            // Create a new transaction with individual parameters
            const txn = new algosdk.Transaction({
              to: address,
              amount: stakeAmount,
              fee: 1000,
              firstRound: processedParams.firstValid,
              lastRound: processedParams.lastValid,
              genesisID: 'testnet-v1.0',
              note: new TextEncoder().encode(`Stake to challenge ${challengeId}`)
            } as any);
            
            paymentTxn = txn;
            console.log('Transaction created successfully with individual parameters:', paymentTxn);
          } catch (individualError) {
            console.error('All transaction creation methods failed:', {
              cleanParamsError: txnError,
              ultraMinimalParamsError: fallbackError,
              individualParamsError: individualError,
              processedParams: processedParams,
              address: address,
              stakeAmount: stakeAmount,
              challengeId: challengeId,
              addressType: typeof address,
              addressLength: address ? address.length : 'null/undefined'
            });
            throw new Error(`Failed to create transaction: ${txnError instanceof Error ? txnError.message : 'Unknown error'}`);
          }
        }
      }

      console.log('Transaction created, signing...');
      console.log('Payment transaction:', paymentTxn);

      // Double-check wallet connection before signing
      if (!peraWallet.isConnected) {
        throw new Error('Wallet disconnected during transaction. Please reconnect your wallet.');
      }

      // Sign and send transaction using Pera Wallet
      const signedTxn = await peraWallet.signTransaction([paymentTxn] as any);
      
      console.log('Transaction signed, result:', signedTxn);
      console.log('Signed transaction type:', typeof signedTxn);
      console.log('Signed transaction length:', Array.isArray(signedTxn) ? signedTxn.length : 'Not an array');
      
      // Validate signed transaction
      if (!signedTxn) {
        throw new Error('Transaction signing failed - no result returned');
      }
      
      if (!Array.isArray(signedTxn)) {
        throw new Error('Transaction signing failed - expected array result');
      }
      
      if (signedTxn.length === 0) {
        throw new Error('Transaction signing failed - empty result array');
      }
      
      if (!signedTxn[0]) {
        throw new Error('Transaction signing failed - first element is null/undefined');
      }
      
      console.log('Transaction signed, sending to blockchain...');
      
      // Send transaction to blockchain
      const response = await algodClient.sendRawTransaction(signedTxn[0]).do();
      const txId = response.txid;
      
      console.log('Transaction sent, waiting for confirmation...', txId);
      
      // Wait for confirmation
      await algosdk.waitForConfirmation(algodClient, txId, 4);
      
      console.log('Transaction confirmed!');
      
      return { 
        success: true, 
        message: `Successfully staked ${stakeAmount} microAlgos!`,
        txId: txId
      };
      
    } catch (error) {
      console.error('Stake transaction failed:', error);
      
      // Provide more specific error messages
      let errorMessage = 'Stake transaction failed';
      if (error instanceof Error) {
        if (error.message.includes('User rejected')) {
          errorMessage = 'Transaction was cancelled by user';
        } else if (error.message.includes('insufficient')) {
          errorMessage = 'Insufficient balance for transaction';
        } else if (error.message.includes('network')) {
          errorMessage = 'Network error. Please try again.';
        } else {
          errorMessage = `Stake transaction failed: ${error.message}`;
        }
      }
      
      return { 
        success: false, 
        message: errorMessage
      };
    }
  },

  // Join challenge with real transaction
  joinChallenge: async (challengeId: string, stakeAmount: number, contractAddress?: string): Promise<{ success: boolean; message: string; txId?: string }> => {
    try {
      // Validate inputs
      if (!challengeId) {
        return { success: false, message: 'Challenge ID is required' };
      }
      
      if (stakeAmount <= 0) {
        return { success: false, message: 'Stake amount must be greater than 0' };
      }

      // Get connected address
      let address: string | null = null;
      
      // Check if wallet is connected
      if (!peraWallet.isConnected) {
        return { success: false, message: 'Please connect your wallet first' };
      }
      
      try {
        // Try to get accounts from reconnect session first
        const accounts = await peraWallet.reconnectSession();
        if (Array.isArray(accounts) && accounts.length > 0) {
          const firstAccount = accounts[0];
          address = typeof firstAccount === 'string' ? firstAccount : (firstAccount as any).address;
        } else {
          // If reconnect fails, try connect
          const connectAccounts = await peraWallet.connect();
          if (Array.isArray(connectAccounts) && connectAccounts.length > 0) {
            const firstAccount = connectAccounts[0];
            address = typeof firstAccount === 'string' ? firstAccount : (firstAccount as any).address;
          }
        }
      } catch (walletError) {
        console.error('Wallet connection error:', walletError);
        return { success: false, message: 'Failed to get wallet address. Please try reconnecting your wallet.' };
      }
      
      if (!address) {
        return { success: false, message: 'Could not get wallet address. Please connect your wallet.' };
      }

      console.log('Final address for transaction:', address);
      console.log('Stake amount:', stakeAmount);

      // Check if account has sufficient balance
      const balanceCheck = await peraWalletService.hasSufficientBalance(address, stakeAmount);
      if (!balanceCheck.sufficient) {
        return { 
          success: false, 
          message: `Insufficient balance. You have ${balanceCheck.balance} microAlgos but need ${balanceCheck.required} microAlgos (including transaction fee).` 
        };
      }

      console.log('Balance check passed:', balanceCheck);

      // Get suggested parameters
      const suggestedParams = await algodClient.getTransactionParams().do();
      
      // Convert BigInt values to numbers (this is necessary for algosdk)
      const processedParams = {
        ...suggestedParams,
        fee: Number(suggestedParams.fee),
        firstValid: Number(suggestedParams.firstValid),
        lastValid: Number(suggestedParams.lastValid)
      };

      // Create payment transaction to contract (or same address for now)
      const targetAddress = contractAddress || address;
      let paymentTxn;
      try {
        paymentTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
          from: address,
          to: targetAddress,
          amount: stakeAmount,
          note: new TextEncoder().encode(`Join challenge ${challengeId}`),
          suggestedParams: processedParams
        } as any);
        console.log('Join challenge transaction created successfully:', paymentTxn);
      } catch (txnError) {
        console.error('Join challenge transaction creation failed:', txnError);
        throw new Error(`Failed to create join challenge transaction: ${txnError instanceof Error ? txnError.message : 'Unknown error'}`);
      }

      // Double-check wallet connection before signing
      if (!peraWallet.isConnected) {
        throw new Error('Wallet disconnected during transaction. Please reconnect your wallet.');
      }

      // Sign and send transaction using Pera Wallet
      const signedTxn = await peraWallet.signTransaction([paymentTxn] as any);
      
      console.log('Join challenge - Transaction signed, result:', signedTxn);
      console.log('Join challenge - Signed transaction type:', typeof signedTxn);
      console.log('Join challenge - Signed transaction length:', Array.isArray(signedTxn) ? signedTxn.length : 'Not an array');
      
      // Validate signed transaction
      if (!signedTxn) {
        throw new Error('Transaction signing failed - no result returned');
      }
      
      if (!Array.isArray(signedTxn)) {
        throw new Error('Transaction signing failed - expected array result');
      }
      
      if (signedTxn.length === 0) {
        throw new Error('Transaction signing failed - empty result array');
      }
      
      if (!signedTxn[0]) {
        throw new Error('Transaction signing failed - first element is null/undefined');
      }
      
      // Send transaction to blockchain
      const response = await algodClient.sendRawTransaction(signedTxn[0]).do();
      const txId = response.txid;
      
      // Wait for confirmation
      await algosdk.waitForConfirmation(algodClient, txId, 4);
      
      return { 
        success: true, 
        message: `Successfully joined challenge with ${stakeAmount} microAlgos stake!`,
        txId: txId
      };
      
    } catch (error) {
      console.error('Join challenge transaction failed:', error);
      
      // Provide more specific error messages
      let errorMessage = 'Join challenge failed';
      if (error instanceof Error) {
        if (error.message.includes('User rejected')) {
          errorMessage = 'Transaction was cancelled by user';
        } else if (error.message.includes('insufficient')) {
          errorMessage = 'Insufficient balance for transaction';
        } else if (error.message.includes('network')) {
          errorMessage = 'Network error. Please try again.';
        } else {
          errorMessage = `Join challenge failed: ${error.message}`;
        }
      }
      
      return { 
        success: false, 
        message: errorMessage
      };
    }
  },

  // Get account balance
  getAccountBalance: async (address: string): Promise<number> => {
    try {
      const accountInfo = await algodClient.accountInformation(address).do();
      return Number(accountInfo.amount);
    } catch (error) {
      console.error('Error getting account balance:', error);
      return 0;
    }
  },

  // Check if account has sufficient balance for transaction
  hasSufficientBalance: async (address: string, amount: number): Promise<{ sufficient: boolean; balance: number; required: number }> => {
    try {
      const balance = await peraWalletService.getAccountBalance(address);
      const required = amount + 1000; // Add 1000 microAlgos for transaction fee
      return {
        sufficient: balance >= required,
        balance: balance,
        required: required
      };
    } catch (error) {
      console.error('Error checking balance:', error);
      return {
        sufficient: false,
        balance: 0,
        required: amount + 1000
      };
    }
  },

  // Debug method to test wallet connection and get detailed info
  debugWalletStatus: async (): Promise<{ connected: boolean; address: string | null; balance: number; error?: string }> => {
    try {
      const connected = peraWallet.isConnected;
      console.log('Wallet connected:', connected);
      
      if (!connected) {
        return { connected: false, address: null, balance: 0, error: 'Wallet not connected' };
      }

      const address = await peraWalletService.getConnectedAddress();
      console.log('Wallet address:', address);
      
      if (!address) {
        return { connected: true, address: null, balance: 0, error: 'Could not get address' };
      }

      const balance = await peraWalletService.getAccountBalance(address);
      console.log('Account balance:', balance);

      return { connected: true, address, balance };
    } catch (error) {
      console.error('Debug wallet status error:', error);
      return { 
        connected: false, 
        address: null, 
        balance: 0, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  },

  // Test transaction signing without sending
  testTransactionSigning: async (): Promise<{ success: boolean; message: string; signedTxn?: any }> => {
    try {
      // Get connected address
      const address = await peraWalletService.getConnectedAddress();
      if (!address) {
        return { success: false, message: 'Please connect your wallet first' };
      }

      // Get suggested parameters
      const suggestedParams = await algodClient.getTransactionParams().do();
      
      // Convert BigInt values to numbers (this is necessary for algosdk)
      const processedParams = {
        ...suggestedParams,
        fee: Number(suggestedParams.fee),
        firstValid: Number(suggestedParams.firstValid),
        lastValid: Number(suggestedParams.lastValid)
      };

      // Create a test transaction (1 microAlgo to self)
      const testTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        from: address,
        to: address,
        amount: 1,
        note: new TextEncoder().encode('Test transaction'),
        suggestedParams: processedParams
      } as any);

      console.log('Test transaction created:', testTxn);

      // Check wallet connection
      if (!peraWallet.isConnected) {
        return { success: false, message: 'Wallet not connected' };
      }

      // Try to sign the transaction
      const signedTxn = await peraWallet.signTransaction([testTxn] as any);
      
      console.log('Test transaction signed:', signedTxn);
      console.log('Signed transaction type:', typeof signedTxn);
      console.log('Is array:', Array.isArray(signedTxn));
      console.log('Length:', Array.isArray(signedTxn) ? signedTxn.length : 'N/A');

      return { 
        success: true, 
        message: 'Transaction signing test successful',
        signedTxn: signedTxn
      };
    } catch (error) {
      console.error('Test transaction signing failed:', error);
      return { 
        success: false, 
        message: 'Test transaction signing failed: ' + (error as Error).message 
      };
    }
  }
};
