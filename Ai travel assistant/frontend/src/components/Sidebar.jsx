import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Compass, Train, Navigation, Utensils, User, Settings, 
  LogOut, ShieldAlert, Globe, ChevronLeft, ChevronRight, Menu, X, MoreVertical, Layers, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { getBackendBaseURL } from '../utils/api';

export default function Sidebar() {
  const location = useLocation();
  const { user, logout } = useAuth();
  
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Auto-collapse on tablet
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024 && window.innerWidth >= 768) {
        setIsCollapsed(true);
      } else if (window.innerWidth >= 1024) {
        setIsCollapsed(false);
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const mainItems = [
    { name: 'Dashboard', icon: Compass, to: '/dashboard' },
    { name: 'AI Workspace', icon: Sparkles, to: '/dashboard/ai-workspace' },
    { name: 'My Trips', icon: Train, to: '/dashboard/my-trips' },
    { name: 'Live Tracking', icon: Navigation, to: '/dashboard/track' },
    { name: 'Food Explorer', icon: Utensils, to: '/dashboard/food' },
    { name: '3D Station Map', icon: Layers, to: '/dashboard/station-3d' },
  ];

  const personalItems = [
    { name: 'Profile', icon: User, to: '/dashboard/profile' },
    { name: 'Settings', icon: Settings, to: '/dashboard/settings' },
  ];

  if (user?.role === 'admin') {
    personalItems.push({ name: 'Admin Portal', icon: ShieldAlert, to: '/admin/dashboard', isAdmin: true });
  }

  const getAvatarUrl = (img) => {
    if (!img) return '';
    if (img.startsWith('http://') || img.startsWith('https://')) return img;
    const API_BASE = getBackendBaseURL();
    return `${API_BASE}${img}`;
  };

  const sidebarVariants = {
    expanded: { width: '260px' },
    collapsed: { width: '80px' }
  };

  const mobileVariants = {
    closed: { x: '-100%' },
    open: { x: 0 }
  };

  const NavItem = ({ item, collapsed, isMobile }) => {
    const isActive = location.pathname === item.to;
    
    return (
      <Link
        to={item.to}
        onClick={() => setIsMobileOpen(false)}
        className={`group relative flex items-center gap-3 px-3 py-2.5 mx-3 rounded-lg transition-all duration-200 cursor-pointer overflow-hidden ${
          item.isAdmin
            ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 hover:bg-sky-500/20 font-bold'
            : isActive 
            ? 'bg-[#EEF2ED] dark:bg-[#213530] text-[#173F3A] dark:text-[#FFFFFF]' 
            : 'text-[#66736F] dark:text-[#A3B0AB] hover:text-[#263238] dark:hover:text-[#F7F5EF] hover:bg-[#EEF2ED] dark:hover:bg-[#213530]'
        }`}
      >
        {/* Active Left Accent Line */}
        {isActive && (
          <motion.div 
            layoutId={`activeTab-${isMobile ? 'mobile' : 'desktop'}`}
            className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-1/2 ${item.isAdmin ? 'bg-sky-500' : 'bg-[#173F3A] dark:bg-[#EEF2ED]'} rounded-r-full`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          />
        )}

        <div className="relative z-10 flex items-center w-full">
          <item.icon className={`w-5 h-5 flex-shrink-0 transition-transform duration-200 ${item.isAdmin ? 'text-sky-500' : isActive ? 'text-[#173F3A] dark:text-[#EEF2ED]' : 'group-hover:scale-110'}`} />
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="ml-3 font-medium text-sm whitespace-nowrap flex items-center justify-between flex-1"
              >
                <span>{item.name}</span>
                {item.isAdmin && (
                  <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-sky-500 text-white uppercase tracking-wider">
                    Admin
                  </span>
                )}
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Tooltip for collapsed state */}
        {collapsed && (
          <div className="absolute left-full ml-4 px-2.5 py-1.5 bg-[#FFFFFF] dark:bg-[#1B2C28] border border-[#E3DED2] dark:border-[#2A403A] text-[#263238] dark:text-[#F7F5EF] text-xs font-semibold rounded-lg shadow-sm opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap">
            {item.name}
          </div>
        )}
      </Link>
    );
  };

  const SidebarContent = ({ collapsed, isMobile }) => (
    <>
      <div className="p-5 flex items-center justify-between">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="bg-[#EEF2ED] dark:bg-[#213530] p-2 rounded-lg flex-shrink-0">
            <Globe className="w-5 h-5 text-[#173F3A] dark:text-[#EEF2ED]" />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.span 
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="font-bold text-lg tracking-tight text-[#263238] dark:text-[#F7F5EF] whitespace-nowrap ml-1 font-heading"
              >
                TravelIQ
              </motion.span>
            )}
          </AnimatePresence>
        </div>
        
        {/* Desktop Collapse Toggle */}
        {!isMobile && (
          <button 
            onClick={() => setIsCollapsed(!collapsed)}
            className="hidden md:flex p-1.5 rounded-lg text-[#66736F] dark:text-[#A3B0AB] hover:text-[#263238] dark:hover:text-[#F7F5EF] hover:bg-[#EEF2ED] dark:hover:bg-[#213530] transition-colors absolute -right-3 top-6 bg-[#F7F5EF] dark:bg-[#12201D] border border-[#E3DED2] dark:border-[#2A403A] z-10"
          >
            {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
          </button>
        )}

        {/* Mobile Close Toggle */}
        {isMobile && (
          <button onClick={() => setIsMobileOpen(false)} className="p-2 text-[#66736F] dark:text-[#A3B0AB] hover:text-[#263238] dark:hover:text-[#F7F5EF]">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto py-4 scrollbar-hide space-y-6">
        <div>
          <AnimatePresence>
            {!collapsed && (
              <motion.h3 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="px-6 text-[10px] font-bold text-[#66736F] dark:text-[#A3B0AB] uppercase tracking-widest mb-3"
              >
                Main
              </motion.h3>
            )}
          </AnimatePresence>
          <div className="space-y-1">
            {mainItems.map((item, idx) => <NavItem key={idx} item={item} collapsed={collapsed} isMobile={isMobile} />)}
          </div>
        </div>

        <div>
          <AnimatePresence>
            {!collapsed && (
              <motion.h3 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="px-6 text-[10px] font-bold text-[#66736F] dark:text-[#A3B0AB] uppercase tracking-widest mb-3"
              >
                Personal
              </motion.h3>
            )}
          </AnimatePresence>
          <div className="space-y-1">
            {personalItems.map((item, idx) => <NavItem key={idx} item={item} collapsed={collapsed} isMobile={isMobile} />)}
          </div>
        </div>
      </div>

      {/* Profile Section */}
      <div className="p-4 border-t border-[#E3DED2] dark:border-[#2A403A] relative">
        <button 
          onClick={() => setShowProfileMenu(!showProfileMenu)}
          className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-[#EEF2ED] dark:hover:bg-[#213530] transition-colors cursor-pointer group"
        >
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 rounded-full overflow-hidden border border-[#E3DED2] dark:border-[#2A403A] flex-shrink-0 group-hover:border-[#173F3A] dark:group-hover:border-[#EEF2ED] transition-colors">
              {user?.profile_image ? (
                <img src={getAvatarUrl(user?.profile_image)} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-[#EEF2ED] dark:bg-[#213530] flex items-center justify-center">
                  <User className="w-4 h-4 text-[#66736F] dark:text-[#A3B0AB]" />
                </div>
              )}
            </div>
            <AnimatePresence>
              {!collapsed && (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
                  className="flex flex-col items-start"
                >
                  <span className="text-sm font-semibold text-[#263238] dark:text-[#F7F5EF] whitespace-nowrap">{user?.name || 'Guest'}</span>
                  <span className="text-[10px] text-[#66736F] dark:text-[#A3B0AB] capitalize">{user?.role || 'User'}</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          {!collapsed && <MoreVertical className="w-4 h-4 text-[#66736F] dark:text-[#A3B0AB] group-hover:text-[#263238] dark:group-hover:text-[#F7F5EF] transition-colors" />}
        </button>

        {/* Profile Popover */}
        <AnimatePresence>
          {showProfileMenu && (
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className={`absolute bottom-full mb-2 bg-[#FFFFFF] dark:bg-[#1B2C28] border border-[#E3DED2] dark:border-[#2A403A] shadow-sm rounded-lg py-1 z-50 ${collapsed ? 'left-full ml-4 w-48' : 'left-4 right-4'}`}
            >
              <Link to="/dashboard/profile" className="flex items-center gap-3 px-4 py-2 text-sm text-[#66736F] dark:text-[#A3B0AB] hover:text-[#263238] dark:hover:text-[#F7F5EF] hover:bg-[#EEF2ED] dark:hover:bg-[#213530] transition-colors" onClick={() => setShowProfileMenu(false)}>
                <User className="w-4 h-4" /> Profile
              </Link>
              <Link to="/dashboard/settings" className="flex items-center gap-3 px-4 py-2 text-sm text-[#66736F] dark:text-[#A3B0AB] hover:text-[#263238] dark:hover:text-[#F7F5EF] hover:bg-[#EEF2ED] dark:hover:bg-[#213530] transition-colors" onClick={() => setShowProfileMenu(false)}>
                <Settings className="w-4 h-4" /> Settings
              </Link>
              <div className="my-1 border-t border-[#E3DED2] dark:border-[#2A403A]" />
              <button onClick={() => { setShowProfileMenu(false); logout(); }} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-[#B94A48] hover:bg-[#B94A48]/10 transition-colors cursor-pointer">
                <LogOut className="w-4 h-4" /> Logout
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Floating Button */}
      <button 
        onClick={() => setIsMobileOpen(true)}
        className="md:hidden fixed bottom-6 right-6 z-40 p-3 bg-[#173F3A] text-[#F7F5EF] rounded-full shadow-sm hover:bg-[#0F332F] transition-colors"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Mobile Slide Drawer Overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsMobileOpen(false)}
              className="md:hidden fixed inset-0 bg-[#263238]/60 backdrop-blur-sm z-50"
            />
            <motion.aside
              variants={mobileVariants}
              initial="closed"
              animate="open"
              exit="closed"
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="md:hidden fixed top-0 left-0 h-full w-72 bg-[#F7F5EF] dark:bg-[#12201D] border-r border-[#E3DED2] dark:border-[#2A403A] z-[60] flex flex-col"
            >
              <SidebarContent collapsed={false} isMobile={true} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Desktop & Tablet Sidebar */}
      <motion.aside
        variants={sidebarVariants}
        initial={false}
        animate={isCollapsed ? 'collapsed' : 'expanded'}
        transition={{ type: 'spring', damping: 20, stiffness: 200 }}
        className="hidden md:flex flex-col bg-[#F7F5EF] dark:bg-[#12201D] border-r border-[#E3DED2] dark:border-[#2A403A] h-screen relative z-30"
      >
        <SidebarContent collapsed={isCollapsed} isMobile={false} />
      </motion.aside>
    </>
  );
}
