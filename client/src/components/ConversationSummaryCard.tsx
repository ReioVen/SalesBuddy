import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Star, TrendingUp, Target, MessageSquare, Award, Lightbulb } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation.ts';
import { translateAIContent, translateAIArray } from '../utils/aiContentTranslator.ts';

interface StageRating {
  rating: number;
  feedback: string;
}

interface StageRatings {
  opening: StageRating;
  discovery: StageRating;
  presentation: StageRating;
  objectionHandling: StageRating;
  closing: StageRating;
}

interface ExampleConversation {
  conversationId: string;
  stage: string;
  excerpt: string;
  context: string;
}

interface AIAnalysis {
  personalityInsights: string;
  communicationStyle: string;
  recommendedFocus: string[];
  nextSteps: string[];
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
  stageRatings: StageRatings;
  strengths: string[];
  improvements: string[];
  exampleConversations: ExampleConversation[];
  aiAnalysis: AIAnalysis;
  createdAt: string;
}

interface ConversationSummaryCardProps {
  summary: ConversationSummary;
}

const ConversationSummaryCard: React.FC<ConversationSummaryCardProps> = ({ summary }) => {
  const { t, language } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'stages' | 'examples' | 'insights'>('overview');

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 8) return 'text-green-600 bg-green-100';
    if (rating >= 6) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getRatingIcon = (rating: number) => {
    if (rating >= 8) return '🌟';
    if (rating >= 6) return '⭐';
    return '📈';
  };

  const stageNames = {
    opening: t('stageOpening'),
    discovery: t('stageDiscovery'),
    presentation: t('stagePresentation'),
    objectionHandling: t('stageObjectionHandling'),
    closing: t('stageClosing')
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div 
        className="p-6 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Award className="w-6 h-6 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                {t('summaryNumber')}{summary.summaryNumber}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRatingColor(summary.overallRating)}`}>
                {getRatingIcon(summary.overallRating)} {summary.overallRating}{t('ratingOutOf')}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-500">
              {summary.conversationCount} {t('conversations')}
            </div>
            <div className="text-sm text-gray-500">
              {formatDate(summary.dateRange.startDate)} - {formatDate(summary.dateRange.endDate)}
            </div>
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-gray-200">
          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            {[
              { id: 'overview', label: t('overview'), icon: TrendingUp },
              { id: 'stages', label: t('stageRatings'), icon: Target },
              { id: 'examples', label: t('examples'), icon: MessageSquare },
              { id: 'insights', label: t('aiInsights'), icon: Lightbulb }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as any)}
                className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Overall Rating */}
                <div className="text-center">
                  <div className="text-4xl font-bold text-gray-900 mb-2">
                    {summary.overallRating}/10
                  </div>
                  <div className="text-lg text-gray-600">{t('overallPerformance')}</div>
                </div>

                {/* Strengths and Improvements */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-lg font-semibold text-green-700 mb-3 flex items-center gap-2">
                      <Star className="w-5 h-5" />
                      {t('strengths')}
                    </h4>
                    <ul className="space-y-2">
                      {summary.strengths.map((strength, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-green-500 mt-1">✓</span>
                          <span className="text-gray-700">{translateAIContent(strength, language)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-orange-700 mb-3 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5" />
                      {t('areasForImprovement')}
                    </h4>
                    <ul className="space-y-2">
                      {summary.improvements.map((improvement, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-orange-500 mt-1">→</span>
                          <span className="text-gray-700">{translateAIContent(improvement, language)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'stages' && (
              <div className="space-y-4">
                {Object.entries(summary.stageRatings).map(([stage, rating]) => (
                  <div key={stage} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-gray-900">
                        {stageNames[stage as keyof typeof stageNames] || translateAIContent(stage, language)}
                      </h4>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRatingColor(rating.rating)}`}>
                        {rating.rating}/10
                      </span>
                    </div>
                    <p className="text-gray-700">{translateAIContent(rating.feedback, language)}</p>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'examples' && (
              <div className="space-y-4">
                {summary.exampleConversations.map((example, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                        {translateAIContent(example.stage, language)}
                      </span>
                      <span className="text-sm text-gray-500">
                        {t('conversationTitle')} #{summary.summaryNumber}
                      </span>
                    </div>
                    <blockquote className="text-gray-700 italic mb-2">
                      "{translateAIContent(example.excerpt, language)}"
                    </blockquote>
                    <p className="text-sm text-gray-600">{translateAIContent(example.context, language)}</p>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'insights' && (
              <div className="space-y-6">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">{t('personalityInsights')}</h4>
                  <p className="text-gray-700">{translateAIContent(summary.aiAnalysis.personalityInsights, language)}</p>
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">{t('communicationStyle')}</h4>
                  <p className="text-gray-700">{translateAIContent(summary.aiAnalysis.communicationStyle, language)}</p>
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">{t('recommendedFocusAreas')}</h4>
                  <div className="flex flex-wrap gap-2">
                    {summary.aiAnalysis.recommendedFocus.map((focus, index) => (
                      <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                        {translateAIContent(focus, language)}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">{t('nextSteps')}</h4>
                  <ul className="space-y-2">
                    {summary.aiAnalysis.nextSteps.map((step, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-blue-500 mt-1">→</span>
                        <span className="text-gray-700">{translateAIContent(step, language)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ConversationSummaryCard;
