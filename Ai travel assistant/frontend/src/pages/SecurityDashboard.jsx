import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, Smartphone, Laptop, Globe, Clock, AlertTriangle, 
  CheckCircle2, Key, Trash2, Fingerprint, Lock, ShieldCheck, 
  HelpCircle, Copy, Download, RefreshCw, Mail, Phone, Plus, Minus, UserCheck, X, LogOut
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import toast from 'react-hot-toast';
import zxcvbn from 'zxcvbn';
import useDevice from '../hooks/useDevice';
import DesktopFeaturePlaceholder from '../components/DesktopFeaturePlaceholder';

export default function SecurityDashboard() {
  const { user } = useAuth();
  const { isMobile } = useDevice();
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState([]);
  const [loginHistory, setLoginHistory] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [trustedDevices, setTrustedDevices] = useState([]);

  // Security score & settings from backend
  const [score, setScore] = useState(0);
  const [checklist, setChecklist] = useState({
    strong_password: true,
    two_factor: false,
    passkey: false,
    recovery_options: false
  });
  const [secSettings, setSecSettings] = useState(null);

  // Recovery forms
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryPhone, setRecoveryPhone] = useState('');
  const [savingRecovery, setSavingRecovery] = useState(false);

  // Password change state
  const [pwData, setPwData] = useState({ current: '', new: '', confirm: '' });
  const [changingPw, setChangingPw] = useState(false);

  // Backup codes modal
  const [backupCodes, setBackupCodes] = useState([]);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [generatingBackup, setGeneratingBackup] = useState(false);

  // WebAuthn state
  const [registeringPasskey, setRegisteringPasskey] = useState(false);

  // Search filter for audit history
  const [searchTerm, setSearchTerm] = useState('');

  const fetchSecurityData = async () => {
    try {
      const [sessRes, alertRes, historyRes, settingsRes, trustedRes] = await Promise.all([
        api.get('/security/active-sessions'),
        api.get('/security/alerts'),
        api.get('/security/login-history'),
        api.get('/security/settings'),
        api.get('/security/trusted-devices')
      ]);

      setSessions(sessRes.data || []);
      setAlerts(alertRes.data || []);
      setLoginHistory(historyRes.data || []);
      setTrustedDevices(trustedRes.data || []);

      if (settingsRes.data) {
        setSecSettings(settingsRes.data.settings);
        setScore(settingsRes.data.score);
        setChecklist(settingsRes.data.checklist);
        setRecoveryEmail(settingsRes.data.settings?.recovery_email || '');
        setRecoveryPhone(settingsRes.data.settings?.recovery_phone || '');
      }
    } catch (err) {
      toast.error('Failed to load security dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSecurityData();
  }, []);

  const handleRevokeSession = async (sessionId) => {
    try {
      await api.delete(`/security/sessions/${sessionId}`);
      toast.success('Session revoked successfully.');
      fetchSecurityData();
    } catch (err) {
      toast.error('Failed to revoke session.');
    }
  };

  const handleRevokeAllOthers = async () => {
    if (!window.confirm('Are you sure you want to terminate all other active devices?')) return;
    try {
      const otherSessions = sessions.filter(s => !s.is_current);
      await Promise.all(otherSessions.map(s => api.delete(`/security/sessions/${s.session_id}`)));
      toast.success('All other devices signed out.');
      fetchSecurityData();
    } catch (err) {
      toast.error('Failed to log out other devices.');
    }
  };

  const handleResolveAlert = async (alertId) => {
    try {
      await api.post(`/security/alerts/${alertId}/resolve`);
      setAlerts(alerts.filter(a => a.id !== alertId));
      toast.success('Alert resolved.');
    } catch (err) {
      toast.error('Failed to resolve alert.');
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (pwData.new !== pwData.confirm) return toast.error('Passwords do not match');

    setChangingPw(true);
    try {
      await api.put('/profile/password', {
        currentPassword: pwData.current,
        newPassword: pwData.new
      });
      toast.success('Password updated successfully');
      setPwData({ current: '', new: '', confirm: '' });
      fetchSecurityData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update password');
    } finally {
      setChangingPw(false);
    }
  };

  const getPwStrength = () => {
    if (!pwData.new) return { level: 0, color: 'bg-[#E3DED2] dark:bg-[#2A403A]', label: 'Empty' };
    const res = zxcvbn(pwData.new);
    const score = res.score;
    if (score <= 1) return { level: 1, color: 'bg-[#B94A48]', label: 'Weak' };
    if (score === 2) return { level: 2, color: 'bg-[#E5B85C]', label: 'Fair' };
    if (score === 3) return { level: 3, color: 'bg-[#D96C4F]', label: 'Strong' };
    return { level: 4, color: 'bg-[#4F7D62]', label: 'Excellent' };
  };

  const strength = getPwStrength();

  const handleToggle2FA = async () => {
    try {
      const { data } = await api.post('/security/2fa/toggle');
      toast.success(data.message);
      fetchSecurityData();
    } catch (err) {
      toast.error('Failed to toggle two-factor authentication.');
    }
  };

  const handleUpdateRecovery = async (e) => {
    e.preventDefault();
    setSavingRecovery(true);
    try {
      await api.post('/security/recovery', {
        recovery_email: recoveryEmail,
        recovery_phone: recoveryPhone
      });
      toast.success('Recovery settings saved successfully.');
      fetchSecurityData();
    } catch (err) {
      toast.error('Failed to save recovery options.');
    } finally {
      setSavingRecovery(false);
    }
  };

  const handleGenerateBackupCodes = async () => {
    setGeneratingBackup(true);
    try {
      const { data } = await api.post('/security/recovery/backup-codes');
      setBackupCodes(data.codes);
      setShowBackupModal(true);
      toast.success('Backup recovery codes generated.');
      fetchSecurityData();
    } catch (err) {
      toast.error('Failed to generate backup recovery codes.');
    } finally {
      setGeneratingBackup(false);
    }
  };

  const handleDownloadBackupCodes = () => {
    const text = `TRAVELIQ SECURITY - RECOVERY BACKUP CODES\n` +
      `Generated at: ${new Date().toLocaleString()}\n` +
      `Store these codes safely. Each code is ONE-TIME use only.\n\n` +
      backupCodes.map((code, idx) => `[ ] Code #${idx + 1}: ${code}`).join('\n') +
      `\n\n© 2026 TravelIQ Account Protection`;

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'traveliq-recovery-backup-codes.txt';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleRegisterPasskey = async () => {
    setRegisteringPasskey(true);
    try {
      const { data: challengeRes } = await api.get('/security/passkey/register-challenge');

      if (typeof navigator.credentials === 'undefined' || !navigator.credentials.create) {
        toast.loading('Simulating biometric check (Windows Hello/TouchID)...', { duration: 1500 });
        await new Promise(r => setTimeout(r, 1500));

        const mockCredentialId = btoa('mock_cred_' + Math.random().toString(36).substring(2, 12));
        const mockPublicKey = 'mock_pub_key_' + Math.random().toString(36).substring(2);

        await api.post('/security/passkey/register-verify', {
          credentialId: mockCredentialId,
          publicKey: mockPublicKey
        });

        toast.success('Simulated biometric passkey registered successfully!');
        fetchSecurityData();
        return;
      }

      const challengeBuffer = Uint8Array.from(atob(challengeRes.challenge), c => c.charCodeAt(0));
      const userIdBuffer = Uint8Array.from(challengeRes.user.id.toString(), c => c.charCodeAt(0));

      const credential = await navigator.credentials.create({
        publicKey: {
          challenge: challengeBuffer,
          rp: challengeRes.rp,
          user: {
            id: userIdBuffer,
            name: challengeRes.user.name,
            displayName: challengeRes.user.displayName
          },
          pubKeyCredParams: challengeRes.pubKeyCredParams,
          authenticatorSelection: {
            userVerification: "preferred",
            residentKey: "preferred"
          },
          timeout: 60000
        }
      });

      if (!credential) {
        throw new Error('Biometric check was cancelled or failed.');
      }

      const credentialIdB64 = btoa(String.fromCharCode(...new Uint8Array(credential.rawId)));
      const publicKey = "public_key_spki_" + btoa(String.fromCharCode(...new Uint8Array(credential.response.attestationObject || [])));

      await api.post('/security/passkey/register-verify', {
        credentialId: credentialIdB64,
        publicKey
      });

      toast.success('Biometric Passkey registered successfully!');
      fetchSecurityData();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || err.message || 'Passkey registration failed.');
    } finally {
      setRegisteringPasskey(false);
    }
  };

  const handleRemovePasskeys = async () => {
    if (!window.confirm('Are you sure you want to remove all registered biometric passkeys?')) return;
    try {
      await api.delete('/security/passkey');
      toast.success('All biometric credentials deactivated.');
      fetchSecurityData();
    } catch (err) {
      toast.error('Failed to remove passkeys.');
    }
  };

  const handleRemoveTrusted = async (deviceId) => {
    try {
      await api.delete(`/security/trusted-devices/${deviceId}`);
      toast.success('Device removed from trusted list.');
      fetchSecurityData();
    } catch (err) {
      toast.error('Failed to revoke device trust.');
    }
  };

  const filteredHistory = loginHistory.filter(item => 
    item.browser.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.os.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.ip_address.includes(searchTerm) ||
    item.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F5EF] dark:bg-[#12201D] pt-24 px-4 flex justify-center items-center">
        <div className="w-10 h-10 border-4 border-[#E3DED2] dark:border-[#2A403A] border-t-[#173F3A] dark:border-t-[#EEF2ED] rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F5EF] dark:bg-[#12201D] pt-24 px-4 pb-16">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* HEADER SECTION */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-[#E3DED2] dark:border-[#2A403A] pb-6">
          <div>
            <h1 className="text-3xl font-bold text-[#263238] dark:text-[#F7F5EF] flex items-center gap-3">
              <ShieldCheck className="w-8 h-8 text-[#173F3A] dark:text-[#EEF2ED]" />
              Account Security Center
            </h1>
            <p className="text-[#66736F] dark:text-[#A3B0AB] text-sm mt-1.5">
              Secure your account, manage biometric sign-ins, audit devices, and configure verification fallbacks.
            </p>
          </div>
          <button 
            onClick={fetchSecurityData} 
            className="flex items-center justify-center gap-2 bg-[#FFFFFF] dark:bg-[#1B2C28] hover:bg-[#EEF2ED] dark:hover:bg-[#213530] text-[#263238] dark:text-[#F7F5EF] rounded-lg px-4 py-2 text-sm font-semibold border border-[#E3DED2] dark:border-[#2A403A] transition-all shadow-sm w-fit"
          >
            <RefreshCw className="w-4 h-4" /> Refresh Center
          </button>
        </div>

        {/* INCIDENT ALERT BANNER */}
        {alerts.length > 0 && (
          <div className="bg-[#B94A48]/10 border border-[#B94A48]/20 rounded-xl p-5">
            <h2 className="text-lg font-bold text-[#B94A48] flex items-center gap-2 mb-3">
              <AlertTriangle className="w-5 h-5" />
              Security Flags Detected
            </h2>
            <div className="space-y-3">
              {alerts.map(alert => (
                <div key={alert.id} className="bg-[#FFFFFF] dark:bg-[#1B2C28] border border-[#B94A48]/20 rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-[#B94A48] font-semibold capitalize text-sm">{alert.alert_type.replace('_', ' ')} Registered</h3>
                    <p className="text-xs text-[#66736F] dark:text-[#A3B0AB] mt-1">
                      📍 {alert.location} • {alert.ip_address} • {new Date(alert.created_at).toLocaleString()}
                    </p>
                  </div>
                  <button 
                    onClick={() => handleResolveAlert(alert.id)} 
                    className="bg-[#B94A48] hover:bg-[#B94A48]/90 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all text-center self-start md:self-center"
                  >
                    Acknowledge
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT SIDEBAR: SCORE & CORE POLICIES */}
          <div className="space-y-8 lg:col-span-1">
            
            {/* ACCOUNT SECURITY SCORE */}
            <div className="bg-[#FFFFFF] dark:bg-[#1B2C28] rounded-xl p-6 border border-[#E3DED2] dark:border-[#2A403A] text-center shadow-[0_4px_16px_rgba(23,63,58,0.06)]">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#EEF2ED] dark:bg-[#213530] border border-[#E3DED2] dark:border-[#2A403A] mb-4 text-[#173F3A] dark:text-[#F7F5EF] font-bold text-2xl">
                {score}
              </div>
              <h3 className="text-sm text-[#66736F] dark:text-[#A3B0AB] font-bold uppercase tracking-wider mb-1">
                Account Safety Level
              </h3>
              <h2 className="text-xl font-bold text-[#263238] dark:text-[#F7F5EF] mb-6">
                {score >= 80 ? '🔒 Excellent Protection' : (score >= 50 ? '⚠️ Moderate Protection' : '❌ Critical Risk')}
              </h2>

              {/* Score checklist */}
              <div className="text-left space-y-3 mb-2">
                <div className="flex items-center justify-between text-sm p-3 bg-[#F7F5EF] dark:bg-[#12201D] rounded-lg border border-[#E3DED2] dark:border-[#2A403A]">
                  <span className="text-[#263238] dark:text-[#F7F5EF] flex items-center gap-2"><Lock className="w-4 h-4 text-[#66736F] dark:text-[#A3B0AB]" /> Strong Password</span>
                  {checklist.strong_password ? <CheckCircle2 className="w-5 h-5 text-[#4F7D62]" /> : <AlertTriangle className="w-5 h-5 text-[#E5B85C]" />}
                </div>

                <div className="flex items-center justify-between text-sm p-3 bg-[#F7F5EF] dark:bg-[#12201D] rounded-lg border border-[#E3DED2] dark:border-[#2A403A]">
                  <span className="text-[#263238] dark:text-[#F7F5EF] flex items-center gap-2"><Mail className="w-4 h-4 text-[#66736F] dark:text-[#A3B0AB]" /> Email OTP 2FA</span>
                  {checklist.two_factor ? <CheckCircle2 className="w-5 h-5 text-[#4F7D62]" /> : <AlertTriangle className="w-5 h-5 text-[#E5B85C]" />}
                </div>

                <div className="flex items-center justify-between text-sm p-3 bg-[#F7F5EF] dark:bg-[#12201D] rounded-lg border border-[#E3DED2] dark:border-[#2A403A]">
                  <span className="text-[#263238] dark:text-[#F7F5EF] flex items-center gap-2"><Fingerprint className="w-4 h-4 text-[#66736F] dark:text-[#A3B0AB]" /> Passkey Biometrics</span>
                  {checklist.passkey ? <CheckCircle2 className="w-5 h-5 text-[#4F7D62]" /> : <AlertTriangle className="w-5 h-5 text-[#E5B85C]" />}
                </div>

                <div className="flex items-center justify-between text-sm p-3 bg-[#F7F5EF] dark:bg-[#12201D] rounded-lg border border-[#E3DED2] dark:border-[#2A403A]">
                  <span className="text-[#263238] dark:text-[#F7F5EF] flex items-center gap-2"><Phone className="w-4 h-4 text-[#66736F] dark:text-[#A3B0AB]" /> Recovery Parameters</span>
                  {checklist.recovery_options ? <CheckCircle2 className="w-5 h-5 text-[#4F7D62]" /> : <AlertTriangle className="w-5 h-5 text-[#E5B85C]" />}
                </div>
              </div>
            </div>

            {/* TWO FACTOR AUTHENTICATION CARD */}
            <div className="bg-[#FFFFFF] dark:bg-[#1B2C28] rounded-xl p-6 border border-[#E3DED2] dark:border-[#2A403A] space-y-4 shadow-[0_4px_16px_rgba(23,63,58,0.06)]">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-[#263238] dark:text-[#F7F5EF] flex items-center gap-2">
                  <Lock className="w-5 h-5 text-[#173F3A] dark:text-[#EEF2ED]" />
                  Two-Factor Authentication
                </h3>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={checklist.two_factor} 
                    onChange={handleToggle2FA}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-[#E3DED2] dark:bg-[#2A403A] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-[#E3DED2] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#173F3A] dark:peer-checked:bg-[#EEF2ED] border border-[#E3DED2] dark:border-[#2A403A]"></div>
                </label>
              </div>
              <p className="text-sm text-[#66736F] dark:text-[#A3B0AB] leading-relaxed">
                Add an extra layer of protection by requesting a dynamic 6-digit email OTP verification code upon every browser login. Highly recommended.
              </p>
            </div>

            {/* BIOMETRIC PASSKEYS CARD */}
            <div className="bg-[#FFFFFF] dark:bg-[#1B2C28] rounded-xl p-6 border border-[#E3DED2] dark:border-[#2A403A] space-y-4 shadow-[0_4px_16px_rgba(23,63,58,0.06)]">
              <h3 className="text-base font-bold text-[#263238] dark:text-[#F7F5EF] flex items-center gap-2">
                <Fingerprint className="w-5 h-5 text-[#173F3A] dark:text-[#EEF2ED]" />
                Biometric Passkeys
              </h3>
              <p className="text-sm text-[#66736F] dark:text-[#A3B0AB] leading-relaxed">
                Enables passwordless sign-in using Windows Hello, Face ID, fingerprint scanners, or device PIN. Encrypted and safe.
              </p>

              {checklist.passkey ? (
                <div className="space-y-3">
                  <div className="p-3 bg-[#EEF2ED] dark:bg-[#213530] border border-[#E3DED2] dark:border-[#2A403A] rounded-lg flex items-center gap-2 text-sm text-[#173F3A] dark:text-[#F7F5EF] font-semibold justify-center">
                    <ShieldCheck className="w-5 h-5" /> Biometrics Enrolled & Enabled
                  </div>
                  <button 
                    onClick={handleRemovePasskeys} 
                    className="w-full bg-[#FFFFFF] dark:bg-[#1B2C28] hover:bg-[#B94A48]/10 text-[#B94A48] border border-[#E3DED2] dark:border-[#2A403A] rounded-lg py-2.5 text-sm font-semibold transition-all"
                  >
                    Deactivate Passkeys
                  </button>
                </div>
              ) : (
                <button 
                  onClick={handleRegisterPasskey}
                  disabled={registeringPasskey}
                  className="w-full bg-[#173F3A] hover:bg-[#0F332F] dark:bg-[#EEF2ED] dark:hover:bg-[#FFFFFF] dark:text-[#12201D] text-white rounded-lg py-2.5 text-sm font-semibold transition-all flex items-center justify-center gap-2"
                >
                  {registeringPasskey ? (
                    <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Plus className="w-4 h-4" /> Enroll Biometric Passkey
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* RIGHT PANELS: SESSIONS, PASSWORDS, RECOVERY */}
          <div className="space-y-8 lg:col-span-2">
            
            {/* DEVICE & ACTIVE SESSION MANAGEMENT */}
            <div className="bg-[#FFFFFF] dark:bg-[#1B2C28] rounded-xl border border-[#E3DED2] dark:border-[#2A403A] overflow-hidden shadow-[0_4px_16px_rgba(23,63,58,0.06)]">
              <div className="p-6 border-b border-[#E3DED2] dark:border-[#2A403A] bg-[#F7F5EF] dark:bg-[#12201D] flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                  <h3 className="text-base font-bold text-[#263238] dark:text-[#F7F5EF] flex items-center gap-2">
                    <Laptop className="w-5 h-5 text-[#173F3A] dark:text-[#EEF2ED]" />
                    Active Sessions & Devices
                  </h3>
                  <p className="text-sm text-[#66736F] dark:text-[#A3B0AB]">Remotely monitor and revoke signed-in browser instances.</p>
                </div>
                {sessions.length > 1 && (
                  <button 
                    onClick={handleRevokeAllOthers} 
                    className="bg-[#FFFFFF] dark:bg-[#1B2C28] hover:bg-[#B94A48]/10 text-[#B94A48] border border-[#E3DED2] dark:border-[#2A403A] rounded-lg px-4 py-2 text-sm font-semibold transition-all self-start sm:self-center flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" /> Invalidate Others
                  </button>
                )}
              </div>

              <div className="divide-y divide-[#E3DED2] dark:divide-[#2A403A]">
                {sessions.map(sess => (
                  <div key={sess.session_id} className={`p-5 flex items-center justify-between gap-4 transition-all ${sess.is_current ? 'bg-[#EEF2ED]/50 dark:bg-[#213530]/50' : ''}`}>
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-lg ${sess.is_current ? 'bg-[#173F3A] text-white dark:bg-[#EEF2ED] dark:text-[#12201D]' : 'bg-[#F7F5EF] text-[#66736F] dark:bg-[#12201D] dark:text-[#A3B0AB]'}`}>
                        {sess.device_type === 'mobile' ? <Smartphone className="w-5 h-5" /> : <Laptop className="w-5 h-5" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-semibold text-[#263238] dark:text-[#F7F5EF]">{sess.browser} on {sess.os}</h4>
                          {sess.is_current && (
                            <span className="bg-[#173F3A]/10 text-[#173F3A] dark:bg-[#EEF2ED]/10 dark:text-[#EEF2ED] text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
                              Current Device
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#66736F] dark:text-[#A3B0AB] mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                          <span>📍 {sess.login_location}</span>
                          <span>🌐 <span className="font-mono">{sess.ip_address}</span></span>
                          <span>🕒 {new Date(sess.last_active).toLocaleDateString()}</span>
                        </p>
                      </div>
                    </div>
                    {!sess.is_current && (
                      <button 
                        onClick={() => handleRevokeSession(sess.session_id)} 
                        className="text-[#66736F] hover:text-[#B94A48] dark:text-[#A3B0AB] p-2 rounded-lg hover:bg-[#B94A48]/10 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* TRUSTED DEVICES SECTION */}
            <div className="bg-[#FFFFFF] dark:bg-[#1B2C28] rounded-xl p-6 border border-[#E3DED2] dark:border-[#2A403A] space-y-4 shadow-[0_4px_16px_rgba(23,63,58,0.06)]">
              <div>
                <h3 className="text-base font-bold text-[#263238] dark:text-[#F7F5EF] flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-[#173F3A] dark:text-[#EEF2ED]" />
                  Trusted Devices
                </h3>
                <p className="text-sm text-[#66736F] dark:text-[#A3B0AB] mt-0.5">Browsers configured to bypass secondary OTP verification requests.</p>
              </div>

              {trustedDevices.length === 0 ? (
                <div className="text-center p-6 text-[#66736F] dark:text-[#A3B0AB] text-sm font-semibold">No marked trusted devices found.</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {trustedDevices.map(device => (
                    <div key={device.device_id} className="p-4 bg-[#F7F5EF] dark:bg-[#12201D] border border-[#E3DED2] dark:border-[#2A403A] rounded-lg flex items-center justify-between text-sm">
                      <div className="space-y-1">
                        <div className="font-semibold text-[#263238] dark:text-[#F7F5EF]">{device.browser} on {device.os}</div>
                        <div className="text-xs text-[#66736F] dark:text-[#A3B0AB]">ID: {device.device_id.substring(0, 8)}...</div>
                      </div>
                      <button 
                        onClick={() => handleRemoveTrusted(device.device_id)}
                        className="text-[#B94A48] hover:bg-[#B94A48]/10 p-2 rounded-lg transition-all"
                        title="Revoke Trust"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ACCOUNT RECOVERY & BACKUP CODES */}
            <div className="bg-[#FFFFFF] dark:bg-[#1B2C28] rounded-xl p-6 border border-[#E3DED2] dark:border-[#2A403A] grid grid-cols-1 md:grid-cols-2 gap-8 shadow-[0_4px_16px_rgba(23,63,58,0.06)]">
              
              {/* RECOVERY OPTIONS */}
              <form onSubmit={handleUpdateRecovery} className="space-y-4">
                <div>
                  <h3 className="text-base font-bold text-[#263238] dark:text-[#F7F5EF] flex items-center gap-2">
                    <HelpCircle className="w-5 h-5 text-[#173F3A] dark:text-[#EEF2ED]" />
                    Recovery Credentials
                  </h3>
                  <p className="text-sm text-[#66736F] dark:text-[#A3B0AB] mt-0.5">Used as backup authentication channels.</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-[#263238] dark:text-[#F7F5EF] mb-1.5">Recovery Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-[#66736F] dark:text-[#A3B0AB] w-4 h-4" />
                      <input 
                        type="email" 
                        value={recoveryEmail} 
                        onChange={(e) => setRecoveryEmail(e.target.value)}
                        placeholder="recovery@example.com" 
                        className="w-full bg-[#F7F5EF] dark:bg-[#12201D] border border-[#E3DED2] dark:border-[#2A403A] rounded-lg py-2.5 pl-10 pr-4 text-sm text-[#263238] dark:text-[#F7F5EF] placeholder-[#66736F] dark:placeholder-[#A3B0AB] focus:outline-none focus:border-[#173F3A] dark:focus:border-[#EEF2ED]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-[#263238] dark:text-[#F7F5EF] mb-1.5">Recovery Phone</label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-[#66736F] dark:text-[#A3B0AB] w-4 h-4" />
                      <input 
                        type="text" 
                        value={recoveryPhone} 
                        onChange={(e) => setRecoveryPhone(e.target.value)}
                        placeholder="+91 XXXXX XXXXX" 
                        className="w-full bg-[#F7F5EF] dark:bg-[#12201D] border border-[#E3DED2] dark:border-[#2A403A] rounded-lg py-2.5 pl-10 pr-4 text-sm text-[#263238] dark:text-[#F7F5EF] placeholder-[#66736F] dark:placeholder-[#A3B0AB] focus:outline-none focus:border-[#173F3A] dark:focus:border-[#EEF2ED]"
                      />
                    </div>
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={savingRecovery}
                  className="bg-[#FFFFFF] dark:bg-[#1B2C28] hover:bg-[#EEF2ED] dark:hover:bg-[#213530] border border-[#E3DED2] dark:border-[#2A403A] text-[#173F3A] dark:text-[#EEF2ED] rounded-lg py-2.5 px-6 text-sm font-semibold transition-all w-fit disabled:opacity-50"
                >
                  {savingRecovery ? 'Saving...' : 'Save Recovery Options'}
                </button>
              </form>

              {/* BACKUP CODES GENERATION */}
              <div className="space-y-4 flex flex-col justify-between">
                <div className="space-y-2">
                  <h3 className="text-base font-bold text-[#263238] dark:text-[#F7F5EF] flex items-center gap-2">
                    <Key className="w-5 h-5 text-[#173F3A] dark:text-[#EEF2ED]" />
                    One-time Backup Codes
                  </h3>
                  <p className="text-sm text-[#66736F] dark:text-[#A3B0AB] leading-relaxed">
                    Generate 10 secure, alphanumeric backup recovery codes. Useful if you lose access to your primary email address or 2FA credentials. Keep them printed or saved offline.
                  </p>
                </div>

                <button 
                  onClick={handleGenerateBackupCodes}
                  disabled={generatingBackup}
                  className="bg-[#D96C4F] hover:bg-[#C75D43] text-white rounded-lg py-2.5 font-semibold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-4"
                >
                  {generatingBackup ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    'Generate 10 Backup Codes'
                  )}
                </button>
              </div>
            </div>

            {/* CHANGE PASSWORD */}
            <div className="bg-[#FFFFFF] dark:bg-[#1B2C28] rounded-xl p-6 border border-[#E3DED2] dark:border-[#2A403A] h-fit shadow-[0_4px_16px_rgba(23,63,58,0.06)]">
              <h2 className="text-xl font-bold text-[#263238] dark:text-[#F7F5EF] flex items-center gap-2 mb-6">
                <Key className="text-[#173F3A] dark:text-[#EEF2ED] w-5 h-5" />
                Change Account Password
              </h2>
              <form onSubmit={handleChangePassword} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-[#263238] dark:text-[#F7F5EF] mb-2">Current Password</label>
                  <input
                    type="password"
                    required
                    value={pwData.current}
                    onChange={e => setPwData({...pwData, current: e.target.value})}
                    className="w-full bg-[#F7F5EF] dark:bg-[#12201D] border border-[#E3DED2] dark:border-[#2A403A] rounded-lg px-4 py-2.5 text-sm text-[#263238] dark:text-[#F7F5EF] focus:outline-none focus:border-[#173F3A] dark:focus:border-[#EEF2ED]"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-[#263238] dark:text-[#F7F5EF] mb-2">New Password</label>
                  <input
                    type="password"
                    required
                    value={pwData.new}
                    onChange={e => setPwData({...pwData, new: e.target.value})}
                    className="w-full bg-[#F7F5EF] dark:bg-[#12201D] border border-[#E3DED2] dark:border-[#2A403A] rounded-lg px-4 py-2.5 text-sm text-[#263238] dark:text-[#F7F5EF] focus:outline-none focus:border-[#173F3A] dark:focus:border-[#EEF2ED]"
                  />
                  {pwData.new && (
                    <div className="space-y-1 mt-2">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4].map((i) => (
                          <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= strength.level ? strength.color : 'bg-[#E3DED2] dark:bg-[#2A403A]'}`} />
                        ))}
                      </div>
                      <div className="text-[10px] text-[#66736F] dark:text-[#A3B0AB] font-semibold text-right">{strength.label}</div>
                    </div>
                  )}
                </div>

                <div className="flex flex-col justify-between">
                  <div>
                    <label className="block text-sm font-semibold text-[#263238] dark:text-[#F7F5EF] mb-2">Confirm New Password</label>
                    <input
                      type="password"
                      required
                      value={pwData.confirm}
                      onChange={e => setPwData({...pwData, confirm: e.target.value})}
                      className="w-full bg-[#F7F5EF] dark:bg-[#12201D] border border-[#E3DED2] dark:border-[#2A403A] rounded-lg px-4 py-2.5 text-sm text-[#263238] dark:text-[#F7F5EF] focus:outline-none focus:border-[#173F3A] dark:focus:border-[#EEF2ED]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={changingPw}
                    className="bg-[#173F3A] hover:bg-[#0F332F] dark:bg-[#EEF2ED] dark:hover:bg-[#FFFFFF] dark:text-[#12201D] text-white rounded-lg py-2.5 px-6 font-semibold disabled:opacity-70 disabled:cursor-not-allowed mt-4 text-sm"
                  >
                    {changingPw ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              </form>
            </div>

            {/* LOGIN AUDIT HISTORY */}
            <div className="bg-[#FFFFFF] dark:bg-[#1B2C28] rounded-xl border border-[#E3DED2] dark:border-[#2A403A] overflow-hidden shadow-[0_4px_16px_rgba(23,63,58,0.06)]">
              <div className="p-6 border-b border-[#E3DED2] dark:border-[#2A403A] bg-[#F7F5EF] dark:bg-[#12201D] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-[#263238] dark:text-[#F7F5EF] flex items-center gap-2">
                    <Globe className="w-5 h-5 text-[#173F3A] dark:text-[#EEF2ED]" />
                    Access History Logs
                  </h3>
                  <p className="text-sm text-[#66736F] dark:text-[#A3B0AB]">System-wide audit trail of signed coordinates and logins.</p>
                </div>

                {/* Log Search */}
                <div className="relative max-w-xs w-full self-start sm:self-center">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search logs by IP, OS, Location..."
                    className="w-full bg-[#FFFFFF] dark:bg-[#1B2C28] border border-[#E3DED2] dark:border-[#2A403A] rounded-lg py-2 pl-4 pr-10 text-sm text-[#263238] dark:text-[#F7F5EF] placeholder-[#66736F] dark:placeholder-[#A3B0AB] focus:outline-none focus:border-[#173F3A] dark:focus:border-[#EEF2ED] transition-all"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                {isMobile ? (
                  <div className="p-6">
                    <DesktopFeaturePlaceholder 
                      title="Access History Logs" 
                      description="Viewing system-wide audit trails and large security tables requires a desktop interface." 
                    />
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-[#E3DED2] dark:border-[#2A403A] bg-[#F7F5EF] dark:bg-[#12201D] text-xs text-[#66736F] dark:text-[#A3B0AB] uppercase tracking-wider font-bold">
                        <th className="p-4">Time & Status</th>
                        <th className="p-4">System OS / Browser</th>
                        <th className="p-4">IP Coordinates</th>
                        <th className="p-4">Geolocation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E3DED2] dark:divide-[#2A403A]">
                      {filteredHistory.length === 0 ? (
                        <tr>
                          <td colSpan="4" className="p-8 text-center text-[#66736F] dark:text-[#A3B0AB] font-semibold">
                            No recent login audit history records found matching search query.
                          </td>
                        </tr>
                      ) : (
                        filteredHistory.map((item) => (
                          <tr key={item.id} className="hover:bg-[#F7F5EF] dark:hover:bg-[#213530]/30 transition-all">
                            <td className="p-4">
                              <div className="font-semibold text-[#263238] dark:text-[#F7F5EF]">
                                {new Date(item.login_time).toLocaleString()}
                              </div>
                              <div className={`text-[10px] font-bold uppercase mt-1 flex items-center gap-1.5 ${
                                item.is_active 
                                  ? 'text-[#4F7D62]' 
                                  : (item.logout_time ? 'text-[#66736F] dark:text-[#A3B0AB]' : 'text-[#E5B85C]')
                              }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${
                                  item.is_active ? 'bg-[#4F7D62]' : 'bg-[#66736F] dark:bg-[#A3B0AB]'
                                }`} />
                                {item.status}
                              </div>
                            </td>
                            <td className="p-4 font-semibold text-[#263238] dark:text-[#F7F5EF]">
                              {item.os} ({item.browser})
                            </td>
                            <td className="p-4 font-mono text-xs text-[#66736F] dark:text-[#A3B0AB]">
                              {item.ip_address}
                            </td>
                            <td className="p-4 font-semibold text-[#66736F] dark:text-[#A3B0AB]">
                              📍 {item.location}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* BACKUP CODES MODAL */}
      <AnimatePresence>
        {showBackupModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#263238]/80 dark:bg-black/80">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#FFFFFF] dark:bg-[#1B2C28] border border-[#E3DED2] dark:border-[#2A403A] rounded-xl p-6 max-w-md w-full relative space-y-6 shadow-[0_4px_16px_rgba(23,63,58,0.06)]"
            >
              <button 
                onClick={() => setShowBackupModal(false)}
                className="absolute top-4 right-4 text-[#66736F] dark:text-[#A3B0AB] hover:text-[#263238] dark:hover:text-[#F7F5EF] p-1 rounded-lg transition-all"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center space-y-2">
                <div className="inline-flex items-center justify-center p-3 bg-[#EEF2ED] dark:bg-[#213530] rounded-full border border-[#E3DED2] dark:border-[#2A403A] text-[#173F3A] dark:text-[#EEF2ED]">
                  <Key className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-[#263238] dark:text-[#F7F5EF]">Save Your Backup Codes</h3>
                <p className="text-sm text-[#66736F] dark:text-[#A3B0AB] leading-relaxed px-4">
                  Each code can be used ONE-TIME only. If you lose access to your primary email address, you can type any of these codes to log in successfully.
                </p>
              </div>

              {/* Codes Grid */}
              <div className="grid grid-cols-2 gap-3 bg-[#F7F5EF] dark:bg-[#12201D] border border-[#E3DED2] dark:border-[#2A403A] p-4 rounded-lg font-mono text-center text-sm font-bold text-[#263238] dark:text-[#F7F5EF]">
                {backupCodes.map((code, idx) => (
                  <div key={idx} className="p-2 border border-[#E3DED2] dark:border-[#2A403A] bg-[#FFFFFF] dark:bg-[#1B2C28] rounded-md">
                    {code}
                  </div>
                ))}
              </div>

              <div className="flex gap-4 pt-2">
                <button 
                  onClick={handleDownloadBackupCodes}
                  className="flex-1 bg-[#173F3A] hover:bg-[#0F332F] dark:bg-[#EEF2ED] dark:hover:bg-[#FFFFFF] dark:text-[#12201D] text-white rounded-lg py-2.5 text-sm font-semibold transition-all flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" /> Download (.txt)
                </button>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(backupCodes.join(', '));
                    toast.success('Codes copied to clipboard!');
                  }}
                  className="bg-[#FFFFFF] dark:bg-[#1B2C28] hover:bg-[#EEF2ED] dark:hover:bg-[#213530] border border-[#E3DED2] dark:border-[#2A403A] text-[#263238] dark:text-[#F7F5EF] rounded-lg px-5 text-sm font-semibold transition-all flex items-center justify-center gap-2"
                >
                  <Copy className="w-4 h-4" /> Copy
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
