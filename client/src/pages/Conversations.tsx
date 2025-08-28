import React from 'react';
import { useTranslation } from '../hooks/useTranslation.ts';

const Conversations: React.FC = () => {
  const { t } = useTranslation();
  
  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold mb-4">{t('conversations')}</h1>
      <div className="rounded-xl border border-gray-200 bg-white p-6 text-gray-600">
        {t('yourConversationsWillAppearHere')}
      </div>
    </div>
  );
};

export default Conversations;


