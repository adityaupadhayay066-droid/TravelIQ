import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    LayoutDashboard, Users, Database, Train, MapPin, 
    Bus, Sparkles, Search, Flag, BarChart3, Activity, 
    Bell, Shield, Settings, LogOut, ChevronLeft, ChevronRight, 
    Compass, X, Key
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import UserAvatar from './UserAvatar';
import StatusBadge from './StatusBadge';

export const ADMIN_NAV_ITEMS = [
    { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'API Keys & B2B', path: '/admin/api-keys', icon: Key, badge: 'B2B' },
    { label: 'Users', path: '/admin/users', icon: Users },
    { label: 'Travel Data', path: '/admin/travel-data', icon: Database },
    { label: 'Trains', path: '/admin/trains', icon: Train },
    { label: 'Destinations', path: '/admin/destinations', icon: MapPin },
    { label: 'Transport', path: '/admin/transport', icon: Bus },
    { label: 'AI Assistant', path: '/admin/ai', icon: Sparkles, badge: 'AI' },
    { label: 'Searches & Activity', path: '/admin/searches', icon: Search },
    { label: 'Reports & Issues', path: '/admin/reports', icon: Flag },
    { label: 'Analytics', path: '/admin/analytics', icon: BarChart3 },
    { label: 'System Health', path: '/admin/system-health', icon: Activity },
    { label: 'Notifications', path: '/admin/notifications', icon: Bell },
    { label: 'Admin Management', path: '/admin/admins', icon: Shield },
    { label: 'Audit Logs', path: '/admin/logs', icon: Database },
    { label: 'Settings', path: '/admin/settings', icon: Settings },
];


export default function AdminSidebar({
    collapsed,
    setCollapsed,
    isMobileOpen,
    setIsMobileOpen
}) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = async () => {
        await logout();
        navigate('/admin/login');
    };

    const sidebarContent = (
        <div className="flex flex-col h-full bg-[var(--color-surface)] border-r border-[var(--color-border)] select-none shadow-sm relative">
            {/* Desktop Floating Collapse/Expand Toggle on Sidebar Divider */}
            <button
                onClick={() => setCollapsed(!collapsed)}
                className="hidden md:flex absolute -right-3 top-5 w-6 h-6 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] shadow-md items-center justify-center text-[var(--color-text-muted)] hover:text-sky-400 hover:border-sky-500/50 hover:scale-105 transition-all z-40 cursor-pointer"
                title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
                {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
            </button>

            {/* Header: Logo */}
            <div className={`flex items-center h-16 border-b border-[var(--color-border)] ${collapsed ? 'justify-center px-2' : 'justify-between px-4'}`}>
                <NavLink to="/admin/dashboard" className="flex items-center gap-2.5 overflow-hidden">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white font-black text-lg shadow-md shrink-0">
                        <Compass className="w-5 h-5 animate-spin-slow" />
                    </div>
                    {!collapsed && (
                        <div className="flex items-center gap-2">
                            <span className="text-base font-extrabold tracking-tight text-[var(--color-text)] font-heading">
                                Travel<span className="text-sky-500">IQ</span>
                            </span>
                            <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
                                Admin
                            </span>
                        </div>
                    )}
                </NavLink>

                {/* Mobile Close Button */}
                <button
                    onClick={() => setIsMobileOpen(false)}
                    className="md:hidden p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-soft)] cursor-pointer"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Navigation List */}
            <div className="flex-1 overflow-y-auto px-2.5 py-4 space-y-1 scrollbar-none">
                <div className={`text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-2 select-none ${collapsed ? 'text-center' : 'px-3'}`}>
                    {!collapsed ? 'Admin Modules' : '•••'}
                </div>
                {ADMIN_NAV_ITEMS.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path || (item.path !== '/admin/dashboard' && location.pathname.startsWith(item.path));

                    return (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            onClick={() => setIsMobileOpen(false)}
                            title={collapsed ? item.label : undefined}
                            className={`flex items-center rounded-xl text-xs font-semibold transition-all duration-150 relative overflow-hidden ${
                                collapsed
                                    ? 'w-10 h-10 mx-auto justify-center p-0'
                                    : 'gap-3 px-3.5 py-2.5'
                            } ${
                                isActive
                                    ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30 shadow-xs font-bold'
                                    : 'text-[var(--color-text)]/80 hover:text-[var(--color-text)] hover:bg-[var(--color-soft)] border border-transparent'
                            }`}
                        >
                            <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-sky-400' : 'text-[var(--color-text-muted)]'}`} />
                            {!collapsed && (
                                <span className="truncate flex-1">
                                    {item.label}
                                </span>
                            )}
                            {!collapsed && item.badge && (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-gradient-to-r from-cyan-500 to-purple-500 text-white shadow-xs">
                                    {item.badge}
                                </span>
                            )}
                            {isActive && !collapsed && (
                                <motion.div
                                    layoutId="activeAdminNavIndicator"
                                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-sky-400 shadow-sm"
                                    transition={{ duration: 0.2 }}
                                />
                            )}
                        </NavLink>
                    );
                })}
            </div>

            {/* Bottom: Admin Profile & Logout */}
            <div className={`p-2.5 border-t border-[var(--color-border)] bg-[var(--color-soft)]/30 ${collapsed ? 'flex flex-col items-center justify-center' : ''}`}>
                <div className={`flex items-center rounded-xl transition ${collapsed ? 'justify-center p-1' : 'justify-between gap-2 p-1.5 hover:bg-[var(--color-soft)]'}`}>
                    <div className="flex items-center gap-2.5 min-w-0">
                        <UserAvatar
                            name={user?.name || 'Admin User'}
                            email={user?.email || 'admin@traveliq.com'}
                            role={user?.admin_role || user?.role || 'admin'}
                            size={collapsed ? 'md' : 'sm'}
                            showBadge
                        />
                        {!collapsed && (
                            <div className="min-w-0 flex-1">
                                <div className="text-xs font-bold text-[var(--color-text)] truncate">
                                    {user?.name || 'Admin User'}
                                </div>
                                <div className="text-[10px] text-[var(--color-text-muted)] truncate flex items-center gap-1 mt-0.5">
                                    <span className="capitalize font-medium text-purple-400">
                                        {user?.admin_role ? user.admin_role.replace('_', ' ') : 'Administrator'}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    {!collapsed && (
                        <button
                            onClick={handleLogout}
                            title="Sign out from Admin Panel"
                            className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                        >
                            <LogOut className="w-4 h-4" />
                        </button>
                    )}
                </div>

                {collapsed && (
                    <button
                        onClick={handleLogout}
                        title="Logout"
                        className="mt-1.5 w-9 h-9 flex items-center justify-center rounded-xl text-[var(--color-text-muted)] hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                    >
                        <LogOut className="w-4 h-4" />
                    </button>
                )}
            </div>
        </div>
    );

    return (
        <>
            {/* Desktop / Laptop Persistent Sidebar (>= md 768px) */}
            <aside className={`hidden md:block shrink-0 transition-all duration-300 h-screen sticky top-0 z-30 ${collapsed ? 'w-20' : 'w-64'}`}>
                {sidebarContent}
            </aside>

            {/* Mobile / Tablet Drawer (< md 768px) */}
            <AnimatePresence>
                {isMobileOpen && (
                    <div className="fixed inset-0 z-50 md:hidden flex">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsMobileOpen(false)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
                        />
                        <motion.div
                            initial={{ x: -280 }}
                            animate={{ x: 0 }}
                            exit={{ x: -280 }}
                            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                            className="relative w-72 max-w-[85vw] h-full z-10 shadow-2xl"
                        >
                            {sidebarContent}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}
