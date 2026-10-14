import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Plus, Minus, Check, AlertCircle } from 'lucide-react';

export default function PassengerSelector({ value, config, onChange }) {
  const activeValue = value || config || { adults: 1, children: 0, infants: 0, seniors: 0 };
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const totalSeniors = activeValue.seniors || 0;
  const guardiansCount = (activeValue.adults || 0) + (activeValue.seniors || 0);

  // Close when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleIncrement = (type) => {
    const nextCounts = { ...activeValue, [type]: (activeValue[type] || 0) + 1 };
    
    // Safety check: Total passengers limit
    const total = (nextCounts.adults || 0) + (nextCounts.children || 0) + (nextCounts.infants || 0) + (nextCounts.seniors || 0);
    if (total > 9) return; // Standard airline/rail limit is 9 per PNR

    onChange(nextCounts);
  };

  const handleDecrement = (type) => {
    if (!activeValue[type] || activeValue[type] === 0) return;
    
    const nextCounts = { ...activeValue, [type]: activeValue[type] - 1 };

    // Validation: Total supervising guardians (Adults + Seniors) must be >= 1 if any children or infants are present
    const guardians = (nextCounts.adults || 0) + (nextCounts.seniors || 0);
    const dependents = (nextCounts.children || 0) + (nextCounts.infants || 0);

    if (dependents > 0 && guardians < 1) {
      return; // Cannot remove the last guardian if children/infants are traveling
    }

    if (type === 'adults' && nextCounts.adults === 0 && (nextCounts.seniors || 0) === 0) {
      return; // Must have at least 1 adult or senior traveler
    }

    onChange(nextCounts);
  };

  // Compute summary string
  const getSummary = () => {
    const parts = [];
    if (activeValue.adults > 0) parts.push(`${activeValue.adults} Adult${activeValue.adults > 1 ? 's' : ''}`);
    if (activeValue.seniors > 0) parts.push(`${activeValue.seniors} Senior${activeValue.seniors > 1 ? 's' : ''}`);
    if (activeValue.children > 0) parts.push(`${activeValue.children} Child${activeValue.children > 1 ? 'ren' : ''}`);
    if (activeValue.infants > 0) parts.push(`${activeValue.infants} Infant${activeValue.infants > 1 ? 's' : ''}`);
    
    if (parts.length === 0) return '1 Adult';
    return parts.join(', ');
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {/* Clickable selector box */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center bg-[#FFFFFF] dark:bg-[#162029] rounded-xl p-3 border border-[#E2E8F0] dark:border-[#283545] hover:border-[#244C66] dark:hover:border-[#75A4C4] transition-colors cursor-pointer h-[58px]"
      >
        <Users className="text-[#64748B] dark:text-[#94A3B8] w-5 h-5 mr-3 flex-shrink-0" />
        <div className="flex flex-col w-full overflow-hidden">
          <span className="text-[10px] text-[#64748B] dark:text-[#94A3B8] font-bold uppercase tracking-wider">Travellers</span>
          <span className="text-[#0F2942] dark:text-[#F8FAFC] text-xs sm:text-sm font-bold truncate block select-none">
            {getSummary()}
          </span>
        </div>
      </div>

      {/* Floating Animated Dropdown Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 5, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute left-0 lg:left-auto lg:right-0 top-full mt-2 w-[calc(100vw-2.5rem)] sm:w-80 max-w-sm bg-[#FFFFFF] dark:bg-[#1B242E] border border-[#E2E8F0] dark:border-[#283545] rounded-xl p-4 sm:p-5 shadow-lg z-[999] space-y-4"
          >
            <div className="flex justify-between items-center border-b border-[#E2E8F0] dark:border-[#283545] pb-2">
              <span className="text-xs font-bold uppercase tracking-widest text-[#0F2942] dark:text-[#F8FAFC]">Select Passengers</span>
              <span className="text-[10px] text-[#64748B] dark:text-[#94A3B8] bg-[#F1F5F9] dark:bg-[#233240] px-2 py-0.5 rounded font-mono font-bold">Max 9</span>
            </div>

            {/* Counters List */}
            <div className="space-y-4">
              {/* Adults */}
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-xs font-bold text-[#0F2942] dark:text-[#F8FAFC] leading-none">Adults</h4>
                  <span className="text-[9px] text-[#64748B] dark:text-[#94A3B8] mt-1 block">Ages 12+ years</span>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    type="button"
                    onClick={() => handleDecrement('adults')}
                    className="w-7 h-7 rounded-lg bg-[#F1F5F9] dark:bg-[#233240] hover:bg-[#E2E8F0] dark:hover:bg-[#2C3E50] border border-[#E2E8F0] dark:border-[#283545] text-[#0F2942] dark:text-[#F8FAFC] flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-sm font-bold text-[#0F2942] dark:text-[#F8FAFC] font-mono w-4 text-center">{activeValue.adults}</span>
                  <button 
                    type="button"
                    onClick={() => handleIncrement('adults')}
                    className="w-7 h-7 rounded-lg bg-[#F1F5F9] dark:bg-[#233240] hover:bg-[#E2E8F0] dark:hover:bg-[#2C3E50] border border-[#E2E8F0] dark:border-[#283545] text-[#0F2942] dark:text-[#F8FAFC] flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Seniors */}
              <div className="flex justify-between items-center mt-3">
                <div>
                  <h4 className="text-xs font-bold text-[#0F2942] dark:text-[#F8FAFC] leading-none">Senior Citizens</h4>
                  <span className="text-[9px] text-amber-600 dark:text-amber-400 mt-1 block font-semibold">Ages 60+ (Concession)</span>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    type="button"
                    onClick={() => handleDecrement('seniors')}
                    className="w-7 h-7 rounded-lg bg-[#F1F5F9] dark:bg-[#233240] hover:bg-[#E2E8F0] dark:hover:bg-[#2C3E50] border border-[#E2E8F0] dark:border-[#283545] text-[#0F2942] dark:text-[#F8FAFC] flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-sm font-bold text-[#0F2942] dark:text-[#F8FAFC] font-mono w-4 text-center">{activeValue.seniors}</span>
                  <button 
                    type="button"
                    onClick={() => handleIncrement('seniors')}
                    className="w-7 h-7 rounded-lg bg-[#F1F5F9] dark:bg-[#233240] hover:bg-[#E2E8F0] dark:hover:bg-[#2C3E50] border border-[#E2E8F0] dark:border-[#283545] text-[#0F2942] dark:text-[#F8FAFC] flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Children */}
              <div className="flex justify-between items-center mt-3">
                <div>
                  <h4 className="text-xs font-bold text-[#0F2942] dark:text-[#F8FAFC] leading-none">Children</h4>
                  <span className="text-[9px] text-[#64748B] dark:text-[#94A3B8] mt-1 block">Ages 2–11 years</span>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    type="button"
                    disabled={guardiansCount < 1}
                    onClick={() => handleDecrement('children')}
                    className="w-7 h-7 rounded-lg bg-[#F1F5F9] dark:bg-[#233240] hover:bg-[#E2E8F0] dark:hover:bg-[#2C3E50] border border-[#E2E8F0] dark:border-[#283545] text-[#0F2942] dark:text-[#F8FAFC] flex items-center justify-center transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-sm font-bold text-[#0F2942] dark:text-[#F8FAFC] font-mono w-4 text-center">{activeValue.children}</span>
                  <button 
                    type="button"
                    disabled={guardiansCount < 1}
                    onClick={() => handleIncrement('children')}
                    className="w-7 h-7 rounded-lg bg-[#F1F5F9] dark:bg-[#233240] hover:bg-[#E2E8F0] dark:hover:bg-[#2C3E50] border border-[#E2E8F0] dark:border-[#283545] text-[#0F2942] dark:text-[#F8FAFC] flex items-center justify-center transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Infants */}
              <div className="flex justify-between items-center mt-3">
                <div>
                  <h4 className="text-xs font-bold text-[#0F2942] dark:text-[#F8FAFC] leading-none">Infants</h4>
                  <span className="text-[9px] text-[#64748B] dark:text-[#94A3B8] mt-1 block">Under 2 years</span>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    type="button"
                    disabled={guardiansCount < 1}
                    onClick={() => handleDecrement('infants')}
                    className="w-7 h-7 rounded-lg bg-[#F1F5F9] dark:bg-[#233240] hover:bg-[#E2E8F0] dark:hover:bg-[#2C3E50] border border-[#E2E8F0] dark:border-[#283545] text-[#0F2942] dark:text-[#F8FAFC] flex items-center justify-center transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-sm font-bold text-[#0F2942] dark:text-[#F8FAFC] font-mono w-4 text-center">{activeValue.infants}</span>
                  <button 
                    type="button"
                    disabled={guardiansCount < 1}
                    onClick={() => handleIncrement('infants')}
                    className="w-7 h-7 rounded-lg bg-[#F1F5F9] dark:bg-[#233240] hover:bg-[#E2E8F0] dark:hover:bg-[#2C3E50] border border-[#E2E8F0] dark:border-[#283545] text-[#0F2942] dark:text-[#F8FAFC] flex items-center justify-center transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Senior Concession Info Alert */}
            {totalSeniors > 0 && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-[10px] text-[#0F2942] dark:text-[#F8FAFC] leading-normal flex items-start gap-2 mt-4"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-500" />
                <div>
                  <span className="font-bold block mb-0.5 text-amber-600 dark:text-amber-400">Senior Concession Activated</span>
                  Seniors are entitled to booking discounts. Male: 60+ (40% off), Female: 58+ (50% off). Select genders on checkout.
                </div>
              </motion.div>
            )}

            {/* Done button */}
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="w-full mt-4 bg-[#244C66] dark:bg-[#75A4C4] hover:bg-[#193B51] dark:hover:bg-[#6091B3] text-white dark:text-[#0F172A] rounded-xl py-2.5 text-xs font-bold cursor-pointer transition-colors flex items-center justify-center gap-1.5 shadow-sm"
            >
              <Check className="w-4 h-4" /> Apply Selection
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
