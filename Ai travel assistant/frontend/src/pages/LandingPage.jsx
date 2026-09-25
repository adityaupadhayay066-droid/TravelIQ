import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Search, MapPin, Calendar, Users, ArrowRightLeft, 
  ArrowRight, ShieldCheck, Shield, Compass, Check, 
  Train, Plane, Bus, Sparkles, Sliders, IndianRupee, 
  Clock, Award, Navigation, Star, Heart, CheckCircle2,
  ChevronRight, MessageSquare
} from 'lucide-react';
import toast from 'react-hot-toast';
import StationAutocomplete from '../components/StationAutocomplete';
import PassengerSelector from '../components/PassengerSelector';
import TravelBudgetPlanner from '../components/TravelBudgetPlanner';
import TripPlanner from '../components/TripPlanner';

const POPULAR_DESTINATIONS = [
  {
    name: 'Manali',
    location: 'Himachal Pradesh',
    budget: 'From ₹6,500',
    bestTime: 'October–June',
    style: 'Himalayan Escapes',
    image: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=800&q=80',
    desc: 'High-altitude adventure town with snow valleys, pine forests, and cedar shrines.'
  },
  {
    name: 'Goa',
    location: 'Goa Coast',
    budget: 'From ₹4,500',
    bestTime: 'November–February',
    style: 'Coastal & Beaches',
    image: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=800&q=80',
    desc: 'Sun-drenched beaches, Portuguese colonial villas, spice farms, and seafood shacks.'
  },
  {
    name: 'Jaipur',
    location: 'Rajasthan',
    budget: 'From ₹3,800',
    bestTime: 'October–March',
    style: 'Heritage & Palaces',
    image: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=800&q=80',
    desc: 'The historic Pink City famous for Amer Fort, Hawa Mahal, and royal bazaars.'
  },
  {
    name: 'Kerala',
    location: 'Kerala Backwaters',
    budget: 'From ₹7,500',
    bestTime: 'September–March',
    style: 'Backwaters & Nature',
    image: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=800&q=80',
    desc: 'Tranquil houseboat canals, Ayurvedic retreats, and lush tea estates in Munnar.'
  },
  {
    name: 'Varanasi',
    location: 'Uttar Pradesh',
    budget: 'From ₹3,200',
    bestTime: 'October–March',
    style: 'Spiritual & Ghats',
    image: 'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?auto=format&fit=crop&w=800&q=80',
    desc: 'Ancient spiritual heart along the Ganga river with evening aarti ceremonies.'
  },
  {
    name: 'Kashmir',
    location: 'Jammu & Kashmir',
    budget: 'From ₹9,200',
    bestTime: 'April–October',
    style: 'Alpine Valleys & Lakes',
    image: 'https://images.unsplash.com/photo-1588714477688-cf28a50e94f7?auto=format&fit=crop&w=800&q=80',
    desc: 'Shikara rides on Dal Lake, Gulmarg gondola, and snow-capped Pir Panjal peaks.'
  },
  {
    name: 'Meghalaya',
    location: 'Northeast India',
    budget: 'From ₹8,000',
    bestTime: 'October–April',
    style: 'Waterfalls & Living Roots',
    image: 'https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?auto=format&fit=crop&w=800&q=80',
    desc: 'Living root bridges, crystal clear Umngot river, and misty rainforest waterfalls.'
  },
  {
    name: 'Rajasthan',
    location: 'Desert & Jaisalmer',
    budget: 'From ₹5,500',
    bestTime: 'November–February',
    style: 'Desert Safari & Forts',
    image: 'https://images.unsplash.com/photo-1609137144822-094119d65751?auto=format&fit=crop&w=800&q=80',
    desc: 'Golden sandstone fortresses, Thar desert camel dunes, and folk music nights.'
  },
  {
    name: 'Mumbai',
    location: 'Maharashtra',
    budget: 'From ₹4,200',
    bestTime: 'October–March',
    style: 'Coastal Metropolis',
    image: 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=800&q=80',
    desc: 'Marine Drive sunsets, Gateway of India, street street food, and historic rail architecture.'
  },
  {
    name: 'Delhi',
    location: 'National Capital Territory',
    budget: 'From ₹3,000',
    bestTime: 'October–March',
    style: 'Historic Monuments',
    image: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=800&q=80',
    desc: 'Red Fort, Qutub Minar, bustling Chandni Chowk delicacies, and modern transit hub.'
  }
];

const COMPARISON_SAMPLE = [
  {
    type: 'Train',
    icon: Train,
    color: '#14532D',
    bgColor: 'bg-[#14532D]',
    name: 'Vande Bharat Express',
    number: '22436',
    departure: '06:00',
    departurePlace: 'New Delhi (NDLS)',
    arrival: '14:00',
    arrivalPlace: 'Varanasi Jn (BSB)',
    duration: '8h 00m',
    fare: '₹1,750',
    status: 'Available (48 seats)',
    statusColor: 'text-[#2F7D32]',
    tag: 'Fastest Train'
  },
  {
    type: 'Flight',
    icon: Plane,
    color: '#2F80A8',
    bgColor: 'bg-[#2F80A8]',
    name: 'IndiGo Airlines',
    number: '6E-204',
    departure: '09:15',
    departurePlace: 'Delhi (DEL-T2)',
    arrival: '10:45',
    arrivalPlace: 'Varanasi (VNS)',
    duration: '1h 30m',
    fare: '₹4,350',
    status: 'Direct • 15kg Bag',
    statusColor: 'text-[#2F80A8]',
    tag: 'Quickest'
  },
  {
    type: 'Bus',
    icon: Bus,
    color: '#E58A3A',
    bgColor: 'bg-[#E58A3A]',
    name: 'Zingbus AC Multi-Axle',
    number: 'Sleeper 2+1',
    departure: '20:30',
    departurePlace: 'Kashmere Gate ISBT',
    arrival: '08:00',
    arrivalPlace: 'Varanasi Cantt',
    duration: '11h 30m',
    fare: '₹1,150',
    status: 'Live GPS • Water Bottle',
    statusColor: 'text-[#E58A3A]',
    tag: 'Cheapest'
  }
];

export default function LandingPage() {
  const navigate = useNavigate();

  // Trip Planner Form State
  const [from, setFrom] = useState(null);
  const [to, setTo] = useState(null);
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [returnDate, setReturnDate] = useState('');
  const [hasReturn, setHasReturn] = useState(false);
  const [passengerConfig, setPassengerConfig] = useState({ adults: 1, children: 0, infants: 0, seniors: 0 });
  const [budget, setBudget] = useState('');
  const [travelPreference, setTravelPreference] = useState('Balanced'); // 'Fastest' | 'Cheapest' | 'Comfortable' | 'Balanced'
  const [isSearching, setIsSearching] = useState(false);

  // Active comparison tab filter
  const [activeComparisonTab, setActiveComparisonTab] = useState('All');

  const handleSwapStations = () => {
    const temp = from;
    setFrom(to);
    setTo(temp);
  };

  const handleSearch = (e) => {
    if (e) e.preventDefault();
    if (!from) {
      return toast.error('Please enter a departure city or station.');
    }
    if (!to) {
      return toast.error('Please enter an arrival city or station.');
    }
    setIsSearching(true);
    const totalPassengers = passengerConfig.adults + passengerConfig.children + passengerConfig.infants + passengerConfig.seniors;
    
    setTimeout(() => {
      navigate('/dashboard', {
        state: {
          source: from,
          dest: to,
          departureDate: date,
          returnDate: hasReturn ? returnDate : null,
          passengers: totalPassengers,
          budget: parseInt(budget) || 15000,
          preference: travelPreference
        }
      });
    }, 300);
  };

  const scrollToPlanner = () => {
    const elem = document.getElementById('trip-planner-section');
    if (elem) elem.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToExplore = () => {
    const elem = document.getElementById('destination-explorer-section');
    if (elem) elem.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#F7F5EF] dark:bg-[#101B17] text-[#1F2933] dark:text-[#F7F5EF] transition-colors">
      
      {/* ====================================================================
          SECTION 1: HERO SECTION (3D REALISTIC MINIATURE WORLD + EDITORIAL)
          ==================================================================== */}
      <section className="py-10 lg:py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          
          {/* LEFT SIDE (7 COLS): HEADLINE, VALUE PROPOSITION & DIRECT CTAS */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Small Label */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#14532D]/10 dark:bg-[#EEF2ED]/10 text-[#14532D] dark:text-[#EEF2ED] text-xs font-bold uppercase tracking-wider border border-[#14532D]/20 animate-fade-in-up">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#2F7D32] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#2F7D32]"></span>
              </span>
              <span>SMART TRAVEL PLANNING</span>
            </div>

            {/* Large Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#14532D] dark:text-white leading-[1.1] font-heading tracking-tight animate-fade-in-up delay-75">
              Travel smarter.<br />
              <span className="text-[#E58A3A] relative inline-block">
                Explore further.
                <span className="absolute bottom-1 left-0 w-full h-1 bg-[#E58A3A]/20 rounded-full"></span>
              </span>
            </h1>

            {/* Supporting Text */}
            <p className="text-base sm:text-lg text-[#64748B] dark:text-[#94A3B8] leading-relaxed max-w-xl animate-fade-in-up delay-150">
              Plan, compare, and personalize your journey with TravelIQ. Discover multi-modal train routes, air connections, comfortable buses, and verified local itineraries across India.
            </p>

            {/* Primary & Secondary CTAs */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-2 animate-fade-in-up delay-225">
              <button
                onClick={scrollToPlanner}
                className="px-6 py-3.5 rounded-xl bg-[#14532D] hover:bg-[#0F3F22] text-white font-bold text-sm flex items-center justify-center gap-2 transition-all duration-200 shadow-md hover:shadow-xl hover:-translate-y-0.5 active:scale-95 cursor-pointer group"
              >
                <Compass className="w-4 h-4 group-hover:rotate-45 transition-transform duration-300" />
                <span>Plan My Journey</span>
              </button>

              <button
                onClick={scrollToExplore}
                className="px-6 py-3.5 rounded-xl bg-white dark:bg-[#172722] hover:bg-[#F7F5EF] dark:hover:bg-[#1D322B] text-[#14532D] dark:text-[#EEF2ED] font-bold text-sm border border-[#E3DED2] dark:border-[#273E36] flex items-center justify-center gap-2 transition-all duration-200 hover:-translate-y-0.5 active:scale-95 cursor-pointer group shadow-2xs hover:shadow-md"
              >
                <span>Explore Destinations</span>
                <ArrowRight className="w-4 h-4 text-[#E58A3A] group-hover:translate-x-1 transition-transform duration-200" />
              </button>
            </div>

            {/* Trust Highlights */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4 pt-6 border-t border-[#E3DED2] dark:border-[#273E36] overflow-hidden animate-fade-in-up delay-300">
              <div className="min-w-0 p-2 rounded-xl transition-colors hover:bg-[#EEF2ED]/50 dark:hover:bg-[#172722]/50">
                <p className="text-xl sm:text-2xl font-extrabold text-[#14532D] dark:text-white font-mono truncate">10,000+</p>
                <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8] mt-0.5 truncate font-medium">Indian Routes</p>
              </div>
              <div className="min-w-0 p-2 rounded-xl transition-colors hover:bg-[#EEF2ED]/50 dark:hover:bg-[#172722]/50">
                <p className="text-xl sm:text-2xl font-extrabold text-[#2F80A8] font-mono truncate">Real-Time</p>
                <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8] mt-0.5 truncate font-medium">Seat Availability</p>
              </div>
              <div className="min-w-0 p-2 rounded-xl transition-colors hover:bg-[#EEF2ED]/50 dark:hover:bg-[#172722]/50">
                <p className="text-xl sm:text-2xl font-extrabold text-[#E58A3A] font-mono truncate">Multimodal</p>
                <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8] mt-0.5 truncate font-medium">Train, Flight, Bus</p>
              </div>
            </div>

          </div>

          {/* RIGHT SIDE (5 COLS): PREMIUM TRAVELIQ BRAND EMBLEM SHOWCASE */}
          <div className="lg:col-span-5 w-full animate-fade-in-scale delay-150">
            <div className="relative rounded-3xl overflow-hidden border border-[#E3DED2] dark:border-[#273E36] bg-[#0A1612] shadow-2xl group transition-all duration-300 hover:shadow-[0_20px_50px_rgba(20,83,45,0.2)]">
              
              {/* Main TravelIQ 3D Logo / Visual Asset */}
              <div className="relative h-[400px] sm:h-[480px] lg:h-[520px] overflow-hidden bg-[#0A1612] flex items-center justify-center">
                <img 
                  src="/traveliq-hero-logo.jpg" 
                  alt="TravelIQ Smart Multimodal Journeys" 
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
                />
                
                {/* Natural Gradient & Aura Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A1612]/90 via-black/25 to-black/30 pointer-events-none" />

                {/* Top Left Badge with gentle floating effect */}
                <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/60 dark:bg-[#172722]/80 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10 dark:border-[#273E36] shadow-lg text-xs font-bold text-white animate-float">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10B981] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#10B981]"></span>
                  </span>
                  <span>AI Multimodal Network</span>
                </div>

                {/* Top Right Floating Badge */}
                <div className="absolute top-4 right-4 bg-black/60 dark:bg-[#172722]/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 dark:border-[#273E36] text-xs font-bold text-[#E58A3A] flex items-center gap-1.5 shadow-lg animate-float-reverse">
                  <Sparkles className="w-3.5 h-3.5 text-[#E58A3A] animate-spin" style={{ animationDuration: '8s' }} />
                  <span>TravelIQ Official</span>
                </div>

                {/* Floating Bottom Card with interactive hover */}
                <div className="absolute bottom-4 left-4 right-4 p-4 rounded-2xl bg-white/95 dark:bg-[#172722]/95 backdrop-blur-md border border-[#E3DED2] dark:border-[#273E36] shadow-xl space-y-2.5 transition-transform duration-300 group-hover:-translate-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-[#14532D] text-white shadow-sm transition-transform duration-300 group-hover:scale-110">
                        <Train className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-[#1F2933] dark:text-white flex items-center gap-1.5">
                          Indian Railways & Multimodal Express
                        </h4>
                        <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8]">
                          Connecting 10,000+ stations, airports and bus routes
                        </p>
                      </div>
                    </div>
                    <span className="font-mono text-[11px] font-extrabold text-[#14532D] dark:text-[#EEF2ED] bg-[#EEF2ED] dark:bg-[#1D322B] px-2.5 py-1 rounded-lg">
                      Verified
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#E3DED2]/80 dark:border-[#273E36] text-[11px] text-[#1F2933] dark:text-[#F7F5EF]">
                    <div className="flex items-center gap-1.5 font-medium">
                      <Clock className="w-3.5 h-3.5 text-[#2F80A8]" />
                      <span>Live Timings</span>
                    </div>
                    <div className="flex items-center gap-1.5 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#2F7D32]" />
                      <span>Seat Status</span>
                    </div>
                    <div className="flex items-center gap-1.5 font-medium">
                      <IndianRupee className="w-3.5 h-3.5 text-[#E58A3A]" />
                      <span>Best Fares</span>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          </div>

        </div>
      </section>

      {/* ====================================================================
          SECTION 2: TRIP PLANNER (CLEAN & INTUITIVE PLANNER INTERFACE)
          ==================================================================== */}
      <section id="trip-planner-section" className="py-12 bg-white dark:bg-[#172722] border-y border-[#E3DED2] dark:border-[#273E36]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="mb-8 text-center sm:text-left">
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#14532D] dark:text-[#EEF2ED] mb-1">
              <span className="w-2 h-2 rounded-full bg-[#E58A3A]" />
              <span>Multi-Modal Booking Engine</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#14532D] dark:text-white font-heading">
              Plan Your Journey
            </h2>
            <p className="text-xs sm:text-sm text-[#64748B] dark:text-[#94A3B8] mt-1">
              Compare fares and schedules across Indian Railways, domestic flights, and interstate buses.
            </p>
          </div>

          {/* TRIP PLANNER FORM CARD */}
          <div className="bg-[#FFFDF7] dark:bg-[#101B17] border border-[#E3DED2] dark:border-[#273E36] rounded-2xl p-6 shadow-sm">
            <form onSubmit={handleSearch} className="space-y-5">
              
              {/* Row 1: Station From / Swap / Station To */}
              <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-3 items-center">
                
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#14532D] dark:text-[#EEF2ED] uppercase tracking-wider flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#14532D]" />
                    <span>From (Origin)</span>
                  </label>
                  <StationAutocomplete 
                    value={from} 
                    onChange={setFrom} 
                    placeholder="Departure city or station"
                    inputPlaceholder="e.g. Bhubaneswar (BBS), New Delhi (NDLS)..."
                  />
                </div>

                <div className="flex justify-center sm:pt-6">
                  <button
                    type="button"
                    onClick={handleSwapStations}
                    className="p-3 rounded-xl border border-[#E3DED2] dark:border-[#273E36] hover:bg-[#EEF2ED] dark:hover:bg-[#1D322B] text-[#14532D] dark:text-[#EEF2ED] transition-transform hover:scale-105 cursor-pointer shadow-2xs"
                    title="Swap Origin and Destination"
                  >
                    <ArrowRightLeft className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#14532D] dark:text-[#EEF2ED] uppercase tracking-wider flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#E58A3A]" />
                    <span>To (Destination)</span>
                  </label>
                  <StationAutocomplete 
                    value={to} 
                    onChange={setTo} 
                    placeholder="Arrival city or station"
                    inputPlaceholder="e.g. Manali (MNL), Mumbai Central (MMCT)..."
                  />
                </div>

              </div>

              {/* Row 2: Departure, Return (Toggle), Travellers, Budget */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                
                {/* Departure Date */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#1F2933] dark:text-[#F7F5EF] uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#2F80A8]" />
                    <span>Departure</span>
                  </label>
                  <div className="flex items-center bg-white dark:bg-[#172722] rounded-xl p-3 border border-[#E3DED2] dark:border-[#273E36] hover:border-[#14532D]/40 transition-colors h-[54px]">
                    <input
                      type="date"
                      value={date}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={(e) => setDate(e.target.value)}
                      className="bg-transparent border-none outline-none text-[#1F2933] dark:text-[#F7F5EF] text-xs sm:text-sm font-bold w-full cursor-pointer p-0 m-0 focus:ring-0"
                    />
                  </div>
                </div>

                {/* Return Date (Optional) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-[#1F2933] dark:text-[#F7F5EF] uppercase tracking-wider flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#64748B]" />
                      <span>Return</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setHasReturn(!hasReturn)}
                      className="text-[10px] font-semibold text-[#2F80A8] hover:underline cursor-pointer"
                    >
                      {hasReturn ? 'Remove' : '+ Add Return'}
                    </button>
                  </div>
                  <div className={`flex items-center bg-white dark:bg-[#172722] rounded-xl p-3 border ${hasReturn ? 'border-[#E3DED2] dark:border-[#273E36]' : 'border-dashed border-[#E3DED2] opacity-60'} h-[54px]`}>
                    {hasReturn ? (
                      <input
                        type="date"
                        value={returnDate}
                        min={date}
                        onChange={(e) => setReturnDate(e.target.value)}
                        className="bg-transparent border-none outline-none text-[#1F2933] dark:text-[#F7F5EF] text-xs sm:text-sm font-bold w-full cursor-pointer p-0 m-0"
                      />
                    ) : (
                      <span 
                        onClick={() => setHasReturn(true)}
                        className="text-xs text-[#64748B] cursor-pointer"
                      >
                        One-Way Trip
                      </span>
                    )}
                  </div>
                </div>

                {/* Travellers */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#1F2933] dark:text-[#F7F5EF] uppercase tracking-wider flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-[#14532D]" />
                    <span>Travellers</span>
                  </label>
                  <PassengerSelector
                    value={passengerConfig}
                    onChange={setPassengerConfig}
                  />
                </div>

                {/* Budget */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#1F2933] dark:text-[#F7F5EF] uppercase tracking-wider flex items-center gap-1.5">
                    <IndianRupee className="w-3.5 h-3.5 text-[#E58A3A]" />
                    <span>Budget Limit</span>
                  </label>
                  <div className="flex items-center bg-white dark:bg-[#172722] rounded-xl px-3 border border-[#E3DED2] dark:border-[#273E36] hover:border-[#14532D]/40 transition-colors h-[54px]">
                    <span className="text-xs font-bold text-[#64748B] mr-1">₹</span>
                    <input
                      type="number"
                      value={budget}
                      step="500"
                      min="1000"
                      onChange={(e) => setBudget(e.target.value)}
                      placeholder="15000"
                      className="bg-transparent border-none outline-none text-[#1F2933] dark:text-[#F7F5EF] text-xs sm:text-sm font-bold w-full p-0"
                    />
                  </div>
                </div>

              </div>

              {/* Row 3: Travel Preference Options & Search CTA */}
              <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 pt-2">
                
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-[#64748B] dark:text-[#94A3B8] uppercase mr-1">
                    Travel Preference:
                  </span>
                  {['Fastest', 'Cheapest', 'Comfortable', 'Balanced'].map((pref) => (
                    <button
                      key={pref}
                      type="button"
                      onClick={() => setTravelPreference(pref)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer border ${
                        travelPreference === pref
                          ? 'bg-[#14532D] text-white border-[#14532D]'
                          : 'bg-white dark:bg-[#172722] text-[#1F2933] dark:text-[#F7F5EF] border-[#E3DED2] dark:border-[#273E36] hover:border-[#14532D]'
                      }`}
                    >
                      {pref}
                    </button>
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={isSearching}
                  className="px-8 h-[52px] rounded-xl bg-[#14532D] hover:bg-[#0F3F22] text-white font-bold text-sm flex items-center justify-center gap-2 cursor-pointer shadow-sm transition-all"
                >
                  {isSearching ? (
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                  <span>Find Best Routes</span>
                </button>

              </div>

            </form>
          </div>

        </div>
      </section>

      {/* ====================================================================
          SECTION 3: MULTI-MODAL COMPARISON SHOWCASE (TRAINS, FLIGHTS, BUSES)
          ==================================================================== */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#2F80A8] mb-1">
              <Compass className="w-3.5 h-3.5" />
              <span>Multi-Modal Comparison</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#14532D] dark:text-white font-heading">
              Compare Trains, Flights & Buses Side-by-Side
            </h2>
            <p className="text-xs sm:text-sm text-[#64748B] dark:text-[#94A3B8] mt-1">
              Evaluate real-time fares, travel times, luggage allowances, and comfort ratings on one screen.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-white dark:bg-[#172722] p-1 rounded-xl border border-[#E3DED2] dark:border-[#273E36]">
            {['All', 'Train', 'Flight', 'Bus'].map((mode) => (
              <button
                key={mode}
                onClick={() => setActiveComparisonTab(mode)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  activeComparisonTab === mode
                    ? 'bg-[#14532D] text-white'
                    : 'text-[#64748B] hover:text-[#1F2933] dark:hover:text-white'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        {/* Comparison Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {COMPARISON_SAMPLE.filter(item => activeComparisonTab === 'All' || item.type === activeComparisonTab).map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="bg-white dark:bg-[#172722] border border-[#E3DED2] dark:border-[#273E36] rounded-2xl p-5 shadow-xs card-interactive flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-[#E3DED2] dark:border-[#273E36]">
                    <div className="flex items-center gap-2">
                      <div className={`p-2 rounded-xl text-white ${item.bgColor} transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-[#1F2933] dark:text-white">
                          {item.name}
                        </h4>
                        <span className="text-[11px] text-[#64748B] dark:text-[#94A3B8]">
                          {item.number}
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#EEF2ED] dark:bg-[#101B17] text-[#14532D] dark:text-[#EEF2ED] border border-[#E3DED2] dark:border-[#273E36]">
                      {item.tag}
                    </span>
                  </div>

                  {/* Schedule Timings */}
                  <div className="py-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-base font-black font-mono text-[#1F2933] dark:text-white">{item.departure}</p>
                        <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8]">{item.departurePlace}</p>
                      </div>
                      <div className="flex flex-col items-center px-3">
                        <span className="text-[10px] font-bold text-[#64748B]">{item.duration}</span>
                        <div className="w-16 h-0.5 bg-[#E3DED2] dark:bg-[#273E36] relative my-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#14532D] absolute right-0 -top-0.5 animate-pulse" />
                        </div>
                        <span className="text-[9px] text-[#2F7D32] font-semibold">Direct</span>
                      </div>
                      <div className="text-right">
                        <p className="text-base font-black font-mono text-[#1F2933] dark:text-white">{item.arrival}</p>
                        <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8]">{item.arrivalPlace}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-2 border-t border-[#E3DED2]/60 dark:border-[#273E36]">
                      <span className="text-[#64748B]">{item.status}</span>
                      <span className="text-base font-black text-[#14532D] dark:text-[#EEF2ED] font-mono">{item.fare}</span>
                    </div>
                  </div>
                </div>

                {/* Actions: View Details & Select */}
                <div className="grid grid-cols-2 gap-2 pt-3 border-t border-[#E3DED2] dark:border-[#273E36]">
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="py-2 rounded-xl text-xs font-bold border border-[#E3DED2] dark:border-[#273E36] hover:bg-[#EEF2ED] dark:hover:bg-[#1D322B] text-[#1F2933] dark:text-[#F7F5EF] transition-all duration-150 active:scale-95 cursor-pointer"
                  >
                    View Details
                  </button>
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="py-2 rounded-xl text-xs font-bold bg-[#14532D] hover:bg-[#0F3F22] text-white transition-all duration-150 active:scale-95 cursor-pointer shadow-2xs hover:shadow-md"
                  >
                    Select
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      </section>

      {/* ====================================================================
          SECTION 4: DESTINATION EXPLORER (TOP INDIA DESTINATIONS)
          ==================================================================== */}
      <section id="destination-explorer-section" className="py-16 bg-[#FFFDF7] dark:bg-[#172722] border-y border-[#E3DED2] dark:border-[#273E36]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#E58A3A] mb-1">
                <MapPin className="w-3.5 h-3.5" />
                <span>Destination Discovery</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-[#14532D] dark:text-white font-heading">
                Explore Premier Destinations Across India
              </h2>
              <p className="text-xs sm:text-sm text-[#64748B] dark:text-[#94A3B8] mt-1">
                Curated travel budgets, recommended seasons, and comprehensive local itineraries.
              </p>
            </div>

            <Link
              to="/destinations"
              className="text-xs sm:text-sm font-bold text-[#14532D] dark:text-[#EEF2ED] hover:underline flex items-center gap-1 self-start sm:self-auto group"
            >
              <span>Explore All Destinations</span>
              <ArrowRight className="w-4 h-4 text-[#E58A3A] group-hover:translate-x-1 transition-transform duration-200" />
            </Link>
          </div>

          {/* Destination Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {POPULAR_DESTINATIONS.slice(0, 10).map((dest) => (
              <Link
                key={dest.name}
                to={`/destinations/${encodeURIComponent(dest.name)}`}
                className="bg-white dark:bg-[#101B17] border border-[#E3DED2] dark:border-[#273E36] rounded-2xl overflow-hidden card-interactive shadow-xs group flex flex-col justify-between"
              >
                <div>
                  <div className="h-44 overflow-hidden relative bg-[#EEF2ED] dark:bg-[#1D322B]">
                    <img 
                      src={dest.image} 
                      alt={dest.name}
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80';
                      }}
                      className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500 ease-out"
                    />
                    <div className="absolute top-2.5 right-2.5 bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-1 rounded-md shadow-sm">
                      {dest.style}
                    </div>
                  </div>

                  <div className="p-4 space-y-2">
                    <div className="flex items-baseline justify-between">
                      <h3 className="font-bold text-base text-[#14532D] dark:text-white font-heading group-hover:text-[#E58A3A] transition-colors duration-200">
                        {dest.name}
                      </h3>
                      <span className="text-[11px] font-semibold text-[#64748B]">{dest.location}</span>
                    </div>

                    <p className="text-xs text-[#64748B] dark:text-[#94A3B8] line-clamp-2 leading-relaxed">
                      {dest.desc}
                    </p>
                  </div>
                </div>

                <div className="p-4 pt-2 border-t border-[#E3DED2] dark:border-[#273E36] flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-[#64748B] block">Starting Budget</span>
                    <span className="font-bold font-mono text-[#14532D] dark:text-[#EEF2ED]">{dest.budget}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-[#64748B] block">Best Season</span>
                    <span className="font-semibold text-[#1F2933] dark:text-white text-[11px]">{dest.bestTime}</span>
                  </div>
                </div>

              </Link>
            ))}
          </div>

        </div>
      </section>

      {/* ====================================================================
          SECTION 5: TRAVEL BUDGET PLANNER & TRIP TIMELINE SHOWCASE
          ==================================================================== */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Visual Budget Planner (5 Cols) */}
          <div className="lg:col-span-5 space-y-4">
            <TravelBudgetPlanner initialBudget={15000} destination="Manali" />
          </div>

          {/* Visual Day-by-Day Timeline (7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            <TripPlanner />
          </div>

        </div>
      </section>

      {/* ====================================================================
          SECTION 6: DEDICATED AI CONCIERGE ASSISTANT SHOWCASE
          ==================================================================== */}
      <section className="py-16 bg-white dark:bg-[#172722] border-t border-[#E3DED2] dark:border-[#273E36]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="bg-[#FFFDF7] dark:bg-[#101B17] border border-[#E3DED2] dark:border-[#273E36] rounded-3xl p-6 sm:p-10 shadow-sm">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              
              <div className="lg:col-span-6 space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#14532D]/10 text-[#14532D] dark:text-[#EEF2ED] text-xs font-bold uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5 text-[#E58A3A]" />
                  <span>TravelIQ Assistant</span>
                </div>
                <h2 className="text-2xl sm:text-4xl font-extrabold text-[#14532D] dark:text-white font-heading">
                  Your Personal Indian Travel Concierge
                </h2>
                <p className="text-xs sm:text-sm text-[#64748B] dark:text-[#94A3B8] leading-relaxed">
                  Tell TravelIQ where you want to go and your budget limit. Our assistant crafts a structured day-by-day itinerary with verified express trains, scenic bus routes, hygienic food recommendations, and stays.
                </p>

                <div className="p-4 rounded-xl bg-white dark:bg-[#172722] border border-[#E3DED2] dark:border-[#273E36] space-y-2">
                  <p className="text-xs font-bold text-[#1F2933] dark:text-white">
                    Example Query:
                  </p>
                  <p className="text-xs font-mono text-[#14532D] dark:text-[#EEF2ED] bg-[#F7F5EF] dark:bg-[#101B17] p-2.5 rounded-lg border border-[#E3DED2] dark:border-[#273E36]">
                    "I want to travel from Bhubaneswar to Manali for 5 days under ₹15,000."
                  </p>
                </div>

                <div className="pt-2">
                  <Link
                    to="/dashboard/ai-workspace"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#14532D] hover:bg-[#0F3F22] text-white text-xs font-bold shadow-xs transition-colors"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Open Concierge Assistant</span>
                  </Link>
                </div>
              </div>

              {/* Concierge Response Card Preview */}
              <div className="lg:col-span-6">
                <div className="bg-white dark:bg-[#172722] border border-[#E3DED2] dark:border-[#273E36] rounded-2xl p-5 shadow-xs card-interactive space-y-3">
                  <div className="flex items-center justify-between pb-3 border-b border-[#E3DED2] dark:border-[#273E36]">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-[#2F7D32] animate-pulse" />
                      <span className="text-xs font-bold text-[#14532D] dark:text-white">Structured Plan Output</span>
                    </div>
                    <span className="font-mono text-xs font-bold text-[#E58A3A] bg-[#E58A3A]/10 px-2.5 py-0.5 rounded-md">Total Est: ₹14,200</span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="p-2 rounded-lg bg-[#F7F5EF] dark:bg-[#101B17] flex justify-between items-center gap-2 min-w-0">
                      <span className="font-bold text-[#14532D] dark:text-[#EEF2ED] shrink-0">Day 1 — Journey</span>
                      <span className="text-[#64748B] text-right truncate max-w-[58%]">Bhubaneswar → Delhi → Volvo coach</span>
                    </div>
                    <div className="p-2 rounded-lg bg-[#F7F5EF] dark:bg-[#101B17] flex justify-between items-center gap-2 min-w-0">
                      <span className="font-bold text-[#14532D] dark:text-[#EEF2ED] shrink-0">Day 2 — Exploration</span>
                      <span className="text-[#64748B] text-right truncate max-w-[58%]">Old Manali, Hadimba Devi shrine</span>
                    </div>
                    <div className="p-2 rounded-lg bg-[#F7F5EF] dark:bg-[#101B17] flex justify-between items-center gap-2 min-w-0">
                      <span className="font-bold text-[#14532D] dark:text-[#EEF2ED] shrink-0">Day 3 — Adventure</span>
                      <span className="text-[#64748B] text-right truncate max-w-[58%]">Solang Valley paragliding & snow</span>
                    </div>
                    <div className="p-2 rounded-lg bg-[#F7F5EF] dark:bg-[#101B17] flex justify-between items-center gap-2 min-w-0">
                      <span className="font-bold text-[#14532D] dark:text-[#EEF2ED] shrink-0">Day 4 — Sightseeing</span>
                      <span className="text-[#64748B] text-right truncate max-w-[58%]">Vashisht Sulphur baths & Mall Road</span>
                    </div>
                    <div className="p-2 rounded-lg bg-[#F7F5EF] dark:bg-[#101B17] flex justify-between items-center gap-2 min-w-0">
                      <span className="font-bold text-[#14532D] dark:text-[#EEF2ED] shrink-0">Day 5 — Return</span>
                      <span className="text-[#64748B] text-right truncate max-w-[58%]">Safe return to Bhubaneswar</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg border border-[#E3DED2] dark:border-[#273E36] bg-[#FFFDF7] dark:bg-[#101B17] flex items-center justify-between text-[11px]">
                    <span className="text-[#64748B]">Includes: Transport, Hotels, Food, Tips</span>
                    <span className="text-[#2F7D32] font-bold">Within ₹15,000 budget ✓</span>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* ====================================================================
          FOOTER (CLEAN, SOLID, TRAVEL-TECH PRODUCT FOOTER)
          ==================================================================== */}
      <footer className="border-t border-[#E3DED2] dark:border-[#273E36] bg-[#FFFDF7] dark:bg-[#101B17] py-12 text-xs text-[#64748B] dark:text-[#94A3B8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-3">
              <div className="flex items-center gap-1 text-xl font-extrabold font-heading">
                <span className="text-[#14532D] dark:text-white">Travel</span>
                <span className="text-[#E58A3A]">IQ</span>
              </div>
              <p className="text-xs leading-relaxed text-[#64748B] dark:text-[#94A3B8]">
                Smart travel assistant for discovering, comparing, and planning journeys across India.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-xs uppercase tracking-wider text-[#1F2933] dark:text-white mb-3">
                Plan & Compare
              </h4>
              <ul className="space-y-2">
                <li><Link to="/dashboard" className="hover:underline">Route Search</Link></li>
                <li><Link to="/dashboard" className="hover:underline">Train Schedules</Link></li>
                <li><Link to="/dashboard/food" className="hover:underline">Station Food Delivery</Link></li>
                <li><Link to="/dashboard/eco" className="hover:underline">Carbon Eco Tracker</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-xs uppercase tracking-wider text-[#1F2933] dark:text-white mb-3">
                Discovery & Tools
              </h4>
              <ul className="space-y-2">
                <li><Link to="/destinations" className="hover:underline">50+ Indian Destinations</Link></li>
                <li><Link to="/dashboard/station-3d" className="hover:underline">3D Station Navigation</Link></li>
                <li><Link to="/dashboard/3d-globe" className="hover:underline">3D Travel Globe</Link></li>
                <li><Link to="/dashboard/ai-workspace" className="hover:underline">AI Intelligence Suite</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-xs uppercase tracking-wider text-[#1F2933] dark:text-white mb-3">
                Support & Admin
              </h4>
              <ul className="space-y-2">
                <li><Link to="/support" className="hover:underline">Help & Support</Link></li>
                <li><Link to="/dashboard/my-trips" className="hover:underline">My Booked Trips</Link></li>
                <li><Link to="/admin/dashboard" className="hover:underline text-sky-600 flex items-center gap-1 font-semibold">
                  <Shield className="w-3.5 h-3.5 text-sky-500" />
                  <span>Admin Portal</span>
                </Link></li>
              </ul>
            </div>
          </div>

          <div className="pt-6 border-t border-[#E3DED2] dark:border-[#273E36] flex flex-col sm:flex-row items-center justify-between gap-4">
            <p>© {new Date().getFullYear()} TravelIQ. All rights reserved across Indian Railways & Domestic Transit Network.</p>
            <div className="flex items-center gap-6 font-semibold">
              <Link to="/support" className="hover:underline">Privacy Policy</Link>
              <Link to="/support" className="hover:underline">Terms of Service</Link>
              <Link to="/support" className="hover:underline">Security</Link>
            </div>
          </div>

        </div>
      </footer>

    </div>
  );
}
