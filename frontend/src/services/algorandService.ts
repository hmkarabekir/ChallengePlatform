// Algorand blockchain service for real transactions
import { 
  Algodv2, 
  Transaction, 
  makeApplicationOptInTxn,
  makePaymentTxnWithSuggestedParams,
  makeApplicationCallTxn,
  SuggestedParams,
  getApplicationAddress,
  encodeUint64,
  decodeAddress,
  mnemonicToSecretKey,
  signTransaction
} from 'algosdk';

// Algorand configuration
const ALGOD_TOKEN = '';
const ALGOD_SERVER = 'https://testnet-api.algonode.cloud';
const ALGOD_PORT = 443;
const CONTRACT_APP_ID = 746517092;

// Initialize Algod client
const algodClient = new Algodv2(ALGOD_TOKEN, ALGOD_SERVER, ALGOD_PORT);

export interface StakeTransaction {
  challengeId: string;
  stakeAmount: number; // in microALGOs
  userAddress: string;
  privateKey: Uint8Array;
}

export const algorandService = {
  // Get account info
  getAccountInfo: async (address: string) => {
    try {
      const accountInfo = await algodClient.accountInformation(address).do();
      return accountInfo;
    } catch (error) {
      console.error('Error getting account info:', error);
      throw error;
    }
  },

  // Get suggested parameters
  getSuggestedParams: async (): Promise<SuggestedParams> => {
    try {
      const params = await algodClient.getTransactionParams().do();
      return params;
    } catch (error) {
      console.error('Error getting suggested params:', error);
      throw error;
    }
  },

  // Stake ALGOs to join a challenge
  stakeToChallenge: async (stakeData: StakeTransaction): Promise<string> => {
    try {
      console.log('Staking to challenge:', stakeData);

      // Get suggested parameters
      const suggestedParams = await algorandService.getSuggestedParams();

      // Create payment transaction to contract
      const contractAddress = getApplicationAddress(CONTRACT_APP_ID);
      
      const paymentTxn = makePaymentTxnWithSuggestedParams(
        stakeData.userAddress,
        contractAddress,
        stakeData.stakeAmount,
        undefined,
        undefined,
        suggestedParams
      );

      // Create application call transaction
      const appCallTxn = makeApplicationCallTxn(
        stakeData.userAddress,
        suggestedParams,
        CONTRACT_APP_ID,
        {
          appArgs: [
            encodeUint64(parseInt(stakeData.challengeId)),
            encodeUint64(stakeData.stakeAmount)
          ],
          appOnComplete: 0 // NoOp
        }
      );

      // Group transactions
      const txnArray = [paymentTxn, appCallTxn];
      const groupId = algodClient.generateGroupID(txnArray);
      txnArray.forEach(txn => txn.group = groupId);

      // Sign transactions
      const signedTxn = signTransaction(txnArray, stakeData.privateKey);

      // Send transaction
      const { txId } = await algodClient.sendRawTransaction(signedTxn).do();
      
      console.log('Transaction sent:', txId);
      
      // Wait for confirmation
      const confirmedTxn = await algodClient.waitForConfirmation(txId, 4);
      
      console.log('Transaction confirmed:', confirmedTxn);
      
      return txId;
    } catch (error) {
      console.error('Error staking to challenge:', error);
      throw error;
    }
  },

  // Create a new challenge
  createChallenge: async (challengeData: {
    name: string;
    stakeAmount: number;
    startTime: number;
    endTime: number;
    userAddress: string;
    privateKey: Uint8Array;
  }): Promise<string> => {
    try {
      console.log('Creating challenge:', challengeData);

      const suggestedParams = await algorandService.getSuggestedParams();

      // Create application call transaction for create_challenge
      const appCallTxn = makeApplicationCallTxn(
        challengeData.userAddress,
        suggestedParams,
        CONTRACT_APP_ID,
        {
          appArgs: [
            new TextEncoder().encode(challengeData.name),
            encodeUint64(challengeData.stakeAmount),
            encodeUint64(challengeData.startTime),
            encodeUint64(challengeData.endTime)
          ],
          appOnComplete: 0 // NoOp
        }
      );

      // Sign and send transaction
      const signedTxn = signTransaction([appCallTxn], challengeData.privateKey);
      const { txId } = await algodClient.sendRawTransaction(signedTxn).do();
      
      console.log('Challenge creation transaction sent:', txId);
      
      // Wait for confirmation
      await algodClient.waitForConfirmation(txId, 4);
      
      return txId;
    } catch (error) {
      console.error('Error creating challenge:', error);
      throw error;
    }
  },

  // Get challenge data from blockchain
  getChallengeData: async (challengeId: string) => {
    try {
      // Get application global state
      const appInfo = await algodClient.getApplicationByID(CONTRACT_APP_ID).do();
      console.log('Application info:', appInfo);
      
      // TODO: Parse challenge data from global state
      return null;
    } catch (error) {
      console.error('Error getting challenge data:', error);
      throw error;
    }
  }
};

export default algorandService;
