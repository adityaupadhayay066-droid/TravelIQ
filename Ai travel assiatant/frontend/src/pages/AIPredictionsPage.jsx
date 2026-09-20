import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, BarChart3, Clock, DollarSign, MapPin, Heart, AlertTriangle, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar } from 'recharts';
import axios from 'axios';
import toast from 'react-hot-toast';

const API = '/api';

const demandData = [
  { day: 'Mon', NDLS_BBS: 78, CSMT_NDLS: 52 }, { day: 'Tue', NDLS_BBS: 85, CSMT_NDLS: 64 },
  { day: 'Wed', NDLS_BBS: 94, CSMT_NDLS: 70 }, { day: 'Thu', NDLS_BBS: 82, CSMT_NDLS: 59 },
  { day: 'Fri', NDLS_BBS: 98, CSMT_NDLS: 85 }, { day: 'Sat', NDLS_BBS: 110, CSMT_NDLS: 92 },
  { day: 'Sun', NDLS_BBS: 115, CSMT_NDLS: 96 }
];

const riskData = [
  { route: 'NDLS-BBS', delay: 12, crowd: 65, safety: 95 },
  { route: 'CSMT-NDLS', delay: 8, crowd: 78, safety: 92 },
  { route: 'HWH-BBS', delay: 22, crowd: 45, safety: 88 },
  { route: 'NDLS-JP', delay: 5, crowd: 55, safety: 97 }
];

function PredictionCard({ icon: Icon, color, title, children, onSubmit, submitLabel, submitColor }) {
  return (
    <div className="p-6 bg-[#FFFFFF] dark:bg-[#1B2C28] border border-[#E3DED2] dark:border-[#2A403A] rounded-xl shadow-sm space-y-4">
      <div className="flex items-center gap-2">
        <Icon className={`w-5 h-5 ${color}`} />
        <h3 className="text-base font-bold text-[#263238] dark:text-[#F7F5EF] font-manrope">{title}</h3>
      </div>
      <form onSubmit={onSubmit} className="space-y-3">
        {children}
        <button type="submit" className={`w-full py-2.5 ${submitColor || 'bg-[#173F3A] hover:bg-[#0F332F] dark:bg-[#EEF2ED] dark:hover:bg-[#FFFFFF] text-white dark:text-[#12201D]'} font-bold text-sm rounded-lg cursor-pointer transition-colors`}>
          {submitLabel || 'Predict'}
        </button>
      </form>
    </div>
  );
}

function ResultPanel({ result, fields }) {
  if (!result) return null;
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-[#F7F5EF] dark:bg-[#12201D] border border-[#E3DED2] dark:border-[#2A403A] rounded-xl space-y-2 text-xs mt-3">
      {fields.map((f, i) => (
        <div key={i} className="flex justify-between">
          <span className="text-[#66736F] dark:text-[#A3B0AB]">{f.label}</span>
          <span className={`font-bold ${f.color || 'text-[#263238] dark:text-[#F7F5EF]'}`}>{f.value(result)}</span>
        </div>
      ))}
    </motion.div>
  );
}

export default function AIPredictionsPage() {
  const [delayIn, setDelayIn] = useState({ train_number: '12301', route: 'NDLS-BBS', day_of_week: 1, month: 6, season: 2, weather: 'Clear' });
  const [delayOut, setDelayOut] = useState(null);
  const [fareIn, setFareIn] = useState({ source: 'NDLS', destination: 'BBS', class_code: '3A', month: 6, season_code: 2, demand_score: 0.65, current_fare: 1850 });
  const [fareOut, setFareOut] = useState(null);
  const [crowdIn, setCrowdIn] = useState({ station_code: 'NDLS', day_of_week: 1, hour_of_day: 16 });
  const [crowdOut, setCrowdOut] = useState(null);
  const [occIn, setOccIn] = useState({ train_number: '12301', class_code: '3A', month: 6, day_of_week: 1, season_code: 2 });
  const [occOut, setOccOut] = useState(null);

  const submit = async (endpoint, body, setter) => {
    try { const r = await axios.post(`${API}/ai/${endpoint}`, body); setter(r.data); } catch { toast.error('Prediction service error'); }
  };

  const inp = (val, setter, field, label, type = 'text') => (
    <div>
      <label className="text-xs text-[#66736F] dark:text-[#A3B0AB] block mb-1">{label}</label>
      <input type={type} value={val[field]} onChange={e => setter(p => ({ ...p, [field]: type === 'number' ? Number(e.target.value) : e.target.value }))}
        className="w-full px-3 py-2 bg-[#FFFFFF] dark:bg-[#1B2C28] border border-[#E3DED2] dark:border-[#2A403A] rounded-lg text-[#263238] dark:text-[#F7F5EF] text-sm focus:outline-none focus:ring-2 focus:ring-[#173F3A] dark:focus:ring-[#EEF2ED]" />
    </div>
  );

  return (
    <div className="flex-1 w-full p-4 lg:p-8 space-y-6 max-w-7xl mx-auto font-inter">
      <div className="flex items-center gap-3 mb-2">
        <Link to="/dashboard/ai-workspace" className="p-2 hover:bg-[#E3DED2]/50 dark:hover:bg-[#2A403A]/50 rounded-xl transition-colors">
          <ArrowLeft className="w-5 h-5 text-[#66736F] dark:text-[#A3B0AB]" />
        </Link>
        <div className="p-2.5 bg-[#EEF2ED] dark:bg-[#213530] border border-[#E3DED2] dark:border-[#2A403A] rounded-xl">
          <BarChart3 className="w-6 h-6 text-[#173F3A] dark:text-[#EEF2ED]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#263238] dark:text-[#F7F5EF] font-manrope">AI Travel Predictions</h1>
          <p className="text-[#66736F] dark:text-[#A3B0AB] text-sm">LSTM neural network predictions for delays, fares, crowd density, and coach occupancy.</p>
        </div>
      </div>

      {/* Prediction Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Delay */}
        <div>
          <PredictionCard icon={Clock} color="text-[#D96C4F]" title="Train Delay Predictor" submitLabel="Calculate Delay" submitColor="bg-[#D96C4F] hover:bg-[#C75D43] text-white"
            onSubmit={e => { e.preventDefault(); submit('predict-delay', delayIn, setDelayOut); }}>
            <div className="grid grid-cols-2 gap-3 text-xs">
              {inp(delayIn, setDelayIn, 'train_number', 'Train Number')}
              {inp(delayIn, setDelayIn, 'route', 'Route')}
              {inp(delayIn, setDelayIn, 'day_of_week', 'Day (1-7)', 'number')}
              <div>
                <label className="text-xs text-[#66736F] dark:text-[#A3B0AB] block mb-1">Weather</label>
                <select value={delayIn.weather} onChange={e => setDelayIn(p => ({ ...p, weather: e.target.value }))} className="w-full px-3 py-2 bg-[#FFFFFF] dark:bg-[#1B2C28] border border-[#E3DED2] dark:border-[#2A403A] rounded-lg text-[#263238] dark:text-[#F7F5EF] text-sm focus:outline-none focus:ring-2 focus:ring-[#173F3A] dark:focus:ring-[#EEF2ED]">
                  <option value="Clear">Clear</option><option value="Foggy">Foggy</option><option value="Heavy Rain">Heavy Rain</option>
                </select>
              </div>
            </div>
          </PredictionCard>
          <ResultPanel result={delayOut} fields={[
            { label: 'Delay Probability', value: r => `${r.delay_probability}%`, color: 'text-[#D96C4F]' },
            { label: 'Arrival Delay', value: r => `${r.expected_arrival_delay_mins} mins` },
            { label: 'Departure Delay', value: r => `${r.expected_departure_delay_mins} mins` },
            { label: 'Confidence', value: r => `${r.confidence}%`, color: 'text-[#173F3A] dark:text-[#EEF2ED]' }
          ]} />
        </div>

        {/* Fare */}
        <div>
          <PredictionCard icon={DollarSign} color="text-[#173F3A] dark:text-[#EEF2ED]" title="Fare Trend Forecaster" submitLabel="Forecast 7-Day Fare" submitColor="bg-[#173F3A] hover:bg-[#0F332F] dark:bg-[#EEF2ED] dark:hover:bg-[#FFFFFF] text-white dark:text-[#12201D]"
            onSubmit={e => { e.preventDefault(); submit('predict-fare', fareIn, setFareOut); }}>
            <div className="grid grid-cols-2 gap-3 text-xs">
              {inp(fareIn, setFareIn, 'source', 'Source')}
              {inp(fareIn, setFareIn, 'destination', 'Destination')}
              {inp(fareIn, setFareIn, 'class_code', 'Class')}
              {inp(fareIn, setFareIn, 'current_fare', 'Current Fare ₹', 'number')}
            </div>
          </PredictionCard>
          <ResultPanel result={fareOut} fields={[
            { label: 'Current Fare', value: r => `₹${r.current_fare}` },
            { label: 'Predicted 7d Fare', value: r => `₹${r.forecasted_fare_7d}`, color: 'text-[#173F3A] dark:text-[#EEF2ED]' },
            { label: 'Action', value: r => r.recommendation, color: r => r?.recommendation === 'Book Now' ? 'text-[#173F3A] dark:text-[#EEF2ED]' : 'text-[#E5B85C]' },
            { label: 'Demand', value: r => r.demand_level }
          ]} />
        </div>

        {/* Crowd */}
        <div>
          <PredictionCard icon={MapPin} color="text-[#E5B85C]" title="Station Crowd Density" submitLabel="Analyze Crowd" submitColor="bg-[#E5B85C] hover:bg-[#D4A74B] text-[#263238]"
            onSubmit={e => { e.preventDefault(); submit('predict-crowd', crowdIn, setCrowdOut); }}>
            <div className="grid grid-cols-3 gap-3 text-xs">
              {inp(crowdIn, setCrowdIn, 'station_code', 'Station Code')}
              {inp(crowdIn, setCrowdIn, 'day_of_week', 'Day', 'number')}
              {inp(crowdIn, setCrowdIn, 'hour_of_day', 'Hour', 'number')}
            </div>
          </PredictionCard>
          <ResultPanel result={crowdOut} fields={[
            { label: 'Crowd Level', value: r => r.crowd_level, color: 'text-[#E5B85C]' },
            { label: 'Expected %', value: r => `${r.expected_crowd_percent}%` },
            { label: 'Platform Congestion', value: r => `${r.platform_congestion_percent}%` }
          ]} />
        </div>

        {/* Occupancy */}
        <div>
          <PredictionCard icon={Heart} color="text-[#66736F] dark:text-[#A3B0AB]" title="Coach Occupancy Estimator" submitLabel="Analyze Seats" submitColor="bg-[#263238] hover:bg-[#1A2327] dark:bg-[#A3B0AB] dark:hover:bg-[#F7F5EF] text-white dark:text-[#12201D]"
            onSubmit={e => { e.preventDefault(); submit('predict-occupancy', occIn, setOccOut); }}>
            <div className="grid grid-cols-3 gap-3 text-xs">
              {inp(occIn, setOccIn, 'train_number', 'Train No.')}
              {inp(occIn, setOccIn, 'class_code', 'Class')}
              {inp(occIn, setOccIn, 'month', 'Month', 'number')}
            </div>
          </PredictionCard>
          <ResultPanel result={occOut} fields={[
            { label: 'Occupancy', value: r => `${r.coach_occupancy_percent}%` },
            { label: 'Confirmation Prob', value: r => `${r.availability_probability}%`, color: 'text-[#173F3A] dark:text-[#EEF2ED]' },
            { label: 'Waiting List', value: r => `${r.expected_waiting_list} count` }
          ]} />
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 bg-[#FFFFFF] dark:bg-[#1B2C28] border border-[#E3DED2] dark:border-[#2A403A] rounded-xl shadow-sm">
          <h3 className="text-sm font-bold text-[#263238] dark:text-[#F7F5EF] font-manrope mb-4 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-[#173F3A] dark:text-[#EEF2ED]" /> LSTM Demand Index Forecast</h3>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={demandData} margin={{ top: 5, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border, #E3DED2)" />
                <XAxis dataKey="day" stroke="var(--color-text-muted, #66736F)" fontSize={10} /><YAxis stroke="var(--color-text-muted, #66736F)" fontSize={10} />
                <Tooltip contentStyle={{ background: 'var(--color-surface, #FFFFFF)', border: '1px solid var(--color-border, #E3DED2)', borderRadius: '8px', color: 'var(--color-text, #263238)' }} itemStyle={{ color: 'var(--color-text, #263238)' }} />
                <Area type="monotone" dataKey="NDLS_BBS" stroke="#173F3A" fill="#EEF2ED" name="NDLS-BBS" />
                <Area type="monotone" dataKey="CSMT_NDLS" stroke="#D96C4F" fill="#F7F5EF" name="CSMT-NDLS" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="p-6 bg-[#FFFFFF] dark:bg-[#1B2C28] border border-[#E3DED2] dark:border-[#2A403A] rounded-xl shadow-sm">
          <h3 className="text-sm font-bold text-[#263238] dark:text-[#F7F5EF] font-manrope mb-4 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-[#D96C4F]" /> Route Risk Comparison</h3>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={riskData} margin={{ top: 5, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border, #E3DED2)" />
                <XAxis dataKey="route" stroke="var(--color-text-muted, #66736F)" fontSize={10} /><YAxis stroke="var(--color-text-muted, #66736F)" fontSize={10} />
                <Tooltip contentStyle={{ background: 'var(--color-surface, #FFFFFF)', border: '1px solid var(--color-border, #E3DED2)', borderRadius: '8px', color: 'var(--color-text, #263238)' }} itemStyle={{ color: 'var(--color-text, #263238)' }} />
                <Bar dataKey="delay" fill="#D96C4F" radius={[4,4,0,0]} name="Delay Risk" />
                <Bar dataKey="crowd" fill="#E5B85C" radius={[4,4,0,0]} name="Crowd %" />
                <Bar dataKey="safety" fill="#173F3A" radius={[4,4,0,0]} name="Safety Score" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
