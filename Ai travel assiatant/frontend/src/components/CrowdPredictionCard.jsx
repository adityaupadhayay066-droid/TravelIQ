import React from 'react';
import { Users, AlertCircle, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export default function CrowdPredictionCard({ crowdData, loading }) {
  if (loading) {
    return (
      <div className="bg-[#FFFFFF] dark:bg-[#1B2C28] border border-[#E3DED2] dark:border-[#2A403A] rounded-xl p-5 shadow-[0_4px_16px_rgba(23,63,58,0.06)] animate-pulse space-y-3">
        <div className="h-4 bg-[#EEF2ED] dark:bg-[#213530] rounded-md w-1/3" />
        <div className="h-8 bg-[#EEF2ED] dark:bg-[#213530] rounded-md w-1/2" />
        <div className="h-4 bg-[#EEF2ED] dark:bg-[#213530] rounded-md w-3/4" />
      </div>
    );
  }

  const {
    crowd_level = "High",
    expected_crowd_percent = 84.0,
    platform_congestion_percent = 78.0,
    peak_time_alert = true
  } = crowdData || {};

  let crowdColor = "bg-[#4F7D62]/10 text-[#4F7D62] dark:text-[#78A98E] border border-[#4F7D62]/25 dark:border-[#4F7D62]/40";
  if (crowd_level === "Very High" || crowd_level === "High") {
    crowdColor = "bg-[#D96C4F]/10 text-[#D96C4F] dark:text-[#E88B73] border border-[#D96C4F]/25 dark:border-[#D96C4F]/40";
  } else if (crowd_level === "Medium") {
    crowdColor = "bg-[#E5B85C]/15 text-[#9A731C] dark:text-[#E5B85C] border border-[#E5B85C]/30 dark:border-[#E5B85C]/40";
  }

  return (
    <motion.div 
      whileHover={{ y: -2 }}
      className="relative overflow-hidden bg-[#FFFFFF] dark:bg-[#1B2C28] border border-[#E3DED2] dark:border-[#2A403A] rounded-xl p-5 shadow-[0_4px_16px_rgba(23,63,58,0.06)] transition-all"
    >
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-[#EEF2ED] dark:bg-[#213530] text-[#173F3A] dark:text-[#EEF2ED] rounded-lg">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-['Manrope',sans-serif] text-xs font-bold uppercase tracking-wider text-[#66736F] dark:text-[#A3B0AB]">Crowd Prediction</h4>
            <p className="text-xs text-[#66736F] dark:text-[#A3B0AB] font-medium">Station Congestion Multi-task Net</p>
          </div>
        </div>
        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${crowdColor}`}>
          {crowd_level}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <div>
          <span className="text-[10px] font-bold text-[#66736F] dark:text-[#A3B0AB] uppercase tracking-wider">Station Crowd</span>
          <p className="font-['Manrope',sans-serif] text-xl font-bold text-[#263238] dark:text-[#F7F5EF]">{expected_crowd_percent}%</p>
        </div>
        <div>
          <span className="text-[10px] font-bold text-[#66736F] dark:text-[#A3B0AB] uppercase tracking-wider">Platform Congestion</span>
          <p className="font-['Manrope',sans-serif] text-xl font-bold text-[#263238] dark:text-[#F7F5EF]">{platform_congestion_percent}%</p>
        </div>
      </div>

      {peak_time_alert && (
        <div className="mt-4 flex items-center gap-2 bg-[#D96C4F]/10 border border-[#D96C4F]/25 dark:border-[#D96C4F]/35 rounded-lg p-2.5 text-[11px] text-[#D96C4F] dark:text-[#E88B73] font-medium">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>Peak travel hours alert! Avoid platforms if possible.</span>
        </div>
      )}

      {!peak_time_alert && (
        <div className="mt-4 flex items-center gap-2 bg-[#4F7D62]/10 border border-[#4F7D62]/25 dark:border-[#4F7D62]/35 rounded-lg p-2.5 text-[11px] text-[#4F7D62] dark:text-[#78A98E] font-medium">
          <Sparkles className="w-4 h-4 shrink-0" />
          <span>Optimal travel window. Platform traffic is stable.</span>
        </div>
      )}
    </motion.div>
  );
}
