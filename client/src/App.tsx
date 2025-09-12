import React from 'react';
import { useLocation } from 'react-router-dom';
import Home from './pages/Home.tsx';
import Pricing from './pages/Pricing.tsx';
import Login from './pages/Login.tsx';
import Register from './pages/Register.tsx';
import ForgotPassword from './pages/ForgotPassword.tsx';
import ResetPassword from './pages/ResetPassword.tsx';
import Navbar from './components/Navbar.tsx';
import Conversations from './pages/Conversations.tsx';
import ConversationSummaries from './pages/ConversationSummaries.tsx';
import Profile from './pages/Profile.tsx';
import Settings from './pages/Settings.tsx';
import Company from './pages/Company.tsx';
import AdminDashboard from './pages/AdminDashboard.tsx';

// Component that renders all pages simultaneously and shows/hides based on route
const PageRenderer: React.FC = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  // All pages are rendered simultaneously but only the current one is visible
  // Using absolute positioning to stack them and only show the active one
  return (
    <div className="relative" style={{ minHeight: 'calc(100vh - 3.5rem)' }}>
      {/* Home Page */}
      <div 
        className={`absolute inset-0 w-full ${currentPath === '/' ? 'block' : 'hidden'}`}
        style={{ zIndex: currentPath === '/' ? 10 : 1 }}
      >
        <Home />
      </div>

      {/* Pricing Page */}
      <div 
        className={`absolute inset-0 w-full ${currentPath === '/pricing' ? 'block' : 'hidden'}`}
        style={{ zIndex: currentPath === '/pricing' ? 10 : 1 }}
      >
        <Pricing />
      </div>

      {/* Login Page */}
      <div 
        className={`absolute inset-0 w-full ${currentPath === '/login' ? 'block' : 'hidden'}`}
        style={{ zIndex: currentPath === '/login' ? 10 : 1 }}
      >
        <Login />
      </div>

      {/* Register Page */}
      <div 
        className={`absolute inset-0 w-full ${currentPath === '/register' ? 'block' : 'hidden'}`}
        style={{ zIndex: currentPath === '/register' ? 10 : 1 }}
      >
        <Register />
      </div>

      {/* Forgot Password Page */}
      <div 
        className={`absolute inset-0 w-full ${currentPath === '/forgot-password' ? 'block' : 'hidden'}`}
        style={{ zIndex: currentPath === '/forgot-password' ? 10 : 1 }}
      >
        <ForgotPassword />
      </div>

      {/* Reset Password Page */}
      <div 
        className={`absolute inset-0 w-full ${currentPath === '/reset-password' ? 'block' : 'hidden'}`}
        style={{ zIndex: currentPath === '/reset-password' ? 10 : 1 }}
      >
        <ResetPassword />
      </div>

      {/* Conversations Page */}
      <div 
        className={`absolute inset-0 w-full ${currentPath === '/conversations' ? 'block' : 'hidden'}`}
        style={{ zIndex: currentPath === '/conversations' ? 10 : 1 }}
      >
        <Conversations />
      </div>

      {/* Conversation Summaries Page */}
      <div 
        className={`absolute inset-0 w-full ${currentPath === '/conversation-summaries' ? 'block' : 'hidden'}`}
        style={{ zIndex: currentPath === '/conversation-summaries' ? 10 : 1 }}
      >
        <ConversationSummaries />
      </div>

      {/* Profile Page */}
      <div 
        className={`absolute inset-0 w-full ${currentPath === '/profile' ? 'block' : 'hidden'}`}
        style={{ zIndex: currentPath === '/profile' ? 10 : 1 }}
      >
        <Profile />
      </div>

      {/* Settings Page */}
      <div 
        className={`absolute inset-0 w-full ${currentPath === '/settings' ? 'block' : 'hidden'}`}
        style={{ zIndex: currentPath === '/settings' ? 10 : 1 }}
      >
        <Settings />
      </div>

      {/* Company Page */}
      <div 
        className={`absolute inset-0 w-full ${currentPath === '/company' ? 'block' : 'hidden'}`}
        style={{ zIndex: currentPath === '/company' ? 10 : 1 }}
      >
        <Company />
      </div>

      {/* Admin Dashboard Page */}
      <div 
        className={`absolute inset-0 w-full ${currentPath === '/admin' ? 'block' : 'hidden'}`}
        style={{ zIndex: currentPath === '/admin' ? 10 : 1 }}
      >
        <AdminDashboard />
      </div>

      {/* 404 Fallback - redirect to home */}
      {!['/', '/pricing', '/login', '/register', '/forgot-password', '/reset-password', '/conversations', '/conversation-summaries', '/profile', '/settings', '/company', '/admin'].includes(currentPath) && (
        <div className="absolute inset-0 w-full block" style={{ zIndex: 10 }}>
          <Home />
        </div>
      )}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="pt-14">
        <PageRenderer />
      </main>
    </div>
  );
};

export default App; 