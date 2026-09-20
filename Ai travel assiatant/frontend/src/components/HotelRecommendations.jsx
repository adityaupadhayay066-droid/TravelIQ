import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building2, Star, MapPin, Wifi, Car, UtensilsCrossed, Dumbbell, 
  Wind, Waves, Sparkles, ChevronDown, AlertCircle, Search, Filter, 
  ExternalLink, CheckCircle2, Bed, ShieldCheck, Tag, Heart, Flame,
  Coffee, Users, ArrowRight
} from 'lucide-react';
import { api } from '../utils/api';
import toast from 'react-hot-toast';
import HotelBookingModal from './HotelBookingModal';

// ─── Map amenity names to icons for display ───
const AMENITY_ICONS = {
  'Free Wi-Fi': Wifi, 'Wi-Fi': Wifi,
  'Free parking': Car, 'Paid parking': Car,
  'Restaurant': UtensilsCrossed, 'Bar': UtensilsCrossed,
  'Fitness center': Dumbbell,
  'Air conditioning': Wind,
  'Pool': Waves, 'Hot tub': Waves,
  'Spa': Sparkles,
};

const POPULAR_CITIES = ['Jamshedpur', 'Delhi', 'Mumbai', 'Kochi', 'Jaipur', 'Goa', 'Kolkata', 'Bangalore'];

const CATEGORY_TABS = [
  { id: 'all', label: '🌟 All Stays' },
  { id: 'hostel', label: '🎒 Hostels & Dormitories' },
  { id: '5-star', label: '👑 5-Star Luxury' },
  { id: 'hotel', label: '🏨 Hotels & Suites' },
  { id: 'homestay', label: '🏡 Homestays & Villas' }
];

/**
 * Renders a star rating display.
 */
function RatingStars({ rating }) {
  if (!rating) return null;
  const fullStars = Math.floor(rating);
  const hasHalf = rating - fullStars >= 0.3;
  
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`w-3.5 h-3.5 ${
              i < fullStars
                ? 'text-[#E5B85C] fill-[#E5B85C]'
                : i === fullStars && hasHalf
                ? 'text-[#E5B85C] fill-[#E5B85C]/50'
                : 'text-[#E3DED2] dark:text-[#2A403A]'
            }`}
          />
        ))}
      </div>
      <span className="text-xs font-bold text-[#E5B85C]">{rating}</span>
    </div>
  );
}

/**
 * Shimmer loading skeleton for hotel cards.
 */
function HotelShimmer() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((n) => (
        <div key={n} className="bg-[#FFFFFF] dark:bg-[#1B2C28] border border-[#E3DED2] dark:border-[#2A403A] rounded-xl p-5 space-y-3 animate-pulse">
          <div className="flex justify-between items-start">
            <div className="space-y-2 flex-1">
              <div className="w-56 h-5 bg-[#EEF2ED] dark:bg-[#213530] rounded shimmer" />
              <div className="w-36 h-4 bg-[#EEF2ED] dark:bg-[#213530] rounded shimmer" />
            </div>
            <div className="w-20 h-6 bg-[#EEF2ED] dark:bg-[#213530] rounded shimmer" />
          </div>
          <div className="flex gap-2 pt-2">
            <div className="w-20 h-6 bg-[#EEF2ED] dark:bg-[#213530] rounded shimmer" />
            <div className="w-20 h-6 bg-[#EEF2ED] dark:bg-[#213530] rounded shimmer" />
            <div className="w-20 h-6 bg-[#EEF2ED] dark:bg-[#213530] rounded shimmer" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Single hotel card component — Production Ready with Book Action & Amenity Badges.
 */
function HotelCard({ hotel, index, onBook }) {
  const amenities = (hotel.features || [])
    .filter(f => !f.match(/^\d-star hotel$/i) && !['Apartment', 'House', 'Villa', 'Bungalow'].includes(f))
    .slice(0, 5);

  const isHostel = hotel.isHostel;
  const lowestRoomPrice = hotel.roomTypes && hotel.roomTypes.length > 0 
    ? Math.min(...hotel.roomTypes.map(r => r.pricePerNight))
    : hotel.price;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.25 }}
      className={`bg-[#FFFFFF] dark:bg-[#1B2C28] border rounded-2xl p-5 hover:border-[#14532D]/50 dark:hover:border-[#EEF2ED]/50 transition-all duration-300 shadow-sm group relative ${
        isHostel ? 'border-[#E58A3A]/30 dark:border-[#E58A3A]/20 bg-gradient-to-br from-white to-[#FFFDF7] dark:from-[#1B2C28] dark:to-[#172722]' : 'border-[#E3DED2] dark:border-[#2A403A]'
      }`}
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left: Hotel Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-3.5">
            <div className={`p-3 rounded-2xl flex-shrink-0 mt-0.5 border shadow-xs ${
              isHostel 
                ? 'bg-[#E58A3A]/10 text-[#E58A3A] border-[#E58A3A]/20' 
                : 'bg-[#EEF2ED] dark:bg-[#213530] text-[#14532D] dark:text-[#EEF2ED] border-[#E3DED2] dark:border-[#2A403A]'
            }`}>
              {isHostel ? <Bed className="w-5 h-5" /> : <Building2 className="w-5 h-5" />}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap min-w-0">
                <h4 className="font-bold text-base text-[#263238] dark:text-[#F7F5EF] truncate group-hover:text-[#14532D] dark:group-hover:text-white transition-colors">
                  {hotel.name}
                </h4>

                {isHostel ? (
                  <span className="text-[10px] font-black uppercase tracking-wider bg-[#E58A3A]/15 text-[#E58A3A] border border-[#E58A3A]/30 px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                    <Bed className="w-2.5 h-2.5" /> Backpacker Hostel & Pods
                  </span>
                ) : hotel.type ? (
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-[#EEF2ED] dark:bg-[#213530] text-[#14532D] dark:text-[#EEF2ED] px-2 py-0.5 rounded-full border border-[#E3DED2] dark:border-[#2A403A] shrink-0">
                    {hotel.type}
                  </span>
                ) : null}

                {hotel.hasRestaurant && (
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-[#EEF2ED] dark:bg-[#213530] text-[#4F7D62] dark:text-[#4F7D62] px-2 py-0.5 rounded-full border border-[#4F7D62]/20 flex items-center gap-1 shrink-0">
                    <UtensilsCrossed className="w-2.5 h-2.5" /> In-House Dining
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                <RatingStars rating={hotel.rating} />
                <span className="text-[#66736F] dark:text-[#A3B0AB] text-xs">•</span>
                <div className="flex items-center gap-1 text-xs text-[#66736F] dark:text-[#A3B0AB] font-medium">
                  <MapPin className="w-3.5 h-3.5 text-[#66736F] dark:text-[#A3B0AB]" />
                  <span className="capitalize">{hotel.city}</span>
                </div>
                <span className="text-[#66736F] dark:text-[#A3B0AB] text-xs">•</span>
                <span className="text-[11px] text-[#15803D] font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Zero Prepayment Option
                </span>
              </div>

              {/* Room Types summary snippet */}
              {hotel.roomTypes && hotel.roomTypes.length > 0 && (
                <div className="mt-2.5 flex items-center gap-2 text-xs text-[#66736F] dark:text-[#94A3B8] font-medium flex-wrap">
                  <span className="text-[#14532D] dark:text-[#A7D7C5] font-bold">Room Options:</span>
                  {hotel.roomTypes.slice(0, 3).map((r, i) => (
                    <span key={i} className="bg-[#F7F5EF] dark:bg-[#12201D] px-2 py-0.5 rounded border border-[#E3DED2] dark:border-[#273E36] text-[11px]">
                      {r.name}
                    </span>
                  ))}
                  {hotel.roomTypes.length > 3 && (
                    <span className="text-[10px] text-[#64748B]">+{hotel.roomTypes.length - 3} more</span>
                  )}
                </div>
              )}

              {/* Amenity Badges */}
              {amenities.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {amenities.map((amenity, i) => {
                    const Icon = AMENITY_ICONS[amenity];
                    return (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1.5 text-[11px] font-medium bg-[#F7F5EF] dark:bg-[#12201D] text-[#66736F] dark:text-[#A3B0AB] px-2.5 py-1 rounded-lg border border-[#E3DED2] dark:border-[#2A403A]"
                      >
                        {Icon && <Icon className="w-3 h-3 text-[#14532D] dark:text-[#EEF2ED]" />}
                        {amenity}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Pricing & Reserve Action */}
        <div className="flex items-center lg:flex-col lg:items-end justify-between border-t lg:border-t-0 border-[#E3DED2] dark:border-[#2A403A] pt-3 lg:pt-0 gap-3 min-w-[160px] sm:min-w-[190px]">
          <div className="text-left lg:text-right">
            {lowestRoomPrice ? (
              <>
                <div className="flex items-baseline gap-1 lg:justify-end">
                  <span className="text-xl sm:text-2xl font-black text-[#14532D] dark:text-[#F7F5EF] font-heading">
                    ₹{lowestRoomPrice.toLocaleString('en-IN')}
                  </span>
                  <span className="text-xs text-[#66736F] dark:text-[#A3B0AB] font-medium">
                    / {isHostel ? 'bed / night' : 'night'}
                  </span>
                </div>
                <p className="text-[10px] text-[#15803D] font-semibold flex items-center lg:justify-end gap-1 mt-0.5">
                  <CheckCircle2 className="w-3 h-3" /> Best Rate Guaranteed
                </p>
              </>
            ) : (
              <p className="text-xs text-[#66736F] dark:text-[#A3B0AB] italic">Price available on request</p>
            )}
          </div>

          <button
            onClick={() => onBook(hotel)}
            className="px-5 py-2.5 bg-[#14532D] hover:bg-[#0F3F22] text-white text-xs font-bold rounded-xl transition-all flex items-center gap-2 shadow-md hover:scale-[1.02] active:scale-[0.98] cursor-pointer whitespace-nowrap"
          >
            {isHostel ? 'Reserve Bed / Room' : 'Choose Room & Reserve'} <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

/**
 * HotelRecommendations — Full Featured Production Stay Booking Component
 */
export default function HotelRecommendations({ destination, viewMode = 'all', onSelectCity }) {
  const [hotels, setHotels] = useState([]);
  const [diningOptions, setDiningOptions] = useState([]);
  const [matchedCity, setMatchedCity] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Filters & State
  const [categoryTab, setCategoryTab] = useState('all');
  const [sortBy, setSortBy] = useState('rating');
  const [searchFilter, setSearchFilter] = useState('');
  const [showAllHotels, setShowAllHotels] = useState(false);
  const [showAllDining, setShowAllDining] = useState(false);
  
  // Active Hotel for Room Selection & Booking Modal
  const [activeBookingHotel, setActiveBookingHotel] = useState(null);

  const activeDest = destination || '';

  // Fetch hotel data whenever destination or sort changes
  useEffect(() => {
    if (!activeDest) return;

    const fetchHotels = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get('/hotels/search', {
          params: { destination: activeDest, sort: sortBy, limit: 120 }
        });

        if (response.data && response.data.success) {
          setHotels(response.data.hotels || []);
          setDiningOptions(response.data.diningOptions || []);
          setMatchedCity(response.data.matchedCity || null);
        } else {
          setHotels([]);
          setDiningOptions([]);
        }
      } catch (err) {
        console.warn('[Hotels] Failed to fetch hotel recommendations:', err.message);
        setError('Could not load hotel recommendations.');
        setHotels([]);
        setDiningOptions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchHotels();
  }, [activeDest, sortBy]);

  // Client-side category and name filtering
  const filteredHotels = useMemo(() => {
    return hotels.filter(h => {
      const matchesName = !searchFilter || h.name.toLowerCase().includes(searchFilter.toLowerCase());
      
      let matchesCategory = true;
      if (categoryTab === 'hostel') {
        matchesCategory = h.isHostel || (h.category && h.category.toLowerCase().includes('hostel'));
      } else if (categoryTab === '5-star') {
        matchesCategory = h.category === '5-Star Luxury' || (h.type && h.type.includes('5-Star'));
      } else if (categoryTab === 'hotel') {
        matchesCategory = !h.isHostel && (h.category === '4-Star Premium' || h.category === '3-Star Standard' || (h.type && h.type.includes('Hotel')));
      } else if (categoryTab === 'homestay') {
        matchesCategory = h.category === 'Resort & Villa' || h.category === 'Apartment & Home' || h.category === 'Budget & Homestay';
      }

      return matchesName && matchesCategory;
    });
  }, [hotels, searchFilter, categoryTab]);

  const filteredDining = useMemo(() => {
    return diningOptions.filter(h => {
      return !searchFilter || h.name.toLowerCase().includes(searchFilter.toLowerCase());
    });
  }, [diningOptions, searchFilter]);

  const displayCity = matchedCity
    ? matchedCity.charAt(0).toUpperCase() + matchedCity.slice(1)
    : (activeDest || 'Selected Destination');

  const handleBookClick = (hotel) => {
    setActiveBookingHotel(hotel);
  };

  // If no destination set yet, show an elegant city selection card
  if (!activeDest) {
    return (
      <div className="bg-[#FFFFFF] dark:bg-[#1B2C28] border border-[#E3DED2] dark:border-[#2A403A] rounded-2xl p-8 text-center space-y-4 shadow-sm">
        <div className="w-14 h-14 bg-[#14532D]/10 text-[#14532D] dark:text-[#A7D7C5] rounded-2xl flex items-center justify-center mx-auto shadow-sm">
          <Building2 className="w-7 h-7" />
        </div>
        <h3 className="text-xl font-bold font-heading text-[#14532D] dark:text-[#F7F5EF]">
          Explore Verified Hostels, Pods & Hotels
        </h3>
        <p className="text-xs sm:text-sm text-[#66736F] dark:text-[#A3B0AB] max-w-lg mx-auto leading-relaxed">
          Search for a travel route or pick a destination city below to browse real hostels, dormitories, and luxury hotels with instant room selection & booking.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
          {POPULAR_CITIES.map(city => (
            <button
              key={city}
              onClick={() => onSelectCity && onSelectCity(city)}
              className="px-4 py-2 bg-[#F7F5EF] dark:bg-[#12201D] hover:bg-[#14532D] hover:text-white dark:hover:bg-[#EEF2ED] dark:hover:text-[#12201D] text-[#263238] dark:text-[#F7F5EF] text-xs font-bold rounded-xl transition-all border border-[#E3DED2] dark:border-[#2A403A] cursor-pointer shadow-xs"
            >
              📍 {city}
            </button>
          ))}
        </div>
      </div>
    );
  }

  const INITIAL_HOTEL_COUNT = 8;
  const INITIAL_DINING_COUNT = 4;

  const visibleHotels = showAllHotels ? filteredHotels : filteredHotels.slice(0, INITIAL_HOTEL_COUNT);
  const visibleDining = showAllDining ? filteredDining : filteredDining.slice(0, INITIAL_DINING_COUNT);

  return (
    <div className="space-y-6 mt-2">
      
      {/* Category Tab Bar (OYO & Booking.com style) */}
      <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap scrollbar-none pb-1">
        {CATEGORY_TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setCategoryTab(tab.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
              categoryTab === tab.id
                ? 'bg-[#14532D] text-white border-[#14532D] shadow-md'
                : 'bg-white dark:bg-[#1B2C28] text-[#66736F] dark:text-[#A3B0AB] border-[#E3DED2] dark:border-[#2A403A] hover:border-[#14532D]/40'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search & Filter Header Toolbar */}
      <div className="bg-[#FFFFFF] dark:bg-[#1B2C28] p-4 rounded-2xl border border-[#E3DED2] dark:border-[#2A403A] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#66736F] dark:text-[#A3B0AB] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by hotel / hostel name..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full h-10 bg-[#F7F5EF] dark:bg-[#12201D] border border-[#E3DED2] dark:border-[#2A403A] text-[#263238] dark:text-[#F7F5EF] text-xs font-medium rounded-xl pl-9 pr-3 focus:outline-none focus:border-[#14532D] transition-all placeholder:text-[#66736F] dark:placeholder:text-[#A3B0AB]"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 justify-end">
          <span className="text-xs text-[#66736F] dark:text-[#A3B0AB] font-medium hidden sm:inline">Sort by:</span>
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="appearance-none h-10 bg-[#F7F5EF] dark:bg-[#12201D] border border-[#E3DED2] dark:border-[#2A403A] text-[#263238] dark:text-[#F7F5EF] text-xs font-semibold rounded-xl pl-3 pr-8 cursor-pointer hover:border-[#14532D]/50 transition-colors focus:outline-none"
            >
              <option value="rating">Highest Rated</option>
              <option value="price_low">Price: Low to High</option>
              <option value="price_high">Price: High to Low</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#66736F] pointer-events-none" />
          </div>
        </div>
      </div>

      {/* ─── Accommodations Section ─── */}
      {(viewMode === 'all' || viewMode === 'hotels') && (
        <div id="hotels-section" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-[#263238] dark:text-[#F7F5EF] flex items-center gap-2.5 font-heading">
              <span className="p-2 bg-[#EEF2ED] dark:bg-[#213530] text-[#14532D] dark:text-[#EEF2ED] rounded-xl border border-[#E3DED2] dark:border-[#2A403A]">
                {categoryTab === 'hostel' ? <Bed className="w-5 h-5" /> : <Building2 className="w-5 h-5" />}
              </span>
              {categoryTab === 'hostel' ? `Hostels & Dormitories in ${displayCity}` : `Verified Stays in ${displayCity}`}
              {!loading && (
                <span className="text-xs font-semibold bg-[#14532D]/10 text-[#14532D] dark:text-[#A7D7C5] border border-[#14532D]/20 px-2.5 py-0.5 rounded-full">
                  {filteredHotels.length} available
                </span>
              )}
            </h3>
          </div>

          {loading && <HotelShimmer />}

          {!loading && error && (
            <div className="bg-[#FFFFFF] dark:bg-[#1B2C28] border border-[#D96C4F]/50 rounded-xl p-5 flex items-center gap-3 text-[#D96C4F]">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          {!loading && !error && filteredHotels.length === 0 && (
            <div className="bg-[#FFFFFF] dark:bg-[#1B2C28] border border-[#E3DED2] dark:border-[#2A403A] rounded-2xl p-8 text-center space-y-3">
              <Building2 className="w-8 h-8 text-[#66736F] dark:text-[#A3B0AB] mx-auto" />
              <p className="text-sm text-[#66736F] dark:text-[#A3B0AB]">
                No matching stays found in this category for <span className="font-bold text-[#263238] dark:text-[#F7F5EF]">{displayCity}</span>.
              </p>
              <button
                onClick={() => setCategoryTab('all')}
                className="text-xs font-bold text-[#14532D] hover:underline"
              >
                View all available stays in {displayCity}
              </button>
            </div>
          )}

          {!loading && !error && filteredHotels.length > 0 && (
            <div className="space-y-3.5">
              {visibleHotels.map((hotel, idx) => (
                <HotelCard key={`hotel-${hotel.id || hotel.name}-${idx}`} hotel={hotel} index={idx} onBook={handleBookClick} />
              ))}

              {filteredHotels.length > INITIAL_HOTEL_COUNT && (
                <button
                  onClick={() => setShowAllHotels(!showAllHotels)}
                  className="w-full py-3.5 text-xs font-bold tracking-wide uppercase text-[#14532D] dark:text-white bg-[#FFFFFF] dark:bg-[#1B2C28] border border-[#E3DED2] dark:border-[#2A403A] rounded-2xl hover:bg-[#EEF2ED] dark:hover:bg-[#213530] transition-colors shadow-sm cursor-pointer"
                >
                  {showAllHotels ? 'Show Less' : `Show All ${filteredHotels.length} Stays in ${displayCity}`}
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* ─── Dining Options Section ─── */}
      {(viewMode === 'all' || viewMode === 'dining') && (
        <div id="dining-section" className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-[#263238] dark:text-[#F7F5EF] flex items-center gap-2.5 font-heading">
                <span className="p-2 bg-[#EEF2ED] dark:bg-[#213530] text-[#4F7D62] rounded-xl border border-[#E3DED2] dark:border-[#2A403A]">
                  <UtensilsCrossed className="w-5 h-5" />
                </span>
                In-House Dining & Restaurants in {displayCity}
                {!loading && (
                  <span className="text-xs font-semibold bg-[#4F7D62]/10 text-[#4F7D62] border border-[#4F7D62]/20 px-2.5 py-0.5 rounded-full">
                    {filteredDining.length} verified
                  </span>
                )}
              </h3>
            </div>
          </div>

          {loading && <HotelShimmer />}

          {!loading && !error && filteredDining.length > 0 && (
            <div className="space-y-3.5">
              {visibleDining.map((hotel, idx) => (
                <HotelCard key={`dining-${hotel.id || hotel.name}-${idx}`} hotel={hotel} index={idx} onBook={handleBookClick} />
              ))}

              {filteredDining.length > INITIAL_DINING_COUNT && (
                <button
                  onClick={() => setShowAllDining(!showAllDining)}
                  className="w-full py-3 text-xs font-bold tracking-wide uppercase text-[#4F7D62] dark:text-[#4F7D62] bg-[#FFFFFF] dark:bg-[#1B2C28] border border-[#E3DED2] dark:border-[#2A403A] rounded-xl hover:bg-[#EEF2ED] dark:hover:bg-[#213530] transition-colors shadow-sm cursor-pointer"
                >
                  {showAllDining ? 'Show Less' : `Show All ${filteredDining.length} Dining Venues in ${displayCity}`}
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* ─── Interactive Booking & Room Selection Modal ─── */}
      <AnimatePresence>
        {activeBookingHotel && (
          <HotelBookingModal
            hotel={activeBookingHotel}
            isOpen={!!activeBookingHotel}
            onClose={() => setActiveBookingHotel(null)}
            onBookingSuccess={(booking) => {
              toast.success(`Booking ${booking.bookingReference || booking.id} saved in your trips!`, { icon: '🎉' });
            }}
          />
        )}
      </AnimatePresence>

    </div>
  );
}
