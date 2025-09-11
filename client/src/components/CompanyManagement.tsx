import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext.tsx';
import AddUserToCompany from './AddUserToCompany.tsx';
import CreateTeam from './CreateTeam.tsx';
import EditUser from './EditUser.tsx';
import EditTeam from './EditTeam.tsx';
import TeamMemberManagement from './TeamMemberManagement.tsx';

interface CompanyUser {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  isCompanyAdmin: boolean;
  isTeamLeader: boolean;
  teamId?: string;
  createdAt: string;
}

interface Team {
  _id: string;
  name: string;
  description?: string;
  members: string[];
  teamLeader?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  createdAt: string;
}

interface Company {
  _id: string;
  name: string;
  companyId: string;
  description?: string;
  users: CompanyUser[];
  teams: Team[];
  subscription: {
    plan: string;
    maxUsers: number;
  };
  createdAt: string;
}

const CompanyManagement: React.FC = () => {
  const { user } = useAuth();
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'teams'>('overview');
  const [showAddUser, setShowAddUser] = useState(false);
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [editingUser, setEditingUser] = useState<CompanyUser | null>(null);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [managingTeam, setManagingTeam] = useState<Team | null>(null);

  // Fetch company data
  const fetchCompanyData = useCallback(async () => {
    try {
      const response = await fetch(`/api/companies/${user?.companyId}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setCompany(data.company);
      } else {
        setError('Failed to fetch company data');
      }
    } catch (err) {
      setError('Failed to fetch company data');
    } finally {
      setLoading(false);
    }
  }, [user?.companyId]);

  useEffect(() => {
    if (user?.companyId) {
      fetchCompanyData();
    }
  }, [user?.companyId, fetchCompanyData]);

  // Handle user operations
  const handleEditUser = (user: CompanyUser) => {
    setEditingUser(user);
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Are you sure you want to delete this user? This will permanently delete all their data and cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/companies/users/${userId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        fetchCompanyData(); // Refresh data
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to delete user');
      }
    } catch (error) {
      alert('Failed to delete user');
    }
  };

  // Handle team operations
  const handleEditTeam = (team: Team) => {
    setEditingTeam(team);
  };

  const handleDeleteTeam = async (teamId: string) => {
    if (!window.confirm('Are you sure you want to delete this team? All team members will be unassigned from this team.')) {
      return;
    }

    try {
      const response = await fetch(`/api/companies/teams/${teamId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        fetchCompanyData(); // Refresh data
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to delete team');
      }
    } catch (error) {
      alert('Failed to delete team');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-red-800 mb-2">Error</h2>
          <p className="text-red-600">{error || 'Company not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md">
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-900">{company.name}</h1>
          <p className="text-gray-600">Company ID: {company.companyId}</p>
          {company.description && (
            <p className="text-gray-600 mt-1">{company.description}</p>
          )}
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'users', label: 'Users' },
              { id: 'teams', label: 'Teams' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-blue-900">Total Users</h3>
                  <p className="text-3xl font-bold text-blue-600">{company.users.length}</p>
                  <p className="text-sm text-blue-700">Max: {company.subscription.maxUsers}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-green-900">Teams</h3>
                  <p className="text-3xl font-bold text-green-600">{company.teams.length}</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-purple-900">Subscription</h3>
                  <p className="text-2xl font-bold text-purple-600 capitalize">{company.subscription.plan}</p>
                </div>
              </div>

              {/* Recent Users */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Users</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Role
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Joined
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {company.users.slice(0, 5).map((user) => (
                        <tr key={user._id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {user.firstName} {user.lastName}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {user.email}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              user.isCompanyAdmin 
                                ? 'bg-red-100 text-red-800'
                                : user.isTeamLeader
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {user.isCompanyAdmin ? 'Admin' : user.isTeamLeader ? 'Team Leader' : 'User'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Teams Overview */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Teams</h3>
                {company.teams.length === 0 ? (
                  <p className="text-gray-500">No teams created yet.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {company.teams.map((team) => (
                      <div key={team._id} className="bg-white rounded-lg p-4 border border-gray-200">
                        <h4 className="font-medium text-gray-900">{team.name}</h4>
                        {team.description && (
                          <p className="text-sm text-gray-500 mt-1">{team.description}</p>
                        )}
                        <p className="text-sm text-gray-500 mt-2">
                          {team.members.length} member{team.members.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">Company Users</h2>
                <button 
                  onClick={() => setShowAddUser(!showAddUser)}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  {showAddUser ? 'Cancel' : 'Add User'}
                </button>
              </div>
              
              {showAddUser ? (
                <AddUserToCompany
                  companyId={company._id}
                  teams={company.teams}
                  onUserAdded={() => {
                    setShowAddUser(false);
                    fetchCompanyData();
                  }}
                  onCancel={() => setShowAddUser(false)}
                />
              ) : editingUser ? (
                <EditUser
                  user={editingUser}
                  teams={company.teams}
                  onUserUpdated={() => {
                    setEditingUser(null);
                    fetchCompanyData();
                  }}
                  onCancel={() => setEditingUser(null)}
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Role
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Team
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {company.users.map((user) => (
                        <tr key={user._id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {user.firstName} {user.lastName}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {user.email}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              user.isCompanyAdmin 
                                ? 'bg-red-100 text-red-800'
                                : user.isTeamLeader
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {user.isCompanyAdmin ? 'Admin' : user.isTeamLeader ? 'Team Leader' : 'User'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {user.teamId ? 'Assigned' : 'No Team'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button 
                              onClick={() => handleEditUser(user)}
                              className="text-blue-600 hover:text-blue-900 mr-3"
                            >
                              Edit
                            </button>
                            <button 
                              onClick={() => handleDeleteUser(user._id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'teams' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">Teams</h2>
                {user?.role === 'company_admin' && (
                  <button 
                    onClick={() => setShowCreateTeam(!showCreateTeam)}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                  >
                    {showCreateTeam ? 'Cancel' : 'Create Team'}
                  </button>
                )}
              </div>
              
              {showCreateTeam ? (
                <CreateTeam
                  companyId={company._id}
                  onTeamCreated={() => {
                    setShowCreateTeam(false);
                    fetchCompanyData();
                  }}
                  onCancel={() => setShowCreateTeam(false)}
                />
              ) : editingTeam ? (
                <EditTeam
                  team={editingTeam}
                  onTeamUpdated={() => {
                    setEditingTeam(null);
                    fetchCompanyData();
                  }}
                  onCancel={() => setEditingTeam(null)}
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {company.teams.map((team) => (
                    <div key={team._id} className="bg-white border border-gray-200 rounded-lg p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{team.name}</h3>
                          {team.description && (
                            <p className="text-sm text-gray-500 mt-1">{team.description}</p>
                          )}
                        </div>
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => handleEditTeam(team)}
                            className="text-blue-600 hover:text-blue-900 text-sm"
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => handleDeleteTeam(team._id)}
                            className="text-red-600 hover:text-red-900 text-sm"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Team Leader</h4>
                          {team.teamLeader ? (
                            <div>
                              <p className="text-sm text-gray-900 font-medium">
                                {team.teamLeader.firstName} {team.teamLeader.lastName}
                              </p>
                              <p className="text-xs text-gray-500">{team.teamLeader.email}</p>
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500">No team leader assigned</p>
                          )}
                        </div>
                        
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Members ({team.members.length})</h4>
                          <p className="text-sm text-gray-600">
                            {team.members.length} member{team.members.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                        
                        <div className="pt-2">
                          <button 
                            onClick={() => setManagingTeam(team)}
                            className="text-blue-600 hover:text-blue-900 text-sm"
                          >
                            Manage Members
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {company.teams.length === 0 && (
                    <div className="col-span-full text-center py-12">
                      <p className="text-gray-500">No teams created yet.</p>
                      <p className="text-sm text-gray-400 mt-1">Create your first team to get started.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Team Member Management Modal */}
      {managingTeam && (
        <TeamMemberManagement
          team={managingTeam}
          companyId={company?._id || ''}
          onClose={() => setManagingTeam(null)}
          onUpdate={fetchCompanyData}
        />
      )}
    </div>
  );
};

export default CompanyManagement;