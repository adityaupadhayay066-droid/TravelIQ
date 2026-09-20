import React, { useEffect, useState } from 'react';
import { ShieldCheck, Activity, Users, Database } from 'lucide-react';
import { api } from '../utils/api';
import toast from 'react-hot-toast';

export default function AdminAuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const { data } = await api.get('/admin/audit-logs');
      setLogs(data);
    } catch (err) {
      toast.error('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F5EF] dark:bg-[#12201D] pt-24 flex justify-center">
        <div className="w-8 h-8 border-4 border-[#173F3A] dark:border-[#EEF2ED] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F5EF] dark:bg-[#12201D] pt-24 px-4 pb-12 font-inter">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#263238] dark:text-[#F7F5EF] flex items-center gap-3 font-manrope">
              <ShieldCheck className="w-8 h-8 text-[#173F3A] dark:text-[#EEF2ED]" />
              System Audit Logs
            </h1>
            <p className="text-[#66736F] dark:text-[#A3B0AB] mt-2">Comprehensive audit trail of all administrative actions.</p>
          </div>
        </div>

        <div className="travel-card bg-[#FFFFFF] dark:bg-[#1B2C28] rounded-xl border border-[#E3DED2] dark:border-[#2A403A] shadow-sm overflow-hidden text-[#263238] dark:text-[#F7F5EF]">
          <div className="overflow-x-auto">
            <table className="travel-table w-full text-left text-sm text-[#66736F] dark:text-[#A3B0AB]">
              <thead className="bg-[#EEF2ED] dark:bg-[#213530] text-[#263238] dark:text-[#F7F5EF] font-semibold uppercase text-xs tracking-wider border-b border-[#E3DED2] dark:border-[#2A403A]">
                <tr>
                  <th className="px-6 py-4">Timestamp</th>
                  <th className="px-6 py-4">Admin</th>
                  <th className="px-6 py-4">Action</th>
                  <th className="px-6 py-4">Target ID</th>
                  <th className="px-6 py-4">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E3DED2] dark:divide-[#2A403A]">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-[#66736F] dark:text-[#A3B0AB]">
                      No audit logs found.
                    </td>
                  </tr>
                ) : (
                  logs.map(log => (
                    <tr key={log.id} className="hover:bg-[#F7F5EF] dark:hover:bg-[#213530] transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-[#263238] dark:text-[#F7F5EF]">{new Date(log.created_at).toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-[#173F3A] dark:text-[#EEF2ED]" />
                          <span className="text-[#263238] dark:text-[#F7F5EF] font-medium">{log.User?.name || 'Unknown Admin'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="travel-badge inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-[#EEF2ED] dark:bg-[#213530] text-[#173F3A] dark:text-[#EEF2ED] border border-[#E3DED2] dark:border-[#2A403A]">
                          <Activity className="w-3.5 h-3.5" />
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-[#66736F] dark:text-[#A3B0AB]">{log.target_id || 'N/A'}</td>
                      <td className="px-6 py-4 text-[#66736F] dark:text-[#A3B0AB]">{log.ip_address}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
