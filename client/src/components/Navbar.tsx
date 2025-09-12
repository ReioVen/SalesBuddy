import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.tsx';
import { useTranslation } from '../hooks/useTranslation.ts';
import { type Language } from '../utils/translations.ts';

const Navbar: React.FC = () => {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const { t, language } = useTranslation();
  const location = useLocation();

  const handleLanguageChange = (newLanguage: Language) => {
    localStorage.setItem('sb_language', newLanguage);
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: newLanguage }));
  };

  // Get active link classes based on current path
  const getNavLinkClasses = (path: string) => {
    const isActive = location.pathname === path;
    return `relative px-3 py-2 text-sm font-medium transition-colors ${
      isActive
        ? 'text-blue-700'
        : 'text-gray-700 hover:text-gray-900'
    }`;
  };

  return (
    <header className="fixed top-0 inset-x-0">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mt-3 rounded-xl border border-gray-200 bg-white/80 backdrop-blur shadow-sm">
          <div className="h-14 px-3 md:px-4 grid grid-cols-3 items-center">
            <Link to="/" className="flex items-center gap-2 font-semibold text-gray-900">
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-600 to-cyan-400 text-white text-xs font-bold">
                SB
              </span>
              <span>SalesBuddy</span>
            </Link>

            <nav className="hidden md:flex items-center gap-2 justify-center">
              <Link to="/" className={getNavLinkClasses('/')}>{t('home')}</Link>
              {user ? (
                <>
                  <Link to="/conversations" className={getNavLinkClasses('/conversations')}>{t('conversations')}</Link>
                  <Link to="/conversation-summaries" className={getNavLinkClasses('/conversation-summaries')}>Summaries</Link>
                  <Link to="/profile" className={getNavLinkClasses('/profile')}>{t('profile')}</Link>
                  {user.companyId && (
                    <Link to="/company" className={getNavLinkClasses('/company')}>Company</Link>
                  )}
                  {(user.role === 'super_admin' || user.role === 'admin' || user.isSuperAdmin || user.isAdmin) && (
                    <Link to="/admin" className={getNavLinkClasses('/admin')}>Admin</Link>
                  )}
                </>
              ) : (
                <>
                  <Link to="/pricing" className={getNavLinkClasses('/pricing')}>{t('pricing')}</Link>
                  <Link to="/login" className={getNavLinkClasses('/login')}>{t('login')}</Link>
                </>
              )}
            </nav>

            <div className="hidden md:flex items-center gap-3 justify-end">
              {/* Language Selector */}
              <select
                value={language}
                onChange={(e) => handleLanguageChange(e.target.value as Language)}
                className="text-sm border border-gray-300 rounded-md px-2 py-1 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="en">🇺🇸 EN</option>
                <option value="et">🇪🇪 ET</option>
                <option value="es">🇪🇸 ES</option>
                <option value="ru">🇷🇺 RU</option>
              </select>
              
              {user ? (
                <Link to="/settings" className="btn-secondary px-5 py-2.5">{t('settings')}</Link>
              ) : (
                <Link to="/pricing" className="btn-primary px-5 py-2.5">{t('getStarted')}</Link>
              )}
            </div>

            <button
              type="button"
              aria-label="Toggle menu"
              aria-expanded={open}
              onClick={() => setOpen(v => !v)}
              className="md:hidden inline-flex items-center justify-center w-9 h-9 rounded-md border border-gray-300 text-gray-700 bg-white"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-5 h-5">
                {open ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>

          {/* Mobile panel */}
          {open && (
            <div className="md:hidden border-t border-gray-200 px-3 py-3">
              <div className="flex flex-col gap-1">
                {/* Mobile Language Selector */}
                <div className="py-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">{t('language')}</label>
                  <select
                    value={language}
                    onChange={(e) => handleLanguageChange(e.target.value as Language)}
                    className="w-full text-sm border border-gray-300 rounded-md px-2 py-1 bg-white text-gray-700"
                  >
                    <option value="en">🇺🇸 English</option>
                    <option value="et">🇪🇪 Eesti</option>
                    <option value="es">🇪🇸 Español</option>
                    <option value="ru">🇷🇺 Русский</option>
                  </select>
                </div>
                
                <Link to="/" className={getNavLinkClasses('/')} onClick={() => setOpen(false)}>{t('home')}</Link>
                {user ? (
                  <>
                    <Link to="/conversations" className={getNavLinkClasses('/conversations')} onClick={() => setOpen(false)}>{t('conversations')}</Link>
                    <Link to="/conversation-summaries" className={getNavLinkClasses('/conversation-summaries')} onClick={() => setOpen(false)}>Summaries</Link>
                    <Link to="/profile" className={getNavLinkClasses('/profile')} onClick={() => setOpen(false)}>{t('profile')}</Link>
                    {user.companyId && (
                      <Link to="/company" className={getNavLinkClasses('/company')} onClick={() => setOpen(false)}>Company</Link>
                    )}
                    {(user.role === 'super_admin' || user.role === 'admin' || user.isSuperAdmin || user.isAdmin) && (
                      <Link to="/admin" className={getNavLinkClasses('/admin')} onClick={() => setOpen(false)}>Admin</Link>
                    )}
                  </>
                ) : (
                  <>
                    <Link to="/pricing" className={getNavLinkClasses('/pricing')} onClick={() => setOpen(false)}>{t('pricing')}</Link>
                    <Link to="/login" className={getNavLinkClasses('/login')} onClick={() => setOpen(false)}>{t('login')}</Link>
                  </>
                )}
                {user ? (
                  <Link to="/settings" className="btn-secondary mt-2 px-5 py-2.5 text-center" onClick={() => setOpen(false)}>
                    {t('settings')}
                  </Link>
                ) : (
                  <Link to="/pricing" className="btn-primary mt-2 px-5 py-2.5 text-center" onClick={() => setOpen(false)}>
                    {t('getStarted')}
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
