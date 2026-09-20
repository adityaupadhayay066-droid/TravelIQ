import React, { useState } from 'react';
import { 
  Calendar, Clock, MapPin, Utensils, Hotel, Compass, 
  ChevronDown, ChevronUp, Train, Plane, Bus, Sparkles, CheckCircle2, Shield
} from 'lucide-react';

const INITIAL_ITINERARY = [
  {
    day: 'DAY 01',
    city: 'Bhubaneswar → Delhi',
    subtitle: 'Transit & Transit City Exploration',
    date: '18 September 2026',
    items: [
      { id: 1, time: '07:15', title: 'Flight Departure: Bhubaneswar (BBI) → Delhi (DEL)', type: 'transport', mode: 'flight', detail: 'Air India AI-878 / Rajdhani Express Transit' },
      { id: 2, time: '10:30', title: 'Arrival & Luggage Drop at Aerocity', type: 'hotel', detail: 'Check-in & fresh-up at Transit Lounge' },
      { id: 3, time: '13:00', title: 'Lunch: Connaught Place Heritage Dining', type: 'food', detail: 'Authentic North Indian cuisines at Kake Da Hotel' },
      { id: 4, time: '16:00', title: 'Qutub Minar & Historic Exploration', type: 'explore', detail: 'Guided historical walk through UNESCO Heritage site' },
      { id: 5, time: '20:30', title: 'Overnight Volvo Coach to Manali', type: 'transport', mode: 'bus', detail: 'Majnu Ka Tilla Boarding, Premium AC Semi-Sleeper' }
    ]
  },
  {
    day: 'DAY 02',
    city: 'Delhi → Manali Arrival',
    subtitle: 'Scenic Himalayan Entry & Old Manali Stroll',
    date: '19 September 2026',
    items: [
      { id: 6, time: '09:00', title: 'Arrival at Manali Private Bus Stand', type: 'transport', mode: 'bus', detail: 'Greeted with mountain morning breeze and misty valley views' },
      { id: 7, time: '10:30', title: 'Resort Check-In & Pine Forest View', type: 'hotel', detail: 'Woodstock Valley Heritage Cottage, Old Manali' },
      { id: 8, time: '13:00', title: 'Traditional Himachali Dham Lunch', type: 'food', detail: 'Siddu, Madra, and red rice at Cafe 1947' },
      { id: 9, time: '16:00', title: 'Hadimba Temple & Cedar Woods', type: 'explore', detail: 'Historic 1553 pagoda wooden temple amidst towering deodars' },
      { id: 10, time: '19:30', title: 'Evening Cafe & Live Mountain Music', type: 'explore', detail: 'Relaxing ambient acoustic evening in Old Manali' }
    ]
  },
  {
    day: 'DAY 03',
    city: 'Solang Valley & Rohtang Pass',
    subtitle: 'High Altitude Adventure & Snow Valley',
    date: '20 September 2026',
    items: [
      { id: 11, time: '08:00', title: 'Drive to Solang Valley (2,560m)', type: 'transport', mode: 'road', detail: 'Private 4x4 cab along Beas river canyon' },
      { id: 12, time: '10:30', title: 'Adventure Activities & Ropeway', type: 'explore', detail: 'Paragliding, Zorbing, and Cable Car ride to Mount Phatru' },
      { id: 13, time: '14:00', title: 'Hot Maggi & Mountain Stew in Solang', type: 'food', detail: 'Warm alpine comfort meals with panoramic peak views' },
      { id: 14, time: '16:30', title: 'Atal Tunnel South Portal Visit', type: 'explore', detail: 'Engineering marvel connecting Kullu valley to Lahaul' },
      { id: 15, time: '20:00', title: 'Bonfire & Himachali Trout Dinner', type: 'food', detail: 'Wood-fired dining at resort lawn' }
    ]
  },
  {
    day: 'DAY 04',
    city: 'Mall Road + Vashisht Hot Springs',
    subtitle: 'Thermal Springs, Handicrafts & Shopping',
    date: '21 September 2026',
    items: [
      { id: 16, time: '09:30', title: 'Vashisht Natural Sulphur Springs', type: 'explore', detail: 'Ancient stone temple with natural warm mineral baths' },
      { id: 17, time: '12:30', title: 'Tibetan Monastery & Local Handicrafts', type: 'explore', detail: 'Handwoven Kullu shawls, wooden craft, and Tibetan prayer wheels' },
      { id: 18, time: '14:30', title: 'Lunch: Momos & Himalayan Herbal Tea', type: 'food', detail: 'Local bakery and momo stalls on Mall Road' },
      { id: 19, time: '17:00', title: 'Van Vihar Nature Park Walk', type: 'explore', detail: 'Tranquil evening walk near riverbank' }
    ]
  },
  {
    day: 'DAY 05',
    city: 'Return Journey to Bhubaneswar',
    subtitle: 'Departure & Homebound Flight',
    date: '22 September 2026',
    items: [
      { id: 20, time: '08:30', title: 'Souvenir Packing & Resort Checkout', type: 'hotel', detail: 'Luggage prep and mountain photo memories' },
      { id: 21, time: '10:00', title: 'Scenic Drive to Bhuntar Airport / Volvo to Delhi', type: 'transport', mode: 'road', detail: 'Kullu valley riverside transit' },
      { id: 22, time: '18:00', title: 'Flight Delhi (DEL) → Bhubaneswar (BBI)', type: 'transport', mode: 'flight', detail: 'Safe return journey home with TravelIQ digital itinerary log' }
    ]
  }
];

export default function TripPlanner() {
  const [itinerary] = useState(INITIAL_ITINERARY);
  const [expandedDay, setExpandedDay] = useState(0);

  const getTypeIcon = (type, mode) => {
    if (type === 'transport') {
      if (mode === 'flight') return <Plane className="w-3.5 h-3.5 text-[#2F80A8]" />;
      if (mode === 'bus') return <Bus className="w-3.5 h-3.5 text-[#E58A3A]" />;
      if (mode === 'train') return <Train className="w-3.5 h-3.5 text-[#14532D]" />;
      return <MapPin className="w-3.5 h-3.5 text-[#14532D] dark:text-[#EEF2ED]" />;
    }
    if (type === 'food') return <Utensils className="w-3.5 h-3.5 text-[#E58A3A]" />;
    if (type === 'hotel') return <Hotel className="w-3.5 h-3.5 text-[#2F80A8]" />;
    return <Compass className="w-3.5 h-3.5 text-[#6B8E23]" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-[#172722] border border-[#E3DED2] dark:border-[#273E36] rounded-2xl p-5 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#14532D] dark:bg-[#2F7D32]" />
            <h3 className="text-lg sm:text-xl font-bold text-[#14532D] dark:text-white font-heading">
              5-Day Visual Trip Timeline & Itinerary
            </h3>
          </div>
          <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-0.5">
            Bhubaneswar to Manali Curated Route • 5 Days • Estimated Total ₹15,000
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-[#14532D] dark:text-[#EEF2ED] bg-[#F7F5EF] dark:bg-[#101B17] px-3.5 py-1.5 rounded-xl border border-[#E3DED2] dark:border-[#273E36]">
          <CheckCircle2 className="w-4 h-4 text-[#2F7D32]" />
          <span>Verified Multi-Modal Plan</span>
        </div>
      </div>

      {/* Accordion Days */}
      <div className="space-y-3.5">
        {itinerary.map((dayData, dayIdx) => {
          const isExpanded = expandedDay === dayIdx;
          return (
            <div 
              key={dayData.day} 
              className="bg-white dark:bg-[#172722] border border-[#E3DED2] dark:border-[#273E36] rounded-xl overflow-hidden shadow-xs transition-all"
            >
              {/* Day Header */}
              <div 
                onClick={() => setExpandedDay(isExpanded ? null : dayIdx)}
                className={`p-4 flex items-center justify-between cursor-pointer transition-colors ${
                  isExpanded ? 'bg-[#F7F5EF] dark:bg-[#1D322B]' : 'hover:bg-[#FFFDF7] dark:hover:bg-[#1C2F29]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="font-extrabold text-xs text-white bg-[#14532D] dark:bg-[#2F7D32] px-2.5 py-1 rounded-md font-mono">
                    {dayData.day}
                  </span>
                  <div>
                    <h4 className="font-bold text-sm sm:text-base text-[#1F2933] dark:text-white font-heading">
                      {dayData.city}
                    </h4>
                    <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8]">
                      {dayData.subtitle} • {dayData.date}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-[#64748B] dark:text-[#94A3B8] hidden sm:inline">
                    {dayData.items.length} stops
                  </span>
                  <div className="w-7 h-7 rounded-lg border border-[#E3DED2] dark:border-[#273E36] flex items-center justify-center">
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-[#14532D] dark:text-white" /> : <ChevronDown className="w-4 h-4 text-[#64748B]" />}
                  </div>
                </div>
              </div>

              {/* Timeline Items */}
              {isExpanded && (
                <div className="p-5 border-t border-[#E3DED2] dark:border-[#273E36] bg-[#FFFDF7]/60 dark:bg-[#101B17]/60">
                  <div className="relative pl-7 border-l-2 border-[#E3DED2] dark:border-[#273E36] space-y-4 ml-2">
                    {dayData.items.map((item) => (
                      <div key={item.id} className="relative group">
                        {/* Dot / Icon Node on Timeline Line */}
                        <div className="absolute -left-[37px] top-1.5 w-7 h-7 rounded-full bg-white dark:bg-[#172722] border-2 border-[#14532D] dark:border-[#489A6B] flex items-center justify-center shadow-xs">
                          {getTypeIcon(item.type, item.mode)}
                        </div>

                        <div className="bg-white dark:bg-[#172722] border border-[#E3DED2] dark:border-[#273E36] rounded-xl p-3.5 hover:border-[#14532D]/40 dark:hover:border-[#EEF2ED]/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                          <div className="flex items-start sm:items-center gap-3.5">
                            <span className="font-mono text-xs font-black text-[#14532D] dark:text-[#EEF2ED] bg-[#EEF2ED] dark:bg-[#1D322B] px-2 py-1 rounded-md shrink-0">
                              {item.time}
                            </span>
                            <div>
                              <h5 className="font-bold text-sm text-[#1F2933] dark:text-white">
                                {item.title}
                              </h5>
                              <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-0.5">
                                {item.detail}
                              </p>
                            </div>
                          </div>

                          <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md self-start sm:self-center border border-[#E3DED2] dark:border-[#273E36] bg-[#F7F5EF] dark:bg-[#101B17] text-[#64748B] dark:text-[#94A3B8] shrink-0">
                            {item.type}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
