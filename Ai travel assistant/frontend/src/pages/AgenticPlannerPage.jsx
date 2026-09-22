import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Cpu, Activity, Play, ArrowRightLeft, 
  Utensils, Hotel, Bed, ShieldCheck, CloudSun, Sparkles, 
  CheckCircle2, ExternalLink, Filter, MapPin, IndianRupee, 
  Navigation, Eye, Star, X, Train, DollarSign, Leaf,
  Clock, Coffee, Wifi, ShieldAlert, ChevronRight, Check
} from 'lucide-react';
import { Link } from 'react-router-dom';
import StationAutocomplete from '../components/StationAutocomplete';
import { api } from '../utils/api';
import toast from 'react-hot-toast';

const AGENT_ICONS = { 
  route: '🛤', 
  booking: '🎫', 
  food: '🍲', 
  budget: '💰', 
  weather: '☀️', 
  safety: '👮', 
  carbon: '🌿', 
  hotel: '🏨' 
};

export default function AgenticPlannerPage() {
  const [running, setRunning] = useState(false);
  const [source, setSource] = useState('');
  const [destination, setDestination] = useState('');
  const [budget, setBudget] = useState(0);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState('all');
  
  // Modals for interactive exploration
  const [activeModalAgent, setActiveModalAgent] = useState(null); // 'food' | 'hotel' | 'budget' | 'route' | etc.
  const [foodFilterVeg, setFoodFilterVeg] = useState('all'); // 'all' | 'veg' | 'nonveg'
  const [foodBudgetTier, setFoodBudgetTier] = useState('all'); // 'all' | 'budget' | 'mid' | 'premium'
  const [hotelTypeFilter, setHotelTypeFilter] = useState('all'); // 'all' | 'hotel' | 'hostel'
  const [bookingConfirmedStay, setBookingConfirmedStay] = useState(null);
  const [orderConfirmedFood, setOrderConfirmedFood] = useState(null);

  const [agents, setAgents] = useState([
    { id: 'route', name: 'Route Optimization Agent', status: 'idle', progress: 0, logs: [], result: null, reasoning: '', tag: 'Transit' },
    { id: 'booking', name: 'Smart Booking Agent', status: 'idle', progress: 0, logs: [], result: null, reasoning: '', tag: 'Booking' },
    { id: 'food', name: 'Gourmet Food Agent', status: 'idle', progress: 0, logs: [], result: null, reasoning: '', tag: 'Dining' },
    { id: 'budget', name: 'Budget Maximizer Agent', status: 'idle', progress: 0, logs: [], result: null, reasoning: '', tag: 'Finance' },
    { id: 'weather', name: 'Climate Sentinel Agent', status: 'idle', progress: 0, logs: [], result: null, reasoning: '', tag: 'Climate' },
    { id: 'safety', name: 'Security Guard Agent', status: 'idle', progress: 0, logs: [], result: null, reasoning: '', tag: 'Safety' },
    { id: 'carbon', name: 'Carbon Tracker Agent', status: 'idle', progress: 0, logs: [], result: null, reasoning: '', tag: 'Eco' },
    { id: 'hotel', name: 'Hotel & Hostel Aggregator', status: 'idle', progress: 0, logs: [], result: null, reasoning: '', tag: 'Stays' },
  ]);

  const getStationCode = (st) => {
    if (!st) return '';
    if (typeof st === 'string') return st.trim().toUpperCase();
    return (st.station_code || st.station_name || '').trim().toUpperCase();
  };

  const getStationName = (st) => {
    if (!st) return '';
    if (typeof st === 'string') return st;
    return st.station_name || st.station_code || '';
  };

  const handleSwapStations = () => {
    const temp = source;
    setSource(destination);
    setDestination(temp);
  };

  const runSimulation = async () => {
    if (running) return;

    const sourceCode = getStationCode(source);
    const destCode = getStationCode(destination);

    if (!sourceCode || !destCode) {
      toast.error('Please enter both source and destination stations');
      return;
    }

    const parsedBudget = Number(budget) || 0;

    setRunning(true);
    setAgents(prev => prev.map(a => ({ ...a, status: 'idle', progress: 0, logs: [], result: null, reasoning: '' })));

    try {
      const res = await api.post('/agents/simulate', { 
        source: sourceCode, 
        destination: destCode, 
        budget: parsedBudget 
      });
      const backendAgents = res.data.agents;

      const executeAgent = async (index) => {
        if (index >= agents.length) { 
          setRunning(false); 
          toast.success('All 8 AI agents completed! Dynamic itinerary & options ready.'); 
          return; 
        }

        const currentAgentId = agents[index].id;
        const bd = backendAgents.find(ba => ba.id === currentAgentId) || backendAgents[index];

        setAgents(prev => prev.map((a, i) => i === index ? { ...a, status: 'thinking', progress: 15 } : a));
        await new Promise(r => setTimeout(r, 450));

        if (bd?.logs && bd.logs.length > 0) {
          for (let step = 0; step < bd.logs.length; step++) {
            await new Promise(r => setTimeout(r, 350));
            setAgents(prev => prev.map((a, i) => i === index ? { 
              ...a, 
              progress: 20 + Math.round((step / bd.logs.length) * 70), 
              logs: [...a.logs, bd.logs[step]] 
            } : a));
          }
        }

        await new Promise(r => setTimeout(r, 250));
        setAgents(prev => prev.map((a, i) => i === index ? { 
          ...a, 
          status: 'completed', 
          progress: 100, 
          result: bd?.result, 
          reasoning: bd?.reasoning 
        } : a));

        executeAgent(index + 1);
      };

      executeAgent(0);
    } catch (e) {
      const msg = e.response?.data?.message || e.message || 'Agent simulation error';
      toast.error(msg);
      console.error('[Agentic Planner Error]:', e.response?.status, msg);
      setRunning(false);
    }
  };

  const completedCount = agents.filter(a => a.status === 'completed').length;
  const foodAgent = agents.find(a => a.id === 'food');
  const hotelAgent = agents.find(a => a.id === 'hotel');
  const budgetAgent = agents.find(a => a.id === 'budget');
  const routeAgent = agents.find(a => a.id === 'route');

  // Filtered food list
  const allRestaurants = foodAgent?.result?.restaurants || foodAgent?.result?.recommendations || [];
  const filteredRestaurants = allRestaurants.filter(item => {
    if (foodFilterVeg === 'veg' && !item.isVeg) return false;
    if (foodFilterVeg === 'nonveg' && item.isVeg) return false;
    if (foodBudgetTier === 'budget' && (item.price || 0) > 150) return false;
    if (foodBudgetTier === 'mid' && ((item.price || 0) <= 150 || (item.price || 0) > 250)) return false;
    if (foodBudgetTier === 'premium' && (item.price || 0) <= 250) return false;
    return true;
  });

  // Filtered hotel/hostel list
  const allAccommodations = hotelAgent?.result?.hotels || [];
  const filteredAccommodations = allAccommodations.filter(stay => {
    if (hotelTypeFilter === 'hotel' && stay.type !== 'hotel') return false;
    if (hotelTypeFilter === 'hostel' && stay.type !== 'hostel') return false;
    return true;
  });

  return (
    <div className="flex-1 w-full p-4 lg:p-8 space-y-6 max-w-7xl mx-auto pt-6 bg-[#F7F5EF] dark:bg-[#12201D] min-h-screen font-[Inter]">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 mb-2">
        <div className="flex items-center gap-3">
          <Link to="/dashboard/ai-workspace" className="p-2.5 bg-[#FFFFFF] dark:bg-[#1B2C28] border border-[#E3DED2] dark:border-[#2A403A] rounded-xl transition-colors hover:bg-[#EEF2ED] dark:hover:bg-[#213530]">
            <ArrowLeft className="w-5 h-5 text-[#263238] dark:text-[#F7F5EF]" />
          </Link>
          <div className="p-3 bg-[#EEF2ED] dark:bg-[#213530] border border-[#E3DED2] dark:border-[#2A403A] rounded-xl">
            <Cpu className="w-6 h-6 text-[#173F3A] dark:text-[#EEF2ED]" />
          </div>
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-[#263238] dark:text-[#F7F5EF] font-[Manrope] flex items-center gap-2">
              Agentic Travel Planner
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded bg-[#EEF2ED] dark:bg-[#213530] text-[#173F3A] dark:text-[#EEF2ED] border border-[#E3DED2] dark:border-[#2A403A]">
                8 Autonomous AI Agents
              </span>
            </h1>
            <p className="text-[#66736F] dark:text-[#A3B0AB] text-xs sm:text-sm mt-1">
              Coordinated AI swarm calculating routes, seats, nearby restaurants, budget hostels & hotels in real-time.
            </p>
          </div>
        </div>
      </div>

      {/* Configuration Bar */}
      <div className="p-5 lg:p-6 bg-[#FFFFFF] dark:bg-[#1B2C28] border border-[#E3DED2] dark:border-[#2A403A] rounded-xl shadow-[0_4px_16px_rgba(23,63,58,0.06)] relative overflow-visible">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          {/* Source Station */}
          <div className="md:col-span-4 space-y-1">
            <label className="text-xs font-bold text-[#66736F] dark:text-[#A3B0AB] uppercase tracking-wider flex items-center gap-1.5 h-5">
              <MapPin className="w-3.5 h-3.5 text-[#D96C4F]" /> Source Station
            </label>
            <div className="relative">
              <StationAutocomplete 
                value={source} 
                onChange={setSource} 
                placeholder="From Station (e.g. NDLS, HWH)" 
              />
            </div>
          </div>

          {/* Swap Button */}
          <div className="md:col-span-1 flex flex-col items-center space-y-1">
            <div className="h-5 flex items-center" aria-hidden="true" />
            <button
              onClick={handleSwapStations}
              type="button"
              title="Swap Stations"
              className="h-[46px] w-[46px] flex items-center justify-center rounded-lg bg-[#F7F5EF] dark:bg-[#12201D] border border-[#E3DED2] dark:border-[#2A403A] text-[#263238] dark:text-[#F7F5EF] hover:bg-[#EEF2ED] dark:hover:bg-[#213530] transition-colors"
            >
              <ArrowRightLeft className="w-4 h-4" />
            </button>
          </div>

          {/* Destination Station */}
          <div className="md:col-span-4 space-y-1">
            <label className="text-xs font-bold text-[#66736F] dark:text-[#A3B0AB] uppercase tracking-wider flex items-center gap-1.5 h-5">
              <Navigation className="w-3.5 h-3.5 text-[#173F3A] dark:text-[#EEF2ED]" /> Destination Station
            </label>
            <div className="relative">
              <StationAutocomplete 
                value={destination} 
                onChange={setDestination} 
                placeholder="To Station (e.g. BBS, MAS, CSTM)" 
              />
            </div>
          </div>

          {/* Max Budget Input */}
          <div className="md:col-span-3 space-y-1">
            <div className="flex items-center justify-between h-5">
              <label className="text-xs font-bold text-[#66736F] dark:text-[#A3B0AB] uppercase tracking-wider flex items-center gap-1.5">
                <IndianRupee className="w-3.5 h-3.5 text-[#4F7D62]" /> Max Budget (₹)
              </label>
              {budget !== '' && budget !== null && budget !== undefined && (
                <span className="text-[11px] font-mono text-[#4F7D62] font-semibold">
                  ₹{Number(budget).toLocaleString()}
                </span>
              )}
            </div>
            <div className="relative">
              <input 
                type="number"
                min="0"
                step="500"
                value={budget}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '') {
                    setBudget('');
                  } else {
                    setBudget(Math.max(0, Number(val)));
                  }
                }}
                placeholder="Enter budget (e.g. 5000)"
                className="w-full px-3.5 py-3 bg-[#F7F5EF] dark:bg-[#12201D] border border-[#E3DED2] dark:border-[#2A403A] rounded-lg text-[#263238] dark:text-[#F7F5EF] text-sm focus:border-[#173F3A] dark:focus:border-[#EEF2ED] focus:ring-1 focus:ring-[#173F3A] dark:focus:ring-[#EEF2ED] outline-none transition-all placeholder:text-[#66736F] dark:placeholder:text-[#A3B0AB]"
              />
            </div>
          </div>
        </div>

        {/* Quick Budget Chips + Action Button */}
        <div className="mt-4 pt-4 border-t border-[#E3DED2] dark:border-[#2A403A] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-[#66736F] dark:text-[#A3B0AB] font-medium">Quick Budget:</span>
            {[0, 2500, 5000, 10000, 15000, 25000].map(val => (
              <button
                key={val}
                type="button"
                onClick={() => setBudget(val)}
                className={`text-xs px-2.5 py-1 rounded border transition-colors font-medium ${
                  Number(budget) === val
                    ? 'bg-[#173F3A] border-[#173F3A] text-[#FFFFFF] dark:bg-[#EEF2ED] dark:border-[#EEF2ED] dark:text-[#1B2C28]'
                    : 'bg-[#F7F5EF] dark:bg-[#12201D] border-[#E3DED2] dark:border-[#2A403A] text-[#66736F] dark:text-[#A3B0AB] hover:text-[#263238] dark:hover:text-[#F7F5EF]'
                }`}
              >
                ₹{val.toLocaleString()}
              </button>
            ))}
          </div>

          <button
            onClick={runSimulation}
            disabled={running}
            className="w-full sm:w-auto px-6 py-3 bg-[#173F3A] hover:bg-[#0F332F] dark:bg-[#EEF2ED] dark:hover:bg-[#FFFFFF] disabled:opacity-50 text-[#FFFFFF] dark:text-[#1B2C28] font-bold rounded-lg flex items-center justify-center gap-2 transition-colors"
          >
            {running ? <Activity className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            {running ? 'Agents Processing...' : 'Launch 8 AI Agents'}
          </button>
        </div>

        {/* Simulation Progress Bar */}
        {running && (
          <div className="mt-4 pt-3 border-t border-[#E3DED2] dark:border-[#2A403A]">
            <div className="flex justify-between text-xs text-[#66736F] dark:text-[#A3B0AB] font-medium mb-1.5">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#173F3A] dark:text-[#EEF2ED] animate-spin" />
                Executing agent reasoning pipeline...
              </span>
              <span className="font-mono text-[#173F3A] dark:text-[#EEF2ED] font-bold">{completedCount}/8 agents finished</span>
            </div>
            <div className="w-full h-2.5 bg-[#EEF2ED] dark:bg-[#213530] rounded overflow-hidden">
              <motion.div 
                animate={{ width: `${(completedCount / 8) * 100}%` }} 
                className="h-full bg-[#173F3A] dark:bg-[#EEF2ED]"
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Results Category Quick Filter */}
      {completedCount > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {[
            { id: 'all', label: 'All 8 Agents', icon: Cpu },
            { id: 'food', label: 'Food & Restaurants', icon: Utensils, badge: allRestaurants.length ? `${allRestaurants.length} Places` : null },
            { id: 'hotel', label: 'Hotels & Hostels', icon: Hotel, badge: allAccommodations.length ? `${allAccommodations.length} Stays` : null },
            { id: 'route', label: 'Route & Seats', icon: Train },
            { id: 'budget', label: 'Budget Breakdown', icon: DollarSign },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveCategoryFilter(tab.id);
                if (tab.id === 'food') setActiveModalAgent('food');
                if (tab.id === 'hotel') setActiveModalAgent('hotel');
                if (tab.id === 'budget') setActiveModalAgent('budget');
                if (tab.id === 'route') setActiveModalAgent('route');
              }}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold whitespace-nowrap flex items-center gap-2 border transition-colors ${
                activeCategoryFilter === tab.id
                  ? 'bg-[#173F3A] text-[#FFFFFF] border-[#173F3A] dark:bg-[#EEF2ED] dark:text-[#1B2C28] dark:border-[#EEF2ED]'
                  : 'bg-[#FFFFFF] dark:bg-[#1B2C28] border-[#E3DED2] dark:border-[#2A403A] text-[#66736F] dark:text-[#A3B0AB] hover:bg-[#F7F5EF] dark:hover:bg-[#213530]'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
              {tab.badge && (
                <span className="text-[10px] px-1.5 py-0.5 bg-[#F7F5EF] dark:bg-[#12201D] text-[#263238] dark:text-[#F7F5EF] rounded font-mono">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Agents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {agents.map((agent) => {
          const isDone = agent.status === 'completed';
          const isThinking = agent.status === 'thinking';
          const isFood = agent.id === 'food';
          const isHotel = agent.id === 'hotel';

          return (
            <div
              key={agent.id}
              onClick={() => {
                if (isDone) setActiveModalAgent(agent.id);
              }}
              className={`p-5 rounded-xl border transition-colors relative group flex flex-col justify-between ${
                isDone 
                  ? 'bg-[#FFFFFF] dark:bg-[#1B2C28] border-[#E3DED2] dark:border-[#2A403A] hover:border-[#173F3A] dark:hover:border-[#EEF2ED] shadow-[0_4px_16px_rgba(23,63,58,0.06)] cursor-pointer' 
                  : isThinking 
                    ? 'bg-[#EEF2ED] dark:bg-[#213530] border-[#E3DED2] dark:border-[#2A403A]' 
                    : 'bg-[#FFFFFF] dark:bg-[#1B2C28] border-[#E3DED2] dark:border-[#2A403A] opacity-70'
              }`}
            >
              <div>
                {/* Agent Header */}
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#F7F5EF] dark:bg-[#12201D] border border-[#E3DED2] dark:border-[#2A403A] flex items-center justify-center text-xl">
                      {AGENT_ICONS[agent.id]}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-[#263238] dark:text-[#F7F5EF] font-[Manrope]">{agent.name}</span>
                        {isDone && (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-[#F7F5EF] dark:bg-[#12201D] text-[#66736F] dark:text-[#A3B0AB] font-medium border border-[#E3DED2] dark:border-[#2A403A]">
                            {agent.tag}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-[#66736F] dark:text-[#A3B0AB]">
                        {agent.id === 'food' && 'Discovers nearby restaurants & station delivery'}
                        {agent.id === 'hotel' && 'Compares hotels, backpacker hostels & pods'}
                        {agent.id === 'route' && 'Calculates optimal tracks & schedule'}
                        {agent.id === 'booking' && 'Estimates seat chance & fares'}
                        {agent.id === 'budget' && 'Splits allocation & optimizes savings'}
                        {agent.id === 'weather' && 'Monitors meteorological hazards & delays'}
                        {agent.id === 'safety' && 'Security index & emergency helplines'}
                        {agent.id === 'carbon' && 'Eco-emission offset calculations'}
                      </span>
                    </div>
                  </div>
                  
                  <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded border ${
                    isDone 
                      ? 'bg-[#EEF2ED] text-[#4F7D62] border-[#E3DED2] dark:bg-[#213530] dark:border-[#2A403A]'
                      : isThinking 
                        ? 'bg-[#F7F5EF] text-[#D96C4F] border-[#E3DED2] dark:bg-[#12201D] dark:border-[#2A403A]'
                        : 'bg-[#F7F5EF] text-[#66736F] border-[#E3DED2] dark:bg-[#12201D] dark:border-[#2A403A]'
                  }`}>
                    {agent.status}
                  </span>
                </div>

                {/* Progress bar */}
                {(isThinking || isDone) && (
                  <div className="w-full h-1.5 bg-[#E3DED2] dark:bg-[#2A403A] rounded overflow-hidden mb-3">
                    <motion.div 
                      initial={{ width: 0 }} 
                      animate={{ width: `${agent.progress}%` }} 
                      className={`h-full ${isDone ? 'bg-[#4F7D62]' : 'bg-[#173F3A] dark:bg-[#EEF2ED]'}`} 
                    />
                  </div>
                )}

                {/* Live Reasoning Logs */}
                {agent.logs.length > 0 && (
                  <div className="text-[10px] text-[#66736F] dark:text-[#A3B0AB] font-mono bg-[#F7F5EF] dark:bg-[#12201D] p-2.5 rounded-lg border border-[#E3DED2] dark:border-[#2A403A] space-y-1 mb-3 max-h-[100px] overflow-y-auto">
                    {agent.logs.map((log, i) => (
                      <div key={i} className="flex items-start gap-1.5">
                        <span className="text-[#173F3A] dark:text-[#EEF2ED] select-none">❯</span>
                        <span>{log}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Summary Reasoning */}
                {isDone && agent.reasoning && (
                  <p className="text-xs text-[#66736F] dark:text-[#A3B0AB] leading-relaxed mb-3 italic bg-[#F7F5EF] dark:bg-[#12201D] p-2.5 rounded-lg border border-[#E3DED2] dark:border-[#2A403A]">
                    "{agent.reasoning}"
                  </p>
                )}

                {/* Output Snippets */}
                {isDone && agent.result && (
                  <div className="text-xs bg-[#EEF2ED] dark:bg-[#213530] p-3 rounded-lg border border-[#E3DED2] dark:border-[#2A403A] text-[#263238] dark:text-[#F7F5EF] space-y-1.5">
                    {agent.id === 'route' && (
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <p className="font-semibold">🏆 {agent.result.primaryRoute}</p>
                        <span className="text-[#173F3A] dark:text-[#EEF2ED] font-mono text-[11px]">{agent.result.travelDuration}</span>
                      </div>
                    )}
                    {agent.id === 'booking' && (
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <span>🎫 Class {agent.result.recommendedClass} • {agent.result.availableSeats} Available Seats</span>
                        <span className="text-[#4F7D62] font-bold">Fare: ₹{agent.result.fareEst}</span>
                      </div>
                    )}
                    {agent.id === 'food' && (
                      <div>
                        <p className="text-[#E5B85C] font-semibold mb-1">
                          🍲 {agent.result.recommendations?.length || 0} Nearby Restaurants & Dishes:
                        </p>
                        <p className="text-[11px] text-[#66736F] dark:text-[#A3B0AB] truncate">
                          {agent.result.recommendations?.map(r => `${r.item} (${r.vendor})`).join(' • ')}
                        </p>
                      </div>
                    )}
                    {agent.id === 'hotel' && (
                      <div>
                        <p className="text-[#173F3A] dark:text-[#EEF2ED] font-semibold mb-1">
                          🏨 {agent.result.hotels?.length || 0} Stays Near Station (Hotels & Hostels):
                        </p>
                        <p className="text-[11px] text-[#66736F] dark:text-[#A3B0AB] truncate">
                          {agent.result.hotels?.map(h => `${h.name} - ₹${h.pricePerNight}`).join(' • ')}
                        </p>
                      </div>
                    )}
                    {agent.id === 'budget' && (
                      <div className="flex items-center justify-between text-[11px] flex-wrap gap-2">
                        <span>Total: <strong>₹{agent.result.totalEstCost?.toLocaleString()}</strong></span>
                        <span>Saved: <strong className="text-[#4F7D62]">{agent.result.savingsPercent}%</strong></span>
                        <span>Buffer: <strong className="text-[#173F3A] dark:text-[#EEF2ED]">₹{agent.result.remainingBudget?.toLocaleString()}</strong></span>
                      </div>
                    )}
                    {agent.id === 'weather' && (
                      <p>☀️ Avg Temp: <strong>{agent.result.averageTemp}</strong> | Rain Risk: <strong>{agent.result.precipitationProb}</strong> | Delay: <strong>{agent.result.delayRisk}</strong></p>
                    )}
                    {agent.id === 'safety' && (
                      <p>👮 Security Rating: <strong className="text-[#4F7D62]">{agent.result.overallSafetyScore}</strong> | Helpline: <strong>{agent.result.rpfHelpline}</strong></p>
                    )}
                    {agent.id === 'carbon' && (
                      <p>🌿 Rail Footprint: <strong>{agent.result.railEmissionKg} kg</strong> | Saved vs Air: <strong className="text-[#4F7D62]">{agent.result.netSavedCo2Kg} kg CO₂</strong></p>
                    )}
                  </div>
                )}
              </div>

              {/* Action Trigger for Interactive details */}
              {isDone && (
                <div className="mt-3 pt-3 border-t border-[#E3DED2] dark:border-[#2A403A] flex items-center justify-between text-xs font-semibold text-[#173F3A] dark:text-[#EEF2ED] group-hover:text-[#0F332F] dark:group-hover:text-[#FFFFFF] transition-colors">
                  <span className="flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5" /> 
                    {isFood ? 'Explore Restaurants & Menu' : isHotel ? 'Browse Hotels & Hostels' : 'View Deep Intelligence'}
                  </span>
                  <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* INTERACTIVE MODAL / DRAWER FOR AGENTS (FOOD, HOTEL, BUDGET, ROUTE)       */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {activeModalAgent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#263238]/60 dark:bg-[#12201D]/80">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#FFFFFF] dark:bg-[#1B2C28] border border-[#E3DED2] dark:border-[#2A403A] rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-[0_4px_16px_rgba(23,63,58,0.06)]"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-[#E3DED2] dark:border-[#2A403A] flex items-center justify-between bg-[#F7F5EF] dark:bg-[#12201D]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#FFFFFF] dark:bg-[#1B2C28] border border-[#E3DED2] dark:border-[#2A403A] flex items-center justify-center text-2xl">
                    {AGENT_ICONS[activeModalAgent]}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-[#263238] dark:text-[#F7F5EF] font-[Manrope] flex items-center gap-2">
                      {activeModalAgent === 'food' && '🍲 Nearby Restaurants & Local Specialties'}
                      {activeModalAgent === 'hotel' && '🏨 Hotels & Backpacker Hostels'}
                      {activeModalAgent === 'budget' && '💰 Budget Maximization & Expense Breakdown'}
                      {activeModalAgent === 'route' && '🛤 Smart Transit & Train Network Trace'}
                      {activeModalAgent === 'booking' && '🎫 Seat Probabilities & Reservation Forecast'}
                      {activeModalAgent === 'weather' && '☀️ Weather & Meteorological Forecast'}
                      {activeModalAgent === 'safety' && '👮 Transit Security & Emergency Assistance'}
                      {activeModalAgent === 'carbon' && '🌿 Carbon Footprint & Eco Savings'}
                    </h2>
                    <p className="text-xs text-[#66736F] dark:text-[#A3B0AB] mt-1">
                      Destination: <span className="text-[#173F3A] dark:text-[#EEF2ED] font-bold">{getStationName(destination)} ({getStationCode(destination)})</span> • Budget Cap: <span className="text-[#4F7D62] font-bold">₹{Number(budget).toLocaleString()}</span>
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setActiveModalAgent(null)}
                  className="p-2 hover:bg-[#EEF2ED] dark:hover:bg-[#213530] rounded-lg text-[#66736F] dark:text-[#A3B0AB] hover:text-[#263238] dark:hover:text-[#F7F5EF] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-[#FFFFFF] dark:bg-[#1B2C28]">
                {/* ----------------- FOOD MODAL VIEW ----------------- */}
                {activeModalAgent === 'food' && (
                  <div className="space-y-6">
                    {/* Filters Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-3 bg-[#F7F5EF] dark:bg-[#12201D] p-3.5 rounded-lg border border-[#E3DED2] dark:border-[#2A403A]">
                      {/* Diet Filter */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-[#66736F] dark:text-[#A3B0AB] mr-1 flex items-center gap-1">
                          <Filter className="w-3 h-3" /> Diet:
                        </span>
                        {['all', 'veg', 'nonveg'].map(mode => (
                          <button
                            key={mode}
                            onClick={() => setFoodFilterVeg(mode)}
                            className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-colors ${
                              foodFilterVeg === mode
                                ? 'bg-[#173F3A] text-[#FFFFFF] dark:bg-[#EEF2ED] dark:text-[#1B2C28]'
                                : 'bg-[#FFFFFF] dark:bg-[#1B2C28] text-[#66736F] dark:text-[#A3B0AB] hover:text-[#263238] dark:hover:text-[#F7F5EF] border border-[#E3DED2] dark:border-[#2A403A]'
                            }`}
                          >
                            {mode === 'all' ? 'All Meals' : mode === 'veg' ? '🌱 Pure Veg' : '🍗 Non-Veg'}
                          </button>
                        ))}
                      </div>

                      {/* Price Tier */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-[#66736F] dark:text-[#A3B0AB] mr-1">Budget:</span>
                        {[
                          { id: 'all', label: 'All' },
                          { id: 'budget', label: '< ₹150' },
                          { id: 'mid', label: '₹150 - ₹250' },
                          { id: 'premium', label: '₹250+' }
                        ].map(tier => (
                          <button
                            key={tier.id}
                            onClick={() => setFoodBudgetTier(tier.id)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                              foodBudgetTier === tier.id
                                ? 'bg-[#173F3A] text-[#FFFFFF] dark:bg-[#EEF2ED] dark:text-[#1B2C28]'
                                : 'bg-[#FFFFFF] dark:bg-[#1B2C28] text-[#66736F] dark:text-[#A3B0AB] hover:text-[#263238] dark:hover:text-[#F7F5EF] border border-[#E3DED2] dark:border-[#2A403A]'
                            }`}
                          >
                            {tier.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Restaurant Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {filteredRestaurants.map((dish) => (
                        <div
                          key={dish.id}
                          className="bg-[#FFFFFF] dark:bg-[#1B2C28] border border-[#E3DED2] dark:border-[#2A403A] rounded-xl p-4 flex flex-col justify-between hover:border-[#173F3A] dark:hover:border-[#EEF2ED] transition-colors group"
                        >
                          <div>
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded inline-block mb-1.5 border ${
                                  dish.isVeg 
                                    ? 'bg-[#EEF2ED] text-[#4F7D62] border-[#4F7D62]/30 dark:bg-[#213530]' 
                                    : 'bg-[#F7F5EF] text-[#D96C4F] border-[#D96C4F]/30 dark:bg-[#12201D]'
                                }`}>
                                  {dish.isVeg ? '🌱 Pure Veg' : '🍗 Non-Veg'}
                                </span>
                                <h3 className="text-sm font-bold text-[#263238] dark:text-[#F7F5EF] group-hover:text-[#173F3A] dark:group-hover:text-[#EEF2ED] transition-colors">
                                  {dish.name || dish.item}
                                </h3>
                                <p className="text-xs text-[#66736F] dark:text-[#A3B0AB] flex items-center gap-1 mt-0.5">
                                  <Utensils className="w-3 h-3 text-[#173F3A] dark:text-[#EEF2ED]" />
                                  {dish.restaurant || dish.vendor}
                                </p>
                              </div>

                              <div className="text-right">
                                <span className="text-base font-bold text-[#4F7D62]">
                                  ₹{dish.price || 180}
                                </span>
                                <div className="flex items-center gap-1 text-[11px] text-[#E5B85C] font-bold justify-end mt-0.5">
                                  <Star className="w-3 h-3 fill-[#E5B85C]" />
                                  {dish.rating || 4.6}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 text-[11px] text-[#66736F] dark:text-[#A3B0AB] py-2 border-y border-[#E3DED2] dark:border-[#2A403A] my-2">
                              <span>📍 {dish.distance || '0.5 km from station'}</span>
                              <span>⏱ {dish.deliveryTime || '15 min delivery'}</span>
                              <span>🍽 {dish.cuisine || 'Regional'}</span>
                            </div>

                            {/* Platform Price Comparison */}
                            {dish.platformPrices && (
                              <div className="bg-[#F7F5EF] dark:bg-[#12201D] p-2 rounded-lg text-[10px] space-y-1 mb-3 border border-[#E3DED2] dark:border-[#2A403A]">
                                <span className="text-[#66736F] dark:text-[#A3B0AB] font-bold block mb-1">Multi-Platform Comparison:</span>
                                <div className="grid grid-cols-3 gap-2 text-center">
                                  <div className="bg-[#FFFFFF] dark:bg-[#1B2C28] p-1 rounded border border-[#E3DED2] dark:border-[#2A403A]">
                                    <span className="text-[#66736F] dark:text-[#A3B0AB] block font-semibold">IRCTC</span>
                                    <strong className="text-[#263238] dark:text-[#F7F5EF]">₹{dish.platformPrices.irctc}</strong>
                                  </div>
                                  <div className="bg-[#FFFFFF] dark:bg-[#1B2C28] p-1 rounded border border-[#E3DED2] dark:border-[#2A403A]">
                                    <span className="text-[#66736F] dark:text-[#A3B0AB] block font-semibold">Zomato</span>
                                    <strong className="text-[#263238] dark:text-[#F7F5EF]">₹{dish.platformPrices.zomato}</strong>
                                  </div>
                                  <div className="bg-[#FFFFFF] dark:bg-[#1B2C28] p-1 rounded border border-[#E3DED2] dark:border-[#2A403A]">
                                    <span className="text-[#66736F] dark:text-[#A3B0AB] block font-semibold">Swiggy</span>
                                    <strong className="text-[#263238] dark:text-[#F7F5EF]">₹{dish.platformPrices.swiggy}</strong>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>

                          <button
                            onClick={() => {
                              setOrderConfirmedFood(dish.name || dish.item);
                              toast.success(`Order placed for ${dish.name || dish.item}! Scheduled for delivery at ${getStationName(destination)}.`);
                            }}
                            className={`w-full py-2 px-3 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 ${
                              orderConfirmedFood === (dish.name || dish.item)
                                ? 'bg-[#4F7D62] text-[#FFFFFF]'
                                : 'bg-[#F7F5EF] hover:bg-[#EEF2ED] dark:bg-[#12201D] dark:hover:bg-[#213530] text-[#173F3A] dark:text-[#EEF2ED] border border-[#E3DED2] dark:border-[#2A403A]'
                            }`}
                          >
                            {orderConfirmedFood === (dish.name || dish.item) ? (
                              <>
                                <Check className="w-3.5 h-3.5" /> Delivery Reserved
                              </>
                            ) : (
                              <>
                                <Utensils className="w-3.5 h-3.5" /> Order to Seat / Station
                              </>
                            )}
                          </button>
                        </div>
                      ))}
                    </div>

                    {filteredRestaurants.length === 0 && (
                      <div className="text-center py-12 text-[#66736F] dark:text-[#A3B0AB]">
                        <Utensils className="w-10 h-10 mx-auto text-[#66736F] dark:text-[#A3B0AB] mb-2 opacity-50" />
                        <p>No restaurants match your selected filter criteria.</p>
                      </div>
                    )}
                  </div>
                )}

                {/* ----------------- HOTEL & HOSTEL MODAL VIEW ----------------- */}
                {activeModalAgent === 'hotel' && (
                  <div className="space-y-6">
                    {/* Stay Type Toggle */}
                    <div className="flex flex-wrap items-center justify-between gap-3 bg-[#F7F5EF] dark:bg-[#12201D] p-3.5 rounded-lg border border-[#E3DED2] dark:border-[#2A403A]">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-[#66736F] dark:text-[#A3B0AB] flex items-center gap-1">
                          <Filter className="w-3 h-3" /> Accommodation Category:
                        </span>
                        {[
                          { id: 'all', label: 'All Stays' },
                          { id: 'hostel', label: '🎒 Hostels & Pods (Dormitories)' },
                          { id: 'hotel', label: '🏨 Hotels (Comfort & Luxury)' }
                        ].map(type => (
                          <button
                            key={type.id}
                            onClick={() => setHotelTypeFilter(type.id)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                              hotelTypeFilter === type.id
                                ? 'bg-[#173F3A] text-[#FFFFFF] dark:bg-[#EEF2ED] dark:text-[#1B2C28]'
                                : 'bg-[#FFFFFF] dark:bg-[#1B2C28] text-[#66736F] dark:text-[#A3B0AB] hover:text-[#263238] dark:hover:text-[#F7F5EF] border border-[#E3DED2] dark:border-[#2A403A]'
                            }`}
                          >
                            {type.label}
                          </button>
                        ))}
                      </div>

                      <div className="text-xs text-[#66736F] dark:text-[#A3B0AB] font-mono">
                        Showing <strong className="text-[#263238] dark:text-[#F7F5EF]">{filteredAccommodations.length}</strong> verified properties
                      </div>
                    </div>

                    {/* Accommodations Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {filteredAccommodations.map((stay) => {
                        const isHostel = stay.type === 'hostel';
                        const isConfirmed = bookingConfirmedStay === stay.id;

                        return (
                          <div
                            key={stay.id}
                            className="bg-[#FFFFFF] dark:bg-[#1B2C28] border border-[#E3DED2] dark:border-[#2A403A] rounded-xl p-5 flex flex-col justify-between hover:border-[#173F3A] dark:hover:border-[#EEF2ED] transition-colors group"
                          >
                            <div>
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <div>
                                  <div className="flex items-center gap-2 mb-1.5">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                                      isHostel 
                                        ? 'bg-[#EEF2ED] text-[#4F7D62] border-[#4F7D62]/30 dark:bg-[#213530]' 
                                        : 'bg-[#F7F5EF] text-[#173F3A] border-[#173F3A]/30 dark:bg-[#12201D] dark:text-[#EEF2ED]'
                                    }`}>
                                      {isHostel ? '🎒 Backpacker Hostel' : '🏨 Hotel & Suites'}
                                    </span>
                                    {stay.tag && (
                                      <span className="text-[10px] px-2 py-0.5 rounded bg-[#F7F5EF] dark:bg-[#12201D] text-[#66736F] dark:text-[#A3B0AB] font-medium border border-[#E3DED2] dark:border-[#2A403A]">
                                        {stay.tag}
                                      </span>
                                    )}
                                  </div>

                                  <h3 className="text-base font-bold text-[#263238] dark:text-[#F7F5EF] group-hover:text-[#173F3A] dark:group-hover:text-[#EEF2ED] transition-colors">
                                    {stay.name}
                                  </h3>
                                  <p className="text-xs text-[#66736F] dark:text-[#A3B0AB] flex items-center gap-1 mt-0.5">
                                    <MapPin className="w-3 h-3 text-[#173F3A] dark:text-[#EEF2ED]" />
                                    {stay.address}
                                  </p>
                                </div>

                                <div className="text-right">
                                  <span className="text-lg font-bold text-[#4F7D62]">
                                    ₹{stay.pricePerNight}
                                  </span>
                                  <span className="text-[10px] text-[#66736F] dark:text-[#A3B0AB] block">/ night</span>
                                  <div className="flex items-center gap-1 text-xs text-[#E5B85C] font-bold justify-end mt-1">
                                    <Star className="w-3.5 h-3.5 fill-[#E5B85C]" />
                                    {stay.rating} <span className="text-[#66736F] dark:text-[#A3B0AB] text-[10px]">({stay.reviewsCount})</span>
                                  </div>
                                </div>
                              </div>

                              <div className="text-xs text-[#263238] dark:text-[#F7F5EF] font-medium py-2 border-y border-[#E3DED2] dark:border-[#2A403A] my-3 flex items-center justify-between">
                                <span>🚉 Distance to Station: <strong className="text-[#173F3A] dark:text-[#EEF2ED]">{stay.distanceToStation}</strong></span>
                                {stay.freeCancellation && (
                                  <span className="text-[#4F7D62] text-[11px] font-semibold">✓ Free Cancellation</span>
                                )}
                              </div>

                              {/* Amenities Badges */}
                              {stay.amenities && (
                                <div className="flex flex-wrap gap-1.5 mb-4">
                                  {stay.amenities.map((amenity, i) => (
                                    <span
                                      key={i}
                                      className="text-[10px] px-2 py-0.5 rounded-md bg-[#F7F5EF] dark:bg-[#12201D] text-[#66736F] dark:text-[#A3B0AB] border border-[#E3DED2] dark:border-[#2A403A]"
                                    >
                                      {amenity}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>

                            <button
                              onClick={() => {
                                setBookingConfirmedStay(stay.id);
                                toast.success(`Reservation confirmed for ${stay.name}! Check-in ready at ${getStationName(destination)}.`);
                              }}
                              className={`w-full py-2.5 px-4 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-2 ${
                                isConfirmed
                                  ? 'bg-[#4F7D62] text-[#FFFFFF]'
                                  : 'bg-[#173F3A] hover:bg-[#0F332F] dark:bg-[#EEF2ED] dark:hover:bg-[#FFFFFF] text-[#FFFFFF] dark:text-[#1B2C28]'
                              }`}
                            >
                              {isConfirmed ? (
                                <>
                                  <Check className="w-4 h-4" /> Reserved Successfully
                                </>
                              ) : (
                                <>
                                  <Bed className="w-4 h-4" /> Reserve Stay at ₹{stay.pricePerNight}
                                </>
                              )}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ----------------- BUDGET MODAL VIEW ----------------- */}
                {activeModalAgent === 'budget' && budgetAgent?.result && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="bg-[#F7F5EF] dark:bg-[#12201D] p-4 rounded-xl border border-[#E3DED2] dark:border-[#2A403A] text-center">
                        <span className="text-xs text-[#66736F] dark:text-[#A3B0AB] font-semibold block mb-1">Total Estimated Cost</span>
                        <span className="text-2xl font-bold text-[#263238] dark:text-[#F7F5EF]">₹{budgetAgent.result.totalEstCost?.toLocaleString()}</span>
                      </div>
                      <div className="bg-[#EEF2ED] dark:bg-[#213530] p-4 rounded-xl border border-[#E3DED2] dark:border-[#2A403A] text-center">
                        <span className="text-xs text-[#4F7D62] font-semibold block mb-1">Safety Buffer / Savings</span>
                        <span className="text-2xl font-bold text-[#4F7D62]">₹{budgetAgent.result.remainingBudget?.toLocaleString()}</span>
                      </div>
                      <div className="bg-[#F7F5EF] dark:bg-[#12201D] p-4 rounded-xl border border-[#E3DED2] dark:border-[#2A403A] text-center">
                        <span className="text-xs text-[#173F3A] dark:text-[#EEF2ED] font-semibold block mb-1">Max Allowance Cap</span>
                        <span className="text-2xl font-bold text-[#173F3A] dark:text-[#EEF2ED]">₹{Number(budget).toLocaleString()}</span>
                      </div>
                    </div>

                    {budgetAgent.result.allocation && (
                      <div className="bg-[#FFFFFF] dark:bg-[#1B2C28] p-5 rounded-xl border border-[#E3DED2] dark:border-[#2A403A] space-y-3 shadow-sm">
                        <h3 className="text-sm font-bold text-[#263238] dark:text-[#F7F5EF]">Intelligent Fund Allocation</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <div className="p-3 bg-[#F7F5EF] dark:bg-[#12201D] rounded-lg border border-[#E3DED2] dark:border-[#2A403A]">
                            <span className="text-xs text-[#66736F] dark:text-[#A3B0AB] block">🎫 Transit / Train</span>
                            <strong className="text-[#263238] dark:text-[#F7F5EF] text-sm">₹{budgetAgent.result.allocation.ticket}</strong>
                          </div>
                          <div className="p-3 bg-[#F7F5EF] dark:bg-[#12201D] rounded-lg border border-[#E3DED2] dark:border-[#2A403A]">
                            <span className="text-xs text-[#66736F] dark:text-[#A3B0AB] block">🏨 Hotel / Hostel</span>
                            <strong className="text-[#263238] dark:text-[#F7F5EF] text-sm">₹{budgetAgent.result.allocation.stay}</strong>
                          </div>
                          <div className="p-3 bg-[#F7F5EF] dark:bg-[#12201D] rounded-lg border border-[#E3DED2] dark:border-[#2A403A]">
                            <span className="text-xs text-[#66736F] dark:text-[#A3B0AB] block">🍲 Meals & Dining</span>
                            <strong className="text-[#263238] dark:text-[#F7F5EF] text-sm">₹{budgetAgent.result.allocation.meals}</strong>
                          </div>
                          <div className="p-3 bg-[#F7F5EF] dark:bg-[#12201D] rounded-lg border border-[#E3DED2] dark:border-[#2A403A]">
                            <span className="text-xs text-[#66736F] dark:text-[#A3B0AB] block">🛡 Contingency Fund</span>
                            <strong className="text-[#263238] dark:text-[#F7F5EF] text-sm">₹{budgetAgent.result.allocation.contingency}</strong>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ----------------- ROUTE MODAL VIEW ----------------- */}
                {activeModalAgent === 'route' && routeAgent?.result && (
                  <div className="space-y-4">
                    <div className="bg-[#FFFFFF] dark:bg-[#1B2C28] p-5 rounded-xl border border-[#E3DED2] dark:border-[#2A403A] space-y-3 shadow-sm">
                      <div className="flex items-center justify-between">
                        <h3 className="text-base font-bold text-[#263238] dark:text-[#F7F5EF]">Direct Railway Track Simulation</h3>
                        <span className="text-xs px-2.5 py-1 rounded bg-[#EEF2ED] dark:bg-[#213530] text-[#4F7D62] font-bold border border-[#E3DED2] dark:border-[#2A403A]">
                          Optimal Speed
                        </span>
                      </div>
                      <p className="text-sm text-[#173F3A] dark:text-[#EEF2ED] font-mono font-bold">
                        {routeAgent.result.primaryRoute}
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                        <div className="p-3 bg-[#F7F5EF] dark:bg-[#12201D] rounded-lg text-xs border border-[#E3DED2] dark:border-[#2A403A]">
                          <span className="text-[#66736F] dark:text-[#A3B0AB] block">Travel Duration</span>
                          <strong className="text-[#263238] dark:text-[#F7F5EF]">{routeAgent.result.travelDuration}</strong>
                        </div>
                        <div className="p-3 bg-[#F7F5EF] dark:bg-[#12201D] rounded-lg text-xs border border-[#E3DED2] dark:border-[#2A403A]">
                          <span className="text-[#66736F] dark:text-[#A3B0AB] block">Track Distance</span>
                          <strong className="text-[#263238] dark:text-[#F7F5EF]">{routeAgent.result.distanceKm}</strong>
                        </div>
                        <div className="p-3 bg-[#F7F5EF] dark:bg-[#12201D] rounded-lg text-xs border border-[#E3DED2] dark:border-[#2A403A]">
                          <span className="text-[#66736F] dark:text-[#A3B0AB] block">Alternative Corridors</span>
                          <strong className="text-[#263238] dark:text-[#F7F5EF]">{routeAgent.result.alternativesCount} tracks traced</strong>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-[#E3DED2] dark:border-[#2A403A] bg-[#F7F5EF] dark:bg-[#12201D] flex items-center justify-end">
                <button
                  onClick={() => setActiveModalAgent(null)}
                  className="px-5 py-2 rounded-lg bg-[#173F3A] hover:bg-[#0F332F] dark:bg-[#EEF2ED] dark:hover:bg-[#FFFFFF] text-[#FFFFFF] dark:text-[#1B2C28] text-xs font-bold transition-colors"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
