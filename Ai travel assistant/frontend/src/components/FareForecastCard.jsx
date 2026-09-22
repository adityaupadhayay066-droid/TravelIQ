import React from 'react';
import { TrendingUp, TrendingDown, DollarSign, HelpCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function FareForecastCard({ fareData, loading }) {
  if (loading) {
    return (
      <div className="bg-[#FFFFFF] dark:bg-[#1B2C28] border border-[#E3DED2] dark:border-[#2A403A] rounded-xl p-5 space-y-3 shadow-sm">
        <div className="h-4 bg-[#EEF2ED] dark:bg-[#213530] rounded-lg w-1/3 animate-pulse" />
        <div className="h-8 bg-[#EEF2ED] dark:bg-[#213530] rounded-lg w-1/2 animate-pulse" />
        <div className="h-4 bg-[#EEF2ED] dark:bg-[#213530] rounded-lg w-3/4 animate-pulse" />
      </div>
    );
  }

  const {
    current_fare = 1250,
    forecasted_fare_7d = 1450,
    recommendation = "Book Now",
    demand_level = "High"
  } = fareData || {};

  const isBookNow = recommendation.toLowerCase().includes("book");
  const priceDiff = forecasted_fare_7d - current_fare;
  const pctDiff = ((priceDiff / current_fare) * 100).toFixed(1);

  return (
    <motion.div 
      whileHover={{ y: -2 }}
      className="relative overflow-hidden bg-[#FFFFFF] dark:bg-[#1B2C28] border border-[#E3DED2] dark:border-[#2A403A] rounded-xl p-5 shadow-sm transition-all"
    >
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-[#EEF2ED] dark:bg-[#213530] text-[#173F3A] dark:text-[#EEF2ED] rounded-lg">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#66736F] dark:text-[#A3B0AB] font-display">Smart Fare Prediction</h4>
            <p className="text-xs text-[#66736F] dark:text-[#A3B0AB] font-normal">GRU Price Regression Model</p>
          </div>
        </div>
        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider border ${
          isBookNow 
            ? 'bg-[#4F7D62]/10 text-[#4F7D62] border-[#4F7D62]/30 dark:bg-[#4F7D62]/20 dark:text-[#4F7D62]' 
            : 'bg-[#D96C4F]/10 text-[#D96C4F] border-[#D96C4F]/30 dark:bg-[#D96C4F]/20 dark:text-[#D96C4F]'
        }`}>
          {recommendation}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <div>
          <span className="text-[11px] font-semibold text-[#66736F] dark:text-[#A3B0AB] uppercase tracking-wider">Current Fare</span>
          <p className="text-xl font-bold text-[#263238] dark:text-[#F7F5EF] font-display">₹{current_fare}</p>
        </div>
        <div>
          <span className="text-[11px] font-semibold text-[#66736F] dark:text-[#A3B0AB] uppercase tracking-wider">Predicted 7D</span>
          <p className={`text-xl font-bold font-display ${priceDiff > 0 ? 'text-[#B94A48]' : 'text-[#4F7D62]'}`}>
            ₹{Math.round(forecasted_fare_7d)}
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-[#E3DED2] dark:border-[#2A403A] pt-3">
        <div className="flex items-center gap-1.5 text-[11px] text-[#66736F] dark:text-[#A3B0AB] font-medium">
          {priceDiff > 0 ? (
            <>
              <TrendingUp className="w-3.5 h-3.5 text-[#B94A48]" />
              <span>Fare rising by <span className="font-semibold text-[#B94A48]">+{pctDiff}%</span></span>
            </>
          ) : (
            <>
              <TrendingDown className="w-3.5 h-3.5 text-[#4F7D62]" />
              <span>Fare falling by <span className="font-semibold text-[#4F7D62]">{pctDiff}%</span></span>
            </>
          )}
        </div>
        <span className="text-[10px] font-bold text-[#66736F] dark:text-[#A3B0AB] bg-[#F7F5EF] dark:bg-[#213530] border border-[#E3DED2] dark:border-[#2A403A] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
          {demand_level} Demand
        </span>
      </div>
    </motion.div>
  );
}
