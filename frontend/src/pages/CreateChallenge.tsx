import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  PlusIcon, 
  CurrencyDollarIcon, 
  UsersIcon, 
  CalendarIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

import { challengeApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const createChallengeSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  maxParticipants: z.number().min(2, 'Minimum 2 participants').max(100, 'Maximum 100 participants'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
}).refine((data) => {
  const startDate = new Date(data.startDate);
  const endDate = new Date(data.endDate);
  const now = new Date();
  
  if (startDate <= now) {
    return false;
  }
  
  if (endDate <= startDate) {
    return false;
  }
  
  const duration = endDate.getTime() - startDate.getTime();
  const days = duration / (1000 * 60 * 60 * 24);
  
  return days >= 21 && days <= 21; // Exactly 21 days
}, {
  message: "Challenge must be exactly 21 days long and start in the future",
  path: ["endDate"],
});

type CreateChallengeForm = z.infer<typeof createChallengeSchema>;

const CreateChallenge: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<CreateChallengeForm>({
    resolver: zodResolver(createChallengeSchema),
  });

  const maxParticipants = watch('maxParticipants') || 0;

  const onSubmit = async (data: CreateChallengeForm) => {
    if (!user) {
      toast.error('Please log in to create a challenge');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const challengeData = {
        ...data,
        stakeAmount: 0, // No stake
        startDate: new Date(data.startDate).toISOString(),
        endDate: new Date(data.endDate).toISOString(),
      };

      const challenge = await challengeApi.createChallenge(challengeData);
      
      toast.success('Challenge created successfully!');
      navigate(`/challenges/${challenge.id}`);
    } catch (error) {
      console.error('Error creating challenge:', error);
      toast.error('Failed to create challenge. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <div className="text-gray-600 text-lg mb-4">Cüzdan bağlanıyor...</div>
        <div className="text-sm text-gray-500">
          Lütfen navbar'daki "Connect Wallet" butonuna tıklayarak cüzdanınızı bağlayın
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Create New Challenge</h1>
        <p className="text-gray-600 mt-2">
          Set up a 21-day fitness challenge with staking and rewards
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Challenge Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Challenge Name *
          </label>
          <input
            type="text"
            {...register('name')}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="e.g., 30-Day Fitness Challenge"
          />
          {errors.name && (
            <p className="text-red-600 text-sm mt-1">{errors.name.message}</p>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description *
          </label>
          <textarea
            {...register('description')}
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Describe the challenge, rules, and what participants need to do..."
          />
          {errors.description && (
            <p className="text-red-600 text-sm mt-1">{errors.description.message}</p>
          )}
        </div>


        {/* Max Participants */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Maximum Participants *
          </label>
          <div className="relative">
            <UsersIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="number"
              {...register('maxParticipants', { valueAsNumber: true })}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="20"
              min="2"
              max="100"
            />
          </div>
          {errors.maxParticipants && (
            <p className="text-red-600 text-sm mt-1">{errors.maxParticipants.message}</p>
          )}
        </div>

        {/* Start Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Start Date *
          </label>
          <div className="relative">
            <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="datetime-local"
              {...register('startDate')}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          {errors.startDate && (
            <p className="text-red-600 text-sm mt-1">{errors.startDate.message}</p>
          )}
        </div>

        {/* End Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            End Date *
          </label>
          <div className="relative">
            <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="datetime-local"
              {...register('endDate')}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          {errors.endDate && (
            <p className="text-red-600 text-sm mt-1">{errors.endDate.message}</p>
          )}
        </div>


        {/* Info Box */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <InformationCircleIcon className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <p className="font-medium mb-1">Important Information:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Challenges run for exactly 21 days</li>
                <li>Weekly eliminations occur every 7 days</li>
                <li>Platform takes a 5% fee from the total pool</li>
                <li>You will be the first participant and need to stake the required amount</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => navigate('/challenges')}
            className="flex-1 bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <PlusIcon className="w-5 h-5" />
                Create Challenge
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateChallenge;
