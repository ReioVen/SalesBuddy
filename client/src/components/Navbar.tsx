import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.tsx';
import { useTranslation } from '../hooks/useTranslation.ts';

const navLinkClasses = ({ isActive }: { isActive: boolean }) =>
  `relative px-3 py-2 text-sm font-medium transition-colors ${
    isActive
      ? 'text-blue-700'
      : 'text-gray-700 hover:text-gray-900'
  }`;

const Navbar: React.FC = () => {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const { t } = useTranslation();

  return (
    <header className="fixed top-0 inset-x-0 z-40">
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
              <NavLink to="/" className={navLinkClasses}>{t('home')}</NavLink>
              {user ? (
                <>
                  <NavLink to="/conversations" className={navLinkClasses}>{t('conversations')}</NavLink>
                  <NavLink to="/profile" className={navLinkClasses}>{t('profile')}</NavLink>
                </>
              ) : (
                <NavLink to="/login" className={navLinkClasses}>{t('login')}</NavLink>
              )}
            </nav>

            <div className="hidden md:flex items-center gap-3 justify-end">
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
                <NavLink to="/" className={navLinkClasses} onClick={() => setOpen(false)}>{t('home')}</NavLink>
                {user ? (
                  <>
                    <NavLink to="/conversations" className={navLinkClasses} onClick={() => setOpen(false)}>{t('conversations')}</NavLink>
                    <NavLink to="/profile" className={navLinkClasses} onClick={() => setOpen(false)}>{t('profile')}</NavLink>
                  </>
                ) : (
                  <NavLink to="/login" className={navLinkClasses} onClick={() => setOpen(false)}>{t('login')}</NavLink>
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
