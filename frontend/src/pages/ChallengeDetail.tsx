import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { 
  ArrowLeftIcon,
  UsersIcon, 
  CurrencyDollarIcon,
  ClockIcon,
  TrophyIcon,
  ChatBubbleLeftRightIcon,
  PlusIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

import { challengeApi, taskApi, chatApi, rankingApi } from '../services/api';
import { Task, ChatMessage, WeeklyRanking } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAuth } from '../contexts/AuthContext';

const ChallengeDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'chat' | 'rankings'>('overview');
  const [stakeAmount, setStakeAmount] = useState<number>(0);

  const { data: challenge, isLoading: challengeLoading } = useQuery({
    queryKey: ['challenge', id],
    queryFn: () => challengeApi.getChallenge(id!),
    enabled: !!id
  });

  const { data: tasks, isLoading: tasksLoading } = useQuery({
    queryKey: ['tasks', id],
    queryFn: () => taskApi.getTasks(id!),
    enabled: !!id
  });

  const { data: messages, isLoading: messagesLoading } = useQuery({
    queryKey: ['messages', id],
    queryFn: () => chatApi.getMessages(id!),
    enabled: !!id && activeTab === 'chat'
  });

  const { data: rankings, isLoading: rankingsLoading } = useQuery({
    queryKey: ['rankings', id],
    queryFn: () => rankingApi.getWeeklyRankings(id!),
    enabled: !!id && activeTab === 'rankings'
  });

  // TypeScript Smart Contract Integration
  // TODO: Implement real smart contract integration
  // const [contractInfo, setContractInfo] = useState<any>(null);
  // const [participantState, setParticipantState] = useState<any>(null);

  // Stake function
  const handleStake = async () => {
    if (!challenge || stakeAmount <= 0) return;
    
    try {
      // Get user address from auth context
      const userAddress = user?.address || 'GGL3NXK742UDBECIESQW7JAXMXFEL5H7QW7TTRPDEGDTXK5KUI5CWMQGSM';
      console.log('User from auth context:', user);
      console.log('User address for stake:', userAddress);
      
      const result = await challengeApi.stakeToChallenge(challenge.id, stakeAmount, userAddress);
      
      if (result.success) {
        alert(`✅ ${result.message}\nTransaction ID: ${result.txId}`);
        setStakeAmount(0);
        // Refresh challenge data
        window.location.reload();
      } else {
        alert(`❌ ${result.message}`);
      }
    } catch (error) {
      alert(`❌ Error: ${(error as Error).message}`);
    }
  };

  const handleJoinChallenge = async () => {
    try {
      // Pass the required stake amount from the challenge
      const stakeAmount = challenge?.stakeAmount || 0;
      await challengeApi.joinChallenge(id!, stakeAmount);
      // Refresh challenge data
      window.location.reload();
    } catch (error) {
      console.error('Error joining challenge:', error);
    }
  };

  // Debug function to test wallet
  const handleDebugWallet = async () => {
    try {
      const { peraWalletService } = await import('../services/peraWalletService');
      
      console.log('=== DEBUGGING WALLET ===');
      
      // Test wallet status
      const status = await peraWalletService.debugWalletStatus();
      console.log('Wallet Status:', status);
      
      // Test transaction signing
      const signingTest = await peraWalletService.testTransactionSigning();
      console.log('Signing Test:', signingTest);
      
      alert(`Wallet Debug Complete!\n\nStatus: ${JSON.stringify(status, null, 2)}\n\nSigning Test: ${JSON.stringify(signingTest, null, 2)}`);
    } catch (error) {
      console.error('Debug wallet error:', error);
      alert(`❌ Debug Error: ${(error as Error).message}`);
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    try {
      await taskApi.completeTask(taskId);
      // Refresh tasks
      window.location.reload();
    } catch (error) {
      console.error('Error completing task:', error);
    }
  };

  if (challengeLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 text-lg mb-4">Challenge not found</div>
        <button 
          onClick={() => navigate('/challenges')}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Back to Challenges
        </button>
      </div>
    );
  }

  const isActive = challenge.status === 'active';
  const isUpcoming = challenge.status === 'upcoming';

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/challenges')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeftIcon className="w-5 h-5" />
          Back to Challenges
        </button>
        
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{challenge.name}</h1>
            <p className="text-gray-600 text-lg">{challenge.description}</p>
          </div>
          
          <div className="flex gap-3">
            {isActive && (
              <button
                onClick={() => navigate(`/challenges/${id}/chat`)}
                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 flex items-center gap-2"
              >
                <ChatBubbleLeftRightIcon className="w-5 h-5" />
                Chat
              </button>
            )}
            
            {(isUpcoming || isActive) && (
              <div className="flex flex-col gap-4">
                {isUpcoming && (
                  <button
                    onClick={handleJoinChallenge}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
                  >
                    <PlusIcon className="w-5 h-5" />
                    Join Challenge
                  </button>
                )}
                
                {/* Stake Section */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Stake ALGOs</h4>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={stakeAmount}
                      onChange={(e) => setStakeAmount(Number(e.target.value))}
                      placeholder="Amount in microALGOs"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                    <button
                      onClick={handleStake}
                      disabled={stakeAmount <= 0}
                      className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm"
                    >
                      Stake
                    </button>
                    <button
                      onClick={handleDebugWallet}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm ml-2"
                    >
                      Debug Wallet
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    1 ALGO = 1,000,000 microALGOs
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Challenge Stats */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <div className="flex items-center gap-3 mb-2">
            <CurrencyDollarIcon className="w-6 h-6 text-green-600" />
            <span className="text-sm text-gray-600">Stake Amount</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {challenge.stakeAmount.toLocaleString()} μALGO
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg">
          <div className="flex items-center gap-3 mb-2">
            <UsersIcon className="w-6 h-6 text-blue-600" />
            <span className="text-sm text-gray-600">Participants</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {challenge.currentParticipants}/{challenge.maxParticipants}
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg">
          <div className="flex items-center gap-3 mb-2">
            <TrophyIcon className="w-6 h-6 text-yellow-600" />
            <span className="text-sm text-gray-600">Prize Pool</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {challenge.poolAmount.toLocaleString()} μALGO
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg">
          <div className="flex items-center gap-3 mb-2">
            <ClockIcon className="w-6 h-6 text-purple-600" />
            <span className="text-sm text-gray-600">Duration</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">21 Days</div>
        </div>
      </div>

      {/* TypeScript Smart Contract Information */}
      {challenge.contractAddress && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 mb-8 border border-blue-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">TS</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">TypeScript Smart Contract</h3>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Contract Details</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Contract Address:</span>
                  <span className="text-sm font-mono text-gray-900 break-all">
                    {challenge.contractAddress}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Contract ID:</span>
                  <span className="text-sm font-mono text-gray-900">
                    {challenge.contractId || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Status:</span>
                  <span className={`text-sm font-medium ${
                    challenge.isActive ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {challenge.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Current Week:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {challenge.currentWeek || 'N/A'}
                  </span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Weekly Pools</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Week 1 Pool:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {challenge.week1Pool?.toLocaleString() || '0'} μALGO
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Week 2 Pool:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {challenge.week2Pool?.toLocaleString() || '0'} μALGO
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Week 3 Pool:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {challenge.week3Pool?.toLocaleString() || '0'} μALGO
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-blue-100 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>TypeScript Integration:</strong> This challenge is powered by a TypeScript smart contract 
              running on Algorand blockchain. All transactions are secured and transparent.
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'tasks', label: 'Tasks' },
            { id: 'chat', label: 'Chat' },
            { id: 'rankings', label: 'Rankings' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <h3 className="text-lg font-semibold mb-4">Challenge Details</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <div className="text-sm text-gray-600 mb-1">Start Date</div>
                <div className="font-medium">
                  {challenge.startDate ? format(new Date(challenge.startDate), 'MMM dd, yyyy') : 'TBD'}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">End Date</div>
                <div className="font-medium">
                  {challenge.endDate ? format(new Date(challenge.endDate), 'MMM dd, yyyy') : 'TBD'}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">Status</div>
                <div className={`font-medium ${
                  isActive ? 'text-green-600' : 
                  isUpcoming ? 'text-blue-600' : 
                  'text-gray-600'
                }`}>
                  {challenge.status.charAt(0).toUpperCase() + challenge.status.slice(1)}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">Contract Address</div>
                <div className="font-mono text-sm">{challenge.contractAddress}</div>
              </div>
            </div>
          </div>

          {isActive && (
            <div className="bg-blue-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-2 text-blue-900">Challenge Progress</h3>
              <div className="w-full bg-blue-200 rounded-full h-2 mb-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${Math.min(100, (Date.now() - new Date(challenge.startDate).getTime()) / (21 * 24 * 60 * 60 * 1000) * 100)}%` 
                  }}
                />
              </div>
              <div className="text-sm text-blue-700">
                {Math.floor((Date.now() - new Date(challenge.startDate).getTime()) / (24 * 60 * 60 * 1000))} days completed
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'tasks' && (
        <div className="space-y-6">
          {tasksLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : (
            <div className="grid gap-4">
              {tasks?.map((task: Task) => (
                <div key={task.id} className="bg-white rounded-xl p-6 shadow-lg">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{task.title}</h3>
                      <p className="text-gray-600 mt-1">{task.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                        {task.points} points
                      </span>
                      {task.isCompleted ? (
                        <CheckCircleIcon className="w-6 h-6 text-green-500" />
                      ) : (
                        <XCircleIcon className="w-6 h-6 text-gray-400" />
                      )}
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-500">
                      Due: {format(new Date(task.dueDate), 'MMM dd, yyyy')}
                    </div>
                    
                    {!task.isCompleted && isActive && (
                      <button
                        onClick={() => handleCompleteTask(task.id)}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm"
                      >
                        Mark Complete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'chat' && (
        <div className="space-y-6">
          {messagesLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : (
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <h3 className="text-lg font-semibold mb-4">Challenge Chat</h3>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {messages?.map((message: ChatMessage) => (
                  <div key={message.id} className={`flex ${message.isSystemMessage ? 'justify-center' : ''}`}>
                    <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.isSystemMessage 
                        ? 'bg-yellow-100 text-yellow-800 text-center' 
                        : 'bg-gray-100 text-gray-900'
                    }`}>
                      <div className="text-sm font-medium">{message.username}</div>
                      <div className="text-sm">{message.message}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {format(new Date(message.timestamp), 'MMM dd, HH:mm')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'rankings' && (
        <div className="space-y-6">
          {rankingsLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : (
            <div className="space-y-6">
              {rankings?.map((ranking: WeeklyRanking) => (
                <div key={ranking.id} className="bg-white rounded-xl p-6 shadow-lg">
                  <h3 className="text-lg font-semibold mb-4">Week {ranking.week} Rankings</h3>
                  
                  <div className="space-y-3">
                    {ranking.participants.map((participant: any, index: number) => (
                      <div key={participant.participantId} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                            index === 0 ? 'bg-yellow-500' : 
                            index === 1 ? 'bg-gray-400' : 
                            index === 2 ? 'bg-orange-600' : 
                            'bg-gray-300'
                          }`}>
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-medium">{participant.username}</div>
                            <div className="text-sm text-gray-600">
                              {participant.tasksCompleted} tasks completed
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">{participant.points} points</div>
                          <div className="text-sm text-gray-600">
                            {participant.tasksMissed} missed
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {ranking.eliminatedParticipantId && (
                    <div className="mt-4 p-4 bg-red-50 rounded-lg">
                      <div className="text-red-800 font-medium">
                        Eliminated: {ranking.participants.find((p: any) => p.participantId === ranking.eliminatedParticipantId)?.username}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ChallengeDetail;
