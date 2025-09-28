import React, { useState, useEffect } from 'react';
import { 
  WalletIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { connectPeraWallet } from '../utils/wallet';

interface WalletConnectProps {
  onConnect: (address: string) => void;
}

const WalletConnect: React.FC<WalletConnectProps> = ({ onConnect }) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPeraAvailable, setIsPeraAvailable] = useState(false);

  useEffect(() => {
    // Check if Pera Wallet is available
    const checkPeraWallet = () => {
      if (typeof window !== 'undefined' && (window as any).PeraWalletConnect) {
        setIsPeraAvailable(true);
      }
    };

    checkPeraWallet();
  }, []);

  const connectPera = async () => {
    setIsConnecting(true);
    setError(null);

    try {
      // Start connection process - this will show QR code or reconnect
      const accounts = await connectPeraWallet();
      console.log('Received accounts:', accounts);
      
      if (accounts && accounts.length > 0) {
        // Handle both string array and object array formats
        const address = typeof accounts[0] === 'string' ? accounts[0] : accounts[0].address;
        console.log('Connecting with address:', address);
        onConnect(address);
      } else {
        console.error('No valid accounts found:', accounts);
        throw new Error('No valid accounts found');
      }
    } catch (err: any) {
      console.error('Pera Wallet connection error:', err);
      setError(err.message || 'Failed to connect to Pera Wallet');
    } finally {
      setIsConnecting(false);
    }
  };


  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <WalletIcon className="mx-auto h-12 w-12 text-blue-600" />
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Connect Your Wallet
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Connect your Algorand wallet to start participating in challenges
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="space-y-4">
            {/* Pera Wallet Button */}
            <button
              onClick={connectPera}
              disabled={isConnecting}
              className="w-full flex justify-center items-center px-4 py-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isConnecting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Waiting for QR Scan...
                </>
              ) : (
                <>
                  <WalletIcon className="w-5 h-5 mr-2" />
                  Connect Pera Wallet
                </>
              )}
            </button>

            {/* QR Code Instructions */}
            {isConnecting && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="text-center">
                  <div className="text-blue-800 font-medium mb-2">QR Code Generated!</div>
                  <p className="text-sm text-blue-700 mb-3">
                    Open Pera Wallet on your phone and scan the QR code to connect.
                  </p>
                  <div className="text-xs text-blue-600">
                    Make sure your phone and computer are on the same network.
                  </div>
                </div>
              </div>
            )}


            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex">
                  <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
                  <div className="ml-3">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Pera Wallet Not Available */}
            {!isPeraAvailable && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex">
                  <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
                  <div className="ml-3">
                    <p className="text-sm text-yellow-800">
                      <strong>Pera Wallet Required:</strong> Please install Pera Wallet to use this application.
                    </p>
                    <button
                      onClick={() => window.open('https://perawallet.app/', '_blank')}
                      className="mt-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                    >
                      Install Pera Wallet
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Supported Wallets */}
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Supported Wallets</h3>
              <div className="space-y-2">
                <div className="flex items-center text-sm text-gray-600">
                  <CheckCircleIcon className="w-4 h-4 text-green-500 mr-2" />
                  Pera Wallet
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletConnect;
