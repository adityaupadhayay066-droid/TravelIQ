import React from 'react';
import { Activity, ShieldCheck, Database, AlertCircle, Cpu } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ModelHealthCard({ modelKey, name, metrics }) {
  if (!metrics) {
    return (
      <div className="travel-card bg-[#FFFFFF] dark:bg-[#1B242E] border border-[#E3E7EA] dark:border-[#293644] rounded-xl p-5 shadow-sm space-y-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-[#66736F] dark:text-[#A3B0AB]" />
            <h4 className="font-semibold text-[#263238] dark:text-[#F7F8FA] text-sm">{name}</h4>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            Unbenchmarked
          </span>
        </div>
        <div className="p-4 bg-[#F7F8FA] dark:bg-[#233240] rounded-lg text-center border border-[#E3E7EA] dark:border-[#293644]">
          <AlertCircle className="w-6 h-6 mx-auto text-amber-500 mb-1" />
          <p className="text-xs font-medium text-[#66736F] dark:text-[#A3B0AB]">Evaluation Metrics Unavailable</p>
          <p className="text-[10px] text-[#8C9B96] dark:text-[#7A8E88] mt-0.5">Run model evaluation pipeline to generate verified performance benchmarks.</p>
        </div>
      </div>
    );
  }

  const modelType = metrics.model_type || 'unknown';
  const isSynthetic = metrics.dataset_provenance === 'synthetic_simulation';

  // Format primary metric depending on model architecture
  let primaryLabel = 'Loss';
  let primaryValue = metrics.test_loss != null ? metrics.test_loss : (metrics.loss != null ? metrics.loss : 'N/A');
  let secondaryLabel = 'Samples';
  let secondaryValue = `${metrics.train_samples || 0} tr / ${metrics.test_samples || 0} te`;

  if (modelType === 'classification') {
    primaryLabel = 'Accuracy';
    primaryValue = metrics.accuracy != null ? `${metrics.accuracy}%` : 'N/A';
    secondaryLabel = 'Macro-F1';
    secondaryValue = metrics.macro_f1 != null ? metrics.macro_f1 : 'N/A';
  } else if (modelType === 'regression') {
    if (metrics.arrival_delay_mae_minutes != null) {
      primaryLabel = 'Arrival MAE';
      primaryValue = `${metrics.arrival_delay_mae_minutes} min`;
      secondaryLabel = 'Delay Prob MAE';
      secondaryValue = metrics.delay_probability_mae != null ? metrics.delay_probability_mae : 'N/A';
    } else if (metrics.fare_mae_rupees != null) {
      primaryLabel = 'Fare MAE';
      primaryValue = `₹${metrics.fare_mae_rupees}`;
      secondaryLabel = 'Fare RMSE';
      secondaryValue = `₹${metrics.fare_rmse_rupees || 'N/A'}`;
    } else if (metrics.rating_mae_stars != null) {
      primaryLabel = 'Rating MAE';
      primaryValue = `${metrics.rating_mae_stars} ★`;
      secondaryLabel = 'RMSE';
      secondaryValue = `${metrics.rating_rmse_stars || 'N/A'} ★`;
    }
  } else if (modelType === 'time_series_forecasting') {
    primaryLabel = 'Demand MAE';
    primaryValue = `${metrics.demand_mae_passengers || 'N/A'} pax`;
    secondaryLabel = 'Test Loss';
    secondaryValue = metrics.test_loss != null ? metrics.test_loss : 'N/A';
  } else if (modelType === 'hybrid_classification_regression') {
    if (metrics.crowd_level_accuracy_pct != null) {
      primaryLabel = 'Level Acc';
      primaryValue = `${metrics.crowd_level_accuracy_pct}%`;
      secondaryLabel = 'Macro-F1';
      secondaryValue = metrics.crowd_level_macro_f1 != null ? metrics.crowd_level_macro_f1 : 'N/A';
    } else if (metrics.demand_level_accuracy_pct != null) {
      primaryLabel = 'Demand Acc';
      primaryValue = `${metrics.demand_level_accuracy_pct}%`;
      secondaryLabel = 'Occupancy MAE';
      secondaryValue = metrics.occupancy_mae_pct != null ? `${(metrics.occupancy_mae_pct * 100).toFixed(1)}%` : 'N/A';
    }
  }

  return (
    <motion.div 
      whileHover={{ y: -2 }}
      className="travel-card bg-[#FFFFFF] dark:bg-[#1B242E] border border-[#E3E7EA] dark:border-[#293644] rounded-xl p-5 shadow-sm space-y-4"
    >
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-[#244C66] dark:text-[#F0F4F7]" />
          <div>
            <h4 className="font-semibold text-[#263238] dark:text-[#F7F8FA] text-sm">{name}</h4>
            <span className="text-[10px] text-[#66736F] dark:text-[#A3B0AB] capitalize font-mono">
              {modelType.replace(/_/g, ' ')}
            </span>
          </div>
        </div>
        <div className="travel-badge bg-[#F0F4F7] dark:bg-[#233240] text-[#4F7D62] dark:text-[#4F7D62] border-[#E3E7EA] dark:border-[#293644] py-0.5 px-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#4F7D62]" />
          <span className="text-[10px] font-bold uppercase tracking-wider">{metrics.status || 'Active'}</span>
        </div>
      </div>

      {isSynthetic && (
        <div className="px-2.5 py-1 rounded bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-[10px] font-semibold flex items-center justify-between">
          <span>⚠️ Synthetic Simulation Benchmark</span>
          <span className="font-mono text-[9px] opacity-80">v{metrics.model_version || '1.0.0'}</span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 text-left">
        <div className="bg-[#F7F8FA] dark:bg-[#233240] border border-[#E3E7EA] dark:border-[#293644] rounded-lg p-3">
          <span className="text-[10px] font-semibold text-[#66736F] dark:text-[#A3B0AB] uppercase tracking-wider">{primaryLabel}</span>
          <p className="text-lg font-bold text-[#244C66] dark:text-[#F0F4F7] font-mono mt-0.5">{primaryValue}</p>
        </div>
        <div className="bg-[#F7F8FA] dark:bg-[#233240] border border-[#E3E7EA] dark:border-[#293644] rounded-lg p-3">
          <span className="text-[10px] font-semibold text-[#66736F] dark:text-[#A3B0AB] uppercase tracking-wider">{secondaryLabel}</span>
          <p className="text-lg font-bold text-[#D96C4F] font-mono mt-0.5">{secondaryValue}</p>
        </div>
      </div>

      <div className="flex justify-between items-center text-xs font-medium text-[#66736F] dark:text-[#A3B0AB] border-t border-[#E3E7EA] dark:border-[#293644] pt-3">
        <span className="flex items-center gap-1.5">
          <Database className="w-3.5 h-3.5 text-[#66736F] dark:text-[#A3B0AB]" />
          {metrics.train_samples ? `${metrics.train_samples} tr / ${metrics.test_samples} te` : 'Evaluated samples'}
        </span>
        <span className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-[#4F7D62]" />
          {metrics.split_method || '80/20 Holdout'}
        </span>
      </div>
    </motion.div>
  );
}
