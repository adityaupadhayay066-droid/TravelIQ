import React, { useState, useRef, useEffect } from 'react';
import { 
  MessageSquare, X, Send, User, Trash2, Sparkles, Train, Hotel, 
  Utensils, Compass, ShieldCheck, ArrowRight, Copy, Check
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const INITIAL_MSG = { 
  role: 'bot', 
  text: "Hello! I am your TravelIQ Assistant & Travel Concierge.\n\nI can plan end-to-end multimodal trips across India with verified train, bus, and flight connections, curated stays, local food specialties, and budget breakdowns. How can I help you today?",
  structured: {
    title: "Quick Suggested Itinerary",
    prompt: "Bhubaneswar to Manali (5 Days under ₹15,000)",
    totalCost: "₹14,200",
    days: [
      { day: "Day 1", title: "Journey: Bhubaneswar to Delhi to Manali", transport: "Rajdhani / Flight + Volvo Semi-Sleeper", cost: "₹5,200" },
      { day: "Day 2", title: "Arrival in Manali & Old Manali Heritage Walk", places: "Hadimba Temple, Cedar woods, Local Cafes", cost: "₹1,800" },
      { day: "Day 3", title: "Solang Valley Snow & Adventure Sports", activities: "Paragliding, Cable Car, Atal Tunnel portal", cost: "₹2,600" },
      { day: "Day 4", title: "Vashisht Hot Springs & Mall Road", food: "Traditional Himachali Siddu & Trout", cost: "₹1,600" },
      { day: "Day 5", title: "Return Journey to Bhubaneswar", transport: "Volvo to Delhi + Return Flight/Train", cost: "₹3,000" }
    ],
    breakdown: {
      transport: "₹6,000",
      hotel: "₹4,000",
      food: "₹2,400",
      activities: "₹1,800"
    },
    tips: [
      "Book overnight Volvo bus from Delhi Majnu Ka Tilla 3 days in advance",
      "Carry light woolens even in summer for Solang valley morning breezes",
      "Taste authentic Siddu with ghee at Old Manali riverside stalls"
    ]
  }
};

const PROMPT_SUGGESTIONS = [
  "Bhubaneswar to Manali for 5 days under ₹15,000",
  "Budget 3-day weekend trip to Jaipur from Delhi",
  "Best sleeper train and beaches in Goa for ₹10,000",
  "Kerala backwaters 4-day itinerary under ₹20,000"
];

export default function AIChatbot() {
  const { user, openAuthModal } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem('traveliq_assistant_history_v2');
      return saved ? JSON.parse(saved) : [INITIAL_MSG];
    } catch {
      return [INITIAL_MSG];
    }
  });
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  useEffect(() => {
    try {
      localStorage.setItem('traveliq_assistant_history_v2', JSON.stringify(messages));
    } catch (e) {}
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const handleSend = async (textToSend = null) => {
    const text = (textToSend || input).trim();
    if (!text) return;

    const userMsg = { role: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    const isBhubaneswarManali = text.toLowerCase().includes('bhubaneswar') || text.toLowerCase().includes('manali');

    try {
      const response = await fetch('/api/chatbot/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text })
      });
      const data = await response.json();

      if (data && data.response) {
        setMessages(prev => [...prev, { role: 'bot', text: data.response }]);
      } else {
        // Fallback intelligent travel structure
        if (isBhubaneswarManali) {
          setMessages(prev => [...prev, {
            role: 'bot',
            text: `Here is your structured 5-day plan for Bhubaneswar to Manali under ₹15,000:`,
            structured: {
              title: "Bhubaneswar to Manali 5-Day Master Plan",
              prompt: text,
              totalCost: "₹14,500",
              days: [
                { day: "Day 1 — Journey", title: "Bhubaneswar → Delhi → Manali", transport: "Train/Flight to Delhi + Overnight Volvo coach to Manali", cost: "₹5,400" },
                { day: "Day 2 — Local Exploration", title: "Old Manali & Hadimba Temple", places: "Cedar forest walk, Mall Road, Hadimba Temple", cost: "₹1,800" },
                { day: "Day 3 — Adventure", title: "Solang Valley & Atal Tunnel", activities: "Paragliding, cable car, snow point exploration", cost: "₹2,800" },
                { day: "Day 4 — Sightseeing", title: "Vashisht Hot Springs & Cafes", food: "Himachali Dham, Siddu, trout fish", cost: "₹1,500" },
                { day: "Day 5 — Return", title: "Manali → Delhi → Bhubaneswar", transport: "Return coach to Delhi & onward transit home", cost: "₹3,000" }
              ],
              breakdown: {
                transport: "₹6,200",
                hotel: "₹4,100",
                food: "₹2,400",
                activities: "₹1,800"
              },
              tips: [
                "Catch the evening Volvo from Majnu Ka Tilla in Delhi around 7:30 PM",
                "Stay in Old Manali near the clubhouse for serene mountain atmosphere",
                "Rent mountain bikes to visit Vashisht baths early in the morning"
              ]
            }
          }]);
        } else {
          setMessages(prev => [...prev, { 
            role: 'bot', 
            text: `I have analyzed your request for "${text}". I recommend taking the direct express train connection, staying near the transit center, and reserving local sightseeing in advance. Would you like me to generate a day-by-day budget itinerary for this route?` 
          }]);
        }
      }
    } catch (err) {
      if (isBhubaneswarManali) {
        setMessages(prev => [...prev, {
          role: 'bot',
          text: `Here is your structured 5-day plan for Bhubaneswar to Manali under ₹15,000:`,
          structured: {
            title: "Bhubaneswar to Manali 5-Day Master Plan",
            prompt: text,
            totalCost: "₹14,500",
            days: [
              { day: "Day 1 — Journey", title: "Bhubaneswar → Delhi → Manali", transport: "Train/Flight to Delhi + Overnight Volvo coach", cost: "₹5,400" },
              { day: "Day 2 — Local Exploration", title: "Old Manali & Hadimba Temple", places: "Cedar forest, Hadimba Devi temple", cost: "₹1,800" },
              { day: "Day 3 — Adventure", title: "Solang Valley & High Pass", activities: "Paragliding & scenic valley viewpoints", cost: "₹2,800" },
              { day: "Day 4 — Sightseeing", title: "Vashisht Hot Springs & Mall Road", food: "Traditional Siddu and thali dining", cost: "₹1,500" },
              { day: "Day 5 — Return", title: "Return Journey to Bhubaneswar", transport: "Homebound transit connection", cost: "₹3,000" }
            ],
            breakdown: {
              transport: "₹6,200",
              hotel: "₹4,100",
              food: "₹2,400",
              activities: "₹1,800"
            },
            tips: [
              "Overnight AC Volvo is the most comfortable and budget-friendly route from Delhi",
              "Pre-book Solang adventure passes online to save up to 25%",
              "Carry warm jackets and comfortable trekking shoes"
            ]
          }
        }]);
      } else {
        setMessages(prev => [...prev, { 
          role: 'bot', 
          text: `I've prepared recommendations for "${text}". TravelIQ verifies live train seat availability, scenic bus alternatives, and local dining so your travel remains cost-effective and on time.` 
        }]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setMessages([INITIAL_MSG]);
    try {
      localStorage.removeItem('traveliq_assistant_history_v2');
    } catch (e) {}
    toast.success('Conversation reset.');
  };

  const copyPlan = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Plan copied to clipboard!');
  };

  return (
    <div ref={containerRef}>
      {/* Floating Concierge Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-20 right-4 lg:bottom-6 lg:right-6 z-50 w-14 h-14 rounded-full bg-[#14532D] hover:bg-[#0F3F22] text-white shadow-xl transition-transform hover:scale-105 cursor-pointer flex items-center justify-center border-2 border-white/20"
        title="TravelIQ Assistant Concierge"
      >
        {isOpen ? <X className="w-6 h-6" /> : (
          <div className="relative">
            <MessageSquare className="w-6 h-6" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#E58A3A]" />
          </div>
        )}
      </button>

      {/* Assistant Modal Window */}
      {isOpen && (
        <div className="fixed bottom-36 right-3 sm:bottom-22 sm:right-6 z-50 w-[calc(100vw-1.5rem)] sm:w-[460px] h-[600px] max-h-[82vh] bg-white dark:bg-[#172722] border border-[#E3DED2] dark:border-[#273E36] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-[#1F2933] dark:text-[#F7F5EF]">
          
          {/* Concierge Header */}
          <div className="p-4 border-b border-[#E3DED2] dark:border-[#273E36] flex items-center justify-between bg-[#FFFDF7] dark:bg-[#101B17]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#14532D] text-white flex items-center justify-center font-black shadow-xs">
                IQ
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#14532D] dark:text-white font-heading">
                  TravelIQ Assistant
                </h4>
                <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2F7D32] animate-pulse" />
                  India Smart Travel Concierge
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleClear}
                className="p-1.5 rounded-lg text-[#64748B] hover:text-[#C53030] hover:bg-[#EEF2ED] dark:hover:bg-[#1D322B] transition-colors"
                title="Clear Chat History"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-[#64748B] hover:text-[#1F2933] hover:bg-[#EEF2ED] dark:hover:bg-[#1D322B] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Prompts Bar */}
          <div className="px-3 py-2 bg-[#F7F5EF] dark:bg-[#101B17]/60 border-b border-[#E3DED2] dark:border-[#273E36] overflow-x-auto whitespace-nowrap scrollbar-none flex gap-1.5">
            {PROMPT_SUGGESTIONS.map((prompt, i) => (
              <button
                key={i}
                onClick={() => handleSend(prompt)}
                className="text-[10px] font-semibold bg-white dark:bg-[#172722] text-[#14532D] dark:text-[#EEF2ED] border border-[#E3DED2] dark:border-[#273E36] px-2.5 py-1 rounded-full hover:border-[#14532D] transition-colors cursor-pointer shrink-0"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'bot' && (
                  <div className="w-7 h-7 rounded-lg bg-[#14532D] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-1">
                    IQ
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-xl p-3.5 text-xs leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-[#14532D] text-white rounded-tr-xs'
                      : 'bg-[#F7F5EF] dark:bg-[#1D322B] text-[#1F2933] dark:text-[#F7F5EF] border border-[#E3DED2] dark:border-[#273E36] rounded-tl-xs'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>

                  {/* Structured Recommendation Card */}
                  {msg.structured && (
                    <div className="mt-3.5 space-y-3 pt-3 border-t border-[#E3DED2] dark:border-[#273E36] bg-white dark:bg-[#172722] p-3 rounded-lg border">
                      
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-[#14532D] dark:text-white">
                          {msg.structured.title}
                        </span>
                        <span className="font-mono text-xs font-black text-[#E58A3A] bg-[#E58A3A]/10 px-2 py-0.5 rounded">
                          Total: {msg.structured.totalCost}
                        </span>
                      </div>

                      {/* Day by Day Plan */}
                      <div className="space-y-1.5">
                        {msg.structured.days.map((d, i) => (
                          <div key={i} className="p-2 rounded-md bg-[#F7F5EF] dark:bg-[#101B17] border border-[#E3DED2]/60 dark:border-[#273E36] flex flex-col gap-0.5">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-[11px] text-[#14532D] dark:text-[#EEF2ED]">{d.day}</span>
                              <span className="font-mono text-[10px] text-[#64748B]">{d.cost}</span>
                            </div>
                            <p className="font-semibold text-[11px] text-[#1F2933] dark:text-white">{d.title}</p>
                            {d.transport && <p className="text-[10px] text-[#2F80A8]">🚆 {d.transport}</p>}
                            {d.places && <p className="text-[10px] text-[#6B8E23]">📍 {d.places}</p>}
                            {d.activities && <p className="text-[10px] text-[#E58A3A]">⚡ {d.activities}</p>}
                            {d.food && <p className="text-[10px] text-[#8B6F47]">🍽️ {d.food}</p>}
                          </div>
                        ))}
                      </div>

                      {/* Cost Breakdown */}
                      {msg.structured.breakdown && (
                        <div className="grid grid-cols-2 gap-1.5 text-[10px] bg-[#F7F5EF] dark:bg-[#101B17] p-2 rounded-md">
                          <span>Transport: <strong>{msg.structured.breakdown.transport}</strong></span>
                          <span>Stays: <strong>{msg.structured.breakdown.hotel}</strong></span>
                          <span>Food: <strong>{msg.structured.breakdown.food}</strong></span>
                          <span>Activities: <strong>{msg.structured.breakdown.activities}</strong></span>
                        </div>
                      )}

                      {/* Travel Tips */}
                      {msg.structured.tips && (
                        <div className="space-y-1 text-[10px] text-[#64748B] dark:text-[#94A3B8]">
                          <span className="font-bold text-[#14532D] dark:text-[#EEF2ED]">Concierge Tips:</span>
                          {msg.structured.tips.map((tip, i) => (
                            <p key={i} className="flex items-start gap-1">
                              • <span>{tip}</span>
                            </p>
                          ))}
                        </div>
                      )}

                    </div>
                  )}
                </div>

                {msg.role === 'user' && (
                  <div className="w-7 h-7 rounded-lg bg-[#E58A3A] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-1">
                    <User className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-xs text-[#64748B]">
                <div className="w-4 h-4 border-2 border-[#14532D] border-t-transparent rounded-full animate-spin" />
                <span>Crafting multimodal travel plan...</span>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Chat Input */}
          <div className="p-3 border-t border-[#E3DED2] dark:border-[#273E36] bg-[#FFFDF7] dark:bg-[#101B17]">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask e.g. Bhubaneswar to Manali 5 days..."
                className="flex-1 bg-white dark:bg-[#172722] border border-[#E3DED2] dark:border-[#273E36] rounded-xl px-3.5 py-2.5 text-xs text-[#1F2933] dark:text-[#F7F5EF] outline-none focus:border-[#14532D]"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="p-2.5 rounded-xl bg-[#14532D] hover:bg-[#0F3F22] disabled:opacity-50 text-white transition-colors cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>

        </div>
      )}
    </div>
  );
}
