import React, { useState, useEffect } from 'react';
import { Sparkles, BrainCircuit } from 'lucide-react';
import { api } from '../utils/api';
import DelayPredictionCard from './DelayPredictionCard';
import FareForecastCard from './FareForecastCard';
import CrowdPredictionCard from './CrowdPredictionCard';
import SeatAvailabilityCard from './SeatAvailabilityCard';
import RiskAnalysisCard from './RiskAnalysisCard';

export default function AIInsightsCard({ source, destination, train }) {
  const [loading, setLoading] = useState(true);
  const [delayData, setDelayData] = useState(null);
  const [fareData, setFareData] = useState(null);
  const [crowdData, setCrowdData] = useState(null);
  const [occupancyData, setOccupancyData] = useState(null);

  useEffect(() => {
    let active = true;
    const fetchAIInsights = async () => {
      setLoading(true);
      try {
        const trainNum = train?.number || train?.train_number || '12301';
        const srcCode = typeof source === 'string' ? source : (source?.station_code || 'NDLS');
        const dstCode = typeof destination === 'string' ? destination : (destination?.station_code || 'BBS');
        const baseFare = train?.fare_inr || train?.fares?.['SL'] || 1250;

        // Fetch all predictions in parallel
        const [delayRes, fareRes, crowdRes, occRes] = await Promise.all([
          api.post('/ai/predict-delay', {
            train_number: trainNum,
            route: `${srcCode}-${dstCode}`,
            day_of_week: new Date().getDay() + 1,
            month: new Date().getMonth() + 1,
            season: 2,
            weather: 'Clear'
          }),
          api.post('/ai/predict-fare', {
            source: srcCode,
            destination: dstCode,
            class_code: 'SL',
            month: new Date().getMonth() + 1,
            season_code: 2,
            demand_score: 0.65,
            current_fare: baseFare
          }),
          api.post('/ai/predict-crowd', {
            station_code: srcCode,
            day_of_week: new Date().getDay() + 1,
            hour_of_day: new Date().getHours()
          }),
          api.post('/ai/predict-occupancy', {
            train_number: trainNum,
            class_code: 'SL',
            month: new Date().getMonth() + 1,
            day_of_week: new Date().getDay() + 1,
            season_code: 2
          })
        ]);

        if (active) {
          setDelayData(delayRes.data);
          setFareData(fareRes.data);
          setCrowdData(crowdRes.data);
          setOccupancyData(occRes.data);
        }
      } catch (err) {
        console.error("⚠️ Failed to fetch AI predictions:", err);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchAIInsights();
    return () => { active = false; };
  }, [source, destination, train]);

  return (
    <div className="bg-[#FFFFFF] dark:bg-[#1B2C28] border border-[#E3DED2] dark:border-[#2A403A] rounded-xl p-6 space-y-6 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-[#173F3A] dark:bg-[#EEF2ED] rounded-lg text-[#FFFFFF] dark:text-[#263238]">
          <BrainCircuit className="w-6 h-6" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-lg text-[#173F3A] dark:text-[#EEF2ED] font-['Manrope']">AI Travel Intelligence Insights</h3>
            <span className="flex items-center gap-1 bg-[#EEF2ED] dark:bg-[#213530] border border-[#E3DED2] dark:border-[#2A403A] text-[#173F3A] dark:text-[#EEF2ED] px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
              <Sparkles className="w-3 h-3" /> PyTorch Engine
            </span>
          </div>
          <p className="text-xs text-[#66736F] dark:text-[#A3B0AB] font-['Inter']">Deep learning predictions based on historical delays, fare trends, and platform density.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <DelayPredictionCard delayData={delayData} loading={loading} />
        <FareForecastCard fareData={fareData} loading={loading} />
        <CrowdPredictionCard crowdData={crowdData} loading={loading} />
        <SeatAvailabilityCard occupancyData={occupancyData} loading={loading} />
        <RiskAnalysisCard delayData={delayData} crowdData={crowdData} loading={loading} />
      </div>
    </div>
  );
}
