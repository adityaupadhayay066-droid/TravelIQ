import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, Phone, LogIn, ArrowRight, X, Train } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import AuthSuccessOverlay from './AuthSuccessOverlay';

export default function AuthModal() {
  const { 
    login, register, 
    isAuthModalOpen, authModalMode, 
    closeAuthModal 
  } = useAuth();

  const [mode, setMode] = useState(authModalMode);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', phone: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [successUser, setSuccessUser] = useState(null);
  
  const navigate = useNavigate();

  React.useEffect(() => {
    if (isAuthModalOpen) {
      setMode(authModalMode);
      setIsSuccess(false);
      setSuccessUser(null);
    }
  }, [isAuthModalOpen, authModalMode]);

  if (!isAuthModalOpen) return null;

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    let result;
    if (mode === 'login') {
      result = await login(formData.email, formData.password);
      if (result && result.status === '2FA_REQUIRED') {
        setIsSubmitting(false);
        closeAuthModal();
        navigate('/login', { state: { twoFactorRequired: true, twoFactorData: result } });
        return;
      }
    } else {
      if (formData.password.length < 6) {
        toast.error('Password must be at least 6 characters.');
        setIsSubmitting(false);
        return;
      }
      result = await register(formData.name, formData.email, formData.password, formData.phone);
    }
    
    setIsSubmitting(false);

    if (result === 'SUCCESS' || (result && result.status === 'SUCCESS')) {
      setIsSuccess(true);
      const activeUser = (result && result.user) || { name: formData.name || 'Traveler' };
      setSuccessUser(activeUser);
    }
  };

  const handleSuccessComplete = () => {
    closeAuthModal();
    setIsSuccess(false);
    setSuccessUser(null);
    setFormData({ name: '', email: '', password: '', phone: '' });
  };

  if (isSuccess) {
    return (
      <AuthSuccessOverlay 
        mode={mode} 
        userName={successUser?.name || 'Traveler'} 
        onComplete={handleSuccessComplete} 
      />
    );
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Overlay Backdrop */}
      <div 
        className="absolute inset-0 bg-[#173F3A]/40 backdrop-blur-xs"
        onClick={closeAuthModal}
      />

      {/* Modal Card */}
      <div className="relative z-10 w-full max-w-md bg-white dark:bg-[#1b2c28] border border-[#E3DED2] dark:border-[#2a403a] p-8 rounded-[16px] shadow-[0_4px_16px_rgba(23,63,58,0.1)]">
        <button 
          onClick={closeAuthModal} 
          className="absolute top-4 right-4 text-[#66736F] hover:text-[#173F3A] dark:hover:text-white p-2 rounded-lg hover:bg-[#EEF2ED] dark:hover:bg-[#213530] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6 space-y-1">
          <h2 className="text-2xl font-bold text-[#173F3A] dark:text-white font-heading">
            {mode === 'login' ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p className="text-[#66736F] dark:text-[#A3B0AB] text-xs">
            {mode === 'login' ? 'Sign in to access your travel dashboard' : 'Join TravelIQ to plan and compare trips'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex p-1 bg-[#EEF2ED] dark:bg-[#12201D] rounded-lg mb-6 border border-[#E3DED2] dark:border-[#2a403a]">
          <button 
            onClick={() => setMode('login')}
            className={`flex-1 py-2 text-xs font-bold rounded-md transition-colors ${mode === 'login' ? 'bg-[#173F3A] text-white shadow-xs' : 'text-[#66736F] hover:text-[#173F3A]'}`}
          >
            Sign In
          </button>
          <button 
            onClick={() => setMode('register')}
            className={`flex-1 py-2 text-xs font-bold rounded-md transition-colors ${mode === 'register' ? 'bg-[#173F3A] text-white shadow-xs' : 'text-[#66736F] hover:text-[#173F3A]'}`}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <>
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#66736F]">Full Name</label>
                <input 
                  type="text" 
                  name="name" 
                  required 
                  value={formData.name} 
                  onChange={handleChange} 
                  placeholder="John Doe"
                  className="travel-input"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#66736F]">Phone Number (Optional)</label>
                <input 
                  type="tel" 
                  name="phone" 
                  value={formData.phone} 
                  onChange={handleChange} 
                  placeholder="+91 98765 43210"
                  className="travel-input"
                />
              </div>
            </>
          )}

          <div className="space-y-1">
            <label className="text-xs font-bold text-[#66736F]">Email Address</label>
            <input 
              type="email" 
              name="email" 
              required 
              value={formData.email} 
              onChange={handleChange} 
              placeholder="name@example.com"
              className="travel-input"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-[#66736F]">Password</label>
            <input 
              type="password" 
              name="password" 
              required 
              value={formData.password} 
              onChange={handleChange} 
              placeholder="••••••••"
              className="travel-input"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary w-full h-11 mt-4"
          >
            {isSubmitting ? (
              <span>Processing...</span>
            ) : (
              <span>{mode === 'login' ? 'Sign In' : 'Create Account'}</span>
            )}
          </button>
        </form>

      </div>
    </div>
  );
}
