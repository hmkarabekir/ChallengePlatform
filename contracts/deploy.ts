import algosdk from 'algosdk';
import { AlgorandClient, Config } from '@algorandfoundation/algokit-utils';
import { HabitTrackerChallenge } from './HabitTrackerChallenge.algo';

// Environment variables
const ALGOD_SERVER = process.env.ALGOD_SERVER || 'https://testnet-api.algonode.cloud';
const ALGOD_TOKEN = process.env.ALGOD_TOKEN || '';
const DEPLOYER_MNEMONIC = process.env.DEPLOYER_MNEMONIC || '';

interface DeployResult {
  success: boolean;
  appId?: number;
  appAddress?: string;
  txnId?: string;
  error?: string;
}

export class ContractDeployer {
  private algorandClient: AlgorandClient;
  private deployer: algosdk.Account;

  constructor() {
    // Initialize AlgorandClient
    this.algorandClient = AlgorandClient.fromConfig({
      algodConfig: {
        server: ALGOD_SERVER,
        port: 443,
        token: ALGOD_TOKEN,
      },
      indexerConfig: {
        server: ALGOD_SERVER.replace('api', 'idx2'),
        port: 443,
        token: ALGOD_TOKEN,
      },
    });

    // Initialize deployer account
    if (!DEPLOYER_MNEMONIC) {
      throw new Error('DEPLOYER_MNEMONIC environment variable is required');
    }
    this.deployer = algosdk.mnemonicToSecretKey(DEPLOYER_MNEMONIC);
  }

  /**
   * Deploy the HabitTrackerChallenge contract
   */
  async deployContract(): Promise<DeployResult> {
    try {
      console.log('🚀 Starting contract deployment...');
      console.log(`Deployer address: ${this.deployer.addr}`);
      console.log(`Algod server: ${ALGOD_SERVER}`);

      // Check deployer balance
      const accountInfo = await this.algorandClient.client.algod.accountInformation(this.deployer.addr).do();
      const balance = accountInfo.amount;
      console.log(`Deployer balance: ${algosdk.microAlgosToAlgos(balance)} ALGO`);

      if (balance < 1000000) { // 1 ALGO minimum
        throw new Error('Insufficient balance. Please fund your account with at least 1 ALGO.');
      }

      // Get suggested parameters
      const suggestedParams = await this.algorandClient.client.algod.getTransactionParams().do();

      // Create application creation transaction
      const appCreateTxn = algosdk.makeApplicationCreateTxnFromObject({
        from: this.deployer.addr,
        suggestedParams,
        onComplete: algosdk.OnApplicationComplete.NoOpOC,
        approvalProgram: this.getApprovalProgram(),
        clearProgram: this.getClearProgram(),
        numGlobalByteSlices: 64,
        numGlobalInts: 64,
        numLocalByteSlices: 16,
        numLocalInts: 16,
        extraPages: 1,
      });

      // Sign and send transaction
      const signedTxn = appCreateTxn.signTxn(this.deployer.sk);
      const txnResult = await this.algorandClient.client.algod.sendRawTransaction(signedTxn).do();
      
      console.log(`Transaction sent: ${txnResult.txId}`);

      // Wait for confirmation
      const confirmedTxn = await algosdk.waitForConfirmation(
        this.algorandClient.client.algod,
        txnResult.txId,
        4
      );

      const appId = confirmedTxn['application-index'];
      const appAddress = algosdk.getApplicationAddress(appId);

      console.log('✅ Contract deployed successfully!');
      console.log(`App ID: ${appId}`);
      console.log(`App Address: ${appAddress}`);
      console.log(`Transaction ID: ${txnResult.txId}`);

      return {
        success: true,
        appId,
        appAddress,
        txnId: txnResult.txId,
      };

    } catch (error) {
      console.error('❌ Deployment failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get compiled approval program
   * This would normally be compiled from the TypeScript contract
   */
  private getApprovalProgram(): Uint8Array {
    // For now, return a placeholder
    // In a real implementation, this would compile the TypeScript contract to TEAL
    console.log('⚠️  Note: This is a placeholder. In production, compile the TypeScript contract to TEAL.');
    return new Uint8Array(0);
  }

  /**
   * Get compiled clear program
   */
  private getClearProgram(): Uint8Array {
    // For now, return a placeholder
    // In a real implementation, this would compile the TypeScript contract to TEAL
    console.log('⚠️  Note: This is a placeholder. In production, compile the TypeScript contract to TEAL.');
    return new Uint8Array(0);
  }

  /**
   * Initialize the deployed contract
   */
  async initializeContract(appId: number, entryFee: number, maxParticipants: number): Promise<DeployResult> {
    try {
      console.log(`🔧 Initializing contract ${appId}...`);

      const client = new HabitTrackerChallenge(appId, this.algorandClient.client.algod);
      
      const txn = await client.createChallenge(
        algosdk.algoToMicroAlgos(entryFee),
        Math.floor(Date.now() / 1000) + 3600, // Start in 1 hour
        maxParticipants,
        'Sample Challenge',
        'A sample habit tracker challenge',
        { sender: this.deployer.addr }
      );

      const signedTxn = txn.signTxn(this.deployer.sk);
      const txnResult = await this.algorandClient.client.algod.sendRawTransaction(signedTxn).do();

      console.log('✅ Contract initialized successfully!');
      console.log(`Initialization transaction: ${txnResult.txId}`);

      return {
        success: true,
        txnId: txnResult.txId,
      };

    } catch (error) {
      console.error('❌ Contract initialization failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

// Main deployment function
async function main() {
  const deployer = new ContractDeployer();
  
  // Deploy contract
  const deployResult = await deployer.deployContract();
  
  if (!deployResult.success) {
    console.error('Deployment failed:', deployResult.error);
    process.exit(1);
  }

  // Initialize contract
  if (deployResult.appId) {
    const initResult = await deployer.initializeContract(
      deployResult.appId,
      1, // 1 ALGO entry fee
      30  // Max 30 participants
    );

    if (!initResult.success) {
      console.error('Initialization failed:', initResult.error);
      process.exit(1);
    }
  }

  console.log('🎉 Deployment completed successfully!');
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

export { ContractDeployer };
