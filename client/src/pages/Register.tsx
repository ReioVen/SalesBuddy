import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.tsx';
import { Eye, EyeOff } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation.ts';

const Register: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
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
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [passwordMatchError, setPasswordMatchError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    
    // Clear password match error when user types
    if (e.target.name === 'password' || e.target.name === 'confirmPassword') {
      setPasswordMatchError(null);
    }
  };

  // Check password match in real-time
  const checkPasswordMatch = () => {
    if (form.confirmPassword && form.password !== form.confirmPassword) {
      setPasswordMatchError(t('passwordsDoNotMatch'));
    } else {
      setPasswordMatchError(null);
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      setError(null);
      setFieldErrors({});
      setPasswordMatchError(null);
      
      if (form.password !== form.confirmPassword) {
        setPasswordMatchError(t('passwordsDoNotMatch'));
        setLoading(false);
        return;
      }
      const result = await register({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        password: form.password,
        company: form.company || undefined,
      });
      if (result.success) {
        // Check if user intended to subscribe to a paid plan
        const intendedPlan = localStorage.getItem('intendedPlan');
        if (intendedPlan && intendedPlan !== 'free') {
          // Clear the intended plan and redirect to pricing with the plan selected
          localStorage.removeItem('intendedPlan');
          navigate(`/pricing?plan=${intendedPlan}`);
        } else {
          navigate('/');
        }
      } else {
        if (result.fieldErrors) setFieldErrors(result.fieldErrors);
        if (result.message) setError(result.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-900 flex items-start justify-center pt-40 pb-16 px-4">
      <div className="w-full max-w-md bg-white dark:bg-dark-800 rounded-2xl shadow-2xl ring-1 ring-gray-200 dark:ring-dark-700 border border-gray-100 dark:border-dark-700 p-5">
        <h1 className="text-2xl font-bold mb-6 text-center text-gray-900 dark:text-white">{t('createAccount')}</h1>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <input className={`input-field ${fieldErrors.firstName ? 'ring-2 ring-red-500' : ''}`} name="firstName" placeholder={t('firstName')} value={form.firstName} onChange={onChange} required />
              {fieldErrors.firstName && <p className="text-xs text-red-600 mt-1">{fieldErrors.firstName}</p>}
            </div>
            <div>
              <input className={`input-field ${fieldErrors.lastName ? 'ring-2 ring-red-500' : ''}`} name="lastName" placeholder={t('lastName')} value={form.lastName} onChange={onChange} required />
              {fieldErrors.lastName && <p className="text-xs text-red-600 mt-1">{fieldErrors.lastName}</p>}
            </div>
          </div>
          <div>
            <input className={`input-field ${fieldErrors.email ? 'ring-2 ring-red-500' : ''}`} name="email" type="email" placeholder={t('email')} value={form.email} onChange={onChange} required />
            {fieldErrors.email && <p className="text-xs text-red-600 mt-1">{fieldErrors.email}</p>}
          </div>
          <div>
            <div className="relative">
              <input 
                className={`input-field pr-10 ${fieldErrors.password ? 'ring-2 ring-red-500' : ''}`} 
                name="password" 
                type={showPassword ? "text" : "password"} 
                placeholder={t('password')} 
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
            {fieldErrors.password && <p className="text-xs text-red-600 mt-1">{fieldErrors.password}</p>}
          </div>
          <div>
            <div className="relative">
              <input 
                className={`input-field pr-10 ${passwordMatchError ? 'ring-2 ring-red-500' : ''}`} 
                name="confirmPassword" 
                type={showConfirmPassword ? "text" : "password"} 
                placeholder={t('confirmPassword')} 
                value={form.confirmPassword} 
                onChange={onChange}
                onBlur={checkPasswordMatch}
                required 
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300" />
                )}
              </button>
            </div>
            {passwordMatchError && <p className="text-xs text-red-600 mt-1">{passwordMatchError}</p>}
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <input className="input-field" name="company" placeholder={t('company')} value={form.company} onChange={onChange} />
          <button type="submit" disabled={loading} className="btn-primary w-full">{loading ? t('creating') : t('createAccount')}</button>
        </form>
        <p className="text-center text-sm text-gray-600 mt-4">
          {t('alreadyHaveAccount')} <Link to="/login" className="text-blue-600 hover:underline">{t('logIn')}</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;


