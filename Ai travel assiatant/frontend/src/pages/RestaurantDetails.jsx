import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../utils/api';
import { MapPin, Star, Clock, ChevronLeft, Navigation } from 'lucide-react';

export default function RestaurantDetails() {
    const { id } = useParams();
    const [restaurant, setRestaurant] = useState(null);
    const [menu, setMenu] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const { data } = await api.get(`/food/restaurant/${id}`);
                setRestaurant(data.restaurant);
                setMenu(data.menu);
            } catch (err) {
                console.error("Error fetching restaurant", err);
            } finally {
                setLoading(false);
            }
        }
        fetchDetails();
    }, [id]);

    if (loading) return <div className="min-h-screen bg-[#F7F5EF] dark:bg-[#12201D] flex items-center justify-center"><div className="animate-spin w-8 h-8 border-2 border-[#173F3A] dark:border-[#EEF2ED] border-t-transparent rounded-full" /></div>;
    if (!restaurant) return <div className="min-h-screen bg-[#F7F5EF] dark:bg-[#12201D] text-[#263238] dark:text-[#F7F5EF] flex items-center justify-center font-medium">Restaurant not found</div>;

    return (
        <div className="bg-[#F7F5EF] dark:bg-[#12201D] min-h-screen pb-12 font-sans text-[#263238] dark:text-[#F7F5EF]">
            <div className="h-64 bg-[#EEF2ED] dark:bg-[#213530] relative overflow-hidden">
                <img src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200" alt="Restaurant cover" className="w-full h-full object-cover opacity-90" />
                <div className="absolute inset-0 bg-[#173F3A]/40 dark:bg-[#12201D]/60" />
                
                <div className="absolute bottom-0 left-0 right-0 p-8 max-w-5xl mx-auto">
                    <Link to="/food" className="inline-flex items-center gap-1 text-white/90 hover:text-white mb-4 text-sm font-semibold transition-colors">
                        <ChevronLeft className="w-4 h-4" /> Back to Discovery
                    </Link>
                    <div className="flex items-end justify-between">
                        <div>
                            <h1 className="text-4xl font-bold text-white mb-2">{restaurant.name}</h1>
                            <div className="flex items-center gap-4 text-white/90 text-sm font-medium">
                                <span className="flex items-center gap-1"><MapPin className="w-4 h-4 text-[#E5B85C]" /> {restaurant.city}</span>
                                <span className="flex items-center gap-1"><Star className="w-4 h-4 text-[#E5B85C]" /> {restaurant.rating} Rating</span>
                                <span className="flex items-center gap-1"><Clock className="w-4 h-4 text-[#E5B85C]" /> Open Now</span>
                            </div>
                        </div>
                        <button className="btn-primary bg-[#173F3A] dark:bg-[#EEF2ED] hover:bg-[#0F332F] dark:hover:bg-[#FFFFFF] text-white dark:text-[#173F3A] px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-bold transition-colors shadow-sm">
                            <Navigation className="w-4 h-4" /> Get Directions
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-8 mt-8">
                <h2 className="text-xl font-bold text-[#263238] dark:text-[#F7F5EF] mb-6">Menu Highlights</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {menu.map(item => (
                        <div key={item.id} className="travel-card bg-[#FFFFFF] dark:bg-[#1B2C28] border border-[#E3DED2] dark:border-[#2A403A] rounded-xl p-4 flex gap-4 transition-all shadow-[0_4px_16px_rgba(23,63,58,0.06)] dark:shadow-none hover:shadow-md">
                            <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 bg-[#EEF2ED] dark:bg-[#213530]">
                                <img src={item.image_url} alt={item.food_name} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 flex flex-col justify-center">
                                <h3 className="text-[#263238] dark:text-[#F7F5EF] font-bold mb-1 flex items-center gap-2">
                                    {item.food_name}
                                    {item.is_veg && <span className="w-2 h-2 rounded-full bg-[#4F7D62]" title="Veg"></span>}
                                </h3>
                                <p className="text-xs text-[#66736F] dark:text-[#A3B0AB] line-clamp-2 mb-2 font-medium">{item.description || 'Delicious house specialty.'}</p>
                                <span className="text-[#173F3A] dark:text-[#EEF2ED] font-bold text-sm mt-auto">Starts at ₹{item.starting_price}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
