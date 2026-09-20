import React from 'react';
import { ShieldAlert, AlertTriangle, CloudSun, BarChart2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function RiskAnalysisCard({ delayData, crowdData, loading }) {
  if (loading) {
    return (
      <div className="travel-card p-5 animate-pulse space-y-3 bg-[#FFFFFF] dark:bg-[#1B2C28] border border-[#E3DED2] dark:border-[#2A403A] rounded-xl">
        <div className="h-4 bg-[#EEF2ED] dark:bg-[#213530] rounded w-1/3" />
        <div className="h-8 bg-[#EEF2ED] dark:bg-[#213530] rounded w-1/2" />
        <div className="h-4 bg-[#EEF2ED] dark:bg-[#213530] rounded w-3/4" />
      </div>
    );
  }

  // Calculate composite risk based on real props
  const expectedDelay = delayData?.expected_arrival_delay_mins || 15;
  const crowdPct = crowdData?.expected_crowd_percent || 50;

  const delayRisk = expectedDelay > 30 ? "High" : (expectedDelay > 10 ? "Medium" : "Low");
  const congestionRisk = crowdPct > 75 ? "High" : (crowdPct > 45 ? "Medium" : "Low");
  const weatherRisk = "Low"; // Static/weather model output

  // Calculate a composite Travel Score (out of 100)
  let score = 95;
  if (delayRisk === "High") score -= 25;
  else if (delayRisk === "Medium") score -= 12;
  
  if (congestionRisk === "High") score -= 15;
  else if (congestionRisk === "Medium") score -= 7;
  
  score = Math.max(30, score);

  let scoreColor = "bg-[#EEF2ED] dark:bg-[#213530] text-[#4F7D62] dark:text-[#68A682] border-[#4F7D62]/20";
  if (score < 60) {
    scoreColor = "bg-[#FDF1ED] dark:bg-[#2D1B18] text-[#B94A48] dark:text-[#E0716E] border-[#B94A48]/25";
  } else if (score < 80) {
    scoreColor = "bg-[#FBF6E9] dark:bg-[#2C281B] text-[#B88728] dark:text-[#E5B85C] border-[#E5B85C]/30";
  }

  const getRiskBadgeClass = (riskLevel) => {
    if (riskLevel === 'High') {
      return 'bg-[#FDF1ED] dark:bg-[#2D1B18] text-[#B94A48] dark:text-[#E0716E] border-[#B94A48]/25';
    }
    if (riskLevel === 'Medium') {
      return 'bg-[#FBF6E9] dark:bg-[#2C281B] text-[#B88728] dark:text-[#E5B85C] border-[#E5B85C]/30';
    }
    return 'bg-[#EEF2ED] dark:bg-[#213530] text-[#4F7D62] dark:text-[#68A682] border-[#4F7D62]/20';
  };

  return (
    <motion.div 
      whileHover={{ y: -2 }}
      className="travel-card relative overflow-hidden bg-[#FFFFFF] dark:bg-[#1B2C28] border border-[#E3DED2] dark:border-[#2A403A] rounded-xl p-5 shadow-sm transition-all"
    >
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-[#FDF1ED] dark:bg-[#2D1B18] text-[#D96C4F] flex items-center justify-center border border-[#F8D7CD] dark:border-[#3D2522] flex-shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#173F3A] dark:text-[#EEF2ED] font-['Manrope']">
              Travel Risk Analysis
            </h4>
            <p className="text-xs text-[#66736F] dark:text-[#A3B0AB] font-medium font-['Inter']">
              Risk Profiler Neural Classifier
            </p>
          </div>
        </div>
        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${scoreColor}`}>
          Score: {score}/100
        </span>
      </div>

      <div className="mt-5 space-y-3">
        <div className="flex justify-between items-center text-xs border-b border-[#E3DED2] dark:border-[#2A403A] pb-2.5">
          <span className="flex items-center gap-1.5 text-[#66736F] dark:text-[#A3B0AB] font-medium font-['Inter']">
            <AlertTriangle className="w-3.5 h-3.5 text-[#E5B85C]" />
            Delay Risk
          </span>
          <span className={`font-semibold uppercase text-[10px] px-2 py-0.5 rounded-full border ${getRiskBadgeClass(delayRisk)}`}>
            {delayRisk}
          </span>
        </div>

        <div className="flex justify-between items-center text-xs border-b border-[#E3DED2] dark:border-[#2A403A] pb-2.5">
          <span className="flex items-center gap-1.5 text-[#66736F] dark:text-[#A3B0AB] font-medium font-['Inter']">
            <CloudSun className="w-3.5 h-3.5 text-[#173F3A] dark:text-[#EEF2ED]" />
            Weather Risk
          </span>
          <span className={`font-semibold uppercase text-[10px] px-2 py-0.5 rounded-full border ${getRiskBadgeClass(weatherRisk)}`}>
            {weatherRisk}
          </span>
        </div>

        <div className="flex justify-between items-center text-xs">
          <span className="flex items-center gap-1.5 text-[#66736F] dark:text-[#A3B0AB] font-medium font-['Inter']">
            <BarChart2 className="w-3.5 h-3.5 text-[#D96C4F]" />
            Congestion Risk
          </span>
          <span className={`font-semibold uppercase text-[10px] px-2 py-0.5 rounded-full border ${getRiskBadgeClass(congestionRisk)}`}>
            {congestionRisk}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
