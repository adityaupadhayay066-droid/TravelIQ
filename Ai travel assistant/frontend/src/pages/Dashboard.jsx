import React, { useState, useEffect, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Search, Calendar, Users, Edit3, Train, Plane, Bus, Sparkles, Sliders
} from 'lucide-react';
import StationAutocomplete from '../components/StationAutocomplete';
import PassengerSelector from '../components/PassengerSelector';
import FilterPanel from '../components/FilterPanel';
import GoogleMapComponent from '../components/GoogleMap';
import TripPlanner from '../components/TripPlanner';
import HotelRecommendations from '../components/HotelRecommendations';
import BookingModal from '../components/BookingModal';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import toast from 'react-hot-toast';

import TravelBudgetPlanner from '../components/TravelBudgetPlanner';

export default function Dashboard() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [source, setSource] = useState(location.state?.source || { station_name: 'Delhi', station_code: 'NDLS' });
  const [dest, setDest] = useState(location.state?.dest || { station_name: 'Mumbai', station_code: 'CSTM' });
  const [date, setDate] = useState(location.state?.departureDate || '2026-09-18');
  const [passengers, setPassengers] = useState(location.state?.passengers || 1);

  const [activeTab, setActiveTab] = useState(location.state?.openCompare ? 'results' : 'results'); // 'results', 'itinerary', 'budget', 'map', 'hotels'
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState(null);
  const [routeMetadata, setRouteMetadata] = useState(null);
  const [selectedTrainForBooking, setSelectedTrainForBooking] = useState(null);
  const [expandedResultId, setExpandedResultId] = useState(null);
  const [isEditingSearch, setIsEditingSearch] = useState(false);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Filter States
  const [selectedTransport, setSelectedTransport] = useState(['Train', 'Flight', 'Bus']);
  const [priceMax, setPriceMax] = useState(15000);
  const [selectedStops, setSelectedStops] = useState(['Non-stop', '1 Stop', '2+ Stops']);
  const [selectedClasses, setSelectedClasses] = useState([]);

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
      console.error(e);
      toast.error('Could not fetch search results');
      setSearchResults([]);
    } finally {
      setLoading(false);
      setIsEditingSearch(false);
    }
  };

  const filteredResults = useMemo(() => {
    if (!searchResults) return [];
    return searchResults.filter(item => {
      const type = item.type || (item.train_name ? 'Train' : 'Train');
      if (!selectedTransport.includes(type)) return false;

      const itemPrice = item.price || (item.fares ? Math.min(...Object.values(item.fares)) : 1000);
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

  useEffect(() => {
    handleSearch();
  }, []);

  return (
    <div className="w-full bg-[#F7F5EF] dark:bg-[#101B17] text-[#1F2933] dark:text-[#F7F5EF] pb-16 transition-colors">
      
      {/* SEARCH SUMMARY BAR */}
      <div className="bg-white dark:bg-[#172722] border-b border-[#E3DED2] dark:border-[#273E36] py-3.5 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1550px] w-full mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2 font-bold text-base text-[#14532D] dark:text-white font-heading truncate max-w-[280px] sm:max-w-none">
              <span>{getStationName(source)}</span>
              <span className="text-[#64748B]">→</span>
              <span>{getStationName(dest)}</span>
            </div>
            
            <div className="h-4 w-px bg-[#E3DED2] dark:border-[#273E36] hidden sm:block" />
            
            <div className="flex items-center gap-4 text-xs font-semibold text-[#64748B] dark:text-[#94A3B8]">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-[#64748B]" />
                {date ? new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '18 Sep 2026'}
              </span>
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-[#64748B]" />
                {passengers} Traveler{passengers > 1 ? 's' : ''}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/dashboard/ai-workspace"
              className="px-3 py-1.5 rounded-lg border border-[#E3DED2] dark:border-[#273E36] bg-[#FFFDF7] dark:bg-[#101B17] text-[#14532D] dark:text-[#EEF2ED] hover:border-[#14532D] text-xs font-bold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
              title="Open AI Workspace"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#E58A3A]" />
              <span>AI Workspace</span>
            </Link>

            <button
              onClick={() => setIsEditingSearch(!isEditingSearch)}
              className="px-3 py-1.5 rounded-lg border border-[#E3DED2] dark:border-[#273E36] bg-[#FFFDF7] dark:bg-[#101B17] text-[#1F2933] dark:text-[#F7F5EF] hover:bg-[#EEF2ED] dark:hover:bg-[#1D322B] text-xs font-bold inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{isEditingSearch ? 'Close Edit' : 'Edit Search'}</span>
            </button>
          </div>

        </div>

        {/* Collapsible Edit Search Form */}
        {isEditingSearch && (
          <div className="max-w-[1550px] w-full mx-auto mt-4 pt-4 border-t border-[#E3DED2] dark:border-[#273E36] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="text-[10px] font-bold text-[#64748B] uppercase">From</label>
              <StationAutocomplete value={source} onChange={setSource} placeholder="From station" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-[#64748B] uppercase">To</label>
              <StationAutocomplete value={dest} onChange={setDest} placeholder="To station" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-[#64748B] uppercase">Date</label>
              <input 
                type="date" 
                value={date} 
                onChange={(e) => setDate(e.target.value)} 
                className="w-full h-10 px-3 rounded-lg border border-[#E3DED2] dark:border-[#273E36] bg-white dark:bg-[#101B17] text-xs font-bold text-[#1F2933] dark:text-[#F7F5EF]" 
              />
            </div>
            <div className="flex items-end">
              <button 
                onClick={handleSearch} 
                className="w-full h-10 rounded-lg bg-[#14532D] hover:bg-[#0F3F22] text-white font-bold text-xs cursor-pointer shadow-xs"
              >
                Update Search
              </button>
            </div>
          </div>
        )}
      </div>

      {/* NAVIGATION TABS */}
      <div className="max-w-[1550px] w-full mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="flex items-center justify-between gap-4 sm:gap-8 border-b border-[#E3DED2] dark:border-[#273E36] overflow-x-auto scrollbar-none pb-0.5">
          <div className="flex items-center gap-4 sm:gap-8 flex-shrink-0">
            {[
              { id: 'results', label: 'Route Comparison' },
              { id: 'itinerary', label: 'Trip Itinerary' },
              { id: 'budget', label: 'Budget Planner' },
              { id: 'map', label: 'Map View' },
              { id: 'hotels', label: 'Hotels & Stays' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-3 text-xs sm:text-sm font-semibold transition-colors border-b-2 cursor-pointer whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-[#14532D] dark:border-white text-[#14532D] dark:text-white font-bold'
                    : 'border-transparent text-[#64748B] dark:text-[#94A3B8] hover:text-[#14532D] dark:hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <Link
            to="/dashboard/ai-workspace"
            className="ml-auto pb-3 text-xs font-bold text-[#E58A3A] hover:underline flex items-center gap-1.5 transition-colors whitespace-nowrap flex-shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Copilot & Hub →</span>
          </Link>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="max-w-[1550px] w-full mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        
        {/* RESULTS TAB */}
        {activeTab === 'results' && (
          <div>
            {/* Mobile Filter Toggle Button */}
            <div className="lg:hidden mb-4 flex items-center justify-between">
              <button
                onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
                className="btn-secondary h-9 text-xs px-3 py-1.5 inline-flex items-center gap-2 rounded-lg"
              >
                <Sliders className="w-3.5 h-3.5 text-[#173F3A] dark:text-[#EEF2ED]" />
                <span>{isMobileFilterOpen ? 'Hide Filters' : 'Filters & Preferences'}</span>
              </button>
              {(selectedClasses.length > 0 || priceMax < 15000 || selectedTransport.length < 3) && (
                <button 
                  onClick={resetFilters}
                  className="text-xs font-bold text-[#D96C4F] hover:underline"
                >
                  Reset Filters
                </button>
              )}
            </div>

            {/* Mobile Collapsible Filter Panel */}
            {isMobileFilterOpen && (
              <div className="lg:hidden mb-5 travel-card p-4">
                <FilterPanel 
                  selectedTransport={selectedTransport}
                  onToggleTransport={toggleTransport}
                  priceMax={priceMax}
                  onPriceMaxChange={setPriceMax}
                  selectedStops={selectedStops}
                  onToggleStop={toggleStop}
                  selectedClasses={selectedClasses}
                  onToggleClass={toggleClass}
                  onReset={() => { resetFilters(); setIsMobileFilterOpen(false); }}
                />
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left: Desktop Filter Sidebar (3 Cols) */}
              <div className="lg:col-span-3 hidden lg:block sticky top-20">
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
              </div>

              {/* Right: Horizontal Travel Result Cards (9 Cols) */}
              <div className="lg:col-span-9 space-y-4">

              {/* Non-Airport Destination Guidance Banner */}
              {routeMetadata && routeMetadata.hasAirport && !routeMetadata.hasAirport.destination && (
                <div className="p-3.5 bg-[#EEF2ED] dark:bg-[#213530] border border-[#173F3A]/20 dark:border-[#EEF2ED]/20 rounded-xl text-xs text-[#173F3A] dark:text-[#EEF2ED] flex items-center gap-2.5">
                  <span className="text-base">ℹ️</span>
                  <div>
                    <span className="font-bold">No Commercial Airport at {getStationName(dest)}:</span> Flights are automatically omitted for this route. Direct and Superfast Trains / AC Buses are displayed below.
                  </div>
                </div>
              )}
              
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="travel-card p-5 animate-pulse space-y-3">
                      <div className="h-4 bg-[#EEF2ED] dark:bg-[#213530] rounded w-1/3" />
                      <div className="h-6 bg-[#EEF2ED] dark:bg-[#213530] rounded w-2/3" />
                    </div>
                  ))}
                </div>
              ) : !filteredResults || filteredResults.length === 0 ? (
                <div className="travel-card p-8 text-center text-[#66736F] space-y-2">
                  <p className="font-semibold text-sm">No travel options match your current filters.</p>
                  <button onClick={resetFilters} className="text-xs text-[#D96C4F] font-bold hover:underline cursor-pointer">
                    Clear filters to view all routes
                  </button>
                </div>
              ) : (
                filteredResults.map((item) => {
                  const isTrain = item.type === 'Train' || item.train_name;
                  const isFlight = item.type === 'Flight';
                  const title = item.name || item.train_name || 'Express Route';
                  const number = item.number || item.train_number || '12301';
                  const dep = item.depTime || item.dep || item.source_departure || '10:30 AM';
                  const arr = item.arrTime || item.arr || item.dest_arrival || '02:50 AM';
                  const dur = item.dur || '16h 20m';
                  const price = item.price || (item.fares ? Math.min(...Object.values(item.fares)) : 520);
                  const depStnName = item.depStation || getStationName(source);
                  const arrStnName = item.arrStation || getStationName(dest);

                  return (
                    <div 
                      key={item.id} 
                      className="travel-card p-4 sm:p-5"
                    >
                      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 sm:gap-6">
                        
                        {/* Transport Header */}
                        <div className="flex items-center gap-3.5 min-w-[200px] xl:w-[240px] flex-shrink-0">
                          <div className="w-10 h-10 rounded-xl bg-[#EEF2ED] dark:bg-[#213530] text-[#173F3A] dark:text-[#F7F5EF] flex items-center justify-center flex-shrink-0 border border-[#E3DED2] dark:border-[#2a403a]">
                            {isFlight ? <Plane className="w-5 h-5" /> : isTrain ? <Train className="w-5 h-5" /> : <Bus className="w-5 h-5" />}
                          </div>
                          <div className="min-w-0">
                            <span className="travel-badge text-[10px] font-bold uppercase mb-1">
                              {item.type || 'Train'}
                            </span>
                            <h4 className="font-bold text-base text-[#173F3A] dark:text-white font-heading truncate">
                              {title}
                            </h4>
                            <p className="text-xs text-[#66736F] font-mono">
                              #{number}
                            </p>
                          </div>
                        </div>

                        {/* Timings & Duration */}
                        <div className="flex items-center justify-between sm:justify-center gap-4 sm:gap-8 flex-1 min-w-0">
                          
                          <div className="text-left sm:text-right min-w-[85px]">
                            <span className="font-bold text-lg text-[#263238] dark:text-white block font-heading whitespace-nowrap">
                              {dep}
                            </span>
                            <span className="text-xs text-[#66736F] whitespace-nowrap block truncate max-w-[140px]" title={depStnName}>
                              {depStnName}
                            </span>
                          </div>

                          <div className="flex flex-col items-center flex-shrink-0">
                            <span className="text-xs text-[#66736F] font-medium whitespace-nowrap">{dur}</span>
                            <div className="w-16 sm:w-24 h-px bg-[#E3DED2] dark:bg-[#2a403a] my-1 relative">
                              <div className="w-1.5 h-1.5 rounded-full bg-[#173F3A] dark:bg-white absolute -top-0.5 left-0" />
                              <div className="w-1.5 h-1.5 rounded-full bg-[#173F3A] dark:bg-white absolute -top-0.5 right-0" />
                            </div>
                            <span className="text-[10px] text-[#66736F] whitespace-nowrap">Direct</span>
                          </div>

                          <div className="text-right sm:text-left min-w-[85px]">
                            <span className="font-bold text-lg text-[#263238] dark:text-white block font-heading whitespace-nowrap">
                              {arr}
                            </span>
                            <span className="text-xs text-[#66736F] whitespace-nowrap block truncate max-w-[140px]" title={arrStnName}>
                              {arrStnName}
                            </span>
                          </div>

                        </div>

                        {/* Price & Action Buttons */}
                        <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-6 flex-shrink-0 pt-3 xl:pt-0 border-t xl:border-t-0 border-[#E3DED2] dark:border-[#2a403a]">
                          <div className="text-left sm:text-right">
                            <span className="text-xl font-extrabold text-[#173F3A] dark:text-white font-heading whitespace-nowrap block">
                              ₹{typeof price === 'number' ? price.toLocaleString() : price}
                            </span>
                            <span className="text-[10px] text-[#66736F] block whitespace-nowrap">per traveler</span>
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0">
                            <button
                              onClick={() => setExpandedResultId(expandedResultId === item.id ? null : item.id)}
                              className="btn-secondary h-10 text-xs px-3"
                            >
                              View details
                            </button>
                            <button
                              onClick={() => setSelectedTrainForBooking(item)}
                              className="btn-primary h-10 text-xs px-4"
                            >
                              Select
                            </button>
                          </div>
                        </div>

                      </div>

                      {/* Expanded Classes & Details */}
                      {expandedResultId === item.id && (
                        <div className="mt-4 pt-4 border-t border-[#E3DED2] dark:border-[#2a403a] space-y-3 text-xs text-[#66736F]">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold text-[#173F3A] dark:text-white">Classes & Fares:</span>
                            {item.classes ? (
                              item.classes.map((cls, i) => (
                                <span key={i} className="px-3 py-1 rounded-md bg-[#EEF2ED] dark:bg-[#213530] text-[#173F3A] dark:text-white font-medium border border-[#E3DED2] dark:border-[#2a403a]">
                                  {cls}
                                </span>
                              ))
                            ) : (
                              <span>Standard Sleeper & AC options available</span>
                            )}
                          </div>
                        </div>
                      )}

                    </div>
                  );
                })
              )}

            </div>

          </div>
        </div>
        )}

        {/* ITINERARY TAB */}
        {activeTab === 'itinerary' && (
          <div className="max-w-4xl mx-auto">
            <TripPlanner />
          </div>
        )}

        {/* BUDGET PLANNER TAB */}
        {activeTab === 'budget' && (
          <div className="max-w-4xl mx-auto">
            <TravelBudgetPlanner initialBudget={15000} destination={getStationName(dest) || 'Manali'} />
          </div>
        )}

        {/* MAP TAB */}
        {activeTab === 'map' && (
          <div className="travel-card p-4 h-[550px]">
            <GoogleMapComponent source={source} dest={dest} />
          </div>
        )}

        {/* HOTELS TAB */}
        {activeTab === 'hotels' && (
          <HotelRecommendations destination={getStationName(dest)} />
        )}

      </div>

      {/* Booking Modal */}
      {selectedTrainForBooking && (
        <BookingModal 
          train={selectedTrainForBooking} 
          onClose={() => setSelectedTrainForBooking(null)} 
        />
      )}

    </div>
  );
}
