import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  PlusIcon, 
  ClockIcon, 
  UsersIcon, 
  CurrencyDollarIcon,
  TrophyIcon,
  FireIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';

import { challengeApi } from '../services/api';
import { Challenge, ChallengeStatus } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import ChallengeCard from '../components/ChallengeCard';

const ChallengeList: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState<ChallengeStatus | 'all'>('all');

  const { data: challenges, isLoading, error } = useQuery({
    queryKey: ['challenges', statusFilter],
    queryFn: () => challengeApi.getChallenges(statusFilter === 'all' ? undefined : statusFilter),
  });

  const statusOptions = [
    { value: 'all', label: 'All Challenges', color: 'gray' },
    { value: 'upcoming', label: 'Upcoming', color: 'blue' },
    { value: 'active', label: 'Active', color: 'green' },
    { value: 'completed', label: 'Completed', color: 'purple' },
  ];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 text-lg mb-4">Failed to load challenges</div>
        <button 
          onClick={() => window.location.reload()}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Challenges</h1>
          <p className="text-gray-600 mt-2">
            Join fitness challenges and compete for the prize pool
          </p>
        </div>
        <Link
          to="/create-challenge"
          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <PlusIcon className="w-5 h-5" />
          Create Challenge
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-8">
        {statusOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => setStatusFilter(option.value as any)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              statusFilter === option.value
                ? `bg-${option.color}-100 text-${option.color}-800 border-2 border-${option.color}-300`
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Challenges Grid */}
      {challenges && challenges.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {challenges.map((challenge) => (
            <ChallengeCard key={challenge.id} challenge={challenge} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg mb-4">
            {statusFilter === 'all' 
              ? 'No challenges found' 
              : `No ${statusFilter} challenges found`
            }
          </div>
          <Link
            to="/create-challenge"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Create the First Challenge
          </Link>
        </div>
      )}

      {/* Quick Stats */}
      {challenges && challenges.length > 0 && (
        <div className="mt-12 bg-gray-50 rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Stats</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {challenges.length}
              </div>
              <div className="text-gray-600">Total Challenges</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {challenges.reduce((sum, c) => sum + c.currentParticipants, 0)}
              </div>
              <div className="text-gray-600">Total Participants</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {challenges.reduce((sum, c) => sum + c.poolAmount, 0).toLocaleString()}
              </div>
              <div className="text-gray-600">Total Pool (μALGO)</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-600 mb-2">
                {challenges.filter(c => c.status === 'active').length}
              </div>
              <div className="text-gray-600">Active Now</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChallengeList;
