import React, { useState, useEffect } from 'react';
import { useTranslation } from '../hooks/useTranslation.ts';

const API_BASE_URL = 'https://salesbuddy-production.up.railway.app';

interface Message {
  _id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface Conversation {
  _id: string;
  title: string;
  messages: Message[];
  scenario: string;
  difficulty: string;
  isActive: boolean;
  createdAt: string;
  userId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  rating?: number;
  feedback?: string;
  aiRatings?: {
    opening?: number;
    discovery?: number;
    presentation?: number;
    objectionHandling?: number;
    closing?: number;
    overall?: number;
  };
  aiRatingFeedback?: string;
}

interface ConversationReaderModalProps {
  conversationId: string;
  userId: string;
  onClose: () => void;
}

const ConversationReaderModal: React.FC<ConversationReaderModalProps> = ({
  conversationId,
  userId,
  onClose
}) => {
  const { t } = useTranslation();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchConversation();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, userId]);

  // Add/remove CSS class to body when modal is open
  useEffect(() => {
    document.body.classList.add('conversation-reader-modal-open');
    
    // Cleanup on unmount
    return () => {
      document.body.classList.remove('conversation-reader-modal-open');
    };
  }, []);

  const fetchConversation = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('[ConversationReaderModal] Fetching conversation:', conversationId, 'for user:', userId);
      // Get token from localStorage for Authorization header
      const token = localStorage.getItem('sb_token');
      console.log('[ConversationReaderModal] Has token:', !!token);
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const url = `${API_BASE_URL}/api/companies/users/${userId}/conversations/${conversationId}`;
      console.log('[ConversationReaderModal] Fetching from URL:', url);

      const response = await fetch(url, {
        credentials: 'include',
        headers
      });
      
      console.log('[ConversationReaderModal] Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('[ConversationReaderModal] Conversation data:', data);
        setConversation(data.conversation);
      } else {
        const errorData = await response.json();
        console.error('[ConversationReaderModal] Failed to fetch conversation:', errorData);
        setError(errorData.error || 'Failed to fetch conversation');
      }
    } catch (err) {
      console.error('[ConversationReaderModal] Fetch error:', err);
      setError('Failed to fetch conversation');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatMessageTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white dark:bg-dark-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-dark-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {conversation?.title || t('conversationTitle')}
            </h2>
            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
              <span>
                {conversation?.userId.firstName} {conversation?.userId.lastName}
              </span>
              <span>•</span>
              <span>{conversation && formatDate(conversation.createdAt)}</span>
              <span>•</span>
              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                conversation?.isActive 
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' 
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
              }`}>
                {conversation?.isActive ? t('active') : t('ended')}
              </span>
            </div>
            {conversation?.scenario && (
              <div className="mt-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  <strong>Scenario:</strong> {conversation.scenario}
                </span>
                {conversation.difficulty && (
                  <span className="ml-4 text-sm text-gray-600 dark:text-gray-400">
                    <strong>Difficulty:</strong> {conversation.difficulty}
                  </span>
                )}
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          ) : conversation ? (
            <div className="space-y-4">
              {/* AI Rating Summary - Show at top if available */}
              {conversation.aiRatings && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
                  <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">AI Rating</h4>
                  <div className="grid grid-cols-2 md:grid-cols-6 gap-2 text-xs">
                    {conversation.aiRatings.overall && (
                      <div className="text-center">
                        <div className="font-semibold text-blue-900 dark:text-blue-300">Overall</div>
                        <div className="text-blue-700 dark:text-blue-400">{conversation.aiRatings.overall}/10</div>
                      </div>
                    )}
                    {conversation.aiRatings.opening && (
                      <div className="text-center">
                        <div className="font-semibold text-blue-900 dark:text-blue-300">{t('opening')}</div>
                        <div className="text-blue-700 dark:text-blue-400">{conversation.aiRatings.opening}/10</div>
                      </div>
                    )}
                    {conversation.aiRatings.discovery && (
                      <div className="text-center">
                        <div className="font-semibold text-blue-900 dark:text-blue-300">{t('discovery')}</div>
                        <div className="text-blue-700 dark:text-blue-400">{conversation.aiRatings.discovery}/10</div>
                      </div>
                    )}
                    {conversation.aiRatings.presentation && (
                      <div className="text-center">
                        <div className="font-semibold text-blue-900 dark:text-blue-300">{t('presentation')}</div>
                        <div className="text-blue-700 dark:text-blue-400">{conversation.aiRatings.presentation}/10</div>
                      </div>
                    )}
                    {conversation.aiRatings.objectionHandling && (
                      <div className="text-center">
                        <div className="font-semibold text-blue-900 dark:text-blue-300">{t('objectionHandling')}</div>
                        <div className="text-blue-700 dark:text-blue-400">{conversation.aiRatings.objectionHandling}/10</div>
                      </div>
                    )}
                    {conversation.aiRatings.closing && (
                      <div className="text-center">
                        <div className="font-semibold text-blue-900 dark:text-blue-300">{t('closing')}</div>
                        <div className="text-blue-700 dark:text-blue-400">{conversation.aiRatings.closing}/10</div>
                      </div>
                    )}
                  </div>
                  {conversation.aiRatingFeedback && (
                    <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-800">
                      <p className="text-sm text-blue-800 dark:text-blue-200">{conversation.aiRatingFeedback}</p>
                    </div>
                  )}
                </div>
              )}
              
              {conversation.messages.map((message, index) => (
                <div
                  key={message._id || index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-4 ${
                      message.role === 'user'
                        ? 'bg-blue-600 dark:bg-blue-700 text-white'
                        : 'bg-gray-100 dark:bg-dark-700 text-gray-900 dark:text-gray-100'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium opacity-75">
                        {message.role === 'user' ? t('user') : t('aiAssistant')}
                      </span>
                      <span className="text-xs opacity-75">
                        {formatMessageTime(message.timestamp)}
                      </span>
                    </div>
                    <div className="whitespace-pre-wrap text-sm">
                      {message.content}
                    </div>
                  </div>
                </div>
              ))}
              
              {conversation.messages.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500 dark:text-gray-400">{t('noMessagesInConversation')}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">{t('conversationNotFound')}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-dark-700 bg-gray-50 dark:bg-dark-750">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {conversation && `${conversation.messages.length} ${t('messages')}`}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 dark:bg-dark-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-dark-500 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            {t('close')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConversationReaderModal;
