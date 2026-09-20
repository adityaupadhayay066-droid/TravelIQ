import React from 'react';
import { Activity, ShieldCheck, Database, BarChart2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ModelHealthCard({ modelKey, name, metrics }) {
  const {
    accuracy = 92.4,
    loss = 0.045,
    samples = 2000,
    status = "Active"
  } = metrics || {};

  return (
    <motion.div 
      whileHover={{ y: -2 }}
      className="travel-card bg-[#FFFFFF] dark:bg-[#1B2C28] border border-[#E3DED2] dark:border-[#2A403A] rounded-xl p-5 shadow-sm space-y-4"
    >
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-[#173F3A] dark:text-[#EEF2ED]" />
          <h4 className="font-semibold text-[#263238] dark:text-[#F7F5EF] text-sm">{name}</h4>
        </div>
        <div className="travel-badge bg-[#EEF2ED] dark:bg-[#213530] text-[#4F7D62] dark:text-[#4F7D62] border-[#E3DED2] dark:border-[#2A403A] py-0.5 px-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#4F7D62]" />
          <span className="text-[10px] font-bold uppercase tracking-wider">{status}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-left">
        <div className="bg-[#F7F5EF] dark:bg-[#213530] border border-[#E3DED2] dark:border-[#2A403A] rounded-lg p-3">
          <span className="text-[10px] font-semibold text-[#66736F] dark:text-[#A3B0AB] uppercase tracking-wider">Accuracy</span>
          <p className="text-lg font-bold text-[#173F3A] dark:text-[#EEF2ED] font-mono mt-0.5">{accuracy}%</p>
        </div>
        <div className="bg-[#F7F5EF] dark:bg-[#213530] border border-[#E3DED2] dark:border-[#2A403A] rounded-lg p-3">
          <span className="text-[10px] font-semibold text-[#66736F] dark:text-[#A3B0AB] uppercase tracking-wider">Loss</span>
          <p className="text-lg font-bold text-[#D96C4F] font-mono mt-0.5">{loss}</p>
        </div>
      </div>

      <div className="flex justify-between items-center text-xs font-medium text-[#66736F] dark:text-[#A3B0AB] border-t border-[#E3DED2] dark:border-[#2A403A] pt-3">
        <span className="flex items-center gap-1.5">
          <Database className="w-3.5 h-3.5 text-[#66736F] dark:text-[#A3B0AB]" />
          {samples} training samples
        </span>
        <span className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-[#4F7D62]" />
          Verif: 10-fold CV
        </span>
      </div>
    </motion.div>
  );
}
