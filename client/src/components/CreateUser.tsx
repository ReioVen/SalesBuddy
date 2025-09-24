import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = 'https://salesbuddy-production.up.railway.app';

interface CreateUserForm {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  role: 'individual' | 'company_user' | 'company_team_leader' | 'company_admin';
  companyId?: string;
  teamId?: string;
}

interface Company {
  _id: string;
  name: string;
  companyId: string;
}

const CreateUser: React.FC = () => {
  const [form, setForm] = useState<CreateUserForm>({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    role: 'individual'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passwordMatchError, setPasswordMatchError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(true);

  // Fetch companies when component mounts
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const response = await axios.get('/api/admin/companies');
        setCompanies(response.data.companies || []);
      } catch (error) {
        console.error('Failed to fetch companies:', error);
      } finally {
        setLoadingCompanies(false);
      }
    };

    fetchCompanies();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('User form submitted with data:', form);
    setLoading(true);
    setError(null);
    setPasswordMatchError(null);

    // Client-side validation
    if (form.password !== form.confirmPassword) {
      setPasswordMatchError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (form.role !== 'individual' && !form.companyId) {
      setError('Please select a company for this user role');
      setLoading(false);
      return;
    }

    try {
      await axios.post('/api/admin/users/create', form);
      setSuccess(true);
      
      // Reset form
      setForm({
        email: '',
        password: '',
        confirmPassword: '',
        firstName: '',
        lastName: '',
        role: 'individual',
        companyId: undefined
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4 mb-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-green-400">User Created Successfully!</h3>
            <p className="mt-1 text-sm text-green-300">
              The user has been created and can now log in with their credentials.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Create New User</h3>
      
      {error && (
        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-400">Error</h3>
              <p className="mt-1 text-sm text-red-300">{error}</p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-300 mb-1">
              First Name *
            </label>
            <input
              type="text"
              id="firstName"
              required
              value={form.firstName}
              onChange={(e) => setForm({ ...form, firstName: e.target.value })}
              className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter first name"
            />
          </div>

          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-300 mb-1">
              Last Name *
            </label>
            <input
              type="text"
              id="lastName"
              required
              value={form.lastName}
              onChange={(e) => setForm({ ...form, lastName: e.target.value })}
              className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter last name"
            />
          </div>
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
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
          <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
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
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-1">
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
          <label htmlFor="role" className="block text-sm font-medium text-gray-300 mb-1">
            Role *
          </label>
          <select
            id="role"
            required
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value as any, companyId: e.target.value === 'individual' ? undefined : form.companyId })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="individual">Individual User</option>
            <option value="company_user">Company User</option>
            <option value="company_team_leader">Company Team Leader</option>
            <option value="company_admin">Company Admin</option>
          </select>
        </div>

        {form.role !== 'individual' && (
          <div>
            <label htmlFor="companyId" className="block text-sm font-medium text-gray-300 mb-1">
              Company *
            </label>
            {loadingCompanies ? (
              <div className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50">
                <span className="text-gray-400">Loading companies...</span>
              </div>
            ) : (
              <select
                id="companyId"
                required={form.role !== 'individual'}
                value={form.companyId || ''}
                onChange={(e) => setForm({ ...form, companyId: e.target.value || undefined })}
                className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select a company</option>
                {companies.map((company) => (
                  <option key={company._id} value={company._id}>
                    {company.name} ({company.companyId})
                  </option>
                ))}
              </select>
            )}
            <p className="mt-1 text-sm text-gray-400">
              Select the company this user will belong to
            </p>
          </div>
        )}

        <div className="flex space-x-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating User...' : 'Create User'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateUser;
