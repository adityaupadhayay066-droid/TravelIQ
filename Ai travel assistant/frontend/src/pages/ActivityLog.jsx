import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, LogIn, LogOut, Key, Monitor, Calendar, XCircle } from 'lucide-react';
import { api } from '../utils/api';
import toast from 'react-hot-toast';

export default function ActivityLog() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const res = await api.get('/activity?limit=50');
      setLogs(res.data);
    } catch (error) {
      toast.error('Failed to load activity logs');
    } finally {
      setLoading(false);
    }
  };

  const getEventIcon = (type) => {
    switch (type) {
      case 'LOGIN_SUCCESS': return <LogIn className="w-5 h-5 text-[#4F7D62]" />;
      case 'FAILED_LOGIN': 
      case 'FAILED_LOGIN_LOCKED': return <XCircle className="w-5 h-5 text-[#B94A48]" />;
      case 'LOGOUT': return <LogOut className="w-5 h-5 text-[#66736F] dark:text-[#A3B0AB]" />;
      case 'PASSWORD_CHANGE': return <Key className="w-5 h-5 text-[#D96C4F]" />;
      case 'SESSION_TERMINATED': return <Monitor className="w-5 h-5 text-[#E5B85C]" />;
      default: return <ShieldAlert className="w-5 h-5 text-[#173F3A] dark:text-[#EEF2ED]" />;
    }
  };

  const getEventLabel = (type) => {
    const map = {
      'LOGIN_SUCCESS': 'Successful Sign-in',
      'FAILED_LOGIN': 'Failed Sign-in Attempt',
      'FAILED_LOGIN_LOCKED': 'Account Temporarily Locked',
      'LOGOUT': 'Signed Out',
      'PASSWORD_CHANGE': 'Password Changed',
      'SESSION_TERMINATED': 'Session Remotely Terminated'
    };
    return map[type] || type;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-4 border-[#173F3A] dark:border-[#EEF2ED] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 font-inter text-[#263238] dark:text-[#F7F5EF]">
      <div className="mb-8 flex items-center gap-3">
        <div className="p-3 bg-[#EEF2ED] dark:bg-[#213530] rounded-xl">
          <ShieldAlert className="w-6 h-6 text-[#173F3A] dark:text-[#EEF2ED]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold font-manrope text-[#263238] dark:text-[#F7F5EF]">Security Audit Log</h1>
          <p className="text-[#66736F] dark:text-[#A3B0AB] text-sm mt-1">
            Review recent security events and account activity. If you notice anything suspicious, change your password immediately.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {logs.map((log, i) => (
          <motion.div 
            key={log.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="travel-card p-5 rounded-xl border bg-[#FFFFFF] dark:bg-[#1B2C28] border-[#E3DED2] dark:border-[#2A403A] shadow-sm hover:shadow-[0_4px_16px_rgba(23,63,58,0.06)] transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
          >
            <div className="flex items-start gap-4">
              <div className="p-2.5 bg-[#EEF2ED] dark:bg-[#213530] rounded-lg shrink-0 mt-1">
                {getEventIcon(log.event_type)}
              </div>
              <div>
                <h3 className="font-semibold font-manrope text-[#263238] dark:text-[#F7F5EF]">
                  {getEventLabel(log.event_type)}
                </h3>
                <div className="text-sm text-[#66736F] dark:text-[#A3B0AB] mt-1 space-y-1">
                  {log.location && <p>Location: {log.location}</p>}
                  {log.ip_address && <p>IP Address: <span className="font-mono text-xs">{log.ip_address}</span></p>}
                  {log.device_info && <p className="text-xs">Device: {log.device_info}</p>}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm font-medium text-[#66736F] dark:text-[#A3B0AB] shrink-0 md:text-right">
              <Calendar className="w-4 h-4" />
              {new Date(log.created_at).toLocaleString()}
            </div>
          </motion.div>
        ))}
        
        {logs.length === 0 && (
          <p className="text-center text-[#66736F] dark:text-[#A3B0AB] py-10">No recent activity found.</p>
        )}
      </div>
    </div>
  );
}
