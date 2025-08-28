import { useState, useEffect } from 'react';
import { getTranslation, getCurrentLanguage, type Language } from '../utils/translations.ts';

export const useTranslation = () => {
  const [language, setLanguage] = useState<Language>(getCurrentLanguage);

  useEffect(() => {
    const handleLanguageChange = (event: CustomEvent<Language>) => {
      setLanguage(event.detail);
    };

    window.addEventListener('languageChanged', handleLanguageChange as EventListener);
    return () => {
      window.removeEventListener('languageChanged', handleLanguageChange as EventListener);
    };
  }, []);

  const t = (key: string): string => {
    return getTranslation(key, language);
  };

  return { t, language };
};
