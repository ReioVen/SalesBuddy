import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext.tsx';
import { useTranslation } from '../hooks/useTranslation.ts';
import AddUserToCompany from './AddUserToCompany.tsx';
import CreateTeam from './CreateTeam.tsx';
import EditUser from './EditUser.tsx';
import EditTeam from './EditTeam.tsx';
import TeamMemberManagement from './TeamMemberManagement.tsx';
import UserDetailModal from './UserDetailModal.tsx';

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
  const { t } = useTranslation();
  const [company, setCompany] = useState<Company | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'teams'>('overview');
  const [showAddUser, setShowAddUser] = useState(false);
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [editingUser, setEditingUser] = useState<CompanyUser | null>(null);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [managingTeam, setManagingTeam] = useState<Team | null>(null);
  const [viewingUser, setViewingUser] = useState<CompanyUser | null>(null);
  const [showDeleteCompany, setShowDeleteCompany] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch company data
  const fetchCompanyData = useCallback(async () => {
    try {
      const response = await fetch(`/api/companies/details`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Check if user is super admin (gets companies array) or regular user (gets company object)
        if (data.companies) {
          // Super admin - got all companies
          setCompanies(data.companies);
          setIsSuperAdmin(true);
          if (data.companies.length > 0) {
            setCompany(data.companies[0]); // Set first company as default
          }
        } else if (data.company) {
          // Regular user - got single company
          setCompany(data.company);
          setIsSuperAdmin(false);
        }
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
    if (user?.companyId || user?.isSuperAdmin) {
      fetchCompanyData();
    }
  }, [user, fetchCompanyData]);

  // Handle user operations
  const handleEditUser = (user: CompanyUser) => {
    setEditingUser(user);
  };

  const handleViewUser = (user: CompanyUser) => {
    setViewingUser(user);
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

  // Handle company deletion
  const handleDeleteCompany = async () => {
    if (!company) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/companies/${company.id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        const result = await response.json();
        const adminAction = result.adminUser?.action === 'converted_to_super_admin' 
          ? `\n- Admin user "${result.adminUser.email}" converted to super admin`
          : `\n- Admin user "${result.adminUser.email}" company association removed`;
        
        alert(`Company "${result.deletedData.company}" and all associated data deleted successfully!\n\nDeleted:\n- ${result.deletedData.users} users\n- ${result.deletedData.conversations} conversations\n- ${result.deletedData.summaries} summaries${adminAction}`);
        
        // Refresh the companies list for super admin
        if (isSuperAdmin) {
          fetchCompanyData();
        } else {
          // If not super admin, redirect to home or show message
          window.location.href = '/';
        }
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to delete company');
      }
    } catch (error) {
      alert('Failed to delete company');
    } finally {
      setIsDeleting(false);
      setShowDeleteCompany(false);
      setDeleteConfirmation('');
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
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{company.name}</h1>
              <p className="text-gray-600">Company ID: {company.companyId}</p>
              {company.description && (
                <p className="text-gray-600 mt-1">{company.description}</p>
              )}
            </div>
            
            {/* Company Selector for Super Admin */}
            {isSuperAdmin && companies.length > 1 && (
              <div className="ml-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Company:
                </label>
                <select
                  value={company.id}
                  onChange={(e) => {
                    const selectedCompany = companies.find(c => c.id === e.target.value);
                    if (selectedCompany) {
                      setCompany(selectedCompany);
                    }
                  }}
                  className="block w-64 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  {companies.map((comp) => (
                    <option key={comp.id} value={comp.id}>
                      {comp.name} ({comp.users.length} users)
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Delete Company Button for Super Admin */}
            {isSuperAdmin && (
              <div className="ml-4">
                <button
                  onClick={() => setShowDeleteCompany(true)}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                >
                  🗑️ Delete Company
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'overview', label: t('overview') },
              { id: 'users', label: t('users') },
              { id: 'teams', label: t('teams') }
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
                  <h3 className="text-lg font-semibold text-blue-900">{t('totalUsers')}</h3>
                  <p className="text-3xl font-bold text-blue-600">{company.users.length}</p>
                  <p className="text-sm text-blue-700">{t('max')}: {company.subscription.maxUsers}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-green-900">{t('teams')}</h3>
                  <p className="text-3xl font-bold text-green-600">{company.teams.length}</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-purple-900">{t('subscription')}</h3>
                  <p className="text-2xl font-bold text-purple-600 capitalize">{company.subscription.plan}</p>
                </div>
              </div>

              {/* Recent Users */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('recentUsers')}</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('name')}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('email')}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('role')}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('joined')}
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
                              {user.isCompanyAdmin ? t('admin') : user.isTeamLeader ? t('teamLeader') : t('user')}
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
                <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('teams')}</h3>
                {company.teams.length === 0 ? (
                  <p className="text-gray-500">{t('noTeamsCreated')}</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {company.teams.map((team) => (
                      <div key={team._id} className="bg-white rounded-lg p-4 border border-gray-200">
                        <h4 className="font-medium text-gray-900">{team.name}</h4>
                        {team.description && (
                          <p className="text-sm text-gray-500 mt-1">{team.description}</p>
                        )}
                        <p className="text-sm text-gray-500 mt-2">
                          {team.members.length} {team.members.length !== 1 ? t('members') : t('member')}
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
                <h2 className="text-xl font-semibold text-gray-900">{t('companyUsers')}</h2>
                {/* Only company admins can add users */}
                {user?.role === 'company_admin' && (
                  <button 
                    onClick={() => setShowAddUser(!showAddUser)}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                  >
                    {showAddUser ? t('cancel') : t('addUser')}
                  </button>
                )}
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
                          {t('name')}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('email')}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('role')}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('team')}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('actions')}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {company.users.map((companyUser) => (
                        <tr key={companyUser._id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {companyUser.firstName} {companyUser.lastName}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {companyUser.email}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              companyUser.isCompanyAdmin 
                                ? 'bg-red-100 text-red-800'
                                : companyUser.isTeamLeader
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {companyUser.isCompanyAdmin ? t('admin') : companyUser.isTeamLeader ? t('teamLeader') : t('user')}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {companyUser.teamId ? 
                              (company.teams.find(team => team._id === companyUser.teamId)?.name?.substring(0, 10) || t('unknown')) 
                              : t('noTeam')
                            }
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center space-x-2">
                              {/* Team leads and admins can view user details */}
                              {(user?.role === 'company_admin' || user?.role === 'company_team_leader') && (
                                <button 
                                  onClick={() => handleViewUser(companyUser)}
                                  className="text-green-600 hover:text-green-900"
                                >
                                  {t('viewDetails')}
                                </button>
                              )}
                              
                              {/* Only company admins can edit/delete users */}
                              {user?.role === 'company_admin' && (
                                <>
                                  <button 
                                    onClick={() => handleEditUser(companyUser)}
                                    className="text-blue-600 hover:text-blue-900"
                                  >
                                    {t('edit')}
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteUser(companyUser._id)}
                                    className="text-red-600 hover:text-red-900"
                                  >
                                    {t('delete')}
                                  </button>
                                </>
                              )}
                              
                              {/* Show dash if no actions available */}
                              {user?.role !== 'company_admin' && user?.role !== 'company_team_leader' && (
                                <span className="text-gray-400 text-sm">-</span>
                              )}
                            </div>
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
                <h2 className="text-xl font-semibold text-gray-900">{t('teams')}</h2>
                {user?.role === 'company_admin' && (
                  <button 
                    onClick={() => setShowCreateTeam(!showCreateTeam)}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                  >
                    {showCreateTeam ? t('cancel') : t('createTeam')}
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
                        {/* Only company admins can edit/delete teams */}
                        {user?.role === 'company_admin' && (
                          <div className="flex space-x-2">
                            <button 
                              onClick={() => handleEditTeam(team)}
                              className="text-blue-600 hover:text-blue-900 text-sm"
                            >
                              {t('edit')}
                            </button>
                            <button 
                              onClick={() => handleDeleteTeam(team._id)}
                              className="text-red-600 hover:text-red-900 text-sm"
                            >
                              {t('delete')}
                            </button>
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-3">
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2">{t('teamLeader')}</h4>
                          {team.teamLeader ? (
                            <div>
                              <p className="text-sm text-gray-900 font-medium">
                                {team.teamLeader.firstName} {team.teamLeader.lastName}
                              </p>
                              <p className="text-xs text-gray-500">{team.teamLeader.email}</p>
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500">{t('noTeamLeaderAssigned')}</p>
                          )}
                        </div>
                        
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2">{t('members')} ({team.members.length})</h4>
                          <p className="text-sm text-gray-600">
                            {team.members.length} {team.members.length !== 1 ? t('members') : t('member')}
                          </p>
                        </div>
                        
                        {/* Only company admins and team leaders can manage members */}
                        {(user?.role === 'company_admin' || user?.role === 'company_team_leader') && (
                          <div className="pt-2">
                            <button 
                              onClick={() => setManagingTeam(team)}
                              className="text-blue-600 hover:text-blue-900 text-sm"
                            >
                              {t('manageMembers')}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {company.teams.length === 0 && (
                    <div className="col-span-full text-center py-12">
                      <p className="text-gray-500">{t('noTeamsCreated')}</p>
                      <p className="text-sm text-gray-400 mt-1">{t('createFirstTeam')}</p>
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

      {/* User Detail Modal */}
      {viewingUser && (
        <UserDetailModal
          user={viewingUser}
          onClose={() => setViewingUser(null)}
        />
      )}

      {/* Delete Company Confirmation Modal */}
      {showDeleteCompany && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <span className="text-red-600 text-lg">⚠️</span>
                </div>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-gray-900">
                  Delete Company
                </h3>
              </div>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-3">
                <strong>WARNING:</strong> This action will permanently delete the company <strong>"{company?.name}"</strong> and ALL associated data:
              </p>
              <ul className="text-sm text-gray-600 list-disc list-inside mb-3">
                <li>All users in this company (except the admin)</li>
                <li>All conversations</li>
                <li>All conversation summaries</li>
                <li>All teams and team data</li>
                <li>The company itself</li>
              </ul>
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-3">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> The company admin will be preserved and converted to a super admin (if not already one).
                </p>
              </div>
              <p className="text-sm text-red-600 font-medium">
                This action cannot be undone!
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type <strong>DELETE</strong> to confirm:
              </label>
              <input
                type="text"
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                placeholder="Type DELETE here"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteCompany(false);
                  setDeleteConfirmation('');
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors duration-200"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteCompany}
                disabled={deleteConfirmation !== 'DELETE' || isDeleting}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-md transition-colors duration-200"
              >
                {isDeleting ? 'Deleting...' : 'Delete Company'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyManagement;