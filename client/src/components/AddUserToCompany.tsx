import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext.tsx';

interface AddUserForm {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  role: 'company_user' | 'company_team_leader';
  teamId?: string;
}

interface Team {
  _id: string;
  name: string;
  description?: string;
}

interface AddUserToCompanyProps {
  companyId: string;
  teams: Team[];
  onUserAdded: () => void;
  onCancel: () => void;
}

const AddUserToCompany: React.FC<AddUserToCompanyProps> = ({ 
  companyId, 
  teams, 
  onUserAdded, 
  onCancel 
}) => {
  const { user } = useAuth();
  const [form, setForm] = useState<AddUserForm>({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    role: 'company_user'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passwordMatchError, setPasswordMatchError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setPasswordMatchError(null);

    // Client-side validation
    if (form.password !== form.confirmPassword) {
      setPasswordMatchError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (form.role === 'company_team_leader' && !form.teamId) {
      setError('Please select a team for team leader role');
      setLoading(false);
      return;
    }

    try {
      // Prepare form data
      const formData = {
        ...form,
        companyId
      };

      // For team leaders, automatically set the team name
      if (user?.role === 'company_team_leader') {
        const userTeam = teams.find(team => team.teamLeader === user.id);
        if (userTeam) {
          formData.teamName = userTeam.name;
        }
      } else if (form.teamId) {
        // For company admins, use the selected team
        const selectedTeam = teams.find(team => team._id === form.teamId);
        if (selectedTeam) {
          formData.teamName = selectedTeam.name;
        }
      }

      const response = await fetch('/api/companies/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add user');
      }

      // Reset form and notify parent
      setForm({
        email: '',
        password: '',
        confirmPassword: '',
        firstName: '',
        lastName: '',
        role: 'company_user'
      });
      onUserAdded();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Add User to Company</h3>
      
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="mt-1 text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
              First Name *
            </label>
            <input
              type="text"
              id="firstName"
              required
              value={form.firstName}
              onChange={(e) => setForm({ ...form, firstName: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter first name"
            />
          </div>

          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
              Last Name *
            </label>
            <input
              type="text"
              id="lastName"
              required
              value={form.lastName}
              onChange={(e) => setForm({ ...form, lastName: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter last name"
            />
          </div>
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email Address *
          </label>
          <input
            type="email"
            id="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter email address"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Password *
          </label>
          <input
            type="password"
            id="password"
            required
            minLength={8}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter password (min 8 characters)"
          />
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
            Confirm Password *
          </label>
          <input
            type="password"
            id="confirmPassword"
            required
            minLength={8}
            value={form.confirmPassword}
            onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
            onBlur={() => {
              if (form.confirmPassword && form.password !== form.confirmPassword) {
                setPasswordMatchError('Passwords do not match');
              } else {
                setPasswordMatchError(null);
              }
            }}
            className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              passwordMatchError ? 'border-red-500 ring-2 ring-red-500' : 'border-gray-300'
            }`}
            placeholder="Confirm password"
          />
          {passwordMatchError && (
            <p className="mt-1 text-sm text-red-600">{passwordMatchError}</p>
          )}
        </div>

        <div>
          <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
            Role *
          </label>
          <select
            id="role"
            required
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value as any, teamId: e.target.value === 'company_user' ? undefined : form.teamId })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="company_user">Company User</option>
            {user?.role === 'company_admin' && (
              <option value="company_team_leader">Team Leader</option>
            )}
          </select>
        </div>

        {/* Only show team selection for company admins */}
        {user?.role === 'company_admin' && teams.length > 0 && (
          <div>
            <label htmlFor="teamId" className="block text-sm font-medium text-gray-700 mb-1">
              Team {form.role === 'company_team_leader' ? '*' : '(optional)'}
            </label>
            <select
              id="teamId"
              required={form.role === 'company_team_leader'}
              value={form.teamId || ''}
              onChange={(e) => setForm({ ...form, teamId: e.target.value || undefined })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select a team</option>
              {teams.map((team) => (
                <option key={team._id} value={team._id}>
                  {team.name}
                </option>
              ))}
            </select>
            <p className="mt-1 text-sm text-gray-500">
              {form.role === 'company_team_leader' 
                ? 'Select the team this user will lead'
                : 'Select a team to assign this user to (optional)'
              }
            </p>
          </div>
        )}

        {teams.length === 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-700">
              No teams available. Create a team first before assigning users to teams.
            </p>
          </div>
        )}

        <div className="flex space-x-4">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || (form.role === 'company_team_leader' && teams.length === 0)}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Adding User...' : 'Add User'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddUserToCompany;
