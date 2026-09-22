import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Search, MapPin, Calendar, DollarSign, Compass, 
  Sparkles, Star, ArrowRight, Filter, Palmtree, 
  Landmark, Footprints, Camera, Coffee, ChevronRight,
  TrendingUp, Award, Flame, Sun, Heart
} from 'lucide-react';
import { DESTINATIONS_CATALOG } from '../data/destinationsData';
import toast from 'react-hot-toast';

const CATEGORIES = [
  { id: 'all', label: 'All Destinations', icon: Compass },
  { id: 'heritage', label: 'Heritage & Forts', icon: Landmark },
  { id: 'beaches', label: 'Beaches & Coast', icon: Palmtree },
  { id: 'hillstation', label: 'Hills & Snow', icon: Footprints },
  { id: 'spiritual', label: 'Spiritual & Ghats', icon: Flame },
  { id: 'nature', label: 'Nature & Backwaters', icon: Sun },
  { id: 'metro', label: 'Metros & Culture', icon: Camera },
  { id: 'adventure', label: 'Adventure & Treks', icon: Sparkles }
];

const REGIONS = ['All India', 'North', 'South', 'West', 'East', 'Himalayas'];

export default function DestinationsDirectoryPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedRegion, setSelectedRegion] = useState('All India');
  const [durationFilter, setDurationFilter] = useState('all'); // 'all', 'short', 'medium', 'long'
  const [sortBy, setSortBy] = useState('popularity'); // 'popularity', 'budget_low', 'budget_high', 'name'
  const [favorites, setFavorites] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('fav_destinations') || '[]');
    } catch {
      return [];
    }
  });

  const toggleFavorite = (id, e) => {
    e.stopPropagation();
    e.preventDefault();
    setFavorites(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      localStorage.setItem('fav_destinations', JSON.stringify(next));
      toast.success(prev.includes(id) ? 'Removed from favorites' : 'Saved to wishlist!');
      return next;
    });
  };

  const filteredDestinations = useMemo(() => {
    return DESTINATIONS_CATALOG.filter(item => {
      // Search match
      const q = searchQuery.toLowerCase().trim();
      const matchSearch = !q || 
        item.name.toLowerCase().includes(q) || 
        item.state.toLowerCase().includes(q) || 
        item.tagline.toLowerCase().includes(q) || 
        item.tags.some(t => t.toLowerCase().includes(q));

      // Category match
      const matchCategory = selectedCategory === 'all' || item.category === selectedCategory;

      // Region match
      const matchRegion = selectedRegion === 'All India' || item.region === selectedRegion;

      // Duration match
      let matchDuration = true;
      if (durationFilter === 'short') matchDuration = item.idealDays.includes('1') || item.idealDays.includes('2');
      if (durationFilter === 'medium') matchDuration = item.idealDays.includes('3') || item.idealDays.includes('4');
      if (durationFilter === 'long') matchDuration = item.idealDays.includes('5') || item.idealDays.includes('6') || item.idealDays.includes('7');

      return matchSearch && matchCategory && matchRegion && matchDuration;
    }).sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'budget_low') {
        const costA = parseInt(a.avgBudget.replace(/[^0-9]/g, '').slice(0, 4) || '2000');
        const costB = parseInt(b.avgBudget.replace(/[^0-9]/g, '').slice(0, 4) || '2000');
        return costA - costB;
      }
      return b.rating - a.rating;
    });
  }, [searchQuery, selectedCategory, selectedRegion, durationFilter, sortBy]);

  // AI Random Pick
  const handleLuckyPick = () => {
    const randomItem = DESTINATIONS_CATALOG[Math.floor(Math.random() * DESTINATIONS_CATALOG.length)];
    navigate(`/destinations/${randomItem.id}#trip-planner-section`);
    toast.success(`Planning your getaway to ${randomItem.name}!`);
  };

  return (
    <div className="min-h-screen bg-[#F7F5EF] dark:bg-[#101B17] text-[#1F2933] dark:text-[#F7F5EF] transition-colors pb-20">
      
      {/* Hero Header Section */}
      <div className="relative bg-[#14532D] text-white py-16 px-4 sm:px-6 lg:px-8 overflow-hidden shadow-inner">
        {/* Background subtle accents */}
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-[#E58A3A]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-96 h-96 bg-[#2F7D32]/25 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto space-y-6 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold text-[#F7F5EF]">
            <Sparkles className="w-3.5 h-3.5 text-[#E58A3A]" />
            <span>Discover India • Curated Cities & Tourist Destinations</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold font-heading tracking-tight text-white max-w-4xl mx-auto leading-tight">
            Explore Top Tourist Places & Cities in India
          </h1>
          
          <p className="text-sm sm:text-base text-white/80 max-w-2xl mx-auto leading-relaxed">
            From majestic Himalayan peaks and royal Rajasthani forts to tranquil Kerala backwaters and vibrant coastal cities — pick any destination to build your personalized day-by-day holiday plan.
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto pt-2">
            <div className="relative flex items-center bg-white dark:bg-[#172722] rounded-2xl shadow-xl p-1.5 border border-white/20">
              <Search className="w-5 h-5 text-[#64748B] ml-3 shrink-0" />
              <input
                type="text"
                placeholder="Search by city (e.g. Goa, Jaipur, Varanasi), state, or holiday vibe..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent px-3 py-2.5 text-xs sm:text-sm text-[#1F2933] dark:text-white placeholder-[#64748B] outline-none"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')} 
                  className="text-xs text-[#64748B] hover:text-black dark:hover:text-white px-2 cursor-pointer"
                >
                  Clear
                </button>
              )}
              <button
                onClick={handleLuckyPick}
                className="px-4 h-10 rounded-xl bg-[#E58A3A] hover:bg-[#D4782A] text-white text-xs font-bold inline-flex items-center gap-1.5 shrink-0 whitespace-nowrap cursor-pointer transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Surprise Me</span>
              </button>
            </div>
          </div>

          {/* Quick Stats Pill */}
          <div className="flex items-center justify-center gap-6 pt-2 text-xs text-white/70 flex-wrap">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#E58A3A]" /> {DESTINATIONS_CATALOG.length}+ Top Tourist Cities
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#2F7D32]" /> Custom Day Itineraries
            </span>
            <span className="flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-[#2F80A8]" /> 100+ Curated Activities
            </span>
          </div>

        </div>
      </div>

      {/* Navigation Filters & Controls */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
        
        {/* Category Icons Carousel */}
        <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-none">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all border ${
                  isSelected
                    ? 'bg-[#173F3A] text-white border-[#173F3A] dark:bg-[#4F7D62] dark:border-[#4F7D62] shadow-md scale-[1.02]'
                    : 'bg-[var(--color-surface)] text-[var(--color-text-muted)] border-[var(--color-border)] hover:bg-[var(--color-soft)]'
                }`}
              >
                <Icon className={`w-4 h-4 ${isSelected ? 'text-[#D96C4F]' : 'text-[#66736F]'}`} />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Secondary Filter Bar (Region, Duration, Sort) */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 travel-card rounded-2xl">
          
          {/* Region Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <span className="text-xs font-bold text-[#66736F] dark:text-[#A3B0AB] mr-2 shrink-0">Region:</span>
            {REGIONS.map((r) => (
              <button
                key={r}
                onClick={() => setSelectedRegion(r)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                  selectedRegion === r
                    ? 'bg-[#D96C4F] text-white shadow-sm'
                    : 'bg-[var(--color-soft)] text-[var(--color-text-muted)] hover:bg-[var(--color-border)]'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          {/* Holiday Duration & Sort */}
          <div className="flex items-center gap-3 self-end md:self-auto shrink-0 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-[#66736F] dark:text-[#A3B0AB] font-medium">Trip Length:</span>
              <select
                value={durationFilter}
                onChange={(e) => setDurationFilter(e.target.value)}
                className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg px-2.5 py-1.5 text-xs font-semibold text-[var(--color-text)] outline-none"
              >
                <option value="all">Any Duration</option>
                <option value="short">1 - 2 Days (Weekend)</option>
                <option value="medium">3 - 4 Days (Classic)</option>
                <option value="long">5+ Days (Grand Tour)</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-[#66736F] dark:text-[#A3B0AB] font-medium">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg px-2.5 py-1.5 text-xs font-semibold text-[var(--color-text)] outline-none"
              >
                <option value="popularity">Highest Rated</option>
                <option value="name">City Name (A - Z)</option>
                <option value="budget_low">Budget (Low to High)</option>
              </select>
            </div>
          </div>

        </div>

        {/* Results Counter & Reset */}
        <div className="flex items-center justify-between text-xs text-[#66736F] dark:text-[#A3B0AB]">
          <span>
            Showing <strong className="text-[var(--color-text)] font-mono">{filteredDestinations.length}</strong> tourist destinations across India
          </span>
          {(searchQuery || selectedCategory !== 'all' || selectedRegion !== 'All India' || durationFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
                setSelectedRegion('All India');
                setDurationFilter('all');
              }}
              className="text-[#D96C4F] hover:underline font-semibold"
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* Destination Cards Grid */}
        {filteredDestinations.length === 0 ? (
          <div className="travel-card p-12 text-center space-y-4">
            <Compass className="w-12 h-12 text-[#D96C4F] mx-auto opacity-70" />
            <h3 className="text-lg font-bold text-[var(--color-text)]">No destinations found</h3>
            <p className="text-xs text-[#66736F] dark:text-[#A3B0AB] max-w-md mx-auto">
              We couldn't find any places matching your current filters. Try searching for "Goa", "Jaipur", "Hills", or reset your filters.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
                setSelectedRegion('All India');
              }}
              className="btn-primary !h-9 !px-4 text-xs inline-flex items-center gap-1.5"
            >
              Show All Destinations
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDestinations.map((dest) => {
              const isFav = favorites.includes(dest.id);
              return (
                <div
                  key={dest.id}
                  className="travel-card overflow-hidden group flex flex-col hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                >
                  {/* Card Image Banner */}
                  <div className="relative h-52 w-full overflow-hidden bg-[#173F3A]">
                    <img
                      src={dest.heroImage}
                      alt={dest.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                    {/* Wishlist button */}
                    <button
                      onClick={(e) => toggleFavorite(dest.id, e)}
                      className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition ${
                        isFav 
                          ? 'bg-rose-500 text-white shadow-md' 
                          : 'bg-black/40 text-white hover:bg-black/60'
                      }`}
                      title={isFav ? 'Remove from wishlist' : 'Save destination'}
                    >
                      <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-current' : ''}`} />
                    </button>

                    {/* Category / Region Badge */}
                    <div className="absolute top-3 left-3 flex items-center gap-1.5">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#173F3A]/80 backdrop-blur-md text-white border border-white/10 uppercase tracking-wider">
                        {dest.region}
                      </span>
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#D96C4F] text-white shadow-sm">
                        {dest.tag}
                      </span>
                    </div>

                    {/* City Name & State on Image */}
                    <div className="absolute bottom-3 left-3 right-3 text-white">
                      <div className="flex items-baseline justify-between">
                        <div>
                          <h3 className="text-2xl font-extrabold font-heading text-white">{dest.name}</h3>
                          <span className="text-xs text-[#E3DED2] flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 text-[#D96C4F]" /> {dest.state}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 bg-black/50 backdrop-blur-sm px-2 py-1 rounded-lg text-xs font-bold text-amber-300">
                          <Star className="w-3.5 h-3.5 fill-current text-amber-400" />
                          <span>{dest.rating}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                    
                    <div className="space-y-3">
                      <p className="text-xs text-[#66736F] dark:text-[#A3B0AB] leading-relaxed line-clamp-2">
                        {dest.tagline}
                      </p>

                      {/* Travel Quick Info Chips */}
                      <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                        <div className="flex items-center gap-1.5 text-[var(--color-text)]">
                          <Calendar className="w-3.5 h-3.5 text-[#D96C4F] shrink-0" />
                          <span className="truncate">{dest.bestTime}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[var(--color-text)]">
                          <DollarSign className="w-3.5 h-3.5 text-[#4F7D62] shrink-0" />
                          <span className="truncate">{dest.avgBudget}</span>
                        </div>
                      </div>

                      {/* Top Highlights Pills */}
                      <div className="space-y-1.5 pt-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#66736F] dark:text-[#A3B0AB]">
                          Top Highlights:
                        </span>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {dest.topHighlights.slice(0, 3).map((h, i) => (
                            <span
                              key={i}
                              className="text-[11px] px-2 py-0.5 rounded-md bg-[var(--color-soft)] text-[var(--color-text)] font-medium border border-[var(--color-border)]"
                            >
                              {h}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Action CTA Buttons */}
                    <div className="pt-4 border-t border-[var(--color-border)] flex items-center gap-2">
                      <Link
                        to={`/destinations/${dest.id}#trip-planner-section`}
                        className="btn-primary flex-1 !h-9 text-xs !bg-[#D96C4F] hover:!bg-[#c55d41] inline-flex items-center justify-center gap-1.5 font-bold"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Plan Trip ({dest.idealDays})</span>
                      </Link>

                      <Link
                        to={`/destinations/${dest.id}`}
                        className="btn-secondary !h-9 !px-3 text-xs inline-flex items-center justify-center gap-1"
                        title="View City Guide"
                      >
                        <span>Guide</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

    </div>
  );
}
