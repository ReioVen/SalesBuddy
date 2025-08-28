import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.tsx';
import { useTranslation } from '../hooks/useTranslation.ts';
import { type Language } from '../utils/translations.ts';

const Settings: React.FC = () => {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
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
      <h1 className="text-2xl font-bold mb-4">{t('settings')}</h1>
      <div className="space-y-6">
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="font-semibold mb-3">{t('language')}</h2>
          <div className="flex items-center gap-3">
            <select
              className="input-field max-w-xs"
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
          <p className="text-xs text-gray-500 mt-2">{t('appliesToDevice')}</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="font-semibold mb-3">{t('plan')}</h2>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-gray-500 text-sm">{t('currentPlan')}</div>
              <div className="font-medium capitalize">{user?.subscription?.plan || 'free'}</div>
            </div>
            <Link to="/pricing" className="btn-primary">{t('changePlan')}</Link>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="font-semibold mb-3">{t('session')}</h2>
          <button className="btn-secondary" onClick={logout}>{t('logout')}</button>
        </div>
      </div>
    </div>
  );
};

export default Settings;


