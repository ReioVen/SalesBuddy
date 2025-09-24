import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext.tsx';
import CreateCompany from '../components/CreateCompany.tsx';
import CreateUser from '../components/CreateUser.tsx';

const API_BASE_URL = 'https://salesbuddy-production.up.railway.app';

interface DashboardStats {
  totalUsers: number;
  totalCompanies: number;
  activeUsers: number;
  subscriptionStats: Array<{ _id: string; count: number }>;
}

interface RecentUser {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  createdAt: string;
  subscription: { plan: string };
}

interface RecentCompany {
  _id: string;
  name: string;
  companyId: string;
  admin: {
    firstName: string;
    lastName: string;
    email: string;
  };
  createdAt: string;
  subscription: { plan: string };
}

const AdminDashboard: React.FC = () => {
  const { user, hasAdminAccess, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [recentCompanies, setRecentCompanies] = useState<RecentCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'companies' | 'users'>('overview');
  const [showCreateCompany, setShowCreateCompany] = useState(false);
  const [showCreateUser, setShowCreateUser] = useState(false);

  useEffect(() => {
    if (user && hasAdminAccess()) {
      fetchDashboardData();
    } else if (user && !hasAdminAccess()) {
      // User is loaded but doesn't have admin access
      setError('Admin access required');
      setLoading(false);
    }
    // If user is null, keep loading (waiting for auth check to complete)
  }, [user, hasAdminAccess]);

  const fetchDashboardData = async () => {
    try {
      const response = await axios.get('/api/admin/dashboard');
      setStats(response.data.stats);
      setRecentUsers(response.data.recentUsers);
      setRecentCompanies(response.data.recentCompanies);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-red-400 mb-2">Access Denied</h2>
          <p className="text-red-300">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700">
        {/* Header */}
        <div className="border-b border-gray-700 px-6 py-4">
          <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
          <p className="text-gray-300">Manage companies, users, and system settings</p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-700">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'companies', label: 'Companies' },
              { id: 'users', label: 'Users' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-blue-900/30 border border-blue-500/30 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-blue-300">Total Users</h3>
                  <p className="text-3xl font-bold text-blue-400">{stats?.totalUsers || 0}</p>
                </div>
                <div className="bg-green-900/30 border border-green-500/30 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-green-300">Total Companies</h3>
                  <p className="text-3xl font-bold text-green-400">{stats?.totalCompanies || 0}</p>
                </div>
                <div className="bg-purple-900/30 border border-purple-500/30 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-purple-300">Active Users</h3>
                  <p className="text-3xl font-bold text-purple-400">{stats?.activeUsers || 0}</p>
                </div>
                <div className="bg-orange-900/30 border border-orange-500/30 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-orange-300">Subscription Plans</h3>
                  <p className="text-3xl font-bold text-orange-400">{stats?.subscriptionStats.length || 0}</p>
                </div>
              </div>

              {/* Recent Users */}
              <div className="bg-gray-700/50 border border-gray-600 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-4">Recent Users</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-600">
                    <thead className="bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Role
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Plan
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Joined
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-gray-800 divide-y divide-gray-600">
                      {recentUsers.map((user) => (
                        <tr key={user._id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-white">
                              {user.firstName} {user.lastName}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                            {user.email}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              user.role === 'super_admin' 
                                ? 'bg-red-900/50 text-red-300 border border-red-500/30'
                                : user.role === 'admin'
                                ? 'bg-purple-900/50 text-purple-300 border border-purple-500/30'
                                : user.role === 'company_admin'
                                ? 'bg-blue-900/50 text-blue-300 border border-blue-500/30'
                                : 'bg-gray-700/50 text-gray-300 border border-gray-500/30'
                            }`}>
                              {user.role.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                            {user.subscription.plan}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Recent Companies */}
              <div className="bg-gray-700/50 border border-gray-600 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-4">Recent Companies</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-600">
                    <thead className="bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Company
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Admin
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Plan
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Created
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-gray-800 divide-y divide-gray-600">
                      {recentCompanies.map((company) => (
                        <tr key={company._id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-white">
                              {company.name}
                            </div>
                            <div className="text-sm text-gray-300">
                              ID: {company.companyId}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-white">
                              {company.admin.firstName} {company.admin.lastName}
                            </div>
                            <div className="text-sm text-gray-300">
                              {company.admin.email}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                            {company.subscription.plan}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                            {new Date(company.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'companies' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-white">Companies</h2>
                <button 
                  onClick={() => setShowCreateCompany(!showCreateCompany)}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                >
                  {showCreateCompany ? 'Cancel' : 'Create Company'}
                </button>
              </div>
              
              {showCreateCompany ? (
                <div className="bg-gray-700/50 border border-gray-600 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Create New Company</h3>
                  <CreateCompany />
                </div>
              ) : (
                <p className="text-gray-300">Company management features will be implemented here.</p>
              )}
            </div>
          )}

          {activeTab === 'users' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-white">Users</h2>
                <button 
                  onClick={() => setShowCreateUser(!showCreateUser)}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                >
                  {showCreateUser ? 'Cancel' : 'Create User'}
                </button>
              </div>
              
              {showCreateUser ? (
                <div className="bg-gray-700/50 border border-gray-600 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Create New User</h3>
                  <CreateUser />
                </div>
              ) : (
                <p className="text-gray-300">User management features will be implemented here.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
