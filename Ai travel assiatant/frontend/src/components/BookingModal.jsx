import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Users, CheckCircle, Plus, Minus, 
  Train as TrainIcon, Plane, Bus, Receipt, 
  ArrowRight, ArrowLeft, ShieldCheck, Sparkles, AlertCircle,
  Smartphone, QrCode, Copy, Check, RefreshCw, Zap,
  Building2, Bed, Home, Star, MapPin, ExternalLink, Filter, CheckCircle2, Tag, Coffee
} from 'lucide-react';
import QRCode from 'qrcode';
import toast from 'react-hot-toast';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import HotelBookingModal from './HotelBookingModal';

const classDisplayNames = {
  '1A': 'First AC (1A)',
  '2A': 'Second AC (2A)',
  '3A': 'Third AC (3A)',
  '3E': 'Economy AC (3E)',
  'CC': 'AC Chair Car (CC)',
  'EC': 'Exec Chair Car (EC)',
  'EA': 'Anubhuti Class (EA)',
  'SL': 'Sleeper Class (SL)',
  '2S': 'Second Sitting (2S)',
  'UR': 'Unreserved',
  'General': 'General Class',
  'Economy': 'Economy Class',
  'Flexi': 'Flexible Economy',
  'Business': 'Business Class',
  'First': 'First Class',
  'AC Sleeper': 'AC Sleeper Coach',
  'AC Semi-Sleeper': 'AC Semi-Sleeper',
  'Non-AC Sleeper': 'Non-AC Sleeper',
  'Volvo AC': 'Volvo Multi-Axle AC'
};

function extractNormalizedFares(transportItem) {
  if (!transportItem) {
    return { '3A': 1250, '2A': 1850, '1A': 2900, 'SL': 520 };
  }

  const parsedFares = {};

  // 1. Direct fares dictionary { '3A': 1250, ... }
  if (transportItem.fares && typeof transportItem.fares === 'object' && !Array.isArray(transportItem.fares)) {
    for (const [key, val] of Object.entries(transportItem.fares)) {
      if (val !== undefined && val !== null) {
        const numVal = typeof val === 'number' ? val : parseInt(String(val).replace(/[^\d]/g, ''), 10);
        if (!isNaN(numVal) && numVal > 0) {
          parsedFares[key] = numVal;
        }
      }
    }
  }

  // 2. Classes array format: ['3A - ₹1,250', '2A - ₹1,850'] or ['Economy - ₹3,450'] or [{ class: '3A', fare: 1250 }]
  if (Object.keys(parsedFares).length === 0 && Array.isArray(transportItem.classes)) {
    transportItem.classes.forEach(item => {
      if (typeof item === 'string') {
        if (item.includes('-') || item.includes('₹') || item.includes('Rs')) {
          const parts = item.split('-');
          const code = parts[0]?.trim();
          const priceStr = parts[1] || parts[0];
          const price = parseInt(priceStr.replace(/[^\d]/g, ''), 10);
          if (code && !isNaN(price)) {
            parsedFares[code] = price;
          }
        } else {
          const base = transportItem.price || 1200;
          parsedFares[item.trim()] = base;
        }
      } else if (typeof item === 'object' && item !== null) {
        const code = item.class || item.className || item.type || item.name;
        const price = item.fare || item.price || item.amount;
        if (code && price) {
          parsedFares[code] = typeof price === 'number' ? price : parseInt(String(price).replace(/[^\d]/g, ''), 10);
        }
      }
    });
  }

  // 3. available_classes array
  if (Object.keys(parsedFares).length === 0 && Array.isArray(transportItem.available_classes)) {
    transportItem.available_classes.forEach(cls => {
      const base = transportItem.price || 1200;
      parsedFares[cls] = base;
    });
  }

  // 4. Default fallback based on transport type and base price
  if (Object.keys(parsedFares).length === 0) {
    const isFlight = transportItem.type === 'Flight' || transportItem.name?.toLowerCase().includes('indigo') || transportItem.name?.toLowerCase().includes('air');
    const isBus = transportItem.type === 'Bus' || transportItem.name?.toLowerCase().includes('bus') || transportItem.name?.toLowerCase().includes('vrl');
    const basePrice = transportItem.price || (isFlight ? 3450 : isBus ? 980 : 1250);

    if (isFlight) {
      parsedFares['Economy'] = basePrice;
      parsedFares['Flexi'] = Math.round(basePrice * 1.25);
      parsedFares['Business'] = Math.round(basePrice * 2.4);
    } else if (isBus) {
      parsedFares['AC Sleeper'] = basePrice;
      parsedFares['AC Semi-Sleeper'] = Math.round(basePrice * 0.8);
    } else {
      parsedFares['3A'] = basePrice;
      parsedFares['2A'] = Math.round(basePrice * 1.48);
      parsedFares['1A'] = Math.round(basePrice * 2.32);
      parsedFares['SL'] = Math.round(basePrice * 0.38);
    }
  }

  return parsedFares;
}

const CLASS_SORT_ORDER = [
  'EC', '1A', '2A', '3A', '3E', 'CC', 'SL', '2S', 'UR', 'General', 'GN',
  'First', 'Business', 'Flexi', 'Economy',
  'AC Sleeper', 'AC Semi-Sleeper', 'Non-AC Sleeper', 'Volvo AC', 'Volvo Seater'
];

export default function BookingModal({ train, onClose }) {
  const { user } = useAuth();
  const [step, setStep] = useState(1); // 1: Class Selection, 2: Passengers, 3: Payment
  
  // Normalized fares dictionary
  const fares = useMemo(() => extractNormalizedFares(train), [train]);
  const availableClasses = useMemo(() => {
    const keys = Object.keys(fares);
    return keys.sort((a, b) => {
      const idxA = CLASS_SORT_ORDER.indexOf(a);
      const idxB = CLASS_SORT_ORDER.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.localeCompare(b);
    });
  }, [fares]);

  // Determine transport type
  const transportType = useMemo(() => {
    if (train?.type) return train.type;
    const nameLower = (train?.train_name || train?.name || '').toLowerCase();
    if (nameLower.includes('indigo') || nameLower.includes('air') || nameLower.includes('flight') || nameLower.includes('spice')) return 'Flight';
    if (nameLower.includes('bus') || nameLower.includes('vrl') || nameLower.includes('travels') || nameLower.includes('volvo')) return 'Bus';
    return 'Train';
  }, [train]);

  const [selectedClass, setSelectedClass] = useState(null);

  // Auto-select initial class
  useEffect(() => {
    if (availableClasses.length > 0) {
      if (!selectedClass || !fares[selectedClass]) {
        // Pick 3A/Economy or first available
        const defaultClass = availableClasses.find(c => c === '3A' || c === 'Economy' || c === 'CC') || availableClasses[0];
        setSelectedClass(defaultClass);
      }
    }
  }, [availableClasses, fares, selectedClass]);

  const [aiRec, setAiRec] = useState({ 
    recommendedClass: availableClasses[0] || '3A', 
    predictedOccupancy: 74, 
    predictedDelay: 12 
  });
  const [loadingAi, setLoadingAi] = useState(false);

  useEffect(() => {
    const fetchBookingAi = async () => {
      if (!train) return;
      setLoadingAi(true);
      try {
        const trainNum = train.train_number || train.number || '12301';
        const classCode = selectedClass || availableClasses[0] || '3A';
        const [delayRes, occRes] = await Promise.all([
          api.post('/ai/predict-delay', {
            train_number: trainNum,
            route: 'DEL-MUM',
            day_of_week: new Date().getDay() + 1,
            month: new Date().getMonth() + 1,
            season: 2,
            weather: 'Clear'
          }).catch(() => ({ data: { expected_arrival_delay_mins: 12 } })),
          api.post('/ai/predict-occupancy', {
            train_number: trainNum,
            class_code: classCode,
            month: new Date().getMonth() + 1,
            day_of_week: new Date().getDay() + 1,
            season_code: 2
          }).catch(() => ({ data: { coach_occupancy_percent: 74 } }))
        ]);
        
        const rec = availableClasses.find(c => c === '3A' || c === 'Economy' || c === 'CC') || availableClasses[0] || '3A';

        setAiRec({
          recommendedClass: rec,
          predictedOccupancy: Math.round(occRes.data?.coach_occupancy_percent || 74),
          predictedDelay: Math.round(delayRes.data?.expected_arrival_delay_mins || 12)
        });
      } catch (err) {
        console.error("Booking AI load failed:", err.message);
      } finally {
        setLoadingAi(false);
      }
    };
    fetchBookingAi();
  }, [train, availableClasses, selectedClass]);

  const [passengerCount, setPassengerCount] = useState(1);
  const [passengers, setPassengers] = useState([
    { 
      name: user?.name || '', 
      age: '', 
      gender: '', 
      seatPref: 'No Preference', 
      isSenior: false, 
      isChild: false, 
      nationality: 'Indian', 
      mealPref: 'No Preference' 
    }
  ]);

  // Keep passenger 1 name synced if user loads later
  useEffect(() => {
    if (user?.name && passengers.length > 0 && !passengers[0].name) {
      setPassengers(prev => [
        { ...prev[0], name: user.name },
        ...prev.slice(1)
      ]);
    }
  }, [user]);

  const [bookingComplete, setBookingComplete] = useState(false);
  const [confirmedBookingData, setConfirmedBookingData] = useState(null);

  // Destination Stay Booking states (Hotels, Dorms, Homestays)
  const [destHotels, setDestHotels] = useState([]);
  const [loadingDestHotels, setLoadingDestHotels] = useState(false);
  const [stayCategory, setStayCategory] = useState('all'); // 'all', 'hostel', 'homestay', 'hotel'
  const [selectedHotelForBooking, setSelectedHotelForBooking] = useState(null);
  const [confirmedStay, setConfirmedStay] = useState(null);

  // Extract destination city name
  const destinationCity = useMemo(() => {
    if (!train) return 'Delhi';
    const rawCity = train.destination_city || train.destCity || train.arrStation || train.destStation || train.destination_name || train.destination_station_code || train.destination_code || train.dest || 'Delhi';
    return String(rawCity)
      .replace(/\s*(junction|jn|jn\.|city|nagar|cantonment|cantt|cantt\.|airport|railway station|central)$/i, '')
      .trim();
  }, [train]);

  // Fetch verified stays in destination city once ticket booking completes
  useEffect(() => {
    if (bookingComplete && destinationCity) {
      setLoadingDestHotels(true);
      api.get(`/hotels/search?destination=${encodeURIComponent(destinationCity)}&limit=16`)
        .then(res => {
          if (res.data?.hotels) {
            setDestHotels(res.data.hotels);
          }
        })
        .catch(err => {
          console.warn('Could not fetch destination hotels:', err.message);
        })
        .finally(() => {
          setLoadingDestHotels(false);
        });
    }
  }, [bookingComplete, destinationCity]);

  // Filter destination stays
  const filteredDestHotels = useMemo(() => {
    if (!destHotels || destHotels.length === 0) return [];
    if (stayCategory === 'hostel') {
      return destHotels.filter(h => h.isHostel || h.category?.toLowerCase().includes('hostel') || h.category?.toLowerCase().includes('dorm'));
    }
    if (stayCategory === 'homestay') {
      return destHotels.filter(h => 
        h.category?.toLowerCase().includes('homestay') || 
        h.category?.toLowerCase().includes('villa') || 
        h.category?.toLowerCase().includes('cottage') ||
        h.type?.toLowerCase().includes('homestay') ||
        h.type?.toLowerCase().includes('villa')
      );
    }
    if (stayCategory === 'hotel') {
      return destHotels.filter(h => !h.isHostel && !h.category?.toLowerCase().includes('homestay') && !h.category?.toLowerCase().includes('villa'));
    }
    return destHotels;
  }, [destHotels, stayCategory]);
  
  // Passenger configurator helpers
  const updatePassenger = (index, field, value) => {
    const updated = [...passengers];
    updated[index][field] = value;
    setPassengers(updated);
  };

  const handleAddPassenger = () => {
    if (passengerCount >= 6) return toast.error("Maximum 6 passengers allowed per booking.");
    setPassengerCount(prev => prev + 1);
    setPassengers(prev => [
      ...prev, 
      { 
        name: '', 
        age: '', 
        gender: '', 
        seatPref: 'No Preference', 
        isSenior: false, 
        isChild: false, 
        nationality: 'Indian', 
        mealPref: 'No Preference' 
      }
    ]);
  };

  const handleRemovePassenger = (index) => {
    if (passengerCount <= 1) return;
    setPassengerCount(prev => prev - 1);
    setPassengers(prev => prev.filter((_, i) => i !== index));
  };

  // --- Fare Calculation Engine ---
  const baseFarePerAdult = selectedClass && fares[selectedClass] ? fares[selectedClass] : (fares[availableClasses[0]] || 0);
  const baseFarePerChild = Math.round(baseFarePerAdult * 0.5); // 50% for children
  
  const adultCount = passengers.filter(p => !p.isChild).length;
  const childCount = passengers.filter(p => p.isChild).length;
  
  const totalBaseFare = (adultCount * baseFarePerAdult) + (childCount * baseFarePerChild);
  
  const reservationCharge = passengerCount * (transportType === 'Flight' ? 120 : transportType === 'Bus' ? 25 : 40);
  const superfastCharge = passengerCount * (transportType === 'Flight' ? 180 : transportType === 'Bus' ? 30 : 45);
  const convenienceFee = 25; // Flat fee
  
  const totalFare = totalBaseFare > 0 ? (totalBaseFare + reservationCharge + superfastCharge + convenienceFee) : 0;
  // -------------------------------

  // Payment states
  const [paymentTab, setPaymentTab] = useState('qr'); // qr, upi, card, wallet
  const [upiId, setUpiId] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState(user?.name || '');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Dynamic Functional QR states
  const DUMMY_UPI_ID = 'traveliq.sandbox@icici';
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [qrTimer, setQrTimer] = useState(300); // 5 minutes countdown
  const [qrCopied, setQrCopied] = useState(false);
  const [isSimulatingScan, setIsSimulatingScan] = useState(false);

  // Generate dynamic crisp QR code
  useEffect(() => {
    if (totalFare > 0) {
      const dummyPayload = `upi://pay?pa=${DUMMY_UPI_ID}&pn=TravelIQ%20Bookings&am=${totalFare}&cu=INR&tn=TicketReservation_${train?.train_number || '12301'}_${Date.now()}`;
      QRCode.toDataURL(dummyPayload, {
        width: 480,
        margin: 2,
        color: {
          dark: '#12201D',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'H'
      }).then(url => {
        setQrCodeUrl(url);
      }).catch(err => {
        console.error('QR Generation error:', err);
      });
    }
  }, [totalFare, train]);

  // QR Code Expiry Countdown Timer
  useEffect(() => {
    let timerId;
    if (step === 3 && paymentTab === 'qr' && qrTimer > 0) {
      timerId = setInterval(() => {
        setQrTimer(prev => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timerId);
  }, [step, paymentTab, qrTimer]);

  const formatTimer = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleCopyDummyUpi = () => {
    navigator.clipboard.writeText(DUMMY_UPI_ID);
    setQrCopied(true);
    toast.success("Sandbox UPI ID copied to clipboard!");
    setTimeout(() => setQrCopied(false), 2500);
  };

  const handleResetQr = () => {
    setQrTimer(300);
    toast.success("QR Code refreshed with new session reference.");
  };

  const handleSimulateScanAndPay = async () => {
    if (isProcessing || isSimulatingScan) return;
    setIsSimulatingScan(true);
    toast.loading("Simulating UPI App Scan & Authorization...", { id: "qr-sim-toast" });
    
    setTimeout(async () => {
      toast.dismiss("qr-sim-toast");
      setIsSimulatingScan(false);
      await handleProcessBookingPayment();
    }, 1200);
  };

  const handleNextStep = () => {
    if (!selectedClass) {
      return toast.error("Please select a travel class to continue.");
    }
    setStep(2);
  };

  const handleConfirm = () => {
    const invalid = passengers.some(p => !p.name || !p.age || !p.gender);
    if (invalid) return toast.error("Please fill in name, age, and gender for all passengers.");
    if (!selectedClass) return toast.error("Please select a travel class.");
    if (totalFare === 0) return toast.error("Fare not calculated. Cannot proceed.");
    
    setStep(3); // Go to Payment options
  };

  // Process secure payment using backend API
  const handleProcessBookingPayment = async () => {
    if (paymentTab === 'upi') {
      if (!upiId || !upiId.includes('@')) {
        return toast.error("Please enter a valid UPI ID (e.g. aditya@oksbi or 9876543210@paytm)");
      }
    } else if (paymentTab === 'card') {
      if (cardNumber.replace(/\s/g, '').length !== 16) {
        return toast.error("Please enter a valid 16-digit card number.");
      }
      if (!cardHolder.trim()) {
        return toast.error("Please enter the cardholder name.");
      }
      if (cardExpiry.length !== 5) {
        return toast.error("Please enter expiry in MM/YY format.");
      }
      if (cardCvv.length !== 3) {
        return toast.error("Please enter a valid 3-digit CVV.");
      }
    }

    setIsProcessing(true);

    try {
      const bookingPayload = {
        source_station_code: train.source_code || train.depStation || train.source || 'DEL',
        destination_station_code: train.destination_code || train.arrStation || train.dest || 'BOM',
        train_number: train.train_number || train.number || '12301',
        travel_class: selectedClass,
        ticket_fare: totalFare,
        booking_date: new Date(),
        passengers: passengers,
        seat_preference: passengers[0]?.seatPref || 'No Preference',
        berth_preference: passengers[0]?.seatPref || 'No Preference',
        adult_count: adultCount,
        child_count: childCount,
        total_passengers: passengerCount
      };

      // 1. Create database booking
      const res = await api.post('/profile/bookings', bookingPayload);
      const booking = res.data.booking;

      // 2. Log payment transaction
      try {
        const paymentMethodName = paymentTab === 'qr'
          ? 'UPI_QR_SANDBOX'
          : paymentTab === 'upi' 
            ? `UPI_${upiId}` 
            : paymentTab.toUpperCase();

        await api.post('/payment/transaction', {
          booking_id: booking.id,
          amount: totalFare,
          payment_method: paymentMethodName,
          status: 'Success',
          transaction_ref: paymentTab === 'qr' ? `QR_TXN_${Date.now()}` : `UPI_TXN_${Date.now()}`
        });
      } catch (payErr) {
        console.warn("Payment transaction log notice:", payErr.message);
      }

      setConfirmedBookingData(booking);
      setBookingComplete(true);
      toast.success("Payment verified! Ticket booked successfully.");
    } catch (err) {
      console.error("Booking error:", err);
      toast.error(err.response?.data?.message || "Booking transaction failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const transportIcon = () => {
    if (transportType === 'Flight') return <Plane className="w-5 h-5" />;
    if (transportType === 'Bus') return <Bus className="w-5 h-5" />;
    return <TrainIcon className="w-5 h-5" />;
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-[#FFFFFF] dark:bg-[#1B2C28] border border-[#E3DED2] dark:border-[#2A403A] rounded-2xl w-full max-w-5xl my-auto max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-[#E3DED2] dark:border-[#2A403A] flex justify-between items-center bg-[#F7F5EF] dark:bg-[#12201D] shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#EEF2ED] dark:bg-[#213530] text-[#173F3A] dark:text-[#EEF2ED] rounded-xl border border-[#E3DED2] dark:border-[#2A403A]">
              {transportIcon()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#173F3A]/10 dark:bg-[#EEF2ED]/10 text-[#173F3A] dark:text-[#EEF2ED]">
                  {transportType} Booking
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-[#263238] dark:text-[#F7F5EF] mt-0.5">
                {train?.train_name || train?.name || 'Express Service'} 
                <span className="font-mono text-xs text-[#66736F] dark:text-[#A3B0AB] ml-2">
                  (#{train?.train_number || train?.number || '12301'})
                </span>
              </h2>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 bg-[#E3DED2]/60 hover:bg-[#E3DED2] dark:bg-[#2A403A]/60 dark:hover:bg-[#2A403A] rounded-full transition-colors text-[#263238] dark:text-[#F7F5EF] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main Split Content */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          
          {/* Left: Interactive Form Area */}
          <div className="w-full lg:w-2/3 overflow-y-auto p-5 sm:p-6 space-y-6 bg-[#FFFFFF] dark:bg-[#1B2C28]">
            
            {bookingComplete ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-8 sm:py-12">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', damping: 10 }}>
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#4F7D62]/15 text-[#4F7D62] flex items-center justify-center mb-5 mx-auto">
                    <CheckCircle className="w-10 h-10 sm:w-12 sm:h-12" />
                  </div>
                </motion.div>
                <h3 className="text-2xl font-bold text-[#263238] dark:text-[#F7F5EF] mb-2">Booking Confirmed!</h3>
                <p className="text-[#66736F] dark:text-[#A3B0AB] text-sm mb-6 max-w-md">
                  Your reservation on <strong>{train?.train_name || train?.name}</strong> has been confirmed and verified.
                </p>
                
                {confirmedBookingData && (
                  <div className="w-full max-w-md bg-[#F7F5EF] dark:bg-[#12201D] border border-[#E3DED2] dark:border-[#2A403A] rounded-xl p-4 sm:p-5 text-left space-y-3 shadow-sm">
                    <div className="flex justify-between items-center text-xs border-b border-[#E3DED2] dark:border-[#2A403A] pb-2">
                      <span className="text-[#66736F] dark:text-[#A3B0AB] uppercase font-semibold">PNR / Ticket Ref</span>
                      <span className="font-bold text-[#263238] dark:text-[#F7F5EF] font-mono text-sm">49204{confirmedBookingData.id}49</span>
                    </div>
                    <div className="flex justify-between items-center text-xs border-b border-[#E3DED2] dark:border-[#2A403A] pb-2">
                      <span className="text-[#66736F] dark:text-[#A3B0AB] uppercase font-semibold">Payment Status</span>
                      <span className="bg-[#4F7D62]/15 text-[#4F7D62] border border-[#4F7D62]/30 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" /> Paid (₹{totalFare.toLocaleString()})
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-[#66736F] dark:text-[#A3B0AB] uppercase font-semibold">Allocated Class</span>
                      <span className="text-[#263238] dark:text-[#F7F5EF] font-bold">
                        {confirmedBookingData.travel_class} ({classDisplayNames[confirmedBookingData.travel_class] || confirmedBookingData.travel_class})
                      </span>
                    </div>
                  </div>
                )}

                {/* Confirmed Stay Notification Banner */}
                {confirmedStay ? (
                  <div className="w-full max-w-md mt-3.5 p-3.5 bg-[#DCFCE7]/80 dark:bg-[#14532D]/40 border border-[#86EFAC] dark:border-[#15803D] rounded-xl text-left flex items-start gap-3 shadow-xs">
                    <div className="p-2 bg-[#15803D] text-white rounded-lg text-sm">🏨</div>
                    <div className="space-y-0.5 text-xs">
                      <p className="font-bold text-[#14532D] dark:text-[#86EFAC] flex items-center gap-1.5">
                        <span>Stay Reserved in {destinationCity}</span>
                        <span className="text-[9px] bg-[#15803D] text-white px-1.5 py-0.2 rounded font-mono font-bold">CONFIRMED</span>
                      </p>
                      <p className="font-semibold text-[#1F2933] dark:text-white text-xs">{confirmedStay.hotelName}</p>
                      <p className="text-[#64748B] dark:text-[#94A3B8] text-[11px]">Ref: {confirmedStay.id || confirmedStay.bookingReference} • {confirmedStay.roomType || 'Standard Room'}</p>
                    </div>
                  </div>
                ) : (
                  <div className="w-full max-w-md mt-3.5 p-3 bg-[#FFFDF7] dark:bg-[#101B17] border border-[#E58A3A]/40 rounded-xl text-left flex items-center justify-between gap-3 shadow-xs">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl">🏨</span>
                      <div>
                        <p className="text-xs font-bold text-[#14532D] dark:text-white">Need a Stay in {destinationCity}?</p>
                        <p className="text-[10px] text-[#64748B] dark:text-[#94A3B8]">Dorms from ₹399/bed • Homestays from ₹999</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-[#E58A3A] bg-[#E58A3A]/10 px-2 py-1 rounded-md border border-[#E58A3A]/30 shrink-0">
                      <span className="hidden sm:inline">Select on Right 👉</span>
                      <span className="sm:hidden">Browse Below 👇</span>
                    </span>
                  </div>
                )}

                {/* n8n AI Briefing Card */}
                <div className="w-full max-w-md mt-3.5 p-3.5 bg-[#EEF2ED] dark:bg-[#213530] border border-[#E3DED2] dark:border-[#2A403A] rounded-xl text-left flex items-start gap-3 shadow-sm">
                  <div className="p-2 bg-[#173F3A]/10 dark:bg-[#EEF2ED]/10 text-[#173F3A] dark:text-[#EEF2ED] rounded-lg text-lg">🤖</div>
                  <div className="space-y-1 text-xs">
                    <p className="font-semibold text-[#173F3A] dark:text-[#F7F5EF] flex items-center gap-2">
                      <span>AI Journey Briefing Dispatched</span>
                      <span className="text-[9px] bg-[#4F7D62]/15 text-[#4F7D62] border border-[#4F7D62]/30 px-1.5 py-0.5 rounded font-mono font-semibold">
                        ⚡ automated
                      </span>
                    </p>
                    <p className="text-[#66736F] dark:text-[#A3B0AB] text-[11px] leading-relaxed">
                      Your personalized itinerary advisory, delay forecast, and live station packing checklist have been generated.
                    </p>
                  </div>
                </div>
                
                <div className="mt-7 flex gap-3 w-full max-w-sm justify-center">
                  <button 
                    onClick={() => {
                      if (confirmedBookingData) {
                        window.open(`/api/payment/ticket/${confirmedBookingData.id}/pdf`, '_blank');
                      }
                    }}
                    className="flex-1 px-4 py-2.5 bg-[#173F3A] hover:bg-[#0F332F] dark:bg-[#EEF2ED] dark:hover:bg-[#FFFFFF] dark:text-[#12201D] text-white font-semibold text-xs rounded-lg transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                  >
                    📄 View E-Ticket
                  </button>
                  <button 
                    onClick={onClose}
                    className="flex-1 px-4 py-2.5 border border-[#E3DED2] dark:border-[#2A403A] text-[#263238] dark:text-[#F7F5EF] font-semibold text-xs rounded-lg hover:bg-[#F7F5EF] dark:hover:bg-[#12201D] transition-colors cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <AnimatePresence mode="wait">
                {/* STEP 1: CLASS SELECTION */}
                {step === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: -15 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -15 }}
                    className="space-y-6"
                  >
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-[#263238] dark:text-[#F7F5EF] flex items-center gap-2">
                        <span className="bg-[#173F3A] dark:bg-[#EEF2ED] text-white dark:text-[#12201D] w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">1</span>
                        Select Travel Class
                      </h3>
                      <p className="text-xs text-[#66736F] dark:text-[#A3B0AB] mt-1">
                        Choose your preferred travel category and fare option.
                      </p>
                    </div>
                    
                    {availableClasses.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                        {availableClasses.map((cls) => {
                          const isSelected = selectedClass === cls;
                          const isAiRecommended = aiRec.recommendedClass === cls;
                          const classPrice = fares[cls] || 0;

                          return (
                            <div 
                              key={cls}
                              onClick={() => setSelectedClass(cls)}
                              className={`relative cursor-pointer border rounded-xl p-4 transition-all duration-200 ${
                                isSelected 
                                  ? 'border-[#173F3A] dark:border-[#EEF2ED] bg-[#EEF2ED] dark:bg-[#213530] ring-2 ring-[#173F3A]/30 dark:ring-[#EEF2ED]/30 shadow-sm' 
                                  : 'border-[#E3DED2] dark:border-[#2A403A] bg-[#FFFFFF] dark:bg-[#1B2C28] hover:border-[#173F3A]/60 dark:hover:border-[#EEF2ED]/60'
                              }`}
                            >
                              {isAiRecommended && (
                                <div className="absolute -top-2.5 right-3 bg-[#4F7D62] text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                                  <Sparkles className="w-2.5 h-2.5" /> AI Recommended
                                </div>
                              )}
                              
                              <div className="flex justify-between items-start mb-1">
                                <span className="font-bold text-lg text-[#263238] dark:text-[#F7F5EF]">{cls}</span>
                                {isSelected && (
                                  <span className="w-5 h-5 rounded-full bg-[#173F3A] dark:bg-[#EEF2ED] text-white dark:text-[#12201D] flex items-center justify-center text-xs">
                                    ✓
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-[#66736F] dark:text-[#A3B0AB] mb-3 leading-snug">
                                {classDisplayNames[cls] || cls}
                              </p>
                              <div className="flex items-baseline justify-between pt-2 border-t border-[#E3DED2]/50 dark:border-[#2A403A]/50">
                                <span className="text-[10px] text-[#66736F] dark:text-[#A3B0AB] uppercase font-semibold">Base Fare</span>
                                <span className="font-bold text-[#173F3A] dark:text-[#EEF2ED] text-lg">
                                  ₹{classPrice.toLocaleString()}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-5 bg-[#F7F5EF] dark:bg-[#12201D] border border-[#E3DED2] dark:border-[#2A403A] rounded-xl text-center text-sm text-[#66736F] dark:text-[#A3B0AB] flex flex-col items-center gap-2">
                        <AlertCircle className="w-6 h-6 text-[#D96C4F]" />
                        <span>Standard Sleeper & AC options available at ₹{train?.price || 1250}.</span>
                      </div>
                    )}

                    <div className="pt-4 flex justify-end">
                      <button 
                        onClick={handleNextStep}
                        disabled={!selectedClass}
                        className="bg-[#D96C4F] hover:bg-[#C75D43] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-7 rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer text-sm"
                      >
                        Continue to Passenger Details
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* STEP 2: PASSENGERS */}
                {step === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 15 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 15 }}
                    className="space-y-6"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-base sm:text-lg font-bold text-[#263238] dark:text-[#F7F5EF] flex items-center gap-2">
                          <span className="bg-[#173F3A] dark:bg-[#EEF2ED] text-white dark:text-[#12201D] w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">2</span>
                          Passenger Details
                        </h3>
                        <p className="text-xs text-[#66736F] dark:text-[#A3B0AB] mt-0.5">
                          Selected Class: <strong className="text-[#173F3A] dark:text-[#EEF2ED]">{selectedClass} ({classDisplayNames[selectedClass] || selectedClass})</strong>
                        </p>
                      </div>
                      <button 
                        onClick={() => setStep(1)}
                        className="text-xs font-semibold text-[#D96C4F] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" /> Change Class
                      </button>
                    </div>

                    {/* Passenger Count Configurator */}
                    <div className="flex items-center justify-between p-3.5 sm:p-4 bg-[#F7F5EF] dark:bg-[#12201D] rounded-xl border border-[#E3DED2] dark:border-[#2A403A]">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-[#EEF2ED] dark:bg-[#213530] rounded-lg text-[#173F3A] dark:text-[#EEF2ED]">
                          <Users className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-xs sm:text-sm font-semibold text-[#263238] dark:text-[#F7F5EF]">Total Travelers</h4>
                          <p className="text-[10px] text-[#66736F] dark:text-[#A3B0AB] uppercase tracking-wider">Up to 6 passengers per ticket</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => handleRemovePassenger(passengers.length - 1)} 
                          className="w-8 h-8 rounded-full border border-[#E3DED2] dark:border-[#2A403A] flex items-center justify-center text-[#66736F] dark:text-[#A3B0AB] hover:bg-[#EEF2ED] dark:hover:bg-[#213530] disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer" 
                          disabled={passengerCount <= 1}
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="text-base font-bold font-mono text-[#263238] dark:text-[#F7F5EF] w-4 text-center">{passengerCount}</span>
                        <button 
                          onClick={handleAddPassenger} 
                          className="w-8 h-8 rounded-full border border-[#E3DED2] dark:border-[#2A403A] flex items-center justify-center text-[#66736F] dark:text-[#A3B0AB] hover:bg-[#EEF2ED] dark:hover:bg-[#213530] disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer" 
                          disabled={passengerCount >= 6}
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Passenger Forms */}
                    <div className="space-y-4">
                      {passengers.map((p, idx) => (
                        <div key={idx} className="relative border border-[#E3DED2] dark:border-[#2A403A] rounded-xl p-4 sm:p-5 bg-[#FFFFFF] dark:bg-[#1B2C28] shadow-sm">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-bold text-[#173F3A] dark:text-[#EEF2ED] uppercase tracking-wider bg-[#EEF2ED] dark:bg-[#213530] px-2.5 py-0.5 rounded border border-[#E3DED2] dark:border-[#2A403A]">
                              Passenger {idx + 1}
                            </span>
                            {passengers.length > 1 && (
                              <button 
                                onClick={() => handleRemovePassenger(idx)}
                                className="text-[11px] text-[#D96C4F] hover:underline cursor-pointer"
                              >
                                Remove
                              </button>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 text-left">
                            <div className="sm:col-span-5 space-y-1">
                              <label className="text-[10px] font-semibold text-[#66736F] dark:text-[#A3B0AB] uppercase">Full Name *</label>
                              <input 
                                type="text" 
                                value={p.name} 
                                onChange={(e) => updatePassenger(idx, 'name', e.target.value)} 
                                placeholder="As per Govt. ID" 
                                className="w-full bg-[#F7F5EF] dark:bg-[#12201D] border border-[#E3DED2] dark:border-[#2A403A] rounded-lg py-2 px-3 text-xs sm:text-sm focus:ring-1 focus:ring-[#173F3A] dark:focus:ring-[#EEF2ED] outline-none text-[#263238] dark:text-[#F7F5EF]" 
                              />
                            </div>
                            <div className="sm:col-span-3 space-y-1">
                              <label className="text-[10px] font-semibold text-[#66736F] dark:text-[#A3B0AB] uppercase">Age *</label>
                              <input 
                                type="number" 
                                value={p.age} 
                                onChange={(e) => updatePassenger(idx, 'age', e.target.value)} 
                                placeholder="Years" 
                                min="1" 
                                max="120" 
                                className="w-full bg-[#F7F5EF] dark:bg-[#12201D] border border-[#E3DED2] dark:border-[#2A403A] rounded-lg py-2 px-3 text-xs sm:text-sm focus:ring-1 focus:ring-[#173F3A] dark:focus:ring-[#EEF2ED] outline-none text-[#263238] dark:text-[#F7F5EF]" 
                              />
                            </div>
                            <div className="sm:col-span-4 space-y-1">
                              <label className="text-[10px] font-semibold text-[#66736F] dark:text-[#A3B0AB] uppercase">Gender *</label>
                              <select 
                                value={p.gender} 
                                onChange={(e) => updatePassenger(idx, 'gender', e.target.value)} 
                                className="w-full bg-[#F7F5EF] dark:bg-[#12201D] border border-[#E3DED2] dark:border-[#2A403A] rounded-lg py-2 px-3 text-xs sm:text-sm focus:ring-1 focus:ring-[#173F3A] dark:focus:ring-[#EEF2ED] outline-none text-[#263238] dark:text-[#F7F5EF]"
                              >
                                <option value="">Select Gender</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                              </select>
                            </div>

                            <div className="sm:col-span-4 space-y-1">
                              <label className="text-[10px] font-semibold text-[#66736F] dark:text-[#A3B0AB] uppercase">Nationality</label>
                              <input 
                                type="text" 
                                value={p.nationality} 
                                onChange={(e) => updatePassenger(idx, 'nationality', e.target.value)} 
                                placeholder="e.g. Indian" 
                                className="w-full bg-[#F7F5EF] dark:bg-[#12201D] border border-[#E3DED2] dark:border-[#2A403A] rounded-lg py-2 px-3 text-xs sm:text-sm focus:ring-1 focus:ring-[#173F3A] dark:focus:ring-[#EEF2ED] outline-none text-[#263238] dark:text-[#F7F5EF]" 
                              />
                            </div>

                            <div className="sm:col-span-4 space-y-1">
                              <label className="text-[10px] font-semibold text-[#66736F] dark:text-[#A3B0AB] uppercase">
                                {transportType === 'Flight' ? 'Seat Position' : transportType === 'Bus' ? 'Seat Pref.' : 'Berth Pref.'}
                              </label>
                              <select 
                                value={p.seatPref} 
                                onChange={(e) => updatePassenger(idx, 'seatPref', e.target.value)} 
                                className="w-full bg-[#F7F5EF] dark:bg-[#12201D] border border-[#E3DED2] dark:border-[#2A403A] rounded-lg py-2 px-3 text-xs sm:text-sm focus:ring-1 focus:ring-[#173F3A] dark:focus:ring-[#EEF2ED] outline-none text-[#263238] dark:text-[#F7F5EF]"
                              >
                                <option value="No Preference">No Preference</option>
                                {transportType === 'Flight' ? (
                                  <>
                                    <option value="Window">Window Seat</option>
                                    <option value="Aisle">Aisle Seat</option>
                                    <option value="Extra Legroom">Extra Legroom</option>
                                  </>
                                ) : transportType === 'Bus' ? (
                                  <>
                                    <option value="Window">Window</option>
                                    <option value="Aisle">Aisle</option>
                                    <option value="Lower Deck">Lower Deck</option>
                                    <option value="Upper Deck">Upper Deck</option>
                                  </>
                                ) : (
                                  <>
                                    <option value="Lower">Lower Berth</option>
                                    <option value="Middle">Middle Berth</option>
                                    <option value="Upper">Upper Berth</option>
                                    <option value="Side Lower">Side Lower</option>
                                    <option value="Side Upper">Side Upper</option>
                                  </>
                                )}
                              </select>
                            </div>

                            <div className="sm:col-span-4 space-y-1">
                              <label className="text-[10px] font-semibold text-[#66736F] dark:text-[#A3B0AB] uppercase">Meal Preference</label>
                              <select 
                                value={p.mealPref} 
                                onChange={(e) => updatePassenger(idx, 'mealPref', e.target.value)} 
                                className="w-full bg-[#F7F5EF] dark:bg-[#12201D] border border-[#E3DED2] dark:border-[#2A403A] rounded-lg py-2 px-3 text-xs sm:text-sm focus:ring-1 focus:ring-[#173F3A] dark:focus:ring-[#EEF2ED] outline-none text-[#263238] dark:text-[#F7F5EF]"
                              >
                                <option value="No Preference">No Preference</option>
                                <option value="Veg">Vegetarian</option>
                                <option value="Non-Veg">Non-Vegetarian</option>
                                <option value="Jain">Jain Meal</option>
                              </select>
                            </div>

                            <div className="sm:col-span-12 flex items-center gap-6 pt-2 border-t border-[#E3DED2]/50 dark:border-[#2A403A]/50 mt-1">
                              <label className="flex items-center gap-2 cursor-pointer text-xs">
                                <input 
                                  type="checkbox" 
                                  checked={p.isSenior} 
                                  onChange={(e) => updatePassenger(idx, 'isSenior', e.target.checked)} 
                                  className="w-4 h-4 rounded border-[#E3DED2] dark:border-[#2A403A] text-[#173F3A] focus:ring-[#173F3A]" 
                                />
                                <span className="text-[#263238] dark:text-[#F7F5EF]">Senior Citizen</span>
                              </label>
                              <label className="flex items-center gap-2 cursor-pointer text-xs">
                                <input 
                                  type="checkbox" 
                                  checked={p.isChild} 
                                  onChange={(e) => updatePassenger(idx, 'isChild', e.target.checked)} 
                                  className="w-4 h-4 rounded border-[#E3DED2] dark:border-[#2A403A] text-[#173F3A] focus:ring-[#173F3A]" 
                                />
                                <span className="text-[#263238] dark:text-[#F7F5EF]">Child (0-11 Yrs, 50% fare)</span>
                              </label>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="pt-2 flex justify-end">
                      <button 
                        onClick={handleConfirm}
                        className="bg-[#D96C4F] hover:bg-[#C75D43] text-white font-semibold py-3 px-8 rounded-xl transition-all shadow-sm w-full sm:w-auto cursor-pointer text-sm"
                      >
                        Proceed to Payment (₹{totalFare.toLocaleString()})
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* STEP 3: PAYMENT */}
                {step === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, x: 15 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 15 }}
                    className="space-y-6"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-base sm:text-lg font-bold text-[#263238] dark:text-[#F7F5EF] flex items-center gap-2">
                          <span className="bg-[#173F3A] dark:bg-[#EEF2ED] text-white dark:text-[#12201D] w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">3</span>
                          Payment Gateway
                        </h3>
                        <p className="text-xs text-[#66736F] dark:text-[#A3B0AB] mt-0.5">
                          Total Payable: <strong className="text-[#173F3A] dark:text-[#EEF2ED]">₹{totalFare.toLocaleString()}</strong>
                        </p>
                      </div>
                      <button 
                        onClick={() => setStep(2)}
                        className="text-xs font-semibold text-[#D96C4F] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" /> Back to Passengers
                      </button>
                    </div>

                    {/* Pay Options Tabs */}
                    <div className="flex border-b border-[#E3DED2] dark:border-[#2A403A] gap-2 pb-1 overflow-x-auto">
                      {[
                        { id: 'qr', label: '📷 Scan & Pay QR' },
                        { id: 'upi', label: '📱 Instant UPI' },
                        { id: 'card', label: '💳 Credit / Debit Card' },
                        { id: 'wallet', label: '👛 Travel Wallet' }
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => setPaymentTab(tab.id)}
                          className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                            paymentTab === tab.id
                              ? 'bg-[#EEF2ED] dark:bg-[#213530] text-[#173F3A] dark:text-[#EEF2ED] border border-[#173F3A]/30 dark:border-[#EEF2ED]/30'
                              : 'text-[#66736F] dark:text-[#A3B0AB] hover:text-[#263238] dark:hover:text-[#F7F5EF]'
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    {/* Tab Content */}
                    {paymentTab === 'qr' && (
                      <div className="bg-[#F7F5EF] dark:bg-[#12201D] border border-[#E3DED2] dark:border-[#2A403A] rounded-2xl p-4 sm:p-5 space-y-4 shadow-sm text-center">
                        {/* Gateway Header */}
                        <div className="flex items-center justify-between border-b border-[#E3DED2] dark:border-[#2A403A] pb-3 text-left">
                          <div className="flex items-center gap-2.5">
                            <div className="p-2 rounded-xl bg-[#173F3A] dark:bg-[#EEF2ED] text-white dark:text-[#12201D] shadow-sm">
                              <QrCode className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <h4 className="text-xs sm:text-sm font-bold text-[#263238] dark:text-[#F7F5EF]">TravelIQ Smart UPI QR</h4>
                                <span className="bg-[#4F7D62]/15 text-[#4F7D62] text-[9px] font-bold px-1.5 py-0.5 rounded border border-[#4F7D62]/30 uppercase tracking-wider">
                                  ⚡ Demo Sandbox
                                </span>
                              </div>
                              <p className="text-[10px] text-[#66736F] dark:text-[#A3B0AB]">Dynamic Instant Settlement Gateway</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] uppercase font-semibold text-[#66736F] dark:text-[#A3B0AB] block">Pay Exact</span>
                            <span className="text-sm sm:text-base font-bold text-[#173F3A] dark:text-[#EEF2ED]">₹{totalFare.toLocaleString()}</span>
                          </div>
                        </div>

                        {/* Interactive Clear Dynamic QR Box */}
                        <div className="relative inline-block mx-auto bg-white p-3.5 rounded-2xl border-2 border-[#173F3A]/20 dark:border-[#EEF2ED]/20 shadow-md">
                          {qrCodeUrl ? (
                            <div className="relative">
                              <img 
                                src={qrCodeUrl} 
                                alt="TravelIQ Payment QR Code" 
                                className="w-48 h-48 sm:w-52 sm:h-52 object-contain rounded-lg transition-transform"
                              />
                              
                              {/* Laser Scan Animation Line */}
                              <motion.div 
                                className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#D96C4F] to-transparent shadow-[0_0_8px_#D96C4F]"
                                animate={{ top: ['4%', '96%', '4%'] }}
                                transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
                              />

                              {/* Center Brand Badge */}
                              <div className="absolute inset-0 m-auto w-10 h-10 bg-white rounded-xl shadow-md border border-[#E3DED2] flex items-center justify-center p-1.5 pointer-events-none">
                                <div className="w-full h-full bg-[#173F3A] rounded-lg flex items-center justify-center text-white">
                                  <ShieldCheck className="w-5 h-5 text-[#EEF2ED]" />
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="w-48 h-48 sm:w-52 sm:h-52 flex items-center justify-center">
                              <div className="w-6 h-6 border-2 border-[#173F3A] border-t-transparent rounded-full animate-spin" />
                            </div>
                          )}

                          {/* Expiry Timer Pill */}
                          <div className="mt-2 flex items-center justify-between px-1 text-[10px] font-medium text-gray-600">
                            <span className="flex items-center gap-1 text-[#D96C4F] font-bold">
                              ⌛ Expires in {formatTimer(qrTimer)}
                            </span>
                            {qrTimer === 0 && (
                              <button 
                                type="button" 
                                onClick={handleResetQr}
                                className="text-[10px] text-[#173F3A] hover:underline flex items-center gap-0.5 cursor-pointer font-bold"
                              >
                                <RefreshCw className="w-3 h-3" /> Refresh
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Fast 1-Click Simulation Button */}
                        <div>
                          <button
                            type="button"
                            onClick={handleSimulateScanAndPay}
                            disabled={isProcessing || isSimulatingScan}
                            className="w-full py-2.5 px-4 bg-gradient-to-r from-[#173F3A] to-[#2B5A53] hover:from-[#0F332F] hover:to-[#214741] text-white rounded-xl text-xs font-bold shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                          >
                            <Zap className="w-3.5 h-3.5 text-[#E5B85C]" />
                            <span>{isSimulatingScan ? "Simulating App Approval..." : "⚡ Fast Test: Simulate QR Scan & Confirm Ticket"}</span>
                          </button>
                        </div>

                        {/* Copyable Sandbox UPI ID Strip */}
                        <div className="flex items-center justify-between bg-[#FFFFFF] dark:bg-[#1B2C28] border border-[#E3DED2] dark:border-[#2A403A] p-2.5 rounded-xl">
                          <div className="text-left">
                            <span className="text-[9px] uppercase tracking-wider font-semibold text-[#66736F] dark:text-[#A3B0AB] block">Sandbox VPA / UPI ID</span>
                            <span className="text-xs sm:text-sm font-mono font-bold text-[#263238] dark:text-[#F7F5EF]">{DUMMY_UPI_ID}</span>
                          </div>
                          <button
                            type="button"
                            onClick={handleCopyDummyUpi}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#EEF2ED] dark:bg-[#213530] hover:bg-[#E3DED2] dark:hover:bg-[#2A403A] text-[#173F3A] dark:text-[#EEF2ED] text-xs font-semibold transition-colors cursor-pointer"
                          >
                            {qrCopied ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-[#4F7D62]" />
                                <span className="text-[#4F7D62]">Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copy ID</span>
                              </>
                            )}
                          </button>
                        </div>

                        {/* Supported UPI Apps icons row */}
                        <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1 text-[10px] text-[#66736F] dark:text-[#A3B0AB]">
                          <span className="font-semibold">Compatible with:</span>
                          {['GPay', 'PhonePe', 'Paytm', 'BHIM', 'AmazonPay', 'Cred'].map((app) => (
                            <span key={app} className="px-2 py-0.5 rounded bg-white dark:bg-[#1B2C28] border border-[#E3DED2] dark:border-[#2A403A] font-medium">
                              {app}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {paymentTab === 'upi' && (
                      <div className="space-y-4 text-left">
                        <div className="space-y-1.5">
                          <label className="text-[10px] uppercase font-semibold text-[#66736F] dark:text-[#A3B0AB] block">Enter Virtual Payment Address (VPA / UPI ID)</label>
                          <div className="relative">
                            <input
                              type="text"
                              placeholder="e.g. username@okhdfcbank or 9876543210@paytm"
                              value={upiId}
                              onChange={(e) => setUpiId(e.target.value)}
                              className="w-full bg-[#F7F5EF] dark:bg-[#12201D] border border-[#E3DED2] dark:border-[#2A403A] rounded-xl px-4 py-3 text-sm text-[#263238] dark:text-[#F7F5EF] focus:outline-none focus:ring-1 focus:ring-[#173F3A] dark:focus:ring-[#EEF2ED] font-mono"
                            />
                            <Smartphone className="w-4 h-4 text-[#66736F] dark:text-[#A3B0AB] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                          </div>
                        </div>

                        {/* Quick UPI Handle suggestions */}
                        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                          <span className="text-[10px] text-[#66736F] dark:text-[#A3B0AB]">Popular handles:</span>
                          {['@oksbi', '@okhdfcbank', '@paytm', '@apl', '@ybl'].map((handle) => (
                            <button
                              key={handle}
                              type="button"
                              onClick={() => {
                                const prefix = upiId.includes('@') ? upiId.split('@')[0] : upiId;
                                setUpiId((prefix || 'user') + handle);
                              }}
                              className="text-[10px] px-2 py-0.5 rounded-md bg-[#F7F5EF] dark:bg-[#12201D] hover:bg-[#EEF2ED] dark:hover:bg-[#213530] text-[#173F3A] dark:text-[#EEF2ED] border border-[#E3DED2] dark:border-[#2A403A] transition-colors cursor-pointer"
                            >
                              {handle}
                            </button>
                          ))}
                        </div>

                        <div className="p-3.5 bg-[#F7F5EF] dark:bg-[#12201D] rounded-xl border border-[#E3DED2] dark:border-[#2A403A] text-xs text-[#66736F] dark:text-[#A3B0AB] flex items-center gap-2.5">
                          <div className="w-2 h-2 rounded-full bg-[#4F7D62] animate-pulse shrink-0" />
                          <span>A secure instant payment collect request of <strong>₹{totalFare.toLocaleString()}</strong> will be dispatched to your UPI app.</span>
                        </div>
                      </div>
                    )}

                    {paymentTab === 'card' && (
                      <div className="space-y-3.5 text-left">
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase font-semibold text-[#66736F] dark:text-[#A3B0AB] block">Card Number</label>
                          <input
                            type="text"
                            placeholder="4532 9823 8812 0482"
                            value={cardNumber}
                            onChange={(e) => {
                              let val = e.target.value.replace(/\D/g, '').replace(/(\d{4})/g, '$1 ').trim();
                              if (val.length > 19) val = val.substring(0, 19);
                              setCardNumber(val);
                            }}
                            className="w-full bg-[#F7F5EF] dark:bg-[#12201D] border border-[#E3DED2] dark:border-[#2A403A] rounded-xl px-4 py-2.5 text-sm text-[#263238] dark:text-[#F7F5EF] focus:outline-none focus:ring-1 focus:ring-[#173F3A] dark:focus:ring-[#EEF2ED] font-mono"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase font-semibold text-[#66736F] dark:text-[#A3B0AB] block">Cardholder Name</label>
                          <input
                            type="text"
                            placeholder="Name as printed on card"
                            value={cardHolder}
                            onChange={(e) => setCardHolder(e.target.value)}
                            className="w-full bg-[#F7F5EF] dark:bg-[#12201D] border border-[#E3DED2] dark:border-[#2A403A] rounded-xl px-4 py-2.5 text-sm text-[#263238] dark:text-[#F7F5EF] focus:outline-none focus:ring-1 focus:ring-[#173F3A] dark:focus:ring-[#EEF2ED]"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-left">
                          <div className="space-y-1">
                            <label className="text-[10px] uppercase font-semibold text-[#66736F] dark:text-[#A3B0AB] block">Expiry Date</label>
                            <input
                              type="text"
                              placeholder="MM/YY"
                              value={cardExpiry}
                              onChange={(e) => {
                                let val = e.target.value.replace(/\D/g, '');
                                if (val.length > 2) val = val.substring(0, 2) + '/' + val.substring(2, 4);
                                setCardExpiry(val);
                              }}
                              className="w-full bg-[#F7F5EF] dark:bg-[#12201D] border border-[#E3DED2] dark:border-[#2A403A] rounded-xl px-4 py-2.5 text-sm text-[#263238] dark:text-[#F7F5EF] focus:outline-none focus:ring-1 focus:ring-[#173F3A] dark:focus:ring-[#EEF2ED] font-mono"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] uppercase font-semibold text-[#66736F] dark:text-[#A3B0AB] block">CVV</label>
                            <input
                              type="password"
                              placeholder="123"
                              maxLength="3"
                              value={cardCvv}
                              onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ''))}
                              className="w-full bg-[#F7F5EF] dark:bg-[#12201D] border border-[#E3DED2] dark:border-[#2A403A] rounded-xl px-4 py-2.5 text-sm text-[#263238] dark:text-[#F7F5EF] focus:outline-none focus:ring-1 focus:ring-[#173F3A] dark:focus:ring-[#EEF2ED] font-mono"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {paymentTab === 'wallet' && (
                      <div className="p-4 rounded-xl bg-[#F7F5EF] dark:bg-[#12201D] border border-[#E3DED2] dark:border-[#2A403A] space-y-2 text-left">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-[#66736F] dark:text-[#A3B0AB]">Available TravelIQ Wallet Balance</span>
                          <span className="font-bold text-[#4F7D62]">₹8,450.00</span>
                        </div>
                        <p className="text-[11px] text-[#66736F] dark:text-[#A3B0AB]">
                          Instant 1-click confirmation with your verified loyalty balance.
                        </p>
                      </div>
                    )}

                    {/* Pay Button */}
                    <div className="pt-3">
                      <button 
                        onClick={handleProcessBookingPayment}
                        disabled={isProcessing || isSimulatingScan}
                        className="bg-[#D96C4F] hover:bg-[#C75D43] text-white font-semibold py-3.5 px-8 rounded-xl transition-all shadow-sm w-full flex items-center justify-center gap-2 cursor-pointer text-sm"
                      >
                        {isProcessing || isSimulatingScan ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Verifying & Processing Booking...
                          </>
                        ) : paymentTab === 'qr' ? (
                          <>
                            <CheckCircle className="w-4 h-4" />
                            I Have Scanned & Paid ₹{totalFare.toLocaleString()} (Confirm Ticket)
                          </>
                        ) : (
                          <>
                            🔒 Pay ₹{totalFare.toLocaleString()} & Confirm Ticket
                          </>
                        )}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            )}
          </div>

          {/* Right: Booking Summary Sidebar OR Destination Stays Explorer */}
          <div className="w-full lg:w-1/3 bg-[#F7F5EF] dark:bg-[#12201D] border-t lg:border-t-0 lg:border-l border-[#E3DED2] dark:border-[#2A403A] overflow-y-auto max-h-[85vh] flex flex-col">
            {bookingComplete ? (
              /* =======================================================
                 POST-BOOKING: DESTINATION STAYS EXPLORER (HOTELS / DORMS / HOMESTAYS)
                 ======================================================= */
              <div className="p-4 sm:p-5 space-y-4 flex-1 flex flex-col">
                {/* Header */}
                <div className="pb-3 border-b border-[#E3DED2] dark:border-[#2A403A]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-[#14532D] text-white">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-[#263238] dark:text-[#F7F5EF] font-heading">
                          Stays in {destinationCity}
                        </h4>
                        <p className="text-[10px] text-[#66736F] dark:text-[#A3B0AB]">
                          Hostels, Dorms, Homestays & Hotels
                        </p>
                      </div>
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#15803D]/15 text-[#15803D] border border-[#15803D]/30">
                      0% Prepay
                    </span>
                  </div>

                  {/* Category Tabs */}
                  <div className="flex items-center gap-1.5 mt-3 overflow-x-auto pb-1 no-scrollbar">
                    {[
                      { id: 'all', label: '🌟 All' },
                      { id: 'hostel', label: '🎒 Dorms' },
                      { id: 'homestay', label: '🏡 Homestays' },
                      { id: 'hotel', label: '🏨 Hotels' }
                    ].map(tab => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setStayCategory(tab.id)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-colors cursor-pointer border ${
                          stayCategory === tab.id
                            ? 'bg-[#14532D] text-white border-[#14532D] shadow-xs'
                            : 'bg-white dark:bg-[#1B2C28] text-[#64748B] dark:text-[#A3B0AB] border-[#E3DED2] dark:border-[#2A403A] hover:border-[#14532D]'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Stay Cards List */}
                <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                  {loadingDestHotels ? (
                    <div className="space-y-2.5 py-8 text-center">
                      <div className="animate-spin w-5 h-5 border-2 border-[#14532D] dark:border-white border-t-transparent rounded-full mx-auto" />
                      <p className="text-xs text-[#64748B]">Finding verified stays in {destinationCity}...</p>
                    </div>
                  ) : filteredDestHotels.length > 0 ? (
                    filteredDestHotels.map((hotel) => {
                      const isHostel = hotel.isHostel;
                      const isHomestay = hotel.category?.toLowerCase().includes('homestay') || hotel.category?.toLowerCase().includes('villa');
                      const displayPrice = hotel.roomTypes && hotel.roomTypes.length > 0 
                        ? Math.min(...hotel.roomTypes.map(r => r.pricePerNight))
                        : (hotel.price || 999);

                      return (
                        <div
                          key={hotel.id}
                          className="p-3 bg-white dark:bg-[#1B2C28] border border-[#E3DED2] dark:border-[#2A403A] rounded-xl hover:border-[#14532D] dark:hover:border-[#4ADE80] transition-all shadow-xs space-y-2 text-left"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className={`text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.2 rounded-full border ${
                                  isHostel 
                                    ? 'bg-[#E58A3A]/15 text-[#E58A3A] border-[#E58A3A]/30' 
                                    : isHomestay 
                                    ? 'bg-[#15803D]/15 text-[#15803D] border-[#15803D]/30'
                                    : 'bg-[#2F80A8]/15 text-[#2F80A8] border-[#2F80A8]/30'
                                }`}>
                                  {isHostel ? '🎒 Dorm / Pod' : isHomestay ? '🏡 Homestay' : '🏨 Hotel'}
                                </span>
                                {hotel.rating && (
                                  <span className="text-[10px] font-bold text-[#D97706] flex items-center gap-0.5">
                                    <Star className="w-3 h-3 fill-[#D97706]" /> {hotel.rating}
                                  </span>
                                )}
                              </div>
                              <h5 className="font-bold text-xs text-[#1F2933] dark:text-white truncate mt-1">
                                {hotel.name}
                              </h5>
                            </div>
                          </div>

                          {/* Amenities pills */}
                          <div className="flex flex-wrap gap-1">
                            {(hotel.features || []).slice(0, 3).map((feat, idx) => (
                              <span key={idx} className="text-[9px] bg-[#F7F5EF] dark:bg-[#101B17] text-[#64748B] dark:text-[#94A3B8] px-1.5 py-0.5 rounded border border-[#E3DED2] dark:border-[#273E36]">
                                {feat}
                              </span>
                            ))}
                          </div>

                          {/* Price & Action */}
                          <div className="flex items-center justify-between pt-1.5 border-t border-[#E3DED2]/50 dark:border-[#2A403A]/50">
                            <div>
                              <div className="flex items-baseline gap-0.5">
                                <span className="text-xs font-black font-mono text-[#14532D] dark:text-[#4ADE80]">
                                  ₹{displayPrice.toLocaleString('en-IN')}
                                </span>
                                <span className="text-[9px] text-[#64748B]">
                                  / {isHostel ? 'bed' : 'night'}
                                </span>
                              </div>
                              <span className="text-[9px] text-[#15803D] font-semibold block">
                                Free Cancellation
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => setSelectedHotelForBooking(hotel)}
                              className="px-3 py-1.5 bg-[#14532D] hover:bg-[#0F3F22] text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                            >
                              <span>Book Stay</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-4 bg-white dark:bg-[#1B2C28] rounded-xl text-center text-xs text-[#64748B] border border-[#E3DED2] dark:border-[#2A403A]">
                      No stays matched this category in {destinationCity}.
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* =======================================================
                 PRE-BOOKING: STANDARD BOOKING SUMMARY & FARE BREAKDOWN
                 ======================================================= */
              <div className="p-5 sm:p-6 space-y-5">
                <h3 className="text-base font-bold text-[#263238] dark:text-[#F7F5EF] flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-[#173F3A] dark:text-[#EEF2ED]" />
                  Booking Summary
                </h3>

                {/* Service Info Box */}
                <div className="bg-[#FFFFFF] dark:bg-[#1B2C28] p-4 rounded-xl border border-[#E3DED2] dark:border-[#2A403A] shadow-sm text-left">
                  <div className="text-sm font-bold text-[#263238] dark:text-[#F7F5EF] mb-0.5">
                    {train?.train_name || train?.name}
                  </div>
                  <div className="text-xs text-[#66736F] dark:text-[#A3B0AB] mb-3 border-b border-[#E3DED2] dark:border-[#2A403A] pb-3">
                    Service #{train?.train_number || train?.number} • {transportType}
                  </div>
                  
                  <div className="flex justify-between items-center text-xs mb-2">
                    <span className="text-[#66736F] dark:text-[#A3B0AB]">Travel Class</span>
                    <span className="font-bold text-[#263238] dark:text-[#F7F5EF]">
                      {selectedClass ? `${selectedClass} (${classDisplayNames[selectedClass] || selectedClass})` : '-'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[#66736F] dark:text-[#A3B0AB]">Passengers</span>
                    <span className="font-semibold text-[#263238] dark:text-[#F7F5EF]">
                      {adultCount} Adult{adultCount !== 1 ? 's' : ''} {childCount > 0 && `, ${childCount} Child${childCount !== 1 ? 'ren' : ''}`}
                    </span>
                  </div>
                </div>

                {/* AI Recommendation Box */}
                <div className="bg-[#EEF2ED] dark:bg-[#213530] border border-[#E3DED2] dark:border-[#2A403A] rounded-xl p-4 text-left space-y-3 relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[11px] font-bold text-[#173F3A] dark:text-[#EEF2ED] uppercase tracking-wider flex items-center gap-1.5">
                      🤖 AI Journey Insights
                    </h4>
                    <span className="text-[9px] bg-[#173F3A]/10 dark:bg-[#EEF2ED]/10 text-[#173F3A] dark:text-[#EEF2ED] font-mono px-1.5 py-0.5 rounded font-bold">
                      V2.5 Model
                    </span>
                  </div>

                  {loadingAi ? (
                    <div className="animate-spin w-4 h-4 border-2 border-[#173F3A] dark:border-[#EEF2ED] border-t-transparent rounded-full my-2" />
                  ) : (
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-[#66736F] dark:text-[#A3B0AB]">Recommended Class</span>
                        <span className="font-bold text-[#263238] dark:text-[#F7F5EF] bg-[#F7F5EF] dark:bg-[#12201D] border border-[#E3DED2] dark:border-[#2A403A] px-2 py-0.5 rounded font-mono text-[11px]">
                          {aiRec.recommendedClass}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[#66736F] dark:text-[#A3B0AB]">Predicted Occupancy</span>
                        <span className="font-bold text-[#263238] dark:text-[#F7F5EF]">{aiRec.predictedOccupancy}%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[#66736F] dark:text-[#A3B0AB]">Predicted Delay</span>
                        <span className="font-bold text-[#D96C4F]">{aiRec.predictedDelay} Mins</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Price Breakdown */}
                {selectedClass && (
                  <div className="bg-[#FFFFFF] dark:bg-[#1B2C28] p-4 rounded-xl border border-[#E3DED2] dark:border-[#2A403A] shadow-sm space-y-2.5 text-left">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#263238] dark:text-[#F7F5EF] border-b border-[#E3DED2] dark:border-[#2A403A] pb-2">
                      Fare Breakdown
                    </h4>
                    
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-[#66736F] dark:text-[#A3B0AB]">Base Fare ({adultCount}A, {childCount}C)</span>
                      <span className="font-semibold text-[#263238] dark:text-[#F7F5EF]">₹{totalBaseFare.toLocaleString()}</span>
                    </div>
                    
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-[#66736F] dark:text-[#A3B0AB]">Reservation Charge</span>
                      <span className="font-semibold text-[#263238] dark:text-[#F7F5EF]">₹{reservationCharge}</span>
                    </div>
                    
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-[#66736F] dark:text-[#A3B0AB]">Superfast / Surcharge</span>
                      <span className="font-semibold text-[#263238] dark:text-[#F7F5EF]">₹{superfastCharge}</span>
                    </div>
                    
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-[#66736F] dark:text-[#A3B0AB]">Convenience Fee</span>
                      <span className="font-semibold text-[#263238] dark:text-[#F7F5EF]">₹{convenienceFee}</span>
                    </div>
                    
                    <div className="flex justify-between items-center pt-2.5 border-t border-[#E3DED2] dark:border-[#2A403A]">
                      <span className="text-sm font-bold text-[#263238] dark:text-[#F7F5EF]">Total Fare</span>
                      <span className="text-lg font-bold text-[#173F3A] dark:text-[#EEF2ED]">₹{totalFare.toLocaleString()}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          
        </div>
      </motion.div>

      {/* Embedded Destination Hotel / Dorm / Homestay Booking Modal */}
      {selectedHotelForBooking && (
        <HotelBookingModal
          isOpen={!!selectedHotelForBooking}
          hotel={selectedHotelForBooking}
          onClose={() => setSelectedHotelForBooking(null)}
          onBookingSuccess={(bookedStay) => {
            setConfirmedStay(bookedStay);
            setSelectedHotelForBooking(null);
            toast.success(`🎉 Stay reserved at ${bookedStay.hotelName || selectedHotelForBooking.name}!`, { duration: 4000 });
          }}
        />
      )}
    </div>
  );
}
