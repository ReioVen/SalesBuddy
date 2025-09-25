import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  company?: string;
  companyId?: string;
  role: string;
  teamId?: string;
  isCompanyAdmin?: boolean;
  isTeamLeader?: boolean;
  isSuperAdmin?: boolean;
  isAdmin?: boolean;
  adminPermissions?: {
    canManageCompanies?: boolean;
    canManageUsers?: boolean;
    canViewAnalytics?: boolean;
    canManageSubscriptions?: boolean;
  };
  subscription: {
    plan: string;
    status: string;
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    currentPeriodStart?: Date;
    currentPeriodEnd?: Date;
    cancelAtPeriodEnd?: boolean;
  };
  usage: {
    aiConversations: number;
    monthlyLimit: number;
  };
  settings?: {
    industry?: string;
    salesRole?: string;
    experienceLevel?: string;
  };
  needsPasswordSetup?: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: true } | { success: false, message?: string }>;
  register: (userData: RegisterData) => Promise<{ success: true } | { success: false, message?: string, fieldErrors?: Record<string, string> }>;
  logout: () => void | Promise<void>;
  updateUser: (userData: Partial<User>) => void;
  setUser: (user: User | null) => void;
  refreshUser: () => Promise<void>;
  hasAdminAccess: () => boolean;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  company?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const authCheckCompleted = useRef(false);

  // Set up axios defaults
  useEffect(() => {
    // Configure axios to always send credentials
    axios.defaults.withCredentials = true;
    
    // Set the base URL for all axios requests
    axios.defaults.baseURL = 'https://salesbuddy-production.up.railway.app';
    
    // Add request interceptor to include auth token in headers
    axios.interceptors.request.use((config) => {
      const token = localStorage.getItem('sb_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }, []);

  // Check if user is logged in on app start (only once)
  useEffect(() => {
    const checkAuth = async () => {
      if (authCheckCompleted.current) return;
      authCheckCompleted.current = true;
      
      try {
        const response = await axios.get('/api/auth/me', {
          withCredentials: true
        });
        
        const user = response.data.user;
        setUser(user);
        
        // Password setup is now handled by a modal in App.tsx
      } catch (error: any) {
        setUser(null);
      }
      setLoading(false);
    };

    checkAuth();
  }, []); // Remove navigate dependency to prevent infinite redirects

  const login = async (email: string, password: string) => {
    try {
      const response = await axios.post('/api/auth/login', { email, password }, {
        withCredentials: true
      });
      
      const { user, token } = response.data;
      setUser(user);
      
      // Store token in localStorage for cross-origin requests
      if (token) {
        localStorage.setItem('sb_token', token);
      }
      
      // Password setup is now handled by a modal in App.tsx
      toast.success('Login successful!');
      return { success: true } as const;
    } catch (error: any) {
      const message = error.response?.data?.error || 'Invalid email or password';
      toast.error(message);
      return { success: false, message } as const;
    }
  };

  const register = async (userData: RegisterData) => {
    try {
        // Force the correct API URL - override any incorrect environment variables
        const apiUrl = 'https://salesbuddy-production.up.railway.app';
      const response = await axios.post(`${apiUrl}/api/auth/register`, userData, {
        withCredentials: true
      });
      const { user, token } = response.data;
      setUser(user);
      
      // Store token in localStorage for cross-origin requests
      if (token) {
        localStorage.setItem('sb_token', token);
      }
      
      toast.success('Registration successful!');
      return { success: true } as const;
    } catch (error: any) {
      const data = error.response?.data;
      // Map express-validator errors to field dictionary if present
      const fieldErrors: Record<string, string> = {};
      if (Array.isArray(data?.errors)) {
        for (const err of data.errors) {
          if (err?.path && err?.msg) fieldErrors[err.path] = err.msg;
        }
      }
      const message = data?.error || data?.message || 'Please fix the highlighted fields';
      if (message) toast.error(message);
      return { success: false, message, fieldErrors: Object.keys(fieldErrors).length ? fieldErrors : undefined } as const;
    }
  };

  const logout = async () => {
    try {
        // Force the correct API URL - override any incorrect environment variables
        const apiUrl = 'https://salesbuddy-production.up.railway.app';
      await axios.post(`${apiUrl}/api/auth/logout`, {}, {
        withCredentials: true
      });
    } catch {}
    
    // Clear token from localStorage
    localStorage.removeItem('sb_token');
    setUser(null);
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const updateUser = (userData: Partial<User>) => {
    setUser(prev => prev ? { ...prev, ...userData } : null);
  };

  const refreshUser = async () => {
    try {
        // Force the correct API URL - override any incorrect environment variables
        const apiUrl = 'https://salesbuddy-production.up.railway.app';
      const response = await axios.get(`${apiUrl}/api/auth/me`, {
        withCredentials: true
      });
      setUser(response.data.user);
    } catch (error) {
      console.error('Failed to refresh user data:', error);
    }
  };

  const hasAdminAccess = () => {
    return user?.role === 'super_admin' || user?.isSuperAdmin || 
           user?.role === 'admin' || user?.isAdmin || false;
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    register,
    logout,
    updateUser,
    setUser,
    refreshUser,
    hasAdminAccess,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 