import React, { useState } from 'react';
import axios from 'axios';

interface EditUserForm {
  firstName: string;
  lastName: string;
  email: string;
  role: 'company_user' | 'company_team_leader';
  teamId?: string;
}

interface Team {
  _id: string;
  name: string;
  description?: string;
}

interface EditUserProps {
  user: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    isTeamLeader: boolean;
    teamId?: string;
  };
  teams: Team[];
  onUserUpdated: () => void;
  onCancel: () => void;
}

const EditUser: React.FC<EditUserProps> = ({ 
  user, 
  teams, 
  onUserUpdated, 
  onCancel 
}) => {
  const [form, setForm] = useState<EditUserForm>({
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role: user.isTeamLeader ? 'company_team_leader' : 'company_user',
    teamId: user.teamId
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Client-side validation
    if (form.role === 'company_team_leader' && !form.teamId) {
      setError('Please select a team for team leader role');
      setLoading(false);
      return;
    }

    try {
      // Get token from localStorage for authentication
      const token = localStorage.getItem('sb_token');
      if (!token) {
        setError('Authentication token not found. Please log in again.');
        setLoading(false);
        return;
      }

      // Prepare data for API - include teamId for all users if selected
      const apiData = {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        role: form.role,
        ...(form.teamId ? { teamId: form.teamId } : {})
      };

      console.log('🔐 [EditUser] Updating user:', {
        userId: user._id,
        hasToken: !!token,
        apiData
      });
      
      const response = await axios.put(`/api/companies/users/${user._id}`, apiData, {
        withCredentials: true,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ [EditUser] User updated successfully');
      onUserUpdated();
    } catch (err: any) {
      console.log('❌ [EditUser] Update failed:', {
        status: err.response?.status,
        message: err.response?.data?.error,
        errors: err.response?.data?.errors
      });

      if (err.response?.data?.errors && Array.isArray(err.response.data.errors)) {
        // Handle validation errors
        const errorMessages = err.response.data.errors.map((error: any) => error.msg).join(', ');
        setError(errorMessages);
      } else {
        setError(err.response?.data?.error || err.message || 'Failed to update user');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-600 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Edit User</h3>
      
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400 dark:text-red-300" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Error</h3>
              <p className="mt-1 text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              First Name *
            </label>
            <input
              type="text"
              id="firstName"
              required
              value={form.firstName}
              onChange={(e) => setForm({ ...form, firstName: e.target.value })}
              className="w-full border border-gray-300 dark:border-dark-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
              placeholder="Enter first name"
            />
          </div>

          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Last Name *
            </label>
            <input
              type="text"
              id="lastName"
              required
              value={form.lastName}
              onChange={(e) => setForm({ ...form, lastName: e.target.value })}
              className="w-full border border-gray-300 dark:border-dark-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
              placeholder="Enter last name"
            />
          </div>
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Email Address *
          </label>
          <input
            type="email"
            id="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full border border-gray-300 dark:border-dark-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
            placeholder="Enter email address"
          />
        </div>

        <div>
          <label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Role *
          </label>
          <select
            id="role"
            required
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value as any })}
            className="w-full border border-gray-300 dark:border-dark-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
          >
            <option value="company_user">Company User</option>
            <option value="company_team_leader">Team Leader</option>
          </select>
        </div>

        {teams.length > 0 && (
          <div>
            <label htmlFor="teamId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Team {form.role === 'company_team_leader' ? '*' : ''}
            </label>
            <select
              id="teamId"
              required={form.role === 'company_team_leader'}
              value={form.teamId || ''}
              onChange={(e) => setForm({ ...form, teamId: e.target.value || undefined })}
              className="w-full border border-gray-300 dark:border-dark-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
            >
              <option value="">{form.role === 'company_team_leader' ? 'Select a team' : 'No team assigned'}</option>
              {teams.map((team) => (
                <option key={team._id} value={team._id}>
                  {team.name}
                </option>
              ))}
            </select>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {form.role === 'company_team_leader' 
                ? 'Select the team this user will lead' 
                : 'Optionally assign this user to a team'
              }
            </p>
          </div>
        )}

        {form.role === 'company_team_leader' && teams.length === 0 && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              No teams available. Create a team first before assigning a team leader.
            </p>
          </div>
        )}

        <div className="flex space-x-4">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 bg-gray-300 dark:bg-dark-600 text-gray-700 dark:text-gray-300 py-2 px-4 rounded-lg font-medium hover:bg-gray-400 dark:hover:bg-dark-500 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || (form.role === 'company_team_leader' && teams.length === 0) || (form.role === 'company_team_leader' && !form.teamId)}
            className="flex-1 bg-blue-600 dark:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Updating User...' : 'Update User'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditUser;
