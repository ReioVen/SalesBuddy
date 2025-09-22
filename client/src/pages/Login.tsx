import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.tsx';
import { Eye, EyeOff } from 'lucide-react';

const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

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
    <div className="min-h-screen bg-gray-50 dark:bg-dark-900 flex items-start justify-center pt-56 pb-16 px-4">
      <div className="w-full max-w-md bg-white dark:bg-dark-800 rounded-2xl shadow-2xl ring-1 ring-gray-200 dark:ring-dark-700 border border-gray-100 dark:border-dark-700 p-5">
        <h1 className="text-2xl font-bold mb-6 text-center text-gray-900 dark:text-white">Welcome back</h1>
        <form onSubmit={onSubmit} className="space-y-4">
          <input className="input-field" name="email" type="email" placeholder="Email" value={form.email} onChange={onChange} required />
          <div className="relative">
            <input 
              className="input-field pr-10" 
              name="password" 
              type={showPassword ? "text" : "password"} 
              placeholder="Password" 
              value={form.password} 
              onChange={onChange} 
              required 
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300" />
              ) : (
                <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300" />
              )}
            </button>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary w-full">{loading ? 'Signing in...' : 'Sign in'}</button>
        </form>
        <div className="text-center text-sm text-gray-600 dark:text-gray-300 mt-4 space-y-2">
          <p>
            New here? <Link to="/register" className="text-blue-600 dark:text-blue-400 hover:underline">Create an account</Link>
          </p>
          <p>
            <Link to="/forgot-password" className="text-blue-600 dark:text-blue-400 hover:underline">Forgot your password?</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;


