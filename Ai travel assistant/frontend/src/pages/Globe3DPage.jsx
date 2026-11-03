import React, { lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Globe2, Plane, Leaf, Cloud, Loader2 } from 'lucide-react';

const Globe3D = lazy(() => import('../components/Globe3D'));

export default function Globe3DPage() {
  return (
    <div className="flex-1 w-full p-4 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <Link to="/dashboard/ai-workspace" className="p-2 hover:bg-[#F0F4F7] dark:hover:bg-[#233240] rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-[#66736F] dark:text-[#A3B0AB]" />
        </Link>
        <div className="p-2.5 bg-[#F0F4F7] dark:bg-[#233240] border border-[#E3E7EA] dark:border-[#293644] rounded-xl">
          <Globe2 className="w-6 h-6 text-[#244C66] dark:text-[#F0F4F7]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#263238] dark:text-[#F7F8FA]">3D Travel Globe</h1>
          <p className="text-[#66736F] dark:text-[#A3B0AB] text-sm">Explore global train routes, flight paths, cities, and carbon emissions on an interactive 3D globe.</p>
        </div>
      </div>

      {/* Globe Container */}
      <div className="travel-card border border-[#E3E7EA] dark:border-[#293644] bg-[#FFFFFF] dark:bg-[#1B242E] p-6 relative overflow-hidden rounded-xl shadow-sm" style={{ minHeight: '550px' }}>
        <Suspense fallback={
          <div className="w-full h-[450px] bg-[#F7F8FA] dark:bg-[#121921] rounded-xl flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-6 h-6 text-[#244C66] dark:text-[#F0F4F7] animate-spin" />
            <p className="text-[#66736F] dark:text-[#A3B0AB] text-sm">Loading globe...</p>
          </div>
        }>
          <Globe3D />
        </Suspense>

        {/* Layer Info Overlays */}
        <div className="absolute top-6 right-6 space-y-2 z-10 pointer-events-none">
          <div className="p-3 bg-[#FFFFFF]/95 dark:bg-[#1B242E]/95 shadow-sm border border-[#E3E7EA] dark:border-[#293644] rounded-xl flex items-center gap-2.5 pointer-events-auto">
            <Plane className="w-4 h-4 text-[#244C66] dark:text-[#F0F4F7]" />
            <div>
              <p className="text-[9px] text-[#66736F] dark:text-[#A3B0AB] font-bold uppercase tracking-widest">Flight Routes</p>
              <p className="text-xs font-bold text-[#263238] dark:text-[#F7F8FA]">6 active corridors</p>
            </div>
          </div>
          <div className="p-3 bg-[#FFFFFF]/95 dark:bg-[#1B242E]/95 shadow-sm border border-[#E3E7EA] dark:border-[#293644] rounded-xl flex items-center gap-2.5 pointer-events-auto">
            <Leaf className="w-4 h-4 text-[#4F7D62]" />
            <div>
              <p className="text-[9px] text-[#66736F] dark:text-[#A3B0AB] font-bold uppercase tracking-widest">Carbon Layer</p>
              <p className="text-xs font-bold text-[#263238] dark:text-[#F7F8FA]">Rail saves 84% CO₂</p>
            </div>
          </div>
          <div className="p-3 bg-[#FFFFFF]/95 dark:bg-[#1B242E]/95 shadow-sm border border-[#E3E7EA] dark:border-[#293644] rounded-xl flex items-center gap-2.5 pointer-events-auto">
            <Cloud className="w-4 h-4 text-[#D96C4F]" />
            <div>
              <p className="text-[9px] text-[#66736F] dark:text-[#A3B0AB] font-bold uppercase tracking-widest">Weather Layer</p>
              <p className="text-xs font-bold text-[#263238] dark:text-[#F7F8FA]">Clear skies globally</p>
            </div>
          </div>
        </div>
      </div>

      {/* City Hub Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {[
          { city: 'New Delhi', code: 'DEL' },
          { city: 'London', code: 'LHR' },
          { city: 'New York', code: 'JFK' },
          { city: 'Tokyo', code: 'NRT' },
          { city: 'Sydney', code: 'SYD' },
          { city: 'Dubai', code: 'DXB' },
          { city: 'Paris', code: 'CDG' },
        ].map((hub, i) => (
          <div key={i} className="p-3 travel-card border border-[#E3E7EA] dark:border-[#293644] bg-[#FFFFFF] dark:bg-[#1B242E] text-center rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <p className="text-lg font-bold text-[#244C66] dark:text-[#F0F4F7]">{hub.code}</p>
            <p className="text-[10px] text-[#66736F] dark:text-[#A3B0AB] font-semibold">{hub.city}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
