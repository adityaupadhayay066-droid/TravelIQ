import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Lock, Mail, User, Key, LogIn, ArrowRight, ShieldAlert } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function AdminSignup() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    adminSecret: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { adminRegister } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      return toast.error('Passwords do not match.');
    }
    if (formData.password.length < 6) {
      return toast.error('Password must be at least 6 characters.');
    }
    if (!formData.adminSecret.trim()) {
      return toast.error('Please enter the Admin Security Key.');
    }

    setIsSubmitting(true);
    const result = await adminRegister(
      formData.name,
      formData.email,
      formData.password,
      formData.adminSecret
    );
    setIsSubmitting(false);

    if (result.status === 'SUCCESS') {
      navigate('/admin/dashboard', { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F5EF] dark:bg-[#12201D] flex flex-col justify-center items-center relative overflow-hidden px-4 py-12 font-sans transition-colors duration-300">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md p-8 relative z-10 bg-[#FFFFFF] dark:bg-[#1B2C28] border border-[#E3DED2] dark:border-[#2A403A] rounded-xl shadow-[0_4px_16px_rgba(23,63,58,0.06)]"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 rounded-xl bg-[#EEF2ED] dark:bg-[#213530] border border-[#E3DED2] dark:border-[#2A403A] mb-4">
            <ShieldCheck className="w-8 h-8 text-[#173F3A] dark:text-[#EEF2ED]" />
          </div>
          
          <h2 className="text-2xl font-bold text-[#263238] dark:text-[#F7F5EF] mb-2 font-heading">
            Create Admin Account
          </h2>
          <p className="text-[#66736F] dark:text-[#A3B0AB] text-sm">Register new administrative personnel</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#66736F] dark:text-[#A3B0AB] w-5 h-5" />
            <input
              id="admin-signup-name"
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              placeholder="Full Name"
              className="w-full bg-[#FFFFFF] dark:bg-[#1B2C28] border border-[#E3DED2] dark:border-[#2A403A] rounded-lg py-3 pl-12 pr-4 text-[#263238] dark:text-[#F7F5EF] placeholder-[#66736F] dark:placeholder-[#A3B0AB] focus:outline-none focus:border-[#173F3A] dark:focus:border-[#EEF2ED] focus:ring-1 focus:ring-[#173F3A] dark:focus:ring-[#EEF2ED] transition-all font-medium text-sm"
            />
          </div>

          <div className="relative">
            <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#66736F] dark:text-[#A3B0AB] w-5 h-5" />
            <input
              id="admin-signup-email"
              type="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              placeholder="Official Admin Email"
              className="w-full bg-[#FFFFFF] dark:bg-[#1B2C28] border border-[#E3DED2] dark:border-[#2A403A] rounded-lg py-3 pl-12 pr-4 text-[#263238] dark:text-[#F7F5EF] placeholder-[#66736F] dark:placeholder-[#A3B0AB] focus:outline-none focus:border-[#173F3A] dark:focus:border-[#EEF2ED] focus:ring-1 focus:ring-[#173F3A] dark:focus:ring-[#EEF2ED] transition-all font-medium text-sm"
            />
          </div>

          <div className="relative">
            <Key className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#D96C4F] w-5 h-5" />
            <input
              id="admin-signup-secret"
              type="password"
              name="adminSecret"
              required
              value={formData.adminSecret}
              onChange={handleChange}
              placeholder="Admin Security Passcode"
              className="w-full bg-[#FFFFFF] dark:bg-[#1B2C28] border border-[#E3DED2] dark:border-[#2A403A] rounded-lg py-3 pl-12 pr-4 text-[#263238] dark:text-[#F7F5EF] placeholder-[#66736F] dark:placeholder-[#A3B0AB] focus:outline-none focus:border-[#D96C4F] focus:ring-1 focus:ring-[#D96C4F] transition-all font-medium text-sm"
            />
          </div>
          <p className="text-[11px] text-[#66736F] dark:text-[#A3B0AB] pl-1 -mt-2">
            🔑 Security passcode required (Default: <code className="text-[#173F3A] dark:text-[#EEF2ED] font-semibold">ADMIN2026</code>)
          </p>

          <div className="relative">
            <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#66736F] dark:text-[#A3B0AB] w-5 h-5" />
            <input
              id="admin-signup-password"
              type="password"
              name="password"
              required
              minLength={6}
              value={formData.password}
              onChange={handleChange}
              placeholder="Access Password (min 6 chars)"
              className="w-full bg-[#FFFFFF] dark:bg-[#1B2C28] border border-[#E3DED2] dark:border-[#2A403A] rounded-lg py-3 pl-12 pr-4 text-[#263238] dark:text-[#F7F5EF] placeholder-[#66736F] dark:placeholder-[#A3B0AB] focus:outline-none focus:border-[#173F3A] dark:focus:border-[#EEF2ED] focus:ring-1 focus:ring-[#173F3A] dark:focus:ring-[#EEF2ED] transition-all font-medium text-sm"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#66736F] dark:text-[#A3B0AB] w-5 h-5" />
            <input
              id="admin-signup-confirm-password"
              type="password"
              name="confirmPassword"
              required
              minLength={6}
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm Access Password"
              className="w-full bg-[#FFFFFF] dark:bg-[#1B2C28] border border-[#E3DED2] dark:border-[#2A403A] rounded-lg py-3 pl-12 pr-4 text-[#263238] dark:text-[#F7F5EF] placeholder-[#66736F] dark:placeholder-[#A3B0AB] focus:outline-none focus:border-[#173F3A] dark:focus:border-[#EEF2ED] focus:ring-1 focus:ring-[#173F3A] dark:focus:ring-[#EEF2ED] transition-all font-medium text-sm"
            />
          </div>

          {/* Security notice */}
          <div className="bg-[#EEF2ED] dark:bg-[#213530] border border-[#E3DED2] dark:border-[#2A403A] rounded-lg p-3 flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-[#173F3A] dark:text-[#EEF2ED] flex-shrink-0 mt-0.5" />
            <p className="text-[11px] text-[#66736F] dark:text-[#A3B0AB] leading-relaxed font-medium">
              Administrative registration requires system key authorization. Single active session security is automatically enforced upon signup.
            </p>
          </div>

          <button
            id="admin-signup-submit"
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-2 bg-[#173F3A] hover:bg-[#0F332F] dark:bg-[#EEF2ED] dark:hover:bg-[#FFFFFF] text-white dark:text-[#173F3A] rounded-lg px-8 py-3.5 font-semibold flex items-center justify-center transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed group text-sm"
          >
            {isSubmitting ? (
               <span className="flex items-center gap-2">
                 <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                 Registering Admin...
               </span>
            ) : (
              <span className="flex items-center gap-2">
                Create Admin Account <LogIn className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </span>
            )}
          </button>
        </form>

        <div className="mt-6 space-y-3 pt-6 border-t border-[#E3DED2] dark:border-[#2A403A] text-center">
          <p className="text-[#66736F] dark:text-[#A3B0AB] text-xs">
            Already registered as Admin?{' '}
            <Link to="/admin/login" className="text-[#173F3A] dark:text-[#EEF2ED] hover:text-[#0F332F] dark:hover:text-[#FFFFFF] transition-colors font-semibold">
              Sign In to Command Center <ArrowRight className="w-3.5 h-3.5 inline" />
            </Link>
          </p>
          <div>
            <Link to="/login" className="text-[#66736F] dark:text-[#A3B0AB] hover:text-[#263238] dark:hover:text-[#F7F5EF] transition-colors text-xs font-semibold inline-flex items-center gap-1.5 group">
              Switch to Traveler Portal <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
