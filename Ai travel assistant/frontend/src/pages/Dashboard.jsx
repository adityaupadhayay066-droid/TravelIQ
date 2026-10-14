import React, { useState, useEffect, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Calendar, Users, Edit3, Train, Plane, Bus, Sparkles, Sliders, X, 
  RotateCcw, Filter, ArrowRight, ArrowRightLeft, Clock, ShieldCheck, 
  CheckCircle2, AlertCircle, ChevronDown, ChevronRight, Info, Building2,
  Armchair, DollarSign, MapPin, Compass
} from 'lucide-react';
import StationAutocomplete from '../components/StationAutocomplete';
import PassengerSelector from '../components/PassengerSelector';
import FilterPanel from '../components/FilterPanel';
import GoogleMapComponent from '../components/GoogleMap';
import TripPlanner from '../components/TripPlanner';
import HotelRecommendations from '../components/HotelRecommendations';
import BookingModal from '../components/BookingModal';
import TravelBudgetPlanner from '../components/TravelBudgetPlanner';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import toast from 'react-hot-toast';

export default function Dashboard() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Search parameters from navigation state or defaults
  const [source, setSource] = useState(location.state?.source || null);
  const [dest, setDest] = useState(location.state?.dest || null);
  const [date, setDate] = useState(() => {
    if (location.state?.departureDate) return location.state.departureDate;
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [passengers, setPassengers] = useState(location.state?.passengers || 1);

  // Active top navigation tab
  const [activeTab, setActiveTab] = useState(() => {
    if (location.state?.openHotels) return 'hotels';
    if (location.state?.openCompare) return 'results';
    return 'results';
  });

  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState(null);
  const [routeMetadata, setRouteMetadata] = useState(null);
  const [selectedTrainForBooking, setSelectedTrainForBooking] = useState(null);
  const [detailModalItem, setDetailModalItem] = useState(null);
  const [isEditingSearch, setIsEditingSearch] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Sorting: 'recommended' | 'cheapest' | 'fastest' | 'earliest'
  const [sortBy, setSortBy] = useState('recommended');

  // Filter States
  const [selectedTransport, setSelectedTransport] = useState(() => {
    return location.state?.modeFilter || ['Train', 'Flight', 'Bus'];
  });
  const [priceMax, setPriceMax] = useState(15000);
  const [selectedStops, setSelectedStops] = useState(['Non-stop', '1 Stop', '2+ Stops']);
  const [selectedClasses, setSelectedClasses] = useState([]);

  // Calculate active filters count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedTransport.length < 3) count += (3 - selectedTransport.length);
    if (priceMax < 15000) count += 1;
    if (selectedStops.length < 3) count += (3 - selectedStops.length);
    if (selectedClasses.length > 0) count += selectedClasses.length;
    return count;
  }, [selectedTransport, priceMax, selectedStops, selectedClasses]);

  // Close filter drawer on Escape key press
  useEffect(() => {
    if (!isFilterOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsFilterOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFilterOpen]);

  const toggleTransport = (mode) => {
    setSelectedTransport(prev => 
      prev.includes(mode) ? (prev.length > 1 ? prev.filter(m => m !== mode) : prev) : [...prev, mode]
    );
  };

  const toggleStop = (stop) => {
    setSelectedStops(prev => 
      prev.includes(stop) ? prev.filter(s => s !== stop) : [...prev, stop]
    );
  };

  const toggleClass = (cls) => {
    setSelectedClasses(prev => 
      prev.includes(cls) ? prev.filter(c => c !== cls) : [...prev, cls]
    );
  };

  const resetFilters = () => {
    setSelectedTransport(['Train', 'Flight', 'Bus']);
    setPriceMax(15000);
    setSelectedStops(['Non-stop', '1 Stop', '2+ Stops']);
    setSelectedClasses([]);
  };

  const getStationName = (st) => {
    if (!st) return '';
    if (typeof st === 'string') return st;
    return st.station_name || st.station_code || '';
  };

  const getStationCode = (st) => {
    if (!st) return '';
    if (typeof st === 'string') return st;
    return st.station_code || st.station_name || '';
  };

  const handleSwapStations = () => {
    const temp = source;
    setSource(dest);
    setDest(temp);
  };

  const handleSearch = async () => {
    setLoading(true);
    try {
      const srcParam = getStationCode(source) || getStationName(source);
      const dstParam = getStationCode(dest) || getStationName(dest);

      const response = await api.post('/travel/routes/search', {
        source: srcParam,
        destination: dstParam,
        departureDate: date,
        tripType: 'One Way',
        passengers
      });

      if (response.data) {
        const transList = response.data.allTransports || response.data.trains || [];
        setSearchResults(transList);
        setRouteMetadata({
          hasAirport: response.data.hasAirport,
          distanceKm: response.data.distanceKm,
          flightCount: (response.data.flights || []).length,
          trainCount: (response.data.trains || []).length,
          busCount: (response.data.buses || []).length
        });
      } else {
        setSearchResults([]);
      }
    } catch (e) {
      console.error('Route search error:', e);
      toast.error('Could not fetch travel options for this route.');
      setSearchResults([]);
    } finally {
      setLoading(false);
      setIsEditingSearch(false);
    }
  };

  useEffect(() => {
    handleSearch();
  }, []);

  // Filtered Results
  const filteredResults = useMemo(() => {
    if (!searchResults) return [];
    return searchResults.filter(item => {
      const type = item.type || (item.train_name ? 'Train' : 'Train');
      if (!selectedTransport.includes(type)) return false;

      const itemPrice = item.price || (item.fares ? Math.min(...Object.values(item.fares)) : 800);
      if (itemPrice > priceMax) return false;

      if (selectedClasses.length > 0) {
        const itemFares = item.fares ? Object.keys(item.fares) : [];
        const itemClasses = (item.classes || []).map(c => typeof c === 'string' ? c.split('-')[0].trim() : c);
        const allClasses = [...new Set([...itemFares, ...itemClasses])];
        const hasMatchingClass = selectedClasses.some(c => allClasses.includes(c));
        if (!hasMatchingClass) return false;
      }

      return true;
    });
  }, [searchResults, selectedTransport, priceMax, selectedClasses]);

  // Sorted Results
  const sortedResults = useMemo(() => {
    if (!filteredResults) return [];
    const list = [...filteredResults];

    const parseDurationMins = (durStr) => {
      if (!durStr) return 9999;
      const hMatch = durStr.match(/(\d+)\s*h/);
      const mMatch = durStr.match(/(\d+)\s*m/);
      const h = hMatch ? parseInt(hMatch[1]) : 0;
      const m = mMatch ? parseInt(mMatch[1]) : 0;
      return h * 60 + m;
    };

    const parseTimeToMins = (timeStr) => {
      if (!timeStr) return 9999;
      const clean = timeStr.replace(/(AM|PM)/i, '').trim();
      const parts = clean.split(':');
      let h = parseInt(parts[0]) || 0;
      const m = parseInt(parts[1]) || 0;
      if (/PM/i.test(timeStr) && h < 12) h += 12;
      if (/AM/i.test(timeStr) && h === 12) h = 0;
      return h * 60 + m;
    };

    if (sortBy === 'cheapest') {
      return list.sort((a, b) => {
        const priceA = a.price || (a.fares ? Math.min(...Object.values(a.fares)) : 9999);
        const priceB = b.price || (b.fares ? Math.min(...Object.values(b.fares)) : 9999);
        return priceA - priceB;
      });
    }

    if (sortBy === 'fastest') {
      return list.sort((a, b) => {
        return parseDurationMins(a.dur || a.duration) - parseDurationMins(b.dur || b.duration);
      });
    }

    if (sortBy === 'earliest') {
      return list.sort((a, b) => {
        const timeA = a.depTime || a.departure_time || a.source_departure;
        const timeB = b.depTime || b.departure_time || b.source_departure;
        return parseTimeToMins(timeA) - parseTimeToMins(timeB);
      });
    }

    // Default 'recommended': Direct routes first, then verified trains, then fastest
    return list.sort((a, b) => {
      const aIsConn = a.route_type === 'Connecting' || a.direct === false;
      const bIsConn = b.route_type === 'Connecting' || b.direct === false;
      if (aIsConn !== bIsConn) return aIsConn ? 1 : -1;
      return parseDurationMins(a.dur || a.duration) - parseDurationMins(b.dur || b.duration);
    });
  }, [filteredResults, sortBy]);

  // Separate direct vs connecting alternatives
  const directRoutes = useMemo(() => {
    return sortedResults.filter(r => r.route_type !== 'Connecting' && r.direct !== false);
  }, [sortedResults]);

  const alternativeRoutes = useMemo(() => {
    return sortedResults.filter(r => r.route_type === 'Connecting' || r.direct === false);
  }, [sortedResults]);

  return (
    <div className="w-full bg-[#F7F8FA] dark:bg-[#121B24] text-[#202A32] dark:text-[#F8FAFC] pb-20 transition-colors">
      
      {/* ====================================================================
          SEARCH SUMMARY BAR (Sticky & Editable)
          ==================================================================== */}
      <div className="bg-white dark:bg-[#18222D] border-b border-[#E3E7EA] dark:border-slate-800 py-3.5 px-4 sm:px-6 lg:px-8 shadow-2xs">
        <div className="max-w-[1550px] w-full mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          <div className="flex items-center gap-4 flex-wrap">
            {/* Origin -> Destination Route Badge */}
            <div className="flex items-center gap-2 font-bold text-base text-[#202A32] dark:text-white font-heading">
              <span className="text-[#244C66] dark:text-[#7DA4BF]">{getStationName(source)}</span>
              <span className="text-[#89939B]">→</span>
              <span className="text-[#202A32] dark:text-white">{getStationName(dest)}</span>
            </div>
            
            <div className="h-4 w-px bg-[#E3E7EA] dark:bg-slate-700 hidden sm:block" />
            
            <div className="flex items-center gap-3.5 text-xs font-semibold text-[#66737D] dark:text-slate-400">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#244C66]" />
                <span>{date ? new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Tomorrow'}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-[#89939B]" />
                <span>{passengers} Traveler{passengers > 1 ? 's' : ''}</span>
              </span>
              {routeMetadata?.distanceKm && (
                <span className="hidden lg:inline text-[#89939B] font-mono text-[11px]">
                  • Approx. {routeMetadata.distanceKm} km
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEditingSearch(!isEditingSearch)}
              className="px-3.5 py-1.5 rounded-lg border border-[#E3E7EA] dark:border-slate-700 bg-[#F7F8FA] dark:bg-slate-800 text-[#202A32] dark:text-slate-200 hover:border-[#244C66] text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
            >
              <Edit3 className="w-3.5 h-3.5 text-[#244C66]" />
              <span>{isEditingSearch ? 'Close Edit' : 'Modify Search'}</span>
            </button>
          </div>

        </div>

        {/* Collapsible Edit Search Form */}
        <AnimatePresence>
          {isEditingSearch && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="max-w-[1550px] w-full mx-auto mt-4 pt-4 border-t border-[#E3E7EA] dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center overflow-hidden"
            >
              <div className="lg:col-span-3">
                <label className="text-[10px] font-bold text-[#66737D] uppercase tracking-wider block mb-1">From</label>
                <StationAutocomplete value={source} onChange={setSource} placeholder="Departure station" />
              </div>

              <div className="lg:col-span-1 flex justify-center pt-3 lg:pt-4">
                <button
                  type="button"
                  onClick={handleSwapStations}
                  className="w-9 h-9 rounded-full border border-[#E3E7EA] dark:border-slate-700 bg-[#F7F8FA] dark:bg-slate-800 hover:bg-[#EAF0F4] text-[#66737D] dark:text-slate-300 hover:text-[#244C66] flex items-center justify-center cursor-pointer transition-colors"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="lg:col-span-3">
                <label className="text-[10px] font-bold text-[#66737D] uppercase tracking-wider block mb-1">To</label>
                <StationAutocomplete value={dest} onChange={setDest} placeholder="Arrival station" />
              </div>

              <div className="lg:col-span-3">
                <label className="text-[10px] font-bold text-[#66737D] uppercase tracking-wider block mb-1">Departure Date</label>
                <input 
                  type="date" 
                  value={date} 
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setDate(e.target.value)} 
                  onClick={(e) => { try { e.currentTarget.showPicker(); } catch (err) {} }}
                  className="w-full h-11 px-3 rounded-lg border border-[#E3E7EA] dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-[#202A32] dark:text-white cursor-pointer" 
                />
              </div>

              <div className="lg:col-span-2 flex items-end pt-3 lg:pt-0">
                <button 
                  onClick={handleSearch} 
                  className="w-full h-11 rounded-lg bg-[#244C66] hover:bg-[#193B51] text-white font-bold text-xs cursor-pointer shadow-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Update Search</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ====================================================================
          TAB NAVIGATION (Route Comparison, Itinerary, Budget, Map, Hotels)
          ==================================================================== */}
      <div className="max-w-[1550px] w-full mx-auto px-4 sm:px-6 lg:px-8 mt-5">
        <div className="flex items-center justify-between border-b border-[#E3E7EA] dark:border-slate-800 overflow-x-auto scrollbar-none pb-0.5">
          <div className="flex items-center gap-6 sm:gap-8 shrink-0">
            {[
              { id: 'results', label: 'Route Comparison', count: sortedResults.length },
              { id: 'hotels', label: 'Hotels & Stays' },
              { id: 'budget', label: 'Budget Planner' },
              { id: 'itinerary', label: 'Trip Itinerary' },
              { id: 'map', label: 'Route Map' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-3 text-xs sm:text-sm font-semibold transition-all border-b-2 cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === tab.id
                    ? 'border-[#244C66] text-[#244C66] dark:text-[#7DA4BF] font-bold'
                    : 'border-transparent text-[#66737D] hover:text-[#202A32] dark:hover:text-white'
                }`}
              >
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                    activeTab === tab.id 
                      ? 'bg-[#EAF0F4] dark:bg-[#244C66]/30 text-[#244C66] dark:text-[#A8C7DB]' 
                      : 'bg-[#EEF2F4] dark:bg-slate-800 text-[#66737D]'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          <Link
            to="/dashboard/ai-workspace"
            className="hidden sm:flex items-center gap-1.5 pb-3 text-xs font-bold text-[#66737D] hover:text-[#244C66] transition-colors shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#244C66]" />
            <span>AI Workspace & Predictions →</span>
          </Link>
        </div>
      </div>

      {/* ====================================================================
          MAIN TAB CONTENT
          ==================================================================== */}
      <div className="max-w-[1550px] w-full mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        
        {/* RESULTS TAB */}
        {activeTab === 'results' && (
          <div className="flex flex-col lg:flex-row gap-6 items-start">
            
            {/* DESKTOP SIDEBAR FILTERS (Visible on lg screens) */}
            <aside className="hidden lg:block w-72 shrink-0 sticky top-24">
              <FilterPanel 
                selectedTransport={selectedTransport}
                onToggleTransport={toggleTransport}
                priceMax={priceMax}
                onPriceMaxChange={setPriceMax}
                selectedStops={selectedStops}
                onToggleStop={toggleStop}
                selectedClasses={selectedClasses}
                onToggleClass={toggleClass}
                onReset={resetFilters}
              />
            </aside>

            {/* MOBILE FILTER DRAWER */}
            <AnimatePresence>
              {isFilterOpen && (
                <>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setIsFilterOpen(false)}
                    className="lg:hidden fixed inset-0 bg-black/40 z-50 backdrop-blur-2xs"
                  />
                  <motion.div
                    initial={{ x: '100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '100%' }}
                    transition={{ duration: 0.25 }}
                    className="lg:hidden fixed right-0 top-0 bottom-0 w-80 bg-white dark:bg-[#18222D] border-l border-[#E3E7EA] dark:border-slate-800 z-50 p-5 overflow-y-auto shadow-2xl space-y-4"
                  >
                    <div className="flex items-center justify-between pb-3 border-b border-[#E3E7EA] dark:border-slate-800">
                      <h3 className="font-bold text-base text-[#202A32] dark:text-white font-heading">
                        Filter Results
                      </h3>
                      <button onClick={() => setIsFilterOpen(false)} className="p-1 text-[#89939B] hover:text-[#202A32]">
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <FilterPanel 
                      selectedTransport={selectedTransport}
                      onToggleTransport={toggleTransport}
                      priceMax={priceMax}
                      onPriceMaxChange={setPriceMax}
                      selectedStops={selectedStops}
                      onToggleStop={toggleStop}
                      selectedClasses={selectedClasses}
                      onToggleClass={toggleClass}
                      onReset={resetFilters}
                      hideHeader={true}
                    />

                    <div className="pt-4 border-t border-[#E3E7EA] dark:border-slate-800">
                      <button
                        onClick={() => setIsFilterOpen(false)}
                        className="w-full btn-primary h-11 text-xs font-bold"
                      >
                        Apply Filters ({filteredResults?.length || 0})
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>

            {/* RESULTS LIST & TOOLBAR */}
            <main className="flex-1 min-w-0 w-full space-y-5">
              
              {/* SORTING & TOOLBAR BAR */}
              <div className="bg-white dark:bg-[#18222D] p-3 sm:p-4 rounded-xl border border-[#E3E7EA] dark:border-slate-800 shadow-2xs flex flex-wrap items-center justify-between gap-3">
                
                {/* Mobile Filter Button */}
                <button
                  onClick={() => setIsFilterOpen(true)}
                  className="lg:hidden h-9 px-3 rounded-lg border border-[#E3E7EA] dark:border-slate-700 bg-[#F7F8FA] dark:bg-slate-800 text-xs font-bold text-[#202A32] dark:text-slate-200 flex items-center gap-1.5"
                >
                  <Filter className="w-3.5 h-3.5 text-[#244C66]" />
                  <span>Filters {activeFilterCount > 0 ? `(${activeFilterCount})` : ''}</span>
                </button>

                {/* Sorting Controls */}
                <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto scrollbar-none">
                  <span className="text-xs font-bold text-[#89939B] mr-1 hidden sm:inline">Sort By:</span>
                  {[
                    { id: 'recommended', label: 'Recommended' },
                    { id: 'cheapest', label: 'Cheapest' },
                    { id: 'fastest', label: 'Fastest' },
                    { id: 'earliest', label: 'Earliest Departure' }
                  ].map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setSortBy(s.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                        sortBy === s.id
                          ? 'bg-[#244C66] text-white font-bold shadow-2xs'
                          : 'bg-[#EEF2F4] dark:bg-slate-800 text-[#202A32] dark:text-slate-300 hover:bg-[#EAF0F4] dark:hover:bg-slate-700'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>

                <div className="text-xs text-[#66737D] font-medium ml-auto">
                  Showing <strong className="text-[#202A32] dark:text-white">{sortedResults.length}</strong> available options
                </div>
              </div>

              {/* LOADING SKELETON */}
              {loading && (
                <div className="space-y-4">
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="bg-white dark:bg-[#18222D] rounded-xl p-6 border border-[#E3E7EA] dark:border-slate-800 animate-pulse space-y-4">
                      <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/4" />
                      <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-3/4" />
                    </div>
                  ))}
                </div>
              )}

              {/* EMPTY RESULTS STATE */}
              {!loading && sortedResults.length === 0 && (
                <div className="bg-white dark:bg-[#18222D] rounded-xl p-10 border border-[#E3E7EA] dark:border-slate-800 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-[#EEF2F4] dark:bg-slate-800 text-[#66737D] mx-auto flex items-center justify-center">
                    <Compass className="w-6 h-6 text-[#244C66]" />
                  </div>
                  <h3 className="font-bold text-base text-[#202A32] dark:text-white">No routes match current filters</h3>
                  <p className="text-xs text-[#66737D] max-w-md mx-auto">
                    Try adjusting your maximum price slider, enabling additional transport modes (Train, Flight, Bus), or clearing travel classes.
                  </p>
                  <button onClick={resetFilters} className="text-xs font-bold text-[#244C66] hover:underline cursor-pointer">
                    Reset All Filters
                  </button>
                </div>
              )}

              {/* DIRECT JOURNEY RESULTS LIST */}
              {!loading && directRoutes.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500 px-1">
                    <span>Direct Travel Options</span>
                    <span className="text-[11px] font-normal text-slate-400">Verified schedules & fares</span>
                  </div>

                  {directRoutes.map((item) => {
                    const isTrain = item.type === 'Train' || item.train_name;
                    const isFlight = item.type === 'Flight';
                    const isBus = item.type === 'Bus';
                    const title = item.name || item.train_name || 'Express Service';
                    const number = item.number || item.train_number || '--';
                    const dep = item.depTime || item.departure_time || item.source_departure || '--:--';
                    const arr = item.arrTime || item.arrival_time || item.dest_arrival || '--:--';
                    const dur = item.dur || item.duration || '--';
                    const price = (item.price !== null && item.price !== undefined) 
                      ? item.price 
                      : (item.fares && Object.keys(item.fares).length > 0 ? Math.min(...Object.values(item.fares)) : null);
                    const depStn = item.depStation || getStationName(source);
                    const arrStn = item.arrStation || getStationName(dest);
                    const runningDays = item.running_days || item.frequency || 'Daily (7 days/week)';

                    return (
                      <div 
                        key={item.id}
                        className="bg-white dark:bg-[#0E1726] rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs hover:shadow-md transition-shadow relative overflow-hidden"
                      >
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                          
                          {/* Transport Operator Header */}
                          <div className="flex items-center gap-3.5 min-w-[210px] shrink-0">
                            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                              isFlight 
                                ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400' 
                                : isBus 
                                ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400' 
                                : 'bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400'
                            }`}>
                              {isFlight ? <Plane className="w-5 h-5" /> : isBus ? <Bus className="w-5 h-5" /> : <Train className="w-5 h-5" />}
                            </div>

                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-bold uppercase px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                  {item.type || 'Train'}
                                </span>
                                {item.verification_status === 'provider_verified' || item.source_verified === true ? (
                                  <span className="text-[9px] font-bold text-teal-600 dark:text-teal-400 flex items-center gap-0.5 bg-teal-50 dark:bg-teal-950/60 px-1.5 py-0.5 rounded">
                                    <CheckCircle2 className="w-2.5 h-2.5" /> Verified
                                  </span>
                                ) : item.verification_status === 'static_reference' || item.verification_status === 'reference_timetable' ? (
                                  <span className="text-[9px] font-bold text-blue-600 dark:text-blue-400 flex items-center gap-0.5 bg-blue-50 dark:bg-blue-950/60 px-1.5 py-0.5 rounded">
                                    <ShieldCheck className="w-2.5 h-2.5" /> Timetable
                                  </span>
                                ) : (
                                  <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-0.5 bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.5 rounded">
                                    <AlertCircle className="w-2.5 h-2.5" /> Unverified
                                  </span>
                                )}
                              </div>
                              <h4 className="font-bold text-base text-slate-900 dark:text-white font-heading truncate">
                                {title}
                              </h4>
                              <p className="text-xs text-slate-400 font-mono">
                                #{number} • {runningDays}
                              </p>
                            </div>
                          </div>

                          {/* Timings, Route Line & Duration */}
                          <div className="flex items-center justify-between sm:justify-center gap-6 sm:gap-10 flex-1 min-w-0">
                            
                            {/* Origin */}
                            <div className="text-left sm:text-right min-w-[90px]">
                              <p className="font-extrabold text-lg text-slate-900 dark:text-white font-heading">{dep}</p>
                              <p className="text-xs text-slate-500 truncate max-w-[140px]" title={depStn}>{depStn}</p>
                            </div>

                            {/* Middle Route Diagram */}
                            <div className="flex flex-col items-center shrink-0">
                              <span className="text-xs text-slate-500 font-semibold">{dur}</span>
                              <div className="w-20 sm:w-28 h-px bg-slate-300 dark:bg-slate-700 my-1 relative">
                                <div className="w-1.5 h-1.5 rounded-full bg-teal-600 absolute -top-0.5 left-0" />
                                <div className="w-1.5 h-1.5 rounded-full bg-teal-600 absolute -top-0.5 right-0" />
                              </div>
                              <span className="text-[10px] text-teal-600 font-bold">Non-stop Direct</span>
                            </div>

                            {/* Destination */}
                            <div className="text-right sm:text-left min-w-[90px]">
                              <p className="font-extrabold text-lg text-slate-900 dark:text-white font-heading">{arr}</p>
                              <p className="text-xs text-slate-500 truncate max-w-[140px]" title={arrStn}>{arrStn}</p>
                            </div>

                          </div>

                          {/* Price & Action */}
                          <div className="flex items-center justify-between lg:justify-end gap-5 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100 dark:border-slate-800">
                            <div className="text-left lg:text-right">
                              {price !== null ? (
                                <>
                                  <p className="text-xl font-extrabold text-slate-900 dark:text-white font-heading">
                                    ₹{price.toLocaleString('en-IN')}
                                  </p>
                                  <p className="text-[10px] text-slate-400">
                                    {item.fare_type === 'estimated_distance_rule' ? 'est. distance fare' : 'per traveler'}
                                  </p>
                                </>
                              ) : (
                                <div className="text-left lg:text-right">
                                  <p className="text-xs font-bold text-amber-600 dark:text-amber-400">
                                    Fare unavailable
                                  </p>
                                  <p className="text-[10px] text-slate-400">Check at station / IRCTC</p>
                                </div>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setDetailModalItem(item)}
                                className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:border-teal-500 transition-colors cursor-pointer"
                              >
                                View Details
                              </button>
                              <button
                                onClick={() => setSelectedTrainForBooking(item)}
                                className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                              >
                                Book Now
                              </button>
                            </div>
                          </div>

                        </div>

                        {/* Train Classes Fare Chips (Clickable) */}
                        {item.fares && Object.keys(item.fares).length > 0 && (
                          <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-2 flex-wrap">
                            <span className="text-[11px] font-bold text-slate-400">Fares:</span>
                            {Object.entries(item.fares).map(([code, fareVal]) => (
                              <button
                                key={code}
                                onClick={() => setSelectedTrainForBooking(item)}
                                className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:border-teal-500 text-xs font-medium text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                              >
                                <strong className="text-slate-900 dark:text-white">{code}</strong>: ₹{fareVal}
                              </button>
                            ))}
                          </div>
                        )}

                      </div>
                    );
                  })}
                </div>
              )}

              {/* ================================================================
                  SECTION 6: INTELLIGENT ALTERNATIVE ROUTES
                  "Smart Alternatives for Your Journey"
                  ================================================================ */}
              {!loading && alternativeRoutes.length > 0 && (
                <div className="mt-8 pt-6 border-t-2 border-teal-500/30 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 text-[11px] font-bold uppercase mb-1">
                        <Sparkles className="w-3 h-3 text-teal-500" />
                        <span>TravelIQ Route Intelligence</span>
                      </div>
                      <h3 className="text-lg sm:text-xl font-bold font-heading text-slate-900 dark:text-white">
                        Smart Alternatives for Your Journey
                      </h3>
                      <p className="text-xs text-slate-500">
                        Reliable connecting routes via verified interchange stations when direct journeys are sold out.
                      </p>
                    </div>

                    <span className="text-xs font-bold text-teal-600 bg-teal-50 dark:bg-teal-950/60 px-3 py-1 rounded-full self-start sm:self-auto">
                      {alternativeRoutes.length} Verified Connecting Option{alternativeRoutes.length > 1 ? 's' : ''}
                    </span>
                  </div>

                  {/* Alternative Route Cards */}
                  <div className="space-y-4">
                    {alternativeRoutes.map((conn) => {
                      const transferStation = conn.transfer_station || 'Interchange Hub';
                      const layover = conn.layover || 'Connection Window';
                      const totalDur = conn.duration || '--';
                      const combinedFare = (conn.price !== null && conn.price !== undefined) ? conn.price : null;
                      const legs = conn.legs || [];

                      return (
                        <div 
                          key={conn.id}
                          className="bg-white dark:bg-[#0E1726] rounded-2xl border-2 border-teal-500/40 p-5 shadow-sm space-y-4"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                            <div>
                              <span className="text-xs font-bold text-teal-600 dark:text-teal-400">
                                Connecting Route via {transferStation}
                              </span>
                              <h4 className="text-base font-bold text-slate-900 dark:text-white font-heading">
                                {conn.company || `${getStationName(source)} → ${transferStation} → ${getStationName(dest)}`}
                              </h4>
                            </div>

                            <div className="text-right">
                              {combinedFare !== null ? (
                                <>
                                  <span className="text-lg font-black text-slate-900 dark:text-white font-mono">
                                    ₹{combinedFare.toLocaleString('en-IN')}
                                  </span>
                                  <span className="text-[10px] text-slate-400 block">Combined Total Fare</span>
                                </>
                              ) : (
                                <>
                                  <span className="text-sm font-bold text-amber-600 dark:text-amber-400 block">
                                    Fare unavailable
                                  </span>
                                  <span className="text-[10px] text-slate-400 block">Book separate legs</span>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Legs Progression Timeline */}
                          <div className="space-y-2">
                            {legs.map((leg, legIdx) => {
                              if (leg.type === 'Layover') {
                                return (
                                  <div key={legIdx} className="flex items-center gap-2.5 py-1.5 px-3 rounded-xl bg-teal-50/80 dark:bg-teal-950/40 text-teal-800 dark:text-teal-300 text-xs font-semibold">
                                    <Clock className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                                    <span>Layover at {leg.station}: {leg.duration}</span>
                                    <span className="text-[11px] text-teal-600/80 ml-auto hidden sm:inline">Comfortable transfer buffer</span>
                                  </div>
                                );
                              }

                              return (
                                <div key={legIdx} className="p-3 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between text-xs">
                                  <div className="flex items-center gap-3">
                                    <div className="w-7 h-7 rounded-lg bg-white dark:bg-slate-700 text-teal-600 flex items-center justify-center font-bold text-xs shrink-0">
                                      {legIdx === 0 ? '1' : '2'}
                                    </div>
                                    <div>
                                      <p className="font-bold text-slate-900 dark:text-white">{leg.train_name || leg.type}</p>
                                      <p className="text-[11px] text-slate-500">{leg.from} → {leg.to}</p>
                                    </div>
                                  </div>

                                  <div className="text-right">
                                    <span className="font-bold text-slate-800 dark:text-slate-200">{leg.departure} – {leg.arrival}</span>
                                    <span className="text-[10px] text-emerald-600 block font-semibold">Seats Available</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* Alternative Action & Notes */}
                          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                            <div className="flex items-center gap-1.5 text-slate-500">
                              <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>Separate tickets required for each journey leg.</span>
                            </div>

                            <button
                              onClick={() => setSelectedTrainForBooking(conn)}
                              className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold transition-colors cursor-pointer self-end sm:self-auto"
                            >
                              Select Alternative Journey
                            </button>
                          </div>

                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

            </main>

          </div>
        )}

        {/* HOTELS & STAYS TAB */}
        {activeTab === 'hotels' && (
          <div className="max-w-7xl mx-auto">
            <HotelRecommendations destination={getStationName(dest) || 'Goa'} />
          </div>
        )}

        {/* BUDGET PLANNER TAB */}
        {activeTab === 'budget' && (
          <div className="max-w-4xl mx-auto">
            <TravelBudgetPlanner 
              initialBudget={15000} 
              destination={getStationName(dest) || 'Varanasi'} 
            />
          </div>
        )}

        {/* TRIP ITINERARY TAB */}
        {activeTab === 'itinerary' && (
          <div className="max-w-4xl mx-auto">
            <TripPlanner />
          </div>
        )}

        {/* MAP VIEW TAB */}
        {activeTab === 'map' && (
          <div className="bg-white dark:bg-[#0E1726] rounded-2xl border border-slate-200 dark:border-slate-800 p-4 h-[550px] shadow-sm overflow-hidden">
            <GoogleMapComponent source={source} dest={dest} />
          </div>
        )}

      </div>

      {/* ====================================================================
          JOURNEY DETAILS MODAL
          ==================================================================== */}
      {detailModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-2xs">
          <div className="bg-white dark:bg-[#0E1726] rounded-2xl max-w-xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-[10px] font-bold uppercase text-teal-600">{detailModalItem.type || 'Train'}</span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white font-heading">
                  {detailModalItem.name || detailModalItem.train_name} (#{detailModalItem.number || detailModalItem.train_number})
                </h3>
              </div>
              <button onClick={() => setDetailModalItem(null)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Schedule Overview */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between text-xs">
              <div>
                <p className="font-bold text-slate-900 dark:text-white text-sm">{detailModalItem.depTime || detailModalItem.source_departure || '06:00 AM'}</p>
                <p className="text-slate-500">{detailModalItem.depStation || getStationName(source)}</p>
              </div>
              <div className="text-center">
                <span className="text-[11px] font-bold text-teal-600">{detailModalItem.dur || detailModalItem.duration || '--'}</span>
                <p className="text-[10px] text-slate-400">Direct Route</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-slate-900 dark:text-white text-sm">{detailModalItem.arrTime || detailModalItem.dest_arrival || '--:--'}</p>
                <p className="text-slate-500">{detailModalItem.arrStation || getStationName(dest)}</p>
              </div>
            </div>

            {/* Service Timings & Schedule */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase text-slate-500">Service Timings & Schedule</h4>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40">
                  <span>Departure from {detailModalItem.depStation || 'Origin'}</span>
                  <span className="font-bold">{detailModalItem.depTime || '--:--'}</span>
                </div>
                <div className="flex justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40">
                  <span>Arrival at {detailModalItem.arrStation || 'Destination'}</span>
                  <span className="font-bold">{detailModalItem.arrTime || '--:--'}</span>
                </div>
                <div className="flex justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40">
                  <span>Operating Days</span>
                  <span className="font-semibold text-slate-600 dark:text-slate-300">{detailModalItem.running_days || detailModalItem.frequency || 'Daily'}</span>
                </div>
              </div>
            </div>

            {/* Fares & Booking Action */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 block">Starting Fare</span>
                <span className="text-lg font-bold text-slate-900 dark:text-white font-mono">
                  {(detailModalItem.price !== null && detailModalItem.price !== undefined)
                    ? `₹${detailModalItem.price.toLocaleString('en-IN')}`
                    : (detailModalItem.fares && Object.keys(detailModalItem.fares).length > 0
                        ? `₹${Math.min(...Object.values(detailModalItem.fares)).toLocaleString('en-IN')}`
                        : 'Unavailable at source')}
                </span>
              </div>
              <button
                onClick={() => {
                  const trainToBook = detailModalItem;
                  setDetailModalItem(null);
                  setSelectedTrainForBooking(trainToBook);
                }}
                className="btn-primary h-10 px-5 text-xs font-bold"
              >
                Proceed to Book
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          BOOKING MODAL (Existing Integration Preserved)
          ==================================================================== */}
      {selectedTrainForBooking && (
        <BookingModal 
          train={selectedTrainForBooking} 
          onClose={() => setSelectedTrainForBooking(null)} 
        />
      )}

    </div>
  );
}
