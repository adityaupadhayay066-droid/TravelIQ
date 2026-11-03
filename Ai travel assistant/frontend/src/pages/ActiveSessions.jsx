import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Laptop, Smartphone, Tablet, MapPin, Clock, LogOut, ShieldCheck } from 'lucide-react';
import { api } from '../utils/api';
import toast from 'react-hot-toast';

export default function ActiveSessions() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const res = await api.get('/sessions');
      setSessions(res.data);
    } catch (error) {
      toast.error('Failed to load active sessions');
    } finally {
      setLoading(false);
    }
  };

  const handleTerminate = async (sessionId) => {
    try {
      await api.delete(`/sessions/${sessionId}`);
      toast.success('Session terminated successfully');
      setSessions(sessions.filter(s => s.session_id !== sessionId));
    } catch (error) {
      toast.error('Failed to terminate session');
    }
  };

  const getDeviceIcon = (type) => {
    const iconClass = "w-6 h-6 text-[#244C66] dark:text-[#F0F4F7]";
    switch (type) {
      case 'mobile': return <Smartphone className={iconClass} />;
      case 'tablet': return <Tablet className={iconClass} />;
      default: return <Laptop className={iconClass} />;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-4 border-[#244C66] dark:border-[#F0F4F7] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8 flex items-center gap-3">
        <div className="p-3 bg-[#F0F4F7] dark:bg-[#233240] rounded-xl">
          <ShieldCheck className="w-6 h-6 text-[#244C66] dark:text-[#F0F4F7]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#263238] dark:text-[#F7F8FA] font-['Manrope']">Active Sessions</h1>
          <p className="text-[#66736F] dark:text-[#A3B0AB] text-sm mt-1">
            Manage your signed-in devices. Log out of unrecognized sessions immediately.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {sessions.map((session, i) => (
          <motion.div 
            key={session.session_id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`p-5 rounded-xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all ${
              session.isCurrent 
                ? 'bg-[#F0F4F7] border-[#244C66] dark:bg-[#233240] dark:border-[#F0F4F7]' 
                : 'bg-[#FFFFFF] border-[#E3E7EA] dark:bg-[#1B242E] dark:border-[#293644] shadow-sm'
            }`}
          >
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-[#F7F8FA] dark:bg-[#121921]">
                {getDeviceIcon(session.device_type)}
              </div>
              <div>
                <h3 className="font-bold text-[#263238] dark:text-[#F7F8FA] flex items-center gap-2 font-['Manrope']">
                  {session.device_name || 'Unknown Device'}
                  {session.isCurrent && (
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-[#244C66] text-[#F7F8FA] dark:bg-[#F0F4F7] dark:text-[#121921] px-2 py-0.5 rounded-full">
                      Current
                    </span>
                  )}
                </h3>
                <div className="text-sm text-[#66736F] dark:text-[#A3B0AB] flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-1">
                  <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {session.login_location}</span>
                  <span className="hidden sm:inline">•</span>
                  <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {new Date(session.last_active).toLocaleString()}</span>
                </div>
                <div className="text-xs text-[#66736F]/70 dark:text-[#A3B0AB]/70 mt-1">
                  {session.browser} on {session.os} &middot; {session.ip_address}
                </div>
              </div>
            </div>

            {!session.isCurrent && (
              <button
                onClick={() => handleTerminate(session.session_id)}
                className="w-full md:w-auto px-4 py-2 flex items-center justify-center gap-2 text-sm font-semibold text-[#B94A48] border border-[#B94A48] hover:bg-[#B94A48] hover:text-[#FFFFFF] rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Log out
              </button>
            )}
          </motion.div>
        ))}
        {sessions.length === 0 && (
          <p className="text-center text-[#66736F] dark:text-[#A3B0AB] py-10">No active sessions found.</p>
        )}
      </div>
    </div>
  );
}
