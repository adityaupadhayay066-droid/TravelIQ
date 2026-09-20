import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Calendar, DollarSign, Compass, Utensils, 
  Navigation, ArrowLeft, CheckCircle2, Sparkles, Plus, 
  Trash2, Printer, Share2, Bookmark, BookmarkCheck, 
  MapPin, Users, Check, ChevronDown, ChevronUp,
  Palmtree, Camera, ShoppingBag, Coffee, 
  Music, Landmark, Footprints, Search, Info,
  TrendingUp, Award, Zap, HelpCircle, Star, Grid,
  Plane, Train, Bus, Car, Bed, ShieldCheck, Tag,
  Clock, Sun, CloudSun, RefreshCw, CheckCircle,
  ExternalLink, ArrowRight, ArrowDownUp, AlertCircle, Heart
} from 'lucide-react';
import toast from 'react-hot-toast';
import { DESTINATIONS_CATALOG, DESTINATION_MAP } from '../data/destinationsData';
import { api } from '../utils/api';
import HotelBookingModal from '../components/HotelBookingModal';
import BookingModal from '../components/BookingModal';

export const ACTIVITY_CATEGORIES = [
  { id: 'all', label: 'All Activities', icon: Compass },
  { id: 'sightseeing', label: 'Sightseeing & Landmarks', icon: Camera },
  { id: 'heritage', label: 'Heritage & Culture', icon: Landmark },
  { id: 'food', label: 'Food & Culinary Crawls', icon: Utensils },
  { id: 'nature', label: 'Nature & Scenic', icon: Palmtree },
  { id: 'adventure', label: 'Adventure & Treks', icon: Footprints },
  { id: 'shopping', label: 'Shopping & Bazaars', icon: ShoppingBag },
  { id: 'nightlife', label: 'Nightlife & Lounges', icon: Music },
  { id: 'wellness', label: 'Relaxation & Wellness', icon: Coffee }
];

export default function DestinationPage() {
  const { cityName } = useParams();
  const navigate = useNavigate();
  const currentKey = (cityName || 'manali').toLowerCase();
  
  // Lookup destination or fallback
  const dest = DESTINATION_MAP[currentKey] || 
    DESTINATIONS_CATALOG.find(d => d.name.toLowerCase() === currentKey) || 
    DESTINATIONS_CATALOG[0];

  // Planner Configuration States
  const [plannerDays, setPlannerDays] = useState(3);
  const [selectedCategories, setSelectedCategories] = useState(['sightseeing', 'heritage', 'food', 'nature', 'adventure']);
  const [travelPace, setTravelPace] = useState('moderate'); // 'relaxed' (2/day), 'moderate' (3/day), 'packed' (4/day)
  const [budgetTier, setBudgetTier] = useState('mid'); // 'budget', 'mid', 'luxury'
  const [travelParty, setTravelParty] = useState('couple'); // 'solo', 'couple', 'family', 'friends'
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });
  
  // Generated Plan & UI States
  const [generatedPlan, setGeneratedPlan] = useState(null);
  const [activePlanDay, setActivePlanDay] = useState(1);
  const [isSaved, setIsSaved] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState('MMTHOLIDAY');
  const [couponInput, setCouponInput] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(1500);

  // Custom Activity Modal & Form
  const [showAddCustom, setShowAddCustom] = useState(false);
  const [customActivityTitle, setCustomActivityTitle] = useState('');
  const [customActivityCategory, setCustomActivityCategory] = useState('sightseeing');
  const [customActivitySlot, setCustomActivitySlot] = useState('14:00');
  const [customActivityCost, setCustomActivityCost] = useState('Free');
  const [customActivityTip, setCustomActivityTip] = useState('');

  // Activity Swap / Replace Modal States
  const [swapModalOpen, setSwapModalOpen] = useState(false);
  const [swapTargetActivity, setSwapTargetActivity] = useState(null); // { dayNumber, slotId }
  const [swapCategoryFilter, setSwapCategoryFilter] = useState('all');

  // Booking Modal States (Stays & Transport)
  const [selectedHotelForBooking, setSelectedHotelForBooking] = useState(null);
  const [isHotelModalOpen, setIsHotelModalOpen] = useState(false);
  
  const [selectedTransportItem, setSelectedTransportItem] = useState(null);
  const [transportType, setTransportType] = useState('Train');
  const [isTransportModalOpen, setIsTransportModalOpen] = useState(false);

  // Live Stays from API
  const [liveHotels, setLiveHotels] = useState([]);
  const [loadingHotels, setLoadingHotels] = useState(false);

  // Fetch live hotels from backend or fallback to dest.curatedStays
  useEffect(() => {
    let isMounted = true;
    const fetchHotels = async () => {
      setLoadingHotels(true);
      try {
        const res = await api.get(`/api/hotels/search?destination=${encodeURIComponent(dest.name)}&limit=6`);
        if (isMounted && res.data && res.data.hotels && res.data.hotels.length > 0) {
          setLiveHotels(res.data.hotels);
        } else {
          if (isMounted) setLiveHotels(dest.curatedStays || []);
        }
      } catch {
        if (isMounted) setLiveHotels(dest.curatedStays || []);
      } finally {
        if (isMounted) setLoadingHotels(false);
      }
    };
    fetchHotels();
    return () => { isMounted = false; };
  }, [dest.id, dest.name]);

  // Generate dynamic, realistic day-by-day plan
  const generateCustomPlan = () => {
    const slotsPerDay = travelPace === 'relaxed' ? 2 : travelPace === 'moderate' ? 3 : 4;
    const pool = dest.activityPool || [];
    
    // Filter activities matching selected categories, fallback to all pool if too narrow
    let matchedActivities = pool.filter(act => 
      selectedCategories.length === 0 || selectedCategories.includes(act.category)
    );
    if (matchedActivities.length === 0) matchedActivities = pool;

    const daysArray = [];
    let actIndex = 0;

    const timeSlotsMap = {
      2: ['09:30', '15:30'],
      3: ['09:00', '13:30', '17:30'],
      4: ['08:30', '11:45', '15:30', '19:00']
    };
    const slotTimes = timeSlotsMap[slotsPerDay] || ['09:00', '13:30', '17:30'];

    const commuteEstimates = [
      '🚗 12 km • 25 mins scenic drive',
      '🚶 450m • 6 mins walk',
      '🚗 6 km • 15 mins cab ride',
      '🚗 18 km • 35 mins mountain transit',
      '🚶 800m • 10 mins village stroll'
    ];

    const dayThemes = [
      `Iconic Highlights & Alpine Exploration`,
      `Scenic Valleys & Cultural Heritage Excursion`,
      `Adventure, Local Cafes & Panoramic Sunset`,
      `Hidden Waterfalls & Traditional Cuisine Trail`,
      `Serene Nature Walks & Souvenir Bazaars`,
      `Offbeat Countryside & Riverside Bonfire`,
      `Relaxation, Souvenir Shopping & Farewell Vistas`
    ];

    for (let dayNum = 1; dayNum <= plannerDays; dayNum++) {
      const daySlots = [];

      for (let s = 0; s < slotsPerDay; s++) {
        // Pick distinct activities without repetitive cycling
        const templateAct = matchedActivities[actIndex % matchedActivities.length] || pool[s % pool.length];
        actIndex++;
        
        daySlots.push({
          id: `act_${dayNum}_${s}_${Date.now()}_${actIndex}`,
          title: templateAct ? templateAct.title : `Explore ${dest.name} scenic spot`,
          category: templateAct ? templateAct.category : 'sightseeing',
          timeSlot: slotTimes[s] || '14:00',
          duration: templateAct?.duration || '2 hrs',
          cost: templateAct?.cost || 'Free',
          tip: templateAct?.tip || 'Recommended local activity with stunning vistas.',
          location: templateAct?.location || `${dest.name} City Area`,
          commuteInfo: s > 0 ? commuteEstimates[(dayNum + s) % commuteEstimates.length] : null,
          completed: false
        });
      }

      // Calculate Day Date
      const dateObj = new Date(startDate);
      dateObj.setDate(dateObj.getDate() + (dayNum - 1));
      const formattedDate = dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

      // Daily Chef's Food recommendation
      const foodItem = (dest.localFood && dest.localFood[(dayNum - 1) % dest.localFood.length]) || 'Authentic Regional Delicacies';

      daysArray.push({
        dayNumber: dayNum,
        title: `Day ${dayNum}: ${dayThemes[(dayNum - 1) % dayThemes.length]}`,
        dateStr: formattedDate,
        dayFoodRecommendation: foodItem,
        stayRecommendation: (dest.curatedStays && dest.curatedStays[(dayNum - 1) % dest.curatedStays.length]?.name) || `Comfort Valley Stay in ${dest.name}`,
        schedule: daySlots
      });
    }

    setGeneratedPlan(daysArray);
    setActivePlanDay(1);
    setIsSaved(false);
  };

  // Initial plan generation on mount or criteria change
  useEffect(() => {
    generateCustomPlan();
  }, [dest.id, plannerDays, travelPace]);

  // Handle category toggle
  const toggleCategory = (catId) => {
    if (catId === 'all') {
      setSelectedCategories(['sightseeing', 'heritage', 'food', 'nature', 'adventure', 'shopping', 'nightlife', 'wellness']);
      return;
    }
    if (selectedCategories.includes(catId)) {
      if (selectedCategories.length === 1) {
        toast.error('Please select at least one activity category.');
        return;
      }
      setSelectedCategories(prev => prev.filter(c => c !== catId));
    } else {
      setSelectedCategories(prev => [...prev, catId]);
    }
  };

  // Toggle activity completed checkbox
  const toggleActivityComplete = (dayNumber, activityId) => {
    if (!generatedPlan) return;
    setGeneratedPlan(prev => prev.map(d => {
      if (d.dayNumber !== dayNumber) return d;
      return {
        ...d,
        schedule: d.schedule.map(slot => slot.id === activityId ? { ...slot, completed: !slot.completed } : slot)
      };
    }));
  };

  // Delete an activity from day
  const deleteActivity = (dayNumber, activityId) => {
    if (!generatedPlan) return;
    setGeneratedPlan(prev => prev.map(d => {
      if (d.dayNumber !== dayNumber) return d;
      return {
        ...d,
        schedule: d.schedule.filter(slot => slot.id !== activityId)
      };
    }));
    toast.success('Activity removed from itinerary.');
  };

  // Move activity Up / Down
  const moveActivity = (dayNumber, slotIndex, direction) => {
    if (!generatedPlan) return;
    setGeneratedPlan(prev => prev.map(d => {
      if (d.dayNumber !== dayNumber) return d;
      const newSchedule = [...d.schedule];
      const targetIndex = direction === 'up' ? slotIndex - 1 : slotIndex + 1;
      if (targetIndex < 0 || targetIndex >= newSchedule.length) return d;
      const temp = newSchedule[slotIndex];
      newSchedule[slotIndex] = newSchedule[targetIndex];
      newSchedule[targetIndex] = temp;
      return { ...d, schedule: newSchedule };
    }));
  };

  // Open Activity Swap Modal
  const handleOpenSwapModal = (dayNumber, slotId) => {
    setSwapTargetActivity({ dayNumber, slotId });
    setSwapCategoryFilter('all');
    setSwapModalOpen(true);
  };

  // Confirm Activity Swap
  const handleConfirmSwap = (replacementAct) => {
    if (!swapTargetActivity || !generatedPlan) return;
    const { dayNumber, slotId } = swapTargetActivity;

    setGeneratedPlan(prev => prev.map(d => {
      if (d.dayNumber !== dayNumber) return d;
      return {
        ...d,
        schedule: d.schedule.map(slot => {
          if (slot.id !== slotId) return slot;
          return {
            ...slot,
            title: replacementAct.title,
            category: replacementAct.category,
            duration: replacementAct.duration,
            cost: replacementAct.cost,
            tip: replacementAct.tip,
            location: replacementAct.location || slot.location
          };
        })
      };
    }));

    setSwapModalOpen(false);
    setSwapTargetActivity(null);
    toast.success(`Activity swapped to: ${replacementAct.title}`);
  };

  // Add custom activity
  const handleAddCustomActivity = (e) => {
    e.preventDefault();
    if (!customActivityTitle.trim()) {
      toast.error('Please enter an activity title.');
      return;
    }

    setGeneratedPlan(prev => prev.map(d => {
      if (d.dayNumber !== activePlanDay) return d;
      return {
        ...d,
        schedule: [
          ...d.schedule,
          {
            id: `user_act_${Date.now()}`,
            title: customActivityTitle.trim(),
            category: customActivityCategory,
            timeSlot: customActivitySlot || '15:00',
            duration: '1.5 hrs',
            cost: customActivityCost || 'Custom',
            tip: customActivityTip.trim() || 'Custom planned activity.',
            location: `${dest.name} Local Spot`,
            commuteInfo: '🚗 Local transfer',
            completed: false
          }
        ].sort((a, b) => a.timeSlot.localeCompare(b.timeSlot))
      };
    }));

    setCustomActivityTitle('');
    setCustomActivityTip('');
    setShowAddCustom(false);
    toast.success(`Custom activity added to Day ${activePlanDay}!`);
  };

  // Apply Coupon
  const handleApplyCoupon = (e) => {
    e.preventDefault();
    const code = couponInput.trim().toUpperCase();
    if (!code) return;
    if (code === 'MMTHOLIDAY' || code === 'TRAVELIQ15' || code === 'OYOSTAY300') {
      setAppliedCoupon(code);
      setCouponDiscount(code === 'TRAVELIQ15' ? 2000 : code === 'OYOSTAY300' ? 1200 : 1500);
      toast.success(`Coupon ${code} applied successfully!`);
    } else {
      toast.error('Invalid coupon code. Try MMTHOLIDAY or TRAVELIQ15');
    }
  };

  // Estimated budget itemized calculation
  const budgetBreakdown = useMemo(() => {
    const hotelRatePerNight = budgetTier === 'budget' ? 1899 : budgetTier === 'mid' ? 4200 : 9500;
    const foodDaily = budgetTier === 'budget' ? 600 : budgetTier === 'mid' ? 1200 : 2500;
    const sightseeingDaily = budgetTier === 'budget' ? 500 : budgetTier === 'mid' ? 1100 : 2200;
    const cabDaily = budgetTier === 'budget' ? 800 : budgetTier === 'mid' ? 1600 : 3200;
    
    const partyMultiplier = travelParty === 'solo' ? 1 : travelParty === 'couple' ? 1.8 : travelParty === 'family' ? 3.2 : 2.6;
    
    const staysTotal = Math.round(hotelRatePerNight * plannerDays * (travelParty === 'solo' ? 1 : travelParty === 'couple' ? 1 : 2));
    const foodTotal = Math.round(foodDaily * plannerDays * partyMultiplier);
    const sightseeingTotal = Math.round(sightseeingDaily * plannerDays * partyMultiplier);
    const cabTotal = Math.round(cabDaily * plannerDays);
    
    const grossTotal = staysTotal + foodTotal + sightseeingTotal + cabTotal;
    const discount = appliedCoupon ? Math.min(couponDiscount, Math.round(grossTotal * 0.2)) : 0;
    const taxes = Math.round((grossTotal - discount) * 0.05); // 5% GST
    const finalTotal = grossTotal - discount + taxes;

    return {
      staysTotal,
      foodTotal,
      sightseeingTotal,
      cabTotal,
      grossTotal,
      discount,
      taxes,
      finalTotal
    };
  }, [budgetTier, plannerDays, travelParty, appliedCoupon, couponDiscount]);

  // Save trip to localStorage
  const handleSavePlan = () => {
    try {
      const savedTrips = JSON.parse(localStorage.getItem('saved_travel_plans') || '[]');
      const newPlan = {
        id: `plan_${Date.now()}`,
        destination: dest.name,
        state: dest.state,
        days: plannerDays,
        startDate: startDate,
        budgetTier: budgetTier,
        travelParty: travelParty,
        plan: generatedPlan,
        totalBudget: budgetBreakdown.finalTotal,
        createdAt: new Date().toISOString()
      };
      savedTrips.unshift(newPlan);
      localStorage.setItem('saved_travel_plans', JSON.stringify(savedTrips.slice(0, 25)));
      setIsSaved(true);
      toast.success(`Trip to ${dest.name} saved! Access anytime in Saved Plans.`);
    } catch {
      toast.error('Failed to save trip locally.');
    }
  };

  // Print/Download Itinerary
  const handlePrint = () => {
    window.print();
  };

  // Share itinerary
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${plannerDays}-Day Holiday Itinerary for ${dest.name} | TravelIQ & MMT`,
        text: `Check out my customized ${plannerDays}-day holiday itinerary for ${dest.name}! Total package estimate: ₹${budgetBreakdown.finalTotal.toLocaleString('en-IN')}`,
        url: window.location.href
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Trip package link copied to clipboard!');
    }
  };

  // Trigger Hotel Booking Modal
  const handleBookHotel = (hotel) => {
    setSelectedHotelForBooking(hotel);
    setIsHotelModalOpen(true);
  };

  // Trigger Transport Booking Modal
  const handleBookTransport = (mode, itemData) => {
    setTransportType(mode);
    setSelectedTransportItem(itemData);
    setIsTransportModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#F7F5EF] dark:bg-[#12201D] text-[#263238] dark:text-[#F7F5EF] transition-colors pb-20">
      
      {/* ========================================================================= */}
      {/* HERO BANNER & QUICK DESTINATION SWITCHER                                  */}
      {/* ========================================================================= */}
      <div className="relative h-88 sm:h-[440px] w-full bg-[#173F3A] overflow-hidden">
        <img 
          src={dest.heroImage} 
          alt={dest.name} 
          className="w-full h-full object-cover opacity-85 transition-transform duration-700 hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#12201D] via-[#173F3A]/65 to-black/40" />
        
        <div className="absolute bottom-0 left-0 right-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 text-white">
          <div className="flex items-center justify-between gap-4 mb-3 flex-wrap">
            <Link 
              to="/destinations" 
              className="inline-flex items-center gap-1.5 text-xs text-[#E3DED2] hover:text-white transition-colors bg-black/40 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> All Indian Holiday Destinations ({DESTINATIONS_CATALOG.length})
            </Link>

            {/* Quick Destination Switcher Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto py-1 max-w-full scrollbar-none">
              {DESTINATIONS_CATALOG.map((city) => (
                <button
                  key={city.id}
                  onClick={() => navigate(`/destinations/${city.id}`)}
                  className={`text-xs px-3 py-1 rounded-full font-medium transition-all whitespace-nowrap ${
                    dest.id === city.id 
                      ? 'bg-[#D96C4F] text-white shadow-md font-bold scale-105' 
                      : 'bg-white/20 text-[#E3DED2] hover:bg-white/30 backdrop-blur-sm'
                  }`}
                >
                  {city.name}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-3xl sm:text-5xl font-extrabold font-heading text-white">{dest.name}</h1>
                <span className="text-xs sm:text-sm font-semibold text-white bg-[#4F7D62]/80 border border-emerald-400/30 px-3 py-1 rounded-lg backdrop-blur-sm">
                  {dest.state}
                </span>
                <span className="text-xs font-bold text-amber-300 bg-black/50 border border-amber-400/30 px-2.5 py-1 rounded-lg flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-current text-amber-400" /> {dest.rating || 4.8} ({dest.reviews || '15k+'} reviews)
                </span>
                <span className="text-xs font-bold text-emerald-300 bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-1 rounded-lg flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> MMT & OYO Verified Destination
                </span>
              </div>
              <p className="mt-2 text-xs sm:text-sm text-white/90 max-w-2xl leading-relaxed">
                {dest.tagline}
              </p>
            </div>

            {/* Jump to Customize CTA */}
            <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
              <a 
                href="#trip-planner-section" 
                className="btn-primary !bg-[#D96C4F] hover:!bg-[#c55d41] text-white inline-flex items-center gap-2 shadow-lg hover:shadow-xl !h-10 !px-5 text-sm font-bold rounded-xl"
              >
                <Sparkles className="w-4 h-4" />
                <span>Customize Package</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* DESTINATION ESSENTIALS BAR (Weather, Budget, Transport, Best Time)         */}
      {/* ========================================================================= */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-5 relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-4 shadow-xl backdrop-blur-md">
          
          <div className="flex items-center gap-3 p-2">
            <div className="p-3 rounded-xl bg-amber-500/10 text-amber-500 shrink-0">
              <Sun className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase text-[#66736F] dark:text-[#A3B0AB]">Live Weather</div>
              <div className="text-sm font-extrabold text-[#173F3A] dark:text-white">
                {dest.weather?.temp || '18°C'} • {dest.weather?.condition || 'Sunny & Crisp'}
              </div>
              <div className="text-[11px] text-[#66736F] dark:text-[#A3B0AB] truncate max-w-[180px]">
                {dest.weather?.clothingTip || 'Carry light woollens.'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-2">
            <div className="p-3 rounded-xl bg-[#D96C4F]/10 text-[#D96C4F] shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase text-[#66736F] dark:text-[#A3B0AB]">Best Season</div>
              <div className="text-sm font-extrabold text-[#173F3A] dark:text-white">{dest.bestTime}</div>
              <div className="text-[11px] text-[#66736F] dark:text-[#A3B0AB]">Ideal stay: {dest.idealDays || '3 - 4 Days'}</div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-2">
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500 shrink-0">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase text-[#66736F] dark:text-[#A3B0AB]">Avg Daily Budget</div>
              <div className="text-sm font-extrabold text-[#173F3A] dark:text-white">{dest.avgBudget}</div>
              <div className="text-[11px] text-[#66736F] dark:text-[#A3B0AB]">Includes hotel, meals & local cabs</div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-2">
            <div className="p-3 rounded-xl bg-sky-500/10 text-sky-500 shrink-0">
              <Navigation className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase text-[#66736F] dark:text-[#A3B0AB]">Getting Around</div>
              <div className="text-xs font-bold text-[#173F3A] dark:text-white line-clamp-1">{dest.gettingAround}</div>
              <div className="text-[11px] text-[#66736F] dark:text-[#A3B0AB]">Rental cabs & scooties easily available</div>
            </div>
          </div>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* MAIN CONTAINER                                                            */}
      {/* ========================================================================= */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
        
        {/* ========================================================================= */}
        {/* SMART TRIP PLANNER & HOLIDAY PACKAGE CUSTOMIZER (MMT & OYO App Engine)    */}
        {/* ========================================================================= */}
        <section id="trip-planner-section" className="scroll-mt-24 space-y-6">
          
          {/* Section Header with Actions */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[var(--color-border)] pb-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#D96C4F]/10 text-[#D96C4F] text-xs font-bold mb-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>MMT & OYO Smart Holiday Engine</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#173F3A] dark:text-white font-heading">
                Customize Your {dest.name} Holiday Package
              </h2>
              <p className="text-xs sm:text-sm text-[#66736F] dark:text-[#A3B0AB] mt-1">
                Personalize duration, travel style, activities and instantly book verified OYO/MMT stays with government e-KYC authentication.
              </p>
            </div>

            {/* Quick Actions (Save, Share, Print) */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleSavePlan}
                className={`btn-secondary !h-9 !px-3.5 text-xs inline-flex items-center gap-1.5 transition ${
                  isSaved ? 'text-emerald-500 border-emerald-500/40 bg-emerald-500/10 font-bold' : ''
                }`}
              >
                {isSaved ? <BookmarkCheck className="w-4 h-4 text-emerald-500" /> : <Bookmark className="w-4 h-4" />}
                <span>{isSaved ? 'Saved in My Trips' : 'Save Plan'}</span>
              </button>
              <button
                onClick={handleShare}
                className="btn-secondary !h-9 !px-3.5 text-xs inline-flex items-center gap-1.5"
                title="Share Package"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Share</span>
              </button>
              <button
                onClick={handlePrint}
                className="btn-secondary !h-9 !px-3.5 text-xs inline-flex items-center gap-1.5"
                title="Print Itinerary"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print PDF</span>
              </button>
            </div>
          </div>

          {/* Interactive Customizer Control Panel */}
          <div className="travel-card p-6 sm:p-8 space-y-6 bg-gradient-to-br from-[var(--color-surface)] to-[var(--color-soft)] shadow-lg rounded-2xl border border-[var(--color-border)]">
            
            {/* Step 1: Duration Selector */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-[#66736F] dark:text-[#A3B0AB]">
                  1. Choose Holiday Duration ({plannerDays} Days / {plannerDays - 1 > 0 ? `${plannerDays - 1} Nights` : 'Same Day'})
                </label>
                <span className="text-xs font-bold text-[#D96C4F] bg-[#D96C4F]/10 px-2.5 py-1 rounded-md">
                  {plannerDays === 1 ? '⚡ Express Tour' : plannerDays === 2 ? '🎒 Weekend Escape' : plannerDays === 3 ? '⭐ Classic Holiday' : plannerDays === 4 ? '🏔️ Deep Exploration' : '👑 Grand Himalayan Tour'}
                </span>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5">
                {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setPlannerDays(num)}
                    className={`py-3 px-2 rounded-xl text-center font-bold text-xs sm:text-sm border transition-all ${
                      plannerDays === num
                        ? 'bg-[#173F3A] text-white border-[#173F3A] dark:bg-[#4F7D62] dark:border-[#4F7D62] shadow-md scale-[1.03]'
                        : 'bg-[var(--color-surface)] text-[var(--color-text)] border-[var(--color-border)] hover:border-[#D96C4F]/50 hover:bg-[var(--color-soft)]'
                    }`}
                  >
                    <div className="text-sm sm:text-base font-extrabold">{num} {num === 1 ? 'Day' : 'Days'}</div>
                    <div className="text-[10px] font-normal opacity-80 mt-0.5">
                      {num === 1 ? '1D Express' : num === 2 ? '2D/1N' : num === 3 ? '3D/2N' : num === 4 ? '4D/3N' : `${num}D/${num-1}N`}
                    </div>
                  </button>
                ))}
              </div>

              {/* Date, Party & Pace Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div>
                  <label className="text-[11px] font-bold text-[#66736F] dark:text-[#A3B0AB] block mb-1">
                    Trip Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl px-3 py-2 text-xs font-medium text-[var(--color-text)] focus:ring-2 focus:ring-[#D96C4F] outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-[#66736F] dark:text-[#A3B0AB] block mb-1">
                    Who is Traveling?
                  </label>
                  <select
                    value={travelParty}
                    onChange={(e) => setTravelParty(e.target.value)}
                    className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl px-3 py-2 text-xs font-medium text-[var(--color-text)] focus:ring-2 focus:ring-[#D96C4F] outline-none"
                  >
                    <option value="solo">Solo Traveler (1 Person)</option>
                    <option value="couple">Couple / Duo (2 Adults)</option>
                    <option value="family">Family with Kids (2-4 Pax)</option>
                    <option value="friends">Group of Friends (3-6 Pax)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-[#66736F] dark:text-[#A3B0AB] block mb-1">
                    Holiday Pace
                  </label>
                  <select
                    value={travelPace}
                    onChange={(e) => setTravelPace(e.target.value)}
                    className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl px-3 py-2 text-xs font-medium text-[var(--color-text)] focus:ring-2 focus:ring-[#D96C4F] outline-none"
                  >
                    <option value="relaxed">Relaxed (2 relaxed activities/day)</option>
                    <option value="moderate">Balanced (3 highlights/day)</option>
                    <option value="packed">Action-Packed (4 adventure slots/day)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Step 2: Activity Categories Decider */}
            <div className="space-y-3 pt-4 border-t border-[var(--color-border)]">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <label className="text-xs font-bold uppercase tracking-wider text-[#66736F] dark:text-[#A3B0AB]">
                  2. Customize Experience & Activity Categories ({selectedCategories.length} selected)
                </label>
                <button
                  type="button"
                  onClick={() => toggleCategory('all')}
                  className="text-xs text-[#D96C4F] hover:underline font-bold"
                >
                  Select All Categories
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                {ACTIVITY_CATEGORIES.filter(c => c.id !== 'all').map((cat) => {
                  const Icon = cat.icon;
                  const isSelected = selectedCategories.includes(cat.id);
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => toggleCategory(cat.id)}
                      className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all text-xs font-medium ${
                        isSelected
                          ? 'bg-[#4F7D62]/15 border-[#4F7D62] text-[#173F3A] dark:text-emerald-300 font-bold shadow-sm scale-[1.01]'
                          : 'bg-[var(--color-surface)] text-[var(--color-text-muted)] border-[var(--color-border)] hover:bg-[var(--color-soft)]'
                      }`}
                    >
                      <div className={`p-1.5 rounded-lg shrink-0 ${isSelected ? 'bg-[#4F7D62] text-white' : 'bg-[var(--color-soft)]'}`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <span className="truncate">{cat.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 3: Budget Tier & Live Package Breakdown Banner */}
            <div className="pt-4 border-t border-[var(--color-border)] space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#66736F] dark:text-[#A3B0AB] mr-1">Stay & Comfort Tier:</span>
                  {[
                    { id: 'budget', label: 'Backpacker / Budget ₹' },
                    { id: 'mid', label: 'OYO Premium / Comfort ₹₹' },
                    { id: 'luxury', label: 'Luxury Resort & Spa ₹₹₹' }
                  ].map(b => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setBudgetTier(b.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                        budgetTier === b.id
                          ? 'bg-[#173F3A] text-white dark:bg-[#4F7D62] shadow-sm font-bold'
                          : 'bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-soft)]'
                      }`}
                    >
                      {b.label}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    generateCustomPlan();
                    toast.success(`Generated ${plannerDays}-day personalized holiday plan for ${dest.name}!`);
                  }}
                  className="btn-primary !h-10 !px-5 text-xs sm:text-sm inline-flex items-center gap-2 justify-center shadow-md font-bold"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Update & Regenerate Itinerary</span>
                </button>
              </div>

              {/* MMT-Style Real Package Price Breakdown Card */}
              <div className="bg-[#173F3A]/5 dark:bg-black/30 border border-[#173F3A]/20 dark:border-emerald-500/20 rounded-2xl p-4 sm:p-5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 flex-1">
                    <div className="space-y-0.5">
                      <div className="text-[10px] font-bold uppercase text-[#66736F] dark:text-[#A3B0AB]">Curated Stays</div>
                      <div className="text-xs sm:text-sm font-bold text-[#173F3A] dark:text-white">₹{budgetBreakdown.staysTotal.toLocaleString('en-IN')}</div>
                      <div className="text-[10px] text-[#66736F] dark:text-[#A3B0AB]">{plannerDays} days stay</div>
                    </div>

                    <div className="space-y-0.5">
                      <div className="text-[10px] font-bold uppercase text-[#66736F] dark:text-[#A3B0AB]">Sightseeing & Passes</div>
                      <div className="text-xs sm:text-sm font-bold text-[#173F3A] dark:text-white">₹{budgetBreakdown.sightseeingTotal.toLocaleString('en-IN')}</div>
                      <div className="text-[10px] text-[#66736F] dark:text-[#A3B0AB]">All selected entries</div>
                    </div>

                    <div className="space-y-0.5">
                      <div className="text-[10px] font-bold uppercase text-[#66736F] dark:text-[#A3B0AB]">Local Cabs / Transit</div>
                      <div className="text-xs sm:text-sm font-bold text-[#173F3A] dark:text-white">₹{budgetBreakdown.cabTotal.toLocaleString('en-IN')}</div>
                      <div className="text-[10px] text-[#66736F] dark:text-[#A3B0AB]">Dedicated local driver</div>
                    </div>

                    <div className="space-y-0.5">
                      <div className="text-[10px] font-bold uppercase text-[#66736F] dark:text-[#A3B0AB]">Food Allowance</div>
                      <div className="text-xs sm:text-sm font-bold text-[#173F3A] dark:text-white">₹{budgetBreakdown.foodTotal.toLocaleString('en-IN')}</div>
                      <div className="text-[10px] text-[#66736F] dark:text-[#A3B0AB]">Cafes & local thalis</div>
                    </div>
                  </div>

                  <div className="border-t md:border-t-0 md:border-l border-[var(--color-border)] pt-3 md:pt-0 md:pl-5 shrink-0 flex flex-col items-start md:items-end justify-center">
                    <div className="flex items-center gap-2">
                      <span className="text-xs line-through text-[#66736F]">₹{(budgetBreakdown.grossTotal + 3000).toLocaleString('en-IN')}</span>
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                        Save ₹{(3000 + budgetBreakdown.discount).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="text-xl sm:text-2xl font-black text-[#173F3A] dark:text-emerald-400 font-heading">
                      ₹{budgetBreakdown.finalTotal.toLocaleString('en-IN')}
                    </div>
                    <div className="text-[10px] text-[#66736F] dark:text-[#A3B0AB]">
                      Incl. 5% GST • EMI from ₹{Math.round(budgetBreakdown.finalTotal / 6).toLocaleString('en-IN')}/mo
                    </div>
                  </div>

                </div>

                {/* Coupon Code Input */}
                <div className="mt-4 pt-3 border-t border-[var(--color-border)] flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs">
                    <Tag className="w-4 h-4 text-[#D96C4F]" />
                    <span className="font-semibold text-[var(--color-text)]">Applied Coupon:</span>
                    <span className="font-bold text-[#D96C4F] bg-[#D96C4F]/10 px-2.5 py-0.5 rounded-full">
                      {appliedCoupon} (-₹{budgetBreakdown.discount.toLocaleString('en-IN')})
                    </span>
                  </div>

                  <form onSubmit={handleApplyCoupon} className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Enter code (e.g. MMTHOLIDAY)"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg px-2.5 py-1 text-xs text-[var(--color-text)] uppercase outline-none focus:border-[#D96C4F]"
                    />
                    <button type="submit" className="btn-secondary !h-7 !px-3 text-xs font-bold">
                      Apply
                    </button>
                  </form>
                </div>
              </div>

            </div>

          </div>

          {/* ========================================================================= */}
          {/* GENERATED DAY-BY-DAY INTERACTIVE TIMELINE                                 */}
          {/* ========================================================================= */}
          {generatedPlan && generatedPlan.length > 0 && (
            <div className="space-y-6 pt-4">
              
              {/* Day Switcher Tabs Bar */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-[var(--color-border)] scrollbar-none">
                {generatedPlan.map((d) => (
                  <button
                    key={d.dayNumber}
                    onClick={() => setActivePlanDay(d.dayNumber)}
                    className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
                      activePlanDay === d.dayNumber
                        ? 'bg-[#173F3A] text-white dark:bg-[#4F7D62] shadow-md scale-[1.02]'
                        : 'bg-[var(--color-surface)] text-[var(--color-text-muted)] border border-[var(--color-border)] hover:bg-[var(--color-soft)]'
                    }`}
                  >
                    <span>Day {d.dayNumber}</span>
                    <span className="text-[11px] font-normal opacity-80">({d.dateStr})</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-black/20 text-white font-mono">
                      {d.schedule.length} spots
                    </span>
                  </button>
                ))}

                <button
                  onClick={() => setShowAddCustom(!showAddCustom)}
                  className="ml-auto btn-secondary !h-9 !px-3 text-xs inline-flex items-center gap-1.5 shrink-0 font-bold"
                >
                  <Plus className="w-3.5 h-3.5 text-[#D96C4F]" />
                  <span>Add Spot to Day {activePlanDay}</span>
                </button>
              </div>

              {/* Add Custom Spot Popup Form */}
              {showAddCustom && (
                <form onSubmit={handleAddCustomActivity} className="travel-card p-5 bg-[#D96C4F]/5 border-[#D96C4F]/40 space-y-4 rounded-2xl animate-fade-in">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-[#173F3A] dark:text-white flex items-center gap-1.5">
                      <Plus className="w-4 h-4 text-[#D96C4F]" />
                      Add Custom Activity / Spot to Day {activePlanDay}
                    </h4>
                    <button type="button" onClick={() => setShowAddCustom(false)} className="text-xs text-[#66736F] hover:text-rose-500">Cancel</button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div className="sm:col-span-2">
                      <label className="text-[10px] font-bold text-[#66736F] uppercase block mb-1">Activity / Spot Title</label>
                      <input
                        type="text"
                        placeholder="e.g. Sunset photography at Cafe 1947"
                        value={customActivityTitle}
                        onChange={(e) => setCustomActivityTitle(e.target.value)}
                        className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl px-3 py-2 text-xs text-[var(--color-text)] outline-none focus:border-[#D96C4F]"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-[#66736F] uppercase block mb-1">Time Slot</label>
                      <input
                        type="time"
                        value={customActivitySlot}
                        onChange={(e) => setCustomActivitySlot(e.target.value)}
                        className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl px-3 py-2 text-xs text-[var(--color-text)] outline-none focus:border-[#D96C4F]"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-[#66736F] uppercase block mb-1">Category</label>
                      <select
                        value={customActivityCategory}
                        onChange={(e) => setCustomActivityCategory(e.target.value)}
                        className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl px-3 py-2 text-xs text-[var(--color-text)] outline-none focus:border-[#D96C4F]"
                      >
                        <option value="sightseeing">Sightseeing</option>
                        <option value="adventure">Adventure</option>
                        <option value="food">Food & Dining</option>
                        <option value="heritage">Heritage & Culture</option>
                        <option value="nature">Nature & Scenic</option>
                        <option value="shopping">Shopping</option>
                        <option value="nightlife">Nightlife</option>
                        <option value="wellness">Wellness</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-[#66736F] uppercase block mb-1">Special Notes / Pro-Tip</label>
                    <input
                      type="text"
                      placeholder="e.g. Reserve outdoor riverside table in advance"
                      value={customActivityTip}
                      onChange={(e) => setCustomActivityTip(e.target.value)}
                      className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl px-3 py-2 text-xs text-[var(--color-text)] outline-none focus:border-[#D96C4F]"
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <button type="submit" className="btn-primary !h-8 !px-4 text-xs font-bold">
                      Save to Day {activePlanDay} Itinerary
                    </button>
                  </div>
                </form>
              )}

              {/* Active Day Overview Banner */}
              {generatedPlan
                .filter(d => d.dayNumber === activePlanDay)
                .map((dayData) => (
                  <div key={dayData.dayNumber} className="space-y-4">
                    
                    {/* Day Highlights Strip */}
                    <div className="p-4 rounded-2xl bg-gradient-to-r from-[#173F3A]/10 via-[#4F7D62]/10 to-transparent border border-[var(--color-border)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="text-xs font-bold text-[#D96C4F] uppercase tracking-wider">
                          {dayData.dateStr} • {dest.name}
                        </div>
                        <h3 className="text-base sm:text-lg font-extrabold text-[#173F3A] dark:text-white font-heading">
                          {dayData.title}
                        </h3>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap text-xs">
                        <div className="flex items-center gap-1.5 bg-[var(--color-surface)] px-3 py-1.5 rounded-lg border border-[var(--color-border)] shadow-sm">
                          <Utensils className="w-3.5 h-3.5 text-[#D96C4F]" />
                          <span className="font-medium text-[#66736F] dark:text-[#A3B0AB]">Must Taste:</span>
                          <span className="font-bold text-[var(--color-text)]">{dayData.dayFoodRecommendation}</span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-[var(--color-surface)] px-3 py-1.5 rounded-lg border border-[var(--color-border)] shadow-sm">
                          <Bed className="w-3.5 h-3.5 text-[#4F7D62]" />
                          <span className="font-medium text-[#66736F] dark:text-[#A3B0AB]">Overnight:</span>
                          <span className="font-bold text-[var(--color-text)] truncate max-w-[150px]">{dayData.stayRecommendation}</span>
                        </div>
                      </div>
                    </div>

                    {/* Timeline Activity Cards */}
                    <div className="space-y-3 relative before:absolute before:left-6 before:top-4 before:bottom-4 before:w-0.5 before:bg-[var(--color-border)] before:hidden sm:before:block">
                      {dayData.schedule.length === 0 ? (
                        <div className="travel-card p-8 text-center text-[#66736F] dark:text-[#A3B0AB] rounded-2xl">
                          No activities scheduled for this day yet. Click "+ Add Spot to Day {activePlanDay}" above to plan your day.
                        </div>
                      ) : (
                        dayData.schedule.map((slot, index) => (
                          <div key={slot.id || index} className="space-y-2">
                            
                            {/* Commute Info Tag */}
                            {slot.commuteInfo && (
                              <div className="flex items-center gap-2 text-[11px] text-[#66736F] dark:text-[#A3B0AB] font-medium sm:ml-12 pl-2 border-l-2 border-[#D96C4F]/40 py-0.5">
                                <Car className="w-3.5 h-3.5 text-[#D96C4F]" />
                                <span>{slot.commuteInfo}</span>
                              </div>
                            )}

                            {/* Activity Item Card */}
                            <div
                              className={`travel-card p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row sm:items-start justify-between gap-4 transition-all hover:border-[#D96C4F]/40 ${
                                slot.completed ? 'opacity-65 bg-emerald-500/5 border-emerald-500/30' : ''
                              }`}
                            >
                              <div className="flex items-start gap-3.5 min-w-0 flex-1">
                                
                                {/* Checkbox button */}
                                <button
                                  type="button"
                                  onClick={() => toggleActivityComplete(dayData.dayNumber, slot.id)}
                                  className={`p-2 rounded-xl border mt-0.5 shrink-0 transition ${
                                    slot.completed 
                                      ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm' 
                                      : 'bg-[var(--color-soft)] text-[#66736F] border-[var(--color-border)] hover:border-[#D96C4F]'
                                  }`}
                                  title={slot.completed ? 'Mark as to-do' : 'Mark as completed'}
                                >
                                  <Check className="w-4 h-4" />
                                </button>

                                <div className="space-y-1.5 min-w-0 flex-1">
                                  {/* Badges row */}
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-mono font-bold text-xs text-[#D96C4F] bg-[#D96C4F]/10 px-2 py-0.5 rounded-md flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      {slot.timeSlot}
                                    </span>
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#173F3A] dark:text-emerald-300 bg-[#4F7D62]/15 px-2 py-0.5 rounded-md">
                                      {slot.category}
                                    </span>
                                    <span className="text-[11px] text-[#66736F] dark:text-[#A3B0AB]">
                                      • {slot.duration}
                                    </span>
                                    <span className="text-[11px] font-bold text-[#4F7D62] dark:text-emerald-400">
                                      • {slot.cost}
                                    </span>
                                    {slot.location && (
                                      <span className="text-[11px] text-[#66736F] dark:text-[#A3B0AB] flex items-center gap-0.5">
                                        <MapPin className="w-3 h-3 text-[#D96C4F]" />
                                        {slot.location}
                                      </span>
                                    )}
                                  </div>

                                  {/* Title */}
                                  <h4 className={`text-sm sm:text-base font-bold text-[var(--color-text)] leading-snug ${slot.completed ? 'line-through' : ''}`}>
                                    {slot.title}
                                  </h4>

                                  {/* Tip */}
                                  {slot.tip && (
                                    <p className="text-xs text-[#66736F] dark:text-[#A3B0AB] leading-relaxed flex items-start gap-1.5 pt-0.5">
                                      <Info className="w-3.5 h-3.5 text-[#D96C4F] shrink-0 mt-0.5" />
                                      <span>{slot.tip}</span>
                                    </p>
                                  )}
                                </div>
                              </div>

                              {/* Card Action Controls (Swap, Reorder, Delete) */}
                              <div className="flex items-center gap-1 self-end sm:self-center shrink-0">
                                
                                {/* Swap Activity Button (MMT Style) */}
                                <button
                                  type="button"
                                  onClick={() => handleOpenSwapModal(dayData.dayNumber, slot.id)}
                                  className="btn-secondary !h-8 !px-2.5 text-xs inline-flex items-center gap-1 text-[#D96C4F] hover:bg-[#D96C4F]/10 border-[#D96C4F]/30"
                                  title="Swap this activity with another city highlight"
                                >
                                  <RefreshCw className="w-3.5 h-3.5" />
                                  <span className="text-[11px] font-bold">Swap</span>
                                </button>

                                {/* Move Up */}
                                <button
                                  type="button"
                                  onClick={() => moveActivity(dayData.dayNumber, index, 'up')}
                                  disabled={index === 0}
                                  className="p-1.5 rounded-lg text-[#66736F] hover:bg-[var(--color-soft)] disabled:opacity-30"
                                  title="Move Up"
                                >
                                  <ChevronUp className="w-4 h-4" />
                                </button>

                                {/* Move Down */}
                                <button
                                  type="button"
                                  onClick={() => moveActivity(dayData.dayNumber, index, 'down')}
                                  disabled={index === dayData.schedule.length - 1}
                                  className="p-1.5 rounded-lg text-[#66736F] hover:bg-[var(--color-soft)] disabled:opacity-30"
                                  title="Move Down"
                                >
                                  <ChevronDown className="w-4 h-4" />
                                </button>

                                {/* Delete */}
                                <button
                                  type="button"
                                  onClick={() => deleteActivity(dayData.dayNumber, slot.id)}
                                  className="p-1.5 rounded-lg text-[#66736F] hover:text-rose-500 hover:bg-rose-500/10 transition"
                                  title="Remove activity"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                  </div>
                ))}

            </div>
          )}

        </section>

        {/* ========================================================================= */}
        {/* RECOMMENDED OYO & MMT VERIFIED STAYS IN DESTINATION                       */}
        {/* ========================================================================= */}
        <section className="space-y-6 pt-4 border-t border-[var(--color-border)]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-1">
                <ShieldCheck className="w-4 h-4" />
                <span>OYO Sanitized & MMT Assured Stays</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-extrabold text-[#173F3A] dark:text-white font-heading">
                Top Hotels & Mountain Stays in {dest.name}
              </h3>
              <p className="text-xs text-[#66736F] dark:text-[#A3B0AB]">
                Instant reservation with zero upfront cancellation charges and DigiLocker instant e-KYC check-in.
              </p>
            </div>

            <Link
              to="/dashboard/hotels"
              className="btn-secondary !h-9 !px-4 text-xs font-bold inline-flex items-center gap-1 self-start sm:self-auto"
            >
              <span>View All Hotels in {dest.name}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(liveHotels.length > 0 ? liveHotels : dest.curatedStays || []).map((stay, idx) => (
              <div 
                key={stay.id || idx}
                className="travel-card overflow-hidden flex flex-col justify-between group hover:shadow-xl transition-all duration-300 border border-[var(--color-border)]"
              >
                <div>
                  {/* Image Container */}
                  <div className="relative h-48 w-full overflow-hidden bg-black/10">
                    <img 
                      src={stay.image || stay.images?.[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80'} 
                      alt={stay.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3 flex items-center gap-1.5">
                      <span className="bg-[#173F3A]/90 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-md shadow">
                        {stay.type || 'Verified Stay'}
                      </span>
                      {stay.discountBadge && (
                        <span className="bg-[#D96C4F] text-white text-[10px] font-extrabold px-2 py-1 rounded-md shadow">
                          {stay.discountBadge}
                        </span>
                      )}
                    </div>
                    <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-md text-amber-300 text-xs font-bold px-2.5 py-1 rounded-md flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-current text-amber-400" />
                      <span>{stay.rating || 4.8}</span>
                      <span className="text-[10px] text-white/80 font-normal">({stay.reviewsCount || stay.reviews || '1.2k'})</span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5 space-y-3">
                    <div>
                      <h4 className="font-bold text-base text-[#173F3A] dark:text-white font-heading line-clamp-1 group-hover:text-[#D96C4F] transition-colors">
                        {stay.name}
                      </h4>
                      <div className="flex items-center gap-1 text-xs text-[#66736F] dark:text-[#A3B0AB] mt-1">
                        <MapPin className="w-3.5 h-3.5 text-[#D96C4F] shrink-0" />
                        <span className="truncate">{stay.address || stay.location || `${dest.name}, ${dest.state}`}</span>
                      </div>
                    </div>

                    {/* Amenities tags */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {(stay.amenities || ['Free WiFi', 'Mountain View', 'Hot Water', 'Restaurant']).slice(0, 3).map((am, aIdx) => (
                        <span key={aIdx} className="text-[10px] font-semibold bg-[var(--color-soft)] text-[#66736F] dark:text-[#A3B0AB] px-2 py-0.5 rounded-md">
                          {am}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Pricing & CTA */}
                <div className="p-5 pt-0 border-t border-[var(--color-border)] mt-2 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[10px] text-[#66736F]">Per night for 2 adults</div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-lg font-black text-[#173F3A] dark:text-emerald-400">
                        ₹{(stay.price || stay.pricePerNight || 2499).toLocaleString('en-IN')}
                      </span>
                      {stay.originalPrice && (
                        <span className="text-xs line-through text-[#66736F]">
                          ₹{stay.originalPrice.toLocaleString('en-IN')}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleBookHotel(stay)}
                    className="btn-primary !h-9 !px-4 text-xs font-bold inline-flex items-center gap-1.5 shadow-md"
                  >
                    <Bed className="w-3.5 h-3.5" />
                    <span>Book Stay</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* HOW TO REACH & TRANSIT BOOKING (Flights, Trains, Volvo Buses)             */}
        {/* ========================================================================= */}
        <section className="space-y-6 pt-4 border-t border-[var(--color-border)]">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-600 dark:text-sky-400 mb-1">
              <Navigation className="w-4 h-4" />
              <span>Transit & Connectivity Guide</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-extrabold text-[#173F3A] dark:text-white font-heading">
              How to Reach {dest.name}
            </h3>
            <p className="text-xs text-[#66736F] dark:text-[#A3B0AB]">
              Direct flights, high-speed Vande Bharat trains, and luxury sleeper buses with AI ticket finder.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Flight Card */}
            <div className="travel-card p-6 space-y-4 flex flex-col justify-between border border-[var(--color-border)]">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="p-3 rounded-xl bg-sky-500/10 text-sky-500">
                    <Plane className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-bold text-sky-600 dark:text-sky-400 bg-sky-500/10 px-2.5 py-0.5 rounded-full">
                    Fastest Route
                  </span>
                </div>
                <div>
                  <h4 className="font-bold text-base text-[#173F3A] dark:text-white font-heading">By Air / Flights</h4>
                  <p className="text-xs text-[#66736F] dark:text-[#A3B0AB] mt-1 font-medium">
                    {dest.howToReach?.flight?.title || 'Nearest Domestic & International Airport'}
                  </p>
                </div>
                <div className="text-xs text-[#66736F] dark:text-[#A3B0AB] space-y-1">
                  <div>• Distance to City: <span className="font-bold text-[var(--color-text)]">{dest.howToReach?.flight?.distance || '45 km'}</span></div>
                  <div>• Flight Duration: <span className="font-bold text-[var(--color-text)]">{dest.howToReach?.flight?.duration || '1h 20m'}</span></div>
                  <div>• Starting Fare: <span className="font-bold text-emerald-600 dark:text-emerald-400">{dest.howToReach?.flight?.startingFare || '₹2,800'}</span></div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleBookTransport('Flight', {
                  title: `Flight to ${dest.name} Airport`,
                  from: 'Delhi / Mumbai / Bangalore',
                  to: dest.name,
                  departure: '08:45 AM',
                  arrival: '10:15 AM',
                  classes: ['Economy - ₹3,499', 'Flexi - ₹4,800', 'Business - ₹8,900']
                })}
                className="btn-secondary !h-9 text-xs font-bold w-full justify-center inline-flex items-center gap-1.5 mt-4"
              >
                <Plane className="w-3.5 h-3.5" />
                <span>Search Flights to {dest.name}</span>
              </button>
            </div>

            {/* Train Card */}
            <div className="travel-card p-6 space-y-4 flex flex-col justify-between border border-[var(--color-border)]">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="p-3 rounded-xl bg-amber-500/10 text-amber-500">
                    <Train className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full">
                    Scenic Rail
                  </span>
                </div>
                <div>
                  <h4 className="font-bold text-base text-[#173F3A] dark:text-white font-heading">By Railway / Trains</h4>
                  <p className="text-xs text-[#66736F] dark:text-[#A3B0AB] mt-1 font-medium">
                    {dest.howToReach?.train?.title || 'Nearest Railway Hub'}
                  </p>
                </div>
                <div className="text-xs text-[#66736F] dark:text-[#A3B0AB] space-y-1">
                  <div>• Key Terminus: <span className="font-bold text-[var(--color-text)]">{dest.howToReach?.train?.distance || 'Direct Junction'}</span></div>
                  <div>• Key Trains: <span className="font-bold text-[var(--color-text)]">{dest.howToReach?.train?.duration || 'Vande Bharat / Express'}</span></div>
                  <div>• Starting Fare: <span className="font-bold text-emerald-600 dark:text-emerald-400">{dest.howToReach?.train?.startingFare || '₹550'}</span></div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleBookTransport('Train', {
                  title: `Express Train to ${dest.name}`,
                  trainNumber: '12011',
                  trainName: `${dest.name} Superfast Express`,
                  from: 'Origin Station',
                  to: `${dest.name} Station`,
                  classes: ['3A - ₹1,250', '2A - ₹1,850', '1A - ₹2,900', 'SL - ₹520']
                })}
                className="btn-secondary !h-9 text-xs font-bold w-full justify-center inline-flex items-center gap-1.5 mt-4"
              >
                <Train className="w-3.5 h-3.5" />
                <span>Search Trains to {dest.name}</span>
              </button>
            </div>

            {/* Volvo Bus Card */}
            <div className="travel-card p-6 space-y-4 flex flex-col justify-between border border-[var(--color-border)]">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500">
                    <Bus className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full">
                    Overnight Sleeper
                  </span>
                </div>
                <div>
                  <h4 className="font-bold text-base text-[#173F3A] dark:text-white font-heading">By Intercity Volvo Bus</h4>
                  <p className="text-xs text-[#66736F] dark:text-[#A3B0AB] mt-1 font-medium">
                    {dest.howToReach?.bus?.title || 'Multi-Axle AC Volvo Sleeper'}
                  </p>
                </div>
                <div className="text-xs text-[#66736F] dark:text-[#A3B0AB] space-y-1">
                  <div>• Boarding Point: <span className="font-bold text-[var(--color-text)]">{dest.howToReach?.bus?.distance || 'Main Bus Stand'}</span></div>
                  <div>• Transit Time: <span className="font-bold text-[var(--color-text)]">{dest.howToReach?.bus?.duration || '8 - 12 Hours'}</span></div>
                  <div>• Starting Fare: <span className="font-bold text-emerald-600 dark:text-emerald-400">{dest.howToReach?.bus?.startingFare || '₹850'}</span></div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleBookTransport('Bus', {
                  title: `Luxury AC Volvo Sleeper to ${dest.name}`,
                  from: 'ISBT / Central Stand',
                  to: dest.name,
                  departure: '08:30 PM',
                  arrival: '07:00 AM (Next Day)',
                  classes: ['Volvo AC Sleeper - ₹1,199', 'Volvo AC Semi-Sleeper - ₹899']
                })}
                className="btn-secondary !h-9 text-xs font-bold w-full justify-center inline-flex items-center gap-1.5 mt-4"
              >
                <Bus className="w-3.5 h-3.5" />
                <span>Book Volvo Bus</span>
              </button>
            </div>

          </div>
        </section>

        {/* ========================================================================= */}
        {/* THINGS TO DO & LOCAL CUISINE HIGHLIGHTS                                   */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4 border-t border-[var(--color-border)]">
          
          <div className="travel-card p-6 space-y-4 border border-[var(--color-border)]">
            <h3 className="text-lg font-bold text-[#173F3A] dark:text-white flex items-center gap-2 font-heading">
              <Compass className="w-5 h-5 text-[#D96C4F]" />
              Signature Experiences in {dest.name}
            </h3>
            <ul className="space-y-3">
              {(dest.thingsToDo || []).map((item, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-[#263238] dark:text-[#F7F5EF]">
                  <CheckCircle2 className="w-4 h-4 text-[#4F7D62] shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="travel-card p-6 space-y-4 border border-[var(--color-border)]">
            <h3 className="text-lg font-bold text-[#173F3A] dark:text-white flex items-center gap-2 font-heading">
              <Utensils className="w-5 h-5 text-[#D96C4F]" />
              Iconic Local Food & Must-Visit Cafes
            </h3>
            <ul className="space-y-3">
              {(dest.localFood || []).map((dish, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-[#263238] dark:text-[#F7F5EF]">
                  <span className="w-2 h-2 rounded-full bg-[#D96C4F] shrink-0 mt-1.5" />
                  <span className="leading-relaxed">{dish}</span>
                </li>
              ))}
            </ul>
          </div>

        </div>

        {/* ========================================================================= */}
        {/* ICONIC LANDMARKS CARDS                                                    */}
        {/* ========================================================================= */}
        <div className="space-y-4 pt-4 border-t border-[var(--color-border)]">
          <h3 className="text-xl font-bold text-[#173F3A] dark:text-white font-heading">
            Iconic Places & Landmarks in {dest.name}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {(dest.popularPlaces || []).map((place) => (
              <div key={place.name} className="travel-card p-5 space-y-2 border border-[var(--color-border)] hover:border-[#D96C4F]/40 transition">
                <span className="travel-badge text-[10px] font-bold">{place.type}</span>
                <h4 className="font-bold text-base text-[#173F3A] dark:text-white font-heading">{place.name}</h4>
                <p className="text-xs text-[#66736F] dark:text-[#A3B0AB] leading-relaxed">{place.desc}</p>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* ACTIVITY SWAP / REPLACE MODAL (MMT Style)                                 */}
      {/* ========================================================================= */}
      {swapModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl">
            
            {/* Header */}
            <div className="p-5 border-b border-[var(--color-border)] flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-[#173F3A] dark:text-white font-heading flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-[#D96C4F]" />
                  Swap Activity for Day {swapTargetActivity?.dayNumber}
                </h3>
                <p className="text-xs text-[#66736F] dark:text-[#A3B0AB] mt-0.5">
                  Pick an alternative curated highlight from {dest.name}’s activity pool.
                </p>
              </div>
              <button
                onClick={() => setSwapModalOpen(false)}
                className="p-1.5 rounded-lg text-[#66736F] hover:bg-[var(--color-soft)]"
              >
                ✕
              </button>
            </div>

            {/* Category Filter Pills */}
            <div className="px-5 py-2.5 bg-[var(--color-soft)] flex items-center gap-1.5 overflow-x-auto scrollbar-none border-b border-[var(--color-border)]">
              {['all', 'sightseeing', 'adventure', 'heritage', 'food', 'nature', 'wellness', 'shopping', 'nightlife'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setSwapCategoryFilter(cat)}
                  className={`text-[11px] px-3 py-1 rounded-full font-bold whitespace-nowrap capitalize transition ${
                    swapCategoryFilter === cat
                      ? 'bg-[#173F3A] text-white dark:bg-[#4F7D62]'
                      : 'bg-[var(--color-surface)] text-[var(--color-text-muted)] border border-[var(--color-border)] hover:bg-[var(--color-surface)]'
                  }`}
                >
                  {cat === 'all' ? 'All Activities' : cat}
                </button>
              ))}
            </div>

            {/* Activity List */}
            <div className="p-5 overflow-y-auto space-y-3 flex-1">
              {(dest.activityPool || [])
                .filter(act => swapCategoryFilter === 'all' || act.category === swapCategoryFilter)
                .map((act) => (
                  <div
                    key={act.id}
                    className="p-4 rounded-xl border border-[var(--color-border)] hover:border-[#D96C4F] bg-[var(--color-surface)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition group"
                  >
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-bold uppercase text-[#173F3A] dark:text-emerald-300 bg-[#4F7D62]/15 px-2 py-0.5 rounded">
                          {act.category}
                        </span>
                        <span className="text-[11px] text-[#66736F] dark:text-[#A3B0AB]">• {act.duration}</span>
                        <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">• {act.cost}</span>
                      </div>
                      <h4 className="text-sm font-bold text-[var(--color-text)]">{act.title}</h4>
                      {act.tip && (
                        <p className="text-xs text-[#66736F] dark:text-[#A3B0AB] leading-relaxed">{act.tip}</p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleConfirmSwap(act)}
                      className="btn-primary !h-8 !px-4 text-xs font-bold shrink-0 self-end sm:self-center"
                    >
                      Choose This
                    </button>
                  </div>
                ))}
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* HOTEL & STAY BOOKING MODAL (With DigiLocker KYC Verification Flow)        */}
      {/* ========================================================================= */}
      {isHotelModalOpen && selectedHotelForBooking && (
        <HotelBookingModal
          hotel={selectedHotelForBooking}
          isOpen={isHotelModalOpen}
          onClose={() => setIsHotelModalOpen(false)}
          onBookingSuccess={(receipt) => {
            toast.success(`Stay booked at ${selectedHotelForBooking.name}! Booking ID: ${receipt.bookingId}`);
          }}
        />
      )}

      {/* ========================================================================= */}
      {/* TRANSPORT BOOKING MODAL (Flights, Trains, Volvo Buses)                     */}
      {/* ========================================================================= */}
      {isTransportModalOpen && selectedTransportItem && (
        <BookingModal
          item={selectedTransportItem}
          type={transportType}
          isOpen={isTransportModalOpen}
          onClose={() => setIsTransportModalOpen(false)}
          onBookingSuccess={(booking) => {
            toast.success(`${transportType} ticket confirmed! PNR: ${booking.pnr || booking.bookingId}`);
          }}
        />
      )}

    </div>
  );
}
