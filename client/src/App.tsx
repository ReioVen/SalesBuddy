import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext.tsx';
// import { testAPI } from './utils/apiTest';
import Home from './pages/Home.tsx';
import Pricing from './pages/Pricing.tsx';
import Login from './pages/Login.tsx';
import Register from './pages/Register.tsx';
import ForgotPassword from './pages/ForgotPassword.tsx';
import ResetPassword from './pages/ResetPassword.tsx';
import PasswordSetup from './pages/PasswordSetup.tsx';
import PasswordSetupModal from './components/PasswordSetupModal.tsx';
import Navbar from './components/Navbar.tsx';
import Conversations from './pages/Conversations.tsx';
import ConversationSummaries from './pages/ConversationSummaries.tsx';
import Profile from './pages/Profile.tsx';
import Settings from './pages/Settings.tsx';
import Company from './pages/Company.tsx';
import AdminDashboard from './pages/AdminDashboard.tsx';
import { ThemeProvider } from './contexts/ThemeContext.tsx';

// Component that renders all pages simultaneously and shows/hides based on route
const PageRenderer: React.FC = () => {
  const location = useLocation();
  const currentPath = location.pathname;
  const { user, loading: authLoading } = useAuth();

  // Debug authentication state
  console.log('App.tsx - Authentication state:', { user: !!user, authLoading, currentPath });

  // All pages are rendered simultaneously but only the current one is visible
  // Using absolute positioning to stack them and only show the active one
  return (
    <div className="relative bg-gray-50 dark:bg-dark-900 min-h-screen">
      {/* Home Page */}
      <div 
        className={`absolute inset-0 w-full bg-gray-50 dark:bg-dark-900 ${currentPath === '/' ? 'block' : 'hidden'}`}
        style={{ zIndex: currentPath === '/' ? 10 : 1, minHeight: '100vh', overflow: 'visible' }}
      >
        <Home />
      </div>

      {/* Pricing Page */}
      <div 
        className={`absolute inset-0 w-full bg-gray-50 dark:bg-dark-900 ${currentPath === '/pricing' ? 'block' : 'hidden'}`}
        style={{ zIndex: currentPath === '/pricing' ? 10 : 1, minHeight: '100vh', overflow: 'visible' }}
      >
        <Pricing />
      </div>

      {/* Login Page */}
      <div 
        className={`absolute inset-0 w-full bg-gray-50 dark:bg-dark-900 ${currentPath === '/login' ? 'block' : 'hidden'}`}
        style={{ zIndex: currentPath === '/login' ? 10 : 1, minHeight: '100vh', overflow: 'visible' }}
      >
        <Login />
      </div>

      {/* Register Page */}
      <div 
        className={`absolute inset-0 w-full bg-gray-50 dark:bg-dark-900 ${currentPath === '/register' ? 'block' : 'hidden'}`}
        style={{ zIndex: currentPath === '/register' ? 10 : 1, minHeight: '100vh', overflow: 'visible' }}
      >
        <Register />
      </div>

      {/* Forgot Password Page */}
      <div 
        className={`absolute inset-0 w-full bg-gray-50 dark:bg-dark-900 ${currentPath === '/forgot-password' ? 'block' : 'hidden'}`}
        style={{ zIndex: currentPath === '/forgot-password' ? 10 : 1, minHeight: '100vh', overflow: 'visible' }}
      >
        <ForgotPassword />
      </div>

      {/* Reset Password Page */}
      <div 
        className={`absolute inset-0 w-full bg-gray-50 dark:bg-dark-900 ${currentPath === '/reset-password' ? 'block' : 'hidden'}`}
        style={{ zIndex: currentPath === '/reset-password' ? 10 : 1, minHeight: '100vh', overflow: 'visible' }}
      >
        <ResetPassword />
      </div>

      {/* Password Setup Page */}
      <div 
        className={`absolute inset-0 w-full bg-gray-50 dark:bg-dark-900 ${currentPath === '/password-setup' ? 'block' : 'hidden'}`}
        style={{ zIndex: currentPath === '/password-setup' ? 10 : 1, minHeight: '100vh', overflow: 'visible' }}
      >
        <PasswordSetup />
      </div>

      {/* Conversations Page - Only render if user is authenticated and not loading */}
      {user && !authLoading && (
        <div 
          className={`absolute inset-0 w-full bg-gray-50 dark:bg-dark-900 ${currentPath === '/conversations' ? 'block' : 'hidden'}`}
          style={{ zIndex: currentPath === '/conversations' ? 10 : 1, minHeight: '100vh', overflow: 'visible' }}
        >
          <Conversations />
        </div>
      )}

      {/* Conversation Summaries Page - Only render if user is authenticated and not loading */}
      {user && !authLoading && (
        <div 
          className={`absolute inset-0 w-full bg-gray-50 dark:bg-dark-900 ${currentPath === '/conversation-summaries' ? 'block' : 'hidden'}`}
          style={{ zIndex: currentPath === '/conversation-summaries' ? 10 : 1, minHeight: '100vh', overflow: 'visible' }}
        >
          <ConversationSummaries />
        </div>
      )}

      {/* Profile Page - Only render if user is authenticated and not loading */}
      {user && !authLoading && (
        <div 
          className={`absolute inset-0 w-full bg-gray-50 dark:bg-dark-900 ${currentPath === '/profile' ? 'block' : 'hidden'}`}
          style={{ zIndex: currentPath === '/profile' ? 10 : 1, minHeight: '100vh', overflow: 'visible' }}
        >
          <Profile />
        </div>
      )}

      {/* Settings Page - Only render if user is authenticated and not loading */}
      {user && !authLoading && (
        <div 
          className={`absolute inset-0 w-full bg-gray-50 dark:bg-dark-900 ${currentPath === '/settings' ? 'block' : 'hidden'}`}
          style={{ zIndex: currentPath === '/settings' ? 10 : 1, minHeight: '100vh', overflow: 'visible' }}
        >
          <Settings />
        </div>
      )}

      {/* Company Page - Only render if user is authenticated and not loading */}
      {user && !authLoading && (
        <div 
          className={`absolute inset-0 w-full bg-gray-50 dark:bg-dark-900 ${currentPath === '/company' ? 'block' : 'hidden'}`}
          style={{ zIndex: currentPath === '/company' ? 10 : 1, minHeight: '100vh', overflow: 'visible' }}
        >
          <Company />
        </div>
      )}

      {/* Admin Dashboard Page - Only render if user is authenticated and not loading */}
      {user && !authLoading && (
        <div 
          className={`absolute inset-0 w-full bg-gray-50 dark:bg-dark-900 ${currentPath === '/admin' ? 'block' : 'hidden'}`}
          style={{ zIndex: currentPath === '/admin' ? 10 : 1, minHeight: '100vh', overflow: 'visible' }}
        >
          <AdminDashboard />
        </div>
      )}

      {/* 404 Fallback - redirect to home */}
      {!['/', '/pricing', '/login', '/register', '/forgot-password', '/reset-password', '/password-setup', '/conversations', '/conversation-summaries', '/profile', '/settings', '/company', '/admin'].includes(currentPath) && (
        <div className="absolute inset-0 w-full block bg-gray-50 dark:bg-dark-900" style={{ zIndex: 10, minHeight: '100vh', overflow: 'visible' }}>
          <Home />
        </div>
      )}
    </div>
  );
};

const App: React.FC = () => {
  const { user } = useAuth();
  const [showPasswordSetupModal, setShowPasswordSetupModal] = useState(false);

  // Show password setup modal when user needs password setup
  useEffect(() => {
    if (user && user.needsPasswordSetup) {
      setShowPasswordSetupModal(true);
    } else {
      setShowPasswordSetupModal(false);
    }
  }, [user]);

  // Test API connection on app load
  // useEffect(() => {
  //   testAPI();
  // }, []);

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-dark-900 transition-colors">
        <Navbar />
        <main className="pt-14 bg-gray-50 dark:bg-dark-900 min-h-screen">
          <PageRenderer />
        </main>
        
        {/* Password Setup Modal */}
        <PasswordSetupModal 
          isOpen={showPasswordSetupModal}
          onClose={() => setShowPasswordSetupModal(false)}
        />
      </div>
    </ThemeProvider>
  );
};

export default App; 