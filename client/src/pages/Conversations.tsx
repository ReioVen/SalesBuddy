import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from '../hooks/useTranslation.ts';
import { useAuth } from '../contexts/AuthContext.tsx';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Plus, MessageSquare, User, Building, Briefcase, FileText, Send, X, Star } from 'lucide-react';

interface ClientCustomization {
  name: string;
  personality: string;
  industry: string;
  role: string;
  customPrompt: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface Conversation {
  id: string;
  title: string;
  scenario: string;
  clientCustomization: ClientCustomization;
  messages: Message[];
  totalTokens?: number;
  duration?: number;
  rating?: number;
  feedback?: string;
  aiRatings?: {
    introduction: number;
    mapping: number;
    productPresentation: number;
    objectionHandling: number;
    close: number;
  };
  aiRatingFeedback?: string;
  createdAt?: string;
  updatedAt?: string;
}

const Conversations: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [showNewChatForm, setShowNewChatForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<Conversation[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [showConversationDetail, setShowConversationDetail] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [clientCustomization, setClientCustomization] = useState<ClientCustomization>({
    name: '',
    personality: '',
    industry: '',
    role: '',
    customPrompt: '',
    difficulty: 'medium'
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentConversation?.messages]);

  // Load conversation history on component mount
  useEffect(() => {
    if (user) {
      loadConversationHistory();
    }
  }, [user]);

  const loadConversationHistory = async () => {
    if (!user) return;
    
    setLoadingHistory(true);
    try {
      const response = await axios.get('/api/ai/conversations');
      // Map _id to id for frontend compatibility
      const conversations = (response.data.conversations || []).map((conv: any) => ({
        ...conv,
        id: conv._id || conv.id
      }));
      setConversationHistory(conversations);
    } catch (error: any) {
      console.error('Failed to load conversation history:', error);
      toast.error('Failed to load conversation history');
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleStartConversation = async () => {
    if (!user) {
      toast.error('Please log in to start a conversation');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('/api/ai/conversation', {
        scenario: 'general',
        clientName: clientCustomization.name || undefined,
        clientPersonality: clientCustomization.personality || undefined,
        clientIndustry: clientCustomization.industry || undefined,
        clientRole: clientCustomization.role || undefined,
        customPrompt: clientCustomization.customPrompt || undefined,
        difficulty: clientCustomization.difficulty
      });

      toast.success('Conversation started!');
      setShowNewChatForm(false);
      
      // Set the current conversation and open chat window
      setCurrentConversation({
        id: response.data.conversation.id,
        title: response.data.conversation.title,
        clientCustomization: response.data.conversation.clientCustomization,
        messages: response.data.conversation.messages || []
      });
      
      setClientCustomization({
        name: '',
        personality: '',
        industry: '',
        role: '',
        customPrompt: '',
        difficulty: 'medium'
      });
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to start conversation';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleUseDefaultClient = () => {
    setClientCustomization({
      name: '',
      personality: '',
      industry: '',
      role: '',
      customPrompt: '',
      difficulty: 'medium'
    });
    handleStartConversation();
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !currentConversation || sendingMessage) return;

    setSendingMessage(true);
    const userMessage = newMessage.trim();
    setNewMessage('');

    // Add user message to conversation
    const updatedConversation = {
      ...currentConversation,
      messages: [...currentConversation.messages, {
        role: 'user' as const,
        content: userMessage,
        timestamp: new Date()
      }]
    };
    setCurrentConversation(updatedConversation);

    try {
      const response = await axios.post('/api/ai/message', {
        conversationId: currentConversation.id,
        message: userMessage
      });

      // Add AI response to conversation
      setCurrentConversation(prev => prev ? {
        ...prev,
        messages: [...prev.messages, {
          role: 'assistant' as const,
          content: response.data.response,
          timestamp: new Date()
        }]
      } : null);

    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to send message';
      toast.error(message);
    } finally {
      setSendingMessage(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleEndConversation = async () => {
    if (!currentConversation) return;
    
    try {
      const response = await axios.post(`/api/ai/conversation/${currentConversation.id}/end`);
      toast.success(t('conversationEnded'));
      
      // Update the conversation with AI ratings
      setCurrentConversation(prev => prev ? {
        ...prev,
        duration: response.data.conversation.duration,
        aiRatings: response.data.conversation.aiRatings,
        aiRatingFeedback: response.data.conversation.aiRatingFeedback
      } : null);
      
      // Refresh conversation history
      loadConversationHistory();
      
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to end conversation';
      toast.error(message);
    }
  };

  const handleViewConversation = async (conversationId: string) => {
    if (!conversationId || conversationId === 'undefined') {
      toast.error('Invalid conversation ID');
      return;
    }
    
    try {
      const response = await axios.get(`/api/ai/conversation/${conversationId}`);
      // Map _id to id for frontend compatibility
      const conversation = {
        ...response.data.conversation,
        id: response.data.conversation._id || response.data.conversation.id
      };
      setSelectedConversation(conversation);
      setShowConversationDetail(true);
    } catch (error: any) {
      console.error('Failed to load conversation details:', error);
      toast.error('Failed to load conversation details');
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'hard': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getDifficultyIcon = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return '🟢';
      case 'medium': return '🟡';
      case 'hard': return '🔴';
      default: return '⚪';
    }
  };

  const calculateTotalPoints = (aiRatings: Conversation['aiRatings']) => {
    if (!aiRatings) return 0;
    return Object.values(aiRatings).reduce((sum, rating) => sum + rating, 0);
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 8) return 'text-green-600';
    if (rating >= 6) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (!user) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold mb-4">{t('conversations')}</h1>
        <div className="rounded-xl border border-gray-200 bg-white p-6 text-gray-600 text-center">
          {t('pleaseLogIn')}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{t('conversations')}</h1>
        <button
          onClick={() => setShowNewChatForm(true)}
          className="btn-primary flex items-center gap-2 px-6 py-3"
        >
          <Plus className="w-5 h-5" />
          {t('newChat')}
        </button>
      </div>

      {/* New Chat Form Modal */}
      {showNewChatForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">{t('startNewConversation')}</h2>
                <button
                  onClick={() => setShowNewChatForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-6">
                <div className="text-center">
                  <MessageSquare className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                  <p className="text-gray-600 mb-6">
                    Customize your AI client to practice with different types of customers, or use the default client.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <User className="w-4 h-4 inline mr-2" />
                      {t('clientName')} <span className="text-gray-400">({t('optional')})</span>
                    </label>
                    <input
                      type="text"
                      value={clientCustomization.name}
                      onChange={(e) => setClientCustomization(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Sarah Johnson"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('clientPersonality')} <span className="text-gray-400">({t('optional')})</span>
                    </label>
                    <input
                      type="text"
                      value={clientCustomization.personality}
                      onChange={(e) => setClientCustomization(prev => ({ ...prev, personality: e.target.value }))}
                      placeholder={t('examplePersonality')}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Building className="w-4 h-4 inline mr-2" />
                      {t('clientIndustry')} <span className="text-gray-400">({t('optional')})</span>
                    </label>
                    <input
                      type="text"
                      value={clientCustomization.industry}
                      onChange={(e) => setClientCustomization(prev => ({ ...prev, industry: e.target.value }))}
                      placeholder={t('exampleIndustry')}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Briefcase className="w-4 h-4 inline mr-2" />
                      {t('clientRole')} <span className="text-gray-400">({t('optional')})</span>
                    </label>
                    <input
                      type="text"
                      value={clientCustomization.role}
                      onChange={(e) => setClientCustomization(prev => ({ ...prev, role: e.target.value }))}
                      placeholder={t('exampleRole')}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Star className="w-4 h-4 inline mr-2" />
                      {t('difficulty')}
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {(['easy', 'medium', 'hard'] as const).map((level) => (
                        <button
                          key={level}
                          type="button"
                          onClick={() => setClientCustomization(prev => ({ ...prev, difficulty: level }))}
                          className={`p-3 rounded-lg border-2 text-center transition-all ${
                            clientCustomization.difficulty === level
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="text-2xl mb-1">{getDifficultyIcon(level)}</div>
                          <div className="font-medium">{t(level)}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            {level === 'easy' && t('difficultyEasy')}
                            {level === 'medium' && t('difficultyMedium')}
                            {level === 'hard' && t('difficultyHard')}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <FileText className="w-4 h-4 inline mr-2" />
                      {t('customPrompt')} <span className="text-gray-400">({t('optional')})</span>
                    </label>
                    <textarea
                      value={clientCustomization.customPrompt}
                      onChange={(e) => setClientCustomization(prev => ({ ...prev, customPrompt: e.target.value }))}
                      placeholder={t('examplePrompt')}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleUseDefaultClient}
                    disabled={loading}
                    className="flex-1 btn-secondary py-3 disabled:opacity-50"
                  >
                    {t('useDefaultClient')}
                  </button>
                  <button
                    onClick={handleStartConversation}
                    disabled={loading}
                    className="flex-1 btn-primary py-3 disabled:opacity-50"
                  >
                    {loading ? 'Starting...' : t('startChat')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chat Window */}
      {currentConversation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full h-[80vh] flex flex-col">
            {/* Chat Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {t('chatWith')} {currentConversation.clientCustomization.name || 'Client'}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(currentConversation.clientCustomization.difficulty)}`}>
                      {getDifficultyIcon(currentConversation.clientCustomization.difficulty)} {t(currentConversation.clientCustomization.difficulty)}
                    </span>
                    {currentConversation.clientCustomization.industry && (
                      <span>• {currentConversation.clientCustomization.industry}</span>
                    )}
                    {currentConversation.clientCustomization.role && (
                      <span>• {currentConversation.clientCustomization.role}</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleEndConversation}
                  className="btn-secondary px-4 py-2 text-sm"
                >
                  {t('endConversation')}
                </button>
                <button
                  onClick={() => setCurrentConversation(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {currentConversation.messages.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p>Start the conversation by introducing yourself!</p>
                </div>
              ) : (
                currentConversation.messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] p-3 rounded-lg ${
                        message.role === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    </div>
                  </div>
                ))
              )}
              {sendingMessage && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 p-3 rounded-lg">
                    <div className="flex items-center gap-2 text-gray-500">
                      <div className="animate-spin w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full"></div>
                      {t('loading')}...
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200">
              <div className="flex gap-3">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={t('typeMessage')}
                  rows={2}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  disabled={sendingMessage}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || sendingMessage}
                  className="btn-primary px-6 py-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  {t('sendMessage')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Conversations List */}
      <div className="space-y-4">
        {loadingHistory ? (
          <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-gray-600">
            <div className="animate-spin w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full mx-auto mb-4"></div>
            <p>Loading conversation history...</p>
          </div>
        ) : conversationHistory.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-gray-600">
            <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No conversations yet</h3>
            <p className="mb-4">Start your first conversation to practice your sales skills with AI!</p>
            <button
              onClick={() => setShowNewChatForm(true)}
              className="btn-primary"
            >
              {t('startNewConversation')}
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {conversationHistory.map((conversation) => (
              <div
                key={conversation.id}
                className="rounded-xl border border-gray-200 bg-white p-6 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleViewConversation(conversation.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-2">{conversation.title}</h3>
                    <div className="flex items-center gap-3 text-sm text-gray-500 mb-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(conversation.clientCustomization?.difficulty || 'medium')}`}>
                        {getDifficultyIcon(conversation.clientCustomization?.difficulty || 'medium')} {t(conversation.clientCustomization?.difficulty || 'medium')}
                      </span>
                      {conversation.clientCustomization?.industry && (
                        <span>• {conversation.clientCustomization.industry}</span>
                      )}
                      {conversation.duration && (
                        <span>• {Math.floor(conversation.duration / 60)}m {conversation.duration % 60}s</span>
                      )}
                    </div>
                    
                    {conversation.aiRatings && (
                      <div className="mb-3">
                        <div className="flex items-center gap-4 text-sm">
                          <span className="font-medium text-gray-700">
                            {t('totalScore')}: <span className="text-lg font-bold text-blue-600">{calculateTotalPoints(conversation.aiRatings)}/50</span>
                          </span>
                          <div className="flex gap-2">
                            {Object.entries(conversation.aiRatings).map(([phase, rating]) => (
                              <span key={phase} className={`px-2 py-1 rounded text-xs font-medium ${getRatingColor(rating)}`}>
                                {phase.charAt(0).toUpperCase() + phase.slice(1)}: {rating}/10
                              </span>
                            ))}
                          </div>
                        </div>
                        {conversation.aiRatingFeedback && (
                          <p className="text-sm text-gray-600 mt-2 italic">"{conversation.aiRatingFeedback}"</p>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="text-right text-sm text-gray-500">
                    {conversation.createdAt && (
                      <div>{new Date(conversation.createdAt).toLocaleDateString()}</div>
                    )}
                    <div className="text-xs">{conversation.messages?.length || 0} messages</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Conversation Detail Modal */}
      {showConversationDetail && selectedConversation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">{t('conversationDetails')}</h2>
              <button
                onClick={() => {
                  setShowConversationDetail(false);
                  setSelectedConversation(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Summary Section */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('conversationSummary')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div>
                      <span className="font-medium text-gray-700">{t('title')}:</span>
                      <span className="ml-2 text-gray-900">{selectedConversation.title}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">{t('scenario')}:</span>
                      <span className="ml-2 text-gray-900">{selectedConversation.scenario}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">{t('difficulty')}:</span>
                      <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(selectedConversation.clientCustomization?.difficulty || 'medium')}`}>
                        {getDifficultyIcon(selectedConversation.clientCustomization?.difficulty || 'medium')} {t(selectedConversation.clientCustomization?.difficulty || 'medium')}
                      </span>
                    </div>
                    {selectedConversation.duration && (
                      <div>
                        <span className="font-medium text-gray-700">{t('duration')}:</span>
                        <span className="ml-2 text-gray-900">{Math.floor(selectedConversation.duration / 60)}m {selectedConversation.duration % 60}s</span>
                      </div>
                    )}
                    <div>
                      <span className="font-medium text-gray-700">{t('messages')}:</span>
                      <span className="ml-2 text-gray-900">{selectedConversation.messages?.length || 0}</span>
                    </div>
                  </div>

                  {selectedConversation.aiRatings && (
                    <div className="space-y-3">
                      <div>
                        <span className="font-medium text-gray-700">{t('totalScore')}:</span>
                        <span className="ml-2 text-2xl font-bold text-blue-600">{calculateTotalPoints(selectedConversation.aiRatings)}/50</span>
                      </div>
                      <div className="space-y-2">
                        {Object.entries(selectedConversation.aiRatings).map(([phase, rating]) => (
                          <div key={phase} className="flex items-center justify-between">
                            <span className="font-medium text-gray-700 capitalize">{phase.replace(/([A-Z])/g, ' $1')}:</span>
                            <span className={`text-lg font-semibold ${getRatingColor(rating)}`}>{rating}/10</span>
                          </div>
                        ))}
                      </div>
                      {selectedConversation.aiRatingFeedback && (
                        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                          <span className="font-medium text-gray-700">{t('aiFeedback')}:</span>
                          <p className="text-gray-600 mt-1 italic">"{selectedConversation.aiRatingFeedback}"</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Messages Section */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('fullConversation')}</h3>
                <div className="space-y-4">
                  {selectedConversation.messages?.map((message, index) => (
                    <div
                      key={index}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] p-3 rounded-lg ${
                          message.role === 'user'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{message.content}</p>
                        <div className="text-xs opacity-70 mt-1">
                          {message.role === 'user' ? 'You' : 'Client'} • {new Date(message.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Conversations;


