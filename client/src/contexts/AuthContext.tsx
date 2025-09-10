import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

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

  // Set up axios defaults
  useEffect(() => {
    axios.defaults.withCredentials = true;
  }, []);

  // Check if user is logged in on app start
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await axios.get('/api/auth/me');
        setUser(response.data.user);
      } catch (error) {
        setUser(null);
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await axios.post('/api/auth/login', { email, password });
      const { user } = response.data;
      setUser(user);
      
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
      const response = await axios.post('/api/auth/register', userData);
      const { user } = response.data;
      setUser(user);
      
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
      await axios.post('/api/auth/logout');
    } catch {}
    setUser(null);
    toast.success('Logged out successfully');
  };

  const updateUser = (userData: Partial<User>) => {
    setUser(prev => prev ? { ...prev, ...userData } : null);
  };

  const refreshUser = async () => {
    try {
      const response = await axios.get('/api/auth/me');
      setUser(response.data.user);
    } catch (error) {
      console.error('Failed to refresh user data:', error);
    }
  };

  const hasAdminAccess = () => {
    return user?.role === 'super_admin' || user?.role === 'admin' || user?.isSuperAdmin || user?.isAdmin || false;
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