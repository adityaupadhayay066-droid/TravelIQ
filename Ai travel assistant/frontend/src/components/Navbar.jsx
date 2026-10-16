import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  User, Settings, LogOut, Menu, X, Sun, Moon, Sparkles, Train, 
  Compass, Utensils, MapPin, Building2, Navigation, Leaf, Brain, 
  Bot, Mic, Globe2, BarChart3, Network, Cpu, ChevronDown, ChevronRight, 
  Search, Bell, ArrowRight, Check, Shield, HelpCircle, Key, Plane, Bus,
  CalendarDays, Ticket, Briefcase, Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

/* ==========================================================================
   PRIMARY TRAVEL CATEGORIES (MakeMyTrip / Skyscanner inspired, TravelIQ identity)
   ========================================================================== */
const TRAVEL_CATEGORIES = [
  { id: 'flights', label: 'Flights', icon: Plane, path: '/?tab=flights' },
  { id: 'trains', label: 'Trains', icon: Train, path: '/?tab=trains' },
  { id: 'buses', label: 'Buses', icon: Bus, path: '/?tab=buses' },
  { id: 'hotels', label: 'Hotels', icon: Building2, path: '/hotels' },
  { id: 'explore', label: 'Explore', icon: Compass, path: '/destinations' },
  { id: 'trips', label: 'My Trips', icon: CalendarDays, path: '/dashboard/my-trips' }
];

const EXPLORE_MENU_ITEMS = [
  {
    title: 'Popular Destinations',
    desc: 'Curated travel guides, seasonal weather & budgets for 50+ Indian cities',
    to: '/destinations',
    icon: MapPin,
    badge: 'Guide'
  },
  {
    title: 'Multimodal Route Planner',
    desc: 'Compare trains, domestic flights, and interstate buses side-by-side',
    to: '/dashboard',
    icon: Compass,
    badge: 'Popular'
  },
  {
    title: 'Live Train GPS Tracker',
    desc: 'Real-time delay tracking, current platform and station locator',
    to: '/dashboard/track',
    icon: Navigation,
    badge: 'Live'
  },
  {
    title: 'Station Food Delivery',
    desc: 'Hygienic meals from IRCTC approved restaurants delivered to your berth',
    to: '/dashboard/food',
    icon: Utensils,
    badge: null
  },
  {
    title: '3D Station Navigation',
    desc: 'Digital twin interactive map of station platforms, waiting halls & exits',
    to: '/dashboard/station-3d',
    icon: Building2,
    badge: '3D'
  },
  {
    title: 'Eco Carbon Footprint',
    desc: 'Calculate transit carbon footprint and earn eco travel badges',
    to: '/dashboard/eco',
    icon: Leaf,
    badge: null
  },
  {
    title: 'B2B Developer Hub',
    desc: 'API keys, AI endpoints, telemetry & developer pricing plans',
    to: '/dashboard/developer',
    icon: Key,
    badge: 'B2B'
  }
];

const SEARCHABLE_ITEMS = [
  { title: 'Search Flights, Trains & Buses', category: 'Booking', to: '/dashboard', icon: Compass },
  { title: 'Hotel Recommendations & Stays', category: 'Hotels', to: '/hotels', icon: Building2 },
  { title: 'Explore 50+ Indian Destinations', category: 'Destinations', to: '/destinations', icon: MapPin },
  { title: 'Live GPS Train Tracking', category: 'Live Status', to: '/dashboard/track', icon: Navigation },
  { title: 'Station Food & Meal Delivery', category: 'Food', to: '/dashboard/food', icon: Utensils },
  { title: 'B2B Developer Hub & API Keys', category: 'Developers', to: '/dashboard/developer', icon: Key },
  { title: 'My Booked Trips & Tickets', category: 'Account', to: '/dashboard/my-trips', icon: CalendarDays },
  { title: 'AI Workspace Command Center', category: 'AI Tools', to: '/dashboard/ai-workspace', icon: Sparkles },
  { title: '3D Railway Station Twin', category: 'Visual Tools', to: '/dashboard/station-3d', icon: Building2 },
  { title: 'Customer Support & Helpdesk', category: 'Support', to: '/support', icon: HelpCircle }
];

const NOTIFICATIONS = [
  { id: 1, title: 'Train 12002 on time', desc: 'Shatabdi Express platform 1 announced at New Delhi (NDLS)', time: '10m ago' },
  { id: 2, title: 'Smart Route Tip', desc: 'Direct Vande Bharat available tomorrow with 42 AC Chair seats', time: '1h ago' }
];

export default function Navbar() {
  const { user, logout, openAuthModal } = useAuth();
  const { effectiveTheme, setTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  // Navigation state
  const [activeDropdown, setActiveDropdown] = useState(null); // 'explore' | 'profile' | 'notif' | null
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const navContainerRef = useRef(null);
  const commandInputRef = useRef(null);

  // Scroll detection
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 8);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Click-outside listener
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (navContainerRef.current && !navContainerRef.current.contains(e.target)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setActiveDropdown(null);
        setIsCommandOpen(false);
        setIsMobileMenuOpen(false);
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Auto-focus command palette
  useEffect(() => {
    if (isCommandOpen && commandInputRef.current) {
      setTimeout(() => commandInputRef.current?.focus(), 50);
    } else {
      setSearchQuery('');
    }
  }, [isCommandOpen]);

  // Close menus on route change
  useEffect(() => {
    setActiveDropdown(null);
    setIsMobileMenuOpen(false);
    setIsCommandOpen(false);
  }, [location.pathname, location.search]);

  const toggleDropdown = (name) => {
    setActiveDropdown((prev) => (prev === name ? null : name));
  };

  const handleLogout = () => {
    logout();
    setActiveDropdown(null);
    setIsMobileMenuOpen(false);
    navigate('/');
  };

  const handleCategoryClick = (category) => {
    setActiveDropdown(null);
    setIsMobileMenuOpen(false);

    if (category.id === 'trips') {
      if (user) {
        navigate('/dashboard/my-trips');
      } else {
        openAuthModal('login');
      }
      return;
    }

    if (category.id === 'explore') {
      navigate('/destinations');
      return;
    }

    // Flights, Trains, Buses, Hotels
    setSelectedHomeTab(category.id);
    if (location.pathname === '/') {
      // Dispatch category event so LandingPage switches tab and scrolls
      window.dispatchEvent(new CustomEvent('traveliq:set-tab', { detail: { tab: category.id } }));
      const elem = document.getElementById('search-booking-panel') || document.getElementById('trip-planner-section');
      if (elem) elem.scrollIntoView({ behavior: 'smooth' });
    } else {
      navigate(`/?tab=${category.id}`, { state: { initialTab: category.id } });
    }
  };

  // State to track home tab when on homepage
  const [selectedHomeTab, setSelectedHomeTab] = useState(() => {
    const urlParams = new URLSearchParams(location.search);
    return urlParams.get('tab') || 'trains';
  });

  useEffect(() => {
    const handleTab = (e) => {
      if (e.detail?.tab) setSelectedHomeTab(e.detail.tab);
    };
    window.addEventListener('traveliq:set-tab', handleTab);
    return () => window.removeEventListener('traveliq:set-tab', handleTab);
  }, []);

  // Determine active category based on URL or current page
  const getActiveCategoryId = () => {
    const urlParams = new URLSearchParams(location.search);
    const tabParam = urlParams.get('tab');
    if (location.pathname === '/destinations' || location.pathname.startsWith('/destinations/')) {
      return 'explore';
    }
    if (location.pathname === '/dashboard/my-trips') {
      return 'trips';
    }
    if (tabParam && ['flights', 'trains', 'buses', 'hotels'].includes(tabParam)) {
      return tabParam;
    }
    if (location.pathname === '/dashboard') {
      return 'trains'; // default multimodal
    }
    if (location.pathname === '/') {
      return selectedHomeTab;
    }
    return null;
  };

  const activeCategory = getActiveCategoryId();

  // Only show 'My Trips' if user is logged in
  const visibleCategories = TRAVEL_CATEGORIES.filter((cat) => {
    if (cat.id === 'trips' && !user) return false;
    return true;
  });

  const filteredSearchItems = (searchQuery.trim() === '' 
    ? SEARCHABLE_ITEMS.slice(0, 7)
    : SEARCHABLE_ITEMS.filter((item) => 
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
  ).filter((item) => {
    if (item.to === '/dashboard/my-trips' && !user) return false;
    return true;
  });

  return (
    <>
      {/* ====================================================================
          STICKY MAIN NAVIGATION BAR
          ==================================================================== */}
      <header 
        ref={navContainerRef}
        className={`sticky top-0 z-50 w-full transition-all duration-200 bg-white dark:bg-[#1B242E] border-b ${
          isScrolled 
            ? 'border-[#E3E7EA] dark:border-[#293644] shadow-xs' 
            : 'border-[#E3E7EA] dark:border-[#293644]'
        }`}
      >
        <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 h-[64px] flex items-center justify-between gap-3 sm:gap-6">
          
          {/* LEFT: TRAVELIQ BRAND LOGO */}
          <div className="flex items-center gap-3 shrink-0">
            <Link 
              to="/" 
              className="flex items-center gap-2.5 group whitespace-nowrap"
              aria-label="TravelIQ Homepage"
            >
              {/* Distinctive Travel Compass Route Icon */}
              <div className="w-8 h-8 rounded-lg bg-[#244C66] text-white flex items-center justify-center shadow-xs transition-opacity duration-200 group-hover:opacity-90">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71L12 2z" />
                </svg>
              </div>

              <div className="flex flex-col">
                <div className="flex items-center text-lg font-bold tracking-tight leading-none text-[#244C66] dark:text-[#F0F4F7]">
                  <span>TravelIQ</span>
                </div>
                <span className="text-[9.5px] font-medium text-[#89939B] tracking-wider uppercase leading-none mt-0.5 hidden xs:inline">
                  Smart Travel Assistant
                </span>
              </div>
            </Link>
          </div>

          {/* CENTER: TRAVEL CATEGORY TABS (Visible only after login/signup) */}
          {user && (
            <nav className="hidden lg:flex items-center gap-1 xl:gap-1.5 h-full whitespace-nowrap">
              {visibleCategories.map((cat) => {
              const Icon = cat.icon;
              const isActive = activeCategory === cat.id;

              if (cat.id === 'explore') {
                return (
                  <div key={cat.id} className="relative h-full flex items-center">
                    <button
                      onClick={() => toggleDropdown('explore')}
                      className={`h-9 px-3 rounded-lg flex items-center gap-1.5 text-xs font-medium transition-all cursor-pointer border ${
                        isActive || activeDropdown === 'explore'
                          ? 'bg-[#EAF0F4] dark:bg-[#233240] text-[#244C66] dark:text-[#75A4C4] border-[#E3E7EA] dark:border-[#293644] font-semibold'
                          : 'bg-transparent text-[#66737D] dark:text-[#9CAAB5] border-transparent hover:bg-[#EEF2F4] dark:hover:bg-[#162029] hover:text-[#202A32] dark:hover:text-[#F0F4F7]'
                      }`}
                      aria-expanded={activeDropdown === 'explore'}
                    >
                      <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive || activeDropdown === 'explore' ? 'text-[#244C66] dark:text-[#75A4C4]' : 'text-[#66737D] dark:text-[#9CAAB5]'}`} />
                      <span>{cat.label}</span>
                      <ChevronDown className={`w-3 h-3 transition-transform duration-200 text-[#89939B] ${activeDropdown === 'explore' ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence>
                      {activeDropdown === 'explore' && (
                        <motion.div
                          initial={{ opacity: 0, y: 6, scale: 0.99 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 4, scale: 0.99 }}
                          transition={{ duration: 0.15 }}
                          className="absolute left-0 top-[56px] w-[420px] p-2.5 rounded-xl bg-white dark:bg-[#1B242E] border border-[#E3E7EA] dark:border-[#293644] shadow-lg z-50"
                        >
                          <div className="grid grid-cols-2 gap-1">
                            {EXPLORE_MENU_ITEMS.map((item, idx) => (
                              <Link
                                key={idx}
                                to={item.to}
                                onClick={() => setActiveDropdown(null)}
                                className="p-2.5 rounded-lg hover:bg-[#F7F8FA] dark:hover:bg-[#162029] transition-colors flex items-start gap-2.5 group"
                              >
                                <div className="p-1.5 rounded-md bg-[#EEF2F4] dark:bg-[#233240] text-[#244C66] dark:text-[#75A4C4] shrink-0">
                                  <item.icon className="w-3.5 h-3.5" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-xs font-semibold text-[#202A32] dark:text-[#F0F4F7] truncate block">
                                      {item.title}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-[#66737D] dark:text-[#9CAAB5] line-clamp-1 mt-0.5">
                                    {item.desc}
                                  </p>
                                </div>
                              </Link>
                            ))}
                          </div>

                          <div className="mt-2 pt-2 border-t border-[#E3E7EA] dark:border-[#293644] flex items-center justify-between px-2">
                            <Link
                              to="/destinations"
                              onClick={() => setActiveDropdown(null)}
                              className="text-xs font-semibold text-[#244C66] dark:text-[#75A4C4] hover:underline flex items-center gap-1"
                            >
                              Explore 50+ Destinations <ArrowRight className="w-3.5 h-3.5" />
                            </Link>
                            <Link
                              to="/dashboard/track"
                              onClick={() => setActiveDropdown(null)}
                              className="text-xs font-semibold text-[#66737D] dark:text-[#9CAAB5] hover:text-[#244C66] dark:hover:text-[#75A4C4] flex items-center gap-1"
                            >
                              Live Train Status
                            </Link>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              }

              return (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryClick(cat)}
                  className={`h-9 px-3 rounded-lg flex items-center gap-1.5 text-xs font-medium transition-all cursor-pointer border ${
                    isActive
                      ? 'bg-[#EAF0F4] dark:bg-[#233240] text-[#244C66] dark:text-[#75A4C4] border-[#E3E7EA] dark:border-[#293644] font-semibold'
                      : 'bg-transparent text-[#66737D] dark:text-[#9CAAB5] border-transparent hover:bg-[#EEF2F4] dark:hover:bg-[#162029] hover:text-[#202A32] dark:hover:text-[#F0F4F7]'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-[#244C66] dark:text-[#75A4C4]' : 'text-[#66737D] dark:text-[#9CAAB5]'}`} />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </nav>
          )}

          {/* RIGHT: CONTROLS & USER ACCOUNT ACTIONS */}
          <div className="flex items-center gap-2 shrink-0">
            
            {/* Command search trigger (Cmd+K) */}
            <button
              onClick={() => setIsCommandOpen(true)}
              className="hidden md:flex items-center gap-2 h-8.5 px-2.5 rounded-lg border border-[#E3E7EA] dark:border-[#293644] bg-[#F7F8FA] dark:bg-[#162029] text-xs text-[#66737D] dark:text-[#9CAAB5] hover:border-[#CAD3DA] hover:bg-white dark:hover:bg-[#1B242E] transition-colors cursor-pointer"
              title="Search routes & destinations (⌘K)"
            >
              <Search className="w-3.5 h-3.5 text-[#89939B]" />
              <span className="font-medium hidden xl:inline text-[#66737D] dark:text-[#9CAAB5]">Search...</span>
              <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-medium bg-white dark:bg-[#1B242E] border border-[#E3E7EA] dark:border-[#293644] rounded text-[#89939B]">
                ⌘K
              </kbd>
            </button>

            {/* Notifications Popover (if user logged in) */}
            {user && (
              <div className="relative">
                <button
                  onClick={() => toggleDropdown('notif')}
                  className="w-8.5 h-8.5 flex items-center justify-center rounded-lg text-[#66737D] dark:text-[#9CAAB5] hover:bg-[#EEF2F4] dark:hover:bg-[#162029] transition-colors relative cursor-pointer"
                  title="Travel Updates"
                  aria-expanded={activeDropdown === 'notif'}
                >
                  <Bell className="w-4 h-4" />
                  <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-[#244C66] ring-2 ring-white dark:ring-[#1B242E]" />
                </button>

                <AnimatePresence>
                  {activeDropdown === 'notif' && (
                    <motion.div
                      initial={{ opacity: 0, y: 6, scale: 0.99 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 4, scale: 0.99 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-[44px] w-80 p-2.5 rounded-xl bg-white dark:bg-[#1B242E] border border-[#E3E7EA] dark:border-[#293644] shadow-lg z-50 text-xs"
                    >
                      <div className="flex items-center justify-between pb-2 border-b border-[#E3E7EA] dark:border-[#293644] mb-2">
                        <span className="font-bold text-[#202A32] dark:text-[#F0F4F7]">Live Updates</span>
                        <span className="text-[10px] font-semibold text-[#244C66] bg-[#EAF0F4] dark:bg-[#233240] px-2 py-0.5 rounded">New</span>
                      </div>
                      <div className="space-y-1">
                        {NOTIFICATIONS.map((n) => (
                          <div key={n.id} className="p-2 rounded-lg hover:bg-[#F7F8FA] dark:hover:bg-[#162029] transition-colors">
                            <p className="font-semibold text-[#202A32] dark:text-[#F0F4F7]">{n.title}</p>
                            <p className="text-[11px] text-[#66737D] dark:text-[#9CAAB5] mt-0.5">{n.desc}</p>
                            <span className="text-[10px] text-[#89939B] mt-1 block">{n.time}</span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Theme Toggle (Sun/Moon) */}
            <button
              onClick={() => setTheme(effectiveTheme === 'dark' ? 'light' : 'dark')}
              className="w-8.5 h-8.5 flex items-center justify-center rounded-lg text-[#66737D] dark:text-[#9CAAB5] hover:bg-[#EEF2F4] dark:hover:bg-[#162029] transition-colors cursor-pointer"
              title={`Switch to ${effectiveTheme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {effectiveTheme === 'dark' ? <Sun className="w-4 h-4 text-[#C87E58]" /> : <Moon className="w-4 h-4 text-[#66737D]" />}
            </button>

            {/* Profile Dropdown OR Guest Login/Signup */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => toggleDropdown('profile')}
                  className="h-8.5 flex items-center gap-2 px-2.5 rounded-lg border border-[#E3E7EA] dark:border-[#293644] hover:bg-[#F7F8FA] dark:hover:bg-[#162029] transition-colors cursor-pointer"
                  aria-expanded={activeDropdown === 'profile'}
                >
                  <div className="w-5.5 h-5.5 rounded-md bg-[#244C66] text-white flex items-center justify-center font-bold text-xs shrink-0">
                    {user.name ? user.name[0].toUpperCase() : 'U'}
                  </div>
                  <span className="text-xs font-semibold text-[#202A32] dark:text-[#F0F4F7] max-w-[110px] truncate hidden sm:inline">
                    {user.name || 'Account'}
                  </span>
                  <ChevronDown className={`w-3 h-3 text-[#89939B] transition-transform ${activeDropdown === 'profile' ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {activeDropdown === 'profile' && (
                    <motion.div
                      initial={{ opacity: 0, y: 6, scale: 0.99 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 4, scale: 0.99 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-[44px] w-64 p-2 rounded-xl bg-white dark:bg-[#1B242E] border border-[#E3E7EA] dark:border-[#293644] shadow-lg z-50 text-xs"
                    >
                      <div className="px-3 py-2 border-b border-[#E3E7EA] dark:border-[#293644] mb-1">
                        <p className="font-bold text-sm text-[#202A32] dark:text-[#F0F4F7] truncate">{user.name}</p>
                        <p className="text-[11px] text-[#66737D] dark:text-[#9CAAB5] truncate">{user.email}</p>
                      </div>

                      <div className="space-y-0.5">
                        {user.role === 'admin' && (
                          <Link
                            to="/admin/dashboard"
                            onClick={() => setActiveDropdown(null)}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#EAF0F4] dark:bg-[#233240] text-[#244C66] dark:text-[#75A4C4] font-semibold mb-1"
                          >
                            <Shield className="w-3.5 h-3.5 text-[#244C66]" />
                            <span>Admin Portal</span>
                            <span className="ml-auto text-[9px] font-bold px-1.5 py-0.2 bg-[#244C66] text-white rounded">ADMIN</span>
                          </Link>
                        )}
                        <Link
                          to="/dashboard/my-trips"
                          onClick={() => setActiveDropdown(null)}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#F7F8FA] dark:hover:bg-[#162029] text-[#202A32] dark:text-[#F0F4F7] transition-colors font-medium"
                        >
                          <CalendarDays className="w-3.5 h-3.5 text-[#89939B]" />
                          <span>My Trips & Tickets</span>
                        </Link>
                        <Link
                          to="/dashboard/profile"
                          onClick={() => setActiveDropdown(null)}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#F7F8FA] dark:hover:bg-[#162029] text-[#202A32] dark:text-[#F0F4F7] transition-colors font-medium"
                        >
                          <User className="w-3.5 h-3.5 text-[#89939B]" />
                          <span>Profile & Account</span>
                        </Link>
                        <Link
                          to="/dashboard/developer"
                          onClick={() => setActiveDropdown(null)}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#F7F8FA] dark:hover:bg-[#162029] text-[#202A32] dark:text-[#F0F4F7] transition-colors font-medium"
                        >
                          <Key className="w-3.5 h-3.5 text-[#89939B]" />
                          <span>Developer Hub & API Keys</span>
                          <span className="ml-auto text-[9px] font-bold px-1.5 py-0.5 bg-[#EAF0F4] dark:bg-[#233240] text-[#244C66] dark:text-[#75A4C4] rounded">B2B</span>
                        </Link>
                        <Link
                          to="/dashboard/settings"
                          onClick={() => setActiveDropdown(null)}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#F7F8FA] dark:hover:bg-[#162029] text-[#202A32] dark:text-[#F0F4F7] transition-colors font-medium"
                        >
                          <Settings className="w-3.5 h-3.5 text-[#89939B]" />
                          <span>Settings</span>
                        </Link>
                      </div>

                      <div className="pt-1 mt-1 border-t border-[#E3E7EA] dark:border-[#293644]">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[#B54747] hover:bg-[#EEF2F4] dark:hover:bg-[#162029] transition-colors font-semibold"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Log out</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openAuthModal('login')}
                  className="px-3 py-1.5 text-xs font-semibold text-[#202A32] dark:text-[#F0F4F7] hover:bg-[#EEF2F4] dark:hover:bg-[#162029] border border-[#E3E7EA] dark:border-[#293644] rounded-lg transition-colors cursor-pointer"
                >
                  Log In
                </button>
                <button
                  onClick={() => openAuthModal('signup')}
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#244C66] hover:bg-[#193B51] rounded-lg transition-colors shadow-xs cursor-pointer"
                >
                  Sign Up
                </button>
              </div>
            )}

            {/* Mobile Menu Hamburger Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden w-8.5 h-8.5 flex items-center justify-center rounded-lg text-[#202A32] dark:text-[#F0F4F7] hover:bg-[#EEF2F4] dark:hover:bg-[#162029] transition-colors"
              aria-label="Toggle Mobile Menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5 text-[#202A32] dark:text-[#F0F4F7]" />}
            </button>

          </div>

        </div>

        {/* Mobile Horizontal Quick Category Switcher (Under Header - Visible only after login/signup) */}
        {user && (
          <div className="lg:hidden flex items-center gap-1.5 px-4 py-2 border-t border-[#E3E7EA] dark:border-[#293644] overflow-x-auto scrollbar-none bg-[#F7F8FA] dark:bg-[#162029]">
            {visibleCategories.map((cat) => {
              const Icon = cat.icon;
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryClick(cat)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium shrink-0 transition-colors ${
                    isActive
                      ? 'bg-[#244C66] text-white font-semibold'
                      : 'bg-white dark:bg-[#1B242E] text-[#66737D] dark:text-[#9CAAB5] border border-[#E3E7EA] dark:border-[#293644]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </header>

      {/* ====================================================================
          MOBILE DRAWER MENU
          ==================================================================== */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18 }}
            className={`lg:hidden fixed ${user ? 'top-[108px] max-h-[calc(100vh-108px)]' : 'top-[64px] max-h-[calc(100vh-64px)]'} left-0 right-0 overflow-y-auto bg-white dark:bg-[#1B242E] border-b border-[#E3E7EA] dark:border-[#293644] z-40 p-4 space-y-4 shadow-xl`}
          >
            {/* Quick Command search trigger on mobile */}
            <button
              onClick={() => { setIsMobileMenuOpen(false); setIsCommandOpen(true); }}
              className="w-full flex items-center gap-2 p-2.5 rounded-lg border border-[#E3E7EA] dark:border-[#293644] bg-[#F7F8FA] dark:bg-[#162029] text-xs text-[#66737D]"
            >
              <Search className="w-4 h-4 text-[#89939B]" />
              <span>Search destinations, routes, trains...</span>
            </button>

            {/* Travel Categories List (Visible only after login/signup) */}
            {user && (
              <div className="space-y-1">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">Book & Plan</p>
                {visibleCategories.map((cat) => {
                  const Icon = cat.icon;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => handleCategoryClick(cat)}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-800 dark:text-slate-200 text-sm font-semibold transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400">
                          <Icon className="w-4 h-4" />
                        </div>
                        <span>{cat.label}</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </button>
                  );
                })}
              </div>
            )}

            {/* Explore Tools */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">Travel Utilities</p>
              <Link
                to="/destinations"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-800 dark:text-slate-200 text-sm font-semibold"
              >
                <MapPin className="w-4 h-4 text-teal-600" />
                <span>50+ Popular Destinations Guide</span>
              </Link>
              <Link
                to="/dashboard/track"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-800 dark:text-slate-200 text-sm font-semibold"
              >
                <Navigation className="w-4 h-4 text-teal-600" />
                <span>Live Train GPS Tracker</span>
              </Link>
              <Link
                to="/dashboard/food"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-[#F7F8FA] dark:hover:bg-[#162029] text-[#202A32] dark:text-[#F0F4F7] text-sm font-medium"
              >
                <Utensils className="w-4 h-4 text-[#244C66]" />
                <span>Station Food Delivery</span>
              </Link>
              <Link
                to="/dashboard/developer"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-[#F7F8FA] dark:hover:bg-[#162029] text-[#202A32] dark:text-[#F0F4F7] text-sm font-medium"
              >
                <Key className="w-4 h-4 text-[#244C66]" />
                <span>B2B Developer Hub & API Keys</span>
              </Link>
              <Link
                to="/support"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-[#F7F8FA] dark:hover:bg-[#162029] text-[#202A32] dark:text-[#F0F4F7] text-sm font-medium"
              >
                <HelpCircle className="w-4 h-4 text-[#244C66]" />
                <span>Support & Helpdesk</span>
              </Link>
            </div>

            {/* User Account / Auth Actions */}
            <div className="pt-2 border-t border-[#E3E7EA] dark:border-[#293644]">
              {user ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2">
                    <span className="text-xs font-semibold text-[#202A32] dark:text-[#F0F4F7]">Logged in as {user.name}</span>
                    <button onClick={handleLogout} className="text-xs font-semibold text-[#B54747]">Log out</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={() => { openAuthModal('login'); setIsMobileMenuOpen(false); }}
                    className="flex-1 btn-secondary h-9 text-xs font-semibold"
                  >
                    Log In
                  </button>
                  <button
                    onClick={() => { openAuthModal('signup'); setIsMobileMenuOpen(false); }}
                    className="flex-1 btn-primary h-9 text-xs font-semibold"
                  >
                    Sign Up
                  </button>
                </div>
              )}
            </div>

          </motion.div>
        )}
      </AnimatePresence>

      {/* ====================================================================
          COMMAND PALETTE DIALOG (⌘K / Ctrl+K)
          ==================================================================== */}
      <AnimatePresence>
        {isCommandOpen && (
          <div className="fixed inset-0 z-[100] flex items-start justify-center pt-20 px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCommandOpen(false)}
              className="fixed inset-0 bg-[#202A32]/40 backdrop-blur-2xs"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.98, y: -6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: -6 }}
              transition={{ duration: 0.15 }}
              className="relative w-full max-w-lg bg-white dark:bg-[#1B242E] border border-[#E3E7EA] dark:border-[#293644] rounded-xl shadow-xl overflow-hidden z-10"
            >
              <div className="flex items-center px-4 py-3 border-b border-[#E3E7EA] dark:border-[#293644] gap-3">
                <Search className="w-4 h-4 text-[#89939B] shrink-0" />
                <input
                  ref={commandInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search destinations, train schedules, routes, hotels..."
                  className="w-full bg-transparent border-none outline-none text-sm font-medium text-[#202A32] dark:text-[#F0F4F7] placeholder-[#89939B]"
                />
                <button
                  onClick={() => setIsCommandOpen(false)}
                  className="px-1.5 py-0.5 rounded border border-[#E3E7EA] dark:border-[#293644] text-[#89939B] hover:text-[#202A32] text-[10px] font-mono"
                >
                  ESC
                </button>
              </div>

              <div className="max-h-80 overflow-y-auto p-2 space-y-1">
                {filteredSearchItems.map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        setIsCommandOpen(false);
                        navigate(item.to);
                      }}
                      className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-[#F7F8FA] dark:hover:bg-[#162029] transition-colors text-left group cursor-pointer"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-1.5 rounded-md bg-[#EEF2F4] dark:bg-[#233240] text-[#244C66] dark:text-[#75A4C4] shrink-0">
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-semibold text-[#202A32] dark:text-[#F0F4F7] block truncate">
                            {item.title}
                          </span>
                          <span className="text-[10px] text-[#89939B] block truncate">
                            {item.category}
                          </span>
                        </div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-[#89939B] group-hover:translate-x-0.5 transition-transform shrink-0" />
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
