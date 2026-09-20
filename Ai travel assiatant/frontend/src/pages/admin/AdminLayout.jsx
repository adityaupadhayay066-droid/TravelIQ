import React, { useState } from 'react';
import AdminSidebar from './AdminSidebar';
import AdminNavbar from './AdminNavbar';
import AdminSearch from './AdminSearch';

export default function AdminLayout({ children }) {
    const [collapsed, setCollapsed] = useState(false);
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);

    return (
        <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] flex relative transition-colors duration-200">
            {/* Sidebar */}
            <AdminSidebar
                collapsed={collapsed}
                setCollapsed={setCollapsed}
                isMobileOpen={isMobileOpen}
                setIsMobileOpen={setIsMobileOpen}
            />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
                <AdminNavbar
                    onOpenSearch={() => setIsSearchOpen(true)}
                    onOpenMobileSidebar={() => setIsMobileOpen(true)}
                />

                {/* Page Content Viewport */}
                <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
                    {children}
                </main>
            </div>

            {/* Global Command Palette */}
            <AdminSearch
                isOpen={isSearchOpen}
                onClose={() => setIsSearchOpen(false)}
            />
        </div>
    );
}
