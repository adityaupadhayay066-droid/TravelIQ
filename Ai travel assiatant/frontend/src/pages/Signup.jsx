import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, ArrowRight, User, Phone, ShieldCheck, Train } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import zxcvbn from 'zxcvbn';
import { Turnstile } from '@marsidev/react-turnstile';
import AuthSuccessOverlay from '../components/AuthSuccessOverlay';

export default function Signup() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: ''
  });
  const [turnstileToken, setTurnstileToken] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // IRCTC State
  const [showIrctcLoginModal, setShowIrctcLoginModal] = useState(false);

  // Success flow states
  const [isSuccess, setIsSuccess] = useState(false);
  const [successUser, setSuccessUser] = useState(null);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Advanced Password strength calculator using zxcvbn
  const getPasswordStrength = () => {
    const pw = formData.password;
    if (!pw) return { level: 0, label: '', color: '' };
    
    const result = zxcvbn(pw);
    const score = result.score; // 0 to 4
    
    if (score === 0 || score === 1) return { level: 1, label: 'Weak', color: 'bg-red-500' };
    if (score === 2) return { level: 2, label: 'Fair', color: 'bg-amber-500' };
    if (score === 3) return { level: 3, label: 'Good', color: 'bg-blue-500' };
    return { level: 4, label: 'Strong', color: 'bg-emerald-500' };
  };

  const strength = getPasswordStrength();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      return toast.error('Passwords do not match.');
    }
    if (formData.password.length < 6) {
      return toast.error('Password must be at least 6 characters.');
    }
    if (!turnstileToken && import.meta.env.PROD) {
      return toast.error('Please complete the security check.');
    }
    
    setIsSubmitting(true);
    const result = await register(formData.name, formData.email, formData.password, formData.phone, turnstileToken);
    setIsSubmitting(false);
    
    if (result === 'SUCCESS') {
      setIsSuccess(true);
      setSuccessUser({ name: formData.name });
    }
    // 'FAILED' — do nothing, error toast already shown
  };

  const handleSuccessComplete = () => {
    setIsSuccess(false);
    setSuccessUser(null);
    navigate('/');
  };

  if (isSuccess) {
    return (
      <AuthSuccessOverlay 
        mode="register" 
        userName={successUser?.name || 'Traveler'} 
        onComplete={handleSuccessComplete} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F5EF] dark:bg-[#12201D] flex flex-col justify-center items-center relative px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-[#FFFFFF] dark:bg-[#1B2C28] rounded-xl shadow-sm border border-[#E3DED2] dark:border-[#2A403A] p-8 relative z-10"
      >
        <div className="text-center mb-8">
          <Link to="/" className="inline-block mb-4">
            <span className="font-bold text-3xl tracking-tight text-[#173F3A] dark:text-[#EEF2ED]">
              TravelIQ
            </span>
          </Link>
          <h2 className="text-2xl font-bold text-[#263238] dark:text-[#F7F5EF] mb-2">Create Account</h2>
          <p className="text-[#66736F] dark:text-[#A3B0AB]">Join the AI travel revolution</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#66736F] dark:text-[#A3B0AB] w-5 h-5" />
            <input
              id="signup-name"
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              placeholder="Full Name"
              className="w-full bg-[#FFFFFF] dark:bg-[#1B2C28] border border-[#E3DED2] dark:border-[#2A403A] rounded-lg py-3 pl-12 pr-4 text-[#263238] dark:text-[#F7F5EF] placeholder-[#66736F] dark:placeholder-[#A3B0AB] focus:outline-none focus:border-[#173F3A] focus:ring-1 focus:ring-[#173F3A] transition-all"
            />
          </div>
          
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#66736F] dark:text-[#A3B0AB] w-5 h-5" />
            <input
              id="signup-email"
              type="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              placeholder="Email address"
              className="w-full bg-[#FFFFFF] dark:bg-[#1B2C28] border border-[#E3DED2] dark:border-[#2A403A] rounded-lg py-3 pl-12 pr-4 text-[#263238] dark:text-[#F7F5EF] placeholder-[#66736F] dark:placeholder-[#A3B0AB] focus:outline-none focus:border-[#173F3A] focus:ring-1 focus:ring-[#173F3A] transition-all"
            />
          </div>

          <div className="relative">
            <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#66736F] dark:text-[#A3B0AB] w-5 h-5" />
            <input
              id="signup-phone"
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Phone Number (Optional)"
              className="w-full bg-[#FFFFFF] dark:bg-[#1B2C28] border border-[#E3DED2] dark:border-[#2A403A] rounded-lg py-3 pl-12 pr-4 text-[#263238] dark:text-[#F7F5EF] placeholder-[#66736F] dark:placeholder-[#A3B0AB] focus:outline-none focus:border-[#173F3A] focus:ring-1 focus:ring-[#173F3A] transition-all"
            />
          </div>

          <div className="space-y-2">
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#66736F] dark:text-[#A3B0AB] w-5 h-5" />
              <input
                id="signup-password"
                type="password"
                name="password"
                required
                minLength={6}
                value={formData.password}
                onChange={handleChange}
                placeholder="Password (min 6 characters)"
                className="w-full bg-[#FFFFFF] dark:bg-[#1B2C28] border border-[#E3DED2] dark:border-[#2A403A] rounded-lg py-3 pl-12 pr-4 text-[#263238] dark:text-[#F7F5EF] placeholder-[#66736F] dark:placeholder-[#A3B0AB] focus:outline-none focus:border-[#173F3A] focus:ring-1 focus:ring-[#173F3A] transition-all"
              />
            </div>
            {/* Password Strength Indicator */}
            {formData.password && (
              <div className="flex items-center gap-2 px-1">
                <div className="flex-1 flex gap-1">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= strength.level ? strength.color : 'bg-[#E3DED2] dark:bg-[#2A403A]'}`} />
                  ))}
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-wider ${
                  strength.level <= 1 ? 'text-red-500' : strength.level <= 2 ? 'text-amber-500' : strength.level <= 3 ? 'text-blue-500' : 'text-emerald-500'
                }`}>
                  {strength.label}
                </span>
              </div>
            )}
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#66736F] dark:text-[#A3B0AB] w-5 h-5" />
            <input
              id="signup-confirm-password"
              type="password"
              name="confirmPassword"
              required
              minLength={6}
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm Password"
              className="w-full bg-[#FFFFFF] dark:bg-[#1B2C28] border border-[#E3DED2] dark:border-[#2A403A] rounded-lg py-3 pl-12 pr-4 text-[#263238] dark:text-[#F7F5EF] placeholder-[#66736F] dark:placeholder-[#A3B0AB] focus:outline-none focus:border-[#173F3A] focus:ring-1 focus:ring-[#173F3A] transition-all"
            />
          </div>

          {/* Security notice */}
          <div className="flex items-start gap-2.5 bg-[#EEF2ED] dark:bg-[#213530] border border-[#E3DED2] dark:border-[#2A403A] rounded-lg p-3 mt-2">
            <ShieldCheck className="w-4 h-4 text-[#173F3A] dark:text-[#EEF2ED] flex-shrink-0 mt-0.5" />
            <p className="text-[11px] text-[#66736F] dark:text-[#A3B0AB] leading-relaxed">
              Your account is created securely. We use enterprise-grade encryption to protect your credentials.
            </p>
          </div>

          <div className="flex justify-center my-4">
            <Turnstile
              siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY || "1x00000000000000000000AA"}
              onSuccess={(token) => setTurnstileToken(token)}
              options={{ theme: 'auto' }}
            />
          </div>

          <button
            id="signup-submit"
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-2 bg-[#D96C4F] hover:bg-[#C75D43] text-white rounded-lg px-8 py-3.5 font-semibold flex items-center justify-center transition-all duration-300 shadow-sm disabled:opacity-70 disabled:cursor-not-allowed group"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Creating account...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                Create Account <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
            )}
          </button>
        </form>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[#E3DED2] dark:border-[#2A403A]"></div></div>
          <div className="relative flex justify-center text-[10px] uppercase font-bold">
            <span className="bg-[#FFFFFF] dark:bg-[#1B2C28] px-2 text-[#66736F] dark:text-[#A3B0AB]">Or continue with</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowIrctcLoginModal(true)}
          className="w-full bg-[#FFFFFF] dark:bg-[#1B2C28] hover:bg-[#EEF2ED] dark:hover:bg-[#213530] text-[#173F3A] dark:text-[#EEF2ED] border border-[#E3DED2] dark:border-[#2A403A] rounded-lg py-3 flex items-center justify-center gap-2 font-bold text-xs transition-all duration-300 shadow-sm cursor-pointer active:scale-95"
        >
          <Train className="w-4 h-4 text-[#173F3A] dark:text-[#EEF2ED]" />
          Continue with IRCTC
        </button>

        <div className="mt-6 text-center space-y-3">
          <p className="text-[#66736F] dark:text-[#A3B0AB] text-xs">
            Already have an account?{' '}
            <Link to="/login" className="text-[#D96C4F] hover:text-[#C75D43] transition-colors font-medium">
              Sign in <ArrowRight className="w-4 h-4 inline" />
            </Link>
          </p>
          <div>
            <Link to="/admin/signup" className="text-[#66736F] dark:text-[#A3B0AB] hover:text-[#173F3A] dark:hover:text-[#EEF2ED] transition-colors text-[11px] font-medium inline-flex items-center gap-1">
              🛡️ Need an Admin Account? Register as Administrator
            </Link>
          </div>
        </div>

        <AnimatePresence>
          {showIrctcLoginModal && (
            <div className="fixed inset-0 bg-[#263238]/50 dark:bg-[#12201D]/80 flex items-center justify-center p-4 z-[10000]" onClick={() => setShowIrctcLoginModal(false)}>
              <motion.div
                onClick={(e) => e.stopPropagation()}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-sm border border-[#E3DED2] dark:border-[#2A403A] bg-[#FFFFFF] dark:bg-[#1B2C28] p-8 rounded-xl shadow-sm relative text-center space-y-6"
              >
                <div className="absolute top-0 left-0 right-0 h-1 bg-[#D96C4F]" />
                
                <div className="flex justify-center mb-2">
                  <div className="w-16 h-16 bg-[#EEF2ED] dark:bg-[#213530] border border-[#E3DED2] dark:border-[#2A403A] rounded-xl flex items-center justify-center text-[#173F3A] dark:text-[#EEF2ED] text-3xl">
                    🛡️
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-base font-bold text-[#263238] dark:text-[#F7F5EF]">Login on IRCTC to complete booking</h3>
                  <p className="text-[#66736F] dark:text-[#A3B0AB] text-xs leading-relaxed">
                    TravelIQ does not ask for or store IRCTC passwords. Click Continue to sign in securely on the official government website.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowIrctcLoginModal(false)}
                    className="w-full py-2.5 rounded-lg border border-[#E3DED2] dark:border-[#2A403A] hover:bg-[#EEF2ED] dark:hover:bg-[#213530] text-xs font-bold text-[#66736F] dark:text-[#A3B0AB] transition-all cursor-pointer text-center"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      window.open('https://www.irctc.co.in/nget/train-search', '_blank');
                      setShowIrctcLoginModal(false);
                    }}
                    className="w-full py-2.5 rounded-lg bg-[#173F3A] hover:bg-[#0F332F] dark:bg-[#EEF2ED] dark:hover:bg-[#FFFFFF] dark:text-[#173F3A] text-white text-xs font-bold transition-all cursor-pointer text-center"
                  >
                    Continue
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setShowIrctcLoginModal(false)}
                  className="absolute top-2 right-4 text-[#66736F] dark:text-[#A3B0AB] hover:text-[#263238] dark:hover:text-[#F7F5EF] text-lg font-bold w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#EEF2ED] dark:hover:bg-[#213530] transition-all cursor-pointer"
                >✕</button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
