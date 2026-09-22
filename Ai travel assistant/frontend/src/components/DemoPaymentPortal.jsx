import React, { useState, useEffect, useRef } from 'react';
import { api } from '../utils/api';
import toast from 'react-hot-toast';

export default function DemoPaymentPortal({ isOpen, onClose, bookingPayload, onPaymentComplete }) {
  const [activeTab, setActiveTab] = useState('upi'); // upi, card, netbanking, wallet
  const [isSuccessMode, setIsSuccessMode] = useState(true); // Developer control
  const [paymentState, setPaymentState] = useState('idle'); // idle, processing, success, failed
  const [progress, setProgress] = useState(0);
  const [confirmedBooking, setConfirmedBooking] = useState(null);

  // UPI fields
  const [upiId, setUpiId] = useState('');
  
  // Card fields
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  // Net banking fields
  const [selectedBank, setSelectedBank] = useState('SBI');

  const canvasRef = useRef(null);

  // Format Card Expiry
  const handleExpiryChange = (e) => {
    let input = e.target.value.replace(/\D/g, '');
    if (input.length > 2) {
      input = input.substring(0, 2) + '/' + input.substring(2, 4);
    }
    setCardExpiry(input);
  };

  // Format Card Number
  const handleCardNumberChange = (e) => {
    let input = e.target.value.replace(/\D/g, '');
    let formatted = input.replace(/(\d{4})/g, '$1 ').trim();
    if (formatted.length > 19) formatted = formatted.substring(0, 19);
    setCardNumber(formatted);
  };

  // Start Confetti Animation on Canvas
  const triggerConfetti = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;

    let particles = [];
    const colors = ['#173F3A', '#D96C4F', '#E5B85C', '#66736F', '#4F7D62'];

    for (let i = 0; i < 150; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height - canvas.height,
        r: Math.random() * 6 + 4,
        d: Math.random() * canvas.height,
        color: colors[Math.floor(Math.random() * colors.length)],
        tilt: Math.random() * 10 - 5,
        tiltAngleIncremental: Math.random() * 0.07 + 0.02,
        tiltAngle: 0
      });
    }

    let animationFrameId;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let active = false;

      particles.forEach((p) => {
        p.tiltAngle += p.tiltAngleIncremental;
        p.y += (Math.cos(p.d) + 3 + p.r / 2) / 2;
        p.x += Math.sin(p.tiltAngle);
        p.tilt = Math.sin(p.tiltAngle - p.r / 2) * 8;

        if (p.y < canvas.height) active = true;

        ctx.beginPath();
        ctx.lineWidth = p.r;
        ctx.strokeStyle = p.color;
        ctx.moveTo(p.x + p.tilt + p.r / 2, p.y);
        ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 2);
        ctx.stroke();
      });

      if (active) {
        animationFrameId = requestAnimationFrame(draw);
      }
    };
    draw();

    return () => cancelAnimationFrame(animationFrameId);
  };

  useEffect(() => {
    if (paymentState === 'success') {
      setTimeout(triggerConfetti, 100);
    }
  }, [paymentState]);

  // Handle pay click
  const handleProcessPayment = async () => {
    // Client validations
    if (activeTab === 'card') {
      if (cardNumber.replace(/\s/g, '').length !== 16) {
        toast.error('💳 Please enter a valid 16-digit Card Number.');
        return;
      }
      if (!cardHolder.trim()) {
        toast.error('💳 Please enter the Cardholder Name.');
        return;
      }
      if (cardExpiry.length !== 5) {
        toast.error('💳 Please enter card expiry in MM/YY format.');
        return;
      }
      if (cardCvv.length !== 3) {
        toast.error('💳 Please enter a valid 3-digit CVV.');
        return;
      }
    }

    if (activeTab === 'upi' && !upiId.includes('@')) {
      toast.error('📱 Please enter a valid UPI ID (e.g., username@okaxis).');
      return;
    }

    setPaymentState('processing');
    setProgress(0);

    // Simulate progress bar loading over 2.5 seconds
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 4;
      });
    }, 100);

    setTimeout(async () => {
      clearInterval(interval);
      if (isSuccessMode) {
        try {
          console.log('[Demo Payment]: Committing final ticket reservation to backend...');
          
          // 1. Book the ticket
          const bookingRes = await api.post('/profile/bookings', bookingPayload);
          const booking = bookingRes.data.booking;

          // 2. Record the successful transaction
          await api.post('/payment/transaction', {
            booking_id: booking.id,
            amount: bookingPayload.ticket_fare,
            payment_method: activeTab.toUpperCase(),
            status: 'Success'
          });

          setConfirmedBooking(booking);
          setPaymentState('success');
          toast.success('🎉 Payment Successful! Ticket has been booked.');
        } catch (err) {
          console.error('[Demo Payment Error]:', err);
          toast.error(err.response?.data?.message || 'Transaction processing failed.');
          setPaymentState('failed');
        }
      } else {
        setPaymentState('failed');
        toast.error('❌ Demo Payment Failed (Developer Failure Mode Active).');
      }
    }, 2600);
  };

  const handleDownloadTicket = () => {
    if (!confirmedBooking) return;
    const url = `${api.defaults.baseURL}/payment/ticket/${confirmedBooking.id}/pdf`;
    window.open(url, '_blank');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#263238]/60 animate-fade-in overflow-y-auto">
      
      {/* Dev Controller Overlay */}
      <div className="absolute top-4 left-4 z-50 bg-[var(--color-surface)] dark:bg-[var(--color-surface)] border border-[var(--color-border)] dark:border-[var(--color-border)] px-4 py-2 rounded-xl flex items-center gap-3 shadow-sm">
        <span className="text-[10px] uppercase font-bold text-[var(--color-text-muted)] dark:text-[var(--color-text-muted)] tracking-wider">🛠️ Payment Dev Controller</span>
        <button
          onClick={() => setIsSuccessMode(!isSuccessMode)}
          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            isSuccessMode ? 'bg-[#4F7D62]/10 text-[#4F7D62] border border-[#4F7D62]/30' : 'bg-[#B94A48]/10 text-[#B94A48] border border-[#B94A48]/30'
          }`}
        >
          {isSuccessMode ? '🟢 FORCE SUCCESS' : '🔴 FORCE FAILURE'}
        </button>
      </div>

      <div className="relative w-full max-w-4xl bg-[var(--color-surface)] dark:bg-[var(--color-surface)] border border-[var(--color-border)] dark:border-[var(--color-border)] rounded-xl overflow-hidden shadow-[0_4px_16px_rgba(23,63,58,0.06)] flex flex-col md:flex-row min-h-[500px]">
        {canvasRef && paymentState === 'success' && (
          <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-40" />
        )}

        {/* Left pane: Journey & Fare Summary */}
        <div className="w-full md:w-5/12 bg-[var(--color-soft)] dark:bg-[var(--color-soft)] p-6 border-b md:border-b-0 md:border-r border-[var(--color-border)] dark:border-[var(--color-border)]">
          <div className="flex items-center gap-2 mb-6">
            <span className="text-xl">🚄</span>
            <span className="text-base font-bold text-[var(--color-text)] dark:text-[var(--color-text)]">Travel<span className="text-[var(--color-accent)] dark:text-[var(--color-accent)]">IQ</span> Pay</span>
          </div>

          <div className="space-y-5">
            <div className="bg-[var(--color-surface)] dark:bg-[var(--color-surface)] border border-[var(--color-border)] dark:border-[var(--color-border)] p-4 rounded-xl">
              <span className="text-[9px] uppercase font-bold text-[var(--color-text-muted)] dark:text-[var(--color-text-muted)] tracking-widest block mb-2">Journey Details</span>
              <div className="flex items-center justify-between text-[var(--color-text)] dark:text-[var(--color-text)] font-bold text-lg">
                <span>{bookingPayload.source_station_code}</span>
                <span className="text-xs text-[var(--color-text-muted)] dark:text-[var(--color-text-muted)]">➔</span>
                <span>{bookingPayload.destination_station_code}</span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-[var(--color-text-muted)] dark:text-[var(--color-text-muted)] mt-2">
                <span>📅 {bookingPayload.booking_date}</span>
                <span>🎫 Class {bookingPayload.travel_class}</span>
              </div>
              <div className="text-[11px] text-[var(--color-text-muted)] dark:text-[var(--color-text-muted)] font-medium mt-1">Train: {bookingPayload.train_number}</div>
            </div>

            <div className="bg-[var(--color-surface)] dark:bg-[var(--color-surface)] border border-[var(--color-border)] dark:border-[var(--color-border)] p-4 rounded-xl">
              <span className="text-[9px] uppercase font-bold text-[var(--color-text-muted)] dark:text-[var(--color-text-muted)] tracking-widest block mb-2">Passenger Summary</span>
              <div className="space-y-1">
                {(bookingPayload.passengers || []).map((p, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs text-[var(--color-text)] dark:text-[var(--color-text)]">
                    <span className="font-medium">{p.name || 'Aditya upadhaya'}</span>
                    <span className="text-[var(--color-text-muted)] dark:text-[var(--color-text-muted)]">{p.age} Yrs | {p.gender}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-[var(--color-border)] dark:border-[var(--color-border)] pt-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-[var(--color-text-muted)] dark:text-[var(--color-text-muted)]">Total Ticket Fare</span>
                <span className="text-2xl font-bold text-[var(--color-text)] dark:text-[var(--color-text)] font-mono">₹{bookingPayload.ticket_fare}</span>
              </div>
              <p className="text-[10px] text-[var(--color-text-muted)] dark:text-[var(--color-text-muted)] font-medium mt-1 leading-normal">This is a mock transaction inside the demo environment. No real funds will be transferred or processed.</p>
            </div>
          </div>
        </div>

        {/* Right pane: Dynamic checkout states */}
        <div className="w-full md:w-7/12 p-6 flex flex-col justify-between relative min-h-[420px]">
          
          {/* Close button */}
          {paymentState !== 'processing' && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-[var(--color-text-muted)] dark:text-[var(--color-text-muted)] hover:text-[var(--color-text)] dark:hover:text-[var(--color-text)] px-2 py-1 rounded-lg hover:bg-[var(--color-soft)] dark:hover:bg-[var(--color-soft)] font-mono cursor-pointer z-50 text-base"
            >
              ✕
            </button>
          )}

          {paymentState === 'idle' && (
            <>
              {/* Tabs */}
              <div>
                <h3 className="text-lg font-bold text-[var(--color-text)] dark:text-[var(--color-text)] mb-4">Choose Payment Method</h3>
                <div className="flex border-b border-[var(--color-border)] dark:border-[var(--color-border)] gap-2 mb-6 overflow-x-auto pb-1">
                  {[
                    { id: 'upi', label: '📱 UPI' },
                    { id: 'card', label: '💳 Cards' },
                    { id: 'netbanking', label: '🏦 Net Banking' },
                    { id: 'wallet', label: '👛 Wallet' }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                        activeTab === tab.id
                          ? 'bg-[var(--color-primary)] dark:bg-[var(--color-primary)] text-white dark:text-[var(--color-bg)] border border-[var(--color-primary)] dark:border-[var(--color-primary)]'
                          : 'text-[var(--color-text-muted)] dark:text-[var(--color-text-muted)] hover:text-[var(--color-text)] dark:hover:text-[var(--color-text)]'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Tab content */}
                {activeTab === 'upi' && (
                  <div className="space-y-4 animate-fade-in">
                    <div>
                      <label className="text-[10px] uppercase font-bold text-[var(--color-text-muted)] dark:text-[var(--color-text-muted)] block mb-1">Enter UPI ID</label>
                      <input
                        type="text"
                        placeholder="aditya@okaxis"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        className="travel-input w-full bg-[var(--color-surface)] dark:bg-[var(--color-surface)] border border-[var(--color-border)] dark:border-[var(--color-border)] rounded-lg px-4 py-3 text-sm text-[var(--color-text)] dark:text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] dark:focus:border-[var(--color-primary)] font-mono"
                      />
                    </div>
                    <div className="flex items-center gap-4 bg-[var(--color-soft)] dark:bg-[var(--color-soft)] p-3 rounded-xl border border-[var(--color-border)] dark:border-[var(--color-border)]">
                      {/* Interactive mock SVG QR Code */}
                      <svg width="80" height="80" viewBox="0 0 100 100" className="bg-white p-1 rounded-lg shadow-sm border border-[var(--color-border)]">
                        <rect x="0" y="0" width="25" height="25" fill="#000" />
                        <rect x="5" y="5" width="15" height="15" fill="#fff" />
                        <rect x="75" y="0" width="25" height="25" fill="#000" />
                        <rect x="80" y="5" width="15" height="15" fill="#fff" />
                        <rect x="0" y="75" width="25" height="25" fill="#000" />
                        <rect x="5" y="80" width="15" height="15" fill="#fff" />
                        <path d="M 30,10 H 70 V 20 H 30 Z M 10,30 H 20 V 70 H 10 Z M 40,40 H 60 V 60 H 40 Z M 70,30 H 90 V 50 H 70 Z M 30,70 H 70 V 90 H 30 Z" fill="#000" />
                      </svg>
                      <div>
                        <h4 className="text-xs font-bold text-[var(--color-text)] dark:text-[var(--color-text)]">Scan Demo QR Code</h4>
                        <p className="text-[10px] text-[var(--color-text-muted)] dark:text-[var(--color-text-muted)] mt-1">Open GPay, PhonePe, or Paytm on your device to scan and complete this booking instantly in sandbox.</p>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'card' && (
                  <div className="space-y-3 animate-fade-in">
                    <div>
                      <label className="text-[10px] uppercase font-bold text-[var(--color-text-muted)] dark:text-[var(--color-text-muted)] block mb-1">Card Number</label>
                      <input
                        type="text"
                        placeholder="4532 9823 8812 0482"
                        value={cardNumber}
                        onChange={handleCardNumberChange}
                        className="travel-input w-full bg-[var(--color-surface)] dark:bg-[var(--color-surface)] border border-[var(--color-border)] dark:border-[var(--color-border)] rounded-lg px-4 py-2.5 text-sm text-[var(--color-text)] dark:text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-bold text-[var(--color-text-muted)] dark:text-[var(--color-text-muted)] block mb-1">Cardholder Name</label>
                      <input
                        type="text"
                        placeholder="Aditya upadhaya"
                        value={cardHolder}
                        onChange={(e) => setCardHolder(e.target.value)}
                        className="travel-input w-full bg-[var(--color-surface)] dark:bg-[var(--color-surface)] border border-[var(--color-border)] dark:border-[var(--color-border)] rounded-lg px-4 py-2.5 text-sm text-[var(--color-text)] dark:text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)]"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] uppercase font-bold text-[var(--color-text-muted)] dark:text-[var(--color-text-muted)] block mb-1">Expiry Date</label>
                        <input
                          type="text"
                          placeholder="MM/YY"
                          value={cardExpiry}
                          onChange={handleExpiryChange}
                          className="travel-input w-full bg-[var(--color-surface)] dark:bg-[var(--color-surface)] border border-[var(--color-border)] dark:border-[var(--color-border)] rounded-lg px-4 py-2.5 text-sm text-[var(--color-text)] dark:text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase font-bold text-[var(--color-text-muted)] dark:text-[var(--color-text-muted)] block mb-1">CVV</label>
                        <input
                          type="password"
                          placeholder="123"
                          maxLength="3"
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ''))}
                          className="travel-input w-full bg-[var(--color-surface)] dark:bg-[var(--color-surface)] border border-[var(--color-border)] dark:border-[var(--color-border)] rounded-lg px-4 py-2.5 text-sm text-[var(--color-text)] dark:text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] font-mono"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'netbanking' && (
                  <div className="space-y-4 animate-fade-in">
                    <div>
                      <label className="text-[10px] uppercase font-bold text-[var(--color-text-muted)] dark:text-[var(--color-text-muted)] block mb-1">Select Bank</label>
                      <select
                        value={selectedBank}
                        onChange={(e) => setSelectedBank(e.target.value)}
                        className="travel-input w-full bg-[var(--color-surface)] dark:bg-[var(--color-surface)] border border-[var(--color-border)] dark:border-[var(--color-border)] rounded-lg px-4 py-3 text-sm text-[var(--color-text)] dark:text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] cursor-pointer"
                      >
                        <option value="SBI">State Bank of India (SBI)</option>
                        <option value="HDFC">HDFC Bank</option>
                        <option value="ICICI">ICICI Bank</option>
                        <option value="Axis Bank">Axis Bank</option>
                        <option value="PNB">Punjab National Bank (PNB)</option>
                      </select>
                    </div>
                    <div className="text-[10px] text-[var(--color-text-muted)] dark:text-[var(--color-text-muted)] font-medium">You will be redirected to a simulated bank login page to confirm the checkout seamlessly.</div>
                  </div>
                )}

                {activeTab === 'wallet' && (
                  <div className="space-y-4 animate-fade-in bg-[var(--color-soft)] dark:bg-[var(--color-soft)] p-4 rounded-xl border border-[var(--color-border)] dark:border-[var(--color-border)]">
                    <div className="flex justify-between items-center text-xs text-[var(--color-text)] dark:text-[var(--color-text)]">
                      <span>TravelIQ Sandbox Wallet Balance</span>
                      <span className="font-mono font-bold text-[var(--color-primary)] dark:text-[var(--color-primary)]">₹8,540.00</span>
                    </div>
                    <div className="text-[10px] text-[var(--color-text-muted)] dark:text-[var(--color-text-muted)]">Paying from your loyalty sandbox wallet requires no extra validation and completes bookings instantly.</div>
                  </div>
                )}
              </div>

              <button
                onClick={handleProcessPayment}
                className="w-full btn-primary bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white font-bold py-3.5 px-4 rounded-lg text-xs uppercase tracking-widest mt-6 cursor-pointer border-none active:scale-[0.98] transition-all"
              >
                🔒 Confirm & Pay Ticket
              </button>
            </>
          )}

          {paymentState === 'processing' && (
            <div className="flex flex-col items-center justify-center flex-1 py-10 animate-fade-in">
              <div className="relative w-16 h-16 mb-6">
                <div className="absolute inset-0 border-4 border-[var(--color-border)] rounded-full" />
                <div className="absolute inset-0 border-4 border-t-[var(--color-primary)] rounded-full animate-spin" />
              </div>
              <h3 className="text-[var(--color-text)] dark:text-[var(--color-text)] font-bold text-base mb-2">Processing Payment...</h3>
              <p className="text-[var(--color-text-muted)] dark:text-[var(--color-text-muted)] text-xs mb-6 text-center max-w-xs">Connecting securely to the mock transaction gateway. Please do not close or refresh this page.</p>

              {/* Progress bar */}
              <div className="w-full max-w-sm bg-[var(--color-border)] dark:bg-[var(--color-border)] h-2 rounded-full overflow-hidden border border-[var(--color-border)] dark:border-[var(--color-border)]">
                <div
                  className="bg-[var(--color-primary)] dark:bg-[var(--color-primary)] h-full transition-all duration-100 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-[10px] font-mono font-bold text-[var(--color-text-muted)] dark:text-[var(--color-text-muted)] mt-2">{progress}%</span>
            </div>
          )}

          {paymentState === 'success' && (
            <div className="flex flex-col items-center justify-center flex-1 py-4 text-center animate-fade-in z-50">
              <div className="w-14 h-14 bg-[#4F7D62]/10 border border-[#4F7D62]/30 text-[#4F7D62] rounded-full flex items-center justify-center text-2xl font-bold mb-4">
                ✓
              </div>
              <h3 className="text-[var(--color-text)] dark:text-[var(--color-text)] font-bold text-base mb-1">Ticket Booked Successfully!</h3>
              <p className="text-[var(--color-text-muted)] dark:text-[var(--color-text-muted)] text-xs mb-5 max-w-sm">Congratulations! Your transaction was successfully logged. Your printable boarding receipts are ready below.</p>

              {/* Confirmed info */}
              {confirmedBooking && (
                <div className="bg-[var(--color-surface)] dark:bg-[var(--color-surface)] border border-[var(--color-border)] dark:border-[var(--color-border)] p-4 rounded-xl w-full max-w-md text-left mb-6 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[var(--color-text-muted)] dark:text-[var(--color-text-muted)]">PNR Reference:</span>
                    <span className="text-[var(--color-text)] dark:text-[var(--color-text)] font-bold font-mono">49204{confirmedBooking.id}49</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[var(--color-text-muted)] dark:text-[var(--color-text-muted)]">Booking status:</span>
                    <span className="travel-badge bg-[#4F7D62]/10 text-[#4F7D62] border border-[#4F7D62]/20 px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase">Confirmed</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[var(--color-text-muted)] dark:text-[var(--color-text-muted)]">Class category:</span>
                    <span className="text-[var(--color-text)] dark:text-[var(--color-text)] font-bold">{confirmedBooking.travel_class}</span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 w-full max-w-md">
                <button
                  onClick={handleDownloadTicket}
                  className="btn-primary bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white dark:text-[var(--color-bg)] font-bold py-3 rounded-lg text-xs cursor-pointer active:scale-95 transition-all"
                >
                  🖨️ Download PDF
                </button>
                <button
                  onClick={onPaymentComplete}
                  className="btn-secondary bg-[var(--color-surface)] dark:bg-[var(--color-surface)] hover:bg-[var(--color-soft)] dark:hover:bg-[var(--color-soft)] text-[var(--color-text)] dark:text-[var(--color-text)] border border-[var(--color-border)] dark:border-[var(--color-border)] font-bold py-3 rounded-lg text-xs cursor-pointer active:scale-95 transition-all"
                >
                  🎒 Go to My Trips
                </button>
              </div>
            </div>
          )}

          {paymentState === 'failed' && (
            <div className="flex flex-col items-center justify-center flex-1 py-10 text-center animate-fade-in">
              <div className="w-14 h-14 bg-[#B94A48]/10 border border-[#B94A48]/30 text-[#B94A48] rounded-full flex items-center justify-center text-2xl font-bold mb-4">
                ✕
              </div>
              <h3 className="text-[var(--color-text)] dark:text-[var(--color-text)] font-bold text-base mb-2">Payment Transaction Failed</h3>
              <p className="text-[var(--color-text-muted)] dark:text-[var(--color-text-muted)] text-xs mb-6 max-w-sm">The payment processor returned a failure code. This could be due to developer mode toggles or network delays. No real funds were charged.</p>

              <button
                onClick={() => setPaymentState('idle')}
                className="btn-primary bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white font-bold py-3 px-8 rounded-lg text-xs uppercase tracking-widest cursor-pointer active:scale-95 transition-all"
              >
                🔄 Try Another Method
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
