import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ClockIcon, 
  UsersIcon, 
  CurrencyDollarIcon,
  TrophyIcon,
  FireIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';
import { format, isAfter, isBefore } from 'date-fns';

import { Challenge, ChallengeStatus } from '../types';
import { cn } from '../utils/cn';

interface ChallengeCardProps {
  challenge: Challenge;
}

const ChallengeCard: React.FC<ChallengeCardProps> = ({ challenge }) => {
  const getStatusColor = (status: ChallengeStatus) => {
    switch (status) {
      case 'upcoming':
        return 'bg-blue-100 text-blue-800';
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-purple-100 text-purple-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: ChallengeStatus) => {
    switch (status) {
      case 'upcoming':
        return <ClockIcon className="w-4 h-4" />;
      case 'active':
        return <FireIcon className="w-4 h-4" />;
      case 'completed':
        return <TrophyIcon className="w-4 h-4" />;
      case 'cancelled':
        return <ClockIcon className="w-4 h-4" />;
      default:
        return <ClockIcon className="w-4 h-4" />;
    }
  };

  const isUpcoming = challenge.status === 'upcoming' && isAfter(new Date(challenge.startDate), new Date());
  const isActive = challenge.status === 'active' && isBefore(new Date(challenge.startDate), new Date()) && isAfter(new Date(challenge.endDate), new Date());
  const isCompleted = challenge.status === 'completed' || isAfter(new Date(), new Date(challenge.endDate));

  return (
    <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow border border-gray-200">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-xl font-semibold text-gray-900 line-clamp-2">
            {challenge.name}
          </h3>
          <span className={cn(
            "inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium",
            getStatusColor(challenge.status)
          )}>
            {getStatusIcon(challenge.status)}
            {challenge.status.charAt(0).toUpperCase() + challenge.status.slice(1)}
          </span>
        </div>
        
        {challenge.description && (
          <p className="text-gray-600 text-sm line-clamp-3 mb-4">
            {challenge.description}
          </p>
        )}

        {/* Challenge Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <CurrencyDollarIcon className="w-4 h-4" />
            <span>{challenge.stakeAmount.toLocaleString()} μALGO</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <UsersIcon className="w-4 h-4" />
            <span>{challenge.currentParticipants}/{challenge.maxParticipants}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Pool Amount */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600">Prize Pool</div>
              <div className="text-2xl font-bold text-gray-900">
                {challenge.poolAmount.toLocaleString()} μALGO
              </div>
            </div>
            <TrophyIcon className="w-8 h-8 text-yellow-500" />
          </div>
        </div>

        {/* Dates */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <ClockIcon className="w-4 h-4" />
            <span>Starts: {challenge.startDate ? format(new Date(challenge.startDate), 'MMM dd, yyyy') : 'TBD'}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <ClockIcon className="w-4 h-4" />
            <span>Ends: {challenge.endDate ? format(new Date(challenge.endDate), 'MMM dd, yyyy') : 'TBD'}</span>
          </div>
        </div>

        {/* Progress Bar for Active Challenges */}
        {isActive && (
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Progress</span>
              <span>21 days</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ 
                  width: `${Math.min(100, (Date.now() - new Date(challenge.startDate).getTime()) / (21 * 24 * 60 * 60 * 1000) * 100)}%` 
                }}
              />
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Link
            to={`/challenges/${challenge.id}`}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors text-center"
          >
            View Details
          </Link>
          {isActive && (
            <Link
              to={`/challenges/${challenge.id}/chat`}
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center gap-1"
            >
              <ChatBubbleLeftRightIcon className="w-4 h-4" />
              Chat
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChallengeCard;
