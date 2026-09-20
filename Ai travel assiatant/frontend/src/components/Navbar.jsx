import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  User, Settings, LogOut, Menu, X, Sun, Moon, Sparkles, Train, 
  Compass, Utensils, MapPin, Building2, Navigation, Leaf, Brain, 
  Bot, Mic, Globe2, BarChart3, Network, Cpu, ChevronDown, ChevronRight, 
  Search, Bell, ArrowRight, Check, Shield, HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

/* ==========================================================================
   MENU CONFIGURATIONS
   ========================================================================== */
const EXPLORE_MENU = {
  label: 'Explore & Book',
  items: [
    {
      title: 'Multimodal Route Planner',
      desc: 'Compare trains, flights, and buses with real-time price trends',
      to: '/dashboard',
      icon: Compass,
      badge: 'Popular',
      badgeColor: 'bg-[#173F3A]/10 text-[#173F3A] dark:bg-white/10 dark:text-white'
    },
    {
      title: 'Station Food Delivery',
      desc: 'Order hygienic restaurant meals directly to your train berth',
      to: '/dashboard/food',
      icon: Utensils,
      badge: null
    },
    {
      title: 'Popular Destinations',
      desc: 'Guides, cost estimates, and local sights for 50+ destinations',
      to: '/destinations',
      icon: MapPin,
      badge: null
    },
    {
      title: '3D Station Navigation',
      desc: 'Interactive 3D digital twin of platforms, exits, and waiting rooms',
      to: '/dashboard/station-3d',
      icon: Building2,
      badge: '3D',
      badgeColor: 'bg-[#D96C4F]/10 text-[#D96C4F]'
    },
    {
      title: 'Live Train GPS Tracker',
      desc: 'Real-time delay tracking, current station and platform locator',
      to: '/dashboard/track',
      icon: Navigation,
      badge: 'Live',
      badgeColor: 'bg-[#4F7D62]/15 text-[#4F7D62]'
    },
    {
      title: 'Eco Carbon Footprint',
      desc: 'Calculate travel emissions and earn green travel points',
      to: '/dashboard/eco',
      icon: Leaf,
      badge: null
    }
  ]
};

const AI_SUITE_MENU = {
  label: 'AI Intelligence',
  featured: {
    title: 'AI Workspace Command Center',
    desc: 'The central intelligence suite unifying neural models, RAG vector search, and autonomous travel agents.',
    to: '/dashboard/ai-workspace',
    icon: Brain,
    badge: 'Hub'
  },
  items: [
    {
      title: 'Travel Copilot (RAG)',
      desc: 'Ask travel questions with verified source citations',
      to: '/dashboard/rag',
      icon: Bot,
      badge: 'RAG'
    },
    {
      title: 'Voice Assistant',
      desc: 'Hands-free voice booking & queries in Hindi & English',
      to: '/dashboard/voice-assistant',
      icon: Mic,
      badge: 'Bilingual'
    },
    {
      title: '3D Travel Globe',
      desc: 'Visual flight corridors, carbon footprints & weather layers',
      to: '/dashboard/3d-globe',
      icon: Globe2,
      badge: '3D'
    },
    {
      title: 'Neural Delay Predictions',
      desc: 'LSTM neural network delay and crowd forecasts',
      to: '/dashboard/ai-predictions',
      icon: BarChart3,
      badge: 'PyTorch'
    },
    {
      title: 'Knowledge Graph',
      desc: 'Entity mapping connecting routes, hotels, and stations',
      to: '/dashboard/knowledge-graph',
      icon: Network,
      badge: null
    },
    {
      title: 'Agentic Planner',
      desc: '8 cascading autonomous agents coordinating your trip',
      to: '/dashboard/agentic-planner',
      icon: Cpu,
      badge: 'Multi-Agent'
    }
  ]
};

const DESTINATIONS_MENU = [
  { name: 'Goa', tag: 'Coastal & Beaches', to: '/destinations/Goa', img: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=240&q=80' },
  { name: 'Jaipur', tag: 'Heritage & Palaces', to: '/destinations/Jaipur', img: 'https://images.unsplash.com/photo-1603262110263-fb010d6e59d4?auto=format&fit=crop&w=240&q=80' },
  { name: 'Manali', tag: 'Himalayan Escapes', to: '/destinations/Manali', img: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=240&q=80' },
  { name: 'Kerala', tag: 'Backwaters & Nature', to: '/destinations/Kerala', img: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=240&q=80' }
];

const SEARCHABLE_ITEMS = [
  { title: 'AI Workspace Command Center', category: 'AI Suite', to: '/dashboard/ai-workspace', icon: Sparkles },
  { title: 'Plan Trip & Compare Routes', category: 'Navigation', to: '/dashboard', icon: Compass },
  { title: 'Travel Copilot (RAG Search)', category: 'AI Suite', to: '/dashboard/rag', icon: Bot },
  { title: 'Multilingual Voice Assistant', category: 'AI Suite', to: '/dashboard/voice-assistant', icon: Mic },
  { title: '3D Interactive Travel Globe', category: 'Visual Tools', to: '/dashboard/3d-globe', icon: Globe2 },
  { title: '3D Railway Station Digital Twin', category: 'Visual Tools', to: '/dashboard/station-3d', icon: Building2 },
  { title: 'Live GPS Train Tracking', category: 'Travel Tools', to: '/dashboard/track', icon: Navigation },
  { title: 'Station Food & Meal Delivery', category: 'Travel Tools', to: '/dashboard/food', icon: Utensils },
  { title: 'Neural Delay & Crowd Predictions', category: 'AI Suite', to: '/dashboard/ai-predictions', icon: BarChart3 },
  { title: 'Agentic Cascade Trip Planner', category: 'AI Suite', to: '/dashboard/agentic-planner', icon: Cpu },
  { title: 'Knowledge Graph Explorer', category: 'AI Suite', to: '/dashboard/knowledge-graph', icon: Network },
  { title: 'Carbon Footprint & Eco Tracker', category: 'Travel Tools', to: '/dashboard/eco', icon: Leaf },
  { title: 'My Trips & Booked Tickets', category: 'Account', to: '/dashboard/my-trips', icon: Train },
  { title: 'Security & Active Devices', category: 'Account', to: '/dashboard/security', icon: Shield },
  { title: 'Account Settings & Profile', category: 'Account', to: '/dashboard/profile', icon: User },
  { title: 'Explore 50+ Destinations', category: 'Navigation', to: '/destinations', icon: MapPin },
  { title: 'Support & Helpdesk Tickets', category: 'Support', to: '/support', icon: HelpCircle },
  { title: 'Admin Command Center (Dashboard)', category: 'Admin Portal', to: '/admin/dashboard', icon: Shield },
  { title: 'Admin User Management', category: 'Admin Portal', to: '/admin/users', icon: User },
  { title: 'Admin Datasets & CSV Import', category: 'Admin Portal', to: '/admin/travel-data', icon: Compass },
  { title: 'Admin Train & Station Management', category: 'Admin Portal', to: '/admin/trains', icon: Train },
  { title: 'Admin Destination CMS', category: 'Admin Portal', to: '/admin/destinations', icon: MapPin },
  { title: 'Admin AI & Model Monitoring', category: 'Admin Portal', to: '/admin/ai', icon: Sparkles },
  { title: 'Admin System Health & Telemetry', category: 'Admin Portal', to: '/admin/system-health', icon: Shield },
  { title: 'Admin Reports & Issue Tracker', category: 'Admin Portal', to: '/admin/reports', icon: HelpCircle }
];

const NOTIFICATIONS = [
  { id: 1, title: 'Train 12002 on time', desc: 'Shatabdi Express platform 1 announced at New Delhi', time: '10m ago' },
  { id: 2, title: 'AI Travel Alert', desc: 'Recommended 18% cheaper AC 3-Tier seat available tomorrow', time: '1h ago' }
];

/* ==========================================================================
   NAVBAR COMPONENT
   ========================================================================== */
export default function Navbar() {
  const { user, logout, openAuthModal } = useAuth();
  const { effectiveTheme, setTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  // Navigation State
  const [activeDropdown, setActiveDropdown] = useState(null); // 'explore' | 'ai' | 'destinations' | 'profile' | 'notif' | null
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mobileAccordion, setMobileAccordion] = useState(null); // 'explore' | 'ai' | 'destinations' | null
  const [isScrolled, setIsScrolled] = useState(false);
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const navContainerRef = useRef(null);
  const commandInputRef = useRef(null);

  // Scroll detection for dynamic shadow/elevation
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 12);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Global Click-outside listener to close dropdowns
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (navContainerRef.current && !navContainerRef.current.contains(e.target)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Global Keyboard shortcuts: Escape (close all) & Cmd/Ctrl+K (Command Palette)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setActiveDropdown(null);
        setIsCommandOpen(false);
        setIsMobileMenuOpen(false);
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        if (!user) return;
        e.preventDefault();
        setIsCommandOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [user]);

  // Auto-focus command palette input when opened
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
  }, [location.pathname]);

  const toggleDropdown = (name) => {
    setActiveDropdown((prev) => (prev === name ? null : name));
  };

  const handleLogout = () => {
    logout();
    setActiveDropdown(null);
    setIsMobileMenuOpen(false);
    navigate('/');
  };

  const filteredSearchItems = searchQuery.trim() === '' 
    ? SEARCHABLE_ITEMS.slice(0, 7)
    : SEARCHABLE_ITEMS.filter((item) => 
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase())
      );

  return (
    <>
      {/* ====================================================================
          TOP DESKTOP & MOBILE NAVIGATION BAR
          ==================================================================== */}
      <header 
        ref={navContainerRef}
        className={`sticky top-0 z-50 w-full navbar-glass transition-all duration-200 h-[68px] ${
          isScrolled ? 'navbar-scrolled' : ''
        }`}
      >
        <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between gap-4">
          
          {/* LEFT: BRAND LOGO */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <Link 
              to="/" 
              className="flex items-center gap-1.5 text-2xl font-black tracking-tight font-heading group whitespace-nowrap"
            >
              <span className="text-[#14532D] dark:text-[#F7F5EF] group-hover:opacity-90 transition-opacity">Travel</span>
              <span className="text-[#E58A3A]">IQ</span>
            </Link>
          </div>

          {/* CENTER: CLEAN 5-ITEM PRIMARY DESKTOP NAVIGATION (Visible only when authenticated) */}
          {user && (
            <nav className="hidden md:flex items-center gap-1 lg:gap-1.5 h-full whitespace-nowrap">
              <Link
                to="/"
                className={`nav-menu-btn ${location.pathname === '/' ? 'text-[#14532D] dark:text-white bg-[#EEF2ED] dark:bg-[#1D322B] font-bold' : ''}`}
              >
                <span>Home</span>
              </Link>

              <Link
                to="/dashboard"
                className={`nav-menu-btn ${location.pathname === '/dashboard' && !location.state?.openCompare ? 'text-[#14532D] dark:text-white bg-[#EEF2ED] dark:bg-[#1D322B] font-bold' : ''}`}
              >
                <span>Plan Trip</span>
              </Link>

              {/* EXPLORE DROPDOWN */}
              <div className="relative h-full flex items-center">
                <button
                  onClick={() => toggleDropdown('explore')}
                  data-active={activeDropdown === 'explore'}
                  className="nav-menu-btn whitespace-nowrap"
                  aria-expanded={activeDropdown === 'explore'}
                >
                  <span>Explore</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${activeDropdown === 'explore' ? 'rotate-180 text-[#14532D] dark:text-white' : ''}`} />
                </button>

                <AnimatePresence>
                  {activeDropdown === 'explore' && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 6, scale: 0.98 }}
                      transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                      className="nav-dropdown-flyout absolute left-0 top-[56px] w-[420px] p-3 z-50 shadow-xl"
                    >
                      <div className="grid grid-cols-2 gap-1.5">
                        {EXPLORE_MENU.items.map((item, idx) => (
                          <Link
                            key={idx}
                            to={item.to}
                            onClick={() => setActiveDropdown(null)}
                            className="nav-mega-item group"
                          >
                            <div className="p-2 rounded-lg bg-[#EEF2ED] dark:bg-[#1D322B] text-[#14532D] dark:text-[#EEF2ED] flex-shrink-0 nav-mega-icon transition-transform">
                              <item.icon className="w-4 h-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <span className="text-xs font-bold text-[#1F2933] dark:text-[#F7F5EF] group-hover:text-[#14532D] dark:group-hover:text-white transition-colors truncate block">
                                {item.title}
                              </span>
                              <p className="text-[10px] text-[#64748B] dark:text-[#94A3B8] line-clamp-1">
                                {item.desc}
                              </p>
                            </div>
                          </Link>
                        ))}
                      </div>

                      <div className="mt-2 pt-2 border-t border-[#E3DED2] dark:border-[#273E36] flex items-center justify-between px-2">
                        <Link 
                          to="/destinations" 
                          onClick={() => setActiveDropdown(null)}
                          className="text-xs font-bold text-[#14532D] dark:text-[#EEF2ED] hover:underline flex items-center gap-1"
                        >
                          All 50+ Destinations <ArrowRight className="w-3 h-3 text-[#E58A3A]" />
                        </Link>
                        <Link 
                          to="/dashboard/ai-workspace" 
                          onClick={() => setActiveDropdown(null)}
                          className="text-xs font-bold text-[#E58A3A] hover:underline flex items-center gap-1"
                        >
                          <Sparkles className="w-3 h-3" /> AI Workspace
                        </Link>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* COMPARE */}
              <Link
                to="/dashboard"
                state={{ openCompare: true }}
                className={`nav-menu-btn whitespace-nowrap flex-shrink-0 ${location.pathname === '/dashboard' && location.state?.openCompare ? 'text-[#14532D] dark:text-white bg-[#EEF2ED] dark:bg-[#1D322B] font-bold' : ''}`}
              >
                <span>Compare</span>
              </Link>

              {/* MY TRIPS */}
              <Link
                to="/dashboard/my-trips"
                className={`nav-menu-btn whitespace-nowrap flex-shrink-0 ${location.pathname === '/dashboard/my-trips' ? 'text-[#14532D] dark:text-white bg-[#EEF2ED] dark:bg-[#1D322B] font-bold' : ''}`}
              >
                <span>My Trips</span>
              </Link>
            </nav>
          )}

          {/* RIGHT: CONTROLS (SEARCH CMD+K, NOTIFICATIONS, THEME, USER PROFILE, PLAN CTA) */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            
            {/* Quick Command Palette Button (⌘K) - Logged in only */}
            {user && (
              <>
                <button
                  onClick={() => setIsCommandOpen(true)}
                  className="hidden xl:flex items-center gap-2 h-[38px] px-3 rounded-lg border border-[#E3DED2] dark:border-[#273E36] bg-[#FFFFFF] dark:bg-[#172722] text-xs text-[#64748B] dark:text-[#94A3B8] hover:border-[#14532D] dark:hover:border-white transition-colors cursor-pointer whitespace-nowrap flex-shrink-0"
                  title="Search and jump to features (Cmd+K)"
                >
                  <Search className="w-3.5 h-3.5 text-[#64748B] dark:text-[#94A3B8] flex-shrink-0" />
                  <span className="text-xs font-medium whitespace-nowrap">Search...</span>
                  <kbd className="nav-kbd whitespace-nowrap flex-shrink-0">⌘K</kbd>
                </button>

                <button
                  onClick={() => setIsCommandOpen(true)}
                  className="hidden md:flex xl:hidden h-[38px] w-[38px] items-center justify-center text-[#64748B] dark:text-[#94A3B8] hover:text-[#14532D] dark:hover:text-white transition-colors cursor-pointer rounded-lg hover:bg-[#EEF2ED] dark:hover:bg-[#1D322B] flex-shrink-0"
                  title="Quick Search (Cmd+K)"
                >
                  <Search className="w-4 h-4" />
                </button>

                {/* Notifications Popover Trigger */}
                <div className="relative flex items-center">
                  <button
                    onClick={() => toggleDropdown('notif')}
                    className="h-[38px] w-[38px] flex items-center justify-center text-[#64748B] dark:text-[#94A3B8] hover:text-[#14532D] dark:hover:text-white rounded-lg hover:bg-[#EEF2ED] dark:hover:bg-[#1D322B] transition-colors relative cursor-pointer"
                    title="Notifications"
                    aria-expanded={activeDropdown === 'notif'}
                  >
                    <Bell className="w-4 h-4" />
                    <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#E58A3A]" />
                  </button>

                  <AnimatePresence>
                    {activeDropdown === 'notif' && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.98 }}
                        transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                        className="nav-dropdown-flyout fixed top-[64px] right-3 left-3 sm:left-auto sm:right-0 sm:absolute sm:top-[48px] sm:w-80 p-2.5 z-50 shadow-2xl"
                      >
                        <div className="flex items-center justify-between px-2 py-1 border-b border-[#E3DED2] dark:border-[#273E36] mb-1">
                          <span className="text-xs font-bold text-[#1F2933] dark:text-[#F7F5EF]">Live Travel Updates</span>
                          <span className="text-[10px] text-[#2F7D32] font-semibold">2 New</span>
                        </div>
                        <div className="space-y-1">
                          {NOTIFICATIONS.map((n) => (
                            <div key={n.id} className="p-2 rounded-lg hover:bg-[#EEF2ED] dark:hover:bg-[#1D322B] transition-colors cursor-pointer">
                              <p className="text-xs font-bold text-[#14532D] dark:text-white">{n.title}</p>
                              <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8] line-clamp-1">{n.desc}</p>
                              <span className="text-[9px] text-[#64748B]/80 dark:text-[#94A3B8]/80">{n.time}</span>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            )}

            {/* Theme Toggle Button */}
            <button
              onClick={() => setTheme(effectiveTheme === 'dark' ? 'light' : 'dark')}
              className="h-[38px] w-[38px] flex items-center justify-center text-[#64748B] dark:text-[#94A3B8] hover:text-[#14532D] dark:hover:text-white transition-colors cursor-pointer rounded-lg hover:bg-[#EEF2ED] dark:hover:bg-[#1D322B]"
              title={`Switch to ${effectiveTheme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {effectiveTheme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* User Profile Dropdown OR Guest Buttons */}
            {user ? (
              <div className="relative flex-shrink-0 flex items-center">
                <button
                  onClick={() => toggleDropdown('profile')}
                  className="h-[38px] flex items-center gap-1.5 sm:gap-2 px-2 rounded-lg border border-[#E3DED2] dark:border-[#273E36] hover:bg-[#EEF2ED] dark:hover:bg-[#1D322B] transition-colors cursor-pointer whitespace-nowrap flex-shrink-0"
                  aria-expanded={activeDropdown === 'profile'}
                >
                  <div className="w-6 h-6 rounded-full bg-[#14532D] text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                    {user.name ? user.name[0].toUpperCase() : 'U'}
                  </div>
                  <span className="text-xs font-bold text-[#1F2933] dark:text-[#F7F5EF] hidden sm:inline max-w-[120px] truncate whitespace-nowrap">
                    {user.name || 'Account'}
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 text-[#64748B] transition-transform duration-200 flex-shrink-0 ${activeDropdown === 'profile' ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {activeDropdown === 'profile' && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.98 }}
                      transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                      className="nav-dropdown-flyout fixed top-[64px] right-3 left-auto sm:right-0 sm:absolute sm:top-[48px] w-64 sm:w-56 p-1.5 z-50 text-xs shadow-2xl"
                    >
                      <div className="px-3 py-2 border-b border-[#E3DED2] dark:border-[#273E36] mb-1">
                        <p className="font-bold text-sm text-[#1F2933] dark:text-white truncate">{user.name}</p>
                        <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8] truncate">{user.email}</p>
                      </div>

                      <div className="space-y-0.5">
                        {user.role === 'admin' && (
                          <Link
                            to="/admin/dashboard"
                            onClick={() => setActiveDropdown(null)}
                            className="flex items-center gap-2 px-3 py-2 rounded-md bg-sky-500/10 text-sky-600 dark:text-sky-400 font-bold hover:bg-sky-500/20 transition-colors mb-1"
                          >
                            <Shield className="w-3.5 h-3.5 text-sky-500" />
                            <span>Admin Portal</span>
                            <span className="ml-auto text-[9px] font-extrabold px-1.5 py-0.2 bg-sky-500 text-white rounded">
                              ADMIN
                            </span>
                          </Link>
                        )}
                        <Link
                          to="/dashboard/ai-workspace"
                          onClick={() => setActiveDropdown(null)}
                          className="flex items-center gap-2 px-3 py-2 rounded-md text-[#1F2933] dark:text-[#F7F5EF] hover:bg-[#EEF2ED] dark:hover:bg-[#1D322B] font-semibold transition-colors"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-[#E58A3A]" />
                          <span>AI Workspace</span>
                          <span className="ml-auto text-[9px] font-bold px-1.5 py-0.2 bg-[#E58A3A]/10 text-[#E58A3A] rounded">Hub</span>
                        </Link>
                        <Link
                          to="/dashboard/my-trips"
                          onClick={() => setActiveDropdown(null)}
                          className="flex items-center gap-2 px-3 py-2 rounded-md text-[#1F2933] dark:text-[#F7F5EF] hover:bg-[#EEF2ED] dark:hover:bg-[#1D322B] transition-colors"
                        >
                          <Train className="w-3.5 h-3.5 text-[#14532D] dark:text-[#EEF2ED]" />
                          <span>My Trips & Tickets</span>
                        </Link>
                        <Link
                          to="/dashboard/profile"
                          onClick={() => setActiveDropdown(null)}
                          className="flex items-center gap-2 px-3 py-2 rounded-md text-[#1F2933] dark:text-[#F7F5EF] hover:bg-[#EEF2ED] dark:hover:bg-[#1D322B] transition-colors"
                        >
                          <User className="w-3.5 h-3.5 text-[#14532D] dark:text-[#EEF2ED]" />
                          <span>Profile & Account</span>
                        </Link>
                        <Link
                          to="/dashboard/settings"
                          onClick={() => setActiveDropdown(null)}
                          className="flex items-center gap-2 px-3 py-2 rounded-md text-[#1F2933] dark:text-[#F7F5EF] hover:bg-[#EEF2ED] dark:hover:bg-[#1D322B] transition-colors"
                        >
                          <Settings className="w-3.5 h-3.5 text-[#14532D] dark:text-[#EEF2ED]" />
                          <span>Settings</span>
                        </Link>
                      </div>

                      <div className="pt-1 mt-1 border-t border-[#E3DED2] dark:border-[#273E36]">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-[#C53030] hover:bg-[#C53030]/10 transition-colors font-semibold"
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
                  className="px-3 py-1.5 text-xs font-bold text-[#14532D] dark:text-[#F7F5EF] hover:text-[#0F3F22] hover:bg-[#EEF2ED] dark:hover:bg-[#1D322B] rounded-lg transition-colors cursor-pointer"
                >
                  Log in
                </button>
                <button
                  onClick={() => openAuthModal('signup')}
                  className="px-3.5 py-1.5 text-xs font-bold text-white bg-[#14532D] hover:bg-[#0F3F22] dark:bg-[#E58A3A] dark:hover:bg-[#d97c28] rounded-lg transition-colors shadow-sm cursor-pointer"
                >
                  Sign Up
                </button>
              </div>
            )}

            {/* Primary Navigation CTA: Plan a Trip - Logged in only */}
            {user && (
              <Link
                to="/dashboard"
                className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#14532D] hover:bg-[#0F3F22] text-white font-bold text-xs tracking-tight transition-colors shadow-sm"
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Plan a Trip</span>
              </Link>
            )}

            {/* Mobile Menu Hamburger Button - Logged in only */}
            {user && (
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 md:hidden text-[#1F2933] dark:text-[#F7F5EF] rounded-lg hover:bg-[#EEF2ED] dark:hover:bg-[#1D322B] transition-colors"
                aria-label="Toggle Navigation Menu"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            )}

          </div>

        </div>
      </header>

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
              className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-lg bg-white dark:bg-[#1B2C28] border border-[#E3DED2] dark:border-[#2A403A] rounded-2xl shadow-2xl overflow-hidden z-10"
            >
              {/* Search Header */}
              <div className="p-3 border-b border-[#E3DED2] dark:border-[#2A403A] flex items-center gap-2.5">
                <Search className="w-4 h-4 text-[#66736F]" />
                <input
                  ref={commandInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Type a feature, tool, or destination..."
                  className="flex-1 bg-transparent text-sm font-medium outline-none text-[#263238] dark:text-[#F7F5EF] placeholder:text-[#66736F]"
                />
                <kbd className="nav-kbd">ESC</kbd>
              </div>

              {/* Filtered Result Items */}
              <div className="max-h-72 overflow-y-auto p-2 space-y-1">
                {filteredSearchItems.length === 0 ? (
                  <div className="p-6 text-center text-xs text-[#66736F]">
                    No matching travel tools found.
                  </div>
                ) : (
                  filteredSearchItems.map((item, idx) => (
                    <Link
                      key={idx}
                      to={item.to}
                      onClick={() => setIsCommandOpen(false)}
                      className="flex items-center justify-between p-2.5 rounded-lg hover:bg-[#EEF2ED] dark:hover:bg-[#213530] transition-colors group"
                    >
                      <div className="flex items-center gap-2.5">
                        <item.icon className="w-4 h-4 text-[#173F3A] dark:text-[#EEF2ED]" />
                        <span className="text-xs font-semibold text-[#263238] dark:text-[#F7F5EF]">
                          {item.title}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-[#66736F] uppercase tracking-wider">
                        {item.category}
                      </span>
                    </Link>
                  ))
                )}
              </div>

              {/* Command Palette Footer */}
              <div className="p-2 border-t border-[#E3DED2] dark:border-[#2A403A] bg-[#F7F5EF]/60 dark:bg-[#12201D]/60 flex items-center justify-between text-[11px] text-[#66736F]">
                <span>Navigation & Features Command Menu</span>
                <span className="flex items-center gap-1">Press <kbd className="nav-kbd">↵</kbd> to jump</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ====================================================================
          RESPONSIVE MOBILE DRAWER WITH ACCORDION SECTIONS
          ==================================================================== */}
      <AnimatePresence>
        {user && isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="md:hidden fixed top-[72px] left-0 right-0 max-h-[calc(100vh-72px)] overflow-y-auto bg-white dark:bg-[#1B2C28] border-b border-[#E3DED2] dark:border-[#2A403A] z-40 p-4 space-y-3 shadow-xl"
          >
            {/* Quick Command Trigger in Mobile */}
            <button
              onClick={() => { setIsMobileMenuOpen(false); setIsCommandOpen(true); }}
              className="w-full flex items-center gap-2 p-2.5 rounded-lg border border-[#E3DED2] dark:border-[#2A403A] bg-[#F7F5EF] dark:bg-[#12201D] text-xs text-[#66736F]"
            >
              <Search className="w-4 h-4" />
              <span>Search routes, tools, predictions...</span>
            </button>

            {/* Accordion 1: Explore & Book */}
            <div className="border-b border-[#EEF2ED] dark:border-[#213530] pb-2">
              <button
                onClick={() => setMobileAccordion(mobileAccordion === 'explore' ? null : 'explore')}
                className="w-full flex items-center justify-between py-2 text-sm font-bold text-[#173F3A] dark:text-[#F7F5EF]"
              >
                <span>Explore & Book</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${mobileAccordion === 'explore' ? 'rotate-180' : ''}`} />
              </button>
              {mobileAccordion === 'explore' && (
                <div className="space-y-1.5 pl-2 pt-1">
                  {EXPLORE_MENU.items.map((item, idx) => (
                    <Link
                      key={idx}
                      to={item.to}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-2 py-1.5 text-xs text-[#263238] dark:text-[#F7F5EF] hover:text-[#D96C4F]"
                    >
                      <item.icon className="w-3.5 h-3.5 text-[#173F3A] dark:text-[#EEF2ED]" />
                      <span>{item.title}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Accordion 2: AI Intelligence Suite */}
            <div className="border-b border-[#EEF2ED] dark:border-[#213530] pb-2">
              <button
                onClick={() => setMobileAccordion(mobileAccordion === 'ai' ? null : 'ai')}
                className="w-full flex items-center justify-between py-2 text-sm font-bold text-[#D96C4F]"
              >
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  <span>AI Intelligence Suite</span>
                </span>
                <ChevronDown className={`w-4 h-4 transition-transform ${mobileAccordion === 'ai' ? 'rotate-180' : ''}`} />
              </button>
              {mobileAccordion === 'ai' && (
                <div className="space-y-1.5 pl-2 pt-1">
                  <Link
                    to="/dashboard/ai-workspace"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-2 py-1.5 text-xs font-bold text-[#D96C4F]"
                  >
                    <Brain className="w-3.5 h-3.5" />
                    <span>AI Workspace (Command Hub)</span>
                  </Link>
                  {AI_SUITE_MENU.items.map((item, idx) => (
                    <Link
                      key={idx}
                      to={item.to}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-2 py-1.5 text-xs text-[#263238] dark:text-[#F7F5EF] hover:text-[#D96C4F]"
                    >
                      <item.icon className="w-3.5 h-3.5 text-[#173F3A] dark:text-[#EEF2ED]" />
                      <span>{item.title}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Accordion 3: Destinations */}
            <div className="border-b border-[#EEF2ED] dark:border-[#213530] pb-2">
              <button
                onClick={() => setMobileAccordion(mobileAccordion === 'destinations' ? null : 'destinations')}
                className="w-full flex items-center justify-between py-2 text-sm font-bold text-[#173F3A] dark:text-[#F7F5EF]"
              >
                <span>Destinations</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${mobileAccordion === 'destinations' ? 'rotate-180' : ''}`} />
              </button>
              {mobileAccordion === 'destinations' && (
                <div className="grid grid-cols-2 gap-2 pt-2">
                  {DESTINATIONS_MENU.map((city) => (
                    <Link
                      key={city.name}
                      to={city.to}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="p-2 rounded-lg bg-[#F7F5EF] dark:bg-[#12201D] border border-[#E3DED2] dark:border-[#2A403A] text-xs font-bold text-[#263238] dark:text-[#F7F5EF]"
                    >
                      {city.name}
                    </Link>
                  ))}
                  <Link
                    to="/destinations"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="col-span-2 text-xs font-bold text-[#D96C4F] py-1 text-center"
                  >
                    View All 50+ Cities →
                  </Link>
                </div>
              )}
            </div>

            {/* Direct Link: My Trips */}
            <Link
              to="/dashboard/my-trips"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block py-2 text-sm font-bold text-[#263238] dark:text-[#F7F5EF] border-b border-[#EEF2ED] dark:border-[#213530]"
            >
              My Trips & Bookings
            </Link>

            {/* Direct Link: Admin Portal for Mobile */}
            {user?.role === 'admin' && (
              <Link
                to="/admin/dashboard"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center justify-between py-2.5 px-3 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 font-bold text-sm border border-sky-500/30"
              >
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-sky-500" />
                  <span>Admin Command Panel</span>
                </div>
                <span className="text-[10px] font-extrabold px-1.5 py-0.5 bg-sky-500 text-white rounded">
                  PORTAL
                </span>
              </Link>
            )}

            {/* Auth / Account Actions */}
            <div className="pt-2">
              {user ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#263238] dark:text-white">Logged in as {user.name}</span>
                    <button
                      onClick={handleLogout}
                      className="text-xs font-bold text-[#B94A48]"
                    >
                      Log out
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => { openAuthModal('login'); setIsMobileMenuOpen(false); }}
                    className="flex-1 btn-secondary h-10 text-xs"
                  >
                    Log in
                  </button>
                  <button
                    onClick={() => { openAuthModal('signup'); setIsMobileMenuOpen(false); }}
                    className="flex-1 btn-primary h-10 text-xs"
                  >
                    Get Started
                  </button>
                </div>
              )}
            </div>

          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
