import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, Sun, Moon, Monitor, Shield, Trash2, Pause, AlertTriangle, Loader2, ChevronRight, LogOut, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { api, getBackendBaseURL } from '../utils/api';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const API_BASE = getBackendBaseURL();

function SectionCard({ title, icon: Icon, children, delay = 0 }) {
  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
      className="bg-[#FFFFFF] dark:bg-[#1B2C28] border border-[#E3DED2] dark:border-[#2A403A] p-6 space-y-4 rounded-xl shadow-sm">
      <h3 className="text-[#263238] dark:text-[#F7F5EF] font-semibold flex items-center gap-2 text-sm">
        <Icon className="w-4 h-4 text-[#173F3A] dark:text-[#EEF2ED]" /> {title}
      </h3>
      {children}
    </motion.div>
  );
}

function ThemeOption({ icon: Icon, label, value, active, onClick }) {
  return (
    <button onClick={onClick}
      className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
        active 
          ? 'border-[#173F3A] dark:border-[#EEF2ED] bg-[#EEF2ED] dark:bg-[#213530]' 
          : 'border-[#E3DED2] dark:border-[#2A403A] bg-[#F7F5EF] dark:bg-[#12201D] hover:border-[#263238] dark:hover:border-[#A3B0AB]'
      }`}>
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
        active 
          ? 'bg-[#173F3A] text-white dark:bg-[#EEF2ED] dark:text-[#173F3A]' 
          : 'bg-[#FFFFFF] dark:bg-[#1B2C28] text-[#66736F] dark:text-[#A3B0AB] border border-[#E3DED2] dark:border-[#2A403A]'
      }`}>
        <Icon className="w-5 h-5" />
      </div>
      <span className={`text-xs font-medium ${active ? 'text-[#173F3A] dark:text-[#EEF2ED]' : 'text-[#66736F] dark:text-[#A3B0AB]'}`}>{label}</span>
    </button>
  );
}

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();

  // Password change
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [changingPw, setChangingPw] = useState(false);

  // Danger zone
  const [showDeactivate, setShowDeactivate] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [dangerPassword, setDangerPassword] = useState('');
  const [processing, setProcessing] = useState(false);

  const handlePasswordChange = async () => {
    if (!passwords.current || !passwords.new) return toast.error('Fill in all fields');
    if (passwords.new.length < 6) return toast.error('Password must be at least 6 characters');
    if (passwords.new !== passwords.confirm) return toast.error('Passwords do not match');

    setChangingPw(true);
    try {
      await api.put('/profile/password', { currentPassword: passwords.current, newPassword: passwords.new });
      toast.success('Password changed successfully');
      setPasswords({ current: '', new: '', confirm: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    }
    setChangingPw(false);
  };

  const handleDeactivate = async () => {
    if (!dangerPassword) return toast.error('Enter your password');
    setProcessing(true);
    try {
      await api.post('/profile/deactivate', { password: dangerPassword });
      toast.success('Account deactivated');
      logout();
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to deactivate');
    }
    setProcessing(false);
  };

  const handleDelete = async () => {
    if (!dangerPassword) return toast.error('Enter your password');
    setProcessing(true);
    try {
      await api.delete('/profile', { data: { password: dangerPassword } });
      toast.success('Account permanently deleted');
      logout();
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete account');
    }
    setProcessing(false);
  };

  const getAvatarUrl = (img) => {
    if (!img) return '';
    if (img.startsWith('http://') || img.startsWith('https://')) return img;
    return `${API_BASE}${img}`;
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#F7F5EF] dark:bg-[#12201D]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl overflow-hidden border border-[#E3DED2] dark:border-[#2A403A] flex-shrink-0 bg-[#FFFFFF] dark:bg-[#1B2C28]">
            {user?.profile_image ? (
              <img src={getAvatarUrl(user.profile_image)} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-[#EEF2ED] dark:bg-[#213530] flex items-center justify-center">
                <User className="w-6 h-6 text-[#173F3A] dark:text-[#EEF2ED]" />
              </div>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#263238] dark:text-[#F7F5EF] font-manrope">Settings</h1>
            <p className="text-[#66736F] dark:text-[#A3B0AB] text-sm mt-0.5 font-inter">Manage your account preferences and security</p>
          </div>
        </motion.div>

        {/* Theme */}
        <SectionCard title="Appearance" icon={Sun} delay={0.1}>
          <p className="text-[#66736F] dark:text-[#A3B0AB] text-xs font-inter">Choose your preferred theme</p>
          <div className="flex gap-3">
            <ThemeOption icon={Moon} label="Dark" value="dark" active={theme === 'dark'} onClick={() => setTheme('dark')} />
            <ThemeOption icon={Sun} label="Light" value="light" active={theme === 'light'} onClick={() => setTheme('light')} />
            <ThemeOption icon={Monitor} label="System" value="system" active={theme === 'system'} onClick={() => setTheme('system')} />
          </div>
        </SectionCard>

        {/* Password */}
        <SectionCard title="Change Password" icon={Lock} delay={0.15}>
          <div className="space-y-3 font-inter">
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#66736F] dark:text-[#A3B0AB]" />
              <input type={showCurrent ? 'text' : 'password'} placeholder="Current password" value={passwords.current}
                onChange={e => setPasswords({ ...passwords, current: e.target.value })}
                className="w-full bg-[#F7F5EF] dark:bg-[#12201D] border border-[#E3DED2] dark:border-[#2A403A] rounded-lg py-2.5 pl-10 pr-10 text-[#263238] dark:text-[#F7F5EF] text-sm placeholder-[#66736F] dark:placeholder-[#A3B0AB] focus:outline-none focus:border-[#173F3A] dark:focus:border-[#EEF2ED] transition-all" />
              <button onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#66736F] hover:text-[#263238] dark:text-[#A3B0AB] dark:hover:text-[#F7F5EF]">
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#66736F] dark:text-[#A3B0AB]" />
              <input type={showNew ? 'text' : 'password'} placeholder="New password" value={passwords.new}
                onChange={e => setPasswords({ ...passwords, new: e.target.value })}
                className="w-full bg-[#F7F5EF] dark:bg-[#12201D] border border-[#E3DED2] dark:border-[#2A403A] rounded-lg py-2.5 pl-10 pr-10 text-[#263238] dark:text-[#F7F5EF] text-sm placeholder-[#66736F] dark:placeholder-[#A3B0AB] focus:outline-none focus:border-[#173F3A] dark:focus:border-[#EEF2ED] transition-all" />
              <button onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#66736F] hover:text-[#263238] dark:text-[#A3B0AB] dark:hover:text-[#F7F5EF]">
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#66736F] dark:text-[#A3B0AB]" />
              <input type="password" placeholder="Confirm new password" value={passwords.confirm}
                onChange={e => setPasswords({ ...passwords, confirm: e.target.value })}
                className="w-full bg-[#F7F5EF] dark:bg-[#12201D] border border-[#E3DED2] dark:border-[#2A403A] rounded-lg py-2.5 pl-10 pr-4 text-[#263238] dark:text-[#F7F5EF] text-sm placeholder-[#66736F] dark:placeholder-[#A3B0AB] focus:outline-none focus:border-[#173F3A] dark:focus:border-[#EEF2ED] transition-all" />
            </div>
            <button onClick={handlePasswordChange} disabled={changingPw}
              className="flex items-center gap-2 bg-[#173F3A] text-white dark:bg-[#EEF2ED] dark:text-[#173F3A] px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#0F332F] dark:hover:bg-[#FFFFFF] transition-all disabled:opacity-50">
              {changingPw ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
              Update Password
            </button>
          </div>
        </SectionCard>

        {/* Danger Zone */}
        <SectionCard title="Danger Zone" icon={AlertTriangle} delay={0.2}>
          <div className="space-y-3 font-inter">
            {/* Deactivate */}
            <div className="flex items-center justify-between p-3 rounded-lg border border-[#D96C4F]/30 bg-[#D96C4F]/5 dark:bg-[#D96C4F]/10">
              <div>
                <p className="text-[#263238] dark:text-[#F7F5EF] text-sm font-medium">Deactivate Account</p>
                <p className="text-[#66736F] dark:text-[#A3B0AB] text-xs">Temporarily disable your account. You can reactivate by logging in.</p>
              </div>
              <button onClick={() => { setShowDeactivate(!showDeactivate); setShowDelete(false); setDangerPassword(''); }}
                className="text-[#D96C4F] border border-[#D96C4F]/30 hover:bg-[#D96C4F]/10 px-3 py-1.5 rounded-lg text-xs font-medium transition-all bg-[#FFFFFF] dark:bg-[#1B2C28]">
                <Pause className="w-3.5 h-3.5 inline mr-1" /> Deactivate
              </button>
            </div>

            {showDeactivate && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                className="p-4 rounded-lg border border-[#D96C4F]/30 bg-[#D96C4F]/5 dark:bg-[#D96C4F]/10 space-y-3">
                <p className="text-[#D96C4F] text-xs font-medium">Enter your password to deactivate:</p>
                <input type="password" placeholder="Your password" value={dangerPassword}
                  onChange={e => setDangerPassword(e.target.value)}
                  className="w-full bg-[#FFFFFF] dark:bg-[#12201D] border border-[#E3DED2] dark:border-[#2A403A] rounded-lg py-2 px-3 text-[#263238] dark:text-[#F7F5EF] text-sm placeholder-[#66736F] dark:placeholder-[#A3B0AB] focus:outline-none focus:border-[#D96C4F] transition-all" />
                <button onClick={handleDeactivate} disabled={processing}
                  className="flex items-center gap-2 bg-[#D96C4F] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#C75D43] transition-all disabled:opacity-50">
                  {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Pause className="w-4 h-4" />} Confirm Deactivation
                </button>
              </motion.div>
            )}

            {/* Delete */}
            <div className="flex items-center justify-between p-3 rounded-lg border border-[#B94A48]/30 bg-[#B94A48]/5 dark:bg-[#B94A48]/10">
              <div>
                <p className="text-[#263238] dark:text-[#F7F5EF] text-sm font-medium">Delete Account</p>
                <p className="text-[#66736F] dark:text-[#A3B0AB] text-xs">Permanently delete your account and all data. This cannot be undone.</p>
              </div>
              <button onClick={() => { setShowDelete(!showDelete); setShowDeactivate(false); setDangerPassword(''); }}
                className="text-[#B94A48] border border-[#B94A48]/30 hover:bg-[#B94A48]/10 px-3 py-1.5 rounded-lg text-xs font-medium transition-all bg-[#FFFFFF] dark:bg-[#1B2C28]">
                <Trash2 className="w-3.5 h-3.5 inline mr-1" /> Delete
              </button>
            </div>

            {showDelete && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                className="p-4 rounded-lg border border-[#B94A48]/30 bg-[#B94A48]/5 dark:bg-[#B94A48]/10 space-y-3">
                <div className="flex items-start gap-2 text-[#B94A48] text-xs font-medium">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>This will permanently delete your account, all trips, bookings, and analytics. This action is irreversible.</span>
                </div>
                <input type="password" placeholder="Enter your password to confirm" value={dangerPassword}
                  onChange={e => setDangerPassword(e.target.value)}
                  className="w-full bg-[#FFFFFF] dark:bg-[#12201D] border border-[#E3DED2] dark:border-[#2A403A] rounded-lg py-2 px-3 text-[#263238] dark:text-[#F7F5EF] text-sm placeholder-[#66736F] dark:placeholder-[#A3B0AB] focus:outline-none focus:border-[#B94A48] transition-all" />
                <button onClick={handleDelete} disabled={processing}
                  className="flex items-center gap-2 bg-[#B94A48] text-white px-4 py-2 rounded-lg text-sm font-medium hover:brightness-110 transition-all disabled:opacity-50">
                  {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />} Permanently Delete Account
                </button>
              </motion.div>
            )}
          </div>
        </SectionCard>

        {/* Sign Out */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <button onClick={() => { logout(); navigate('/'); }}
            className="w-full bg-[#FFFFFF] dark:bg-[#1B2C28] border border-[#E3DED2] dark:border-[#2A403A] rounded-xl p-4 flex items-center justify-between hover:border-[#B94A48]/50 transition-colors group text-left shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#B94A48]/10 flex items-center justify-center">
                <LogOut className="w-4 h-4 text-[#B94A48]" />
              </div>
              <div>
                <p className="text-[#B94A48] text-sm font-medium font-inter">Sign Out</p>
                <p className="text-[#66736F] dark:text-[#A3B0AB] text-xs font-inter">Log out of your account</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#66736F] dark:text-[#A3B0AB] group-hover:text-[#B94A48] group-hover:translate-x-1 transition-all" />
          </button>
        </motion.div>

      </div>
    </div>
  );
}
