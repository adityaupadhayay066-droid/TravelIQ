import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Compass, Train, Utensils, User, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function BottomNav() {
  const location = useLocation();
  const { user } = useAuth();

  if (!user || location.pathname.startsWith('/admin')) {
    return null;
  }

  const navItems = [
    { name: 'Search', icon: Compass, to: '/dashboard' },
    { name: 'AI Hub', icon: Sparkles, to: '/dashboard/ai-workspace' },
    { name: 'Trips', icon: Train, to: '/dashboard/my-trips' },
    { name: 'Food', icon: Utensils, to: '/dashboard/food' },
    { name: 'Profile', icon: User, to: '/dashboard/profile' },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 w-full bg-white dark:bg-[#1b2c28] border-t border-[#E3DED2] dark:border-[#2a403a] z-[90] pb-safe">
      <div className="flex justify-around items-center h-16 px-2">
        {navItems.map((item, idx) => {
          const isActive = location.pathname === item.to;
          return (
            <Link
              key={idx}
              to={item.to}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
                isActive ? 'text-[#D96C4F]' : 'text-[#66736F] dark:text-[#A3B0AB]'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[10px] font-bold">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
