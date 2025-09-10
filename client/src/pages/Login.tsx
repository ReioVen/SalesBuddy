import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.tsx';

const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState<string | null>(null);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      setError(null);
      const result = await login(form.email, form.password);
      if (result.success) {
        navigate('/');
      } else {
        setError(result.message || 'Invalid email or password');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-start justify-center pt-56 pb-16 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl ring-1 ring-gray-200 border border-gray-100 p-5">
        <h1 className="text-2xl font-bold mb-6 text-center">Welcome back</h1>
        <form onSubmit={onSubmit} className="space-y-4">
          <input className="input-field" name="email" type="email" placeholder="Email" value={form.email} onChange={onChange} required />
          <input className="input-field" name="password" type="password" placeholder="Password" value={form.password} onChange={onChange} required />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary w-full">{loading ? 'Signing in...' : 'Sign in'}</button>
        </form>
        <div className="text-center text-sm text-gray-600 mt-4 space-y-2">
          <p>
            New here? <Link to="/register" className="text-blue-600 hover:underline">Create an account</Link>
          </p>
          <p>
            <Link to="/forgot-password" className="text-blue-600 hover:underline">Forgot your password?</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;


