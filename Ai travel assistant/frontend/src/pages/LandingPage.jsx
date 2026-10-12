import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  Search, MapPin, Calendar, Users, ArrowRightLeft, 
  ArrowRight, ShieldCheck, Shield, Compass, Check, 
  Train, Plane, Bus, Sparkles, Sliders, IndianRupee, 
  Clock, Award, Navigation, Star, Heart, CheckCircle2,
  ChevronRight, MessageSquare, Building2, AlertCircle,
  HelpCircle, ExternalLink, RefreshCw, Luggage, Bed, Utensils
} from 'lucide-react';
import toast from 'react-hot-toast';
import StationAutocomplete from '../components/StationAutocomplete';
import PassengerSelector from '../components/PassengerSelector';

// Featured 8 Popular Destinations across India
const POPULAR_DESTINATIONS = [
  {
    name: 'Goa',
    state: 'Goa Coast',
    tagline: 'Sun-drenched beaches, Portuguese colonial architecture, spice plantations, and seafood shacks.',
    bestSeason: 'Nov – Feb',
    image: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=800&q=80',
    slug: 'Goa',
    size: 'large'
  },
  {
    name: 'Manali',
    state: 'Himachal Pradesh',
    tagline: 'High-altitude Himalayan valley with snow-capped peaks, pine forests, and Solang valley adventures.',
    bestSeason: 'Oct – Jun',
    image: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=800&q=80',
    slug: 'Manali',
    size: 'medium'
  },
  {
    name: 'Jaipur',
    state: 'Rajasthan',
    tagline: 'The historic Pink City renowned for Amer Fort, Hawa Mahal, royal palaces, and artisan bazaars.',
    bestSeason: 'Oct – Mar',
    image: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=800&q=80',
    slug: 'Jaipur',
    size: 'medium'
  },
  {
    name: 'Varanasi',
    state: 'Uttar Pradesh',
    tagline: 'Ancient spiritual heart along the Ganga river with morning boat rides and evening Ganga Aarti ceremonies.',
    bestSeason: 'Oct – Mar',
    image: 'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?auto=format&fit=crop&w=800&q=80',
    slug: 'Varanasi',
    size: 'tall'
  },
  {
    name: 'Kerala',
    state: 'Backwaters & Munnar',
    tagline: 'Tranquil houseboat canals in Alleppey, Ayurvedic wellness retreats, and misty tea plantations in Munnar.',
    bestSeason: 'Sep – Mar',
    image: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=800&q=80',
    slug: 'Kerala',
    size: 'medium'
  },
  {
    name: 'Darjeeling',
    state: 'West Bengal',
    tagline: 'Queen of the Hills with Kanchenjunga sunrise views, UNESCO Himalayan toy train, and emerald tea gardens.',
    bestSeason: 'Mar – May & Sep – Nov',
    image: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=800&q=80',
    slug: 'Darjeeling',
    size: 'medium'
  },
  {
    name: 'Udaipur',
    state: 'Rajasthan',
    tagline: 'The romantic City of Lakes with magnificent Lake Pichola palace vistas and Rajput courtyards.',
    bestSeason: 'Oct – Mar',
    image: 'https://images.unsplash.com/photo-1615836245337-f5b9b2303f10?auto=format&fit=crop&w=800&q=80',
    slug: 'Udaipur',
    size: 'medium'
  },
  {
    name: 'Meghalaya',
    state: 'Northeast India',
    tagline: 'Misty waterfalls, crystal clear Umngot river in Dawki, and legendary centuries-old Living Root Bridges.',
    bestSeason: 'Oct – Apr',
    image: 'https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?auto=format&fit=crop&w=800&q=80',
    slug: 'Meghalaya',
    size: 'large'
  }
];

// Travel Picks Categories
const TRAVEL_PICKS = {
  'weekend': {
    title: 'Weekend Escapes',
    description: 'Quick getaways under 6 hours from major Indian metros.',
    destinations: [
      { name: 'Rishikesh', state: 'Uttarakhand', duration: '2-3 Days', estBudget: '₹4,500 – ₹8,000', highlight: 'Ganga rafting & riverside stays', image: 'https://images.unsplash.com/photo-1600100397608-f010f4439fa3?auto=format&fit=crop&w=600&q=80' },
      { name: 'Pondicherry', state: 'Tamil Nadu Coast', duration: '2-3 Days', estBudget: '₹5,000 – ₹9,500', highlight: 'French quarter cafes & Promenade', image: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=600&q=80' },
      { name: 'Mahabaleshwar', state: 'Maharashtra', duration: '2 Days', estBudget: '₹4,000 – ₹7,500', highlight: 'Strawberry valleys & viewpoints', image: 'https://images.unsplash.com/photo-1609137144822-094119d65751?auto=format&fit=crop&w=600&q=80' }
    ]
  },
  'mountain': {
    title: 'Mountain Retreats',
    description: 'Breathe crisp pine air and view snow peaks in the Himalayas & Western Ghats.',
    destinations: [
      { name: 'Manali', state: 'Himachal Pradesh', duration: '4-5 Days', estBudget: '₹7,500 – ₹14,000', highlight: 'Rohtang Pass & Old Manali cafes', image: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=600&q=80' },
      { name: 'Munnar', state: 'Kerala', duration: '3-4 Days', estBudget: '₹6,500 – ₹12,000', highlight: 'Tea gardens & Anamudi mist', image: 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=600&q=80' },
      { name: 'Ooty & Coonoor', state: 'Tamil Nadu', duration: '3-4 Days', estBudget: '₹5,500 – ₹11,000', highlight: 'Nilgiri Mountain Railway ride', image: 'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=600&q=80' }
    ]
  },
  'beaches': {
    title: 'Beaches & Coast',
    description: 'Warm Arabian Sea sunsets, coastal cuisine, and clean tropical shorelines.',
    destinations: [
      { name: 'South Goa', state: 'Goa', duration: '4-5 Days', estBudget: '₹8,000 – ₹16,000', highlight: 'Palolem & Agonda serene sands', image: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=600&q=80' },
      { name: 'Gokarna', state: 'Karnataka', duration: '3-4 Days', estBudget: '₹5,000 – ₹9,500', highlight: 'Om Beach cliffside treks', image: 'https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?auto=format&fit=crop&w=600&q=80' },
      { name: 'Varkala', state: 'Kerala', duration: '3-4 Days', estBudget: '₹6,000 – ₹11,500', highlight: 'Red cliff views & coastal dining', image: 'https://images.unsplash.com/photo-1590523741831-ab7e8b8f9c7f?auto=format&fit=crop&w=600&q=80' }
    ]
  },
  'heritage': {
    title: 'Heritage & Culture',
    description: 'Centuries-old stone fortresses, sacred temples, and living traditions.',
    destinations: [
      { name: 'Jaipur', state: 'Rajasthan', duration: '3-4 Days', estBudget: '₹6,000 – ₹12,000', highlight: 'Amer Fort & royal heritage stay', image: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=600&q=80' },
      { name: 'Hampi', state: 'Karnataka', duration: '3 Days', estBudget: '₹4,500 – ₹8,500', highlight: 'Vijayanagara boulder ruins & temples', image: 'https://images.unsplash.com/photo-1600100397608-f010f4439fa3?auto=format&fit=crop&w=600&q=80' },
      { name: 'Varanasi', state: 'Uttar Pradesh', duration: '2-3 Days', estBudget: '₹4,000 – ₹8,000', highlight: 'Ancient ghats & evening aarti', image: 'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?auto=format&fit=crop&w=600&q=80' }
    ]
  },
  'budget': {
    title: 'Budget Trips',
    description: 'High-value adventures with affordable rail connectivity and backpacker hostels.',
    destinations: [
      { name: 'Pushkar', state: 'Rajasthan', duration: '2-3 Days', estBudget: '₹3,500 – ₹6,000', highlight: 'Desert sunset & sacred lake ghats', image: 'https://images.unsplash.com/photo-1609137144822-094119d65751?auto=format&fit=crop&w=600&q=80' },
      { name: 'Dharamshala & McLeodganj', state: 'Himachal Pradesh', duration: '3-4 Days', estBudget: '₹4,500 – ₹8,000', highlight: 'Tibetan culture & Triund trek', image: 'https://images.unsplash.com/photo-1588714477688-cf28a50e94f7?auto=format&fit=crop&w=600&q=80' },
      { name: 'Puri', state: 'Odisha', duration: '2-3 Days', estBudget: '₹3,800 – ₹6,500', highlight: 'Jagannath temple & coastal breeze', image: 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=600&q=80' }
    ]
  },
  'adventure': {
    title: 'Adventure Travel',
    description: 'River rapids, high-altitude trekking, paragliding, and wilderness trails.',
    destinations: [
      { name: 'Bir Billing', state: 'Himachal Pradesh', duration: '3 Days', estBudget: '₹6,000 – ₹11,000', highlight: 'World-renowned paragliding site', image: 'https://images.unsplash.com/photo-1588714477688-cf28a50e94f7?auto=format&fit=crop&w=600&q=80' },
      { name: 'Meghalaya', state: 'Northeast India', duration: '4-5 Days', estBudget: '₹8,500 – ₹15,000', highlight: 'Double-decker root bridge trek', image: 'https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?auto=format&fit=crop&w=600&q=80' },
      { name: 'Rishikesh', state: 'Uttarakhand', duration: '3 Days', estBudget: '₹5,500 – ₹9,500', highlight: 'Grade IV white water rafting', image: 'https://images.unsplash.com/photo-1600100397608-f010f4439fa3?auto=format&fit=crop&w=600&q=80' }
    ]
  }
};

const POPULAR_HOTEL_CITIES = ['Goa', 'Manali', 'Jaipur', 'Varanasi', 'Kochi', 'Mumbai', 'New Delhi', 'Kolkata', 'Bengaluru'];

export default function LandingPage() {
  const navigate = useNavigate();
  const location = useLocation();

  // Search category tab: 'flights' | 'trains' | 'buses' | 'hotels'
  const [activeTab, setActiveTab] = useState(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    if (tabParam && ['flights', 'trains', 'buses', 'hotels'].includes(tabParam.toLowerCase())) {
      return tabParam.toLowerCase();
    }
    return 'trains';
  });

  // Listen for navbar category switch event
  useEffect(() => {
    const handleTabEvent = (e) => {
      if (e.detail && e.detail.tab) {
        setActiveTab(e.detail.tab);
      }
    };
    window.addEventListener('traveliq:set-tab', handleTabEvent);
    return () => window.removeEventListener('traveliq:set-tab', handleTabEvent);
  }, []);

  // Sync tab with URL search parameter if changed
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    if (tabParam && ['flights', 'trains', 'buses', 'hotels'].includes(tabParam.toLowerCase())) {
      setActiveTab(tabParam.toLowerCase());
    }
  }, [location.search]);

  // Transportation Form State
  const [tripType, setTripType] = useState('oneWay'); // 'oneWay' | 'roundTrip'
  const [fromStation, setFromStation] = useState(null);
  const [toStation, setToStation] = useState(null);
  const [departureDate, setDepartureDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [returnDate, setReturnDate] = useState(() => {
    const inThreeDays = new Date();
    inThreeDays.setDate(inThreeDays.getDate() + 4);
    return inThreeDays.toISOString().split('T')[0];
  });
  const [passengerConfig, setPassengerConfig] = useState({ adults: 1, children: 0, infants: 0, seniors: 0 });
  const [travelClass, setTravelClass] = useState('All Classes');
  const [isSearching, setIsSearching] = useState(false);

  // Hotel Form State
  const [hotelCity, setHotelCity] = useState('Goa');
  const [hotelCheckIn, setHotelCheckIn] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().split('T')[0];
  });
  const [hotelCheckOut, setHotelCheckOut] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 5);
    return d.toISOString().split('T')[0];
  });
  const [hotelGuests, setHotelGuests] = useState('2 Guests, 1 Room');

  // Personalized Picks State
  const [selectedPickCategory, setSelectedPickCategory] = useState('weekend');

  // Budget Planner State
  const [budgetCity, setBudgetCity] = useState('Delhi');
  const [maxBudget, setMaxBudget] = useState(15000);
  const [budgetDuration, setBudgetDuration] = useState('4-5 Days');
  const [budgetTravelers, setBudgetTravelers] = useState(2);
  const [budgetInterest, setBudgetInterest] = useState('Heritage & Nature');

  // Budget calculations
  const perPersonBudget = Math.round(maxBudget / Math.max(1, budgetTravelers));
  const calcTransport = Math.round(maxBudget * 0.38);
  const calcStays = Math.round(maxBudget * 0.28);
  const calcFood = Math.round(maxBudget * 0.18);
  const calcLocalTransit = Math.round(maxBudget * 0.10);
  const calcActivities = maxBudget - (calcTransport + calcStays + calcFood + calcLocalTransit);

  const handleSwapStations = () => {
    const temp = fromStation;
    setFromStation(toStation);
    setToStation(temp);
  };

  const handleTransportSearch = (e) => {
    if (e) e.preventDefault();
    if (!fromStation) {
      return toast.error('Please select a departure city or station.');
    }
    if (!toStation) {
      return toast.error('Please select an arrival city or station.');
    }

    setIsSearching(true);
    const totalPassengers = (passengerConfig.adults || 1) + (passengerConfig.children || 0) + (passengerConfig.seniors || 0);

    setTimeout(() => {
      navigate('/dashboard', {
        state: {
          source: fromStation,
          dest: toStation,
          departureDate,
          returnDate: tripType === 'roundTrip' ? returnDate : null,
          passengers: totalPassengers,
          modeFilter: activeTab === 'flights' ? ['Flight'] : activeTab === 'buses' ? ['Bus'] : ['Train', 'Flight', 'Bus']
        }
      });
      setIsSearching(false);
    }, 250);
  };

  const handleHotelSearch = (e) => {
    if (e) e.preventDefault();
    if (!hotelCity || !hotelCity.trim()) {
      return toast.error('Please enter a destination city for hotels.');
    }

    setIsSearching(true);
    setTimeout(() => {
      navigate('/dashboard', {
        state: {
          openHotels: true,
          hotelDestination: hotelCity.trim(),
          checkIn: hotelCheckIn,
          checkOut: hotelCheckOut,
          guests: hotelGuests
        }
      });
      setIsSearching(false);
    }, 250);
  };

  const handleSelectPopularDestination = (destName) => {
    setToStation({ station_name: destName, station_code: destName.slice(0, 3).toUpperCase() });
    const panel = document.getElementById('search-booking-panel');
    if (panel) panel.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#F7F8FA] dark:bg-[#121921] text-[#202A32] dark:text-[#F0F4F7] transition-colors">

      {/* ====================================================================
          SECTION 3: HERO SECTION — EDITORIAL TRAVEL SEARCH
          ==================================================================== */}
      <section className="relative bg-[#F7F8FA] dark:bg-[#121921] border-b border-[#E3E7EA] dark:border-[#293644] overflow-hidden">
        
        {/* Subtle, restrained background texture */}
        <div className="absolute inset-0 z-0 pointer-events-none opacity-20 dark:opacity-10">
          <img 
            src="https://images.unsplash.com/photo-1506461883276-594a12b11cf3?auto=format&fit=crop&w=2000&q=80" 
            alt="Scenic rail corridor"
            className="w-full h-full object-cover object-center mix-blend-multiply"
          />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 pb-14 sm:pb-16">
          
          {/* Hero Headline & Supporting Statement */}
          <div className="max-w-3xl mb-7 sm:mb-9 text-center sm:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#EEF2F4] dark:bg-[#1B242E] border border-[#E3E7EA] dark:border-[#293644] text-[#66737D] dark:text-[#9CAAB5] text-xs font-medium tracking-wide mb-3">
              <span>Intelligent Indian Travel Assistant</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-5xl font-bold tracking-tight leading-tight text-[#202A32] dark:text-[#F0F4F7]">
              Every journey starts <span className="text-[#244C66] dark:text-[#75A4C4]">smarter</span>.
            </h1>

            <p className="mt-2.5 sm:mt-3 text-base sm:text-lg text-[#66737D] dark:text-[#9CAAB5] leading-relaxed max-w-2xl">
              Discover better routes, compare verified trains, flights, and buses, and plan your journey with confidence.
            </p>
          </div>

          {/* ================================================================
              STRUCTURED TRAVEL SEARCH BOOKING PANEL
              ================================================================ */}
          <div id="search-booking-panel" className="bg-white dark:bg-[#1B242E] rounded-xl shadow-xs border border-[#E3E7EA] dark:border-[#293644] overflow-hidden text-[#202A32] dark:text-[#F0F4F7]">
            
            {/* Category Tabs: Flights, Trains, Buses, Hotels */}
            <div className="flex items-center border-b border-[#E3E7EA] dark:border-[#293644] bg-[#F7F8FA] dark:bg-[#162029] overflow-x-auto scrollbar-none px-2 pt-1.5">
              {[
                { id: 'trains', label: 'Trains', icon: Train, badge: 'IRCTC Live' },
                { id: 'flights', label: 'Flights', icon: Plane, badge: 'Direct Air' },
                { id: 'buses', label: 'Buses', icon: Bus, badge: 'Interstate' },
                { id: 'hotels', label: 'Hotels', icon: Building2, badge: 'Verified Stays' }
              ].map((tab) => {
                const Icon = tab.icon;
                const isSelected = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                      isSelected
                        ? 'border-[#244C66] text-[#244C66] dark:border-[#75A4C4] dark:text-[#75A4C4] bg-white dark:bg-[#1B242E]'
                        : 'border-transparent text-[#66737D] dark:text-[#9CAAB5] hover:text-[#202A32] dark:hover:text-[#F0F4F7]'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isSelected ? 'text-[#244C66] dark:text-[#75A4C4]' : 'text-[#89939B]'}`} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* TAB CONTENT: TRANSPORT SEARCH (Trains, Flights, Buses) */}
            {activeTab !== 'hotels' ? (
              <form onSubmit={handleTransportSearch} className="p-4 sm:p-5 space-y-4">
                
                {/* Trip Type Selector (One Way / Round Trip) */}
                <div className="flex items-center gap-4 text-xs font-medium text-[#66737D] dark:text-[#9CAAB5] pb-0.5">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input 
                      type="radio" 
                      name="tripType" 
                      checked={tripType === 'oneWay'} 
                      onChange={() => setTripType('oneWay')} 
                      className="accent-[#244C66] cursor-pointer"
                    />
                    <span>One Way</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input 
                      type="radio" 
                      name="tripType" 
                      checked={tripType === 'roundTrip'} 
                      onChange={() => setTripType('roundTrip')} 
                      className="accent-[#244C66] cursor-pointer"
                    />
                    <span>Round Trip</span>
                  </label>
                </div>

                {/* Form Fields Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-center">
                  
                  {/* Origin (From) */}
                  <div className="lg:col-span-3">
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#66737D] dark:text-[#9CAAB5] mb-1">
                      From (Origin)
                    </label>
                    <StationAutocomplete 
                      value={fromStation}
                      onChange={setFromStation}
                      placeholder="Departure City / Station"
                      inputPlaceholder="e.g. New Delhi (NDLS), Mumbai..."
                    />
                  </div>

                  {/* Swap Button */}
                  <div className="lg:col-span-1 flex justify-center py-1 lg:py-0">
                    <button
                      type="button"
                      onClick={handleSwapStations}
                      className="w-9 h-9 rounded-full border border-[#E3E7EA] dark:border-[#293644] bg-[#F7F8FA] dark:bg-[#162029] hover:bg-white dark:hover:bg-[#1B242E] text-[#66737D] hover:text-[#244C66] transition-colors flex items-center justify-center cursor-pointer shadow-2xs"
                      title="Swap Origin and Destination"
                    >
                      <ArrowRightLeft className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Destination (To) */}
                  <div className="lg:col-span-3">
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#66737D] dark:text-[#9CAAB5] mb-1">
                      To (Destination)
                    </label>
                    <StationAutocomplete 
                      value={toStation}
                      onChange={setToStation}
                      placeholder="Arrival City / Station"
                      inputPlaceholder="e.g. Varanasi Jn (BSB), Goa..."
                    />
                  </div>

                  {/* Departure Date */}
                  <div className={tripType === 'roundTrip' ? 'lg:col-span-2' : 'lg:col-span-3'}>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#66737D] dark:text-[#9CAAB5] mb-1">
                      Departure Date
                    </label>
                    <div className="h-11 px-3 rounded-lg border border-[#E3E7EA] dark:border-[#293644] bg-white dark:bg-[#162029] flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-[#89939B] shrink-0" />
                      <input 
                        type="date"
                        value={departureDate}
                        min={new Date().toISOString().split('T')[0]}
                        onChange={(e) => setDepartureDate(e.target.value)}
                        className="w-full bg-transparent border-none outline-none text-xs sm:text-sm font-semibold text-[#202A32] dark:text-[#F0F4F7] cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Return Date (if Round Trip) */}
                  {tripType === 'roundTrip' && (
                    <div className="lg:col-span-2">
                      <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#66737D] dark:text-[#9CAAB5] mb-1">
                        Return Date
                      </label>
                      <div className="h-11 px-3 rounded-lg border border-[#E3E7EA] dark:border-[#293644] bg-white dark:bg-[#162029] flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-[#89939B] shrink-0" />
                        <input 
                          type="date"
                          value={returnDate}
                          min={departureDate}
                          onChange={(e) => setReturnDate(e.target.value)}
                          className="w-full bg-transparent border-none outline-none text-xs sm:text-sm font-semibold text-[#202A32] dark:text-[#F0F4F7] cursor-pointer"
                        />
                      </div>
                    </div>
                  )}

                  {/* Passengers & Class */}
                  <div className={tripType === 'roundTrip' ? 'lg:col-span-12' : 'lg:col-span-2'}>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#66737D] dark:text-[#9CAAB5] mb-1">
                      Travelers
                    </label>
                    <PassengerSelector 
                      value={passengerConfig}
                      onChange={setPassengerConfig}
                    />
                  </div>

                </div>

                {/* Submit Row */}
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-[#E3E7EA] dark:border-[#293644]">
                  <div className="flex items-center gap-4 text-xs text-[#66737D] dark:text-[#9CAAB5]">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#287A55]" />
                      <span>Direct & connecting alternatives</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#287A55]" />
                      <span>Transparent fare breakdown</span>
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={isSearching}
                    className="w-full sm:w-auto px-7 h-11 rounded-lg bg-[#244C66] hover:bg-[#193B51] text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                  >
                    <Search className="w-4 h-4" />
                    <span>{isSearching ? 'Searching...' : `Search ${activeTab === 'flights' ? 'Flights' : activeTab === 'buses' ? 'Buses' : 'Trains & Routes'}`}</span>
                  </button>
                </div>

              </form>
            ) : (
              /* TAB CONTENT: HOTELS SEARCH */
              <form onSubmit={handleHotelSearch} className="p-4 sm:p-5 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                  
                  {/* Destination City */}
                  <div className="md:col-span-4">
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#66737D] dark:text-[#9CAAB5] mb-1">
                      Destination City or Area
                    </label>
                    <div className="h-11 px-3 rounded-lg border border-[#E3E7EA] dark:border-[#293644] bg-white dark:bg-[#162029] flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-[#89939B] shrink-0" />
                      <input 
                        type="text"
                        value={hotelCity}
                        onChange={(e) => setHotelCity(e.target.value)}
                        placeholder="e.g. Goa, Manali, Jaipur, Mumbai..."
                        className="w-full bg-transparent border-none outline-none text-xs sm:text-sm font-semibold text-[#202A32] dark:text-[#F0F4F7]"
                      />
                    </div>
                  </div>

                  {/* Check-In */}
                  <div className="md:col-span-3">
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#66737D] dark:text-[#9CAAB5] mb-1">
                      Check-In Date
                    </label>
                    <div className="h-11 px-3 rounded-lg border border-[#E3E7EA] dark:border-[#293644] bg-white dark:bg-[#162029] flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-[#89939B] shrink-0" />
                      <input 
                        type="date"
                        value={hotelCheckIn}
                        min={new Date().toISOString().split('T')[0]}
                        onChange={(e) => setHotelCheckIn(e.target.value)}
                        className="w-full bg-transparent border-none outline-none text-xs sm:text-sm font-semibold text-[#202A32] dark:text-[#F0F4F7] cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Check-Out */}
                  <div className="md:col-span-3">
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#66737D] dark:text-[#9CAAB5] mb-1">
                      Check-Out Date
                    </label>
                    <div className="h-11 px-3 rounded-lg border border-[#E3E7EA] dark:border-[#293644] bg-white dark:bg-[#162029] flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-[#89939B] shrink-0" />
                      <input 
                        type="date"
                        value={hotelCheckOut}
                        min={hotelCheckIn}
                        onChange={(e) => setHotelCheckOut(e.target.value)}
                        className="w-full bg-transparent border-none outline-none text-xs sm:text-sm font-semibold text-[#202A32] dark:text-[#F0F4F7] cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Guests & Rooms */}
                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#66737D] dark:text-[#9CAAB5] mb-1">
                      Guests
                    </label>
                    <div className="h-11 px-3 rounded-lg border border-[#E3E7EA] dark:border-[#293644] bg-white dark:bg-[#162029] flex items-center gap-2">
                      <Users className="w-4 h-4 text-[#89939B] shrink-0" />
                      <input 
                        type="text"
                        value={hotelGuests}
                        onChange={(e) => setHotelGuests(e.target.value)}
                        className="w-full bg-transparent border-none outline-none text-xs sm:text-sm font-semibold text-[#202A32] dark:text-[#F0F4F7]"
                      />
                    </div>
                  </div>

                </div>

                {/* Popular Stays Chips */}
                <div className="flex items-center gap-1.5 flex-wrap pt-0.5 text-xs">
                  <span className="text-[#89939B] font-medium mr-1">Popular Stays:</span>
                  {POPULAR_HOTEL_CITIES.map((city) => (
                    <button
                      key={city}
                      type="button"
                      onClick={() => setHotelCity(city)}
                      className={`px-2.5 py-1 rounded-md border text-xs font-medium cursor-pointer transition-colors ${
                        hotelCity === city 
                          ? 'bg-[#EAF0F4] dark:bg-[#233240] text-[#244C66] dark:text-[#75A4C4] border-[#E3E7EA] dark:border-[#293644] font-semibold'
                          : 'bg-[#F7F8FA] dark:bg-[#162029] text-[#66737D] dark:text-[#9CAAB5] border-[#E3E7EA] dark:border-[#293644] hover:bg-white'
                      }`}
                    >
                      {city}
                    </button>
                  ))}
                </div>

                {/* Submit Row */}
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-[#E3E7EA] dark:border-[#293644]">
                  <div className="text-xs text-[#66737D] dark:text-[#9CAAB5]">
                    Showing verified stays, homestays, and boutique hotels.
                  </div>

                  <button
                    type="submit"
                    disabled={isSearching}
                    className="w-full sm:w-auto px-7 h-11 rounded-lg bg-[#244C66] hover:bg-[#193B51] text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                  >
                    <Search className="w-4 h-4" />
                    <span>Search Hotels in {hotelCity}</span>
                  </button>
                </div>

              </form>
            )}

          </div>

          {/* Trust Value Badges below Booking Panel */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mt-5 text-xs">
            <div className="flex items-center gap-2.5 bg-white dark:bg-[#1B242E] p-3 rounded-lg border border-[#E3E7EA] dark:border-[#293644] shadow-2xs">
              <Train className="w-4 h-4 text-[#244C66] dark:text-[#75A4C4] shrink-0" />
              <div>
                <p className="font-semibold text-[#202A32] dark:text-[#F0F4F7]">IRCTC Timetables</p>
                <p className="text-[11px] text-[#89939B]">Daily rail schedules & fares</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 bg-white dark:bg-[#1B242E] p-3 rounded-lg border border-[#E3E7EA] dark:border-[#293644] shadow-2xs">
              <Compass className="w-4 h-4 text-[#244C66] dark:text-[#75A4C4] shrink-0" />
              <div>
                <p className="font-semibold text-[#202A32] dark:text-[#F0F4F7]">Smart Hub Transfers</p>
                <p className="text-[11px] text-[#89939B]">Reliable connecting routes</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 bg-white dark:bg-[#1B242E] p-3 rounded-lg border border-[#E3E7EA] dark:border-[#293644] shadow-2xs">
              <Plane className="w-4 h-4 text-[#244C66] dark:text-[#75A4C4] shrink-0" />
              <div>
                <p className="font-semibold text-[#202A32] dark:text-[#F0F4F7]">Domestic Flights</p>
                <p className="text-[11px] text-[#89939B]">Direct flight comparisons</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 bg-white dark:bg-[#1B242E] p-3 rounded-lg border border-[#E3E7EA] dark:border-[#293644] shadow-2xs">
              <ShieldCheck className="w-4 h-4 text-[#244C66] dark:text-[#75A4C4] shrink-0" />
              <div>
                <p className="font-semibold text-[#202A32] dark:text-[#F0F4F7]">Transparent Pricing</p>
                <p className="text-[11px] text-[#89939B]">Zero hidden fees</p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ====================================================================
          SECTION 4: POPULAR DESTINATIONS IN INDIA
          ==================================================================== */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#B66A45] dark:text-[#C87E58] mb-1.5">
              <span>Editorial Destination Discovery</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#202A32] dark:text-[#F0F4F7]">
              Popular Destinations in India
            </h2>
            <p className="text-sm text-[#66737D] dark:text-[#9CAAB5] mt-1 max-w-xl">
              Authentic travel guides, seasonal weather, and direct train and flight routes to top Indian locations.
            </p>
          </div>

          <Link
            to="/destinations"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#244C66] dark:text-[#75A4C4] hover:underline shrink-0"
          >
            <span>View All 50+ Destinations</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Varied Proportion Photographic Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {POPULAR_DESTINATIONS.map((dest, idx) => {
            const isFeatured = dest.size === 'large';
            return (
              <div 
                key={dest.name}
                className={`group relative rounded-xl overflow-hidden border border-[#E3E7EA] dark:border-[#293644] bg-white dark:bg-[#1B242E] shadow-xs hover:shadow-md transition-shadow duration-200 flex flex-col ${
                  isFeatured ? 'sm:col-span-2' : ''
                }`}
              >
                {/* Photo with Natural Gradient Overlay */}
                <div className={`relative overflow-hidden ${isFeatured ? 'h-64 sm:h-72' : 'h-52'}`}>
                  <img 
                    src={dest.image} 
                    alt={`${dest.name}, ${dest.state}`}
                    className="w-full h-full object-cover object-center group-hover:scale-102 transition-transform duration-300"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
                  
                  {/* Season Badge */}
                  <div className="absolute top-3 left-3 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-2xs text-white text-[11px] font-medium flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-white/80" />
                    <span>Best: {dest.bestSeason}</span>
                  </div>

                  {/* Destination Title on photo */}
                  <div className="absolute bottom-3 left-3 right-3 text-white">
                    <p className="text-xs font-medium text-white/80">{dest.state}</p>
                    <h3 className="text-xl sm:text-2xl font-bold leading-tight">{dest.name}</h3>
                  </div>
                </div>

                {/* Content & Action */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <p className="text-xs text-[#66737D] dark:text-[#9CAAB5] line-clamp-2 leading-relaxed">
                    {dest.tagline}
                  </p>

                  <div className="pt-2 border-t border-[#E3E7EA] dark:border-[#293644] flex items-center justify-between">
                    <button
                      onClick={() => handleSelectPopularDestination(dest.name)}
                      className="text-xs font-semibold text-[#66737D] dark:text-[#9CAAB5] hover:text-[#244C66] dark:hover:text-[#75A4C4] cursor-pointer flex items-center gap-1"
                    >
                      <Train className="w-3.5 h-3.5 text-[#244C66]" />
                      <span>Search Routes</span>
                    </button>

                    <Link
                      to={`/destinations/${dest.slug}`}
                      className="text-xs font-semibold text-[#244C66] dark:text-[#75A4C4] hover:underline flex items-center gap-1"
                    >
                      <span>Explore Guide</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      </section>

      {/* ====================================================================
          SECTION 6: INTELLIGENT ALTERNATIVE ROUTES SHOWCASE
          ==================================================================== */}
      <section className="py-12 sm:py-16 bg-[#EEF2F4] dark:bg-[#162029] border-y border-[#E3E7EA] dark:border-[#293644]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="max-w-3xl mb-8">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#244C66] dark:text-[#75A4C4] mb-1">
              <span>Smart Connecting Alternatives</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#202A32] dark:text-[#F0F4F7]">
              Smart Alternatives for Your Journey
            </h2>
            <p className="text-sm text-[#66737D] dark:text-[#9CAAB5] mt-1">
              When direct trains or flights are waitlisted, TravelIQ calculates reliable connecting journeys through verified interchange stations.
            </p>
          </div>

          {/* Comparison Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            
            {/* Direct Option (Waitlisted scenario) */}
            <div className="lg:col-span-5 bg-white dark:bg-[#1B242E] rounded-xl p-5 border border-[#E3E7EA] dark:border-[#293644] shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-[#E3E7EA] dark:border-[#293644]">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-[#EEF2F4] dark:bg-[#162029] text-[#66737D] dark:text-[#9CAAB5] text-xs font-medium">
                      Direct Train
                    </span>
                    <span className="text-xs text-[#89939B]">New Delhi → Varanasi</span>
                  </div>
                  <span className="text-xs font-semibold text-[#B54747]">WL 48 (Waitlisted)</span>
                </div>

                <div className="py-4 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <div>
                      <p className="font-bold text-[#202A32] dark:text-[#F0F4F7]">06:00 AM</p>
                      <p className="text-xs text-[#66737D]">New Delhi (NDLS)</p>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-[11px] text-[#89939B]">8h 00m</span>
                      <div className="w-20 h-px bg-[#E3E7EA] dark:border-[#293644] my-1" />
                      <span className="text-[10px] text-[#89939B]">Direct Express</span>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-[#202A32] dark:text-[#F0F4F7]">02:00 PM</p>
                      <p className="text-xs text-[#66737D]">Varanasi Jn (BSB)</p>
                    </div>
                  </div>

                  <p className="text-xs text-[#66737D] dark:text-[#9CAAB5] bg-[#F7F8FA] dark:bg-[#121921] p-2.5 rounded-lg border border-[#E3E7EA] dark:border-[#293644]">
                    High demand: Low probability of waitlist confirmation for chosen departure date.
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-[#E3E7EA] dark:border-[#293644] flex items-center justify-between text-xs text-[#66737D]">
                <span>Fare: ₹1,750 (AC Chair)</span>
                <span className="text-[#B54747] font-medium">Seat Unavailable</span>
              </div>
            </div>

            {/* Smart Alternative Option */}
            <div className="lg:col-span-7 bg-white dark:bg-[#1B242E] rounded-xl p-5 border border-[#244C66] dark:border-[#75A4C4] shadow-xs flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 px-3 py-0.5 bg-[#244C66] text-white text-[10px] font-semibold rounded-bl-lg">
                ★ TravelIQ Alternative
              </div>

              <div>
                <div className="flex items-center gap-2 pb-3 border-b border-[#E3E7EA] dark:border-[#293644]">
                  <span className="px-2 py-0.5 rounded bg-[#EAF0F4] dark:bg-[#233240] text-[#244C66] dark:text-[#75A4C4] text-xs font-semibold">
                    Connecting via Kanpur Central (CNB)
                  </span>
                  <span className="text-xs text-[#287A55] font-semibold">Available (32 Seats in Leg 1 & 2)</span>
                </div>

                {/* 2 Journey Legs */}
                <div className="py-4 space-y-2.5">
                  <div className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-[#F7F8FA] dark:bg-[#121921] border border-[#E3E7EA] dark:border-[#293644]">
                    <div>
                      <p className="font-semibold text-[#202A32] dark:text-[#F0F4F7]">Leg 1: Train 12004 Shatabdi</p>
                      <p className="text-[11px] text-[#66737D]">NDLS (06:10 AM) → CNB (11:20 AM)</p>
                    </div>
                    <div className="text-right">
                      <span className="text-[#287A55] font-semibold">Available</span>
                      <p className="text-[11px] text-[#89939B]">5h 10m • ₹1,040</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pl-3 text-xs font-medium text-[#244C66] dark:text-[#75A4C4]">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#244C66]" />
                    <span>Transfer at Kanpur Central (CNB) — 1h 20m Connection Time (Same Station)</span>
                  </div>

                  <div className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-[#F7F8FA] dark:bg-[#121921] border border-[#E3E7EA] dark:border-[#293644]">
                    <div>
                      <p className="font-semibold text-[#202A32] dark:text-[#F0F4F7]">Leg 2: Train 12560 Shiv Ganga Exp</p>
                      <p className="text-[11px] text-[#66737D]">CNB (12:40 PM) → BSB (05:15 PM)</p>
                    </div>
                    <div className="text-right">
                      <span className="text-[#287A55] font-semibold">Available</span>
                      <p className="text-[11px] text-[#89939B]">4h 35m • ₹780</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Combined Route Summary */}
              <div className="pt-3 border-t border-[#E3E7EA] dark:border-[#293644] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <span className="font-semibold text-[#202A32] dark:text-[#F0F4F7]">Total Time: 11h 05m</span>
                  <span className="text-[#89939B] mx-2">•</span>
                  <span className="font-semibold text-[#244C66] dark:text-[#75A4C4]">Combined Fare: ₹1,820</span>
                </div>

                <button
                  onClick={() => {
                    navigate('/dashboard', {
                      state: {
                        source: { station_name: 'New Delhi', station_code: 'NDLS' },
                        dest: { station_name: 'Varanasi Jn', station_code: 'BSB' },
                        departureDate
                      }
                    });
                  }}
                  className="px-4 py-2 rounded-lg bg-[#244C66] hover:bg-[#193B51] text-white font-semibold transition-colors cursor-pointer"
                >
                  View Connecting Routes
                </button>
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* ====================================================================
          SECTION 7: PERSONALIZED RECOMMENDATIONS — TRAVEL PICKS FOR YOU
          ==================================================================== */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="mb-7">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#244C66] dark:text-[#75A4C4] mb-1">
            <span>Curated Suggestions</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#202A32] dark:text-[#F0F4F7]">
            Travel Picks for You
          </h2>
          <p className="text-sm text-[#66737D] dark:text-[#9CAAB5] mt-1">
            Choose what you feel like exploring and discover verified recommendations with realistic budgets.
          </p>

          {/* Category Filter Chips */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pt-4 pb-1">
            {Object.keys(TRAVEL_PICKS).map((key) => {
              const item = TRAVEL_PICKS[key];
              const isSelected = selectedPickCategory === key;
              return (
                <button
                  key={key}
                  onClick={() => setSelectedPickCategory(key)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap border ${
                    isSelected
                      ? 'bg-[#244C66] text-white border-[#244C66] font-semibold'
                      : 'bg-white dark:bg-[#1B242E] text-[#66737D] dark:text-[#9CAAB5] border-[#E3E7EA] dark:border-[#293644] hover:bg-[#F7F8FA]'
                  }`}
                >
                  {item.title}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Category Destination Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TRAVEL_PICKS[selectedPickCategory].destinations.map((spot) => (
            <div 
              key={spot.name}
              className="bg-white dark:bg-[#1B242E] rounded-xl overflow-hidden border border-[#E3E7EA] dark:border-[#293644] shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                <div className="h-44 overflow-hidden relative">
                  <img 
                    src={spot.image} 
                    alt={spot.name}
                    className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                    loading="lazy"
                  />
                  <div className="absolute top-3 right-3 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-2xs text-white text-[11px] font-medium">
                    {spot.duration}
                  </div>
                </div>

                <div className="p-4 space-y-1.5">
                  <p className="text-xs font-semibold text-[#244C66] dark:text-[#75A4C4]">{spot.state}</p>
                  <h3 className="text-lg font-bold text-[#202A32] dark:text-[#F0F4F7]">{spot.name}</h3>
                  <p className="text-xs text-[#66737D] dark:text-[#9CAAB5]">{spot.highlight}</p>
                </div>
              </div>

              <div className="p-4 pt-0 border-t border-[#E3E7EA] dark:border-[#293644] flex items-center justify-between text-xs mt-3">
                <div>
                  <span className="text-[10px] text-[#89939B] block">Est. Cost / Person</span>
                  <span className="font-semibold text-[#202A32] dark:text-[#F0F4F7] font-mono">{spot.estBudget}</span>
                </div>

                <Link
                  to={`/destinations/${spot.name}`}
                  className="px-3 py-1.5 rounded-lg bg-[#EEF2F4] dark:bg-[#162029] hover:bg-[#EAF0F4] text-[#202A32] dark:text-[#F0F4F7] text-xs font-semibold transition-colors"
                >
                  View Details
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ====================================================================
          SECTION 8: BUDGET TRAVEL PLANNER — PLAN WITHIN YOUR BUDGET
          ==================================================================== */}
      <section className="py-12 sm:py-16 bg-[#EEF2F4] dark:bg-[#162029] border-y border-[#E3E7EA] dark:border-[#293644]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="max-w-3xl mb-8">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#244C66] dark:text-[#75A4C4] mb-1">
              <span>Financial Clarity</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#202A32] dark:text-[#F0F4F7]">
              Plan Within Your Budget
            </h2>
            <p className="text-sm text-[#66737D] dark:text-[#9CAAB5] mt-1">
              Select your origin, target budget, and trip duration to receive a transparent cost breakdown across travel, accommodation, and food.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Inputs Panel (5 cols) */}
            <div className="lg:col-span-5 bg-white dark:bg-[#1B242E] p-5 rounded-xl border border-[#E3E7EA] dark:border-[#293644] shadow-xs space-y-4">
              <h3 className="font-bold text-base text-[#202A32] dark:text-[#F0F4F7]">Trip Parameters</h3>
              
              {/* Starting City */}
              <div>
                <label className="block text-xs font-semibold text-[#66737D] dark:text-[#9CAAB5] mb-1">Starting City</label>
                <select 
                  value={budgetCity}
                  onChange={(e) => setBudgetCity(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-[#E3E7EA] dark:border-[#293644] bg-white dark:bg-[#162029] text-xs font-semibold text-[#202A32] dark:text-[#F0F4F7] cursor-pointer"
                >
                  <option value="Delhi">New Delhi</option>
                  <option value="Mumbai">Mumbai</option>
                  <option value="Bengaluru">Bengaluru</option>
                  <option value="Kolkata">Kolkata</option>
                  <option value="Chennai">Chennai</option>
                  <option value="Hyderabad">Hyderabad</option>
                </select>
              </div>

              {/* Maximum Budget Slider & Presets */}
              <div>
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="font-semibold text-[#66737D] dark:text-[#9CAAB5]">Maximum Budget</span>
                  <span className="font-mono font-bold text-base text-[#244C66] dark:text-[#75A4C4]">
                    ₹{maxBudget.toLocaleString('en-IN')}
                  </span>
                </div>
                <input 
                  type="range"
                  min="5000"
                  max="60000"
                  step="2500"
                  value={maxBudget}
                  onChange={(e) => setMaxBudget(parseInt(e.target.value))}
                  className="w-full accent-[#244C66] cursor-pointer"
                />
                <div className="flex justify-between gap-1.5 mt-2">
                  {[10000, 15000, 25000, 40000].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setMaxBudget(preset)}
                      className={`text-[11px] font-semibold px-2 py-1 rounded-md border cursor-pointer ${
                        maxBudget === preset 
                          ? 'bg-[#244C66] text-white border-[#244C66]' 
                          : 'bg-[#F7F8FA] dark:bg-[#162029] border-[#E3E7EA] dark:border-[#293644] text-[#66737D] dark:text-[#9CAAB5]'
                      }`}
                    >
                      ₹{preset / 1000}k
                    </button>
                  ))}
                </div>
              </div>

              {/* Trip Duration */}
              <div>
                <label className="block text-xs font-semibold text-[#66737D] dark:text-[#9CAAB5] mb-1">Trip Duration</label>
                <div className="grid grid-cols-3 gap-2">
                  {['2-3 Days', '4-5 Days', '7+ Days'].map((dur) => (
                    <button
                      key={dur}
                      type="button"
                      onClick={() => setBudgetDuration(dur)}
                      className={`py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer text-center ${
                        budgetDuration === dur
                          ? 'bg-[#244C66] text-white border-[#244C66]'
                          : 'bg-[#F7F8FA] dark:bg-[#162029] border-[#E3E7EA] dark:border-[#293644] text-[#66737D] dark:text-[#9CAAB5]'
                      }`}
                    >
                      {dur}
                    </button>
                  ))}
                </div>
              </div>

              {/* Number of Travelers */}
              <div>
                <label className="block text-xs font-semibold text-[#66737D] dark:text-[#9CAAB5] mb-1">Travelers</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setBudgetTravelers(num)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer text-center ${
                        budgetTravelers === num
                          ? 'bg-[#244C66] text-white border-[#244C66]'
                          : 'bg-[#F7F8FA] dark:bg-[#162029] border-[#E3E7EA] dark:border-[#293644] text-[#66737D] dark:text-[#9CAAB5]'
                      }`}
                    >
                      {num} {num === 1 ? 'Solo' : 'Travelers'}
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* Estimated Breakdown Cards (7 cols) */}
            <div className="lg:col-span-7 bg-white dark:bg-[#1B242E] p-5 rounded-xl border border-[#E3E7EA] dark:border-[#293644] shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#E3E7EA] dark:border-[#293644]">
                <div>
                  <h3 className="font-bold text-base text-[#202A32] dark:text-[#F0F4F7]">Estimated Cost Distribution</h3>
                  <p className="text-xs text-[#66737D] mt-0.5">Approx. ₹{perPersonBudget.toLocaleString('en-IN')} per person for {budgetDuration}</p>
                </div>
                <div className="px-2.5 py-0.5 rounded-full bg-[#EAF0F4] dark:bg-[#233240] text-[#244C66] dark:text-[#75A4C4] text-xs font-semibold shrink-0">
                  Total ₹{maxBudget.toLocaleString('en-IN')}
                </div>
              </div>

              {/* Stacked Proportional Bar */}
              <div className="space-y-1.5">
                <div className="h-2.5 w-full rounded-full bg-[#E3E7EA] dark:bg-[#293644] overflow-hidden flex">
                  <div style={{ width: '38%' }} className="h-full bg-[#244C66]" title="Transit (38%)" />
                  <div style={{ width: '28%' }} className="h-full bg-[#4A7A9E]" title="Stays (28%)" />
                  <div style={{ width: '18%' }} className="h-full bg-[#B66A45]" title="Food (18%)" />
                  <div style={{ width: '10%' }} className="h-full bg-[#66737D]" title="Local Transit (10%)" />
                  <div style={{ width: '6%' }} className="h-full bg-[#89939B]" title="Activities (6%)" />
                </div>
                <div className="flex justify-between text-[11px] text-[#89939B] font-medium px-1">
                  <span>Transit (38%)</span>
                  <span>Stays (28%)</span>
                  <span>Food (18%)</span>
                  <span>Local (10%)</span>
                  <span>Sightseeing (6%)</span>
                </div>
              </div>

              {/* Breakdown Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="p-3 rounded-lg border border-[#E3E7EA] dark:border-[#293644] bg-[#F7F8FA] dark:bg-[#121921]">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold text-[#202A32] dark:text-[#F0F4F7] flex items-center gap-1.5">
                      <Train className="w-3.5 h-3.5 text-[#244C66]" />
                      <span>Transportation</span>
                    </span>
                    <span className="font-mono font-bold text-[#244C66] dark:text-[#75A4C4]">₹{calcTransport.toLocaleString('en-IN')}</span>
                  </div>
                  <p className="text-[11px] text-[#66737D] dark:text-[#9CAAB5]">Train AC 3T / Sleeper or interstate bus tickets</p>
                </div>

                <div className="p-3 rounded-lg border border-[#E3E7EA] dark:border-[#293644] bg-[#F7F8FA] dark:bg-[#121921]">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold text-[#202A32] dark:text-[#F0F4F7] flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-[#244C66]" />
                      <span>Accommodation</span>
                    </span>
                    <span className="font-mono font-bold text-[#244C66] dark:text-[#75A4C4]">₹{calcStays.toLocaleString('en-IN')}</span>
                  </div>
                  <p className="text-[11px] text-[#66737D] dark:text-[#9CAAB5]">3-star boutique hotels or verified homestays</p>
                </div>

                <div className="p-3 rounded-lg border border-[#E3E7EA] dark:border-[#293644] bg-[#F7F8FA] dark:bg-[#121921]">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold text-[#202A32] dark:text-[#F0F4F7] flex items-center gap-1.5">
                      <Utensils className="w-3.5 h-3.5 text-[#B66A45]" />
                      <span>Food & Dining</span>
                    </span>
                    <span className="font-mono font-bold text-[#B66A45]">₹{calcFood.toLocaleString('en-IN')}</span>
                  </div>
                  <p className="text-[11px] text-[#66737D] dark:text-[#9CAAB5]">Regional thalis, breakfasts & cafe dining</p>
                </div>

                <div className="p-3 rounded-lg border border-[#E3E7EA] dark:border-[#293644] bg-[#F7F8FA] dark:bg-[#121921]">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold text-[#202A32] dark:text-[#F0F4F7] flex items-center gap-1.5">
                      <Compass className="w-3.5 h-3.5 text-[#66737D]" />
                      <span>Local Transit & Sights</span>
                    </span>
                    <span className="font-mono font-bold text-[#202A32] dark:text-[#F0F4F7]">₹{(calcLocalTransit + calcActivities).toLocaleString('en-IN')}</span>
                  </div>
                  <p className="text-[11px] text-[#66737D] dark:text-[#9CAAB5]">Auto-rickshaws, monument passes & local transit</p>
                </div>
              </div>

              {/* Honest Disclaimer */}
              <div className="p-2.5 rounded-lg bg-[#F7F8FA] dark:bg-[#121921] border border-[#E3E7EA] dark:border-[#293644] text-xs text-[#66737D] dark:text-[#9CAAB5] flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-[#89939B] shrink-0 mt-0.5" />
                <p>
                  <strong className="text-[#202A32] dark:text-[#F0F4F7]">Budget note:</strong> Figures shown are estimated benchmarks based on average seasonal fares and verified 3-star accommodations. Confirmed prices vary by travel dates.
                </p>
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* ====================================================================
          SECTION 11: ADDITIONAL HOMEPAGE SECTIONS
          ==================================================================== */}
      
      {/* 11.1 WHY TRAVELIQ? */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#244C66] dark:text-[#75A4C4] mb-1">
            <span>Built For Indian Commuters & Travelers</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#202A32] dark:text-[#F0F4F7]">
            Why TravelIQ?
          </h2>
          <p className="text-sm text-[#66737D] dark:text-[#9CAAB5] mt-1.5">
            A travel platform engineered to solve real booking frustrations across rail, air, and interstate buses.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="p-5 rounded-xl border border-[#E3E7EA] dark:border-[#293644] bg-white dark:bg-[#1B242E] shadow-xs space-y-2.5">
            <div className="w-9 h-9 rounded-lg bg-[#EEF2F4] dark:bg-[#233240] text-[#244C66] dark:text-[#75A4C4] flex items-center justify-center font-bold">
              <Compass className="w-4.5 h-4.5" />
            </div>
            <h3 className="font-semibold text-base text-[#202A32] dark:text-[#F0F4F7]">Compare Travel Modes</h3>
            <p className="text-xs text-[#66737D] dark:text-[#9CAAB5] leading-relaxed">
              Evaluate trains, domestic flights, and buses side-by-side on duration, comfort, and real fare differences.
            </p>
          </div>

          <div className="p-5 rounded-xl border border-[#E3E7EA] dark:border-[#293644] bg-white dark:bg-[#1B242E] shadow-xs space-y-2.5">
            <div className="w-9 h-9 rounded-lg bg-[#EEF2F4] dark:bg-[#233240] text-[#244C66] dark:text-[#75A4C4] flex items-center justify-center font-bold">
              <ArrowRightLeft className="w-4.5 h-4.5" />
            </div>
            <h3 className="font-semibold text-base text-[#202A32] dark:text-[#F0F4F7]">Discover Alternative Routes</h3>
            <p className="text-xs text-[#66737D] dark:text-[#9CAAB5] leading-relaxed">
              When direct trains are waitlisted, explore connecting journeys through convenient junction stations with safe layovers.
            </p>
          </div>

          <div className="p-5 rounded-xl border border-[#E3E7EA] dark:border-[#293644] bg-white dark:bg-[#1B242E] shadow-xs space-y-2.5">
            <div className="w-9 h-9 rounded-lg bg-[#EEF2F4] dark:bg-[#233240] text-[#244C66] dark:text-[#75A4C4] flex items-center justify-center font-bold">
              <IndianRupee className="w-4.5 h-4.5" />
            </div>
            <h3 className="font-semibold text-base text-[#202A32] dark:text-[#F0F4F7]">Plan Around Your Budget</h3>
            <p className="text-xs text-[#66737D] dark:text-[#9CAAB5] leading-relaxed">
              Allocate your spending logically between transit, stays, and dining to prevent surprise travel expenses.
            </p>
          </div>

          <div className="p-5 rounded-xl border border-[#E3E7EA] dark:border-[#293644] bg-white dark:bg-[#1B242E] shadow-xs space-y-2.5">
            <div className="w-9 h-9 rounded-lg bg-[#EEF2F4] dark:bg-[#233240] text-[#244C66] dark:text-[#75A4C4] flex items-center justify-center font-bold">
              <ShieldCheck className="w-4.5 h-4.5" />
            </div>
            <h3 className="font-semibold text-base text-[#202A32] dark:text-[#F0F4F7]">Verified Schedules</h3>
            <p className="text-xs text-[#66737D] dark:text-[#9CAAB5] leading-relaxed">
              Train numbers, running days, and station codes are checked against active timetable datasets for dependable plans.
            </p>
          </div>
        </div>
      </section>

      {/* 11.2 HOW IT WORKS */}
      <section className="py-12 sm:py-16 bg-[#EEF2F4] dark:bg-[#162029] border-y border-[#E3E7EA] dark:border-[#293644]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-10">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#244C66] dark:text-[#75A4C4] mb-1">
              <span>Simplicity First</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#202A32] dark:text-[#F0F4F7]">
              How It Works
            </h2>
            <p className="text-sm text-[#66737D] dark:text-[#9CAAB5] mt-1.5">
              Three straightforward steps from initial inspiration to departure.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 relative">
            
            <div className="bg-white dark:bg-[#1B242E] p-5 rounded-xl border border-[#E3E7EA] dark:border-[#293644] shadow-xs relative">
              <span className="text-3xl font-bold text-[#CAD3DA] dark:text-[#293644] font-mono absolute top-4 right-4">01</span>
              <div className="w-9 h-9 rounded-lg bg-[#244C66] text-white flex items-center justify-center font-bold mb-3">
                <Search className="w-4.5 h-4.5" />
              </div>
              <h3 className="font-semibold text-base text-[#202A32] dark:text-[#F0F4F7] mb-1.5">Search Your Journey</h3>
              <p className="text-xs text-[#66737D] dark:text-[#9CAAB5] leading-relaxed">
                Enter your origin, destination, and departure date. Switch freely between Trains, Flights, Buses, and Hotels.
              </p>
            </div>

            <div className="bg-white dark:bg-[#1B242E] p-5 rounded-xl border border-[#E3E7EA] dark:border-[#293644] shadow-xs relative">
              <span className="text-3xl font-bold text-[#CAD3DA] dark:text-[#293644] font-mono absolute top-4 right-4">02</span>
              <div className="w-9 h-9 rounded-lg bg-[#244C66] text-white flex items-center justify-center font-bold mb-3">
                <Compass className="w-4.5 h-4.5" />
              </div>
              <h3 className="font-semibold text-base text-[#202A32] dark:text-[#F0F4F7] mb-1.5">Compare Available Routes</h3>
              <p className="text-xs text-[#66737D] dark:text-[#9CAAB5] leading-relaxed">
                Review verified direct connections alongside smart multi-leg alternatives with transparent departure and arrival timings.
              </p>
            </div>

            <div className="bg-white dark:bg-[#1B242E] p-5 rounded-xl border border-[#E3E7EA] dark:border-[#293644] shadow-xs relative">
              <span className="text-3xl font-bold text-[#CAD3DA] dark:text-[#293644] font-mono absolute top-4 right-4">03</span>
              <div className="w-9 h-9 rounded-lg bg-[#244C66] text-white flex items-center justify-center font-bold mb-3">
                <CheckCircle2 className="w-4.5 h-4.5" />
              </div>
              <h3 className="font-semibold text-base text-[#202A32] dark:text-[#F0F4F7] mb-1.5">Choose What Suits You</h3>
              <p className="text-xs text-[#66737D] dark:text-[#9CAAB5] leading-relaxed">
                Select your preferred option, view complete intermediate station stops, and proceed with confirmed details.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* 11.3 TRAVEL GUIDES */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#244C66] dark:text-[#75A4C4] mb-1">
              <span>Practical Tips</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#202A32] dark:text-[#F0F4F7]">
              Practical Travel Guides
            </h2>
            <p className="text-sm text-[#66737D] dark:text-[#9CAAB5] mt-1">
              Expert articles and verified advice for navigating Indian rail, air corridors, and seasonal routes.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white dark:bg-[#1B242E] rounded-xl overflow-hidden border border-[#E3E7EA] dark:border-[#293644] shadow-xs group flex flex-col justify-between">
            <div className="p-4 space-y-2">
              <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-[#EEF2F4] dark:bg-[#233240] text-[#244C66] dark:text-[#75A4C4]">
                Railway Guide
              </span>
              <h3 className="font-semibold text-base text-[#202A32] dark:text-[#F0F4F7] group-hover:text-[#244C66] transition-colors">
                Understanding Tatkal, Premium Tatkal & Waitlist Quotas
              </h3>
              <p className="text-xs text-[#66737D] dark:text-[#9CAAB5] leading-relaxed">
                How opening windows work at 10:00 AM (AC) and 11:00 AM (Non-AC), and when connecting routes offer confirmed seats.
              </p>
            </div>
            <div className="p-4 pt-0 text-xs font-semibold text-[#244C66] dark:text-[#75A4C4] flex items-center gap-1">
              <span>Read guide</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="bg-white dark:bg-[#1B242E] rounded-xl overflow-hidden border border-[#E3E7EA] dark:border-[#293644] shadow-xs group flex flex-col justify-between">
            <div className="p-4 space-y-2">
              <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-[#EEF2F4] dark:bg-[#233240] text-[#244C66] dark:text-[#75A4C4]">
                Route Comparison
              </span>
              <h3 className="font-semibold text-base text-[#202A32] dark:text-[#F0F4F7] group-hover:text-[#244C66] transition-colors">
                Delhi to Varanasi: Vande Bharat vs Flight Comparison
              </h3>
              <p className="text-xs text-[#66737D] dark:text-[#9CAAB5] leading-relaxed">
                Comparing total gate-to-gate transit time against the 8-hour direct Vande Bharat rail service arriving in city center.
              </p>
            </div>
            <div className="p-4 pt-0 text-xs font-semibold text-[#244C66] dark:text-[#75A4C4] flex items-center gap-1">
              <span>Read comparison</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="bg-white dark:bg-[#1B242E] rounded-xl overflow-hidden border border-[#E3E7EA] dark:border-[#293644] shadow-xs group flex flex-col justify-between">
            <div className="p-4 space-y-2">
              <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-[#EEF2F4] dark:bg-[#233240] text-[#244C66] dark:text-[#75A4C4]">
                Scenic Journeys
              </span>
              <h3 className="font-semibold text-base text-[#202A32] dark:text-[#F0F4F7] group-hover:text-[#244C66] transition-colors">
                The Konkan Railway: Mumbai to Goa Best Timings & Views
              </h3>
              <p className="text-xs text-[#66737D] dark:text-[#9CAAB5] leading-relaxed">
                Tunnel counts, lush Western Ghat viaducts, and why the Tejas or Mandovi Express daytime departure is unforgettable.
              </p>
            </div>
            <div className="p-4 pt-0 text-xs font-semibold text-[#244C66] dark:text-[#75A4C4] flex items-center gap-1">
              <span>Read guide</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>
      </section>

      {/* 11.4 TRUST & TRANSPARENCY STATEMENT */}
      <section className="py-10 bg-white dark:bg-[#1B242E] border-y border-[#E3E7EA] dark:border-[#293644]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-3">
          <div className="w-10 h-10 rounded-lg bg-[#EEF2F4] dark:bg-[#233240] text-[#244C66] dark:text-[#75A4C4] mx-auto flex items-center justify-center font-bold">
            <Shield className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-bold text-[#202A32] dark:text-[#F0F4F7]">
            Trust & Transparency Commitment
          </h2>
          <p className="text-xs sm:text-sm text-[#66737D] dark:text-[#9CAAB5] leading-relaxed max-w-3xl mx-auto">
            At TravelIQ, we believe honest travel information is essential. Train schedules, station codes, and running frequencies are validated against active datasets. Whenever live data is unavailable, information is clearly labeled as an estimate.
          </p>
        </div>
      </section>

      {/* ====================================================================
          11.5 COMPREHENSIVE REFINED FOOTER
          ==================================================================== */}
      <footer className="bg-[#EEF2F4] dark:bg-[#162029] text-[#66737D] dark:text-[#9CAAB5] text-xs pt-12 pb-10 border-t border-[#E3E7EA] dark:border-[#293644]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 pb-10 border-b border-[#E3E7EA] dark:border-[#293644]">
            
            {/* Col 1: Brand Info */}
            <div className="lg:col-span-2 space-y-2.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#244C66] text-white flex items-center justify-center shadow-xs">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71L12 2z" />
                  </svg>
                </div>
                <span className="text-base font-bold text-[#202A32] dark:text-[#F0F4F7]">TravelIQ</span>
              </div>
              <p className="text-[#66737D] dark:text-[#9CAAB5] leading-relaxed max-w-sm">
                Indian multimodal travel planner and route comparison platform. Unifying trains, domestic flights, and interstate buses into a reliable search experience.
              </p>
            </div>

            {/* Col 2: Supported Travel Modes */}
            <div className="space-y-2">
              <p className="font-semibold text-[#202A32] dark:text-[#F0F4F7] uppercase tracking-wider text-[11px]">Travel Modes</p>
              <ul className="space-y-1.5">
                <li><Link to="/?tab=trains" className="hover:text-[#244C66] dark:hover:text-[#75A4C4] transition-colors">Indian Railways (IRCTC)</Link></li>
                <li><Link to="/?tab=flights" className="hover:text-[#244C66] dark:hover:text-[#75A4C4] transition-colors">Domestic Flights</Link></li>
                <li><Link to="/?tab=buses" className="hover:text-[#244C66] dark:hover:text-[#75A4C4] transition-colors">Interstate Buses</Link></li>
                <li><Link to="/?tab=hotels" className="hover:text-[#244C66] dark:hover:text-[#75A4C4] transition-colors">Hotels & Stays</Link></li>
                <li><Link to="/dashboard/track" className="hover:text-[#244C66] dark:hover:text-[#75A4C4] transition-colors">Live Train GPS Tracker</Link></li>
              </ul>
            </div>

            {/* Col 3: Destinations */}
            <div className="space-y-2">
              <p className="font-semibold text-[#202A32] dark:text-[#F0F4F7] uppercase tracking-wider text-[11px]">Destinations</p>
              <ul className="space-y-1.5">
                <li><Link to="/destinations/Goa" className="hover:text-[#244C66] dark:hover:text-[#75A4C4] transition-colors">Goa Coast</Link></li>
                <li><Link to="/destinations/Manali" className="hover:text-[#244C66] dark:hover:text-[#75A4C4] transition-colors">Manali & Solang</Link></li>
                <li><Link to="/destinations/Jaipur" className="hover:text-[#244C66] dark:hover:text-[#75A4C4] transition-colors">Jaipur Pink City</Link></li>
                <li><Link to="/destinations/Varanasi" className="hover:text-[#244C66] dark:hover:text-[#75A4C4] transition-colors">Varanasi Ghats</Link></li>
                <li><Link to="/destinations" className="hover:text-[#244C66] dark:hover:text-[#75A4C4] transition-colors">All 50+ Destinations</Link></li>
              </ul>
            </div>

            {/* Col 4: Help & Support */}
            <div className="space-y-2">
              <p className="font-semibold text-[#202A32] dark:text-[#F0F4F7] uppercase tracking-wider text-[11px]">Support & Legal</p>
              <ul className="space-y-1.5">
                <li><Link to="/support" className="hover:text-[#244C66] dark:hover:text-[#75A4C4] transition-colors">Helpdesk & FAQs</Link></li>
                <li><Link to="/dashboard/my-trips" className="hover:text-[#244C66] dark:hover:text-[#75A4C4] transition-colors">Booking Status</Link></li>
                <li><span className="text-[#89939B]">Privacy Policy</span></li>
                <li><span className="text-[#89939B]">Terms of Service</span></li>
                <li><Link to="/developer" className="hover:text-[#244C66] dark:hover:text-[#75A4C4] transition-colors">Developer API</Link></li>
              </ul>
            </div>

          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-[#89939B]">
            <p>© {new Date().getFullYear()} TravelIQ. All rights reserved.</p>
            <p>Built with verified Indian transit schedules and responsive layout.</p>
          </div>

        </div>
      </footer>

    </div>
  );
}
