import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from '../hooks/useTranslation.ts';
import ConversationReaderModal from './ConversationReaderModal.tsx';
import { translateAIContent } from '../utils/aiContentTranslator.ts';

interface Conversation {
  _id: string;
  title: string;
  createdAt: string;
  isActive: boolean;
  messageCount: number;
}

interface ConversationSummary {
  _id: string;
  summaryNumber: number;
  conversationCount: number;
  dateRange: {
    startDate: string;
    endDate: string;
  };
  overallRating: number;
  stageRatings: {
    opening: number;
    discovery: number;
    presentation: number;
    objectionHandling: number;
    closing: number;
  };
  strengths: string[];
  improvements: string[];
  exampleConversations: Array<{
    conversationId: {
      _id: string;
      title: string;
      createdAt: string;
    };
    stage: string;
    rating: number;
    notes: string;
  }>;
  aiAnalysis: {
    keyInsights: string[];
    recommendations: string[];
    trends: string[];
  };
  createdAt: string;
}

interface UserDetailModalProps {
  user: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    isTeamLeader: boolean;
    teamId?: string;
  };
  onClose: () => void;
}

const UserDetailModal: React.FC<UserDetailModalProps> = ({ user, onClose }) => {
  const { t, language } = useTranslation();

  // Function to translate stage names
  const translateStage = (stage: string) => {
    const stageMap: { [key: string]: string } = {
      opening: t('stageOpening'),
      discovery: t('stageDiscovery'),
      presentation: t('stagePresentation'),
      objectionHandling: t('stageObjectionHandling'),
      closing: t('stageClosing')
    };
    return stageMap[stage] || stage.charAt(0).toUpperCase() + stage.slice(1);
  };
  const [activeTab, setActiveTab] = useState<'conversations' | 'summaries'>('conversations');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [summaries, setSummaries] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);

  // Fetch conversations
  const fetchConversations = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/companies/users/${user._id}/conversations?page=${page}&limit=20`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations);
        setPagination(data.pagination);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to fetch conversations');
      }
    } catch (err) {
      setError('Failed to fetch conversations');
    } finally {
      setLoading(false);
    }
  }, [user._id]);

  // Fetch summaries
  const fetchSummaries = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/companies/users/${user._id}/summaries`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setSummaries(data.summaries);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to fetch summaries');
      }
    } catch (err) {
      setError('Failed to fetch summaries');
    } finally {
      setLoading(false);
    }
  }, [user._id]);

  useEffect(() => {
    if (activeTab === 'conversations') {
      fetchConversations();
    } else {
      fetchSummaries();
    }
  }, [activeTab, user._id]);

  // Add/remove CSS class to body when modal is open
  useEffect(() => {
    document.body.classList.add('user-detail-modal-open');
    
    // Cleanup on unmount
    return () => {
      document.body.classList.remove('user-detail-modal-open');
    };
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStageColor = (stage: string) => {
    const colors: { [key: string]: string } = {
      opening: 'bg-blue-100 text-blue-800',
      discovery: 'bg-green-100 text-green-800',
      presentation: 'bg-yellow-100 text-yellow-800',
      objectionHandling: 'bg-orange-100 text-orange-800',
      closing: 'bg-purple-100 text-purple-800'
    };
    return colors[stage] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {user.firstName} {user.lastName}
            </h2>
            <p className="text-sm text-gray-500">{user.email}</p>
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full mt-2 ${
              user.isCompanyAdmin 
                ? 'bg-red-100 text-red-800'
                : user.isTeamLeader
                ? 'bg-blue-100 text-blue-800'
                : 'bg-gray-100 text-gray-800'
            }`}>
              {user.isCompanyAdmin ? 'Admin' : user.isTeamLeader ? 'Team Leader' : 'User'}
            </span>
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

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('conversations')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'conversations'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {t('conversations')} {activeTab === 'conversations' && !loading ? `(${pagination.total})` : activeTab === 'conversations' && loading ? `(${t('loadingEllipsis')})` : ''}
            </button>
            <button
              onClick={() => setActiveTab('summaries')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'summaries'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {t('aiSummaries')} {activeTab === 'summaries' && !loading ? `(${summaries.length})` : activeTab === 'summaries' && loading ? `(${t('loadingEllipsis')})` : ''}
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              {activeTab === 'conversations' && (
                <div>
                  {conversations.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No conversations found for this user.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {conversations.map((conversation) => (
                        <div 
                          key={conversation._id} 
                          className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                          onClick={() => setSelectedConversation(conversation._id)}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="text-lg font-medium text-gray-900">
                                {conversation.title}
                              </h3>
                              <p className="text-sm text-gray-500">
                                {formatDate(conversation.createdAt)} • {conversation.messageCount} messages
                              </p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                conversation.isActive 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {conversation.isActive ? 'Active' : 'Ended'}
                              </span>
                              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {/* Pagination */}
                      {pagination.pages > 1 && (
                        <div className="flex items-center justify-between mt-6">
                          <button
                            onClick={() => fetchConversations(pagination.page - 1)}
                            disabled={pagination.page === 1}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Previous
                          </button>
                          <span className="text-sm text-gray-700">
                            Page {pagination.page} of {pagination.pages}
                          </span>
                          <button
                            onClick={() => fetchConversations(pagination.page + 1)}
                            disabled={pagination.page === pagination.pages}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Next
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'summaries' && (
                <div>
                  {summaries.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500">{t('noAiSummariesAvailable')}</p>
                      <p className="text-sm text-gray-400 mt-2">
                        {t('summariesGeneratedAfter')}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {summaries.map((summary) => (
                        <div key={summary._id} className="border border-gray-200 rounded-lg p-6">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {t('summaryNumber')}{summary.summaryNumber}
                            </h3>
                            <div className="flex items-center space-x-4">
                              <span className="text-sm text-gray-500">
                                {summary.conversationCount} {t('conversations')}
                              </span>
                              <span className="text-sm text-gray-500">
                                {formatDate(summary.dateRange.startDate)} - {formatDate(summary.dateRange.endDate)}
                              </span>
                            </div>
                          </div>

                          {/* Overall Rating */}
                          <div className="mb-4">
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-medium text-gray-700">{t('overallRating')}:</span>
                              <div className="flex items-center">
                                {[...Array(10)].map((_, i) => (
                                  <svg
                                    key={i}
                                    className={`w-4 h-4 ${i < summary.overallRating ? 'text-yellow-400' : 'text-gray-300'}`}
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                  </svg>
                                ))}
                                <span className="ml-2 text-sm font-medium text-gray-700">
                                  {summary.overallRating}{t('ratingOutOf')}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Stage Ratings */}
                          <div className="mb-4">
                            <h4 className="text-sm font-medium text-gray-700 mb-2">{t('stageRatings')}:</h4>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                              {summary.stageRatings && Object.entries(summary.stageRatings).map(([stage, ratingData]) => {
                                // Handle both number and object formats
                                const rating = typeof ratingData === 'number' ? ratingData : ratingData?.rating || 0;
                                return (
                                  <div key={stage} className="text-center">
                                    <div className={`px-2 py-1 text-xs font-semibold rounded-full mb-1 ${getStageColor(stage)}`}>
                                      {translateStage(stage)}
                                    </div>
                                    <div className="text-sm font-medium">{rating}{t('ratingOutOf')}</div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Strengths and Improvements */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                              <h4 className="text-sm font-medium text-gray-700 mb-2">{t('strengths')}:</h4>
                              <ul className="text-sm text-gray-600 space-y-1">
                                {summary.strengths && summary.strengths.map((strength, index) => (
                                  <li key={index} className="flex items-start">
                                    <span className="text-green-500 mr-2">•</span>
                                    {translateAIContent(strength, language)}
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <h4 className="text-sm font-medium text-gray-700 mb-2">{t('areasForImprovement')}:</h4>
                              <ul className="text-sm text-gray-600 space-y-1">
                                {summary.improvements && summary.improvements.map((improvement, index) => (
                                  <li key={index} className="flex items-start">
                                    <span className="text-orange-500 mr-2">•</span>
                                    {translateAIContent(improvement, language)}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>

                          {/* Example Conversations */}
                          {summary.exampleConversations && summary.exampleConversations.length > 0 && (
                            <div className="mb-4">
                              <h4 className="text-sm font-medium text-gray-700 mb-2">{t('exampleConversations')}:</h4>
                              <div className="space-y-2">
                                {summary.exampleConversations && summary.exampleConversations.map((example, index) => (
                                  <div key={index} className="bg-gray-50 rounded-lg p-3">
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="text-sm font-medium text-gray-900">
                                        {example.conversationId.title}
                                      </span>
                                      <div className="flex items-center space-x-2">
                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStageColor(example.stage)}`}>
                                          {translateAIContent(example.stage, language)}
                                        </span>
                                        <span className="text-sm font-medium">{example.rating}/10</span>
                                      </div>
                                    </div>
                                    <p className="text-sm text-gray-600">{translateAIContent(example.notes, language)}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* AI Analysis */}
                          {summary.aiAnalysis && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-700 mb-2">{t('aiInsights')}:</h4>
                              <div className="space-y-3">
                                {summary.aiAnalysis.personalityInsights && (
                                  <div className="bg-blue-50 rounded-lg p-3">
                                    <h5 className="text-sm font-medium text-blue-900 mb-1">{t('personalityInsights')}:</h5>
                                    <p className="text-sm text-blue-800">{translateAIContent(summary.aiAnalysis.personalityInsights, language)}</p>
                                  </div>
                                )}
                                
                                {summary.aiAnalysis.communicationStyle && (
                                  <div className="bg-green-50 rounded-lg p-3">
                                    <h5 className="text-sm font-medium text-green-900 mb-1">{t('communicationStyle')}:</h5>
                                    <p className="text-sm text-green-800">{translateAIContent(summary.aiAnalysis.communicationStyle, language)}</p>
                                  </div>
                                )}
                                
                                {summary.aiAnalysis.recommendedFocus && summary.aiAnalysis.recommendedFocus.length > 0 && (
                                  <div className="bg-yellow-50 rounded-lg p-3">
                                    <h5 className="text-sm font-medium text-yellow-900 mb-1">{t('recommendedFocusAreas')}:</h5>
                                    <ul className="text-sm text-yellow-800 space-y-1">
                                      {summary.aiAnalysis.recommendedFocus.map((focus, index) => (
                                        <li key={index} className="flex items-start">
                                          <span className="text-yellow-600 mr-2">•</span>
                                          {translateAIContent(focus, language)}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                                
                                {summary.aiAnalysis.nextSteps && summary.aiAnalysis.nextSteps.length > 0 && (
                                  <div className="bg-purple-50 rounded-lg p-3">
                                    <h5 className="text-sm font-medium text-purple-900 mb-1">{t('nextSteps')}:</h5>
                                    <ul className="text-sm text-purple-800 space-y-1">
                                      {summary.aiAnalysis.nextSteps.map((step, index) => (
                                        <li key={index} className="flex items-start">
                                          <span className="text-purple-600 mr-2">•</span>
                                          {translateAIContent(step, language)}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Conversation Reader Modal */}
      {selectedConversation && (
        <ConversationReaderModal
          conversationId={selectedConversation}
          userId={user._id}
          onClose={() => setSelectedConversation(null)}
        />
      )}
    </div>
  );
};

export default UserDetailModal;
