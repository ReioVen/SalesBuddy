import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.tsx';
import { Eye, EyeOff } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';
import { type Language } from '../utils/translations';

const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { t, language } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleLanguageChange = (newLanguage: Language) => {
    localStorage.setItem('sb_language', newLanguage);
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: newLanguage }));
  };

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      setError(null);
      const result = await login(form.email, form.password);
      if (result.success) {
        navigate('/');
      } else {
        setError(result.message || t('invalidCredentials'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-900 flex items-start justify-center pt-56 pb-16 px-4">
      <div className="w-full max-w-md bg-white dark:bg-dark-800 rounded-2xl shadow-2xl ring-1 ring-gray-200 dark:ring-dark-700 border border-gray-100 dark:border-dark-700 p-5">
        {/* Language Selector */}
        <div className="mb-4">
          <select
            value={language}
            onChange={(e) => handleLanguageChange(e.target.value as Language)}
            className="w-full text-sm border border-gray-300 dark:border-dark-600 rounded-md px-3 py-2 bg-white dark:bg-dark-700 text-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="en">🇺🇸 English</option>
            <option value="et">🇪🇪 Eesti</option>
            <option value="es">🇪🇸 Español</option>
            <option value="ru">🇷🇺 Русский</option>
          </select>
        </div>
        <h1 className="text-2xl font-bold mb-6 text-center text-gray-900 dark:text-white">{t('welcomeBack')}</h1>
        <form onSubmit={onSubmit} className="space-y-4">
          <input className="input-field" name="email" type="email" placeholder={t('email')} value={form.email} onChange={onChange} required />
          <div className="relative">
            <input 
              className="input-field pr-10" 
              name="password" 
              type={showPassword ? "text" : "password"} 
              placeholder={t('password')} 
              value={form.password} 
              onChange={onChange} 
              required 
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300" />
              ) : (
                <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300" />
              )}
            </button>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary w-full">{loading ? t('signingIn') : t('signIn')}</button>
        </form>
        <div className="text-center text-sm text-gray-600 dark:text-gray-300 mt-4 space-y-2">
          <p>
            {t('newHere')} <Link to="/register" className="text-blue-600 dark:text-blue-400 hover:underline">{t('createAnAccount')}</Link>
          </p>
          <p>
            <Link to="/forgot-password" className="text-blue-600 dark:text-blue-400 hover:underline">{t('forgotPassword')}</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;


