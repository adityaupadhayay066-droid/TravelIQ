import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import useDevice from '../hooks/useDevice';
import DesktopFeaturePlaceholder from '../components/DesktopFeaturePlaceholder';
import { Leaf, Award, Compass, Globe, Info, HelpCircle, ShieldCheck, RefreshCw, BarChart3 } from 'lucide-react';
import { BarChart as RechartBarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { api } from '../utils/api';
import toast from 'react-hot-toast';

export default function EcoTrackerPage() {
    const { isMobile } = useDevice();
    const [summary, setSummary] = useState(null);
    const [trips, setTrips] = useState([]);
    const [selectedTripId, setSelectedTripId] = useState('');
    const [tripDetails, setTripDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [calculating, setCalculating] = useState(false);

    const loadData = async () => {
        setLoading(true);
        try {
            const summaryRes = await api.get('/carbon/summary');
            setSummary(summaryRes.data);

            const tripsRes = await api.get('/travel/history'); // Fetch planned trips
            setTrips(tripsRes.data || []);
            
            if (tripsRes.data && tripsRes.data.length > 0) {
                setSelectedTripId(tripsRes.data[0].id.toString());
            }
        } catch (error) {
            console.error('Failed to load carbon telemetry:', error);
            toast.error('Unable to fetch eco tracker details.');
        } finally {
            setLoading(false);
        }
    };

    const fetchTripEmissions = async (tripId) => {
        if (!tripId) return;
        setCalculating(true);
        try {
            const { data } = await api.get(`/carbon/trip/${tripId}`);
            setTripDetails(data);
        } catch (error) {
            console.error('Failed to load trip emissions comparative:', error);
        } finally {
            setCalculating(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        if (selectedTripId) {
            fetchTripEmissions(selectedTripId);
        }
    }, [selectedTripId]);

    // Graph Data
    const getGraphData = () => {
        if (!tripDetails || !tripDetails.emissions) return [];
        const { emissions } = tripDetails;
        return [
            { name: 'Flight', co2: emissions.flight, color: '#B94A48' },
            { name: 'Bus', co2: emissions.bus, color: '#E5B85C' },
            { name: 'Train', co2: emissions.train, color: '#4F7D62' }
        ];
    };

    const graphData = getGraphData();

    return (
        <div className="flex-1 bg-[#F7F5EF] dark:bg-[#12201D] min-h-screen py-8 px-4 md:px-8 relative">
            <div className="max-w-6xl mx-auto relative z-10 space-y-8">
                
                {/* Header */}
                <div className="flex items-center justify-between border-b border-[#E3DED2] dark:border-[#2A403A] pb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-[#263238] dark:text-[#F7F5EF] mb-2 flex items-center gap-3 font-['Manrope']">
                            <Leaf className="w-8 h-8 text-[#4F7D62]" /> Green Travel & Carbon Economics
                        </h1>
                        <p className="text-[#66736F] dark:text-[#A3B0AB] text-sm">
                            Analyze CO₂ impacts, trace comparative transit metrics, and earn badges as an eco-warrior.
                        </p>
                    </div>

                    <button
                        onClick={loadData}
                        disabled={loading}
                        className="bg-[#FFFFFF] dark:bg-[#1B2C28] border border-[#E3DED2] dark:border-[#2A403A] text-[#66736F] dark:text-[#A3B0AB] hover:text-[#173F3A] dark:hover:text-[#FFFFFF] rounded-lg p-2.5 transition-all shadow-sm"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>

                {loading ? (
                    <div className="py-40 text-center">
                        <div className="w-12 h-12 border-4 border-[#EEF2ED] dark:border-[#213530] border-t-[#4F7D62] rounded-full animate-spin mx-auto mb-4" />
                        <p className="text-[#66736F] dark:text-[#A3B0AB] text-sm">Querying green telemetry records...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        
                        {/* ─── Profile Summary Column (1/3) ─── */}
                        <div className="lg:col-span-1 space-y-6">
                            
                            {/* Eco Badge Panel */}
                            <div className="rounded-xl p-6 bg-[#FFFFFF] dark:bg-[#1B2C28] border border-[#E3DED2] dark:border-[#2A403A] text-center shadow-sm">
                                <div className="inline-flex items-center justify-center p-4 bg-[#EEF2ED] dark:bg-[#213530] rounded-xl mb-4 border border-[#E3DED2] dark:border-[#2A403A]">
                                    <Award className="w-10 h-10 text-[#4F7D62]" />
                                </div>
                                <h3 className="text-xs text-[#66736F] dark:text-[#A3B0AB] font-semibold uppercase tracking-widest mb-1">
                                    TravelIQ Badge Rank
                                </h3>
                                <h2 className="text-xl font-bold text-[#263238] dark:text-[#F7F5EF] leading-tight">
                                    {summary?.badge || 'Bronze Eco-Traveler'}
                                </h2>
                                
                                <div className="mt-6 pt-4 border-t border-[#E3DED2] dark:border-[#2A403A] flex items-center justify-center gap-2">
                                    <span className="text-[#263238] dark:text-[#F7F5EF] font-bold text-2xl">{summary?.eco_score_points || 0}</span>
                                    <span className="text-xs text-[#66736F] dark:text-[#A3B0AB] font-medium">Eco Points Earned 🌱</span>
                                </div>
                            </div>

                            {/* Progress towards next level */}
                            <div className="rounded-xl p-6 border border-[#E3DED2] dark:border-[#2A403A] bg-[#FFFFFF] dark:bg-[#1B2C28] shadow-sm">
                                <h4 className="text-xs font-semibold text-[#66736F] dark:text-[#A3B0AB] uppercase tracking-wider mb-4 flex justify-between items-center">
                                    <span>Next Badge Tier</span>
                                    <span className="text-[#4F7D62]">{summary?.next_badge}</span>
                                </h4>

                                <div className="w-full bg-[#EEF2ED] dark:bg-[#213530] h-3 rounded-full overflow-hidden border border-[#E3DED2] dark:border-[#2A403A] mb-3">
                                    <div 
                                        className="bg-[#4F7D62] h-full rounded-full transition-all duration-1000"
                                        style={{ width: `${summary?.percentage_to_next || 0}%` }}
                                    />
                                </div>
                                <div className="flex justify-between text-[10px] text-[#66736F] dark:text-[#A3B0AB]">
                                    <span>Current: {summary?.eco_score_points || 0} pt</span>
                                    <span>Goal: {summary?.next_badge_threshold || 100} pt</span>
                                </div>
                            </div>

                            {/* Accumulative Carbon Saved Stats */}
                            <div className="rounded-xl p-6 border border-[#E3DED2] dark:border-[#2A403A] bg-[#FFFFFF] dark:bg-[#1B2C28] shadow-sm space-y-4">
                                <h4 className="text-xs font-semibold text-[#66736F] dark:text-[#A3B0AB] uppercase tracking-wider mb-2">
                                    Eco Metrics Summary
                                </h4>
                                
                                <div className="flex items-center justify-between border-b border-[#E3DED2] dark:border-[#2A403A] pb-2.5">
                                    <span className="text-xs text-[#66736F] dark:text-[#A3B0AB]">Trips Audited</span>
                                    <strong className="text-[#263238] dark:text-[#F7F5EF] text-sm">{summary?.trips_logged || 0}</strong>
                                </div>
                                <div className="flex items-center justify-between border-b border-[#E3DED2] dark:border-[#2A403A] pb-2.5">
                                    <span className="text-xs text-[#66736F] dark:text-[#A3B0AB]">Total Distance Logged</span>
                                    <strong className="text-[#263238] dark:text-[#F7F5EF] text-sm">{summary?.total_distance_km || 0} km</strong>
                                </div>
                                <div className="flex items-center justify-between border-b border-[#E3DED2] dark:border-[#2A403A] pb-2.5">
                                    <span className="text-xs text-[#66736F] dark:text-[#A3B0AB]">CO₂ Expelled (Actual)</span>
                                    <strong className="text-[#B94A48] text-sm">{summary?.total_emissions_co2_kg || 0} kg</strong>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-[#66736F] dark:text-[#A3B0AB]">Total Saved CO₂ 🌱</span>
                                    <strong className="text-[#4F7D62] text-sm">{summary?.total_saved_co2_kg || 0} kg</strong>
                                </div>
                            </div>
                        </div>

                        {/* ─── Detailed Comparative Chart Column (2/3) ─── */}
                        <div className="lg:col-span-2 space-y-6">
                            
                            {/* Trip Footprint comparative */}
                            <div className="rounded-xl p-6 border border-[#E3DED2] dark:border-[#2A403A] bg-[#FFFFFF] dark:bg-[#1B2C28] shadow-sm">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                                    <div>
                                        <h3 className="text-lg font-bold text-[#263238] dark:text-[#F7F5EF] flex items-center gap-2 font-['Manrope']">
                                            <BarChart3 className="w-5 h-5 text-[#4F7D62]" /> Comparative Emissions Calculator
                                        </h3>
                                        <p className="text-xs text-[#66736F] dark:text-[#A3B0AB]">Compare travel impact for your upcoming itineraries.</p>
                                    </div>

                                    {/* Trip select dropdown */}
                                    {trips.length > 0 ? (
                                        <select
                                            value={selectedTripId}
                                            onChange={(e) => setSelectedTripId(e.target.value)}
                                            className="bg-[#FFFFFF] dark:bg-[#1B2C28] border border-[#E3DED2] dark:border-[#2A403A] rounded-lg px-3 py-2 text-xs text-[#263238] dark:text-[#F7F5EF] focus:outline-none cursor-pointer max-w-xs shadow-sm"
                                        >
                                            {trips.map(trip => (
                                                <option key={trip.id} value={trip.id} className="bg-[#FFFFFF] dark:bg-[#1B2C28] text-[#263238] dark:text-[#F7F5EF]">
                                                    {trip.source} → {trip.destination}
                                                </option>
                                            ))}
                                        </select>
                                    ) : (
                                        <div className="text-xs text-[#66736F] dark:text-[#A3B0AB]">No active trips planned</div>
                                    )}
                                </div>

                                {calculating ? (
                                    <div className="py-24 text-center">
                                        <div className="w-8 h-8 border-4 border-[#EEF2ED] dark:border-[#213530] border-t-[#4F7D62] rounded-full animate-spin mx-auto mb-2" />
                                        <p className="text-[#66736F] dark:text-[#A3B0AB] text-xs">Re-calculating footprints...</p>
                                    </div>
                                ) : !tripDetails ? (
                                    <div className="py-20 text-center text-[#66736F] dark:text-[#A3B0AB]">
                                        <Info className="w-10 h-10 text-[#66736F] dark:text-[#A3B0AB] mx-auto mb-3" />
                                        <p className="text-xs">Select or add a planned trip to compare eco-impacts.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-8">
                                        
                                        {/* Carbon economics highlights */}
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                            <div className="bg-[#FFFFFF] dark:bg-[#1B2C28] border border-[#E3DED2] dark:border-[#2A403A] rounded-xl p-4 text-center shadow-sm">
                                                <span className="text-[10px] text-[#66736F] dark:text-[#A3B0AB] font-semibold uppercase tracking-wider block">Chosen Travel Mode</span>
                                                <div className="text-sm font-bold text-[#263238] dark:text-[#F7F5EF] my-1">{tripDetails.chosen_mode}</div>
                                                <span className="text-[10px] text-[#66736F] dark:text-[#A3B0AB]">Distance: {tripDetails.distance_km} km</span>
                                            </div>
                                            <div className="bg-[#FFFFFF] dark:bg-[#1B2C28] border border-[#E3DED2] dark:border-[#2A403A] rounded-xl p-4 text-center shadow-sm">
                                                <span className="text-[10px] text-[#66736F] dark:text-[#A3B0AB] font-semibold uppercase tracking-wider block">Mode Footprint</span>
                                                <div className="text-sm font-bold text-[#B94A48] my-1">{tripDetails.emissions.chosen} kg CO₂</div>
                                                <span className="text-[10px] text-[#66736F] dark:text-[#A3B0AB]">Estimated emissions</span>
                                            </div>
                                            <div className="bg-[#EEF2ED] dark:bg-[#213530] border border-[#4F7D62]/20 rounded-xl p-4 text-center shadow-sm">
                                                <span className="text-[10px] text-[#4F7D62] font-semibold uppercase tracking-wider block">Carbon Saved 🌱</span>
                                                <div className="text-lg font-bold text-[#4F7D62] my-0.5">{tripDetails.emissions.saved} kg CO₂</div>
                                                <span className="text-[9px] text-[#4F7D62]/80">Compared to high-impact flight</span>
                                            </div>
                                        </div>

                                        {/* Footprints Rechart bar graph */}
                                        {isMobile ? (
                                            <div className="py-4">
                                                <DesktopFeaturePlaceholder 
                                                    title="Detailed Emission Analytics" 
                                                    description="View interactive CO2 comparative graphs on a desktop device." 
                                                />
                                            </div>
                                        ) : (
                                            <div className="h-64 w-full">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <RechartBarChart data={graphData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                                        <XAxis dataKey="name" stroke="#66736F" fontSize={11} tickLine={false} />
                                                        <YAxis stroke="#66736F" fontSize={11} tickLine={false} />
                                                        <Tooltip 
                                                            cursor={{ fill: 'rgba(38, 50, 56, 0.04)' }}
                                                            contentStyle={{ background: 'var(--color-surface, #FFFFFF)', border: '1px solid var(--color-border, #E3DED2)', borderRadius: '8px' }}
                                                            labelStyle={{ color: 'var(--color-text, #263238)', fontSize: '12px', fontWeight: 'bold' }}
                                                            itemStyle={{ color: '#4F7D62', fontSize: '11px' }}
                                                            formatter={(value) => [`${value} kg CO₂`, 'Emission']}
                                                        />
                                                        <Bar dataKey="co2" radius={[6, 6, 0, 0]} maxBarSize={45}>
                                                            {graphData.map((entry, index) => (
                                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                                            ))}
                                                        </Bar>
                                                    </RechartBarChart>
                                                </ResponsiveContainer>
                                            </div>
                                        )}

                                        {/* Eco Scoring tips */}
                                        <div className="p-4 bg-[#EEF2ED] dark:bg-[#213530] border border-[#E3DED2] dark:border-[#2A403A] rounded-xl flex items-start gap-3">
                                            <Info className="w-5 h-5 text-[#4F7D62] flex-shrink-0 mt-0.5" />
                                            <div>
                                                <h5 className="text-xs text-[#263238] dark:text-[#F7F5EF] font-bold mb-1">Eco-Travel Tips</h5>
                                                <p className="text-[11px] text-[#66736F] dark:text-[#A3B0AB] leading-relaxed">
                                                    Choosing trains over short-haul regional flights reduces your carbon footprints by **up to 85%**! Green choices immediately improve your TravelIQ Eco Score and help you achieve the **Gold Green Pioneer** badge rank!
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
