import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.tsx';
import axios from 'axios';
import toast from 'react-hot-toast';
import ConversationSummaryCard from '../components/ConversationSummaryCard.tsx';
import { Award, TrendingUp, MessageSquare, Loader2 } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation.ts';

const API_BASE_URL = 'https://salesbuddy-production.up.railway.app';
// Removed AI translation context - now using database translations

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
    opening: { rating: number; feedback: string };
    discovery: { rating: number; feedback: string };
    presentation: { rating: number; feedback: string };
    objectionHandling: { rating: number; feedback: string };
    closing: { rating: number; feedback: string };
  };
  strengths: string[];
  improvements: string[];
  exampleConversations: Array<{
    conversationId: string;
    stage: string;
    excerpt: string;
    context: string;
  }>;
  aiAnalysis: {
    personalityInsights: string;
    communicationStyle: string;
    recommendedFocus: string[];
    nextSteps: string[];
  };
  createdAt: string;
}

const ConversationSummaries: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const { t, language } = useTranslation();
  // Removed AI translation context - now using database translations
  const [summaries, setSummaries] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [conversationCount, setConversationCount] = useState<number>(0);
  const [summaryStatus, setSummaryStatus] = useState<{
    summariesGeneratedToday: number;
    totalSummariesGenerated: number;
    dailyLimit: number;
    remainingToday: number;
    canGenerate: boolean;
  } | null>(null);

  // Database translations are handled automatically by each ConversationSummaryCard

  const loadSummaries = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/conversation-summaries`, {
        withCredentials: true
      });
      setSummaries(response.data.summaries);
    } catch (error: any) {
      console.error('Failed to load conversation summaries:', error);
      setError(t('failedToLoadConversationSummaries'));
      toast.error(t('failedToLoadConversationSummaries'));
    } finally {
      setLoading(false);
    }
  };

  const loadSummaryStatus = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/conversation-summaries/status`, {
        withCredentials: true
      });
      setSummaryStatus(response.data.summaryStatus);
    } catch (error: any) {
      console.error('Failed to load summary status:', error);
    }
  };

  const loadConversationCount = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/ai/conversations/count`, {
        withCredentials: true
      });
      setConversationCount(response.data.count || 0);
    } catch (error: any) {
      console.error('Failed to load conversation count:', error);
      setConversationCount(0);
    }
  };

  useEffect(() => {
    if (user) {
      loadSummaries();
      loadSummaryStatus();
      loadConversationCount();
    }
  }, [user]);


  // Check if user is on free plan and show lock screen
  if (user && user.subscription?.plan === 'free') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-900 py-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center">
            <div className="w-24 h-24 bg-gray-100 dark:bg-dark-800 rounded-full flex items-center justify-center mx-auto mb-6">
              <Award className="w-12 h-12 text-gray-400 dark:text-gray-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              {t('summariesLocked') || 'Summaries Locked'}
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
              {t('summariesLockedDescription') || 'Upgrade your plan to unlock conversation summaries and detailed performance analytics.'}
            </p>
            <div className="bg-white dark:bg-dark-800 rounded-lg shadow-lg p-8 mb-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                {t('whatYouGet') || 'What you get with an upgrade:'}
              </h2>
              <ul className="space-y-3 text-left max-w-md mx-auto">
                <li className="flex items-center text-gray-700 dark:text-gray-300">
                  <Award className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                  {t('conversationSummaries') || 'Conversation summaries'}
                </li>
                <li className="flex items-center text-gray-700 dark:text-gray-300">
                  <TrendingUp className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                  {t('performanceAnalytics') || 'Performance analytics'}
                </li>
                <li className="flex items-center text-gray-700 dark:text-gray-300">
                  <MessageSquare className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                  {t('detailedFeedback') || 'Detailed feedback'}
                </li>
              </ul>
            </div>
            <a
              href="/pricing"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors duration-200"
            >
              {t('upgradePlan') || 'Upgrade Plan'}
            </a>
          </div>
        </div>
      </div>
    );
  }


  const generateNewSummary = async () => {
    try {
      setLoading(true);
      const response = await axios.post(`${API_BASE_URL}/api/conversation-summaries/generate`, {}, {
        withCredentials: true
      });
      const newSummary = response.data.summary;
      setSummaries(prev => [newSummary, ...prev]);
      toast.success(t('newConversationSummaryGenerated'));
      // Refresh summary status after successful generation
      await loadSummaryStatus();
    } catch (error: any) {
      console.error('Failed to generate summary:', error);
      const errorMessage = error.response?.data?.error || t('failedToGenerateSummary');
      toast.error(errorMessage);
      // Refresh summary status even on error to get updated limit info
      await loadSummaryStatus();
    } finally {
      setLoading(false);
    }
  };

  if (loading && summaries.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-900 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-center h-64">
            <div className="flex items-center gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              <span className="text-gray-600 dark:text-gray-300">{t('loadingConversationSummaries')}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-900 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">{t('errorLoadingSummaries')}</h2>
            <p className="text-red-600 dark:text-red-300 mb-4">{error}</p>
            <button
              onClick={loadSummaries}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              {t('tryAgain')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-900 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Award className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('conversationSummaries')}</h1>
          </div>
          <p className="text-gray-600 dark:text-gray-300 text-lg">
            {t('aiPoweredAnalysis')}
          </p>
        </div>

        {/* Stats */}
        {summaries.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white dark:bg-dark-800 rounded-lg border border-gray-200 dark:border-dark-700 p-6">
              <div className="flex items-center gap-3">
                <Award className="w-8 h-8 text-blue-600" />
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{summaries.length}</div>
                  <div className="text-gray-600 dark:text-gray-300">{t('totalSummaries')}</div>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-dark-800 rounded-lg border border-gray-200 dark:border-dark-700 p-6">
              <div className="flex items-center gap-3">
                <MessageSquare className="w-8 h-8 text-green-600" />
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {summaries.reduce((total, summary) => total + summary.conversationCount, 0)}
                  </div>
                  <div className="text-gray-600 dark:text-gray-300">{t('conversationsAnalyzed')}</div>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-dark-800 rounded-lg border border-gray-200 dark:border-dark-700 p-6">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-8 h-8 text-purple-600" />
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {summaries.length > 0 
                      ? (summaries.reduce((total, summary) => total + summary.overallRating, 0) / summaries.length).toFixed(1)
                      : '0.0'
                    }
                  </div>
                  <div className="text-gray-600 dark:text-gray-300">{t('averageRating')}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Generate New Summary Button - Only show if user has enough conversations */}
        {conversationCount >= 5 && (
          <div className="mb-6">
            <div className="flex items-center gap-4 mb-4">
              <button
                onClick={generateNewSummary}
                disabled={loading || (summaryStatus && !summaryStatus.canGenerate)}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Award className="w-5 h-5" />
                )}
                {t('generateNewSummary')}
              </button>
              
              {/* Daily Limit Status */}
              {summaryStatus && (
                <div className="flex items-center gap-2 text-sm">
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                    summaryStatus.canGenerate 
                      ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200' 
                      : 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200'
                  }`}>
                    {summaryStatus.summariesGeneratedToday}/{summaryStatus.dailyLimit} summaries today
                  </div>
                  {summaryStatus.canGenerate && (
                    <span className="text-gray-600 dark:text-gray-400">
                      {summaryStatus.remainingToday} remaining
                    </span>
                  )}
                  {!summaryStatus.canGenerate && (
                    <span className="text-red-600 dark:text-red-400">
                      Daily limit reached
                    </span>
                  )}
                </div>
              )}
            </div>
            
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t('generateSummaryDescription')}
            </p>
            
            {summaryStatus && !summaryStatus.canGenerate && (
              <p className="text-sm text-red-600 dark:text-red-400 mt-2">
                You've reached your daily limit of 5 summaries. Try again tomorrow!
              </p>
            )}
          </div>
        )}


        {/* Summaries List */}
        {summaries.length === 0 ? (
          <div className="bg-white dark:bg-dark-800 rounded-lg border border-gray-200 dark:border-dark-600 p-12 text-center">
            <Award className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            
            {conversationCount < 5 ? (
              <>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{t('complete5ConversationsFirst')}</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  {t('need5ConversationsDescription', { 
                    count: conversationCount, 
                    plural: conversationCount !== 1 ? 's' : '' 
                  })}
                </p>
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
                  <p className="text-blue-800 dark:text-blue-200 text-sm">
                    <strong>{t('needMoreConversations', { count: 5 - conversationCount, plural: 5 - conversationCount !== 1 ? 's' : '' })}</strong>
                  </p>
                </div>
                <button
                  onClick={() => window.location.href = '/conversations'}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors mx-auto"
                >
                  <MessageSquare className="w-5 h-5" />
                  {t('startConversations')}
                </button>
              </>
            ) : (
              <>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{t('noSummariesYet')}</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  {t('noSummariesDescription')}
                </p>
                <button
                  onClick={generateNewSummary}
                  disabled={loading || (summaryStatus && !summaryStatus.canGenerate)}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mx-auto"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Award className="w-5 h-5" />
                  )}
                  {summaryStatus && !summaryStatus.canGenerate ? 'Daily Limit Reached' : t('generateSummary')}
                </button>
                {summaryStatus && !summaryStatus.canGenerate && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    You've reached your daily limit of 5 summaries. Try again tomorrow!
                  </p>
                )}
              </>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {summaries.map((summary, index) => (
              <ConversationSummaryCard key={summary._id} summary={summary} index={index} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ConversationSummaries;
