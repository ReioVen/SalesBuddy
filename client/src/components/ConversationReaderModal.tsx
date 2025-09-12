import React, { useState, useEffect } from 'react';
import { useTranslation } from '../hooks/useTranslation.ts';

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
      const response = await fetch(`/api/companies/users/${userId}/conversations/${conversationId}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setConversation(data.conversation);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to fetch conversation');
      }
    } catch (err) {
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
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {conversation?.title || 'Conversation'}
            </h2>
            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
              <span>
                {conversation?.userId.firstName} {conversation?.userId.lastName}
              </span>
              <span>•</span>
              <span>{conversation && formatDate(conversation.createdAt)}</span>
              <span>•</span>
              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                conversation?.isActive 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {conversation?.isActive ? 'Active' : 'Ended'}
              </span>
            </div>
            {conversation?.scenario && (
              <div className="mt-2">
                <span className="text-sm text-gray-600">
                  <strong>Scenario:</strong> {conversation.scenario}
                </span>
                {conversation.difficulty && (
                  <span className="ml-4 text-sm text-gray-600">
                    <strong>Difficulty:</strong> {conversation.difficulty}
                  </span>
                )}
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
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
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          ) : conversation ? (
            <div className="space-y-4">
              {conversation.messages.map((message, index) => (
                <div
                  key={message._id || index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-4 ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium opacity-75">
                        {message.role === 'user' ? 'User' : 'AI Assistant'}
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
                  <p className="text-gray-500">No messages in this conversation.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">Conversation not found.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-500">
            {conversation && `${conversation.messages.length} messages`}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConversationReaderModal;
