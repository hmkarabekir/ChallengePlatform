import React from 'react';
import { 
  UserIcon,
  TrophyIcon,
  ChartBarIcon,
  HeartIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';

import { useAuth } from '../contexts/AuthContext';

const Profile: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <div className="text-red-600 text-lg mb-4">Please log in to view your profile</div>
        <button
          onClick={() => window.location.href = '/login'}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
        >
          Log In
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
            <UserIcon className="w-10 h-10 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{user.username}</h1>
            <p className="text-gray-600">{user.email}</p>
            <p className="text-sm text-gray-500 mt-1">
              Member since {new Date(user.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <TrophyIcon className="w-8 h-8 text-yellow-600" />
            <h3 className="text-lg font-semibold text-gray-900">Challenges</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Active</span>
              <span className="font-semibold">2</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Completed</span>
              <span className="font-semibold">5</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Won</span>
              <span className="font-semibold">3</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <ChartBarIcon className="w-8 h-8 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900">Performance</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Tasks Completed</span>
              <span className="font-semibold">127</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Success Rate</span>
              <span className="font-semibold text-green-600">94%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total Points</span>
              <span className="font-semibold">1,420</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <HeartIcon className="w-8 h-8 text-red-600" />
            <h3 className="text-lg font-semibold text-gray-900">Health Data</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Steps Today</span>
              <span className="font-semibold">{user.healthData?.steps || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Active Minutes</span>
              <span className="font-semibold">{user.healthData?.activeMinutes || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Calories</span>
              <span className="font-semibold">{user.healthData?.caloriesBurned || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
        <div className="space-y-4">
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <TrophyIcon className="w-5 h-5 text-green-600" />
            </div>
            <div className="flex-1">
              <div className="font-medium">Completed "30-Day Fitness Challenge"</div>
              <div className="text-sm text-gray-600">Won 1st place and 150,000 μALGO</div>
            </div>
            <div className="text-sm text-gray-500">2 days ago</div>
          </div>

          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <CalendarIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <div className="font-medium">Joined "Marathon Training Challenge"</div>
              <div className="text-sm text-gray-600">Staked 25,000 μALGO</div>
            </div>
            <div className="text-sm text-gray-500">1 week ago</div>
          </div>

          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <ChartBarIcon className="w-5 h-5 text-purple-600" />
            </div>
            <div className="flex-1">
              <div className="font-medium">Completed 10,000 steps daily goal</div>
              <div className="text-sm text-gray-600">Earned 10 points</div>
            </div>
            <div className="text-sm text-gray-500">3 days ago</div>
          </div>
        </div>
      </div>

      {/* Health Data Integration */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Health Data Integration</h3>
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-2">
            <HeartIcon className="w-5 h-5 text-blue-600" />
            <span className="font-medium text-blue-900">Google Fit / Apple Health Integration</span>
          </div>
          <p className="text-blue-800 text-sm mb-4">
            Connect your health data to automatically verify task completions and earn more points.
          </p>
          <div className="flex gap-3">
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm">
              Connect Google Fit
            </button>
            <button className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 text-sm">
              Connect Apple Health
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
