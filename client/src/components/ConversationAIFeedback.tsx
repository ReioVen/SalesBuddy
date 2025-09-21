import React from 'react';
import { useConversationTranslation } from '../hooks/useConversationTranslation.ts';
import { Language } from '../services/databaseTranslationService';
import { Loader2 } from 'lucide-react';

interface ConversationAIFeedbackProps {
  feedback: string;
  language: Language;
  conversationIndex: number;
  totalConversations: number;
  className?: string;
}

const ConversationAIFeedback: React.FC<ConversationAIFeedbackProps> = ({
  feedback,
  language,
  conversationIndex,
  totalConversations,
  className = ""
}) => {
  const { translatedFeedback, isTranslating, translationError } = useConversationTranslation({
    feedback,
    language,
    conversationIndex,
    totalConversations
  });

  if (!feedback) {
    return null;
  }

  return (
    <div className={`${className}`}>
      {isTranslating && (
        <div className="flex items-center gap-2 mb-1">
          <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
          <span className="text-xs text-gray-500">Translating...</span>
        </div>
      )}
      <p className="text-sm text-gray-600 dark:text-gray-300 italic">
        "{translatedFeedback}"
      </p>
      {translationError && (
        <div className="text-xs text-red-500 mt-1">
          Translation error: {translationError}
        </div>
      )}
    </div>
  );
};

export default ConversationAIFeedback;
