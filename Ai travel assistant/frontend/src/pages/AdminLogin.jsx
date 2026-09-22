import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, ShieldCheck, Lock, Mail, LogIn, ArrowRight, KeyRound } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import toast from 'react-hot-toast';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 2FA state variables
  const [twoFactorRequired, setTwoFactorRequired] = useState(false);
  const [twoFactorData, setTwoFactorData] = useState(null); // { userId, email }
  const [otpCode, setOtpCode] = useState('');

  const { adminLogin, completeLogin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const result = await adminLogin(email, password);
    setIsSubmitting(false);

    if (result.status === 'SUCCESS') {
      navigate('/admin/dashboard', { replace: true });
    } else if (result.status === '2FA_REQUIRED') {
      setTwoFactorRequired(true);
      setTwoFactorData(result);
      toast.success('Admin OTP dispatched to your registered address.');
    }
  };

  const handleVerifyAdmin2FA = async (e) => {
    e.preventDefault();
    if (!otpCode) return toast.error('Please enter the OTP verification code.');

    setIsSubmitting(true);
    try {
      const { data: userData } = await api.post('/auth/admin/verify-2fa', {
        userId: twoFactorData.userId,
        otpCode: otpCode.trim()
      });

      completeLogin(userData);
      navigate('/admin/dashboard', { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid or expired OTP code.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F5EF] dark:bg-[#12201D] flex flex-col justify-center items-center relative px-4 font-[Inter]">
      <AnimatePresence mode="wait">
        {!twoFactorRequired ? (
          /* STANDARD ADMIN SIGN IN */
          <motion.div
            key="admin-login-form"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-md p-8 relative z-10 bg-[#FFFFFF] dark:bg-[#1B2C28] border border-[#E3DED2] dark:border-[#2A403A] rounded-xl shadow-[0_4px_16px_rgba(23,63,58,0.06)]"
          >
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center p-3 rounded-lg bg-[#EEF2ED] dark:bg-[#213530] border border-[#E3DED2] dark:border-[#2A403A] mb-4">
                <ShieldAlert className="w-8 h-8 text-[#173F3A] dark:text-[#EEF2ED]" />
              </div>
              
              <h2 className="text-2xl font-bold text-[#263238] dark:text-[#F7F5EF] mb-2 font-[Manrope]">
                TravelIQ Command Center
              </h2>
              <p className="text-[#66736F] dark:text-[#A3B0AB] text-sm">Authorized administrative personnel only</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#66736F] dark:text-[#A3B0AB] w-5 h-5" />
                  <input
                    id="admin-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Admin Email"
                    className="w-full bg-[#FFFFFF] dark:bg-[#1B2C28] border border-[#E3DED2] dark:border-[#2A403A] rounded-lg py-3.5 pl-12 pr-4 text-[#263238] dark:text-[#F7F5EF] placeholder-[#66736F] dark:placeholder-[#A3B0AB] focus:outline-none focus:border-[#173F3A] dark:focus:border-[#EEF2ED] transition-colors font-medium text-sm"
                  />
                </div>

                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#66736F] dark:text-[#A3B0AB] w-5 h-5" />
                  <input
                    id="admin-password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Access Password"
                    className="w-full bg-[#FFFFFF] dark:bg-[#1B2C28] border border-[#E3DED2] dark:border-[#2A403A] rounded-lg py-3.5 pl-12 pr-4 text-[#263238] dark:text-[#F7F5EF] placeholder-[#66736F] dark:placeholder-[#A3B0AB] focus:outline-none focus:border-[#173F3A] dark:focus:border-[#EEF2ED] transition-colors font-medium text-sm"
                  />
                </div>
              </div>

              {/* Security notice */}
              <div className="bg-[#EEF2ED] dark:bg-[#213530] border border-[#E3DED2] dark:border-[#2A403A] rounded-lg p-3 flex items-start gap-2.5">
                <ShieldAlert className="w-4 h-4 text-[#173F3A] dark:text-[#EEF2ED] flex-shrink-0 mt-0.5" />
                <p className="text-[11px] text-[#66736F] dark:text-[#A3B0AB] leading-relaxed font-medium">
                  Direct access mode enabled. All administrative actions are securely logged and monitored.
                </p>
              </div>

              <button
                id="admin-login-submit"
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#D96C4F] hover:bg-[#C75D43] text-[#FFFFFF] rounded-lg px-8 py-3.5 font-bold flex items-center justify-center transition-colors disabled:opacity-70 disabled:cursor-not-allowed group text-sm"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Authenticating...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Access Panel <LogIn className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                )}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-[#E3DED2] dark:border-[#2A403A] text-center space-y-3">
              <p className="text-[#66736F] dark:text-[#A3B0AB] text-xs">
                Need an administrator account?{' '}
                <Link to="/admin/signup" className="text-[#D96C4F] hover:text-[#C75D43] transition-colors font-semibold">
                  Register as Admin <ArrowRight className="w-3.5 h-3.5 inline" />
                </Link>
              </p>
              <div>
                <Link to="/login" className="text-[#66736F] dark:text-[#A3B0AB] hover:text-[#263238] dark:hover:text-[#F7F5EF] transition-colors text-xs font-semibold inline-flex items-center gap-1.5 group">
                  Back to User Portal <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          </motion.div>
        ) : (
          /* ADMIN TWO-FACTOR VERIFICATION OVERLAY */
          <motion.div
            key="admin-2fa-form"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-md p-8 relative z-10 bg-[#FFFFFF] dark:bg-[#1B2C28] border border-[#E3DED2] dark:border-[#2A403A] rounded-xl shadow-[0_4px_16px_rgba(23,63,58,0.06)]"
          >
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center p-3.5 bg-[#EEF2ED] dark:bg-[#213530] rounded-lg mb-4 border border-[#E3DED2] dark:border-[#2A403A] text-[#173F3A] dark:text-[#EEF2ED]">
                <KeyRound className="w-7 h-7" />
              </div>
              <h2 className="text-2xl font-bold text-[#263238] dark:text-[#F7F5EF] mb-2 font-[Manrope]">Admin Security OTP</h2>
              <p className="text-[#66736F] dark:text-[#A3B0AB] text-xs leading-relaxed px-4">
                Please enter the 6-digit administrative verification code sent to: <span className="text-[#173F3A] dark:text-[#EEF2ED] font-semibold">{twoFactorData.email}</span>
              </p>
            </div>

            <form onSubmit={handleVerifyAdmin2FA} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-[#66736F] dark:text-[#A3B0AB] uppercase tracking-wider mb-2 text-center">
                  Verification OTP Code
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder="000000"
                  className="w-full bg-[#FFFFFF] dark:bg-[#1B2C28] border border-[#E3DED2] dark:border-[#2A403A] rounded-lg py-3.5 text-center text-xl font-bold font-mono text-[#263238] dark:text-[#F7F5EF] placeholder-[#66736F] dark:placeholder-[#A3B0AB] tracking-[0.25em] focus:outline-none focus:border-[#173F3A] dark:focus:border-[#EEF2ED] transition-colors"
                />
              </div>

              <div className="space-y-3 pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[#D96C4F] hover:bg-[#C75D43] text-[#FFFFFF] rounded-lg py-3.5 font-bold flex items-center justify-center transition-colors disabled:opacity-75 disabled:cursor-not-allowed text-xs"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Authorizing...
                    </span>
                  ) : (
                    "Authorize Session"
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setTwoFactorRequired(false);
                    setOtpCode('');
                  }}
                  className="w-full text-[#66736F] dark:text-[#A3B0AB] hover:text-[#263238] dark:hover:text-[#F7F5EF] text-xs font-semibold py-2 transition-colors block text-center"
                >
                  Cancel and Sign In again
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
