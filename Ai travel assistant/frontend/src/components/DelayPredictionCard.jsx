import React from 'react';
import { Clock, ShieldCheck, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function DelayPredictionCard({ delayData, loading }) {
  if (loading) {
    return (
      <div className="travel-card bg-[#FFFFFF] dark:bg-[#1B242E] border border-[#E3E7EA] dark:border-[#293644] rounded-xl p-5 animate-pulse space-y-3 shadow-sm">
        <div className="h-4 bg-[#F0F4F7] dark:bg-[#233240] rounded w-1/3" />
        <div className="h-8 bg-[#F0F4F7] dark:bg-[#233240] rounded w-1/2" />
        <div className="h-4 bg-[#F0F4F7] dark:bg-[#233240] rounded w-3/4" />
      </div>
    );
  }

  if (!delayData || (delayData.expected_arrival_delay_mins == null && delayData.delay_probability == null)) {
    return (
      <div className="travel-card bg-[#FFFFFF] dark:bg-[#1B242E] border border-[#E3E7EA] dark:border-[#293644] rounded-xl p-5 shadow-sm text-center">
        <div className="p-2 bg-[#F0F4F7] text-[#244C66] dark:bg-[#233240] dark:text-[#F0F4F7] rounded-lg w-fit mx-auto mb-2">
          <Clock className="w-5 h-5" />
        </div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-[#66736F] dark:text-[#A3B0AB] font-['Manrope']">Delay Prediction</h4>
        <p className="text-xs text-slate-500 mt-1">Telemetry telemetry unavailable for scheduled route</p>
      </div>
    );
  }

  const {
    expected_arrival_delay_mins = 0,
    expected_departure_delay_mins = 0,
    delay_probability = 10.0,
    confidence = 80.0
  } = delayData;

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
      className="travel-card relative overflow-hidden bg-[#FFFFFF] dark:bg-[#1B242E] border border-[#E3E7EA] dark:border-[#293644] rounded-xl p-5 shadow-sm transition-all"
    >
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-[#F0F4F7] text-[#244C66] dark:bg-[#233240] dark:text-[#F0F4F7] rounded-lg">
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
        <div className="text-2xl font-bold text-[#263238] dark:text-[#F7F8FA] flex items-baseline gap-1 font-['Manrope']">
          {expected_arrival_delay_mins} <span className="text-xs font-semibold text-[#66736F] dark:text-[#A3B0AB] font-['Inter']">Mins Expected</span>
        </div>
        <p className="text-[11px] text-[#66736F] dark:text-[#A3B0AB] font-['Inter']">Departure delay forecast: ~{expected_departure_delay_mins} mins</p>
      </div>

      {/* Confidence Score Gauge */}
      <div className="mt-4 space-y-1.5">
        <div className="flex justify-between items-center text-[10px] font-semibold uppercase tracking-wider text-[#66736F] dark:text-[#A3B0AB]">
          <span>Confidence</span>
          <span className="text-[#244C66] dark:text-[#F0F4F7] font-mono font-bold">{confidence}%</span>
        </div>
        <div className="w-full h-2 bg-[#F0F4F7] dark:bg-[#233240] rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${confidence}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="h-full bg-[#244C66] dark:bg-[#4F7D62] rounded-full"
          />
        </div>
      </div>
    </motion.div>
  );
}
