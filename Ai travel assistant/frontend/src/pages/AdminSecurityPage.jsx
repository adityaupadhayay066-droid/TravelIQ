import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ShieldAlert, ShieldCheck, Lock, Laptop, Globe, Clock, 
  AlertTriangle, Key, Trash2, Fingerprint, RefreshCw, 
  CheckCircle2, ArrowLeft, Shield
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../utils/api';
import toast from 'react-hot-toast';
import { startRegistration } from '@simplewebauthn/browser';

export default function AdminSecurityPage() {
  const [loading, setLoading] = useState(true);
  
  // Personal admin security options
  const [personal2FA, setPersonal2FA] = useState(false);
  const [personalPasskey, setPersonalPasskey] = useState(false);
  const [registeringPasskey, setRegisteringPasskey] = useState(false);

  // System settings
  const [enforceStrongPassword, setEnforceStrongPassword] = useState(false);
  const [updatingSystem, setUpdatingSystem] = useState(false);

  // System-wide lists
  const [activeSessions, setActiveSessions] = useState([]);
  const [loginHistory, setLoginHistory] = useState([]);
  const [securityAlerts, setSecurityAlerts] = useState([]);
  const [revokingId, setRevokingId] = useState(null);

  const fetchSecurityData = async () => {
    try {
      const [personalSettingsRes, systemSettingsRes, sessionsRes, historyRes, alertsRes] = await Promise.all([
        api.get('/security/settings'),
        api.get('/admin/security/settings'),
        api.get('/admin/sessions'),
        api.get('/admin/login-history'),
        api.get('/admin/security-alerts')
      ]);

      // Personal admin settings
      if (personalSettingsRes.data) {
        setPersonal2FA(personalSettingsRes.data.checklist.two_factor);
        setPersonalPasskey(personalSettingsRes.data.checklist.passkey);
      }

      // System settings
      if (systemSettingsRes.data) {
        setEnforceStrongPassword(systemSettingsRes.data.enforce_strong_password);
      }

      setActiveSessions(sessionsRes.data || []);
      setLoginHistory(historyRes.data || []);
      setSecurityAlerts(alertsRes.data || []);

    } catch (err) {
      console.error(err);
      toast.error('Failed to load admin security parameters.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSecurityData();
  }, []);

  const handleToggleSystemPasswordPolicy = async () => {
    setUpdatingSystem(true);
    const newValue = !enforceStrongPassword;
    try {
      const { data } = await api.post('/admin/security/settings', {
        enforce_strong_password: newValue
      });
      setEnforceStrongPassword(data.settings.enforce_strong_password);
      toast.success(data.message);
    } catch (err) {
      toast.error('Failed to update system-wide password policy.');
    } finally {
      setUpdatingSystem(false);
    }
  };

  const handleTogglePersonal2FA = async () => {
    try {
      const { data } = await api.post('/security/2fa/toggle');
      setPersonal2FA(data.two_factor_enabled);
      toast.success(data.message);
    } catch (err) {
      toast.error('Failed to toggle admin 2FA.');
    }
  };

  const handleRegisterPersonalPasskey = async () => {
    setRegisteringPasskey(true);
    try {
      const { data: challengeRes } = await api.get('/security/passkey/register-challenge');

      const regResponse = await startRegistration({ optionsJSON: challengeRes });

      await api.post('/security/passkey/register-verify', {
        challengeToken: challengeRes.challengeToken,
        response: regResponse
      });

      toast.success('Admin biometrics enrolled!');
      fetchSecurityData();
    } catch (err) {
      console.error(err);
      toast.error('Passkey creation failed.');
    } finally {
      setRegisteringPasskey(false);
    }
  };

  const handleRemovePersonalPasskeys = async () => {
    if (!window.confirm('Remove all registered biometric passkeys for this admin account?')) return;
    try {
      await api.delete('/security/passkey');
      toast.success('All biometric credentials deactivated.');
      fetchSecurityData();
    } catch (err) {
      toast.error('Failed to remove passkeys.');
    }
  };

  const handleRevokeSession = async (sessionId) => {
    setRevokingId(sessionId);
    try {
      await api.delete(`/admin/sessions/${sessionId}`);
      toast.success('Session terminated successfully.');
      fetchSecurityData();
    } catch (err) {
      toast.error('Failed to revoke session.');
    } finally {
      setRevokingId(null);
    }
  };

  const handleResolveAlert = async (alertId) => {
    try {
      await api.put(`/admin/security-alerts/${alertId}/resolve`);
      toast.success('Alert marked as resolved.');
      fetchSecurityData();
    } catch (err) {
      toast.error('Failed to resolve alert.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F8FA] dark:bg-[#121921] pt-24 px-4 flex justify-center items-center">
        <div className="w-10 h-10 border-4 border-[#E3E7EA] dark:border-[#293644] border-t-[#244C66] dark:border-t-[#F0F4F7] rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F8FA] dark:bg-[#121921] pt-24 px-4 pb-16 font-sans text-[#263238] dark:text-[#F7F8FA]">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-[#E3E7EA] dark:border-[#293644] pb-6">
          <div>
            <div className="flex items-center gap-3">
              <Link to="/admin/dashboard" className="text-[#66736F] dark:text-[#A3B0AB] hover:text-[#244C66] dark:hover:text-[#FFFFFF] transition-colors">
                <ArrowLeft className="w-6 h-6" />
              </Link>
              <h1 className="text-3xl font-bold font-heading flex items-center gap-3">
                <ShieldAlert className="w-8 h-8 text-[#D96C4F]" />
                Admin Security Center
              </h1>
            </div>
            <p className="text-[#66736F] dark:text-[#A3B0AB] text-sm mt-1.5 pl-9">
              Monitor dynamic platform security threats, enforce strong password policies, and audit session activities.
            </p>
          </div>
          <button 
            onClick={fetchSecurityData} 
            className="btn-ghost flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors border border-[#E3E7EA] dark:border-[#293644] hover:bg-[#F0F4F7] dark:hover:bg-[#233240]"
          >
            <RefreshCw className="w-4 h-4" /> Refresh Portal
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT PANELS: DYNAMIC SECURITY CONTROLS */}
          <div className="space-y-6 lg:col-span-1">
            
            {/* SYSTEM-WIDE POLICIES */}
            <div className="travel-card bg-[#FFFFFF] dark:bg-[#1B242E] p-6 border border-[#E3E7EA] dark:border-[#293644] rounded-xl shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <Shield className="w-5 h-5 text-[#244C66] dark:text-[#F0F4F7]" />
                  Strong Password Policy
                </h3>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={enforceStrongPassword} 
                    onChange={handleToggleSystemPasswordPolicy}
                    disabled={updatingSystem}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-[#E3E7EA] dark:bg-[#293644] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#FFFFFF] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#244C66] dark:peer-checked:bg-[#F0F4F7] border border-[#E3E7EA] dark:border-[#293644]"></div>
                </label>
              </div>
              <p className="text-sm text-[#66736F] dark:text-[#A3B0AB] leading-relaxed">
                Enforces strict criteria for all system users (minimum 8 chars, uppercase, lowercase, numbers, and special symbols) upon account registration and password edits.
              </p>
            </div>

            {/* ADMIN EMAIL OTP (2FA) */}
            <div className="travel-card bg-[#FFFFFF] dark:bg-[#1B242E] p-6 border border-[#E3E7EA] dark:border-[#293644] rounded-xl shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <Lock className="w-5 h-5 text-[#244C66] dark:text-[#F0F4F7]" />
                  Optional Admin Email OTP
                </h3>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={personal2FA} 
                    onChange={handleTogglePersonal2FA}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-[#E3E7EA] dark:bg-[#293644] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#FFFFFF] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#244C66] dark:peer-checked:bg-[#F0F4F7] border border-[#E3E7EA] dark:border-[#293644]"></div>
                </label>
              </div>
              <p className="text-sm text-[#66736F] dark:text-[#A3B0AB] leading-relaxed">
                Optionally toggle email multi-factor authorization codes for your personal administrator account logins.
              </p>
            </div>

            {/* ADMIN BIOMETRICS PASSKEY */}
            <div className="travel-card bg-[#FFFFFF] dark:bg-[#1B242E] p-6 border border-[#E3E7EA] dark:border-[#293644] rounded-xl shadow-sm space-y-4">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Fingerprint className="w-5 h-5 text-[#244C66] dark:text-[#F0F4F7]" />
                Optional Admin Passkey
              </h3>
              <p className="text-sm text-[#66736F] dark:text-[#A3B0AB] leading-relaxed">
                Enables biometric logging (Windows Hello/TouchID) for your personal administrator panel session.
              </p>

              {personalPasskey ? (
                <div className="space-y-4 pt-2">
                  <div className="p-3 bg-[#F0F4F7] dark:bg-[#233240] border border-[#E3E7EA] dark:border-[#293644] rounded-lg flex items-center gap-2 text-sm text-[#244C66] dark:text-[#F0F4F7] font-semibold justify-center">
                    <ShieldCheck className="w-5 h-5" /> Admin Biometrics Enrolled
                  </div>
                  <button 
                    onClick={handleRemovePersonalPasskeys} 
                    className="w-full bg-[#FFFFFF] dark:bg-[#1B242E] hover:bg-[#F7F8FA] dark:hover:bg-[#233240] text-[#B94A48] border border-[#B94A48] rounded-lg py-2.5 text-sm font-semibold transition-colors"
                  >
                    Deactivate Passkeys
                  </button>
                </div>
              ) : (
                <div className="pt-2">
                  <button 
                    onClick={handleRegisterPersonalPasskey}
                    disabled={registeringPasskey}
                    className="btn-primary w-full bg-[#244C66] hover:bg-[#193B51] dark:bg-[#F0F4F7] dark:hover:bg-[#FFFFFF] text-[#FFFFFF] dark:text-[#121921] rounded-lg py-2.5 text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                  >
                    {registeringPasskey ? (
                      <div className="w-4 h-4 border-2 border-[#FFFFFF]/30 border-t-[#FFFFFF] dark:border-[#121921]/30 dark:border-t-[#121921] rounded-full animate-spin" />
                    ) : (
                      'Enroll Biometric Passkey'
                    )}
                  </button>
                </div>
              )}
            </div>

          </div>

          {/* RIGHT PANELS: ALERTS & ACTIVE LISTS */}
          <div className="space-y-6 lg:col-span-2">
            
            {/* INCIDENT ALERTS REPORT */}
            <div className="travel-card overflow-hidden bg-[#FFFFFF] dark:bg-[#1B242E] border border-[#E3E7EA] dark:border-[#293644] rounded-xl shadow-sm">
              <div className="p-5 border-b border-[#E3E7EA] dark:border-[#293644] bg-[#F7F8FA] dark:bg-[#233240]">
                <h3 className="text-base font-bold flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-[#D96C4F]" />
                  System Threat Incident Flags
                </h3>
                <p className="text-sm text-[#66736F] dark:text-[#A3B0AB] mt-1">Real-time flagged login activity logs.</p>
              </div>

              <div className="divide-y divide-[#E3E7EA] dark:divide-[#293644]">
                {securityAlerts.length === 0 ? (
                  <div className="text-center p-8 text-[#66736F] dark:text-[#A3B0AB] text-sm">No dynamic security incident flags reported.</div>
                ) : (
                  securityAlerts.map(alert => (
                    <div key={alert.id} className="p-5 flex items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h4 className="text-sm font-bold text-[#B94A48] capitalize">{alert.alert_type.replace('_', ' ')} Registered</h4>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${alert.resolved ? 'bg-[#4F7D62]/10 text-[#4F7D62] border border-[#4F7D62]/20' : 'bg-[#B94A48]/10 text-[#B94A48] border border-[#B94A48]/20'}`}>
                            {alert.resolved ? 'Resolved' : 'Active'}
                          </span>
                        </div>
                        <p className="text-xs text-[#66736F] dark:text-[#A3B0AB]">
                          📍 {alert.location} • <span className="font-mono">{alert.ip_address}</span> • {new Date(alert.created_at).toLocaleString()} • User ID: {alert.user_id}
                        </p>
                      </div>
                      {!alert.resolved && (
                        <button 
                          onClick={() => handleResolveAlert(alert.id)}
                          className="bg-[#F7F8FA] dark:bg-[#233240] hover:bg-[#F0F4F7] dark:hover:bg-[#293644] border border-[#E3E7EA] dark:border-[#293644] text-[#244C66] dark:text-[#F0F4F7] px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                        >
                          Resolve
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* SYSTEM ACTIVE SESSIONS */}
            <div className="travel-card overflow-hidden bg-[#FFFFFF] dark:bg-[#1B242E] border border-[#E3E7EA] dark:border-[#293644] rounded-xl shadow-sm">
              <div className="p-5 border-b border-[#E3E7EA] dark:border-[#293644] bg-[#F7F8FA] dark:bg-[#233240]">
                <h3 className="text-base font-bold flex items-center gap-2">
                  <Laptop className="w-5 h-5 text-[#244C66] dark:text-[#F0F4F7]" />
                  System-Wide Active Sessions
                </h3>
                <p className="text-sm text-[#66736F] dark:text-[#A3B0AB] mt-1">Every signed-in session currently registered on the platform database.</p>
              </div>

              <div className="divide-y divide-[#E3E7EA] dark:divide-[#293644]">
                {activeSessions.length === 0 ? (
                  <div className="text-center p-8 text-[#66736F] dark:text-[#A3B0AB] text-sm">No active sessions indexed.</div>
                ) : (
                  activeSessions.map(sess => (
                    <div key={sess.session_id} className="p-5 flex items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-sm">{sess.user?.name} <span className="text-[#66736F] dark:text-[#A3B0AB] font-normal">({sess.user?.email})</span></span>
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${sess.user?.role === 'admin' ? 'bg-[#E5B85C]/20 text-[#263238] dark:text-[#E5B85C] border border-[#E5B85C]/30' : 'bg-[#F0F4F7] dark:bg-[#293644] text-[#66736F] dark:text-[#A3B0AB]'}`}>
                            {sess.user?.role}
                          </span>
                        </div>
                        <p className="text-xs text-[#66736F] dark:text-[#A3B0AB]">
                          📍 {sess.login_location} • {sess.os} ({sess.browser}) • <span className="font-mono">{sess.ip_address}</span>
                        </p>
                      </div>
                      <button 
                        onClick={() => handleRevokeSession(sess.session_id)}
                        disabled={revokingId === sess.session_id}
                        className="bg-[#FFFFFF] dark:bg-[#1B242E] hover:bg-[#F7F8FA] dark:hover:bg-[#233240] border border-[#E3E7EA] dark:border-[#293644] text-[#B94A48] p-2 rounded-lg transition-colors"
                        title="Force Sign Out"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* AUDIT SYSTEM LOGS TABLE */}
            <div className="travel-card overflow-hidden bg-[#FFFFFF] dark:bg-[#1B242E] border border-[#E3E7EA] dark:border-[#293644] rounded-xl shadow-sm">
              <div className="p-5 border-b border-[#E3E7EA] dark:border-[#293644] bg-[#F7F8FA] dark:bg-[#233240]">
                <h3 className="text-base font-bold flex items-center gap-2">
                  <Globe className="w-5 h-5 text-[#244C66] dark:text-[#F0F4F7]" />
                  Platform Login History Log
                </h3>
                <p className="text-sm text-[#66736F] dark:text-[#A3B0AB] mt-1">Historical records of logins registered on AEVORA.</p>
              </div>

              <div className="overflow-x-auto">
                <table className="travel-table w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-[#E3E7EA] dark:border-[#293644] bg-[#F7F8FA]/50 dark:bg-[#233240]/50 text-xs text-[#66736F] dark:text-[#A3B0AB] uppercase tracking-wider font-semibold">
                      <th className="p-4 font-semibold">Time & Status</th>
                      <th className="p-4 font-semibold">User</th>
                      <th className="p-4 font-semibold">Device Coordinates</th>
                      <th className="p-4 font-semibold">Location</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E3E7EA] dark:divide-[#293644]">
                    {loginHistory.slice(0, 15).map(item => (
                      <tr key={item.id} className="hover:bg-[#F7F8FA]/50 dark:hover:bg-[#233240]/50 transition-colors">
                        <td className="p-4 align-top">
                          <div className="font-medium text-[#263238] dark:text-[#F7F8FA]">{new Date(item.login_time).toLocaleString()}</div>
                          <div className={`text-[10px] font-bold uppercase mt-1 ${item.status === 'success' ? 'text-[#4F7D62]' : 'text-[#B94A48]'}`}>{item.status}</div>
                        </td>
                        <td className="p-4 align-top">
                          <div className="font-medium text-[#263238] dark:text-[#F7F8FA]">{item.user?.name}</div>
                          <div className="text-xs text-[#66736F] dark:text-[#A3B0AB] mt-0.5">{item.user?.email}</div>
                        </td>
                        <td className="p-4 align-top font-mono text-xs text-[#66736F] dark:text-[#A3B0AB]">
                          {item.ip_address}
                        </td>
                        <td className="p-4 align-top font-medium text-[#66736F] dark:text-[#A3B0AB]">
                          📍 {item.location}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
