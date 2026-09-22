import React, { useState } from 'react';
import { Database, Plus, Search, Trash2, Edit } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminFoodManager() {
    const [restaurants, setRestaurants] = useState([]);
    const [foods, setFoods] = useState([]);

    return (
        <div className="p-8 space-y-8 text-[#263238] dark:text-[#F7F5EF]">
            <div className="flex items-center justify-between border-b border-[#E3DED2] dark:border-[#2A403A] pb-6">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <Database className="w-8 h-8 text-[#173F3A] dark:text-[#EEF2ED]" /> Food Database Manager
                    </h1>
                    <p className="text-[#66736F] dark:text-[#A3B0AB] mt-2">Manage restaurants, culinary items, and cross-platform prices.</p>
                </div>
                <button className="flex items-center gap-2 bg-[#173F3A] hover:bg-[#0F332F] dark:bg-[#EEF2ED] dark:hover:bg-[#FFFFFF] text-white dark:text-[#12201D] px-5 py-2.5 rounded-lg font-semibold transition-colors shadow-sm">
                    <Plus className="w-5 h-5" /> Add New Entity
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Cuisines Panel */}
                <div className="bg-[#FFFFFF] dark:bg-[#1B2C28] border border-[#E3DED2] dark:border-[#2A403A] rounded-xl p-6 travel-card shadow-sm">
                    <h2 className="text-lg font-bold mb-4">Cuisines Explorer Data</h2>
                    <div className="bg-[#F7F5EF] dark:bg-[#12201D] border border-[#E3DED2] dark:border-[#2A403A] rounded-lg flex items-center px-4 py-2 mb-4">
                        <Search className="w-4 h-4 text-[#66736F] dark:text-[#A3B0AB]" />
                        <input type="text" placeholder="Search cuisines..." className="bg-transparent border-none outline-none text-sm w-full px-3 text-[#263238] dark:text-[#F7F5EF]" />
                    </div>
                    <div className="space-y-3">
                        <div className="p-4 bg-[#F7F5EF] dark:bg-[#12201D] border border-[#E3DED2] dark:border-[#2A403A] rounded-lg flex justify-between items-center group hover:border-[#173F3A] dark:hover:border-[#EEF2ED] transition-colors">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded bg-[#EEF2ED] dark:bg-[#213530] overflow-hidden">
                                    <img src="https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=100" alt="Dalma" className="w-full h-full object-cover" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-sm">Dalma</h4>
                                    <span className="text-[10px] text-[#66736F] dark:text-[#A3B0AB] uppercase font-bold tracking-wider">Bhubaneswar • Traditional</span>
                                </div>
                            </div>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button className="p-1.5 text-[#173F3A] dark:text-[#EEF2ED] hover:bg-[#EEF2ED] dark:hover:bg-[#213530] rounded"><Edit className="w-4 h-4" /></button>
                                <button className="p-1.5 text-[#B94A48] hover:bg-[#B94A48]/10 rounded"><Trash2 className="w-4 h-4" /></button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Station Foods & MRP Panel */}
                <div className="bg-[#FFFFFF] dark:bg-[#1B2C28] border border-[#E3DED2] dark:border-[#2A403A] rounded-xl p-6 travel-card shadow-sm">
                    <h2 className="text-lg font-bold mb-4">Station Food & MRP Rates</h2>
                    <div className="bg-[#F7F5EF] dark:bg-[#12201D] border border-[#E3DED2] dark:border-[#2A403A] rounded-lg flex items-center px-4 py-2 mb-4">
                        <Search className="w-4 h-4 text-[#66736F] dark:text-[#A3B0AB]" />
                        <input type="text" placeholder="Search station or item..." className="bg-transparent border-none outline-none text-sm w-full px-3 text-[#263238] dark:text-[#F7F5EF]" />
                    </div>
                    <div className="space-y-3">
                        <div className="p-4 bg-[#F7F5EF] dark:bg-[#12201D] border border-[#E3DED2] dark:border-[#2A403A] rounded-lg flex justify-between items-center group hover:border-[#173F3A] dark:hover:border-[#EEF2ED] transition-colors">
                            <div>
                                <h4 className="font-bold text-sm">Rail Neer (1L)</h4>
                                <span className="text-[10px] text-[#66736F] dark:text-[#A3B0AB] uppercase font-bold tracking-wider">NDLS Platform • MRP: ₹15</span>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="text-sm font-bold text-[#4F7D62]">₹15</span>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button className="p-1.5 text-[#173F3A] dark:text-[#EEF2ED] hover:bg-[#EEF2ED] dark:hover:bg-[#213530] rounded"><Edit className="w-4 h-4" /></button>
                                    <button className="p-1.5 text-[#B94A48] hover:bg-[#B94A48]/10 rounded"><Trash2 className="w-4 h-4" /></button>
                                </div>
                            </div>
                        </div>
                        <div className="p-4 bg-[#F7F5EF] dark:bg-[#12201D] border border-[#E3DED2] dark:border-[#2A403A] rounded-lg flex justify-between items-center group hover:border-[#173F3A] dark:hover:border-[#EEF2ED] transition-colors">
                            <div>
                                <h4 className="font-bold text-sm">Standard Veg Thali</h4>
                                <span className="text-[10px] text-[#66736F] dark:text-[#A3B0AB] uppercase font-bold tracking-wider">IRCTC Pantry • Standard Rate</span>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="text-sm font-bold text-[#263238] dark:text-[#F7F5EF]">₹150</span>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button className="p-1.5 text-[#173F3A] dark:text-[#EEF2ED] hover:bg-[#EEF2ED] dark:hover:bg-[#213530] rounded"><Edit className="w-4 h-4" /></button>
                                    <button className="p-1.5 text-[#B94A48] hover:bg-[#B94A48]/10 rounded"><Trash2 className="w-4 h-4" /></button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Restaurants Panel */}
                <div className="bg-[#FFFFFF] dark:bg-[#1B2C28] border border-[#E3DED2] dark:border-[#2A403A] rounded-xl p-6 travel-card shadow-sm">
                    <h2 className="text-lg font-bold mb-4">Registered Restaurants</h2>
                    <div className="bg-[#F7F5EF] dark:bg-[#12201D] border border-[#E3DED2] dark:border-[#2A403A] rounded-lg flex items-center px-4 py-2 mb-4">
                        <Search className="w-4 h-4 text-[#66736F] dark:text-[#A3B0AB]" />
                        <input type="text" placeholder="Search restaurants..." className="bg-transparent border-none outline-none text-sm w-full px-3 text-[#263238] dark:text-[#F7F5EF]" />
                    </div>
                    <div className="space-y-3">
                        <div className="p-4 bg-[#F7F5EF] dark:bg-[#12201D] border border-[#E3DED2] dark:border-[#2A403A] rounded-lg flex justify-between items-center group hover:border-[#173F3A] dark:hover:border-[#EEF2ED] transition-colors">
                            <div>
                                <h4 className="font-bold text-sm">Bhubaneswar Biryani House</h4>
                                <span className="text-[10px] text-[#66736F] dark:text-[#A3B0AB] uppercase font-bold tracking-wider">Bhubaneswar • North Indian</span>
                            </div>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button className="p-1.5 text-[#173F3A] dark:text-[#EEF2ED] hover:bg-[#EEF2ED] dark:hover:bg-[#213530] rounded"><Edit className="w-4 h-4" /></button>
                                <button className="p-1.5 text-[#B94A48] hover:bg-[#B94A48]/10 rounded"><Trash2 className="w-4 h-4" /></button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Foods Panel */}
                <div className="bg-[#FFFFFF] dark:bg-[#1B2C28] border border-[#E3DED2] dark:border-[#2A403A] rounded-xl p-6 travel-card shadow-sm">
                    <h2 className="text-lg font-bold mb-4">Menu Items & Price Index</h2>
                    <div className="bg-[#F7F5EF] dark:bg-[#12201D] border border-[#E3DED2] dark:border-[#2A403A] rounded-lg flex items-center px-4 py-2 mb-4">
                        <Search className="w-4 h-4 text-[#66736F] dark:text-[#A3B0AB]" />
                        <input type="text" placeholder="Search foods..." className="bg-transparent border-none outline-none text-sm w-full px-3 text-[#263238] dark:text-[#F7F5EF]" />
                    </div>
                    <div className="space-y-3">
                        <div className="p-4 bg-[#F7F5EF] dark:bg-[#12201D] border border-[#E3DED2] dark:border-[#2A403A] rounded-lg flex justify-between items-center group hover:border-[#173F3A] dark:hover:border-[#EEF2ED] transition-colors">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded bg-[#EEF2ED] dark:bg-[#213530] overflow-hidden">
                                    <img src="https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=100" alt="Food" className="w-full h-full object-cover" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-sm">Chicken Dum Biryani</h4>
                                    <span className="text-[10px] text-[#66736F] dark:text-[#A3B0AB] uppercase font-bold tracking-wider">Zomato: ₹260 | Swiggy: ₹250</span>
                                </div>
                            </div>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button className="p-1.5 text-[#173F3A] dark:text-[#EEF2ED] hover:bg-[#EEF2ED] dark:hover:bg-[#213530] rounded"><Edit className="w-4 h-4" /></button>
                                <button className="p-1.5 text-[#B94A48] hover:bg-[#B94A48]/10 rounded"><Trash2 className="w-4 h-4" /></button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
