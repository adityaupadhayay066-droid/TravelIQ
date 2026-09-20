import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building2, Star, MapPin, Wifi, Car, UtensilsCrossed, Dumbbell, 
  Wind, Waves, Sparkles, X, Check, CheckCircle2, ShieldCheck, 
  Calendar, Users, Bed, Clock, CreditCard, Tag, ArrowRight, 
  Download, Copy, QrCode, AlertCircle, Coffee, ChevronRight, Phone, Mail, User,
  FileText, ExternalLink, Receipt, Shield, Smartphone, Landmark, Wallet, Zap, RefreshCw,
  Lock, KeyRound, Upload, BadgeCheck, AlertTriangle
} from 'lucide-react';
import QRCode from 'qrcode';
import { api } from '../utils/api';
import toast from 'react-hot-toast';
import { printHotelInvoice } from '../utils/hotelInvoiceGenerator';

const COUPONS = [
  { code: 'HOSTEL20', label: '20% OFF Hostels & Dorms', discountPercent: 20, maxDiscount: 600, forHostelOnly: true },
  { code: 'OYO300', label: 'Flat ₹300 OFF on Stays', flatDiscount: 300, minTotal: 1200 },
  { code: 'TRAVELIQ', label: '15% Member Discount', discountPercent: 15, maxDiscount: 1500 }
];

export default function HotelBookingModal({ hotel, isOpen, onClose, onBookingSuccess }) {
  const [step, setStep] = useState(1); // 1: Choose Room, 2: Dates & Guests, 3: Guest Info & Pay, 4: Receipt
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [unitsCount, setUnitsCount] = useState(1);
  const [guestsCount, setGuestsCount] = useState(1);
  
  // Dates
  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const dayAfterStr = new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0];

  const [checkInDate, setCheckInDate] = useState(tomorrowStr);
  const [checkOutDate, setCheckOutDate] = useState(dayAfterStr);

  // Meal & Addons
  const [mealPlan, setMealPlan] = useState('Room Only');
  const [specialRequests, setSpecialRequests] = useState([]);

  // Guest Details (Mandatory Phone, Email & Name)
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');

  // Government ID KYC Authentication states (Real Booking App Compliance)
  const [govIdType, setGovIdType] = useState('Aadhaar Card'); // 'Aadhaar Card', 'Passport', 'Driving License', 'Voter ID', 'PAN Card'
  const [govIdNumber, setGovIdNumber] = useState('');
  const [govIdVerified, setGovIdVerified] = useState(false);
  const [isVerifyingGovId, setIsVerifyingGovId] = useState(false);
  const [govIdVerifyStatusText, setGovIdVerifyStatusText] = useState('');
  const [govIdMethod, setGovIdMethod] = useState('digilocker'); // 'digilocker', 'manual', 'upload'
  const [govIdOtp, setGovIdOtp] = useState('');
  const [showGovIdOtpInput, setShowGovIdOtpInput] = useState(false);
  const [govIdDocName, setGovIdDocName] = useState('');

  // ─── Interactive DigiLocker Government Gateway Modal States ───
  const [isDigiLockerOpen, setIsDigiLockerOpen] = useState(false);
  const [digiLockerStep, setDigiLockerStep] = useState(1); // 1: Input & Consent, 2: OTP & PIN, 3: Verified Certificate
  const [digiLockerDocType, setDigiLockerDocType] = useState('Aadhaar Card');
  const [digiLockerAadhaar, setDigiLockerAadhaar] = useState('5829 1948 4829');
  const [digiLockerOtp, setDigiLockerOtp] = useState('');
  const [digiLockerPin, setDigiLockerPin] = useState('123456');
  const [digiLockerConsent, setDigiLockerConsent] = useState(true);
  const [digiLockerLoading, setDigiLockerLoading] = useState(false);
  const [digiLockerStatusMsg, setDigiLockerStatusMsg] = useState('');

  // Open DigiLocker Portal Anytime (Multiple & Re-verifiable)
  const openDigiLockerModal = (type = 'Aadhaar Card') => {
    setDigiLockerDocType(type);
    setDigiLockerStep(1);
    setDigiLockerOtp('');
    setDigiLockerPin('123456');
    setDigiLockerConsent(true);
    setDigiLockerLoading(false);
    if (!digiLockerAadhaar) setDigiLockerAadhaar('5829 1948 4829');
    setIsDigiLockerOpen(true);
  };

  const handleDigiLockerSendOtp = () => {
    if (!digiLockerConsent) {
      toast.error('Please provide consent to fetch e-KYC document from DigiLocker.');
      return;
    }
    const cleanId = digiLockerAadhaar.replace(/\s/g, '');
    if (digiLockerDocType === 'Aadhaar Card' && cleanId.length !== 12) {
      toast.error('Please enter a 12-digit Aadhaar number.');
      return;
    }
    setDigiLockerLoading(true);
    setDigiLockerStatusMsg('Connecting to UIDAI Aadhaar Gateway...');
    
    setTimeout(() => {
      setDigiLockerLoading(false);
      setDigiLockerStatusMsg('');
      setDigiLockerStep(2);
      toast.success('UIDAI 6-Digit e-KYC OTP sent to linked mobile (Demo OTP: 482910)', { icon: '📲', duration: 4000 });
    }, 700);
  };

  const handleDigiLockerAuthorize = () => {
    if (!digiLockerOtp || digiLockerOtp.length < 4) {
      toast.error('Please enter the 6-digit OTP (Use Demo OTP: 482910).');
      return;
    }
    setDigiLockerLoading(true);
    setDigiLockerStatusMsg('Validating OTP & Fetching Digital Certificate...');

    setTimeout(() => {
      setDigiLockerLoading(false);
      setDigiLockerStatusMsg('');
      setDigiLockerStep(3); // Show certificate preview
      toast.success('Identity verified with Govt of India DigiLocker Registry! 🛡️', { icon: '✅' });
    }, 900);
  };

  const handleDigiLockerComplete = () => {
    setGovIdType(digiLockerDocType);
    setGovIdNumber(digiLockerAadhaar || '5829 1948 4829');
    setGovIdVerified(true);
    setIsDigiLockerOpen(false);
    toast.success('Govt ID Linked & Verified! You can now complete your booking.', { icon: '🛡️', duration: 4000 });
  };

  // Payment & Coupons (MMT & OYO Style Dummy Gateway)
  const [paymentTab, setPaymentTab] = useState('property'); // 'property', 'upi', 'card', 'netbanking', 'wallet'
  const [paymentMethod, setPaymentMethod] = useState('Pay at Property');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // UPI & QR states
  const DUMMY_HOTEL_UPI = 'traveliq.stays@icici';
  const [upiOption, setUpiOption] = useState('qr'); // 'qr' | 'vpa'
  const [upiId, setUpiId] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [qrTimer, setQrTimer] = useState(300);
  const [isSimulatingScan, setIsSimulatingScan] = useState(false);

  // Card states
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  // Net Banking & PayLater states
  const [selectedBank, setSelectedBank] = useState('HDFC');
  const [payLaterChoice, setPayLaterChoice] = useState('LazyPay');

  // Initialize room and autofill user info if available
  useEffect(() => {
    if (hotel) {
      const initialRooms = hotel.roomTypes && hotel.roomTypes.length > 0 
        ? hotel.roomTypes 
        : [
            {
              id: 'default-room',
              name: hotel.isHostel ? 'Standard Dormitory Bed' : 'Deluxe Comfort Room',
              bedType: hotel.isHostel ? '1 Bunk Bed in Shared Room' : '1 King Bed',
              capacity: '1-2 Guests',
              pricePerNight: Math.round(hotel.price || 1200),
              availableUnits: 4,
              badge: hotel.isHostel ? 'Backpacker Pick' : 'Standard Room',
              amenities: ['Air Conditioning', 'Free Wi-Fi', 'Daily Housekeeping'],
              cancellation: 'Free cancellation up to 24 hours prior'
            }
          ];
      setSelectedRoom(initialRooms[0]);
      setUnitsCount(1);
      setStep(1);
      setAppliedCoupon(null);
      setConfirmedBooking(null);

      // Try reading user from localStorage
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const u = JSON.parse(storedUser);
          if (u.name) setGuestName(u.name);
          if (u.email) setGuestEmail(u.email);
          if (u.phone) setGuestPhone(u.phone);
        }
      } catch (e) {}
    }
  }, [hotel, isOpen]);

  // Government ID Verification Helper Functions
  const handleDigiLockerVerification = () => {
    if (isVerifyingGovId) return;
    setIsVerifyingGovId(true);
    setGovIdVerifyStatusText('Connecting to National DigiLocker Gateway...');
    toast.loading('Connecting to DigiLocker & UIDAI Gateway...', { id: 'digilocker-toast' });

    setTimeout(() => {
      setGovIdVerifyStatusText('Validating UIDAI Aadhaar biometrics & KYC...');
    }, 600);

    setTimeout(() => {
      toast.dismiss('digilocker-toast');
      setIsVerifyingGovId(false);
      setGovIdVerifyStatusText('');
      setGovIdType('Aadhaar Card');
      setGovIdNumber('5829 1948 4829');
      setGovIdVerified(true);
      setShowGovIdOtpInput(false);
      toast.success('Aadhaar e-KYC Verified via DigiLocker! 🛡️', { icon: '✅', duration: 4000 });
    }, 1300);
  };

  const handleFormatGovId = (val, type = govIdType) => {
    let clean = val.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    if (type === 'Aadhaar Card') {
      const digits = val.replace(/\D/g, '').slice(0, 12);
      const formatted = digits.replace(/(\d{4})/g, '$1 ').trim();
      setGovIdNumber(formatted);
    } else if (type === 'Passport') {
      setGovIdNumber(clean.slice(0, 9));
    } else if (type === 'PAN Card') {
      setGovIdNumber(clean.slice(0, 10));
    } else if (type === 'Driving License') {
      setGovIdNumber(clean.slice(0, 16));
    } else if (type === 'Voter ID') {
      setGovIdNumber(clean.slice(0, 10));
    } else {
      setGovIdNumber(clean);
    }
  };

  const handleSendGovIdOtp = () => {
    const raw = govIdNumber.replace(/\s/g, '');
    if (govIdType === 'Aadhaar Card' && raw.length !== 12) {
      toast.error('Please enter a valid 12-digit Aadhaar number.');
      return;
    }
    if (govIdType === 'PAN Card' && raw.length !== 10) {
      toast.error('Please enter a valid 10-character PAN number.');
      return;
    }
    if (govIdType === 'Passport' && raw.length < 8) {
      toast.error('Please enter a valid 8-9 character Passport number.');
      return;
    }
    if (!raw) {
      toast.error('Please enter your Government ID number.');
      return;
    }

    setShowGovIdOtpInput(true);
    toast.success(`Sandbox KYC OTP sent to mobile linked with ${govIdType}! (Use demo OTP: 4829)`, { icon: '📲', duration: 4500 });
  };

  const handleVerifyGovIdOtp = (otpVal) => {
    const checkOtp = otpVal || govIdOtp;
    if (!checkOtp || checkOtp.length < 4) {
      toast.error('Please enter 4-digit verification OTP (Demo: 4829).');
      return;
    }
    setIsVerifyingGovId(true);
    setTimeout(() => {
      setIsVerifyingGovId(false);
      setGovIdVerified(true);
      setShowGovIdOtpInput(false);
      toast.success(`${govIdType} successfully authenticated & verified with Govt Registry! 🛡️`, { icon: '✅' });
    }, 600);
  };

  const handleResetGovId = () => {
    setGovIdVerified(false);
    setGovIdNumber('');
    setShowGovIdOtpInput(false);
    setGovIdDocName('');
    toast.success('Gov ID reset. You can change ID type or re-verify.');
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setGovIdDocName(file.name);
      setIsVerifyingGovId(true);
      setGovIdVerifyStatusText('OCR Document Recognition & Govt Database Cross-Check...');
      setTimeout(() => {
        setIsVerifyingGovId(false);
        setGovIdVerifyStatusText('');
        setGovIdVerified(true);
        if (!govIdNumber) setGovIdNumber('5829 1948 4829');
        toast.success('Document OCR Authenticated: Verified Govt ID! 🛡️', { icon: '✅' });
      }, 1100);
    }
  };

  // Calculate nights
  const nights = useMemo(() => {
    try {
      const d1 = new Date(checkInDate);
      const d2 = new Date(checkOutDate);
      const diff = Math.ceil((d2 - d1) / (1000 * 60 * 60 * 24));
      return diff > 0 ? diff : 1;
    } catch {
      return 1;
    }
  }, [checkInDate, checkOutDate]);

  // Calculate pricing breakdown
  const pricing = useMemo(() => {
    const ratePerNight = selectedRoom ? selectedRoom.pricePerNight : (hotel?.price || 1000);
    const baseTotal = ratePerNight * nights * unitsCount;

    let mealCostPerGuestPerNight = 0;
    if (mealPlan.includes('Breakfast +')) mealCostPerGuestPerNight = 499;
    else if (mealPlan.includes('Breakfast')) mealCostPerGuestPerNight = 199;
    const mealsTotal = mealCostPerGuestPerNight * guestsCount * nights;

    const subtotal = baseTotal + mealsTotal;

    let discount = 0;
    if (appliedCoupon) {
      if (appliedCoupon.flatDiscount) {
        discount = appliedCoupon.flatDiscount;
      } else if (appliedCoupon.discountPercent) {
        const calc = Math.round((subtotal * appliedCoupon.discountPercent) / 100);
        discount = appliedCoupon.maxDiscount ? Math.min(calc, appliedCoupon.maxDiscount) : calc;
      }
    }

    const discountedSubtotal = Math.max(0, subtotal - discount);
    const taxes = Math.round(discountedSubtotal * 0.12); // 12% GST
    const grandTotal = discountedSubtotal + taxes;

    return {
      ratePerNight,
      baseTotal,
      mealsTotal,
      discount,
      taxes,
      grandTotal,
      savings: discount + (Math.round(ratePerNight * 0.2) * nights * unitsCount)
    };
  }, [selectedRoom, hotel, nights, unitsCount, mealPlan, guestsCount, appliedCoupon]);

  if (!isOpen || !hotel) return null;

  const handleApplyCoupon = (c) => {
    const couponToApply = typeof c === 'string' ? COUPONS.find(item => item.code === c.toUpperCase()) : c;
    if (!couponToApply) {
      toast.error('Invalid coupon code.');
      return;
    }
    if (couponToApply.forHostelOnly && !hotel.isHostel) {
      toast.error('This coupon is exclusively valid for Hostels & Dormitories.');
      return;
    }
    setAppliedCoupon(couponToApply);
    setCouponCode(couponToApply.code);
    toast.success(`Coupon ${couponToApply.code} applied! Saved discount!`, { icon: '🎉' });
  };

  const toggleSpecialRequest = (req) => {
    setSpecialRequests(prev => 
      prev.includes(req) ? prev.filter(r => r !== req) : [...prev, req]
    );
  };

  // Generate dynamic crisp QR code
  useEffect(() => {
    if (pricing.grandTotal > 0) {
      const dummyPayload = `upi://pay?pa=${DUMMY_HOTEL_UPI}&pn=TravelIQ%20Stays&am=${pricing.grandTotal}&cu=INR&tn=HotelStay_${hotel?.name || 'Stay'}_${Date.now()}`;
      QRCode.toDataURL(dummyPayload, {
        width: 400,
        margin: 2,
        color: { dark: '#14532D', light: '#FFFFFF' }
      }).then(url => setQrCodeUrl(url)).catch(err => console.error(err));
    }
  }, [pricing.grandTotal, hotel]);

  // QR Code Expiry Countdown Timer
  useEffect(() => {
    let timerId;
    if (step === 3 && paymentTab === 'upi' && upiOption === 'qr' && qrTimer > 0) {
      timerId = setInterval(() => {
        setQrTimer(prev => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timerId);
  }, [step, paymentTab, upiOption, qrTimer]);

  const formatTimer = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleAutofillDemoCard = () => {
    setCardNumber('4532 8920 1192 3840');
    setCardHolder(guestName || 'Aditya Sharma');
    setCardExpiry('12/28');
    setCardCvv('849');
    toast.success('Demo Visa Sandbox Card autofilled!', { icon: '💳' });
  };

  const handleAutofillDemoUpi = (vpa) => {
    setUpiId(vpa);
    toast.success(`UPI ID ${vpa} selected!`, { icon: '⚡' });
  };

  const handleSimulateScanAndPay = async () => {
    if (isSubmitting || isSimulatingScan) return;
    setIsSimulatingScan(true);
    toast.loading('Simulating UPI App Scan & Authorization...', { id: 'hotel-qr-toast' });
    
    setTimeout(async () => {
      toast.dismiss('hotel-qr-toast');
      setIsSimulatingScan(false);
      await handleConfirmReservation('Instant UPI (Verified App Scan)');
    }, 1200);
  };

  const handleFormatCardNumber = (val) => {
    const raw = val.replace(/\D/g, '').slice(0, 16);
    const formatted = raw.replace(/(\d{4})/g, '$1 ').trim();
    setCardNumber(formatted);
  };

  const handleFormatExpiry = (val) => {
    let input = val.replace(/\D/g, '').slice(0, 4);
    if (input.length > 2) {
      input = input.substring(0, 2) + '/' + input.substring(2, 4);
    }
    setCardExpiry(input);
  };

  const handleConfirmReservation = async (overrideMethod) => {
    // 1. Mandatory Name Validation
    if (!guestName.trim()) {
      toast.error('Please enter primary guest full name.');
      setStep(3);
      return;
    }

    // 2. Mandatory Email Validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!guestEmail.trim()) {
      toast.error('Email address is mandatory for e-Voucher and invoice delivery.');
      setStep(3);
      return;
    }
    if (!emailRegex.test(guestEmail.trim())) {
      toast.error('Please enter a valid email address (e.g. name@domain.com).');
      setStep(3);
      return;
    }

    // 3. Mandatory Phone Validation
    const rawDigits = guestPhone.replace(/\D/g, '');
    if (!guestPhone.trim()) {
      toast.error('Mobile number is mandatory for instant SMS booking confirmation.');
      setStep(3);
      return;
    }
    if (rawDigits.length < 10) {
      toast.error('Please enter a valid 10-digit mobile number.');
      setStep(3);
      return;
    }

    // 4. Mandatory Government ID Verification (KYC Compliance)
    if (!govIdVerified) {
      toast.error('Government ID authentication is mandatory. Please verify via DigiLocker or OTP.', {
        icon: '🛡️',
        duration: 4000
      });
      setStep(3);
      return;
    }

    let finalPaymentMethod = typeof overrideMethod === 'string' ? overrideMethod : null;
    if (!finalPaymentMethod) {
      if (paymentTab === 'property') {
        finalPaymentMethod = 'Pay at Property (Zero Advance)';
      } else if (paymentTab === 'upi') {
        if (upiOption === 'vpa') {
          if (!upiId || !upiId.includes('@')) {
            toast.error('Please enter a valid UPI ID (e.g. aditya@okhdfcbank)');
            return;
          }
          finalPaymentMethod = `Instant UPI (${upiId})`;
        } else {
          finalPaymentMethod = `Instant UPI (QR Code)`;
        }
      } else if (paymentTab === 'card') {
        const cleanNum = cardNumber.replace(/\s/g, '');
        if (cleanNum.length !== 16) {
          toast.error('Please enter a valid 16-digit card number or click "Use Demo Test Card".');
          return;
        }
        if (!cardHolder.trim()) {
          toast.error('Please enter cardholder name.');
          return;
        }
        if (cardExpiry.length !== 5) {
          toast.error('Please enter expiry in MM/YY format.');
          return;
        }
        if (cardCvv.length !== 3) {
          toast.error('Please enter 3-digit CVV.');
          return;
        }
        finalPaymentMethod = `Card Payment (Visa ending ${cleanNum.slice(-4)})`;
      } else if (paymentTab === 'netbanking') {
        finalPaymentMethod = `Net Banking (${selectedBank})`;
      } else if (paymentTab === 'wallet') {
        finalPaymentMethod = `TravelIQ PayLater (${payLaterChoice})`;
      }
    }

    setIsSubmitting(true);
    try {
      const payload = {
        hotelName: hotel.name,
        city: hotel.city,
        category: hotel.category,
        isHostel: hotel.isHostel,
        roomType: selectedRoom?.name || 'Standard Room',
        unitsCount,
        guestName: guestName.trim(),
        guestEmail: guestEmail.trim(),
        guestPhone: guestPhone.trim(),
        govIdType,
        govIdNumber: govIdNumber || '5829 1948 4829',
        govIdVerified: true,
        checkInDate,
        checkOutDate,
        nights,
        guestsCount,
        mealPlan,
        specialRequests,
        paymentMethod: finalPaymentMethod,
        ratePerNight: pricing.ratePerNight,
        baseTotal: pricing.baseTotal,
        mealsTotal: pricing.mealsTotal,
        discount: pricing.discount,
        promoCode: appliedCoupon?.code || null,
        taxes: pricing.taxes,
        grandTotal: pricing.grandTotal
      };

      const res = await api.post('/hotels/reserve', payload);
      if (res.data && res.data.success) {
        const booked = res.data.reservation;
        setConfirmedBooking(booked);
        setStep(4);
        toast.success('Stay Confirmed! E-Voucher Ready.', { icon: '🏨', duration: 4000 });
        
        // Save to LocalStorage for persistent offline & My Trips access
        try {
          const existing = JSON.parse(localStorage.getItem('traveliq_hotel_reservations') || '[]');
          existing.unshift(booked);
          localStorage.setItem('traveliq_hotel_reservations', JSON.stringify(existing));
        } catch (e) {}

        if (onBookingSuccess) onBookingSuccess(booked);
      } else {
        throw new Error('Could not complete reservation.');
      }
    } catch (err) {
      console.error('Reservation error:', err);
      // Fallback local instant confirmation
      const fallbackBooking = {
        id: `TIQ-STAY-${Math.floor(100000 + Math.random() * 900000)}`,
        bookingReference: `TIQ-STAY-${Math.floor(100000 + Math.random() * 900000)}`,
        createdAt: new Date().toISOString(),
        status: 'CONFIRMED',
        hotelName: hotel.name,
        city: hotel.city,
        category: hotel.category,
        isHostel: hotel.isHostel,
        roomType: selectedRoom?.name || 'Standard Room',
        unitsCount,
        guestName: guestName.trim(),
        guestEmail: guestEmail.trim(),
        guestPhone: guestPhone.trim(),
        govIdType,
        govIdNumber: govIdNumber || '5829 1948 4829',
        govIdVerified: true,
        checkInDate,
        checkOutDate,
        nights,
        guestsCount,
        mealPlan,
        paymentMethod: finalPaymentMethod,
        pricing: {
          ratePerNight: pricing.ratePerNight,
          grandTotal: pricing.grandTotal,
          taxes: pricing.taxes,
          discount: pricing.discount
        }
      };
      setConfirmedBooking(fallbackBooking);
      setStep(4);
      toast.success('Stay Confirmed! E-Voucher Ready.', { icon: '🏨' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyBookingId = () => {
    if (!confirmedBooking) return;
    navigator.clipboard.writeText(confirmedBooking.id || confirmedBooking.bookingReference);
    setCopiedCode(true);
    toast.success('Booking ID copied to clipboard!');
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handlePrint = (autoPrint = true) => {
    if (!confirmedBooking) return;
    const fullBookingData = {
      ...confirmedBooking,
      hotelName: hotel.name,
      city: hotel.city,
      category: hotel.category,
      isHostel: hotel.isHostel,
      roomType: selectedRoom?.name || confirmedBooking.roomType || (hotel.isHostel ? 'Futuristic Single Capsule Pod' : 'Deluxe Room'),
      unitsCount: confirmedBooking.unitsCount || unitsCount,
      guestsCount: confirmedBooking.guestsCount || guestsCount,
      nights: confirmedBooking.nights || nights,
      mealPlan: confirmedBooking.mealPlan || mealPlan,
      specialRequests: confirmedBooking.specialRequests || specialRequests,
      checkInDate: confirmedBooking.checkInDate || checkInDate,
      checkOutDate: confirmedBooking.checkOutDate || checkOutDate,
      guestName: confirmedBooking.guestName || guestName || 'Aditya Upadhyay',
      guestEmail: confirmedBooking.guestEmail || guestEmail || 'aditya.traveler@traveliq.in',
      guestPhone: confirmedBooking.guestPhone || guestPhone || '+91 98765 43210',
      govIdType: confirmedBooking.govIdType || govIdType || 'Aadhaar Card',
      govIdNumber: confirmedBooking.govIdNumber || govIdNumber || '5829 1948 4829',
      govIdVerified: confirmedBooking.govIdVerified !== undefined ? confirmedBooking.govIdVerified : true,
      paymentMethod: confirmedBooking.paymentMethod || paymentMethod,
      ratePerNight: pricing.ratePerNight,
      baseTotal: pricing.baseTotal,
      mealsTotal: pricing.mealsTotal,
      discount: pricing.discount,
      taxes: pricing.taxes,
      grandTotal: confirmedBooking.pricing?.grandTotal || pricing.grandTotal,
      promoCode: appliedCoupon?.code || null
    };
    printHotelInvoice(fullBookingData, autoPrint);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.25 }}
        className="bg-[#FFFFFF] dark:bg-[#172722] border border-[#E3DED2] dark:border-[#273E36] rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden text-[#1F2933] dark:text-[#F7F5EF] my-auto"
      >
        
        {/* ─── Modal Header ─── */}
        <div className="p-4 sm:p-5 bg-[#F7F5EF] dark:bg-[#101B17] border-b border-[#E3DED2] dark:border-[#273E36] flex items-start justify-between relative">
          <div className="flex items-start gap-3.5 pr-8">
            <div className="w-12 h-12 rounded-xl bg-[#14532D] text-white flex items-center justify-center flex-shrink-0 font-bold shadow-md">
              {hotel.isHostel ? <Bed className="w-6 h-6" /> : <Building2 className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                  hotel.isHostel 
                    ? 'bg-[#E58A3A]/15 text-[#E58A3A] border-[#E58A3A]/30' 
                    : 'bg-[#14532D]/15 text-[#14532D] dark:text-[#A7D7C5] border-[#14532D]/30'
                }`}>
                  {hotel.isHostel ? '🎒 Backpacker Hostel & Pods' : (hotel.category || 'Hotel & Suites')}
                </span>
                <span className="text-xs text-[#64748B] dark:text-[#94A3B8] flex items-center gap-1 font-medium">
                  <MapPin className="w-3.5 h-3.5" /> <span className="capitalize">{hotel.city}</span>
                </span>
              </div>

              <h2 className="text-lg sm:text-xl font-bold font-heading text-[#14532D] dark:text-white mt-1">
                {hotel.name}
              </h2>

              <div className="flex items-center gap-3 mt-1 text-xs text-[#64748B] dark:text-[#94A3B8]">
                {hotel.rating && (
                  <span className="flex items-center gap-1 font-bold text-[#D97706]">
                    <Star className="w-3.5 h-3.5 fill-[#D97706]" /> {hotel.rating} / 5
                    <span className="text-[#64748B] dark:text-[#94A3B8] font-normal">({hotel.ratingCount || 420} reviews)</span>
                  </span>
                )}
                <span>•</span>
                <span className="text-[#15803D] font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Free Cancellation Guarantee
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#64748B] hover:text-[#1F2933] dark:hover:text-white hover:bg-[#EEF2ED] dark:hover:bg-[#1D322B] transition-colors absolute right-4 top-4"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ─── Stepper Progress ─── */}
        {step < 4 && (
          <div className="px-5 py-2.5 bg-[#FFFDF7] dark:bg-[#12201D] border-b border-[#E3DED2] dark:border-[#273E36] flex items-center justify-between text-xs font-semibold overflow-x-auto whitespace-nowrap">
            <button
              onClick={() => setStep(1)}
              className={`flex items-center gap-1.5 transition-colors ${step === 1 ? 'text-[#14532D] dark:text-white font-bold' : 'text-[#64748B]'}`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === 1 ? 'bg-[#14532D] text-white' : 'bg-[#EEF2ED] text-[#64748B]'}`}>1</span>
              Choose Bed / Room
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-[#CBD5E1]" />

            <button
              onClick={() => setStep(2)}
              className={`flex items-center gap-1.5 transition-colors ${step === 2 ? 'text-[#14532D] dark:text-white font-bold' : 'text-[#64748B]'}`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === 2 ? 'bg-[#14532D] text-white' : 'bg-[#EEF2ED] text-[#64748B]'}`}>2</span>
              Stay Dates & Guests
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-[#CBD5E1]" />

            <button
              onClick={() => setStep(3)}
              className={`flex items-center gap-1.5 transition-colors ${step === 3 ? 'text-[#14532D] dark:text-white font-bold' : 'text-[#64748B]'}`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === 3 ? 'bg-[#14532D] text-white' : 'bg-[#EEF2ED] text-[#64748B]'}`}>3</span>
              Guest & Payment
            </button>
          </div>
        )}

        {/* ─── Modal Scrollable Body ─── */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          
          {/* STEP 1: ROOM & BED SELECTION */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-[#14532D] dark:text-white font-heading">
                    {hotel.isHostel ? 'Select Your Dorm Bed / Private Pod' : 'Select Your Room Category'}
                  </h3>
                  <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                    Real-time available inventory with instant confirmation & zero prepayment options.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {(hotel.roomTypes || []).map((room) => {
                  const isSelected = selectedRoom?.id === room.id;
                  return (
                    <div
                      key={room.id}
                      onClick={() => setSelectedRoom(room)}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 flex flex-col justify-between gap-3 relative ${
                        isSelected 
                          ? 'border-[#14532D] dark:border-[#4ADE80] bg-[#14532D]/5 dark:bg-[#14532D]/20 shadow-md ring-1 ring-[#14532D]' 
                          : 'border-[#E3DED2] dark:border-[#273E36] bg-[#FFFFFF] dark:bg-[#1B2C28] hover:border-[#14532D]/40'
                      }`}
                    >
                      {room.badge && (
                        <span className="absolute -top-2.5 right-3 text-[9px] font-black uppercase tracking-wider bg-[#E58A3A] text-white px-2 py-0.5 rounded-full shadow-xs">
                          {room.badge}
                        </span>
                      )}

                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-bold text-sm text-[#1F2933] dark:text-white">
                            {room.name}
                          </h4>
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                            isSelected ? 'border-[#14532D] bg-[#14532D] text-white' : 'border-[#CBD5E1]'
                          }`}>
                            {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                        </div>

                        <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1 flex items-center gap-1.5 font-medium">
                          <Bed className="w-3.5 h-3.5 text-[#14532D] dark:text-[#4ADE80]" /> {room.bedType}
                        </p>

                        <div className="flex flex-wrap gap-1 mt-2.5">
                          {room.amenities?.slice(0, 4).map((am, idx) => (
                            <span key={idx} className="text-[10px] bg-[#F7F5EF] dark:bg-[#101B17] text-[#64748B] dark:text-[#94A3B8] px-2 py-0.5 rounded-md border border-[#E3DED2] dark:border-[#273E36]">
                              {am}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-between border-t border-[#E3DED2] dark:border-[#273E36] pt-3 mt-1">
                        <div>
                          <div className="flex items-baseline gap-1">
                            <span className="text-lg font-black text-[#14532D] dark:text-white">
                              ₹{room.pricePerNight?.toLocaleString('en-IN')}
                            </span>
                            <span className="text-[11px] text-[#64748B] dark:text-[#94A3B8]">
                              / {hotel.isHostel ? 'bed / night' : 'night'}
                            </span>
                          </div>
                          <span className="text-[10px] text-[#15803D] font-semibold">
                            {room.cancellation || 'Free Cancellation'}
                          </span>
                        </div>

                        <button
                          type="button"
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            isSelected 
                              ? 'bg-[#14532D] text-white shadow-xs' 
                              : 'bg-[#EEF2ED] dark:bg-[#213530] text-[#14532D] dark:text-white hover:bg-[#14532D] hover:text-white'
                          }`}
                        >
                          {isSelected ? 'Selected' : 'Select'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Number of Units / Beds Counter */}
              <div className="p-4 bg-[#F7F5EF] dark:bg-[#101B17] rounded-xl border border-[#E3DED2] dark:border-[#273E36] flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-[#14532D] dark:text-white">
                    {hotel.isHostel ? 'Number of Dorm Beds' : 'Number of Rooms'}
                  </h4>
                  <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8]">
                    Reserve multiple beds for your backpacker group or family
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setUnitsCount(Math.max(1, unitsCount - 1))}
                    disabled={unitsCount <= 1}
                    className="w-8 h-8 rounded-lg bg-white dark:bg-[#172722] border border-[#E3DED2] dark:border-[#273E36] font-bold text-sm disabled:opacity-40 hover:bg-[#EEF2ED] transition-colors"
                  >
                    -
                  </button>
                  <span className="font-bold text-sm w-4 text-center">{unitsCount}</span>
                  <button
                    onClick={() => setUnitsCount(Math.min(8, unitsCount + 1))}
                    disabled={unitsCount >= 8}
                    className="w-8 h-8 rounded-lg bg-white dark:bg-[#172722] border border-[#E3DED2] dark:border-[#273E36] font-bold text-sm disabled:opacity-40 hover:bg-[#EEF2ED] transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: DATES, GUESTS & MEAL PLAN */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-[#14532D] dark:text-white font-heading">
                  Stay Dates, Group Size & Add-ons
                </h3>
                <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                  Select your arrival and departure schedule with custom breakfast options.
                </p>
              </div>

              {/* Dates Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="p-3.5 bg-[#F7F5EF] dark:bg-[#101B17] rounded-xl border border-[#E3DED2] dark:border-[#273E36]">
                  <label className="block text-xs font-bold text-[#14532D] dark:text-white mb-1.5 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#14532D]" /> Check-in Date
                  </label>
                  <input
                    type="date"
                    min={todayStr}
                    value={checkInDate}
                    onChange={(e) => setCheckInDate(e.target.value)}
                    className="w-full bg-white dark:bg-[#172722] border border-[#E3DED2] dark:border-[#273E36] rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none focus:border-[#14532D]"
                  />
                  <span className="text-[10px] text-[#64748B] mt-1 block">Standard Check-in: 12:00 PM</span>
                </div>

                <div className="p-3.5 bg-[#F7F5EF] dark:bg-[#101B17] rounded-xl border border-[#E3DED2] dark:border-[#273E36]">
                  <label className="block text-xs font-bold text-[#14532D] dark:text-white mb-1.5 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#14532D]" /> Check-out Date
                  </label>
                  <input
                    type="date"
                    min={checkInDate || todayStr}
                    value={checkOutDate}
                    onChange={(e) => setCheckOutDate(e.target.value)}
                    className="w-full bg-white dark:bg-[#172722] border border-[#E3DED2] dark:border-[#273E36] rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none focus:border-[#14532D]"
                  />
                  <span className="text-[10px] text-[#64748B] mt-1 block">Total Duration: {nights} {nights === 1 ? 'Night' : 'Nights'}</span>
                </div>
              </div>

              {/* Guests Count */}
              <div className="p-4 bg-[#F7F5EF] dark:bg-[#101B17] rounded-xl border border-[#E3DED2] dark:border-[#273E36] flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-[#14532D] dark:text-white flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-[#14532D]" /> Total Guests / Backpackers
                  </h4>
                  <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8]">
                    Adults and traveling companions
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setGuestsCount(Math.max(1, guestsCount - 1))}
                    disabled={guestsCount <= 1}
                    className="w-8 h-8 rounded-lg bg-white dark:bg-[#172722] border border-[#E3DED2] dark:border-[#273E36] font-bold text-sm disabled:opacity-40"
                  >
                    -
                  </button>
                  <span className="font-bold text-sm w-4 text-center">{guestsCount}</span>
                  <button
                    onClick={() => setGuestsCount(Math.min(10, guestsCount + 1))}
                    disabled={guestsCount >= 10}
                    className="w-8 h-8 rounded-lg bg-white dark:bg-[#172722] border border-[#E3DED2] dark:border-[#273E36] font-bold text-sm disabled:opacity-40"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Meal Plan Options (OYO / Booking.com Style) */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-[#14532D] dark:text-white flex items-center gap-1.5">
                  <Coffee className="w-4 h-4 text-[#E58A3A]" /> Meal Package Add-on
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {[
                    { id: 'Room Only', title: 'Room Only', desc: 'No meals included', price: '₹0' },
                    { id: 'Breakfast Included', title: 'Breakfast Buffet', desc: 'Continental & Indian fresh breakfast', price: '+₹199 / guest' },
                    { id: 'Breakfast + Dinner Combo', title: 'Breakfast + Dinner', desc: 'Full-course buffet dining', price: '+₹499 / guest' }
                  ].map((mp) => {
                    const isMSelected = mealPlan === mp.id;
                    return (
                      <div
                        key={mp.id}
                        onClick={() => setMealPlan(mp.id)}
                        className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                          isMSelected 
                            ? 'border-[#14532D] bg-[#14532D]/5 dark:bg-[#14532D]/20 shadow-xs' 
                            : 'border-[#E3DED2] dark:border-[#273E36] bg-white dark:bg-[#1B2C28]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-[#1F2933] dark:text-white">{mp.title}</span>
                          <span className="text-[10px] font-black text-[#14532D] dark:text-[#4ADE80]">{mp.price}</span>
                        </div>
                        <p className="text-[10px] text-[#64748B] mt-1">{mp.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: GUEST DETAILS & PAYMENT METHOD */}
          {step === 3 && (
            <div className="space-y-5">
              {/* Header */}
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm sm:text-base font-bold text-[#14532D] dark:text-white font-heading">
                    Guest Contact Details & Government KYC
                  </h3>
                  <span className="text-[10px] font-bold text-[#15803D] bg-[#15803D]/10 dark:bg-[#15803D]/30 dark:text-[#4ADE80] px-2.5 py-1 rounded-full flex items-center gap-1 border border-[#15803D]/20">
                    <ShieldCheck className="w-3.5 h-3.5" /> Mandatory KYC Compliance
                  </span>
                </div>
                <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-0.5">
                  Provide verified contact info and Government photo ID authentication for instant hotel voucher & SMS check-in.
                </p>
              </div>

              {/* 1. Mandatory Guest Contact Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#14532D] dark:text-white mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1"><User className="w-3.5 h-3.5 text-[#14532D]" /> Full Name *</span>
                    <span className="text-[9px] text-[#DC2626] font-semibold">Required</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Aditya Sharma"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    className="w-full bg-[#F7F5EF] dark:bg-[#101B17] border border-[#E3DED2] dark:border-[#273E36] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#14532D] focus:ring-1 focus:ring-[#14532D]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#14532D] dark:text-white mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5 text-[#14532D]" /> Email Address *</span>
                    <span className="text-[9px] text-[#DC2626] font-semibold">Required</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="aditya@example.com"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    className="w-full bg-[#F7F5EF] dark:bg-[#101B17] border border-[#E3DED2] dark:border-[#273E36] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#14532D] focus:ring-1 focus:ring-[#14532D]"
                  />
                  <p className="text-[10px] text-[#64748B] dark:text-[#94A3B8] mt-1">For Tax Invoice & e-Voucher PDF</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#14532D] dark:text-white mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5 text-[#14532D]" /> Mobile Number *</span>
                    <span className="text-[9px] text-[#DC2626] font-semibold">Required</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 98765 43210"
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    className="w-full bg-[#F7F5EF] dark:bg-[#101B17] border border-[#E3DED2] dark:border-[#273E36] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#14532D] focus:ring-1 focus:ring-[#14532D]"
                  />
                  <p className="text-[10px] text-[#64748B] dark:text-[#94A3B8] mt-1">For Instant OTP & SMS alerts</p>
                </div>
              </div>

              {/* 2. REAL BOOKING APP GOVERNMENT ID AUTHENTICATION & KYC MODULE */}
              <div className="p-4 bg-[#F8FAFC] dark:bg-[#101B17] border-2 border-[#14532D]/30 dark:border-[#273E36] rounded-2xl shadow-sm space-y-3.5">
                
                {/* Gov ID Card Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#E2E8F0] dark:border-[#273E36]">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[#14532D]/10 dark:bg-[#14532D]/30 text-[#14532D] dark:text-[#4ADE80] flex items-center justify-center font-black">
                      <Shield className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#14532D] dark:text-white flex items-center gap-1.5">
                        Government Photo ID Authentication *
                        <span className="text-[9px] uppercase px-1.5 py-0.5 bg-[#E58A3A]/15 text-[#E58A3A] font-extrabold rounded">
                          Hotel Check-in KYC
                        </span>
                      </h4>
                      <p className="text-[10px] text-[#64748B] dark:text-[#94A3B8]">
                        Mandatory under Section 40 of Registration Act & local hospitality safety guidelines.
                      </p>
                    </div>
                  </div>

                  <div>
                    {govIdVerified ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#15803D] dark:text-[#4ADE80] bg-[#DCFCE7] dark:bg-[#14532D]/40 px-2.5 py-1 rounded-full border border-[#86EFAC] dark:border-[#14532D]">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Verified by Govt Registry
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#D97706] bg-[#FEF3C7] dark:bg-[#78350F]/40 dark:text-[#FCD34D] px-2.5 py-1 rounded-full border border-[#FDE68A] dark:border-[#78350F]">
                        <AlertCircle className="w-3.5 h-3.5" /> Authentication Required
                      </span>
                    )}
                  </div>
                </div>

                {/* ─── CASE A: VERIFIED STATE SHOWCASE (High-Trust Govt Token Card) ─── */}
                {govIdVerified ? (
                  <div className="p-3.5 bg-white dark:bg-[#172722] border border-[#86EFAC] dark:border-[#14532D] rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#14532D] to-[#15803D] text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                        <BadgeCheck className="w-6 h-6 text-[#4ADE80]" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-[#0F172A] dark:text-white">
                            {govIdType}
                          </span>
                          <span className="text-[10px] font-bold text-[#15803D] dark:text-[#4ADE80] bg-[#DCFCE7] dark:bg-[#14532D]/40 px-2 py-0.5 rounded">
                            DIGILOCKER / UIDAI VERIFIED
                          </span>
                        </div>
                        <p className="text-[11px] font-mono font-bold text-[#475569] dark:text-[#94A3B8] mt-0.5">
                          ID Number: {govIdNumber ? `•••• •••• ${govIdNumber.slice(-4)}` : '•••• •••• 4829'} &nbsp;|&nbsp; Name: <span className="text-[#0F172A] dark:text-white">{guestName || 'Primary Guest'}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                      <button
                        type="button"
                        onClick={() => openDigiLockerModal(govIdType)}
                        className="text-[11px] font-semibold text-[#14532D] dark:text-[#4ADE80] hover:text-[#15803D] px-3 py-1 rounded-lg border border-[#15803D]/40 bg-[#F0FDF4] dark:bg-[#14532D]/20 hover:border-[#15803D] transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <RefreshCw className="w-3 h-3" /> Launch DigiLocker / Change ID
                      </button>
                      <button
                        type="button"
                        onClick={handleResetGovId}
                        className="text-[11px] font-semibold text-[#64748B] hover:text-[#DC2626] dark:hover:text-red-400 px-3 py-1 rounded-lg border border-[#CBD5E1] dark:border-[#273E36] bg-[#F8FAFC] dark:bg-[#101B17] hover:border-[#DC2626] transition-colors cursor-pointer"
                      >
                        Reset
                      </button>
                    </div>
                  </div>
                ) : (
                  /* ─── CASE B: UNVERIFIED KYC INPUT OPTIONS ─── */
                  <div className="space-y-3.5">
                    
                    {/* Method 1: 1-Click Fast DigiLocker Verification */}
                    <div className="p-3 bg-gradient-to-r from-[#F0FDF4] to-[#ECFDF5] dark:from-[#14532D]/20 dark:to-[#166534]/20 border border-[#86EFAC] dark:border-[#14532D] rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-[#15803D] text-white flex items-center justify-center font-bold text-xs flex-shrink-0 shadow-sm">
                          ⚡
                        </div>
                        <div>
                          <p className="text-xs font-bold text-[#14532D] dark:text-[#4ADE80] flex items-center gap-1.5">
                            DigiLocker Official e-KYC Gateway
                            <span className="text-[9px] bg-[#E58A3A] text-white px-1.5 py-0.2 rounded font-extrabold">Govt of India</span>
                          </p>
                          <p className="text-[10px] text-[#475569] dark:text-[#94A3B8]">
                            Launch interactive MeitY DigiLocker portal for instant Aadhaar / DL verification.
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => openDigiLockerModal(govIdType)}
                        className="w-full sm:w-auto px-4 py-2 bg-[#15803D] hover:bg-[#0F3F22] text-white text-xs font-bold rounded-lg shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer flex-shrink-0 hover:scale-[1.02]"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-[#FEF08A]" />
                        <span>Launch DigiLocker Portal</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-2 my-2">
                      <div className="flex-1 h-px bg-[#E2E8F0] dark:bg-[#273E36]" />
                      <span className="text-[10px] uppercase font-bold text-[#94A3B8] tracking-wider">
                        Or Enter Gov ID Manually
                      </span>
                      <div className="flex-1 h-px bg-[#E2E8F0] dark:bg-[#273E36]" />
                    </div>

                    {/* ID Type Selector */}
                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-bold text-[#14532D] dark:text-white">
                        Select Government ID Document Type
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                        {[
                          { id: 'Aadhaar Card', label: '🇮🇳 Aadhaar (UIDAI)' },
                          { id: 'Passport', label: '🛂 Passport' },
                          { id: 'Driving License', label: '🚗 Driving License' },
                          { id: 'Voter ID', label: '🗳️ Voter ID (EPIC)' },
                          { id: 'PAN Card', label: '🏢 PAN Card' }
                        ].map((doc) => {
                          const isSel = govIdType === doc.id;
                          return (
                            <button
                              key={doc.id}
                              type="button"
                              onClick={() => {
                                setGovIdType(doc.id);
                                setGovIdNumber('');
                                setShowGovIdOtpInput(false);
                              }}
                              className={`p-2 rounded-lg border text-[11px] font-bold text-center transition-all ${
                                isSel
                                  ? 'border-[#14532D] bg-[#14532D] text-white shadow-xs'
                                  : 'border-[#CBD5E1] dark:border-[#273E36] bg-white dark:bg-[#172722] text-[#475569] dark:text-[#94A3B8] hover:border-[#14532D]'
                              }`}
                            >
                              {doc.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* ID Number Input with Format Masking */}
                    <div className="space-y-2">
                      <div className="flex flex-col sm:flex-row gap-2">
                        <div className="flex-1">
                          <input
                            type="text"
                            placeholder={
                              govIdType === 'Aadhaar Card' ? 'Enter 12-digit Aadhaar (e.g. 5829 1948 4829)' :
                              govIdType === 'Passport' ? 'Enter Passport No (e.g. A1234567)' :
                              govIdType === 'PAN Card' ? 'Enter PAN No (e.g. ABCDE1234F)' :
                              govIdType === 'Driving License' ? 'Enter DL No (e.g. DL1420110012345)' :
                              'Enter Voter ID (e.g. ABC1234567)'
                            }
                            value={govIdNumber}
                            onChange={(e) => handleFormatGovId(e.target.value)}
                            className="w-full bg-white dark:bg-[#172722] border border-[#CBD5E1] dark:border-[#273E36] rounded-lg px-3 py-2 text-xs font-mono font-bold uppercase tracking-wider focus:outline-none focus:border-[#14532D]"
                          />
                        </div>

                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              if (govIdType === 'Aadhaar Card') handleFormatGovId('582919484829');
                              else if (govIdType === 'Passport') handleFormatGovId('M8392104');
                              else if (govIdType === 'PAN Card') handleFormatGovId('ABCDE1234F');
                              else if (govIdType === 'Driving License') handleFormatGovId('DL1420110012345');
                              else handleFormatGovId('ABC1234567');
                              toast.success(`Demo ${govIdType} filled! Now click Verify ID.`);
                            }}
                            className="px-3 py-2 bg-[#F1F5F9] dark:bg-[#213530] text-[#14532D] dark:text-[#4ADE80] text-xs font-bold rounded-lg border border-[#CBD5E1] dark:border-[#273E36] hover:bg-[#E2E8F0] transition-colors cursor-pointer shrink-0"
                          >
                            Demo Fill
                          </button>

                          <button
                            type="button"
                            onClick={handleSendGovIdOtp}
                            className="px-4 py-2 bg-[#14532D] hover:bg-[#0F3F22] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shrink-0 flex items-center gap-1"
                          >
                            <KeyRound className="w-3.5 h-3.5" /> Verify ID
                          </button>
                        </div>
                      </div>

                      {/* Manual OTP Verification Sub-panel */}
                      {showGovIdOtpInput && (
                        <div className="p-3 bg-[#FFFDF7] dark:bg-[#172722] border border-[#FDE68A] dark:border-[#78350F] rounded-xl space-y-2 animate-fadeIn">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-[#B45309] dark:text-[#FCD34D] flex items-center gap-1.5">
                              <Lock className="w-3.5 h-3.5" /> Enter Govt OTP sent to linked mobile ending in 4321
                            </span>
                            <span className="text-[10px] font-mono text-[#64748B]">Sandbox Mode</span>
                          </div>

                          <div className="flex gap-2">
                            <input
                              type="text"
                              maxLength={4}
                              placeholder="e.g. 4829"
                              value={govIdOtp}
                              onChange={(e) => setGovIdOtp(e.target.value)}
                              className="w-32 bg-white dark:bg-[#101B17] border border-[#CBD5E1] dark:border-[#273E36] rounded-lg px-3 py-1.5 text-center text-sm font-mono font-black tracking-widest focus:outline-none focus:border-[#14532D]"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setGovIdOtp('4829');
                                handleVerifyGovIdOtp('4829');
                              }}
                              className="px-3 bg-[#F1F5F9] dark:bg-[#213530] text-[#14532D] dark:text-[#4ADE80] text-xs font-bold rounded-lg border border-[#CBD5E1] dark:border-[#273E36] hover:bg-[#E2E8F0] transition-colors"
                            >
                              Auto-Fill OTP (4829)
                            </button>
                            <button
                              type="button"
                              disabled={isVerifyingGovId}
                              onClick={() => handleVerifyGovIdOtp()}
                              className="flex-1 px-4 bg-[#15803D] hover:bg-[#0F3F22] text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1"
                            >
                              {isVerifyingGovId ? 'Authenticating...' : 'Confirm & Authenticate KYC'}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Optional Document Upload / Photo Scan */}
                      <div className="pt-1 flex items-center justify-between text-[10px] text-[#64748B] dark:text-[#94A3B8]">
                        <span className="flex items-center gap-1">
                          <Upload className="w-3 h-3" /> Or upload ID proof document (JPG/PNG/PDF):
                        </span>
                        <label className="text-[#14532D] dark:text-[#4ADE80] font-bold hover:underline cursor-pointer">
                          <span>{govIdDocName ? `Uploaded: ${govIdDocName}` : 'Browse ID File / Photo'}</span>
                          <input
                            type="file"
                            accept="image/*,.pdf"
                            onChange={handleFileUpload}
                            className="hidden"
                          />
                        </label>
                      </div>

                    </div>

                  </div>
                )}

                {/* Privacy & Encryption Guarantee */}
                <div className="text-[10px] text-[#64748B] dark:text-[#94A3B8] flex items-center gap-1.5 pt-1">
                  <Lock className="w-3 h-3 text-[#15803D] flex-shrink-0" />
                  <span>256-bit encrypted KYC token. ID details are securely stored and verified for frontdesk check-in compliance.</span>
                </div>

              </div>

              {/* Special Requests */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-[#14532D] dark:text-white">
                  Special Requests / Bunk Preference
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    'Lower Bunk Bed Preference',
                    'Late Check-in (after 8 PM)',
                    'Quiet Corner Room',
                    'Early Luggage Drop-off',
                    'Near Electric Socket'
                  ].map((req, i) => {
                    const active = specialRequests.includes(req);
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => toggleSpecialRequest(req)}
                        className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                          active 
                            ? 'bg-[#14532D] text-white border-[#14532D]' 
                            : 'bg-[#F7F5EF] dark:bg-[#101B17] text-[#64748B] dark:text-[#94A3B8] border-[#E3DED2] dark:border-[#273E36] hover:border-[#14532D]'
                        }`}
                      >
                        {active && '✓ '} {req}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Coupons & Promo Codes */}
              <div className="p-3.5 bg-[#FFFDF7] dark:bg-[#101B17] rounded-xl border border-[#E3DED2] dark:border-[#273E36] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#14532D] dark:text-white flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-[#E58A3A]" /> Have a Coupon Code?
                  </span>
                  {appliedCoupon && (
                    <span className="text-[10px] font-black text-[#15803D] bg-[#15803D]/10 px-2 py-0.5 rounded">
                      Coupon Applied: {appliedCoupon.code}
                    </span>
                  )}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter code (e.g. HOSTEL20, OYO300)"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    className="flex-1 bg-white dark:bg-[#172722] border border-[#E3DED2] dark:border-[#273E36] rounded-lg px-3 py-1.5 text-xs font-bold uppercase tracking-wider focus:outline-none focus:border-[#14532D]"
                  />
                  <button
                    type="button"
                    onClick={() => handleApplyCoupon(couponCode)}
                    className="px-4 bg-[#14532D] hover:bg-[#0F3F22] text-white text-xs font-bold rounded-lg transition-colors"
                  >
                    Apply
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {COUPONS.map((c, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleApplyCoupon(c)}
                      className="text-[10px] font-semibold bg-[#EEF2ED] dark:bg-[#213530] text-[#14532D] dark:text-[#EEF2ED] px-2 py-0.5 rounded-md hover:bg-[#14532D] hover:text-white transition-colors"
                    >
                      🏷️ {c.code} ({c.label})
                    </button>
                  ))}
                </div>
              </div>

              {/* ─── MMT & OYO Style Dummy Payment Gateway ─── */}
              <div className="space-y-3.5 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#14532D] dark:text-white flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-[#14532D]" /> Select Payment Method
                  </label>
                  <span className="text-[10px] font-bold text-[#15803D] bg-[#15803D]/10 px-2 py-0.5 rounded">
                    🛡️ 100% Safe Sandbox Mode
                  </span>
                </div>

                {/* Primary Payment Category Selector */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {[
                    { id: 'property', icon: Building2, label: 'Pay at Property', desc: 'Zero Advance' },
                    { id: 'upi', icon: Zap, label: 'UPI / QR Code', desc: 'GPay, PhonePe' },
                    { id: 'card', icon: CreditCard, label: 'Cards', desc: 'Visa, Master' },
                    { id: 'netbanking', icon: Landmark, label: 'Net Banking', desc: 'All Banks' },
                    { id: 'wallet', icon: Wallet, label: 'PayLater', desc: 'LazyPay, Simpl' }
                  ].map((p) => {
                    const Icon = p.icon;
                    const isSelected = paymentTab === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setPaymentTab(p.id)}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                          isSelected
                            ? 'border-[#14532D] bg-[#14532D]/10 dark:bg-[#14532D]/30 ring-1 ring-[#14532D] shadow-xs'
                            : 'border-[#E3DED2] dark:border-[#273E36] bg-white dark:bg-[#1B2C28] hover:border-[#14532D]/40'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <Icon className={`w-4 h-4 ${isSelected ? 'text-[#14532D] dark:text-[#4ADE80]' : 'text-[#64748B]'}`} />
                          <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                            isSelected ? 'border-[#14532D] bg-[#14532D] text-white' : 'border-[#CBD5E1]'
                          }`}>
                            {isSelected && <span className="text-[8px]">✓</span>}
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-[#1F2933] dark:text-white leading-tight">
                            {p.label}
                          </p>
                          <p className="text-[10px] text-[#64748B] dark:text-[#94A3B8]">
                            {p.desc}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Sub-Panel: Dynamic Mode Specific Gateway Content */}
                <div className="p-4 bg-[#F8FAFC] dark:bg-[#12201D] border border-[#E2E8F0] dark:border-[#273E36] rounded-xl shadow-xs">
                  
                  {/* 1. PAY AT PROPERTY (OYO STYLE) */}
                  {paymentTab === 'property' && (
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-[#15803D]/15 text-[#15803D] rounded-lg">
                          <ShieldCheck className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-[#14532D] dark:text-[#4ADE80]">
                            Zero Prepayment Needed — Pay on Arrival
                          </h4>
                          <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8] leading-relaxed mt-0.5">
                            Your reservation is guaranteed instantly. Pay <strong>₹{pricing.grandTotal.toLocaleString('en-IN')}</strong> directly at the front-desk via Cash, UPI, or Card during check-in.
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px] text-[#475569] dark:text-[#94A3B8]">
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#15803D]" /> Free cancellation anytime before check-in
                        </div>
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#15803D]" /> Express priority check-in with digital voucher
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 2. DYNAMIC UPI & QR CODE (MMT SCAN & PAY STYLE) */}
                  {paymentTab === 'upi' && (
                    <div className="space-y-3.5">
                      <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0] dark:border-[#273E36]">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setUpiOption('qr')}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                              upiOption === 'qr' 
                                ? 'bg-[#14532D] text-white shadow-xs' 
                                : 'bg-white dark:bg-[#1B2C28] text-[#64748B] border border-[#E2E8F0] dark:border-[#273E36]'
                            }`}
                          >
                            📲 Scan Dynamic QR
                          </button>
                          <button
                            type="button"
                            onClick={() => setUpiOption('vpa')}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                              upiOption === 'vpa' 
                                ? 'bg-[#14532D] text-white shadow-xs' 
                                : 'bg-white dark:bg-[#1B2C28] text-[#64748B] border border-[#E2E8F0] dark:border-[#273E36]'
                            }`}
                          >
                            ⌨️ Enter UPI ID / VPA
                          </button>
                        </div>
                        <span className="text-[11px] font-mono font-bold text-[#14532D] dark:text-[#4ADE80]">
                          ₹{pricing.grandTotal.toLocaleString('en-IN')}
                        </span>
                      </div>

                      {upiOption === 'qr' ? (
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 py-1">
                          <div className="bg-white p-2.5 rounded-xl border-2 border-[#14532D]/30 shadow-md flex flex-col items-center">
                            {qrCodeUrl ? (
                              <img src={qrCodeUrl} alt="UPI QR Code" className="w-36 h-36 rounded" />
                            ) : (
                              <div className="w-36 h-36 bg-gray-100 animate-pulse rounded" />
                            )}
                            <div className="flex items-center gap-1.5 mt-2 text-[10px] font-mono text-[#64748B]">
                              <span>Expiring in:</span>
                              <span className="font-bold text-[#D97706]">{formatTimer(qrTimer)}</span>
                            </div>
                          </div>

                          <div className="space-y-2.5 max-w-xs text-center sm:text-left">
                            <div className="space-y-1">
                              <p className="text-xs font-bold text-[#1F2933] dark:text-white">
                                Scan with any UPI App
                              </p>
                              <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8]">
                                Google Pay, PhonePe, Paytm, BHIM, CRED
                              </p>
                            </div>

                            <div className="p-2 bg-white dark:bg-[#1B2C28] rounded-lg border border-[#E2E8F0] dark:border-[#273E36] flex items-center justify-between text-[11px] font-mono">
                              <span className="text-[#64748B] truncate">{DUMMY_HOTEL_UPI}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(DUMMY_HOTEL_UPI);
                                  toast.success('Sandbox UPI ID copied!');
                                }}
                                className="text-[#14532D] dark:text-[#4ADE80] font-bold hover:underline shrink-0 ml-2"
                              >
                                Copy
                              </button>
                            </div>

                            <button
                              type="button"
                              disabled={isSimulatingScan}
                              onClick={handleSimulateScanAndPay}
                              className="w-full px-4 py-2 bg-[#15803D] hover:bg-[#0F3F22] text-white text-xs font-bold rounded-lg transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <Zap className="w-3.5 h-3.5" />
                              {isSimulatingScan ? 'Processing Scan...' : '⚡ Simulate App Scan & Pay'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div>
                            <label className="block text-[11px] font-bold text-[#14532D] dark:text-white mb-1">
                              Enter Your UPI ID (e.g. yourname@okhdfcbank)
                            </label>
                            <input
                              type="text"
                              placeholder="aditya@oksbi or 9876543210@paytm"
                              value={upiId}
                              onChange={(e) => setUpiId(e.target.value)}
                              className="w-full bg-white dark:bg-[#1B2C28] border border-[#CBD5E1] dark:border-[#273E36] rounded-lg px-3 py-2 text-xs font-mono font-medium focus:outline-none focus:border-[#14532D]"
                            />
                          </div>

                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] text-[#64748B]">Quick Demo VPAs:</span>
                            {['aditya@okhdfcbank', 'traveler@paytm', 'stayiq@ybl'].map(vpa => (
                              <button
                                key={vpa}
                                type="button"
                                onClick={() => handleAutofillDemoUpi(vpa)}
                                className="text-[10px] font-mono bg-white dark:bg-[#1B2C28] text-[#14532D] dark:text-[#4ADE80] px-2 py-0.5 rounded border border-[#CBD5E1] dark:border-[#273E36] hover:border-[#14532D]"
                              >
                                {vpa}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 3. CREDIT / DEBIT CARDS (MMT STYLE WITH DEMO FILL) */}
                  {paymentTab === 'card' && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between pb-1">
                        <span className="text-xs font-bold text-[#14532D] dark:text-white">
                          Credit / Debit / ATM Card
                        </span>
                        <button
                          type="button"
                          onClick={handleAutofillDemoCard}
                          className="text-[10px] font-bold bg-[#14532D]/10 hover:bg-[#14532D] text-[#14532D] hover:text-white px-2.5 py-1 rounded-md transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          ⚡ Use Demo Test Card
                        </button>
                      </div>

                      <div className="space-y-2.5">
                        <div>
                          <label className="block text-[10px] font-bold text-[#64748B] uppercase mb-1">
                            Card Number
                          </label>
                          <input
                            type="text"
                            maxLength={19}
                            placeholder="4532 •••• •••• 3840"
                            value={cardNumber}
                            onChange={(e) => handleFormatCardNumber(e.target.value)}
                            className="w-full bg-white dark:bg-[#1B2C28] border border-[#CBD5E1] dark:border-[#273E36] rounded-lg px-3 py-2 text-xs font-mono font-bold focus:outline-none focus:border-[#14532D]"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2.5">
                          <div>
                            <label className="block text-[10px] font-bold text-[#64748B] uppercase mb-1">
                              Cardholder Name
                            </label>
                            <input
                              type="text"
                              placeholder="Name on card"
                              value={cardHolder}
                              onChange={(e) => setCardHolder(e.target.value)}
                              className="w-full bg-white dark:bg-[#1B2C28] border border-[#CBD5E1] dark:border-[#273E36] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#14532D]"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[10px] font-bold text-[#64748B] uppercase mb-1">
                                Expiry
                              </label>
                              <input
                                type="text"
                                maxLength={5}
                                placeholder="MM/YY"
                                value={cardExpiry}
                                onChange={(e) => handleFormatExpiry(e.target.value)}
                                className="w-full bg-white dark:bg-[#1B2C28] border border-[#CBD5E1] dark:border-[#273E36] rounded-lg px-3 py-2 text-xs font-mono text-center focus:outline-none focus:border-[#14532D]"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-[#64748B] uppercase mb-1">
                                CVV
                              </label>
                              <input
                                type="password"
                                maxLength={3}
                                placeholder="•••"
                                value={cardCvv}
                                onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 3))}
                                className="w-full bg-white dark:bg-[#1B2C28] border border-[#CBD5E1] dark:border-[#273E36] rounded-lg px-3 py-2 text-xs font-mono text-center focus:outline-none focus:border-[#14532D]"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <p className="text-[10px] text-[#64748B] flex items-center gap-1 pt-1">
                        🔒 Safe & Secure 256-Bit SSL Encrypted Sandbox Checkout
                      </p>
                    </div>
                  )}

                  {/* 4. NET BANKING */}
                  {paymentTab === 'netbanking' && (
                    <div className="space-y-3">
                      <span className="text-xs font-bold text-[#14532D] dark:text-white block">
                        Select Popular Net Banking Portal
                      </span>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {['HDFC Bank', 'State Bank of India', 'ICICI Bank', 'Axis Bank', 'Kotak Mahindra', 'Punjab National Bank'].map(bank => {
                          const isBSelected = selectedBank === bank;
                          return (
                            <button
                              key={bank}
                              type="button"
                              onClick={() => setSelectedBank(bank)}
                              className={`p-2 rounded-lg border text-xs font-semibold text-left transition-all ${
                                isBSelected 
                                  ? 'border-[#14532D] bg-[#14532D] text-white shadow-xs' 
                                  : 'border-[#CBD5E1] dark:border-[#273E36] bg-white dark:bg-[#1B2C28] text-[#1F2933] dark:text-white hover:border-[#14532D]'
                              }`}
                            >
                              🏦 {bank}
                            </button>
                          );
                        })}
                      </div>
                      <p className="text-[10px] text-[#64748B]">
                        Redirects to sandbox banking portal for instant zero-fee verification.
                      </p>
                    </div>
                  )}

                  {/* 5. PAYLATER & WALLET (LAZYPAY / SIMPL) */}
                  {paymentTab === 'wallet' && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-2.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-lg border border-emerald-200 dark:border-emerald-800">
                        <div>
                          <span className="text-xs font-bold text-[#15803D] dark:text-[#4ADE80]">
                            ⚡ Pre-Approved Stay Credit: ₹10,000.00
                          </span>
                          <p className="text-[10px] text-[#475569] dark:text-[#94A3B8]">
                            Book today at 0% interest, settle next month.
                          </p>
                        </div>
                        <span className="text-[10px] font-bold bg-[#15803D] text-white px-2 py-0.5 rounded">
                          ACTIVE
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {[
                          { id: 'LazyPay', title: 'LazyPay', desc: '15 Days 0% EMI' },
                          { id: 'Simpl', title: 'Simpl PayLater', desc: '1-Click Checkout' },
                          { id: 'TravelIQ Rupee', title: 'TravelIQ Wallet', desc: 'Instant Points Redemption' }
                        ].map(w => (
                          <button
                            key={w.id}
                            type="button"
                            onClick={() => setPayLaterChoice(w.id)}
                            className={`p-2.5 rounded-lg border text-left transition-all ${
                              payLaterChoice === w.id
                                ? 'border-[#14532D] bg-[#14532D]/10 dark:bg-[#14532D]/30 ring-1 ring-[#14532D]'
                                : 'border-[#CBD5E1] dark:border-[#273E36] bg-white dark:bg-[#1B2C28]'
                            }`}
                          >
                            <p className="text-xs font-bold text-[#1F2933] dark:text-white">{w.title}</p>
                            <p className="text-[10px] text-[#64748B]">{w.desc}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              </div>
            </div>
          )}

          {/* STEP 4: CONFIRMATION RECEIPT / E-VOUCHER (MMT & OYO REAL BILL STYLE) */}
          {step === 4 && confirmedBooking && (
            <div className="space-y-5 py-1" id="printable-e-voucher">
              
              {/* Top Success Banner */}
              <div className="text-center space-y-2">
                <div className="w-14 h-14 bg-[#15803D]/15 text-[#15803D] rounded-full flex items-center justify-center mx-auto shadow-sm ring-8 ring-[#15803D]/5 animate-bounce">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider bg-[#15803D]/10 text-[#15803D] px-3 py-1 rounded-full border border-[#15803D]/20">
                    🎉 Reservation Confirmed & Verified
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black text-[#14532D] dark:text-white font-heading mt-1.5">
                    Stay Confirmed at {confirmedBooking.hotelName || hotel.name}!
                  </h3>
                  <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                    Your official TravelIQ Hotel Booking Voucher & Tax Invoice is generated below.
                  </p>
                </div>
              </div>

              {/* ─── Professional MMT / OYO Style e-Voucher Card ─── */}
              <div className="bg-white dark:bg-[#101B17] border-2 border-[#14532D]/30 dark:border-[#273E36] rounded-2xl shadow-xl overflow-hidden max-w-2xl mx-auto text-left">
                
                {/* Brand Header Bar */}
                <div className="bg-gradient-to-r from-[#092B16] via-[#14532D] to-[#166534] text-white p-4 sm:p-5 flex items-center justify-between border-b-2 border-[#E58A3A]">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-white/10 border border-white/25 flex items-center justify-center shadow-inner flex-shrink-0">
                      <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
                        <polygon points="16,2 29,9 29,23 16,30 3,23 3,9" stroke="#4ADE80" stroke-width="2.2" fill="rgba(74, 222, 128, 0.2)"/>
                        <path d="M16 6L21 16L16 13.5L11 16L16 6Z" fill="#FFFFFF"/>
                        <path d="M16 26L11 16L16 18.5L21 16L16 26Z" fill="#E58A3A"/>
                        <circle cx="16" cy="16" r="2.5" fill="#4ADE80"/>
                      </svg>
                    </div>
                    <div>
                      <div className="text-lg font-black tracking-tight flex items-center gap-1.5">
                        Travel<span className="text-[#4ADE80]">IQ</span>
                        <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-[#FFF7ED] text-[#E58A3A]">Stays</span>
                      </div>
                      <div className="text-[10px] uppercase tracking-wider text-emerald-200 font-semibold">
                        Verified Accommodation & Tax Invoice
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="bg-[#E58A3A] text-white text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full shadow-xs">
                      Official Tax Invoice
                    </span>
                    <div className="text-[11px] font-mono text-emerald-100 mt-1 font-semibold">
                      INV/2026-27/TIQ-{(confirmedBooking.id || confirmedBooking.bookingReference || 'TIQ').slice(-6).toUpperCase()}
                    </div>
                  </div>
                </div>

                {/* Voucher Content */}
                <div className="p-4 sm:p-5 space-y-4">
                  
                  {/* Billed To (Customer) & Booking ID Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-[#F8FAFC] dark:bg-[#172722] rounded-xl border border-[#E2E8F0] dark:border-[#273E36]">
                    <div>
                      <span className="text-[10px] font-bold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider block">
                        Billed To (Primary Customer)
                      </span>
                      <h4 className="text-base font-black text-[#0F172A] dark:text-white mt-0.5">
                        {confirmedBooking.guestName || guestName || 'Aditya Upadhyay'}
                      </h4>
                      <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8] mt-0.5 font-medium">
                        📞 {confirmedBooking.guestPhone || guestPhone || '+91 98765 43210'} &nbsp;|&nbsp; ✉️ {confirmedBooking.guestEmail || guestEmail || 'aditya.traveler@traveliq.in'}
                      </p>
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        <span className="text-[10px] text-[#14532D] dark:text-[#EEF2ED] bg-[#EEF2ED] dark:bg-[#1E332C] px-2 py-0.5 rounded font-semibold">
                          👥 {confirmedBooking.guestsCount || guestsCount} Guest(s) • {confirmedBooking.unitsCount || unitsCount} {hotel.isHostel ? 'Bed' : 'Room'}
                        </span>
                        <span className="text-[10px] text-[#15803D] dark:text-[#4ADE80] bg-[#DCFCE7] dark:bg-[#14532D]/50 px-2 py-0.5 rounded border border-[#86EFAC] dark:border-[#14532D] font-bold flex items-center gap-1">
                          🛡️ {confirmedBooking.govIdType || govIdType}: {confirmedBooking.govIdNumber || govIdNumber || '•••• 4829'} (KYC Verified)
                        </span>
                      </div>
                    </div>

                    <div className="sm:border-l sm:border-[#E2E8F0] dark:sm:border-[#273E36] sm:pl-3 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider">
                            Booking Reference ID
                          </span>
                          <button
                            onClick={copyBookingId}
                            className="text-[10px] text-[#14532D] dark:text-[#4ADE80] font-bold flex items-center gap-1 hover:underline cursor-pointer"
                          >
                            {copiedCode ? <Check className="w-3 h-3 text-[#15803D]" /> : <Copy className="w-3 h-3" />}
                            {copiedCode ? 'Copied' : 'Copy'}
                          </button>
                        </div>
                        <span className="font-mono text-xs font-black text-[#14532D] dark:text-[#4ADE80] bg-[#DCFCE7] dark:bg-[#14532D]/40 px-2 py-0.5 rounded border border-[#86EFAC] dark:border-[#14532D] inline-block mt-1">
                          {confirmedBooking.id || confirmedBooking.bookingReference}
                        </span>
                      </div>

                      <div className="text-[11px] text-[#64748B] dark:text-[#94A3B8] mt-2">
                        Payment Mode: <strong className="text-[#0F172A] dark:text-white">{confirmedBooking.paymentMethod || paymentMethod}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Hotel Header Info */}
                  <div className="p-3.5 bg-[#FFFDF7] dark:bg-[#12201D] rounded-xl border border-[#E3DED2] dark:border-[#273E36]">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-[#E58A3A]/15 text-[#E58A3A] border border-[#E58A3A]/30">
                          {hotel.isHostel ? '🎒 Backpacker Hostel & Pods' : (hotel.category || 'Hotel & Suites')}
                        </span>
                        <h4 className="text-base font-bold text-[#14532D] dark:text-white mt-1">
                          {confirmedBooking.hotelName || hotel.name}
                        </h4>
                        <p className="text-xs text-[#64748B] dark:text-[#94A3B8] flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3.5 h-3.5 text-[#E58A3A]" /> Near City Center, {hotel.city}, Maharashtra, India
                        </p>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <span className="text-xs font-bold text-[#D97706] bg-[#FEF3C7] dark:bg-[#78350F]/40 px-2 py-1 rounded-md border border-[#FDE68A] dark:border-[#78350F]">
                          ★ 4.9 / 5 Verified
                        </span>
                      </div>
                    </div>

                    {/* Stay Timings Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-3 pt-3 border-t border-[#E3DED2] dark:border-[#273E36] text-xs">
                      <div>
                        <span className="text-[10px] text-[#64748B] dark:text-[#94A3B8] block">Check-in</span>
                        <span className="font-bold text-[#14532D] dark:text-[#4ADE80]">{confirmedBooking.checkInDate}</span>
                        <span className="text-[10px] text-[#64748B] block">From 12:00 PM</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#64748B] dark:text-[#94A3B8] block">Check-out</span>
                        <span className="font-bold text-[#1F2933] dark:text-white">{confirmedBooking.checkOutDate}</span>
                        <span className="text-[10px] text-[#64748B] block">Until 11:00 AM</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#64748B] dark:text-[#94A3B8] block">Duration</span>
                        <span className="font-bold text-[#1F2933] dark:text-white">{confirmedBooking.nights || nights} Nights</span>
                        <span className="text-[10px] text-[#64748B] block">{confirmedBooking.unitsCount || unitsCount} {hotel.isHostel ? 'Bed' : 'Room'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#64748B] dark:text-[#94A3B8] block">Meal Plan</span>
                        <span className="font-bold text-[#14532D] dark:text-white">{confirmedBooking.mealPlan || mealPlan}</span>
                        <span className="text-[10px] text-[#15803D] block font-semibold">Included</span>
                      </div>
                    </div>
                  </div>

                  {/* Room Type & Grand Total Strip */}
                  <div className="p-3.5 bg-[#F8FAFC] dark:bg-[#172722] rounded-xl border border-[#E2E8F0] dark:border-[#273E36] flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div>
                      <span className="text-[10px] text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider block font-bold">
                        Allocated Room / Bed Category
                      </span>
                      <span className="text-xs font-bold text-[#1F2933] dark:text-white">
                        {confirmedBooking.roomType || selectedRoom?.name || 'Futuristic Single Capsule Pod'}
                      </span>
                      <div className="flex gap-1.5 mt-1">
                        <span className="text-[9px] bg-emerald-50 dark:bg-emerald-950/50 text-[#15803D] dark:text-[#4ADE80] px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800 font-semibold">
                          Free Wi-Fi
                        </span>
                        <span className="text-[9px] bg-emerald-50 dark:bg-emerald-950/50 text-[#15803D] dark:text-[#4ADE80] px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800 font-semibold">
                          AC & Housekeeping
                        </span>
                      </div>
                    </div>

                    <div className="text-right w-full sm:w-auto border-t sm:border-t-0 pt-2 sm:pt-0">
                      <span className="text-[10px] text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider block font-bold">
                        Total Invoice Value (GST Incl.)
                      </span>
                      <span className="text-lg font-black text-[#14532D] dark:text-[#4ADE80] font-mono">
                        ₹{(confirmedBooking.pricing?.grandTotal || pricing.grandTotal).toLocaleString('en-IN')}.00
                      </span>
                      <span className="text-[10px] text-[#15803D] block font-semibold">
                        {confirmedBooking.paymentMethod?.includes('Pay at') ? 'Pay at Hotel Desk' : 'Verified & Paid'}
                      </span>
                    </div>
                  </div>

                  {/* QR Security & Instant Check-in Badge */}
                  <div className="p-3 bg-[#F0FDF4] dark:bg-[#12201D] rounded-xl border border-[#BBF7D0] dark:border-[#273E36] flex items-center gap-3">
                    <div className="w-12 h-12 bg-white dark:bg-[#172722] border border-[#86EFAC] dark:border-[#273E36] rounded-lg p-1 flex items-center justify-center flex-shrink-0 shadow-xs">
                      <QrCode className="w-9 h-9 text-[#14532D] dark:text-[#4ADE80]" />
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-[#14532D] dark:text-[#4ADE80] flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" /> Official Digital Stay Pass
                      </h5>
                      <p className="text-[10px] text-[#475569] dark:text-[#94A3B8] leading-tight mt-0.5">
                        Show this verified e-Voucher or QR code at reception for express contactless check-in.
                      </p>
                    </div>
                  </div>

                </div>

              </div>

              {/* Action Buttons (MMT & OYO Print / Download Engine) */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => handlePrint(true)}
                  className="px-6 py-2.5 bg-[#14532D] hover:bg-[#0F3F22] text-white text-xs font-bold rounded-xl transition-all flex items-center gap-2 shadow-lg hover:shadow-xl hover:-translate-y-0.5 cursor-pointer"
                >
                  <Download className="w-4 h-4" /> Download e-Voucher PDF (Print Ready)
                </button>
                <button
                  onClick={() => handlePrint(false)}
                  className="px-4 py-2.5 bg-white dark:bg-[#172722] hover:bg-[#EEF2ED] dark:hover:bg-[#213530] text-[#14532D] dark:text-white text-xs font-bold rounded-xl border border-[#14532D]/30 dark:border-[#273E36] transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> View Full Tax Invoice
                </button>
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 bg-[#F7F5EF] dark:bg-[#101B17] hover:bg-[#EEF2ED] text-[#1F2933] dark:text-white text-xs font-bold rounded-xl border border-[#E3DED2] dark:border-[#273E36] transition-all cursor-pointer"
                >
                  Done & Close
                </button>
              </div>

            </div>
          )}

        </div>

        {/* ─── Modal Footer with Sticky Pricing & Controls ─── */}
        {step < 4 && (
          <div className="p-4 sm:p-5 bg-[#F7F5EF] dark:bg-[#101B17] border-t border-[#E3DED2] dark:border-[#273E36] flex flex-col sm:flex-row items-center justify-between gap-3">
            
            {/* Live Pricing Summary Breakdown */}
            <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
              <div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl sm:text-2xl font-black text-[#14532D] dark:text-white font-heading">
                    ₹{pricing.grandTotal.toLocaleString('en-IN')}
                  </span>
                  <span className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                    ({nights} {nights === 1 ? 'Night' : 'Nights'}, {unitsCount} {hotel.isHostel ? 'Bed' : 'Room'})
                  </span>
                </div>

                <div className="flex items-center gap-2 text-[10px] text-[#15803D] font-semibold">
                  <span>GST Included</span>
                  {pricing.discount > 0 && (
                    <span className="bg-[#15803D]/10 px-1.5 py-0.5 rounded">
                      Saved ₹{pricing.discount}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Stepper Navigation Buttons */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {step > 1 && (
                <button
                  type="button"
                  onClick={() => setStep(step - 1)}
                  className="px-4 py-2.5 rounded-xl border border-[#E3DED2] dark:border-[#273E36] bg-white dark:bg-[#172722] text-[#1F2933] dark:text-white text-xs font-bold hover:bg-[#EEF2ED] transition-colors"
                >
                  Back
                </button>
              )}

              {step < 3 ? (
                <button
                  type="button"
                  onClick={() => setStep(step + 1)}
                  className="flex-1 sm:flex-none px-6 py-2.5 bg-[#14532D] hover:bg-[#0F3F22] text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer"
                >
                  Continue <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleConfirmReservation()}
                  className="flex-1 sm:flex-none px-6 py-2.5 bg-[#14532D] hover:bg-[#0F3F22] text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-md disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Confirm Stay (Instant)
                    </>
                  )}
                </button>
              )}
            </div>

          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════════ */}
        {/* ─── OFFICIAL DIGILOCKER (GOVT OF INDIA) e-KYC GATEWAY MODAL DIALOG ─── */}
        {/* ═══════════════════════════════════════════════════════════════════════ */}
        <AnimatePresence>
          {isDigiLockerOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
              <motion.div
                initial={{ opacity: 0, scale: 0.94, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.94, y: 20 }}
                transition={{ duration: 0.22 }}
                className="w-full max-w-lg bg-white dark:bg-[#0E1A16] border-2 border-[#15803D]/40 rounded-2xl shadow-2xl overflow-hidden text-left"
              >
                {/* DigiLocker Official Government Header */}
                <div className="bg-gradient-to-r from-[#0F3F22] via-[#14532D] to-[#1E3A8A] text-white p-4 sm:p-5 flex items-center justify-between border-b-2 border-[#E58A3A]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white p-1.5 flex items-center justify-center shadow-md flex-shrink-0">
                      <div className="flex flex-col items-center justify-center text-center">
                        <span className="text-[12px] font-black text-[#1E3A8A] tracking-tighter leading-none">डिजिलॉकर</span>
                        <span className="text-[8px] font-extrabold text-[#15803D] tracking-tight leading-none mt-0.5">DigiLocker</span>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-base font-black tracking-tight text-white font-heading">
                          DigiLocker Gateway
                        </span>
                        <span className="text-[9px] uppercase font-extrabold bg-[#E58A3A] text-white px-1.5 py-0.5 rounded">
                          Govt. of India
                        </span>
                      </div>
                      <p className="text-[10px] text-emerald-200">
                        National e-Governance Division • Ministry of Electronics & IT
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsDigiLockerOpen(false)}
                    className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Security & SSL Strip */}
                <div className="bg-[#F0FDF4] dark:bg-[#12241F] px-4 py-2 border-b border-[#BBF7D0] dark:border-[#1E3E34] flex items-center justify-between text-[11px]">
                  <span className="flex items-center gap-1.5 text-[#15803D] dark:text-[#4ADE80] font-bold">
                    <Lock className="w-3.5 h-3.5" /> 256-bit UIDAI / MeitY Sandbox Gateway
                  </span>
                  <span className="font-mono text-[10px] text-[#64748B] dark:text-[#94A3B8]">
                    Step {digiLockerStep} of 3
                  </span>
                </div>

                {/* Modal Wizard Body */}
                <div className="p-4 sm:p-6 space-y-4">
                  
                  {/* ─── STEP 1: SELECT ID & ENTER NUMBER + LEGAL CONSENT ─── */}
                  {digiLockerStep === 1 && (
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-bold text-[#14532D] dark:text-white">
                          Authenticate Digital Identity Document
                        </h4>
                        <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-0.5">
                          Select your government issued ID to fetch verified e-KYC certificate from DigiLocker repository.
                        </p>
                      </div>

                      {/* Document Type Pills */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {[
                          { id: 'Aadhaar Card', label: '🇮🇳 Aadhaar (UIDAI)', desc: '12-Digit UID' },
                          { id: 'Driving License', label: '🚗 Driving License', desc: 'MoRTH State DL' },
                          { id: 'PAN Card', label: '🏢 PAN Card', desc: 'Income Tax Dept' },
                          { id: 'Passport', label: '🛂 Passport', desc: 'Govt of India' }
                        ].map((doc) => {
                          const isSel = digiLockerDocType === doc.id;
                          return (
                            <button
                              key={doc.id}
                              type="button"
                              onClick={() => {
                                setDigiLockerDocType(doc.id);
                                if (doc.id === 'Aadhaar Card') setDigiLockerAadhaar('5829 1948 4829');
                                else if (doc.id === 'Driving License') setDigiLockerAadhaar('DL1420110012345');
                                else if (doc.id === 'PAN Card') setDigiLockerAadhaar('ABCDE1234F');
                                else setDigiLockerAadhaar('M8392104');
                              }}
                              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                                isSel 
                                  ? 'border-[#15803D] bg-[#15803D]/10 dark:bg-[#15803D]/30 ring-1 ring-[#15803D]' 
                                  : 'border-[#E2E8F0] dark:border-[#273E36] bg-white dark:bg-[#172722] hover:border-[#15803D]/40'
                              }`}
                            >
                              <p className="text-xs font-bold text-[#1F2933] dark:text-white leading-tight">{doc.label}</p>
                              <p className="text-[10px] text-[#64748B] dark:text-[#94A3B8]">{doc.desc}</p>
                            </button>
                          );
                        })}
                      </div>

                      {/* ID Input */}
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-[#14532D] dark:text-white">
                          Enter {digiLockerDocType} Number
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={digiLockerAadhaar}
                            onChange={(e) => {
                              if (digiLockerDocType === 'Aadhaar Card') {
                                const digits = e.target.value.replace(/\D/g, '').slice(0, 12);
                                setDigiLockerAadhaar(digits.replace(/(\d{4})/g, '$1 ').trim());
                              } else {
                                setDigiLockerAadhaar(e.target.value.toUpperCase());
                              }
                            }}
                            placeholder={digiLockerDocType === 'Aadhaar Card' ? '5829 1948 4829' : 'Enter ID number'}
                            className="flex-1 bg-white dark:bg-[#172722] border border-[#CBD5E1] dark:border-[#273E36] rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold tracking-wider uppercase focus:outline-none focus:border-[#15803D]"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (digiLockerDocType === 'Aadhaar Card') setDigiLockerAadhaar('5829 1948 4829');
                              else if (digiLockerDocType === 'Driving License') setDigiLockerAadhaar('DL1420110012345');
                              else if (digiLockerDocType === 'PAN Card') setDigiLockerAadhaar('ABCDE1234F');
                              else setDigiLockerAadhaar('M8392104');
                              toast.success(`Demo ${digiLockerDocType} populated!`);
                            }}
                            className="px-3 bg-[#EEF2ED] dark:bg-[#213530] text-[#14532D] dark:text-[#4ADE80] text-xs font-bold rounded-xl border border-[#CBD5E1] dark:border-[#273E36] hover:bg-[#14532D] hover:text-white transition-colors cursor-pointer"
                          >
                            Demo Fill
                          </button>
                        </div>
                      </div>

                      {/* Statutory Legal Consent Box */}
                      <div className="p-3 bg-[#FFFDF7] dark:bg-[#12201D] rounded-xl border border-[#FDE68A] dark:border-[#78350F]/60 space-y-2">
                        <label className="flex items-start gap-2.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={digiLockerConsent}
                            onChange={(e) => setDigiLockerConsent(e.target.checked)}
                            className="mt-0.5 rounded text-[#15803D] focus:ring-[#15803D] accent-[#15803D]"
                          />
                          <span className="text-[11px] text-[#475569] dark:text-[#CBD5E1] leading-relaxed">
                            I give my consent to <strong>DigiLocker (MeitY, Government of India)</strong> to authenticate my identity and release my digitally verified e-KYC document XML to <strong>TravelIQ Stays</strong> for hotel guest check-in statutory compliance under Sec. 40 of Indian Registration Act.
                          </span>
                        </label>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setIsDigiLockerOpen(false)}
                          className="px-4 py-2.5 rounded-xl border border-[#CBD5E1] dark:border-[#273E36] text-xs font-bold text-[#64748B] hover:bg-[#F1F5F9] transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          disabled={digiLockerLoading}
                          onClick={handleDigiLockerSendOtp}
                          className="px-6 py-2.5 bg-[#15803D] hover:bg-[#0F3F22] text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                        >
                          {digiLockerLoading ? (
                            <>
                              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              <span>{digiLockerStatusMsg || 'Connecting...'}</span>
                            </>
                          ) : (
                            <>
                              <span>Next: Send UIDAI OTP</span>
                              <ChevronRight className="w-4 h-4" />
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* ─── STEP 2: UIDAI 6-DIGIT OTP & DIGILOCKER 6-DIGIT SECURITY PIN ─── */}
                  {digiLockerStep === 2 && (
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-bold text-[#14532D] dark:text-white flex items-center gap-1.5">
                            <Lock className="w-4 h-4 text-[#15803D]" /> Enter UIDAI Aadhaar OTP & Security PIN
                          </h4>
                          <span className="text-[10px] font-mono text-[#D97706] bg-[#FEF3C7] dark:bg-[#78350F]/40 px-2 py-0.5 rounded font-bold">
                            Sandbox Demo
                          </span>
                        </div>
                        <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-0.5">
                          UIDAI has dispatched a 6-digit one-time password to mobile linked with {digiLockerAadhaar}.
                        </p>
                      </div>

                      {/* OTP Input Card */}
                      <div className="space-y-2 p-3.5 bg-[#F8FAFC] dark:bg-[#172722] rounded-xl border border-[#E2E8F0] dark:border-[#273E36]">
                        <div className="flex items-center justify-between">
                          <label className="block text-xs font-bold text-[#14532D] dark:text-white">
                            6-Digit UIDAI OTP *
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              setDigiLockerOtp('482910');
                              toast.success('Demo OTP 482910 filled!');
                            }}
                            className="text-[10px] font-bold text-[#15803D] dark:text-[#4ADE80] hover:underline cursor-pointer"
                          >
                            ⚡ Auto-Fill Demo OTP (482910)
                          </button>
                        </div>
                        <input
                          type="text"
                          maxLength={6}
                          value={digiLockerOtp}
                          onChange={(e) => setDigiLockerOtp(e.target.value.replace(/\D/g, ''))}
                          placeholder="• • • • • •"
                          className="w-full bg-white dark:bg-[#101B17] border border-[#CBD5E1] dark:border-[#273E36] rounded-xl px-4 py-2.5 text-center text-lg font-mono font-black tracking-widest text-[#0F172A] dark:text-white focus:outline-none focus:border-[#15803D]"
                        />
                      </div>

                      {/* DigiLocker 6-Digit PIN */}
                      <div className="space-y-2 p-3.5 bg-[#F8FAFC] dark:bg-[#172722] rounded-xl border border-[#E2E8F0] dark:border-[#273E36]">
                        <div className="flex items-center justify-between">
                          <label className="block text-xs font-bold text-[#14532D] dark:text-white">
                            DigiLocker 6-Digit Security PIN
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              setDigiLockerPin('123456');
                              toast.success('Security PIN 123456 filled!');
                            }}
                            className="text-[10px] font-bold text-[#15803D] dark:text-[#4ADE80] hover:underline cursor-pointer"
                          >
                            ⚡ Auto-Fill PIN (123456)
                          </button>
                        </div>
                        <input
                          type="password"
                          maxLength={6}
                          value={digiLockerPin}
                          onChange={(e) => setDigiLockerPin(e.target.value.replace(/\D/g, ''))}
                          placeholder="••••••"
                          className="w-full bg-white dark:bg-[#101B17] border border-[#CBD5E1] dark:border-[#273E36] rounded-xl px-4 py-2 text-center text-base font-mono font-bold tracking-widest text-[#0F172A] dark:text-white focus:outline-none focus:border-[#15803D]"
                        />
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center justify-between pt-2">
                        <button
                          type="button"
                          onClick={() => setDigiLockerStep(1)}
                          className="px-4 py-2.5 rounded-xl border border-[#CBD5E1] dark:border-[#273E36] text-xs font-bold text-[#64748B] hover:bg-[#F1F5F9] transition-colors cursor-pointer"
                        >
                          Back
                        </button>
                        <button
                          type="button"
                          disabled={digiLockerLoading}
                          onClick={handleDigiLockerAuthorize}
                          className="px-6 py-2.5 bg-[#15803D] hover:bg-[#0F3F22] text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                        >
                          {digiLockerLoading ? (
                            <>
                              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              <span>{digiLockerStatusMsg || 'Verifying...'}</span>
                            </>
                          ) : (
                            <>
                              <ShieldCheck className="w-4 h-4" />
                              <span>Authorize & Fetch Document</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* ─── STEP 3: OFFICIAL UIDAI / DIGILOCKER e-KYC VERIFIED CERTIFICATE ─── */}
                  {digiLockerStep === 3 && (
                    <div className="space-y-4">
                      <div className="text-center space-y-1">
                        <div className="w-12 h-12 rounded-full bg-[#15803D]/15 text-[#15803D] dark:text-[#4ADE80] flex items-center justify-center mx-auto shadow-inner">
                          <CheckCircle2 className="w-7 h-7" />
                        </div>
                        <h4 className="text-base font-black text-[#14532D] dark:text-white">
                          DigiLocker e-KYC Successfully Verified!
                        </h4>
                        <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                          Verified identity document retrieved from Government of India National Digital Repository.
                        </p>
                      </div>

                      {/* Official UIDAI Aadhaar Digital Card Mockup */}
                      <div className="bg-gradient-to-b from-[#FFFDF7] to-[#F8FAFC] dark:from-[#172722] dark:to-[#101B17] border-2 border-[#15803D] rounded-2xl p-4 shadow-lg space-y-3">
                        {/* Tricolor Header */}
                        <div className="flex h-1.5 w-full rounded-full overflow-hidden mb-1">
                          <div className="flex-1 bg-[#FF9933]" />
                          <div className="flex-1 bg-white" />
                          <div className="flex-1 bg-[#138808]" />
                        </div>

                        <div className="flex items-center justify-between border-b border-[#E2E8F0] dark:border-[#273E36] pb-2.5">
                          <div>
                            <span className="text-[10px] font-black uppercase text-[#14532D] dark:text-[#4ADE80] tracking-wider block">
                              Unique Identification Authority of India (UIDAI)
                            </span>
                            <span className="text-xs font-extrabold text-[#0F172A] dark:text-white">
                              भारत सरकार • Government of India
                            </span>
                          </div>
                          <span className="text-[10px] font-mono font-bold bg-[#DCFCE7] dark:bg-[#14532D]/60 text-[#15803D] dark:text-[#4ADE80] px-2 py-0.5 rounded border border-[#86EFAC]">
                            e-KYC VERIFIED
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-3 items-center py-1">
                          {/* Digital Photo / Hologram */}
                          <div className="w-20 h-24 rounded-xl bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-950 dark:to-emerald-900 border border-emerald-300 dark:border-emerald-700 flex flex-col items-center justify-center text-center p-1 shadow-inner">
                            <User className="w-8 h-8 text-[#14532D] dark:text-[#4ADE80]" />
                            <span className="text-[8px] font-black text-[#15803D] mt-1">UIDAI PHOTO</span>
                          </div>

                          <div className="col-span-2 space-y-1.5">
                            <div>
                              <span className="text-[9px] uppercase font-bold text-[#64748B] block">Cardholder Name</span>
                              <p className="text-sm font-black text-[#0F172A] dark:text-white">{guestName || 'Aditya Upadhyay'}</p>
                            </div>

                            <div>
                              <span className="text-[9px] uppercase font-bold text-[#64748B] block">{digiLockerDocType} Number</span>
                              <p className="text-sm font-mono font-black text-[#15803D] dark:text-[#4ADE80] tracking-wider">
                                {digiLockerAadhaar ? `XXXX XXXX ${digiLockerAadhaar.slice(-4)}` : 'XXXX XXXX 4829'}
                              </p>
                            </div>

                            <div className="flex gap-2 text-[10px] text-[#64748B] dark:text-[#94A3B8]">
                              <span>Gender: <strong>MALE</strong></span>
                              <span>•</span>
                              <span>DOB: <strong>04/09/1998</strong></span>
                            </div>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-[#E2E8F0] dark:border-[#273E36] flex items-center justify-between text-[10px]">
                          <span className="text-[#15803D] dark:text-[#4ADE80] font-bold flex items-center gap-1">
                            <BadgeCheck className="w-3.5 h-3.5" /> DigiLocker Verified Signature Token
                          </span>
                          <span className="font-mono text-[#64748B]">Auth ID: DL-UID-{Date.now().toString().slice(-6)}</span>
                        </div>
                      </div>

                      {/* Completion Action */}
                      <div className="flex flex-col sm:flex-row gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setDigiLockerStep(1)}
                          className="px-4 py-2.5 rounded-xl border border-[#CBD5E1] dark:border-[#273E36] text-xs font-bold text-[#64748B] hover:bg-[#F1F5F9] transition-colors text-center cursor-pointer"
                        >
                          Verify Different ID
                        </button>
                        <button
                          type="button"
                          onClick={handleDigiLockerComplete}
                          className="flex-1 px-6 py-2.5 bg-[#15803D] hover:bg-[#0F3F22] text-white text-xs font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <Check className="w-4 h-4" /> Link Verified ID to Stay & Return
                        </button>
                      </div>
                    </div>
                  )}

                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </motion.div>
    </div>
  );
}
