import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from '../hooks/useTranslation.ts';
import { useAuth } from '../contexts/AuthContext.tsx';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Send, MessageSquare, Lightbulb, X, Minimize2, Maximize2 } from 'lucide-react';

const API_BASE_URL = 'https://salesbuddy-production.up.railway.app';

interface AITipMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AITipsProps {
  isOpen: boolean;
  onToggle: () => void;
  isMinimized: boolean;
  onToggleMinimize: () => void;
}

interface AiTipsUsageStatus {
  aiTipsUsedThisMonth: number;
  totalAiTipsUsed: number;
  monthlyLimit: number;
  remainingThisMonth: number;
  canUseAiTips: boolean;
  plan: string;
}

const AITips: React.FC<AITipsProps> = ({ isOpen, onToggle, isMinimized, onToggleMinimize }) => {
  const { t, language } = useTranslation();
  const { user } = useAuth();
  const [messages, setMessages] = useState<AITipMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [usageStatus, setUsageStatus] = useState<AiTipsUsageStatus | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch usage status when component opens
  useEffect(() => {
    const fetchUsageStatus = async () => {
      if (isOpen && user) {
        try {
          const response = await axios.get(`${API_BASE_URL}/api/ai/tips/usage`, {
            withCredentials: true
          });
          setUsageStatus(response.data.aiTipsStatus);
        } catch (error) {
          console.error('Failed to fetch AI Tips usage status:', error);
        }
      }
    };

    fetchUsageStatus();
  }, [isOpen, user]);

  // Initialize with welcome message
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessage: AITipMessage = {
        role: 'assistant',
        content: t('aiTipsWelcome') || "Hello! I'm your sales assistant. I can help you with sales strategies, objection handling, closing techniques, and any other sales-related questions. What would you like to know?",
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
    }
  }, [isOpen, messages.length, t]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading || !user) return;

    // Check if user can use AI Tips
    if (usageStatus && !usageStatus.canUseAiTips) {
      toast.error(`You've reached your monthly AI Tips limit (${usageStatus.monthlyLimit}). Please upgrade your plan to continue.`);
      return;
    }

    const userMessage: AITipMessage = {
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/api/ai/tips`, {
        message: inputMessage.trim(),
        language: language,
        conversationHistory: messages.slice(-10) // Send last 10 messages for context
      }, {
        withCredentials: true
      });

      const assistantMessage: AITipMessage = {
        role: 'assistant',
        content: response.data.response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Update usage status from response
      if (response.data.aiTipsStatus) {
        setUsageStatus(response.data.aiTipsStatus);
      }
    } catch (error: any) {
      console.error('Failed to get AI tips:', error);
      
      if (error.response?.status === 429) {
        // AI Tips limit reached
        toast.error(error.response?.data?.message || 'AI Tips monthly limit reached');
        if (error.response?.data?.aiTipsStatus) {
          setUsageStatus(error.response.data.aiTipsStatus);
        }
      } else {
        toast.error(error.response?.data?.error || t('failedToGetTips') || 'Failed to get AI tips');
      }
      
      // Add error message
      const errorMessage: AITipMessage = {
        role: 'assistant',
        content: t('aiTipsError') || "I'm sorry, I'm having trouble responding right now. Please try again in a moment.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearConversation = () => {
    setMessages([]);
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed left-0 top-0 h-full bg-white dark:bg-dark-800 border-r border-gray-200 dark:border-dark-700 shadow-lg z-40 transition-all duration-300 ${
      isMinimized ? 'w-12' : 'w-80'
    }`}>
      {isMinimized ? (
        <div className="h-full flex flex-col items-center justify-center p-2">
          <button
            onClick={onToggleMinimize}
            className="p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg transition-colors"
            title={t('expandAITips') || 'Expand AI Tips'}
          >
            <Maximize2 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('Minimized X button clicked - closing AI Tips');
              onToggle();
            }}
            className="p-2 hover:bg-red-100 dark:hover:bg-red-900 hover:text-red-600 dark:hover:text-red-400 rounded-lg transition-colors mt-2 relative z-10"
            title={t('closeAITips') || 'Close AI Tips'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      ) : (
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-dark-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-dark-700 dark:to-dark-600">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                <Lightbulb className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{t('aiTips') || 'AI Tips'}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">{t('salesAssistant') || 'Sales Assistant'}</p>
                {usageStatus && (
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                    {usageStatus.remainingThisMonth}/{usageStatus.monthlyLimit} remaining
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={onToggleMinimize}
                className="p-1 hover:bg-gray-200 dark:hover:bg-dark-600 rounded transition-colors"
                title={t('minimizeAITips') || 'Minimize'}
              >
                <Minimize2 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('X button clicked - closing AI Tips');
                  onToggle();
                }}
                className="p-2 hover:bg-red-100 dark:hover:bg-red-900 hover:text-red-600 dark:hover:text-red-400 rounded-lg transition-colors relative z-10"
                title={t('closeAITips') || 'Close'}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] p-3 rounded-lg text-sm ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-dark-700 text-gray-900 dark:text-gray-100'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                  <div className={`text-xs mt-1 ${
                    message.role === 'user' ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 dark:bg-dark-700 p-3 rounded-lg">
                  <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm">
                    <div className="animate-spin w-4 h-4 border-2 border-gray-300 dark:border-dark-600 border-t-gray-600 dark:border-t-gray-400 rounded-full"></div>
                    {t('thinking') || 'Thinking...'}
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-200 dark:border-dark-700 bg-gray-50 dark:bg-dark-700">
            <div className="flex gap-2">
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={t('askSalesQuestion') || 'Ask a sales question...'}
                rows={2}
                className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-dark-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-white dark:bg-dark-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                disabled={isLoading}
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isLoading || (usageStatus && !usageStatus.canUseAiTips)}
                className="btn-primary px-3 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            
            {/* Quick Actions */}
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                onClick={() => setInputMessage(t('objectionHandlingTips') || 'How do I handle price objections?')}
                disabled={usageStatus && !usageStatus.canUseAiTips}
                className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('objectionHandling') || 'Objections'}
              </button>
              <button
                onClick={() => setInputMessage(t('closingTechniquesTips') || 'What are effective closing techniques?')}
                disabled={usageStatus && !usageStatus.canUseAiTips}
                className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded hover:bg-green-200 dark:hover:bg-green-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('closing') || 'Closing'}
              </button>
              <button
                onClick={() => setInputMessage(t('coldCallTips') || 'Give me cold calling best practices')}
                disabled={usageStatus && !usageStatus.canUseAiTips}
                className="text-xs px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded hover:bg-purple-200 dark:hover:bg-purple-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('coldCall') || 'Cold Call'}
              </button>
              <button
                onClick={clearConversation}
                className="text-xs px-2 py-1 bg-gray-100 dark:bg-dark-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-dark-500 transition-colors"
              >
                {t('clear') || 'Clear'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AITips;
