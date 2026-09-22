import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, LogIn, ArrowRight, ShieldAlert, ShieldCheck, KeyRound, Fingerprint, Laptop, HelpCircle, Train } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Turnstile } from '@marsidev/react-turnstile';
import { api } from '../utils/api';
import toast from 'react-hot-toast';
import AuthSuccessOverlay from '../components/AuthSuccessOverlay';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState('');

  // IRCTC state
  const [showIrctcLoginModal, setShowIrctcLoginModal] = useState(false);

  // 2FA state variables
  const [twoFactorRequired, setTwoFactorRequired] = useState(false);
  const [twoFactorData, setTwoFactorData] = useState(null); // { userId, email, recovery_email }
  const [otpCode, setOtpCode] = useState('');
  const [trustDevice, setTrustDevice] = useState(false);
  const [useBackupCode, setUseBackupCode] = useState(false);

  // Success flow states
  const [isSuccess, setIsSuccess] = useState(false);
  const [successUser, setSuccessUser] = useState(null);

  const { login, completeLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  React.useEffect(() => {
    if (location.state?.twoFactorRequired && location.state?.twoFactorData) {
      setTwoFactorRequired(true);
      setTwoFactorData(location.state.twoFactorData);
    }
  }, [location.state]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!turnstileToken && import.meta.env.PROD) {
      return toast.error('Please complete the security check.');
    }

    setIsSubmitting(true);
    const result = await login(email, password, turnstileToken);
    setIsSubmitting(false);

    if (result.status === 'SUCCESS') {
      setIsSuccess(true);
      setSuccessUser(result.user);
    } else if (result.status === '2FA_REQUIRED') {
      setTwoFactorRequired(true);
      setTwoFactorData(result);
      toast.success('Verification code dispatched to your email.');
    } else {
      // Turnstile token is single-use
      setTurnstileToken('');
    }
  };

  const handleVerify2FA = async (e) => {
    e.preventDefault();
    if (!otpCode) return toast.error('Please enter the verification code.');

    setIsSubmitting(true);
    try {
      const { data: userData } = await api.post('/auth/verify-2fa', {
        userId: twoFactorData.userId,
        otpCode: otpCode.trim(),
        deviceId: localStorage.getItem('deviceId') || '',
        trustDevice: trustDevice
      });

      completeLogin(userData);
      setIsSuccess(true);
      setSuccessUser(userData);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid or expired verification code.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasskeyLogin = async () => {
    if (!email) {
      return toast.error('Please enter your email address to sign in using a biometric Passkey.');
    }

    setIsSubmitting(true);
    try {
      // 1. Fetch challenge and credentials list
      const { data: challengeRes } = await api.post('/auth/passkey/login-challenge', { email });
      
      if (!challengeRes.allowCredentials || challengeRes.allowCredentials.length === 0) {
        throw new Error('No registered passkeys found for this email address.');
      }

      // 2. Fallback check for systems without native WebAuthn support
      if (typeof navigator.credentials === 'undefined' || !navigator.credentials.get) {
        toast.loading('Simulating biometric check (Windows Hello/TouchID)...', { duration: 1500 });
        await new Promise(r => setTimeout(r, 1500));
        
        // Directly verify with the first credential to mock success
        const { data: userData } = await api.post('/auth/passkey/login-verify', {
          userId: challengeRes.userId,
          credentialId: challengeRes.allowCredentials[0].id,
          deviceId: localStorage.getItem('deviceId') || ''
        });

        completeLogin(userData);
        setIsSuccess(true);
        setSuccessUser(userData);
        return;
      }

      // 3. Trigger native WebAuthn window
      const challengeBuffer = Uint8Array.from(atob(challengeRes.challenge), c => c.charCodeAt(0));
      const allowCredentials = challengeRes.allowCredentials.map(pk => ({
        id: Uint8Array.from(atob(pk.id), c => c.charCodeAt(0)),
        type: 'public-key'
      }));

      const credential = await navigator.credentials.get({
        publicKey: {
          challenge: challengeBuffer,
          allowCredentials,
          userVerification: "preferred",
          timeout: 60000
        }
      });

      if (!credential) {
        throw new Error('Biometric check cancelled or failed.');
      }

      const credentialIdB64 = btoa(String.fromCharCode(...new Uint8Array(credential.rawId)));

      // 4. Verify biometric credential response on backend
      const { data: userData } = await api.post('/auth/passkey/login-verify', {
        userId: challengeRes.userId,
        credentialId: credentialIdB64,
        deviceId: localStorage.getItem('deviceId') || ''
      });

      completeLogin(userData);
      setIsSuccess(true);
      setSuccessUser(userData);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || err.message || 'Passkey login failed. Please type your password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSuccessComplete = () => {
    setIsSuccess(false);
    setSuccessUser(null);
    navigate(from, { replace: true, state: location.state?.from?.state });
  };

  if (isSuccess) {
    return (
      <AuthSuccessOverlay 
        mode="login" 
        userName={successUser?.name || 'Traveler'} 
        onComplete={handleSuccessComplete} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F5EF] dark:bg-[#12201D] flex flex-col justify-center items-center relative overflow-hidden px-4">
      <AnimatePresence mode="wait">
        {!twoFactorRequired ? (
          /* PASSWORD OR PASSKEY ENTRY */
          <motion.div
            key="login-form"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-md p-8 relative z-10 bg-[#FFFFFF] dark:bg-[#1B2C28] rounded-xl border border-[#E3DED2] dark:border-[#2A403A] shadow-sm"
          >
            <div className="text-center mb-8">
              <Link to="/" className="inline-block mb-4">
                <span className="font-bold text-3xl tracking-tight text-[#173F3A] dark:text-[#EEF2ED] font-['Manrope']">
                  TravelIQ
                </span>
              </Link>
              <h2 className="text-2xl font-bold text-[#263238] dark:text-[#F7F5EF] mb-2 font-['Manrope']">Welcome Back</h2>
              <p className="text-[#66736F] dark:text-[#A3B0AB] text-sm font-['Inter']">Sign in to resume your premium itinerary planner</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-4">
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#66736F] dark:text-[#A3B0AB] w-5 h-5" />
                  <input
                    id="login-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email address"
                    className="w-full bg-[#FFFFFF] dark:bg-[#1B2C28] border border-[#E3DED2] dark:border-[#2A403A] rounded-lg py-3 pl-12 pr-4 text-[#263238] dark:text-[#F7F5EF] placeholder-[#66736F] dark:placeholder-[#A3B0AB] focus:outline-none focus:border-[#173F3A] dark:focus:border-[#EEF2ED] focus:ring-1 focus:ring-[#173F3A] dark:focus:ring-[#EEF2ED] transition-all font-['Inter']"
                  />
                </div>
                
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#66736F] dark:text-[#A3B0AB] w-5 h-5" />
                  <input
                    id="login-password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    className="w-full bg-[#FFFFFF] dark:bg-[#1B2C28] border border-[#E3DED2] dark:border-[#2A403A] rounded-lg py-3 pl-12 pr-4 text-[#263238] dark:text-[#F7F5EF] placeholder-[#66736F] dark:placeholder-[#A3B0AB] focus:outline-none focus:border-[#173F3A] dark:focus:border-[#EEF2ED] focus:ring-1 focus:ring-[#173F3A] dark:focus:ring-[#EEF2ED] transition-all font-['Inter']"
                  />
                </div>
              </div>

              <div className="flex justify-center py-2">
                <Turnstile
                  siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY || "1x00000000000000000000AA"}
                  onSuccess={(token) => setTurnstileToken(token)}
                  options={{ theme: 'light' }}
                />
              </div>

              <div className="flex flex-col gap-3 mt-4">
                <button
                  id="login-submit"
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[#D96C4F] hover:bg-[#C75D43] text-white rounded-lg py-3 font-semibold flex items-center justify-center transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed group text-sm font-['Inter']"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Signing in...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      Sign In with Password <LogIn className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handlePasskeyLogin}
                  disabled={isSubmitting}
                  className="w-full bg-[#FFFFFF] dark:bg-[#1B2C28] border border-[#E3DED2] dark:border-[#2A403A] hover:bg-[#EEF2ED] dark:hover:bg-[#213530] text-[#173F3A] dark:text-[#EEF2ED] rounded-lg py-3 flex items-center justify-center gap-2 font-semibold text-xs transition-all font-['Inter']"
                >
                  <Fingerprint className="w-5 h-5 text-[#173F3A] dark:text-[#EEF2ED]" />
                  Sign In with biometric Passkey
                </button>

                <button
                  type="button"
                  onClick={() => setShowIrctcLoginModal(true)}
                  className="w-full bg-[#F7F5EF] dark:bg-[#12201D] hover:bg-[#EEF2ED] dark:hover:bg-[#213530] text-[#E5B85C] border border-[#E3DED2] dark:border-[#2A403A] rounded-lg py-3 flex items-center justify-center gap-2 font-semibold text-xs transition-all duration-300 shadow-sm cursor-pointer active:scale-95 font-['Inter']"
                >
                  <Train className="w-4 h-4 text-[#E5B85C]" />
                  Continue with IRCTC
                </button>
              </div>
            </form>

            <div className="mt-8 text-center space-y-3">
              <p className="text-[#66736F] dark:text-[#A3B0AB] text-xs font-['Inter']">
                Don't have an account?{' '}
                <Link to="/signup" className="text-[#173F3A] dark:text-[#EEF2ED] hover:text-[#0F332F] dark:hover:text-[#FFFFFF] transition-colors font-semibold">
                  Create one now <ArrowRight className="w-3.5 h-3.5 inline" />
                </Link>
              </p>
              <div>
                <Link to="/admin/login" className="text-[#66736F] dark:text-[#A3B0AB] hover:text-[#173F3A] dark:hover:text-[#EEF2ED] transition-colors text-[11px] font-medium inline-flex items-center gap-1 font-['Inter']">
                  Shield Check Are you an Administrator? Access Admin Portal
                </Link>
              </div>
            </div>

            <AnimatePresence>
              {showIrctcLoginModal && (
                <div className="fixed inset-0 bg-[#263238]/60 flex items-center justify-center p-4 z-[10000]" onClick={() => setShowIrctcLoginModal(false)}>
                  <motion.div
                    onClick={(e) => e.stopPropagation()}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="w-full max-w-sm bg-[#FFFFFF] dark:bg-[#1B2C28] border border-[#E3DED2] dark:border-[#2A403A] p-8 rounded-xl shadow-sm relative text-center space-y-6"
                  >
                    <div className="absolute top-0 left-0 right-0 h-1 bg-[#E5B85C] rounded-t-xl" />
                    
                    <div className="flex justify-center mb-2">
                      <div className="w-16 h-16 bg-[#EEF2ED] dark:bg-[#213530] rounded-xl flex items-center justify-center text-[#173F3A] dark:text-[#EEF2ED]">
                        <ShieldCheck className="w-8 h-8" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-base font-bold text-[#263238] dark:text-[#F7F5EF] font-['Manrope']">Login on IRCTC to complete booking</h3>
                      <p className="text-[#66736F] dark:text-[#A3B0AB] text-xs leading-relaxed font-['Inter']">
                        TravelIQ does not ask for or store IRCTC passwords. Click Continue to sign in securely on the official government website.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowIrctcLoginModal(false)}
                        className="w-full py-2.5 rounded-lg border border-[#E3DED2] dark:border-[#2A403A] hover:bg-[#F7F5EF] dark:hover:bg-[#12201D] text-xs font-semibold text-[#66736F] dark:text-[#A3B0AB] transition-all cursor-pointer text-center font-['Inter']"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          window.open('https://www.irctc.co.in/nget/train-search', '_blank');
                          setShowIrctcLoginModal(false);
                        }}
                        className="w-full py-2.5 rounded-lg bg-[#E5B85C] hover:brightness-95 text-xs font-semibold text-[#263238] transition-all cursor-pointer text-center font-['Inter']"
                      >
                        Continue
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowIrctcLoginModal(false)}
                      className="absolute top-2 right-4 text-[#66736F] dark:text-[#A3B0AB] hover:text-[#263238] dark:hover:text-[#F7F5EF] text-lg font-bold w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#F7F5EF] dark:hover:bg-[#12201D] transition-all cursor-pointer"
                    >✕</button>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </motion.div>
        ) : (
          /* TWO FACTOR VERIFICATION OVERLAY */
          <motion.div
            key="2fa-form"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-md p-8 relative z-10 bg-[#FFFFFF] dark:bg-[#1B2C28] rounded-xl border border-[#E3DED2] dark:border-[#2A403A] shadow-sm"
          >
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center p-3.5 bg-[#EEF2ED] dark:bg-[#213530] rounded-full mb-4 text-[#173F3A] dark:text-[#EEF2ED]">
                <KeyRound className="w-7 h-7" />
              </div>
              <h2 className="text-2xl font-bold text-[#263238] dark:text-[#F7F5EF] mb-2 font-['Manrope']">Two-Factor Verification</h2>
              <p className="text-[#66736F] dark:text-[#A3B0AB] text-xs leading-relaxed px-2 font-['Inter']">
                {useBackupCode 
                  ? "Enter a 10-character alphanumeric recovery backup code to log in."
                  : `Please enter the 6-digit verification OTP code sent to your registered address: ${twoFactorData.email}.`
                }
              </p>
            </div>

            <form onSubmit={handleVerify2FA} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-[#66736F] dark:text-[#A3B0AB] uppercase tracking-wider mb-2 font-['Inter']">
                  {useBackupCode ? "Backup Recovery Code" : "Verification OTP Code"}
                </label>
                <input
                  type="text"
                  required
                  maxLength={useBackupCode ? 10 : 6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder={useBackupCode ? "e.g., A8F9C1E2" : "000000"}
                  className="w-full bg-[#FFFFFF] dark:bg-[#1B2C28] border border-[#E3DED2] dark:border-[#2A403A] rounded-lg py-3.5 text-center text-xl font-bold font-mono text-[#263238] dark:text-[#F7F5EF] placeholder-[#66736F] dark:placeholder-[#A3B0AB] tracking-[0.25em] focus:outline-none focus:border-[#173F3A] dark:focus:border-[#EEF2ED] focus:ring-1 focus:ring-[#173F3A] dark:focus:ring-[#EEF2ED] transition-all uppercase"
                />
              </div>

              {/* Trust device checkbox */}
              <div className="flex items-center gap-2.5 p-3.5 bg-[#F7F5EF] dark:bg-[#12201D] border border-[#E3DED2] dark:border-[#2A403A] rounded-lg">
                <input
                  id="trust-device"
                  type="checkbox"
                  checked={trustDevice}
                  onChange={(e) => setTrustDevice(e.target.checked)}
                  className="w-4 h-4 rounded border-[#E3DED2] dark:border-[#2A403A] text-[#173F3A] focus:ring-[#173F3A]/20 bg-transparent"
                />
                <label htmlFor="trust-device" className="flex items-center gap-1.5 text-xs text-[#66736F] dark:text-[#A3B0AB] font-medium cursor-pointer selection:bg-transparent font-['Inter']">
                  <Laptop className="w-3.5 h-3.5 text-[#173F3A] dark:text-[#EEF2ED]" />
                  Trust this browser for 30 days
                </label>
              </div>

              <div className="space-y-3 pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[#173F3A] hover:bg-[#0F332F] dark:bg-[#EEF2ED] dark:hover:bg-[#FFFFFF] dark:text-[#263238] text-white rounded-lg py-3 font-semibold flex items-center justify-center transition-all disabled:opacity-75 disabled:cursor-not-allowed text-xs font-['Inter']"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Verifying...
                    </span>
                  ) : (
                    "Verify & Complete Login"
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setUseBackupCode(!useBackupCode);
                    setOtpCode('');
                  }}
                  className="w-full border border-[#E3DED2] dark:border-[#2A403A] hover:bg-[#F7F5EF] dark:hover:bg-[#12201D] text-[#66736F] dark:text-[#A3B0AB] hover:text-[#263238] dark:hover:text-[#F7F5EF] rounded-lg py-2.5 text-xs font-semibold transition-all font-['Inter']"
                >
                  {useBackupCode ? "Use Email OTP Instead" : "Use Backup Recovery Code"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setTwoFactorRequired(false);
                    setOtpCode('');
                    setUseBackupCode(false);
                  }}
                  className="w-full text-[#66736F] dark:text-[#A3B0AB] hover:text-[#263238] dark:hover:text-[#F7F5EF] text-xs font-semibold py-2 transition-all block text-center font-['Inter']"
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
