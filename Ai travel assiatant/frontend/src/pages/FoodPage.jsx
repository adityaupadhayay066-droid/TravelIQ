import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Utensils, Star, DollarSign, Search, Award, Check, MapPin, Sparkles, Navigation, Clock, Bike, ShoppingBag, Map, Filter, Heart, AlertTriangle, IndianRupee, Droplet } from 'lucide-react';
import { api, aiApi } from '../utils/api';
import toast from 'react-hot-toast';

import { Link } from 'react-router-dom';

const CITIES = ['Bhubaneswar', 'Delhi', 'Mumbai', 'Kolkata', 'Chennai', 'Hyderabad', 'Bangalore', 'Pune', 'Jaipur', 'Goa'];
const TABS = ['Cuisine Explorer', 'Local Food Delivery', 'Station Price Guide'];
const CUISINES = ['All', 'Traditional', 'Street Food', 'Desserts', 'Snacks', 'North Indian', 'South Indian'];

export default function FoodPage() {
    const [selectedCity, setSelectedCity] = useState('Bhubaneswar');
    const [activeTab, setActiveTab] = useState('Cuisine Explorer');
    const [foods, setFoods] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Filters
    const [vegFilter, setVegFilter] = useState(false);
    const [jainFilter, setJainFilter] = useState(false);
    const [highProteinFilter, setHighProteinFilter] = useState(false);
    const [budgetFilter, setBudgetFilter] = useState(false);
    const [cuisineFilter, setCuisineFilter] = useState('All');
    
    // AI State
    const [aiRecommendations, setAiRecommendations] = useState(null);
    const [aiLoading, setAiLoading] = useState(false);

    // Dynamic Mock Data mapped by City
    const CITY_CUISINES = {
        'Bhubaneswar': [
            { id: 1, name: 'Dalma', category: 'Traditional', description: 'A nutritious lentil and vegetable stew, slow-cooked to perfection without onion or garlic.', price: '₹120', popularity: 98, image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400', isVeg: true, isJain: true },
            { id: 2, name: 'Pakhala Bhata', category: 'Local Specialty', description: 'Fermented rice with water, served with fried vegetables and fish. Perfect for summer.', price: '₹150', popularity: 95, image: 'https://images.unsplash.com/photo-1512152272829-e3139592d56f?w=400', isVeg: true },
            { id: 3, name: 'Chhena Poda', category: 'Desserts', description: 'Odisha\'s famous roasted cheese dessert, caramelized with sugar and cardamom.', price: '₹180/kg', popularity: 99, image: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400', isVeg: true },
            { id: 4, name: 'Dahi Bara Aloo Dum', category: 'Street Food', description: 'Spicy potato curry over curd-soaked lentil dumplings, topped with sev.', price: '₹50', popularity: 97, image: 'https://images.unsplash.com/photo-1626804475297-41609ea0058b?w=400', isVeg: true },
            { id: 5, name: 'Mutton Curry', category: 'Traditional', description: 'Odisha style slow-cooked mutton curry with tender potatoes.', price: '₹350', popularity: 94, image: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=400', isVeg: false, highProtein: true }
        ],
        'Delhi': [
            { id: 10, name: 'Chole Bhature', category: 'Street Food', description: 'Spicy chickpea curry served with fried bread. A classic Delhi breakfast.', price: '₹120', popularity: 99, image: 'https://images.unsplash.com/photo-1626132647523-66f5bf380027?w=400', isVeg: true },
            { id: 11, name: 'Butter Chicken', category: 'Traditional', description: 'Tender chicken cooked in a rich, creamy tomato and butter sauce.', price: '₹350', popularity: 98, image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=400', isVeg: false, highProtein: true },
            { id: 12, name: 'Aloo Tikki Chaat', category: 'Street Food', description: 'Crispy potato patties topped with sweet and spicy chutneys and yogurt.', price: '₹80', popularity: 96, image: 'https://images.unsplash.com/photo-1626804475297-41609ea0058b?w=400', isVeg: true }
        ],
        'Mumbai': [
            { id: 20, name: 'Vada Pav', category: 'Street Food', description: 'Mumbai\'s iconic street food: a spicy potato dumpling in a soft bun.', price: '₹20', popularity: 99, image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400', isVeg: true },
            { id: 21, name: 'Pav Bhaji', category: 'Street Food', description: 'Spicy vegetable mash served with buttered bread rolls.', price: '₹150', popularity: 97, image: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=400', isVeg: true }
        ],
        'Kolkata': [
            { id: 30, name: 'Rosogolla', category: 'Desserts', description: 'Spongy cottage cheese balls soaked in light sugar syrup.', price: '₹150/kg', popularity: 99, image: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400', isVeg: true },
            { id: 31, name: 'Kathi Roll', category: 'Street Food', description: 'Skewer-roasted kebab wrapped in a paratha bread.', price: '₹80', popularity: 96, image: 'https://images.unsplash.com/photo-1626804475297-41609ea0058b?w=400', isVeg: false, highProtein: true }
        ],
        'Chennai': [
            { id: 40, name: 'Idli Sambar', category: 'South Indian', description: 'Steamed rice cakes served with lentil stew and coconut chutney.', price: '₹60', popularity: 98, image: 'https://images.unsplash.com/photo-1589301760014-d929f39ce9b1?w=400', isVeg: true },
            { id: 41, name: 'Masala Dosa', category: 'South Indian', description: 'Thin, crispy crepe made from rice and lentils, filled with potato masala.', price: '₹80', popularity: 99, image: 'https://images.unsplash.com/photo-1589301760014-d929f39ce9b1?w=400', isVeg: true }
        ],
        'Hyderabad': [
             { id: 50, name: 'Hyderabadi Biryani', category: 'Traditional', description: 'Rich, aromatic rice dish cooked with marinated meat and spices.', price: '₹250', popularity: 99, image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400', isVeg: false, highProtein: true }
        ],
        'Bangalore': [
            { id: 60, name: 'Bisi Bele Bath', category: 'South Indian', description: 'Spicy rice and lentil dish with vegetables, typical of Karnataka.', price: '₹110', popularity: 95, image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400', isVeg: true }
        ]
    };

    const mockCuisines = CITY_CUISINES[selectedCity] || [
        { id: 99, name: 'Local Specialty', category: 'Traditional', description: `Explore authentic traditional food in ${selectedCity}.`, price: '₹150', popularity: 90, image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400', isVeg: true }
    ];

    const mockStationPrices = [
        { id: 1, type: 'Beverage', item: 'Tea (Standard Cup)', platform: '₹10-15', train: '₹10', mrp: null, icon: Utensils },
        { id: 2, type: 'Beverage', item: 'Coffee (Standard Cup)', platform: '₹15-20', train: '₹20', mrp: null, icon: Utensils },
        { id: 3, type: 'Water', item: 'Rail Neer Water (1L)', platform: '₹15', train: '₹15', mrp: 15, icon: Droplet },
        { id: 4, type: 'Water', item: 'Kinley/Bisleri (1L)', platform: '₹20', train: '₹20', mrp: 20, icon: Droplet },
        { id: 5, type: 'Meal', item: 'Standard Veg Thali', platform: '₹80-120', train: '₹150 (IRCTC)', mrp: null, icon: ShoppingBag },
        { id: 6, type: 'Meal', item: 'Standard Egg Thali', platform: '₹100-140', train: '₹180 (IRCTC)', mrp: null, icon: ShoppingBag },
        { id: 7, type: 'Snack', item: 'Samosa / Vada (2 pcs)', platform: '₹20-30', train: '₹30', mrp: null, icon: Utensils },
    ];

    const fetchFood = async () => {
        setLoading(true);
        try {
            const { data } = await api.get(`/food/discover`, {
                params: {
                    city: selectedCity,
                    veg: vegFilter,
                    jain: jainFilter
                }
            });
            // If backend fails or returns empty for testing, we use mock
            if(data.recommendations && data.recommendations.length > 0) {
                setFoods(data.recommendations);
            } else {
                // Fallback to mock delivery foods
                setFoods([
                    { id: 101, food_name: 'Special Veg Thali', restaurant: 'Govinda\'s Restaurant', image_url: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400', is_veg: true, is_jain: false, is_must_try: 1, prices: [{platform: 'Zomato', price: '180', delivery_fee: '40'}, {platform: 'Swiggy', price: '190', delivery_fee: '30'}, {platform: 'IRCTC', price: '150', delivery_fee: '0'}] },
                    { id: 102, food_name: 'Hyderabadi Chicken Biryani', restaurant: 'Biryani Palace', image_url: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400', is_veg: false, is_jain: false, is_must_try: 0, prices: [{platform: 'Zomato', price: '260', delivery_fee: '35'}, {platform: 'Swiggy', price: '250', delivery_fee: '45'}, {platform: 'Restaurant', price: '220', delivery_fee: '0'}] }
                ]);
            }
        } catch (error) {
            console.error('Failed to load food:', error);
            // Fallback
             setFoods([
                { id: 101, food_name: 'Special Veg Thali', restaurant: 'Govinda\'s Restaurant', image_url: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400', is_veg: true, is_jain: false, is_must_try: 1, prices: [{platform: 'Zomato', price: '180', delivery_fee: '40'}, {platform: 'Swiggy', price: '190', delivery_fee: '30'}, {platform: 'IRCTC', price: '150', delivery_fee: '0'}] },
                { id: 102, food_name: 'Hyderabadi Chicken Biryani', restaurant: 'Biryani Palace', image_url: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400', is_veg: false, is_jain: false, is_must_try: 0, prices: [{platform: 'Zomato', price: '260', delivery_fee: '35'}, {platform: 'Swiggy', price: '250', delivery_fee: '45'}, {platform: 'Restaurant', price: '220', delivery_fee: '0'}] }
            ]);
        } finally {
            setLoading(false);
        }
    };

    const fetchAiRecommendations = async () => {
        setAiLoading(true);
        try {
            // Simulated AI processing for Food
            setTimeout(() => {
                setAiRecommendations({
                    reasoning: `Based on your selection of ${selectedCity}, the weather is humid. We recommend hydrating foods like Pakhala Bhata or fresh coconut water. For a long train journey, dry snacks and packed Biryani travel best.`,
                    recommended_tags: ['Hydrating', 'Travel Friendly', 'Local Authentic']
                });
                setAiLoading(false);
            }, 1000);
        } catch (err) {
            console.error("AI engine error", err);
            setAiLoading(false);
        }
    }

    useEffect(() => {
        fetchFood();
        fetchAiRecommendations();
    }, [selectedCity, vegFilter, jainFilter]);

    // Helpers to find cheapest price across platforms
    const getCheapestOption = (prices) => {
        if (!prices || prices.length === 0) return null;
        return prices.reduce((prev, curr) => ((parseFloat(curr.price) + parseFloat(curr.delivery_fee)) < (parseFloat(prev.price) + parseFloat(prev.delivery_fee)) ? curr : prev));
    };

    const getPlatformColor = (platform) => {
        switch(platform) {
            case 'Zomato': return 'text-[#D96C4F] bg-[#D96C4F]/10 border-[#D96C4F]/20';
            case 'Swiggy': return 'text-[#E5B85C] bg-[#E5B85C]/10 border-[#E5B85C]/20';
            case 'IRCTC': return 'text-[#173F3A] dark:text-[#EEF2ED] bg-[#173F3A]/10 dark:bg-[#EEF2ED]/10 border-[#173F3A]/20 dark:border-[#EEF2ED]/20';
            default: return 'text-[#173F3A] dark:text-[#EEF2ED] bg-[#EEF2ED] dark:bg-[#213530] border-[#E3DED2] dark:border-[#2A403A]';
        }
    };

    const handleFindNearby = (foodName) => {
        toast.success(`Searching for authentic ${foodName} vendors near your location...`, { icon: '📍' });
    };

    return (
        <div className="flex-1 bg-[#F7F5EF] dark:bg-[#12201D] min-h-screen pb-12 font-['Inter'] text-[#263238] dark:text-[#F7F5EF]">
            
            {/* Header Area */}
            <div className="bg-[#FFFFFF] dark:bg-[#1B2C28] border-b border-[#E3DED2] dark:border-[#2A403A] pt-8 pb-6 px-4 md:px-8">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-end md:justify-between gap-6">
                    <div>
                        <h1 className="text-3xl font-['Manrope'] font-bold text-[#173F3A] dark:text-[#EEF2ED] mb-2 flex items-center gap-3">
                            <Utensils className="w-8 h-8 text-[#D96C4F]" /> Professional Food Assistant
                        </h1>
                        <p className="text-[#66736F] dark:text-[#A3B0AB] text-sm max-w-2xl font-normal">
                            Discover local cuisines, track accurate station food prices, and compare delivery platforms to prevent overcharging during your journey.
                        </p>
                    </div>

                    <div className="flex items-center gap-3 bg-[#EEF2ED] dark:bg-[#213530] border border-[#E3DED2] dark:border-[#2A403A] rounded-xl px-4 py-2.5 min-w-[250px]">
                        <MapPin className="w-5 h-5 text-[#173F3A] dark:text-[#EEF2ED] flex-shrink-0" />
                        <div className="flex-1">
                            <span className="text-[10px] text-[#66736F] dark:text-[#A3B0AB] font-bold uppercase tracking-wider block">Exploring Destination</span>
                            <select
                                value={selectedCity}
                                onChange={(e) => setSelectedCity(e.target.value)}
                                className="bg-transparent text-sm font-semibold text-[#173F3A] dark:text-[#EEF2ED] focus:outline-none cursor-pointer w-full"
                            >
                                {CITIES.map(city => <option key={city} value={city} className="bg-[#FFFFFF] dark:bg-[#1B2C28] text-[#263238] dark:text-[#F7F5EF]">{city}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Main Tabs */}
                <div className="max-w-7xl mx-auto mt-8 flex items-center gap-4 overflow-x-auto pb-2 scrollbar-hide">
                    {TABS.map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
                                activeTab === tab 
                                    ? 'bg-[#173F3A] dark:bg-[#EEF2ED] text-white dark:text-[#173F3A] shadow-sm' 
                                    : 'bg-transparent text-[#66736F] dark:text-[#A3B0AB] border border-[#E3DED2] dark:border-[#2A403A] hover:text-[#173F3A] dark:hover:text-[#FFFFFF] hover:bg-[#EEF2ED] dark:hover:bg-[#213530]'
                            }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 md:px-8 mt-8 grid grid-cols-1 lg:grid-cols-4 gap-8">
                
                {/* Left Sidebar - Filters & AI */}
                <div className="space-y-6">
                    
                    {/* AI Recommendation Box */}
                    <div className="bg-[#EEF2ED] dark:bg-[#213530] border border-[#E3DED2] dark:border-[#2A403A] rounded-xl p-5 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-3 opacity-10"><Sparkles className="w-16 h-16 text-[#D96C4F]" /></div>
                        <h3 className="text-sm font-['Manrope'] font-bold text-[#173F3A] dark:text-[#EEF2ED] flex items-center gap-2 mb-3">
                            <Sparkles className="w-4 h-4 text-[#D96C4F]" /> AI Travel Sommelier
                        </h3>
                        {aiLoading ? (
                            <div className="flex space-x-4"><div className="flex-1 space-y-3 py-1"><div className="h-2 bg-[#E3DED2] dark:bg-[#2A403A] rounded w-3/4"></div><div className="h-2 bg-[#E3DED2] dark:bg-[#2A403A] rounded w-full"></div></div></div>
                        ) : aiRecommendations ? (
                            <>
                                <p className="text-xs text-[#263238] dark:text-[#F7F5EF] leading-relaxed mb-4">{aiRecommendations.reasoning}</p>
                                <div className="flex flex-wrap gap-2">
                                    {aiRecommendations.recommended_tags.map((tag, i) => (
                                        <span key={i} className="text-[10px] font-bold uppercase tracking-wider bg-[#FFFFFF] dark:bg-[#1B2C28] text-[#173F3A] dark:text-[#EEF2ED] px-2 py-1 rounded-md border border-[#E3DED2] dark:border-[#2A403A]">{tag}</span>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <p className="text-xs text-[#66736F] dark:text-[#A3B0AB]">AI recommendations currently unavailable.</p>
                        )}
                    </div>

                    {/* Health & Diet Filters */}
                    <div className="bg-[#FFFFFF] dark:bg-[#1B2C28] border border-[#E3DED2] dark:border-[#2A403A] rounded-xl p-5 space-y-5 shadow-sm">
                        <h3 className="text-sm font-['Manrope'] font-bold text-[#173F3A] dark:text-[#EEF2ED] uppercase tracking-wider flex items-center gap-2">
                            <Filter className="w-4 h-4 text-[#D96C4F]" /> Health & Diet
                        </h3>
                        
                        <div className="space-y-3">
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${vegFilter ? 'bg-[#173F3A] dark:bg-[#EEF2ED] border-[#173F3A] dark:border-[#EEF2ED]' : 'border-[#E3DED2] dark:border-[#2A403A] bg-[#FFFFFF] dark:bg-[#1B2C28] group-hover:border-[#66736F] dark:group-hover:border-[#A3B0AB]'}`}>
                                    {vegFilter && <Check className="w-3.5 h-3.5 text-white dark:text-[#173F3A]" />}
                                </div>
                                <span className="text-sm text-[#263238] dark:text-[#F7F5EF] font-medium">Pure Vegetarian</span>
                            </label>

                            <label className="flex items-center gap-3 cursor-pointer group">
                                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${jainFilter ? 'bg-[#173F3A] dark:bg-[#EEF2ED] border-[#173F3A] dark:border-[#EEF2ED]' : 'border-[#E3DED2] dark:border-[#2A403A] bg-[#FFFFFF] dark:bg-[#1B2C28] group-hover:border-[#66736F] dark:group-hover:border-[#A3B0AB]'}`}>
                                    {jainFilter && <Check className="w-3.5 h-3.5 text-white dark:text-[#173F3A]" />}
                                </div>
                                <span className="text-sm text-[#263238] dark:text-[#F7F5EF] font-medium">Jain (No Onion/Garlic)</span>
                            </label>

                            <label className="flex items-center gap-3 cursor-pointer group">
                                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${highProteinFilter ? 'bg-[#173F3A] dark:bg-[#EEF2ED] border-[#173F3A] dark:border-[#EEF2ED]' : 'border-[#E3DED2] dark:border-[#2A403A] bg-[#FFFFFF] dark:bg-[#1B2C28] group-hover:border-[#66736F] dark:group-hover:border-[#A3B0AB]'}`}>
                                    {highProteinFilter && <Check className="w-3.5 h-3.5 text-white dark:text-[#173F3A]" />}
                                </div>
                                <span className="text-sm text-[#263238] dark:text-[#F7F5EF] font-medium">High Protein</span>
                            </label>

                            <label className="flex items-center gap-3 cursor-pointer group">
                                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${budgetFilter ? 'bg-[#173F3A] dark:bg-[#EEF2ED] border-[#173F3A] dark:border-[#EEF2ED]' : 'border-[#E3DED2] dark:border-[#2A403A] bg-[#FFFFFF] dark:bg-[#1B2C28] group-hover:border-[#66736F] dark:group-hover:border-[#A3B0AB]'}`}>
                                    {budgetFilter && <Check className="w-3.5 h-3.5 text-white dark:text-[#173F3A]" />}
                                </div>
                                <span className="text-sm text-[#263238] dark:text-[#F7F5EF] font-medium">Budget / Student Friendly</span>
                            </label>
                        </div>

                        <div className="pt-4 border-t border-[#E3DED2] dark:border-[#2A403A]">
                            <span className="text-[10px] font-bold text-[#66736F] dark:text-[#A3B0AB] uppercase tracking-wider block mb-3">Categories</span>
                            <div className="flex flex-wrap gap-2">
                                {CUISINES.map(c => (
                                    <button 
                                        key={c}
                                        onClick={() => setCuisineFilter(c)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border ${cuisineFilter === c ? 'bg-[#173F3A] dark:bg-[#EEF2ED] border-[#173F3A] dark:border-[#EEF2ED] text-white dark:text-[#173F3A]' : 'bg-[#F7F5EF] dark:bg-[#12201D] border-[#E3DED2] dark:border-[#2A403A] text-[#66736F] dark:text-[#A3B0AB] hover:text-[#173F3A] dark:hover:text-white'}`}
                                    >
                                        {c}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Content Area */}
                <div className="lg:col-span-3">
                    
                    {/* TAB: CUISINE EXPLORER */}
                    {activeTab === 'Cuisine Explorer' && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-['Manrope'] font-bold text-[#173F3A] dark:text-[#EEF2ED]">Authentic {selectedCity} Foods</h2>
                                    <p className="text-sm text-[#66736F] dark:text-[#A3B0AB]">Discover must-try local specialties.</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {mockCuisines
                                    .filter(c => cuisineFilter === 'All' || c.category === cuisineFilter)
                                    .filter(c => !vegFilter || c.isVeg)
                                    .filter(c => !jainFilter || c.isJain)
                                    .map(cuisine => (
                                    <motion.div 
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        key={cuisine.id} 
                                        className="bg-[#FFFFFF] dark:bg-[#1B2C28] border border-[#E3DED2] dark:border-[#2A403A] rounded-xl overflow-hidden hover:shadow-[0_4px_16px_rgba(23,63,58,0.06)] transition-all flex flex-col group"
                                    >
                                        <div className="h-48 relative overflow-hidden bg-[#F7F5EF] dark:bg-[#12201D]">
                                            <img src={cuisine.image} alt={cuisine.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                            
                                            <div className="absolute top-3 left-3 flex gap-2">
                                                {cuisine.isVeg && <span className="bg-[#FFFFFF] dark:bg-[#1B2C28] text-[#173F3A] dark:text-[#EEF2ED] px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border border-[#E3DED2] dark:border-[#2A403A]">Veg</span>}
                                                {cuisine.isJain && <span className="bg-[#FFFFFF] dark:bg-[#1B2C28] text-[#173F3A] dark:text-[#EEF2ED] px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border border-[#E3DED2] dark:border-[#2A403A]">Jain</span>}
                                                {cuisine.highProtein && <span className="bg-[#FFFFFF] dark:bg-[#1B2C28] text-[#173F3A] dark:text-[#EEF2ED] px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border border-[#E3DED2] dark:border-[#2A403A]">High Protein</span>}
                                            </div>
                                            <div className="absolute top-3 right-3 bg-[#FFFFFF] dark:bg-[#1B2C28] border border-[#E3DED2] dark:border-[#2A403A] text-[#263238] dark:text-[#F7F5EF] px-2 py-1 rounded flex items-center gap-1 text-[10px] font-bold">
                                                <Star className="w-3 h-3 text-[#E5B85C] fill-[#E5B85C]" /> {cuisine.popularity}% Match
                                            </div>
                                        </div>

                                        <div className="p-5 flex-1 flex flex-col">
                                            <div className="flex justify-between items-start mb-2">
                                                <h3 className="text-xl font-['Manrope'] font-bold text-[#173F3A] dark:text-[#EEF2ED] leading-tight">{cuisine.name}</h3>
                                                <span className="text-sm font-bold text-[#173F3A] dark:text-[#EEF2ED] bg-[#EEF2ED] dark:bg-[#213530] px-2 py-1 rounded border border-[#E3DED2] dark:border-[#2A403A]">{cuisine.price}</span>
                                            </div>
                                            <span className="text-[10px] text-[#D96C4F] uppercase font-bold tracking-wider mb-3 block">{cuisine.category}</span>
                                            <p className="text-sm text-[#66736F] dark:text-[#A3B0AB] leading-relaxed mb-4 flex-1">{cuisine.description}</p>
                                            <button 
                                                onClick={() => handleFindNearby(cuisine.name)}
                                                className="w-full py-2.5 bg-[#173F3A] dark:bg-[#EEF2ED] hover:bg-[#0F332F] dark:hover:bg-[#FFFFFF] active:scale-[0.98] text-white dark:text-[#173F3A] rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2"
                                            >
                                                <Search className="w-4 h-4" /> Find Nearby
                                            </button>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* TAB: LOCAL FOOD DELIVERY (Price Comparison) */}
                    {activeTab === 'Local Food Delivery' && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-['Manrope'] font-bold text-[#173F3A] dark:text-[#EEF2ED]">Aggregated Delivery Options</h2>
                                    <p className="text-sm text-[#66736F] dark:text-[#A3B0AB]">Compare Swiggy, Zomato, and IRCTC eCatering.</p>
                                </div>
                            </div>
                            
                            {loading ? (
                                <div className="py-20 text-center">
                                    <div className="w-10 h-10 border-2 border-[#E3DED2] dark:border-[#2A403A] border-t-[#173F3A] dark:border-t-[#EEF2ED] rounded-full animate-spin mx-auto mb-4" />
                                    <p className="text-[#66736F] dark:text-[#A3B0AB] text-sm">Aggregating prices across platforms...</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {foods.map(food => {
                                        const cheapest = getCheapestOption(food.prices);
                                        
                                        return (
                                        <motion.div 
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            key={food.id} 
                                            className="bg-[#FFFFFF] dark:bg-[#1B2C28] border border-[#E3DED2] dark:border-[#2A403A] rounded-xl overflow-hidden hover:shadow-[0_4px_16px_rgba(23,63,58,0.06)] transition-all flex flex-col group"
                                        >
                                            {/* Image */}
                                            <div className="h-36 relative overflow-hidden bg-[#F7F5EF] dark:bg-[#12201D] border-b border-[#E3DED2] dark:border-[#2A403A]">
                                                <img src={food.image_url} alt={food.food_name} className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300" />
                                            </div>

                                            {/* Content */}
                                            <div className="p-4 flex-1 flex flex-col">
                                                <div className="mb-3">
                                                    <h3 className="text-base font-['Manrope'] font-bold text-[#263238] dark:text-[#F7F5EF] leading-snug">{food.food_name}</h3>
                                                    <p className="text-xs text-[#66736F] dark:text-[#A3B0AB] mt-1 flex items-center gap-1.5"><MapPin className="w-3 h-3 text-[#D96C4F]" /> {food.restaurant}</p>
                                                </div>
                                                {/* Dynamic Price Comparison Matrix */}
                                                <div className="mt-auto">
                                                    <span className="text-[10px] font-bold text-[#66736F] dark:text-[#A3B0AB] uppercase tracking-wider mb-3 block flex items-center gap-2"><IndianRupee className="w-3 h-3" /> Total Cost Matrix (Inc. Delivery)</span>
                                                    
                                                    {food.prices && food.prices.length > 0 ? (
                                                        <div className="space-y-2">
                                                            {food.prices.map((p, idx) => {
                                                                const totalCost = parseFloat(p.price) + parseFloat(p.delivery_fee);
                                                                const isCheapest = cheapest && cheapest.platform === p.platform;
                                                                
                                                                return (
                                                                    <div key={idx} className={`flex items-center justify-between p-2 rounded-lg border ${isCheapest ? 'bg-[#EEF2ED] dark:bg-[#213530] border-[#173F3A] dark:border-[#EEF2ED]' : 'bg-[#F7F5EF] dark:bg-[#12201D] border-[#E3DED2] dark:border-[#2A403A]'}`}>
                                                                        <div className="flex items-center gap-2">
                                                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${getPlatformColor(p.platform)}`}>
                                                                                {p.platform}
                                                                            </span>
                                                                            {isCheapest && <span className="text-[9px] text-[#173F3A] dark:text-[#EEF2ED] font-bold uppercase tracking-wider flex items-center gap-1"><Check className="w-3 h-3" /> Best</span>}
                                                                        </div>
                                                                        <div className="flex items-center gap-3">
                                                                            <div className="text-right">
                                                                                <span className="text-sm font-bold text-[#263238] dark:text-[#F7F5EF] block leading-none">₹{totalCost}</span>
                                                                                <span className="text-[9px] text-[#66736F] dark:text-[#A3B0AB] font-medium">({p.price} + {p.delivery_fee} del)</span>
                                                                            </div>
                                                                            <a 
                                                                                href={p.order_url || '#'} 
                                                                                target="_blank" 
                                                                                rel="noreferrer"
                                                                                className="p-1.5 rounded-md bg-[#173F3A] dark:bg-[#EEF2ED] hover:bg-[#0F332F] dark:hover:bg-[#FFFFFF] text-white dark:text-[#173F3A] transition-colors"
                                                                                title={`Order on ${p.platform}`}
                                                                            >
                                                                                <ShoppingBag className="w-3.5 h-3.5" />
                                                                            </a>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    ) : (
                                                        <div className="bg-[#F7F5EF] dark:bg-[#12201D] border border-[#E3DED2] dark:border-[#2A403A] rounded-lg p-3 text-center">
                                                            <span className="text-xs text-[#66736F] dark:text-[#A3B0AB] font-medium">Price Unavailable</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </motion.div>
                                    )})}
                                </div>
                            )}
                        </div>
                    )}

                    {/* TAB: STATION PRICE GUIDE */}
                    {activeTab === 'Station Price Guide' && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-['Manrope'] font-bold text-[#173F3A] dark:text-[#EEF2ED]">Official Station & Train Price Guide</h2>
                                    <p className="text-sm text-[#66736F] dark:text-[#A3B0AB]">Avoid overcharging by checking standard railway rates and MRP.</p>
                                </div>
                            </div>

                            <div className="bg-[#FFFFFF] dark:bg-[#1B2C28] border border-[#E3DED2] dark:border-[#2A403A] rounded-xl overflow-hidden shadow-sm">
                                <div className="overflow-x-auto scrollbar-none">
                                    <div className="min-w-[650px]">
                                        {/* Table Header */}
                                        <div className="grid grid-cols-12 gap-4 p-4 bg-[#EEF2ED] dark:bg-[#213530] border-b border-[#E3DED2] dark:border-[#2A403A] text-xs font-bold text-[#173F3A] dark:text-[#EEF2ED] uppercase tracking-wider">
                                            <div className="col-span-4">Item Description</div>
                                            <div className="col-span-2 text-center">Station Stall</div>
                                            <div className="col-span-2 text-center">Train Pantry</div>
                                            <div className="col-span-2 text-center">MRP Alert</div>
                                            <div className="col-span-2 text-center">Action</div>
                                        </div>

                                        {/* Table Body */}
                                        <div className="divide-y divide-[#E3DED2] dark:divide-[#2A403A]">
                                            {mockStationPrices.map((item, idx) => (
                                                <div key={item.id} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-[#F7F5EF] dark:hover:bg-[#12201D] transition-colors">
                                                    <div className="col-span-4 flex items-center gap-3">
                                                        <div className="p-2 bg-[#F7F5EF] dark:bg-[#12201D] border border-[#E3DED2] dark:border-[#2A403A] rounded-lg">
                                                            <item.icon className="w-4 h-4 text-[#D96C4F]" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold text-[#263238] dark:text-[#F7F5EF]">{item.item}</p>
                                                            <span className="text-[10px] text-[#66736F] dark:text-[#A3B0AB] uppercase tracking-wider">{item.type}</span>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="col-span-2 text-center">
                                                        <span className="text-sm font-medium text-[#263238] dark:text-[#F7F5EF]">{item.platform}</span>
                                                    </div>
                                                    
                                                    <div className="col-span-2 text-center">
                                                        <span className="text-sm font-medium text-[#263238] dark:text-[#F7F5EF]">{item.train}</span>
                                                    </div>

                                                    <div className="col-span-2 text-center flex justify-center">
                                                        {item.mrp ? (
                                                            <div className="flex items-center gap-1.5 bg-[#FFFFFF] dark:bg-[#1B2C28] border border-[#E3DED2] dark:border-[#2A403A] text-[#173F3A] dark:text-[#EEF2ED] px-2 py-1 rounded text-xs font-bold">
                                                                <span>₹{item.mrp}</span>
                                                                <span className="text-[9px] text-[#4F7D62]">(Fixed)</span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-xs text-[#66736F] dark:text-[#A3B0AB]">Dynamic</span>
                                                        )}
                                                    </div>

                                                    <div className="col-span-2 text-center flex justify-center">
                                                        <Link 
                                                            to="/support" 
                                                            className="text-xs text-[#D96C4F] hover:underline font-semibold flex items-center gap-1"
                                                        >
                                                            <AlertTriangle className="w-3 h-3" /> Report Issue
                                                        </Link>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="bg-[#FFFFFF] dark:bg-[#1B2C28] border border-[#E5B85C] rounded-xl p-4 flex gap-4 items-start shadow-sm">
                                <AlertTriangle className="w-6 h-6 text-[#E5B85C] flex-shrink-0" />
                                <div>
                                    <h4 className="text-sm font-bold text-[#263238] dark:text-[#F7F5EF] mb-1">Know Your Rights</h4>
                                    <p className="text-xs text-[#66736F] dark:text-[#A3B0AB] leading-relaxed">
                                        Vendors are strictly prohibited from charging above MRP for packaged items like Rail Neer. For non-packaged items, check the official IRCTC rate list above. If you are overcharged, you can use the "Report Issue" button to file a grievance via RailMadad.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
