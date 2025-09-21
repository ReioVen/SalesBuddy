import { useState, useEffect } from 'react';
import { databaseTranslationService, Language } from '../services/databaseTranslationService.ts';

interface UseConversationTranslationProps {
  feedback: string;
  language: Language;
  conversationIndex: number;
  totalConversations: number;
}

export const useConversationTranslation = ({
  feedback,
  language,
  conversationIndex,
  totalConversations
}: UseConversationTranslationProps) => {
  const [translatedFeedback, setTranslatedFeedback] = useState<string>(feedback);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationError, setTranslationError] = useState<string | null>(null);

  useEffect(() => {
    if (!feedback || language === 'en') {
      setTranslatedFeedback(feedback);
      return;
    }

    const translateFeedback = async () => {
      setIsTranslating(true);
      setTranslationError(null);

      try {
        const translated = await databaseTranslationService.translateConversationFeedbackSmart(
          feedback,
          language,
          conversationIndex,
          totalConversations
        );
        setTranslatedFeedback(translated);
      } catch (error) {
        console.error('Error translating conversation feedback:', error);
        setTranslationError(error instanceof Error ? error.message : 'Translation failed');
        setTranslatedFeedback(feedback); // Fallback to original
      } finally {
        setIsTranslating(false);
      }
    };

    translateFeedback();
  }, [feedback, language, conversationIndex, totalConversations]);

  return {
    translatedFeedback,
    isTranslating,
    translationError
  };
};
