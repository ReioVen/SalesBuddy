import React, { useState, useEffect } from 'react';

const API_BASE_URL = 'https://salesbuddy-production.up.railway.app';

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

  // Fetch available users (company users not in this team)
  useEffect(() => {
    const fetchAvailableUsers = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/companies/users`, {
          credentials: 'include'
        });
        
        if (response.ok) {
          const data = await response.json();
          // Filter out users already in this team and team leaders
          const available = data.users.filter((user: TeamMember) => 
            user.role === 'company_user' && 
            (!user.teamId || user.teamId !== team._id)
          );
          setAvailableUsers(available);
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
      const response = await fetch(`${API_BASE_URL}/api/companies/users/${selectedUser}/team`, {
        method: 'PUT',
        headers: {
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

      // Remove user from available list
      setAvailableUsers(prev => prev.filter(u => u._id !== selectedUser));
      setSelectedUser('');
      onUpdate();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add member to team');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!window.confirm('Are you sure you want to remove this member from the team?')) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/companies/users/${memberId}/team`, {
        method: 'DELETE',
        headers: {
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

      // Add user back to available list
      const removedUser = team.members.find(m => m._id === memberId);
      if (removedUser) {
        setAvailableUsers(prev => [...prev, removedUser]);
      }
      onUpdate();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove member from team');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Manage Team Members - {team.name}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Current Team Members */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Current Members ({team.members.length})
            </h3>
            
            {team.teamLeader && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="text-sm font-medium text-blue-900 mb-1">Team Leader</h4>
                <p className="text-sm text-blue-700">
                  {team.teamLeader.firstName} {team.teamLeader.lastName}
                </p>
                <p className="text-xs text-blue-600">{team.teamLeader.email}</p>
              </div>
            )}

            <div className="space-y-2">
              {team.members.map((member) => (
                <div key={member._id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {member.firstName} {member.lastName}
                    </p>
                    <p className="text-xs text-gray-500">{member.email}</p>
                  </div>
                  {member._id !== team.teamLeader?._id && (
                    <button
                      onClick={() => handleRemoveMember(member._id)}
                      disabled={loading}
                      className="text-red-600 hover:text-red-800 text-sm disabled:opacity-50"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
              
              {team.members.length === 0 && (
                <p className="text-gray-500 text-sm text-center py-4">
                  No members in this team yet.
                </p>
              )}
            </div>
          </div>

          {/* Add Members */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Add Members ({availableUsers.length} available)
            </h3>
            
            {availableUsers.length > 0 ? (
              <div className="space-y-3">
                <div>
                  <select
                    value={selectedUser}
                    onChange={(e) => setSelectedUser(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              <p className="text-gray-500 text-sm text-center py-4">
                No available users to add to this team.
              </p>
            )}
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default TeamMemberManagement;
