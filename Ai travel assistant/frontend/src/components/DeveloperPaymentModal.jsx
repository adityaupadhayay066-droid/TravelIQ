import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CreditCard, Smartphone, Building2, Zap, Shield, CheckCircle2, 
  XCircle, Copy, Check, Download, ArrowRight, RefreshCw, 
  AlertCircle, Lock, Sparkles, Terminal, Key, FileText, ChevronRight,
  ShieldCheck, SmartphoneNfc, KeyRound, ArrowLeft, Clock
} from 'lucide-react';
import QRCode from 'qrcode';
import toast from 'react-hot-toast';
import { api } from '../utils/api';

export default function DeveloperPaymentModal({ isOpen, onClose, item, org, onPaymentSuccess }) {
  const [activeTab, setActiveTab] = useState('card'); // 'card', 'upi', 'netbanking', 'sandbox'
  const [modalStage, setModalStage] = useState('selection'); // 'selection', 'initiating', 'verification', 'processing', 'success', 'failed'
  const [isSuccessMode, setIsSuccessMode] = useState(true);
  const [progress, setProgress] = useState(0);
  const [processingStep, setProcessingStep] = useState('');
  
  // Verification / 2FA State
  const [orderData, setOrderData] = useState(null);
  const [otpValue, setOtpValue] = useState(['8', '4', '9', '2', '0', '1']);
  const [otpError, setOtpError] = useState('');
  const [resendTimer, setResendTimer] = useState(45);
  const [isVerifying, setIsVerifying] = useState(false);
  const [transactionResult, setTransactionResult] = useState(null);

  // Card fields
  const [cardNumber, setCardNumber] = useState('4242 4242 4242 4242');
  const [cardHolder, setCardHolder] = useState(org?.name || 'Developer Workspace');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvv, setCardCvv] = useState('892');

  // UPI fields
  const [upiId, setUpiId] = useState('developer@okaxis');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [qrCountdown, setQrCountdown] = useState(300);

  // Net Banking fields
  const [selectedBank, setSelectedBank] = useState('HDFC');

  // Sandbox fields
  const [sandboxToken, setSandboxToken] = useState('tiq_test_token_' + Math.random().toString(36).substring(2, 10));

  const [copiedTxn, setCopiedTxn] = useState(false);
  const canvasRef = useRef(null);
  const otpInputRefs = [useRef(null), useRef(null), useRef(null), useRef(null), useRef(null), useRef(null)];

  const priceNum = item?.priceNumber ?? (typeof item?.price === 'string' ? parseFloat(item.price.replace(/[^\d.]/g, '')) || 0 : (item?.price || 0));
  const isTopUp = item?.type === 'topup';
  const taxAmount = Math.round(priceNum * 0.18 * 100) / 100;
  const totalAmount = Math.round((priceNum + taxAmount) * 100) / 100;
  const inrEquivalent = Math.round(totalAmount * 86.5);

  // Reset states on open
  useEffect(() => {
    if (isOpen) {
      setModalStage('selection');
      setOtpValue(['8', '4', '9', '2', '0', '1']);
      setOtpError('');
      setTransactionResult(null);
      setProgress(0);
    }
  }, [isOpen]);

  // Generate QR Code for UPI
  useEffect(() => {
    if (isOpen && activeTab === 'upi') {
      const upiPayload = `upi://pay?pa=traveliq.developers@mockpay&pn=TravelIQ+AI+Developer+Platform&am=${inrEquivalent}&cu=INR&tn=${encodeURIComponent((item?.name || 'API Plan') + ' Subscription')}`;
      QRCode.toDataURL(upiPayload, {
        width: 200,
        margin: 1,
        color: { dark: '#173F3A', light: '#FFFFFF' }
      }).then(url => setQrCodeUrl(url)).catch(console.error);
    }
  }, [isOpen, activeTab, item, inrEquivalent]);

  // Resend OTP Countdown
  useEffect(() => {
    let interval;
    if (modalStage === 'verification' && resendTimer > 0) {
      interval = setInterval(() => setResendTimer(prev => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [modalStage, resendTimer]);

  // Confetti Animation on Verified Success
  useEffect(() => {
    if (modalStage === 'success' && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      canvas.width = canvas.parentElement.clientWidth;
      canvas.height = canvas.parentElement.clientHeight;

      let particles = [];
      const colors = ['#10B981', '#34D399', '#6EE7B7', '#F59E0B', '#3B82F6', '#6366F1'];

      for (let i = 0; i < 90; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height - canvas.height,
          r: Math.random() * 5 + 3,
          d: Math.random() * canvas.height,
          color: colors[Math.floor(Math.random() * colors.length)],
          tilt: Math.random() * 10 - 5,
          tiltAngle: 0,
          tiltAngleInc: Math.random() * 0.08 + 0.03
        });
      }

      let animId;
      const draw = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        let active = false;
        particles.forEach((p) => {
          p.tiltAngle += p.tiltAngleInc;
          p.y += (Math.cos(p.d) + 3 + p.r / 2) / 2;
          p.x += Math.sin(p.tiltAngle);
          if (p.y < canvas.height) active = true;

          ctx.beginPath();
          ctx.lineWidth = p.r;
          ctx.strokeStyle = p.color;
          ctx.moveTo(p.x + p.tilt + p.r / 2, p.y);
          ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 2);
          ctx.stroke();
        });
        if (active) animId = requestAnimationFrame(draw);
      };
      draw();
      return () => cancelAnimationFrame(animId);
    }
  }, [modalStage]);

  if (!isOpen || !item) return null;

  // Step 1: Initiate Payment and Request 2FA / 3D-Secure Challenge
  const handleInitiatePayment = async () => {
    // Client validations
    if (activeTab === 'card') {
      const cleanNum = cardNumber.replace(/\s/g, '');
      if (cleanNum.length < 15) {
        toast.error('Please enter a valid card number');
        return;
      }
      if (!cardHolder.trim()) {
        toast.error('Please enter the cardholder name');
        return;
      }
      if (cardExpiry.length !== 5) {
        toast.error('Please enter valid expiry (MM/YY)');
        return;
      }
      if (cardCvv.length < 3) {
        toast.error('Please enter valid 3-digit CVV');
        return;
      }
    }

    if (activeTab === 'upi' && (!upiId.includes('@') || upiId.length < 5)) {
      toast.error('Please enter a valid UPI ID (e.g. name@okaxis)');
      return;
    }

    // If Developer Sandbox bypass is chosen, direct verify bypass
    if (activeTab === 'sandbox') {
      executeVerification(null, '849201', true);
      return;
    }

    setModalStage('initiating');
    setProcessingStep('Connecting to Banking Gateway & Generating 3D Secure 2FA Challenge...');

    try {
      const initRes = await api.post('/developer/payment/initiate', {
        plan_tier: isTopUp ? undefined : item.key,
        top_up_quota: isTopUp ? item.quotaCount : undefined,
        top_up_name: item.name,
        payment_method: activeTab.toUpperCase(),
        amount: totalAmount
      });

      if (initRes.data.success) {
        setOrderData(initRes.data);
        setResendTimer(45);
        setOtpError('');
        setTimeout(() => {
          setModalStage('verification');
          toast.success('📱 3D Secure 2FA Challenge sent to registered phone & email');
        }, 800);
      } else {
        toast.error(initRes.data.error || 'Failed to initiate payment');
        setModalStage('selection');
      }
    } catch (err) {
      console.error('[Payment Initiate Error]:', err);
      toast.error(err.response?.data?.error || 'Failed to initiate payment session');
      setModalStage('selection');
    }
  };

  // Step 2: Handle OTP input changes
  const handleOtpChange = (index, value) => {
    const clean = value.replace(/\D/g, '');
    const newOtp = [...otpValue];
    newOtp[index] = clean ? clean.slice(-1) : '';
    setOtpValue(newOtp);
    setOtpError('');

    if (clean && index < 5 && otpInputRefs[index + 1].current) {
      otpInputRefs[index + 1].current.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpValue[index] && index > 0 && otpInputRefs[index - 1].current) {
      otpInputRefs[index - 1].current.focus();
    }
  };

  // Step 3: Execute Payment Verification with Backend
  const executeVerification = async (e, forcedCode = null, bypass = false) => {
    if (e) e.preventDefault();
    const code = forcedCode || otpValue.join('');

    if (!bypass && code.length < 6) {
      setOtpError('Please enter all 6 digits of the verification code.');
      return;
    }

    setIsVerifying(true);
    setModalStage('processing');
    setProgress(20);
    setProcessingStep('1/4: Authenticating 2FA cryptographic signature...');

    const step1 = setTimeout(() => {
      setProgress(50);
      setProcessingStep('2/4: Verifying bank settlement authorization...');
    }, 600);

    const step2 = setTimeout(() => {
      setProgress(80);
      setProcessingStep('3/4: Activating developer plan tier & quotas...');
    }, 1200);

    const step3 = setTimeout(async () => {
      setProgress(100);
      setProcessingStep('4/4: Generating signed digital tax receipt...');

      if (!isSuccessMode) {
        setModalStage('failed');
        setIsVerifying(false);
        toast.error('❌ Verification Failed: Simulated banking rejection (Developer Force Failure Mode Active).');
        return;
      }

      try {
        const verifyRes = await api.post('/developer/payment/verify', {
          order_id: orderData?.order_id,
          verification_code: code,
          force_bypass: bypass,
          plan_tier: isTopUp ? undefined : item.key,
          top_up_quota: isTopUp ? item.quotaCount : undefined,
          payment_details: {
            payment_method: activeTab.toUpperCase(),
            amount: totalAmount,
            card_last4: activeTab === 'card' ? cardNumber.slice(-4) : undefined,
            upi_id: activeTab === 'upi' ? upiId : undefined,
            bank: activeTab === 'netbanking' ? selectedBank : undefined
          }
        });

        if (verifyRes.data.success && verifyRes.data.verified) {
          const resultData = {
            transactionId: verifyRes.data.transaction_id || `TIQ-DEV-VERIFIED-${Date.now()}`,
            bankAuthCode: verifyRes.data.bank_auth_code || `AUTH-${Math.floor(100000 + Math.random() * 900000)}`,
            digitalSignature: verifyRes.data.digital_signature || 'SHA256_VERIFIED_AUTHENTIC',
            timestamp: new Date().toISOString(),
            item: item,
            amount: totalAmount,
            subtotal: priceNum,
            tax: taxAmount,
            method: activeTab.toUpperCase(),
            orgName: org?.name || 'Developer Workspace'
          };

          setTransactionResult(resultData);
          setModalStage('success');
          setIsVerifying(false);
          toast.success('🎉 Payment Verified! Developer Plan is now ACTIVE.');
          if (onPaymentSuccess) {
            onPaymentSuccess(resultData);
          }
        } else {
          setModalStage('verification');
          setOtpError(verifyRes.data.error || 'Invalid verification code');
          setIsVerifying(false);
          toast.error(verifyRes.data.error || 'Verification failed');
        }
      } catch (err) {
        console.error('[Payment Verification Error]:', err);
        setModalStage('verification');
        setOtpError(err.response?.data?.error || 'Invalid verification code. Please try 849201.');
        setIsVerifying(false);
        toast.error(err.response?.data?.error || 'Verification failed');
      }
    }, 1800);

    return () => {
      clearTimeout(step1);
      clearTimeout(step2);
      clearTimeout(step3);
    };
  };

  // Auto-Fill Test OTP
  const autoFillTestOtp = () => {
    setOtpValue(['8', '4', '9', '2', '0', '1']);
    setOtpError('');
    toast.success('⚡ Test 2FA OTP 849201 Loaded');
  };

  // Printable Invoice
  const handleDownloadInvoice = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Pop-up blocked. Please allow pop-ups to print the invoice.');
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>TravelIQ Developer API Verified Invoice - ${transactionResult?.transactionId}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; color: #1e293b; background: #fff; line-height: 1.5; }
          .header { display: flex; justify-content: space-between; border-bottom: 2px solid #e2e8f0; padding-bottom: 24px; margin-bottom: 30px; }
          .logo { font-size: 24px; font-weight: 800; color: #173F3A; }
          .badge { display: inline-block; background: #dcfce7; color: #166534; padding: 4px 12px; border-radius: 999px; font-size: 12px; font-weight: 700; border: 1px solid #86efac; }
          .table { width: 100%; border-collapse: collapse; margin: 30px 0; }
          .table th { background: #f8fafc; text-align: left; padding: 12px; font-size: 12px; text-transform: uppercase; border-bottom: 1px solid #cbd5e1; }
          .table td { padding: 14px 12px; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
          .totals { margin-left: auto; width: 320px; }
          .totals-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px; }
          .totals-row.bold { font-weight: 800; font-size: 18px; border-top: 2px solid #1e293b; padding-top: 10px; margin-top: 10px; }
          .security-seal { background: #f8fafc; border: 1px solid #cbd5e1; padding: 15px; border-radius: 8px; margin: 25px 0; font-size: 11px; font-family: monospace; }
          .footer { margin-top: 40px; padding-top: 20px; border-top: 1px dashed #cbd5e1; font-size: 12px; color: #64748b; text-align: center; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="logo">TravelIQ API Hub</div>
            <p style="margin: 4px 0 0 0; font-size: 13px; color: #64748b;">Autonomous AI Travel Intelligence Platform</p>
            <p style="margin: 2px 0 0 0; font-size: 12px; color: #94a3b8;">Tax Invoice & Cryptographically Verified License</p>
          </div>
          <div style="text-align: right;">
            <div class="badge">✓ 2FA 3D-SECURE VERIFIED & PAID</div>
            <p style="margin: 8px 0 2px 0; font-size: 13px; font-weight: 700;">Invoice #: ${transactionResult?.transactionId}</p>
            <p style="margin: 0; font-size: 12px; color: #64748b;">Auth Code: ${transactionResult?.bankAuthCode}</p>
            <p style="margin: 0; font-size: 12px; color: #64748b;">Date: ${new Date(transactionResult?.timestamp || Date.now()).toLocaleString()}</p>
          </div>
        </div>

        <div style="display: flex; justify-content: space-between; margin-bottom: 24px; font-size: 13px;">
          <div>
            <strong style="color: #64748b; text-transform: uppercase; font-size: 11px;">Billed To:</strong>
            <p style="font-weight: 700; margin: 4px 0 2px 0;">${transactionResult?.orgName}</p>
            <p style="margin: 0; color: #64748b;">Developer Org ID: ${org?.id || 'TIQ-ORG-DEV'}</p>
          </div>
          <div style="text-align: right;">
            <strong style="color: #64748b; text-transform: uppercase; font-size: 11px;">Verification Method:</strong>
            <p style="font-weight: 700; margin: 4px 0 2px 0;">${transactionResult?.method} (Two-Factor 3DS Authenticated)</p>
            <p style="margin: 0; color: #16a34a; font-weight: 600;">Plan Status: ACTIVE & PROVISIONED</p>
          </div>
        </div>

        <table class="table">
          <thead>
            <tr>
              <th>Item Description</th>
              <th>Quota / Limits</th>
              <th>Period</th>
              <th style="text-align: right;">Amount (USD)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <strong>${item.name}</strong>
                <div style="font-size: 12px; color: #64748b;">Production AI Endpoints (Delay, Fare, Crowd, Routing)</div>
              </td>
              <td>${item.quota || (item.quotaCount ? `${item.quotaCount.toLocaleString()} calls` : 'Standard')}</td>
              <td>${item.period || 'One-time Top-Up'}</td>
              <td style="text-align: right; font-weight: 600;">$${transactionResult?.subtotal.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>

        <div class="totals">
          <div class="totals-row">
            <span>Subtotal:</span>
            <span>$${transactionResult?.subtotal.toFixed(2)}</span>
          </div>
          <div class="totals-row">
            <span>GST / VAT (18%):</span>
            <span>$${transactionResult?.tax.toFixed(2)}</span>
          </div>
          <div class="totals-row bold">
            <span>Total Settled:</span>
            <span>$${transactionResult?.amount.toFixed(2)}</span>
          </div>
        </div>

        <div class="security-seal">
          <strong>🔒 2FA Cryptographic Proof & Authorization Stamp:</strong><br/>
          Digital Signature: ${transactionResult?.digitalSignature}<br/>
          Gateway Reference: ${transactionResult?.transactionId} | Authorization: ${transactionResult?.bankAuthCode}
        </div>

        <div class="footer">
          <p>This is a verified sandbox transaction invoice. Thank you for building on TravelIQ AI Platform!</p>
        </div>
      </body>
      </html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 300);
  };

  const copyTxn = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedTxn(true);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopiedTxn(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-md overflow-y-auto">
      
      {/* Dev Controller Toggle Banner */}
      <div className="fixed top-4 left-4 z-50 bg-white/95 dark:bg-[#1B2C28]/95 backdrop-blur-md border border-[#E3DED2] dark:border-[#2A403A] px-3.5 py-1.5 rounded-full flex items-center gap-2.5 shadow-lg">
        <span className="text-[10px] uppercase font-bold tracking-wider text-[#66736F] dark:text-[#A3B0AB]">
          🛠️ Verification Mode:
        </span>
        <button
          type="button"
          onClick={() => setIsSuccessMode(!isSuccessMode)}
          className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold transition-all ${
            isSuccessMode 
              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800' 
              : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
          }`}
        >
          {isSuccessMode ? '🟢 FORCE SUCCESS' : '🔴 FORCE FAILURE'}
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="relative w-full max-w-4xl bg-white dark:bg-[#1B2C28] border border-[#E3DED2] dark:border-[#2A403A] rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row my-auto"
      >
        {/* Canvas Confetti */}
        {modalStage === 'success' && (
          <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-50" />
        )}

        {/* LEFT PANE: Plan Summary & Pricing Breakdown */}
        <div className="w-full md:w-5/12 bg-[#F7F5EF] dark:bg-[#12201D] p-6 sm:p-7 border-b md:border-b-0 md:border-r border-[#E3DED2] dark:border-[#2A403A] flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-8 h-8 rounded-xl bg-[#173F3A] dark:bg-[#EEF2ED] text-white dark:text-[#173F3A] flex items-center justify-center font-bold text-sm shadow">
                TIQ
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#173F3A] dark:text-[#EEF2ED] leading-none">TravelIQ Developer Checkout</h4>
                <span className="text-[11px] text-[#66736F] dark:text-[#A3B0AB]">2FA Payment Verification</span>
              </div>
            </div>

            {/* Selected Product Card */}
            <div className="bg-white dark:bg-[#1B2C28] border border-[#E3DED2] dark:border-[#2A403A] rounded-2xl p-4 sm:p-5 shadow-sm space-y-3 mb-5">
              <div className="flex justify-between items-start">
                <div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                    {isTopUp ? 'Quota Booster Pack' : 'Monthly Subscription'}
                  </span>
                  <h3 className="font-bold text-base mt-1.5 text-[#173F3A] dark:text-[#EEF2ED]">{item.name}</h3>
                </div>
                <div className="text-right font-mono">
                  <div className="text-xl font-black text-[#173F3A] dark:text-[#EEF2ED]">${priceNum}</div>
                  <div className="text-[10px] text-[#66736F] dark:text-[#A3B0AB]">/{item.period || 'pack'}</div>
                </div>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-[#E3DED2] dark:border-[#2A403A] text-xs text-[#66736F] dark:text-[#A3B0AB]">
                {item.quota && (
                  <div className="flex justify-between">
                    <span>⚡ API Quota:</span>
                    <span className="font-semibold text-[#173F3A] dark:text-[#EEF2ED]">{item.quota}</span>
                  </div>
                )}
                {item.rateLimit && (
                  <div className="flex justify-between">
                    <span>⏱️ Rate Limit:</span>
                    <span className="font-semibold text-[#173F3A] dark:text-[#EEF2ED]">{item.rateLimit}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>🏢 Organization:</span>
                  <span className="font-semibold truncate max-w-[150px] text-[#173F3A] dark:text-[#EEF2ED]">{org?.name || 'Workspace'}</span>
                </div>
              </div>
            </div>

            {/* Price breakdown */}
            <div className="bg-white/60 dark:bg-[#1B2C28]/60 border border-[#E3DED2] dark:border-[#2A403A] rounded-2xl p-4 space-y-2 text-xs">
              <div className="flex justify-between text-[#66736F] dark:text-[#A3B0AB]">
                <span>Base Tier Price</span>
                <span className="font-mono">${priceNum.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[#66736F] dark:text-[#A3B0AB]">
                <span>Estimated Tax (18% GST/VAT)</span>
                <span className="font-mono">${taxAmount.toFixed(2)}</span>
              </div>
              <div className="pt-2 border-t border-[#E3DED2] dark:border-[#2A403A] flex justify-between items-center text-sm font-bold text-[#173F3A] dark:text-[#EEF2ED]">
                <span>Total Due Now</span>
                <div className="text-right">
                  <span className="font-mono text-base">${totalAmount.toFixed(2)}</span>
                  <span className="block text-[10px] font-normal text-[#66736F] dark:text-[#A3B0AB]">≈ ₹{inrEquivalent.toLocaleString()} INR</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-[#E3DED2] dark:border-[#2A403A] flex items-center gap-2 text-[11px] text-[#66736F] dark:text-[#A3B0AB]">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            <span>3D-Secure 2.0 & RBI Verified Two-Factor Authentication Gateway</span>
          </div>
        </div>

        {/* RIGHT PANE: Multi-Step Verification Workflow */}
        <div className="w-full md:w-7/12 p-6 sm:p-7 flex flex-col justify-between relative min-h-[490px]">
          
          {/* Close button */}
          {modalStage !== 'processing' && modalStage !== 'initiating' && (
            <button
              onClick={onClose}
              className="absolute top-5 right-5 text-[#66736F] dark:text-[#A3B0AB] hover:text-[#173F3A] dark:hover:text-white p-1.5 rounded-full hover:bg-[#F7F5EF] dark:hover:bg-[#12201D] transition-colors z-20"
            >
              ✕
            </button>
          )}

          {/* STAGE 1: SELECTION */}
          {modalStage === 'selection' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-lg font-bold text-[#173F3A] dark:text-[#EEF2ED]">Choose Payment Channel</h3>
                <p className="text-xs text-[#66736F] dark:text-[#A3B0AB]">Enter your payment details. You will be prompted for 3D Secure / 2FA verification on the next step.</p>
              </div>

              {/* Payment Tabs */}
              <div className="grid grid-cols-4 gap-1.5 bg-[#F7F5EF] dark:bg-[#12201D] p-1 rounded-2xl border border-[#E3DED2] dark:border-[#2A403A]">
                {[
                  { id: 'card', label: '💳 Card' },
                  { id: 'upi', label: '📱 UPI / QR' },
                  { id: 'netbanking', label: '🏦 NetBank' },
                  { id: 'sandbox', label: '⚡ Bypass' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-2 px-1 text-xs font-semibold rounded-xl transition-all ${
                      activeTab === tab.id
                        ? 'bg-white dark:bg-[#1B2C28] text-[#173F3A] dark:text-[#EEF2ED] shadow-sm font-bold'
                        : 'text-[#66736F] dark:text-[#A3B0AB] hover:text-[#173F3A]'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* TAB 1: CARD */}
              {activeTab === 'card' && (
                <div className="space-y-4">
                  {/* Card graphic preview */}
                  <div className="bg-gradient-to-tr from-[#173F3A] via-[#1E4D47] to-[#2E6B63] p-4 rounded-2xl text-white shadow-md relative overflow-hidden text-xs font-mono">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-[10px] tracking-widest uppercase font-bold text-white/70">3D Secure Verified Card</span>
                      <CreditCard className="w-5 h-5 text-emerald-300" />
                    </div>
                    <div className="text-base sm:text-lg font-bold tracking-widest mb-3">
                      {cardNumber || '•••• •••• •••• ••••'}
                    </div>
                    <div className="flex justify-between items-end">
                      <div>
                        <div className="text-[9px] uppercase text-white/60">Card Holder</div>
                        <div className="font-semibold text-xs truncate max-w-[170px] uppercase font-sans">{cardHolder || 'DEVELOPER'}</div>
                      </div>
                      <div>
                        <div className="text-[9px] uppercase text-white/60">Expires</div>
                        <div className="font-semibold text-xs">{cardExpiry || 'MM/YY'}</div>
                      </div>
                    </div>
                  </div>

                  {/* Inputs */}
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-[#66736F] dark:text-[#A3B0AB] mb-1">Card Number</label>
                      <input
                        type="text"
                        value={cardNumber}
                        onChange={(e) => {
                          let input = e.target.value.replace(/\D/g, '');
                          let formatted = input.replace(/(\d{4})/g, '$1 ').trim();
                          if (formatted.length > 19) formatted = formatted.substring(0, 19);
                          setCardNumber(formatted);
                        }}
                        placeholder="4242 4242 4242 4242"
                        className="w-full px-3.5 py-2 text-xs font-mono rounded-xl border border-[#E3DED2] dark:border-[#2A403A] bg-[#F7F5EF] dark:bg-[#12201D] focus:outline-none focus:ring-2 focus:ring-[#173F3A]"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-[#66736F] dark:text-[#A3B0AB] mb-1">Expiry Date</label>
                        <input
                          type="text"
                          value={cardExpiry}
                          onChange={(e) => {
                            let input = e.target.value.replace(/\D/g, '');
                            if (input.length > 2) input = input.substring(0, 2) + '/' + input.substring(2, 4);
                            if (input.length > 5) input = input.substring(0, 5);
                            setCardExpiry(input);
                          }}
                          placeholder="MM/YY"
                          className="w-full px-3.5 py-2 text-xs font-mono rounded-xl border border-[#E3DED2] dark:border-[#2A403A] bg-[#F7F5EF] dark:bg-[#12201D] focus:outline-none focus:ring-2 focus:ring-[#173F3A]"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-[#66736F] dark:text-[#A3B0AB] mb-1">CVV</label>
                        <input
                          type="password"
                          value={cardCvv}
                          maxLength="4"
                          onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ''))}
                          placeholder="123"
                          className="w-full px-3.5 py-2 text-xs font-mono rounded-xl border border-[#E3DED2] dark:border-[#2A403A] bg-[#F7F5EF] dark:bg-[#12201D] focus:outline-none focus:ring-2 focus:ring-[#173F3A]"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: UPI */}
              {activeTab === 'upi' && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row items-center gap-4 bg-[#F7F5EF] dark:bg-[#12201D] p-4 rounded-2xl border border-[#E3DED2] dark:border-[#2A403A]">
                    {qrCodeUrl ? (
                      <div className="relative bg-white p-2 rounded-xl shadow-sm border border-[#E3DED2] flex-shrink-0">
                        <img src={qrCodeUrl} alt="UPI QR" className="w-24 h-24 object-contain" />
                        <div className="text-[9px] text-center font-bold text-[#173F3A] mt-1 font-mono">
                          ⏱️ {Math.floor(qrCountdown / 60)}:{(qrCountdown % 60).toString().padStart(2, '0')}
                        </div>
                      </div>
                    ) : (
                      <div className="w-24 h-24 bg-gray-200 animate-pulse rounded-xl" />
                    )}
                    <div className="space-y-1 text-center sm:text-left">
                      <span className="text-xs font-bold text-[#173F3A] dark:text-[#EEF2ED] block">Scan & Authenticate UPI</span>
                      <p className="text-[11px] text-[#66736F] dark:text-[#A3B0AB]">
                        After clicking proceed, enter your 6-digit UPI MPIN on the verification challenge screen.
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-[#66736F] dark:text-[#A3B0AB] mb-1">Enter UPI VPA ID</label>
                    <input
                      type="text"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      placeholder="developer@okaxis"
                      className="w-full px-3.5 py-2 text-xs font-mono rounded-xl border border-[#E3DED2] dark:border-[#2A403A] bg-[#F7F5EF] dark:bg-[#12201D] focus:outline-none focus:ring-2 focus:ring-[#173F3A]"
                    />
                  </div>
                </div>
              )}

              {/* TAB 3: NET BANKING */}
              {activeTab === 'netbanking' && (
                <div className="space-y-3">
                  <span className="block text-[10px] font-bold uppercase text-[#66736F] dark:text-[#A3B0AB]">Select Bank for SSO Verification</span>
                  <div className="grid grid-cols-3 gap-2">
                    {['HDFC', 'ICICI', 'SBI', 'AXIS', 'KOTAK', 'PNB'].map(bank => (
                      <button
                        key={bank}
                        type="button"
                        onClick={() => setSelectedBank(bank)}
                        className={`p-2 rounded-xl border text-center transition-all text-xs font-bold ${
                          selectedBank === bank
                            ? 'border-[#173F3A] dark:border-[#EEF2ED] bg-[#EEF2ED] dark:bg-[#213530] text-[#173F3A] dark:text-[#EEF2ED]'
                            : 'border-[#E3DED2] dark:border-[#2A403A] bg-white dark:bg-[#1B2C28] text-[#66736F] dark:text-[#A3B0AB]'
                        }`}
                      >
                        {bank} Bank
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 4: SANDBOX BYPASS */}
              {activeTab === 'sandbox' && (
                <div className="space-y-3 bg-[#F7F5EF] dark:bg-[#12201D] p-4 rounded-2xl border border-[#E3DED2] dark:border-[#2A403A]">
                  <div className="flex items-center gap-2 text-[#173F3A] dark:text-[#EEF2ED] font-bold text-xs">
                    <Terminal className="w-4 h-4 text-emerald-500" />
                    <span>Instant Direct Mock Webhook Token</span>
                  </div>
                  <p className="text-[11px] text-[#66736F] dark:text-[#A3B0AB]">
                    Directly bypass verification prompt and execute immediate webhook payment elevation.
                  </p>
                  <div className="bg-[#12201D] text-emerald-400 p-2 rounded-xl font-mono text-xs break-all">
                    {sandboxToken}
                  </div>
                </div>
              )}

              {/* Proceed to Authenticate */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleInitiatePayment}
                  className="w-full bg-[#173F3A] hover:bg-[#214F49] text-white dark:bg-[#EEF2ED] dark:text-[#173F3A] dark:hover:bg-white py-3 px-4 rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
                >
                  <ShieldCheck className="w-4 h-4" /> Proceed to 2FA Verification (${totalAmount.toFixed(2)})
                </button>
              </div>
            </div>
          )}

          {/* STAGE 2: INITIATING */}
          {modalStage === 'initiating' && (
            <div className="flex flex-col items-center justify-center flex-1 py-12 text-center space-y-4 animate-fade-in">
              <div className="w-12 h-12 border-4 border-[#173F3A]/20 dark:border-white/20 border-t-[#173F3A] dark:border-t-[#EEF2ED] rounded-full animate-spin" />
              <h4 className="text-sm font-bold text-[#173F3A] dark:text-[#EEF2ED]">Contacting Issuing Bank Gateway...</h4>
              <p className="text-xs text-[#66736F] dark:text-[#A3B0AB]">{processingStep}</p>
            </div>
          )}

          {/* STAGE 3: INTERACTIVE 3D SECURE / 2FA VERIFICATION CHALLENGE */}
          {modalStage === 'verification' && (
            <div className="space-y-4 animate-fade-in">
              {/* Bank Gateway Header */}
              <div className="bg-[#F7F5EF] dark:bg-[#12201D] p-3.5 rounded-2xl border border-[#E3DED2] dark:border-[#2A403A] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                    3DS
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#173F3A] dark:text-[#EEF2ED]">Verified by Visa / Mastercard ID Check</h4>
                    <span className="text-[10px] text-[#66736F] dark:text-[#A3B0AB]">RBI & PCI-DSS Compliant Gateway</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-[#66736F] dark:text-[#A3B0AB] block">Amount</span>
                  <span className="text-sm font-mono font-bold text-[#173F3A] dark:text-[#EEF2ED]">${totalAmount.toFixed(2)}</span>
                </div>
              </div>

              {/* 2FA Prompt */}
              <div className="text-center space-y-1 pt-1">
                <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-2">
                  <SmartphoneNfc className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-[#173F3A] dark:text-[#EEF2ED]">Enter One-Time Password (OTP)</h3>
                <p className="text-xs text-[#66736F] dark:text-[#A3B0AB] max-w-sm mx-auto">
                  A high-security 6-digit OTP has been sent to your registered mobile number <strong className="text-[#173F3A] dark:text-[#EEF2ED] font-mono">+91 ••••••9402</strong>.
                </p>
              </div>

              {/* OTP 6-Box Inputs */}
              <div className="flex justify-center gap-2 py-2">
                {otpValue.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={otpInputRefs[idx]}
                    type="text"
                    maxLength="1"
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e.target)}
                    className="w-10 h-12 text-center text-lg font-mono font-bold rounded-xl border border-[#E3DED2] dark:border-[#2A403A] bg-[#F7F5EF] dark:bg-[#12201D] text-[#173F3A] dark:text-[#EEF2ED] focus:outline-none focus:ring-2 focus:ring-[#173F3A] shadow-sm"
                  />
                ))}
              </div>

              {otpError && (
                <div className="text-center text-xs font-semibold text-rose-600 dark:text-rose-400">
                  ⚠️ {otpError}
                </div>
              )}

              {/* Helpers: Auto-fill test code and Resend countdown */}
              <div className="flex items-center justify-between text-xs pt-1 px-1">
                <button
                  type="button"
                  onClick={autoFillTestOtp}
                  className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                >
                  <Zap className="w-3.5 h-3.5" /> Auto-Fill Test OTP (849201)
                </button>

                <div className="text-[11px] text-[#66736F] dark:text-[#A3B0AB] flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {resendTimer > 0 ? (
                    <span>Resend in 00:{resendTimer.toString().padStart(2, '0')}</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setResendTimer(45);
                        toast.success('📱 New OTP dispatched');
                      }}
                      className="text-blue-600 dark:text-blue-400 font-bold hover:underline"
                    >
                      Resend OTP
                    </button>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-3">
                <button
                  type="button"
                  disabled={isVerifying}
                  onClick={(e) => executeVerification(e)}
                  className="w-full bg-[#173F3A] hover:bg-[#214F49] text-white dark:bg-[#EEF2ED] dark:text-[#173F3A] dark:hover:bg-white py-3 px-4 rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
                >
                  <KeyRound className="w-4 h-4" /> Verify & Settle Payment
                </button>

                <button
                  type="button"
                  onClick={() => setModalStage('selection')}
                  className="w-full text-center text-xs text-[#66736F] dark:text-[#A3B0AB] hover:text-[#173F3A] dark:hover:text-white py-1.5 font-semibold flex items-center justify-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Change Payment Method
                </button>
              </div>
            </div>
          )}

          {/* STAGE 4: PROCESSING / VERIFYING */}
          {modalStage === 'processing' && (
            <div className="flex flex-col items-center justify-center flex-1 py-8 text-center space-y-5 animate-fade-in">
              <div className="relative w-16 h-16">
                <div className="w-16 h-16 border-4 border-[#173F3A]/20 dark:border-white/20 border-t-[#173F3A] dark:border-t-[#EEF2ED] rounded-full animate-spin" />
                <Sparkles className="w-6 h-6 text-emerald-500 absolute inset-0 m-auto animate-pulse" />
              </div>

              <div>
                <h3 className="text-base font-bold text-[#173F3A] dark:text-[#EEF2ED]">Verifying Two-Factor Authentication...</h3>
                <p className="text-xs text-[#66736F] dark:text-[#A3B0AB] font-mono mt-1">{processingStep}</p>
              </div>

              {/* Progress bar */}
              <div className="w-full max-w-xs bg-gray-200 dark:bg-gray-800 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-emerald-500 h-full transition-all duration-300 ease-out rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-[11px] font-mono text-[#66736F] dark:text-[#A3B0AB]">{progress}% Verified</span>
            </div>
          )}

          {/* STAGE 5: SUCCESS & VERIFIED ACTIVATION */}
          {modalStage === 'success' && (
            <div className="flex flex-col items-center justify-center flex-1 py-4 text-center space-y-4 animate-fade-in z-20">
              <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-lg">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 mb-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" /> 2FA Bank Authentication Verified
                </div>
                <h3 className="text-lg font-bold text-[#173F3A] dark:text-[#EEF2ED]">Payment Settled & Plan Active!</h3>
                <p className="text-xs text-[#66736F] dark:text-[#A3B0AB] mt-0.5">
                  Your developer license and quota tier have been elevated and provisioned.
                </p>
              </div>

              {/* Transaction receipt badge */}
              <div className="bg-[#F7F5EF] dark:bg-[#12201D] border border-[#E3DED2] dark:border-[#2A403A] rounded-2xl p-4 w-full text-left space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-[#66736F] dark:text-[#A3B0AB]">Transaction Ref:</span>
                  <div className="flex items-center gap-1 font-mono font-bold text-[#173F3A] dark:text-[#EEF2ED]">
                    <span>{transactionResult?.transactionId}</span>
                    <button onClick={() => copyTxn(transactionResult?.transactionId)} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-800 rounded">
                      {copiedTxn ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#66736F] dark:text-[#A3B0AB]">Bank Auth Code:</span>
                  <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">{transactionResult?.bankAuthCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#66736F] dark:text-[#A3B0AB]">Activated Item:</span>
                  <span className="font-bold text-[#173F3A] dark:text-[#EEF2ED]">{item.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#66736F] dark:text-[#A3B0AB]">Total Settled:</span>
                  <span className="font-mono font-bold">${transactionResult?.amount.toFixed(2)} USD</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 w-full pt-1">
                <button
                  type="button"
                  onClick={handleDownloadInvoice}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-semibold border border-[#E3DED2] dark:border-[#2A403A] bg-white dark:bg-[#1B2C28] hover:bg-[#F7F5EF] dark:hover:bg-[#12201D] transition-colors"
                >
                  <FileText className="w-3.5 h-3.5" /> Download Tax Invoice
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold bg-[#173F3A] text-white dark:bg-[#EEF2ED] dark:text-[#173F3A] hover:opacity-90 shadow transition-all"
                >
                  Return to Console <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* STAGE 6: FAILED */}
          {modalStage === 'failed' && (
            <div className="flex flex-col items-center justify-center flex-1 py-8 text-center space-y-4 animate-fade-in">
              <div className="w-14 h-14 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 flex items-center justify-center shadow-lg">
                <XCircle className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-base font-bold text-rose-600 dark:text-rose-400">Payment Authorization Failed</h3>
                <p className="text-xs text-[#66736F] dark:text-[#A3B0AB] mt-1 max-w-xs">
                  The banking gateway was unable to verify the transaction (or Developer Force Failure switch is active). No charges were incurred.
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setModalStage('selection')}
                  className="bg-[#173F3A] text-white dark:bg-[#EEF2ED] dark:text-[#173F3A] px-5 py-2 rounded-xl text-xs font-bold shadow hover:opacity-90"
                >
                  🔄 Try Again
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border border-[#E3DED2] dark:border-[#2A403A] hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

        </div>
      </motion.div>
    </div>
  );
}
