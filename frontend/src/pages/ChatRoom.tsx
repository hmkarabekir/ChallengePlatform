import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  ArrowLeftIcon,
  PaperAirplaneIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';

import { chatApi } from '../services/api';
import { ChatMessage } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';

const ChatRoom: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: initialMessages, isLoading } = useQuery({
    queryKey: ['messages', id],
    queryFn: () => chatApi.getMessages(id!),
    enabled: !!id
  });

  useEffect(() => {
    if (initialMessages) {
      setMessages(initialMessages);
    }
  }, [initialMessages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !id) return;

    try {
      const newMessage = await chatApi.sendMessage(id, { message: message.trim() });
      setMessages(prev => [...prev, newMessage]);
      setMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(`/challenges/${id}`)}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Challenge Chat</h1>
            <p className="text-sm text-gray-600">Connect with other participants</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.isSystemMessage ? 'justify-center' : ''}`}>
            <div className={`max-w-xs lg:max-w-md ${
              msg.isSystemMessage ? 'w-full' : ''
            }`}>
              {!msg.isSystemMessage && (
                <div className="flex items-center gap-2 mb-1">
                  <UserIcon className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">{msg.username}</span>
                </div>
              )}
              
              <div className={`px-4 py-2 rounded-lg ${
                msg.isSystemMessage 
                  ? 'bg-yellow-100 text-yellow-800 text-center text-sm' 
                  : 'bg-white text-gray-900 shadow-sm'
              }`}>
                <div className="text-sm">{msg.message}</div>
                <div className={`text-xs mt-1 ${
                  msg.isSystemMessage ? 'text-yellow-600' : 'text-gray-500'
                }`}>
                  {format(new Date(msg.timestamp), 'MMM dd, HH:mm')}
                </div>
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="bg-white border-t border-gray-200 p-4">
        <form onSubmit={handleSendMessage} className="flex gap-3">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={!id}
          />
          <button
            type="submit"
            disabled={!message.trim() || !id}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <PaperAirplaneIcon className="w-4 h-4" />
            Send
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatRoom;
