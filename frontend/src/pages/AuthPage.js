import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { EyeIcon, EyeSlashIcon, UserIcon, EnvelopeIcon, LockClosedIcon, SparklesIcon, ArrowRightIcon, XMarkIcon, CheckIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';

const AuthPage = () => {
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const { notify } = useNotifications();

  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({ username: '', email: '', password: '', confirmPassword: '' });
  const [checks, setChecks] = useState({ length: false, uppercase: false, lowercase: false, number: false, special: false });

  const validate = (p) => {
    const c = {
      length: p.length >= 8,
      uppercase: /[A-Z]/.test(p),
      lowercase: /[a-z]/.test(p),
      number: /\d/.test(p),
      special: /[^A-Za-z0-9]/.test(p)
    };
    setChecks(c);
    return Object.values(c).filter(Boolean).length;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === 'password') validate(value);
    if (error) setError('');
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (isLogin) {
        if (typeof login !== 'function') throw new Error('Login is not available. Please try again shortly.');
        await login(formData.username, formData.password);
        notify('Welcome!', 'success');
        navigate('/');
      } else {
        if (formData.password !== formData.confirmPassword) {
          setError('Passwords do not match');
          return;
        }
        if (validate(formData.password) < 3) {
          setError('Password too weak');
          return;
        }
        if (typeof register !== 'function') throw new Error('Register is not available. Please try again shortly.');
        await register(formData.username, formData.email, formData.password);
        notify('Account created. Please sign in.', 'success');
        setIsLogin(true);
      }
    } catch (err) {
      const msg = err?.message || 'Authentication failed';
      setError(msg);
      notify(msg, 'error', 5000);
    } finally {
      setLoading(false);
    }
  };

  const strength = Object.values(checks).filter(Boolean).length;
  const strengthColor = strength <= 2 ? 'bg-red-500' : strength <= 3 ? 'bg-yellow-500' : 'bg-emerald-500';
  const strengthText = strength <= 2 ? 'Weak' : strength <= 3 ? 'Medium' : 'Strong';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-3">
            <img src="/logo-mark.svg" alt="PlayAxis" className="w-12 h-12 rounded-2xl" />
            <span className="text-3xl font-bold text-white">PlayAxis</span>
          </div>
          <p className="text-gray-300">{isLogin ? 'Welcome back' : 'Create your account'}</p>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20 shadow-2xl">
          <div className="flex bg-white/10 rounded-2xl p-1 mb-8">
            <button onClick={() => setIsLogin(true)} className={`flex-1 py-3 rounded-xl font-semibold ${isLogin ? 'bg-gradient-to-r from-emerald-600 to-cyan-600 text-white' : 'text-gray-300'}`}>Sign In</button>
            <button onClick={() => setIsLogin(false)} className={`flex-1 py-3 rounded-xl font-semibold ${!isLogin ? 'bg-gradient-to-r from-emerald-600 to-cyan-600 text-white' : 'text-gray-300'}`}>Sign Up</button>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 mb-6 flex items-center gap-2 text-red-100">
                <XMarkIcon className="w-5 h-5" />
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={onSubmit} className="space-y-6">
            <div className="relative">
              <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input type="text" name="username" placeholder="Username or email" value={formData.username} onChange={handleChange} required className="w-full pl-10 pr-4 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:border-cyan-500" />
            </div>

            {!isLogin && (
              <div className="relative">
                <EnvelopeIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} required className="w-full pl-10 pr-4 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:border-cyan-500" />
              </div>
            )}

            <div className="relative">
              <LockClosedIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input type={showPassword ? 'text' : 'password'} name="password" placeholder="Password" value={formData.password} onChange={handleChange} required className="w-full pl-10 pr-12 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:border-cyan-500" />
              <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
                {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
              </button>
            </div>

            {!isLogin && formData.password && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">Password Strength</span>
                  <span className={`text-sm font-medium ${strength <= 2 ? 'text-red-400' : strength <= 3 ? 'text-yellow-400' : 'text-emerald-400'}`}>{strengthText}</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div className={`h-2 rounded-full ${strengthColor}`} style={{ width: `${(strength / 5) * 100}%` }} />
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {Object.entries(checks).map(([k, v]) => (
                    <div key={k} className={`flex items-center gap-1 ${v ? 'text-emerald-400' : 'text-gray-400'}`}>
                      <CheckIcon className="w-3 h-3" /> <span className="capitalize">{k === 'length' ? '8+ chars' : k}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!isLogin && (
              <div className="relative">
                <LockClosedIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input type={showConfirmPassword ? 'text' : 'password'} name="confirmPassword" placeholder="Confirm Password" value={formData.confirmPassword} onChange={handleChange} required className="w-full pl-10 pr-12 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:border-cyan-500" />
                <button type="button" onClick={() => setShowConfirmPassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
                  {showConfirmPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                </button>
              </div>
            )}

            <motion.button type="submit" disabled={loading} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full py-4 bg-gradient-to-r from-emerald-600 to-cyan-600 text-white rounded-xl font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-50">
              {isLogin ? 'Sign In' : 'Create Account'} <ArrowRightIcon className="w-5 h-5" />
            </motion.button>
          </form>
        </div>

        <div className="text-center mt-6">
          {isLogin ? (
            <button className="text-emerald-300 hover:text-emerald-200">Forgot your password?</button>
          ) : (
            <p className="text-xs text-gray-400">
              By creating an account, you agree to our <button className="text-emerald-300 hover:text-emerald-200">Terms</button> and <button className="text-emerald-300 hover:text-emerald-200">Privacy Policy</button>.
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default AuthPage;