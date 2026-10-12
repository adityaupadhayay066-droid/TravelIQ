import React from 'react';
import Navbar from './Navbar';
import BottomNav from './BottomNav';

export default function DashboardLayout({ children }) {
  return (
    <div className="flex flex-col w-full min-h-screen bg-[#F7F8FA] dark:bg-[#121B24]">
      <Navbar />
      <main className="flex-1 w-full overflow-x-hidden bg-[#F7F8FA] dark:bg-[#121B24] pb-24 lg:pb-8">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
