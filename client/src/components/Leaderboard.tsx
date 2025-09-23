import React, { useState, useEffect } from 'react';
import { useTranslation } from '../hooks/useTranslation.ts';
import { useAuth } from '../contexts/AuthContext.tsx';
import { Trophy, Medal, Award, User, TrendingUp, Calendar, Users } from 'lucide-react';

const API_BASE_URL = 'https://salesbuddy-production.up.railway.app';

interface LeaderboardEntry {
  rank: number;
  user: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    teamId?: string;
  };
  averageScore: number;
  totalConversations: number;
  lastConversationDate: string;
}

interface LeaderboardData {
  leaderboard: LeaderboardEntry[];
  totalUsers: number;
  usersWithConversations: number;
  lastUpdated: string;
}

interface LeaderboardProps {
  companyId?: string;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ companyId: propCompanyId }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<number>(0);
  const [isVisible, setIsVisible] = useState(false);

  // Use prop companyId or fall back to user's companyId
  const companyId = propCompanyId || user?.companyId;

  const fetchLeaderboard = async (isManual = false) => {
    if (!companyId) {
      setError('No company ID available');
      setLoading(false);
      return;
    }

    // Check if manual refresh is on cooldown
    if (isManual) {
      const now = Date.now();
      if (now - lastRefresh < 5000) {
        return; // Still on cooldown
      }
    }

    try {
      setLoading(true);
      setError(null);
      
      // Get token from localStorage for Authorization header
      const token = localStorage.getItem('sb_token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE_URL}/api/leaderboard/company/${companyId}`, {
        credentials: 'include',
        headers
      });

      if (response.ok) {
        const data = await response.json();
        setLeaderboardData(data);
        setLastRefresh(Date.now());
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        setError(errorData.error || 'Failed to fetch leaderboard data');
      }
    } catch (err) {
      setError('Failed to fetch leaderboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (companyId) {
      fetchLeaderboard();
    } else {
      setLoading(false);
    }
  }, [companyId, user, propCompanyId]);

  // Visibility detection - only refresh when component is visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden);
    };

    // Check initial visibility
    setIsVisible(!document.hidden);
    
    // Listen for visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Auto-refresh only when visible and every 30 seconds (less frequent)
  useEffect(() => {
    if (!companyId || !isVisible) return;

    const interval = setInterval(() => {
      fetchLeaderboard();
    }, 30000); // 30 seconds instead of 5
    
    return () => clearInterval(interval);
  }, [companyId, isVisible]);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Award className="w-6 h-6 text-amber-600" />;
      default:
        return <span className="w-6 h-6 flex items-center justify-center text-sm font-bold text-gray-500 dark:text-gray-400">#{rank}</span>;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 40) return 'text-green-600 dark:text-green-400';
    if (score >= 30) return 'text-yellow-600 dark:text-yellow-400';
    if (score >= 20) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getScoreBackground = (score: number) => {
    if (score >= 40) return 'bg-green-100 dark:bg-green-900/20';
    if (score >= 30) return 'bg-yellow-100 dark:bg-yellow-900/20';
    if (score >= 20) return 'bg-orange-100 dark:bg-orange-900/20';
    return 'bg-red-100 dark:bg-red-900/20';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-dark-800 rounded-lg shadow-md">
        <div className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-dark-800 rounded-lg shadow-md">
        <div className="p-6">
          <div className="text-center text-red-600 dark:text-red-400">
            <p>{error}</p>
            <button 
              onClick={fetchLeaderboard}
              className="mt-2 text-blue-600 dark:text-blue-400 hover:underline"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!leaderboardData || leaderboardData.leaderboard.length === 0) {
    return (
      <div className="bg-white dark:bg-dark-800 rounded-lg shadow-md">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              {t('leaderboard') || 'Leaderboard'}
            </h3>
             <div className="flex gap-2">
               <button 
                 onClick={() => fetchLeaderboard(true)}
                 disabled={Date.now() - lastRefresh < 5000}
                 className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 disabled:text-gray-400 dark:disabled:text-gray-600 disabled:cursor-not-allowed transition-colors"
                 title={Date.now() - lastRefresh < 5000 ? 'Please wait 5 seconds between refreshes' : 'Refresh leaderboard'}
               >
                 <TrendingUp className="w-4 h-4" />
               </button>
             </div>
          </div>
          <div className="text-center py-8">
            <Trophy className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              {t('noConversationsYet') || 'No conversations completed yet'}
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
              {t('completeConversationsToSeeRankings') || 'Complete conversations to see rankings'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-dark-800 rounded-lg shadow-md">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            {t('leaderboard') || 'Leaderboard'}
          </h3>
           <div className="flex gap-2">
             <button 
               onClick={() => fetchLeaderboard(true)}
               disabled={Date.now() - lastRefresh < 5000}
               className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 disabled:text-gray-400 dark:disabled:text-gray-600 disabled:cursor-not-allowed transition-colors"
               title={Date.now() - lastRefresh < 5000 ? 'Please wait 5 seconds between refreshes' : 'Refresh leaderboard'}
             >
               <TrendingUp className="w-4 h-4" />
             </button>
           </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium text-blue-900 dark:text-blue-200">
                {t('totalUsers') || 'Total Users'}
              </span>
            </div>
            <p className="text-xl font-bold text-blue-600 dark:text-blue-400 mt-1">
              {leaderboardData.totalUsers}
            </p>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-green-600 dark:text-green-400" />
              <span className="text-sm font-medium text-green-900 dark:text-green-200">
                {t('activeUsers') || 'Active Users'}
              </span>
            </div>
            <p className="text-xl font-bold text-green-600 dark:text-green-400 mt-1">
              {leaderboardData.usersWithConversations}
            </p>
          </div>
        </div>

        {/* Leaderboard List */}
        <div className="space-y-3">
          {leaderboardData.leaderboard.map((entry) => (
            <div 
              key={entry.user._id}
              className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
                entry.rank <= 3 
                  ? 'bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/10 dark:to-orange-900/10 border-yellow-200 dark:border-yellow-800' 
                  : 'bg-gray-50 dark:bg-dark-700 border-gray-200 dark:border-dark-600'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-8">
                  {getRankIcon(entry.rank)}
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-300 dark:bg-dark-600 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  </div>
                  
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {entry.user.firstName} {entry.user.lastName}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {entry.totalConversations} {t('conversations') || 'conversations'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${getScoreBackground(entry.averageScore)} ${getScoreColor(entry.averageScore)}`}>
                  {entry.averageScore.toFixed(1)}/50
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formatDate(entry.lastConversationDate)}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-dark-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            {t('lastUpdated') || 'Last updated'}: {formatDate(leaderboardData.lastUpdated)}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 text-center mt-1">
            {t('basedOnLast5Conversations') || 'Based on average score from last 5 conversations'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;