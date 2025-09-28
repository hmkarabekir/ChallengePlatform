// Test setup file
import { AlgorandClient, Config } from '@algorandfoundation/algokit-utils';

// Global test setup
beforeAll(async () => {
  // Initialize Algorand client for tests
  const algorandClient = AlgorandClient.fromConfig({
    algodConfig: Config.getConfigFromEnvironmentOrLocalNet().algodConfig,
    indexerConfig: Config.getConfigFromEnvironmentOrLocalNet().indexerConfig,
  });

  // Make client available globally for tests
  (global as any).algorandClient = algorandClient;
});

// Global test teardown
afterAll(async () => {
  // Cleanup if needed
});

// Test timeout
jest.setTimeout(30000);
