import React from 'react';
import { CheckCircle2, AlertTriangle, Armchair } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SeatAvailabilityCard({ occupancyData, loading }) {
  if (loading) {
    return (
      <div className="bg-[#FFFFFF] dark:bg-[#1B2C28] border border-[#E3DED2] dark:border-[#2A403A] rounded-xl p-5 shadow-sm animate-pulse space-y-3">
        <div className="h-4 bg-[#EEF2ED] dark:bg-[#213530] rounded w-1/3" />
        <div className="h-8 bg-[#EEF2ED] dark:bg-[#213530] rounded w-1/2" />
        <div className="h-4 bg-[#EEF2ED] dark:bg-[#213530] rounded w-3/4" />
      </div>
    );
  }

  const {
    availability_probability = 76.0,
    expected_waiting_list = "Available",
    seat_demand = "Medium",
    coach_occupancy_percent = 72.0
  } = occupancyData || {};

  let wlRisk = "Low";
  let wlColor = "bg-[#4F7D62]/10 text-[#4F7D62] border border-[#4F7D62]/20 dark:bg-[#4F7D62]/20 dark:text-[#4F7D62] dark:border-[#4F7D62]/30";
  if (expected_waiting_list.includes("WL") || seat_demand === "High") {
    wlRisk = "High";
    wlColor = "bg-[#B94A48]/10 text-[#B94A48] border border-[#B94A48]/20 dark:bg-[#B94A48]/20 dark:text-[#B94A48] dark:border-[#B94A48]/30";
  } else if (seat_demand === "Medium") {
    wlRisk = "Medium";
    wlColor = "bg-[#E5B85C]/15 text-[#8F6B1A] border border-[#E5B85C]/30 dark:bg-[#E5B85C]/20 dark:text-[#E5B85C] dark:border-[#E5B85C]/30";
  }

  return (
    <motion.div 
      whileHover={{ y: -2 }}
      className="relative overflow-hidden bg-[#FFFFFF] dark:bg-[#1B2C28] border border-[#E3DED2] dark:border-[#2A403A] rounded-xl p-5 shadow-sm transition-all"
    >
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-[#EEF2ED] text-[#173F3A] dark:bg-[#213530] dark:text-[#EEF2ED] rounded-lg">
            <Armchair className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#66736F] dark:text-[#A3B0AB]">Seat Forecast</h4>
            <p className="text-xs text-[#263238]/70 dark:text-[#F7F5EF]/70 font-medium">Occupancy Estimator Net</p>
          </div>
        </div>
        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${wlColor}`}>
          WL Risk: {wlRisk}
        </span>
      </div>

      <div className="mt-4 space-y-1">
        <div className="text-2xl font-bold text-[#263238] dark:text-[#F7F5EF] flex items-baseline gap-1.5 font-['Manrope']">
          {availability_probability}% <span className="text-xs font-semibold text-[#66736F] dark:text-[#A3B0AB]">Availability</span>
        </div>
        <p className="text-[11px] text-[#66736F] dark:text-[#A3B0AB]">Coach booking density: ~{coach_occupancy_percent}%</p>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-[#E3DED2] dark:border-[#2A403A] pt-3">
        <span className="text-[10px] font-semibold text-[#66736F] dark:text-[#A3B0AB] uppercase tracking-wider">Status Forecast</span>
        <span className="text-xs font-semibold text-[#263238] dark:text-[#F7F5EF]">{expected_waiting_list}</span>
      </div>
    </motion.div>
  );
}
