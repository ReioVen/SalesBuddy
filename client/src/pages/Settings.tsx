import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.tsx';
import { useTranslation } from '../hooks/useTranslation.ts';
import { useTheme } from '../contexts/ThemeContext.tsx';
import { type Language } from '../utils/translations.ts';
import { Sun, Moon, Monitor } from 'lucide-react';

const Settings: React.FC = () => {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const { theme, actualTheme, setTheme, toggleTheme } = useTheme();
  const [language, setLanguage] = useState<Language>('en');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('sb_language') as Language | null;
    if (saved) setLanguage(saved);
  }, []);

  const onSave = async () => {
    setSaving(true);
    try {
      localStorage.setItem('sb_language', language);
      // Trigger a custom event to notify other components about language change
      window.dispatchEvent(new CustomEvent('languageChanged', { detail: language }));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">{t('settings')}</h1>
      <div className="space-y-6">
        {/* Theme Settings */}
        <div className="rounded-xl border border-gray-200 dark:border-dark-700 bg-white dark:bg-dark-800 p-6">
          <h2 className="font-semibold mb-3 text-gray-900 dark:text-white">{t('theme') || 'Theme'}</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  {actualTheme === 'light' ? (
                    <Sun className="w-5 h-5 text-yellow-500" />
                  ) : (
                    <Moon className="w-5 h-5 text-blue-400" />
                  )}
                  <span className="text-gray-700 dark:text-gray-300">
                    {actualTheme === 'light' ? (t('lightMode') || 'Light Mode') : (t('darkMode') || 'Dark Mode')}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm text-gray-600 dark:text-gray-400">{t('themePreference') || 'Theme Preference'}</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setTheme('light')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                    theme === 'light'
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                      : 'bg-gray-100 dark:bg-dark-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-dark-600'
                  }`}
                >
                  <Sun className="w-4 h-4" />
                  {t('light') || 'Light'}
                </button>
                <button
                  onClick={() => setTheme('dark')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                    theme === 'dark'
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                      : 'bg-gray-100 dark:bg-dark-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-dark-600'
                  }`}
                >
                  <Moon className="w-4 h-4" />
                  {t('dark') || 'Dark'}
                </button>
                <button
                  onClick={() => setTheme('system')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                    theme === 'system'
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                      : 'bg-gray-100 dark:bg-dark-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-dark-600'
                  }`}
                >
                  <Monitor className="w-4 h-4" />
                  {t('system') || 'System'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Language Settings */}
        <div className="rounded-xl border border-gray-200 dark:border-dark-700 bg-white dark:bg-dark-800 p-6">
          <h2 className="font-semibold mb-3 text-gray-900 dark:text-white">{t('language')}</h2>
          <div className="flex items-center gap-3">
            <select
              className="input-field max-w-xs dark:bg-dark-700 dark:border-dark-600 dark:text-white"
              value={language}
              onChange={e => setLanguage(e.target.value as Language)}
            >
              <option value="en">English</option>
              <option value="et">Eesti</option>
              <option value="es">Español</option>
              <option value="ru">Русский</option>
            </select>
            <button className="btn-primary" onClick={onSave} disabled={saving}>
              {saving ? t('saving') : t('save')}
            </button>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">{t('appliesToDevice')}</p>
        </div>

        <div className="rounded-xl border border-gray-200 dark:border-dark-700 bg-white dark:bg-dark-800 p-6">
          <h2 className="font-semibold mb-3 text-gray-900 dark:text-white">{t('plan')}</h2>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-gray-500 dark:text-gray-400 text-sm">{t('currentPlan')}</div>
              <div className="font-medium capitalize text-gray-900 dark:text-white">{user?.subscription?.plan || 'free'}</div>
            </div>
            <Link to="/pricing" className="btn-primary">{t('changePlan')}</Link>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 dark:border-dark-700 bg-white dark:bg-dark-800 p-6">
          <h2 className="font-semibold mb-3 text-gray-900 dark:text-white">{t('session')}</h2>
          <button className="btn-secondary" onClick={logout}>{t('logout')}</button>
        </div>
      </div>
    </div>
  );
};

export default Settings;


