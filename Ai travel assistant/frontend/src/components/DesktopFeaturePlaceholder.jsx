import React from 'react';
import { Monitor, Laptop, AlertCircle } from 'lucide-react';

export default function DesktopFeaturePlaceholder({
  title = "Desktop Recommended",
  description = "This feature is optimized for desktop and laptop devices for the best experience."
}) {
  return (
    <div className="travel-card bg-[#FFFFFF] dark:bg-[#1B242E] border border-[#E3E7EA] dark:border-[#293644] rounded-xl p-6 flex flex-col items-center justify-center text-center space-y-4 shadow-sm h-full min-h-[200px]">
      <div className="relative">
        <div className="bg-[#F0F4F7] dark:bg-[#233240] p-4 rounded-full border border-[#E3E7EA] dark:border-[#293644]">
          <Monitor className="w-8 h-8 text-[#244C66] dark:text-[#F0F4F7]" />
        </div>
        <div className="absolute -bottom-1 -right-1 bg-[#FDF1ED] dark:bg-[#2F2420] p-1.5 rounded-full border border-[#F8D7CD] dark:border-[#52332A]">
          <AlertCircle className="w-4 h-4 text-[#D96C4F]" />
        </div>
      </div>
      
      <div>
        <h3 className="text-[#263238] dark:text-[#F7F8FA] font-semibold text-base mb-2 font-['Manrope',sans-serif]">{title}</h3>
        <p className="text-[#66736F] dark:text-[#A3B0AB] text-xs leading-relaxed max-w-xs">{description}</p>
      </div>
      
      <div className="inline-flex gap-2 items-center text-xs text-[#66736F] dark:text-[#A3B0AB] font-medium bg-[#F7F8FA] dark:bg-[#121921] px-3 py-1.5 rounded-lg border border-[#E3E7EA] dark:border-[#293644]">
        <Laptop className="w-3.5 h-3.5 text-[#244C66] dark:text-[#F0F4F7]" />
        <span>Best viewed on larger screens</span>
      </div>
    </div>
  );
}
