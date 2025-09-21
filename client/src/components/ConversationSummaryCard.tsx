import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Star, TrendingUp, Target, MessageSquare, Award, Lightbulb, Loader2 } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation.ts';
import { databaseTranslationService } from '../services/databaseTranslationService.ts';

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
  translations?: {
    et?: {
      strengths: string[];
      improvements: string[];
      stageRatings: StageRatings;
      aiAnalysis: AIAnalysis;
    };
    es?: {
      strengths: string[];
      improvements: string[];
      stageRatings: StageRatings;
      aiAnalysis: AIAnalysis;
    };
    ru?: {
      strengths: string[];
      improvements: string[];
      stageRatings: StageRatings;
      aiAnalysis: AIAnalysis;
    };
  };
  createdAt: string;
}

interface ConversationSummaryCardProps {
  summary: ConversationSummary;
  index: number;
}

const ConversationSummaryCard: React.FC<ConversationSummaryCardProps> = ({ summary, index }) => {
  const { t, language } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'stages' | 'examples' | 'insights'>('overview');
  const [translatedSummary, setTranslatedSummary] = useState<ConversationSummary | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationAttempted, setTranslationAttempted] = useState(false);

  // Reset translation attempted flag when language changes
  useEffect(() => {
    setTranslationAttempted(false);
  }, [language]);

  // Use pre-translated content from database when language changes
  useEffect(() => {
    
    if (language === 'en' || !summary) {
      setTranslatedSummary(null);
      setTranslationAttempted(false);
      return;
    }

    // Reset translation attempted flag when language changes
    if (translationAttempted) {
      return;
    }

    // Check if we have pre-translated content for this language
    // For latest summaries (index < 2), always use Google Translate for proper content translation
    const isLatestSummary = index < 2;
    const hasPreTranslatedContent = summary.translations && summary.translations[language];
    
    if (hasPreTranslatedContent && !isLatestSummary) {
      const preTranslated = summary.translations[language];
      
      // Create a translated summary using pre-translated content
      const translatedSummary = {
        ...summary,
        strengths: preTranslated.strengths || summary.strengths,
        improvements: preTranslated.improvements || summary.improvements,
        stageRatings: preTranslated.stageRatings || summary.stageRatings,
        aiAnalysis: preTranslated.aiAnalysis || summary.aiAnalysis
      };
      
      setTranslatedSummary(translatedSummary);
      setTranslationAttempted(true);
    } else {
      // For latest summaries, always force re-translation to ensure proper Google Translate results
      // Determine if this summary should be translated automatically (latest 2) or on-demand
      // Since summaries are sorted by summaryNumber descending (latest first),
      // the first 2 summaries in the array (index 0 and 1) are the latest
      const shouldTranslateAutomatically = isLatestSummary || isExpanded;
      
      
      if (!shouldTranslateAutomatically) {
        setTranslatedSummary(null);
        setTranslationAttempted(true);
        return;
      }
      
      
      const token = localStorage.getItem('token');
      
      // For latest summaries, always try Google Translate first, even without token
      if (!token && !isLatestSummary) {
        setIsTranslating(true);
        
        const handleStaticTranslation = async () => {
          try {
            await databaseTranslationService.forceRefreshTranslations(language);
            const translated = databaseTranslationService.translateSummaryContentSync(summary, language);
            setTranslatedSummary(translated);
            setTranslationAttempted(true);
          } catch (error) {
            console.error('Error with static translation:', error);
            setTranslatedSummary(null);
            setTranslationAttempted(true);
          } finally {
            setIsTranslating(false);
          }
        };
        
        handleStaticTranslation();
        return;
      }
      
      // For latest summaries without token, use enhanced static translation with better AI content handling
      if (!token && isLatestSummary) {
        setIsTranslating(true);
        
        const handleEnhancedStaticTranslation = async () => {
          try {
            // Try to refresh translations, but don't fail if it doesn't work
            try {
              await databaseTranslationService.forceRefreshTranslations(language);
            } catch (refreshError) {
              // Could not refresh translations, using existing ones
            }
            
            // For AI insights, use a more comprehensive translation approach with fallback
            // Collect all texts that need translation
            const allTexts: string[] = [
              ...summary.strengths,
              ...summary.improvements,
              ...Object.values(summary.stageRatings).map(rating => rating.feedback),
              summary.aiAnalysis.personalityInsights,
              summary.aiAnalysis.communicationStyle,
              ...summary.aiAnalysis.recommendedFocus,
              ...summary.aiAnalysis.nextSteps
            ];

            // Batch translate all texts at once
            const translatedTexts = await databaseTranslationService.batchTranslateTexts(allTexts, language);

            // Reconstruct the translated summary
            let textIndex = 0;
            const translatedSummary = {
              ...summary,
              strengths: summary.strengths.map(() => translatedTexts[textIndex++]),
              improvements: summary.improvements.map(() => translatedTexts[textIndex++]),
              stageRatings: Object.fromEntries(
                Object.entries(summary.stageRatings).map(([stage, rating]) => [
                  stage,
                  {
                    ...rating,
                    feedback: translatedTexts[textIndex++]
                  }
                ])
              ),
              aiAnalysis: {
                ...summary.aiAnalysis,
                personalityInsights: translatedTexts[textIndex++],
                communicationStyle: translatedTexts[textIndex++],
                recommendedFocus: summary.aiAnalysis.recommendedFocus.map(() => translatedTexts[textIndex++]),
                nextSteps: summary.aiAnalysis.nextSteps.map(() => translatedTexts[textIndex++])
              }
            };
            
            setTranslatedSummary(translatedSummary);
            setTranslationAttempted(true);
          } catch (error) {
            console.error('Error with enhanced static translation:', error);
            setTranslatedSummary(null);
            setTranslationAttempted(true);
          } finally {
            setIsTranslating(false);
          }
        };
        
        handleEnhancedStaticTranslation();
        return;
      }
      
      // Request on-demand translation for this summary
      setIsTranslating(true);
      
      const requestTranslation = async () => {
        try {
          
          const response = await fetch(`/api/conversation-summaries/${summary._id}/translate`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ targetLanguage: language })
          });

          if (!response.ok) {
            throw new Error(`Translation request failed: ${response.status}`);
          }

          const result = await response.json();
          if (result.success && result.translation) {
            
            // Create a translated summary using the received translation
            const translatedSummary = {
              ...summary,
              strengths: result.translation.strengths || summary.strengths,
              improvements: result.translation.improvements || summary.improvements,
              stageRatings: result.translation.stageRatings || summary.stageRatings,
              aiAnalysis: result.translation.aiAnalysis || summary.aiAnalysis
            };
            
            setTranslatedSummary(translatedSummary);
            setTranslationAttempted(true);
          } else {
            throw new Error('Translation request failed');
          }
        } catch (error) {
          console.error('Error requesting on-demand translation:', error);
          // Fall back to static translation
          await databaseTranslationService.forceRefreshTranslations(language);
          const translated = databaseTranslationService.translateSummaryContentSync(summary, language);
          setTranslatedSummary(translated);
          setTranslationAttempted(true);
        } finally {
          setIsTranslating(false);
        }
      };
      
      requestTranslation();
    }
  }, [summary, language, isExpanded, index]);

  // Trigger translation when summary is expanded (for summaries not in latest 2)
  useEffect(() => {
    if (isExpanded && language !== 'en' && summary && !translationAttempted) {
      const isLatestSummary = index < 2; // First 2 summaries are the latest
      if (!isLatestSummary) {
        setTranslationAttempted(false); // Reset to allow translation
      }
    }
  }, [isExpanded, language, summary, translationAttempted, index]);

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
    <div className="bg-white dark:bg-dark-800 rounded-lg border border-gray-200 dark:border-dark-700 shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div 
        className="p-6 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Award className="w-6 h-6 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t('summaryNumber')}{summary.summaryNumber}
              </h3>
              {isTranslating && (
                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRatingColor(summary.overallRating)}`}>
                {getRatingIcon(summary.overallRating)} {summary.overallRating}{t('ratingOutOf')}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {summary.conversationCount} {t('conversations')}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
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
        <div className="border-t border-gray-200 dark:border-dark-700">
          {/* Tabs */}
          <div className="flex border-b border-gray-200 dark:border-dark-700">
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
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
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
                  <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                    {summary.overallRating}/10
                  </div>
                  <div className="text-lg text-gray-600 dark:text-gray-300">{t('overallPerformance')}</div>
                </div>

                {/* Strengths and Improvements */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-lg font-semibold text-green-700 dark:text-green-400 mb-3 flex items-center gap-2">
                      <Star className="w-5 h-5" />
                      {t('strengths')}
                    </h4>
                    <ul className="space-y-2">
                      {(translatedSummary?.strengths || summary.strengths).map((strength, index) => {
                        console.log(`Strength ${index}:`, { 
                          original: summary.strengths[index], 
                          translated: translatedSummary?.strengths?.[index],
                          final: strength,
                          hasTranslatedSummary: !!translatedSummary,
                          translatedSummaryStrengths: translatedSummary?.strengths
                        });
                        return (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-green-500 mt-1">✓</span>
                            <span className="text-gray-700 dark:text-gray-300">
                              {strength}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-orange-700 dark:text-orange-400 mb-3 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5" />
                      {t('areasForImprovement')}
                    </h4>
                    <ul className="space-y-2">
                      {(translatedSummary?.improvements || summary.improvements).map((improvement, index) => {
                        console.log(`Improvement ${index}:`, { 
                          original: summary.improvements[index], 
                          translated: translatedSummary?.improvements?.[index],
                          final: improvement,
                          hasTranslatedSummary: !!translatedSummary
                        });
                        return (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-orange-500 mt-1">→</span>
                            <span className="text-gray-700 dark:text-gray-300">
                              {improvement}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'stages' && (
              <div className="space-y-4">
                {Object.entries(summary.stageRatings).map(([stage, rating]) => (
                  <div key={stage} className="bg-gray-50 dark:bg-dark-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        {stageNames[stage as keyof typeof stageNames] || stage}
                      </h4>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRatingColor(rating.rating)}`}>
                        {rating.rating}/10
                      </span>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300">
                      {(() => {
                        const feedback = translatedSummary?.stageRatings?.[stage]?.feedback || rating.feedback;
                        console.log(`Stage ${stage} feedback:`, { 
                          original: rating.feedback, 
                          translated: translatedSummary?.stageRatings?.[stage]?.feedback,
                          final: feedback,
                          hasTranslatedSummary: !!translatedSummary
                        });
                        return feedback;
                      })()}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'examples' && (
              <div className="space-y-4">
                {summary.exampleConversations.map((example, index) => (
                  <div key={index} className="bg-gray-50 dark:bg-dark-700 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-medium rounded">
                        {example.stage}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {t('conversationTitle')} #{summary.summaryNumber}
                      </span>
                    </div>
                    <blockquote className="text-gray-700 dark:text-gray-300 italic mb-2">
                      "{example.excerpt}"
                    </blockquote>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{example.context}</p>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'insights' && (
              <div className="space-y-6">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">{t('personalityInsights')}</h4>
                  <p className="text-gray-700 dark:text-gray-300">{(translatedSummary?.aiAnalysis?.personalityInsights || summary.aiAnalysis.personalityInsights)}</p>
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">{t('communicationStyle')}</h4>
                  <p className="text-gray-700 dark:text-gray-300">{(translatedSummary?.aiAnalysis?.communicationStyle || summary.aiAnalysis.communicationStyle)}</p>
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">{t('recommendedFocusAreas')}</h4>
                  <div className="flex flex-wrap gap-2">
                    {(translatedSummary?.aiAnalysis?.recommendedFocus || summary.aiAnalysis.recommendedFocus).map((focus, index) => (
                      <span key={index} className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm rounded-full">
                        {focus}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">{t('nextSteps')}</h4>
                  <ul className="space-y-2">
                    {(translatedSummary?.aiAnalysis?.nextSteps || summary.aiAnalysis.nextSteps).map((step, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-blue-500 dark:text-blue-400 mt-1">→</span>
                        <span className="text-gray-700 dark:text-gray-300">{step}</span>
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
