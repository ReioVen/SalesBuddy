import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.tsx';

const Register: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    company: ''
  });
  const [error, setError] = useState<string | null>(null);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      setError(null);
      if (form.password !== form.confirmPassword) {
        setError('Passwords do not match');
        return;
      }
      await register({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        password: form.password,
        company: form.company || undefined,
      });
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-start justify-center pt-40 pb-16 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl ring-1 ring-gray-200 border border-gray-100 p-5">
        <h1 className="text-2xl font-bold mb-6 text-center">Create your account</h1>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <input className="input-field" name="firstName" placeholder="First name" value={form.firstName} onChange={onChange} required />
            <input className="input-field" name="lastName" placeholder="Last name" value={form.lastName} onChange={onChange} required />
          </div>
          <input className="input-field" name="email" type="email" placeholder="Email" value={form.email} onChange={onChange} required />
          <input className="input-field" name="password" type="password" placeholder="Password" value={form.password} onChange={onChange} required />
          <input className="input-field" name="confirmPassword" type="password" placeholder="Confirm password" value={form.confirmPassword} onChange={onChange} required />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <input className="input-field" name="company" placeholder="Company (optional)" value={form.company} onChange={onChange} />
          <button type="submit" disabled={loading} className="btn-primary w-full">{loading ? 'Creating...' : 'Create account'}</button>
        </form>
        <p className="text-center text-sm text-gray-600 mt-4">
          Already have an account? <Link to="/login" className="text-blue-600 hover:underline">Log in</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;


