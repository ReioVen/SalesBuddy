import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.tsx';
import axios from 'axios';
import toast from 'react-hot-toast';
import ConversationSummaryCard from '../components/ConversationSummaryCard.tsx';
import { Award, TrendingUp, MessageSquare, Loader2 } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation.ts';
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
  const { user } = useAuth();
  const { t, language } = useTranslation();
  // Removed AI translation context - now using database translations
  const [summaries, setSummaries] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadSummaries();
    }
  }, [user]);

  // Database translations are handled automatically by each ConversationSummaryCard

  const loadSummaries = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/conversation-summaries');
      setSummaries(response.data.summaries);
    } catch (error: any) {
      console.error('Failed to load conversation summaries:', error);
      setError(t('failedToLoadConversationSummaries'));
      toast.error(t('failedToLoadConversationSummaries'));
    } finally {
      setLoading(false);
    }
  };

  const generateNewSummary = async () => {
    try {
      setLoading(true);
      const response = await axios.post('/api/conversation-summaries/generate');
      const newSummary = response.data.summary;
      setSummaries(prev => [newSummary, ...prev]);
      toast.success(t('newConversationSummaryGenerated'));
    } catch (error: any) {
      console.error('Failed to generate summary:', error);
      const errorMessage = error.response?.data?.error || t('failedToGenerateSummary');
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loading && summaries.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-center h-64">
            <div className="flex items-center gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              <span className="text-gray-600">{t('loadingConversationSummaries')}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-red-800 mb-2">{t('errorLoadingSummaries')}</h2>
            <p className="text-red-600 mb-4">{error}</p>
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Award className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">{t('conversationSummaries')}</h1>
          </div>
          <p className="text-gray-600 text-lg">
            {t('aiPoweredAnalysis')}
          </p>
        </div>

        {/* Stats */}
        {summaries.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center gap-3">
                <Award className="w-8 h-8 text-blue-600" />
                <div>
                  <div className="text-2xl font-bold text-gray-900">{summaries.length}</div>
                  <div className="text-gray-600">{t('totalSummaries')}</div>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center gap-3">
                <MessageSquare className="w-8 h-8 text-green-600" />
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {summaries.reduce((total, summary) => total + summary.conversationCount, 0)}
                  </div>
                  <div className="text-gray-600">{t('conversationsAnalyzed')}</div>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-8 h-8 text-purple-600" />
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {summaries.length > 0 
                      ? (summaries.reduce((total, summary) => total + summary.overallRating, 0) / summaries.length).toFixed(1)
                      : '0.0'
                    }
                  </div>
                  <div className="text-gray-600">{t('averageRating')}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Generate New Summary Button */}
        <div className="mb-6">
          <button
            onClick={generateNewSummary}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Award className="w-5 h-5" />
            )}
            {t('generateNewSummary')}
          </button>
          <p className="text-sm text-gray-500 mt-2">
            {t('generateSummaryDescription')}
          </p>
        </div>


        {/* Summaries List */}
        {summaries.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <Award className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('noSummariesYet')}</h3>
            <p className="text-gray-600 mb-6">
              {t('noSummariesDescription')}
            </p>
            <button
              onClick={generateNewSummary}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mx-auto"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Award className="w-5 h-5" />
              )}
              {t('generateSummary')}
            </button>
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
