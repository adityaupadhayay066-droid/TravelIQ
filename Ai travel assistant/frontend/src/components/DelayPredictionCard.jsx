import React from 'react';
import { Clock, ShieldCheck, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function DelayPredictionCard({ delayData, loading }) {
  if (loading) {
    return (
      <div className="travel-card bg-[#FFFFFF] dark:bg-[#1B2C28] border border-[#E3DED2] dark:border-[#2A403A] rounded-xl p-5 animate-pulse space-y-3 shadow-sm">
        <div className="h-4 bg-[#EEF2ED] dark:bg-[#213530] rounded w-1/3" />
        <div className="h-8 bg-[#EEF2ED] dark:bg-[#213530] rounded w-1/2" />
        <div className="h-4 bg-[#EEF2ED] dark:bg-[#213530] rounded w-3/4" />
      </div>
    );
  }

  const {
    expected_arrival_delay_mins = 18,
    expected_departure_delay_mins = 12,
    delay_probability = 35.0,
    confidence = 92.0
  } = delayData || {};

  const maxDelay = Math.max(expected_arrival_delay_mins, expected_departure_delay_mins);
  let risk = "Low";
  let riskColor = "bg-[#4F7D62]/10 text-[#4F7D62] border border-[#4F7D62]/25 dark:bg-[#4F7D62]/20 dark:text-[#6FA884] dark:border-[#4F7D62]/30";
  if (maxDelay > 30 || delay_probability > 60) {
    risk = "High";
    riskColor = "bg-[#B94A48]/10 text-[#B94A48] border border-[#B94A48]/25 dark:bg-[#B94A48]/20 dark:text-[#E07A78] dark:border-[#B94A48]/30";
  } else if (maxDelay > 10 || delay_probability > 30) {
    risk = "Medium";
    riskColor = "bg-[#E5B85C]/15 text-[#9E6E16] border border-[#E5B85C]/30 dark:bg-[#E5B85C]/20 dark:text-[#E5B85C] dark:border-[#E5B85C]/35";
  }

  return (
    <motion.div 
      whileHover={{ y: -2 }}
      className="travel-card relative overflow-hidden bg-[#FFFFFF] dark:bg-[#1B2C28] border border-[#E3DED2] dark:border-[#2A403A] rounded-xl p-5 shadow-sm transition-all"
    >
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-[#EEF2ED] text-[#173F3A] dark:bg-[#213530] dark:text-[#EEF2ED] rounded-lg">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#66736F] dark:text-[#A3B0AB] font-['Manrope']">Delay Prediction</h4>
            <p className="text-xs text-[#66736F] dark:text-[#A3B0AB] font-medium font-['Inter']">LSTM Neural Net Model</p>
          </div>
        </div>
        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${riskColor}`}>
          {risk} Risk
        </span>
      </div>

      <div className="mt-4 space-y-1">
        <div className="text-2xl font-bold text-[#263238] dark:text-[#F7F5EF] flex items-baseline gap-1 font-['Manrope']">
          {expected_arrival_delay_mins} <span className="text-xs font-semibold text-[#66736F] dark:text-[#A3B0AB] font-['Inter']">Mins Expected</span>
        </div>
        <p className="text-[11px] text-[#66736F] dark:text-[#A3B0AB] font-['Inter']">Departure delay forecast: ~{expected_departure_delay_mins} mins</p>
      </div>

      {/* Confidence Score Gauge */}
      <div className="mt-4 space-y-1.5">
        <div className="flex justify-between items-center text-[10px] font-semibold uppercase tracking-wider text-[#66736F] dark:text-[#A3B0AB]">
          <span>Confidence</span>
          <span className="text-[#173F3A] dark:text-[#EEF2ED] font-mono font-bold">{confidence}%</span>
        </div>
        <div className="w-full h-2 bg-[#EEF2ED] dark:bg-[#213530] rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${confidence}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="h-full bg-[#173F3A] dark:bg-[#4F7D62] rounded-full"
          />
        </div>
      </div>
    </motion.div>
  );
}
