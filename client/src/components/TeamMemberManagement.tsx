import React, { useState, useEffect } from 'react';

const API_BASE_URL = 'https://salesbuddy-production.up.railway.app';

// Custom Confirmation Dialog Component
interface CustomConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

const CustomConfirmDialog: React.FC<CustomConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'danger'
}) => {
  if (!isOpen) return null;

  const getTypeStyles = () => {
    switch (type) {
      case 'danger':
        return {
          icon: '⚠️',
          confirmBg: 'bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600',
          border: 'border-red-200 dark:border-red-700'
        };
      case 'warning':
        return {
          icon: '⚠️',
          confirmBg: 'bg-yellow-600 hover:bg-yellow-700 dark:bg-yellow-700 dark:hover:bg-yellow-600',
          border: 'border-yellow-200 dark:border-yellow-700'
        };
      case 'info':
        return {
          icon: 'ℹ️',
          confirmBg: 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600',
          border: 'border-blue-200 dark:border-blue-700'
        };
      default:
        return {
          icon: '⚠️',
          confirmBg: 'bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600',
          border: 'border-red-200 dark:border-red-700'
        };
    }
  };

  const typeStyles = getTypeStyles();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4 border ${typeStyles.border} shadow-xl`}>
        <div className="flex items-center mb-4">
          <div className="text-2xl mr-3">{typeStyles.icon}</div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {title}
          </h3>
        </div>
        
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          {message}
        </p>
        
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors duration-200"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-4 py-2 text-white rounded-md transition-colors duration-200 ${typeStyles.confirmBg}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

interface TeamMember {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  teamId?: string;
}

interface Team {
  _id: string;
  name: string;
  description: string;
  members: TeamMember[];
  teamLeader?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface TeamMemberManagementProps {
  team: Team;
  companyId: string;
  onClose: () => void;
  onUpdate: () => void;
}

const TeamMemberManagement: React.FC<TeamMemberManagementProps> = ({
  team,
  companyId,
  onClose,
  onUpdate
}) => {
  const [availableUsers, setAvailableUsers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type?: 'danger' | 'warning' | 'info';
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  // Fetch available users (company users not in this team)
  useEffect(() => {
    const fetchAvailableUsers = async () => {
       try {
         const token = localStorage.getItem('sb_token');
         console.log('🔍 [TEAM MANAGEMENT] Token check:', {
           hasToken: !!token,
           tokenLength: token ? token.length : 0,
           tokenStart: token ? token.substring(0, 20) + '...' : 'none'
         });
         
         const response = await fetch(`${API_BASE_URL}/api/companies/users`, {
           credentials: 'include',
           headers: {
             'Authorization': `Bearer ${token}`,
             'Content-Type': 'application/json'
           }
         });
        
        console.log('🔍 [TEAM MANAGEMENT] Response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('🔍 [TEAM MANAGEMENT] Response data:', data);
          console.log('🔍 [TEAM MANAGEMENT] Current team ID:', team._id);
          console.log('🔍 [TEAM MANAGEMENT] All users:', data.users);
          
          // Filter out users already in this team and team leaders
          const available = data.users.filter((user: TeamMember) => {
            const isRegularUser = user.role === 'company_user';
            const notInThisTeam = !user.teamId || user.teamId.toString() !== team._id.toString();
            const notTeamLeader = user.role !== 'company_team_leader';
            
            console.log('🔍 [TEAM MANAGEMENT] User filter:', {
              user: user.email,
              role: user.role,
              teamId: user.teamId,
              currentTeamId: team._id,
              isRegularUser,
              notInThisTeam,
              notTeamLeader,
              willInclude: isRegularUser && notInThisTeam && notTeamLeader
            });
            
            return isRegularUser && notInThisTeam && notTeamLeader;
          });
          
          console.log('🔍 [TEAM MANAGEMENT] Available users after filtering:', available);
          setAvailableUsers(available);
        } else {
          const errorData = await response.json();
          console.log('🔍 [TEAM MANAGEMENT] Error response:', errorData);
        }
      } catch (err) {
        console.error('Failed to fetch available users:', err);
      }
    };

    fetchAvailableUsers();
  }, [team._id]);

  const handleAddMember = async () => {
    if (!selectedUser) return;

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('sb_token');
      const response = await fetch(`${API_BASE_URL}/api/companies/users/${selectedUser}/team`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          teamName: team.name
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add member to team');
      }

      // Update UI immediately - remove user from available list
      setAvailableUsers(prev => prev.filter(u => u._id !== selectedUser));
      setSelectedUser('');
      
      // Also update the parent component
      onUpdate();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add member to team');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    const member = team.members.find(m => m._id === memberId);
    const memberName = member ? `${member.firstName} ${member.lastName}` : 'this member';
    
    setConfirmDialog({
      isOpen: true,
      title: 'Remove Team Member',
      message: `Are you sure you want to remove ${memberName} from the team?`,
      type: 'danger',
      onConfirm: async () => {
        setLoading(true);
        setError(null);

        try {
          const token = localStorage.getItem('sb_token');
          const response = await fetch(`${API_BASE_URL}/api/companies/users/${memberId}/team`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
              teamName: team.name
            })
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to remove member from team');
          }

          // Update UI immediately - add user back to available list
          if (member) {
            setAvailableUsers(prev => [...prev, member]);
          }
          
          // Also update the parent component
          onUpdate();
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to remove member from team');
        } finally {
          setLoading(false);
        }
      }
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Manage Team Members - {team.name}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-100"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Current Team Members */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Current Members ({team.members.length})
            </h3>
            
            {team.teamLeader && (
              <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <h4 className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-1">Team Leader</h4>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  {team.teamLeader.firstName} {team.teamLeader.lastName}
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-400">{team.teamLeader.email}</p>
              </div>
            )}

            <div className="space-y-2">
              {team.members.map((member) => (
                <div key={member._id} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {member.firstName} {member.lastName}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{member.email}</p>
                  </div>
                  {member._id !== team.teamLeader?._id && (
                    <button
                      onClick={() => handleRemoveMember(member._id)}
                      disabled={loading}
                      className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-sm disabled:opacity-50"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
              
              {team.members.length === 0 && (
                <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-4">
                  No members in this team yet.
                </p>
              )}
            </div>
          </div>

          {/* Add Members */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Add Members ({availableUsers.length} available)
            </h3>
            
            {availableUsers.length > 0 ? (
              <div className="space-y-3">
                <div>
                  <select
                    value={selectedUser}
                    onChange={(e) => setSelectedUser(e.target.value)}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">Select a user to add</option>
                    {availableUsers.map((user) => (
                      <option key={user._id} value={user._id}>
                        {user.firstName} {user.lastName} ({user.email})
                      </option>
                    ))}
                  </select>
                </div>
                
                <button
                  onClick={handleAddMember}
                  disabled={!selectedUser || loading}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Adding...' : 'Add to Team'}
                </button>
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-4">
                No available users to add to this team.
              </p>
            )}
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-gray-100"
          >
            Close
          </button>
        </div>
      </div>
      
      {/* Custom Confirmation Dialog */}
      <CustomConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        type={confirmDialog.type}
        confirmText="Remove"
        cancelText="Cancel"
      />
    </div>
  );
};

export default TeamMemberManagement;
