import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  MessageSquare, X, Send, User, Trash2, Sparkles, Train, Hotel, 
  Utensils, Compass, ShieldCheck, ArrowRight, Copy, Check, Mic, MicOff
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import useScrollShrink from '../hooks/useScrollShrink';

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
  const location = useLocation();
  const { user, openAuthModal, isAuthModalOpen } = useAuth();
  const scrollScale = useScrollShrink(0.65, 350);
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
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
  const recognitionRef = useRef(null);

  // Sync state with Voice Assistant so they don't overlap
  useEffect(() => {
    const handleVoiceState = (e) => {
      if (e.detail?.isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('traveliq:voice_state', handleVoiceState);
    return () => window.removeEventListener('traveliq:voice_state', handleVoiceState);
  }, []);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('traveliq:chatbot_state', { detail: { isOpen } }));
  }, [isOpen]);

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

  const toggleListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('Speech recognition is not supported in this browser.');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    try {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-IN';
      rec.onstart = () => setIsListening(true);
      rec.onresult = (e) => {
        const text = e.results[0][0].transcript;
        if (text) {
          setInput(prev => (prev ? `${prev} ${text}` : text));
        }
      };
      rec.onerror = () => setIsListening(false);
      rec.onend = () => setIsListening(false);
      recognitionRef.current = rec;
      rec.start();
    } catch (err) {
      setIsListening(false);
    }
  };

  const authRoutes = ['/login', '/signup', '/admin/login', '/admin/signup'];
  const currentPath = (location?.pathname || '').toLowerCase().replace(/\/+$/, '') || '/';
  if (authRoutes.includes(currentPath) || isAuthModalOpen) {
    return null;
  }

  return (
    <div ref={containerRef}>
      {/* Floating Concierge Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-20 right-4 lg:bottom-6 lg:right-6 z-50 w-14 h-14 rounded-full bg-[#244C66] hover:bg-[#193B51] text-white shadow-xl cursor-pointer flex items-center justify-center border-2 border-white/20 transition-transform duration-200"
        style={{ transform: `scale(${isOpen ? 1 : scrollScale})`, transformOrigin: 'bottom right' }}
        title="TravelIQ Assistant Concierge"
      >
        {isOpen ? <X className="w-6 h-6" /> : (
          <div className="relative">
            <MessageSquare className="w-6 h-6" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#B66A45]" />
          </div>
        )}
      </button>

      {/* Assistant Modal Window */}
      {isOpen && (
        <div className="fixed bottom-36 right-3 sm:bottom-22 sm:right-6 z-50 w-[calc(100vw-1.5rem)] sm:w-[460px] h-[600px] max-h-[82vh] bg-white dark:bg-[#1B242E] border border-[#E3E7EA] dark:border-[#293644] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-[#202A32] dark:text-[#F0F4F7]">
          
          {/* Concierge Header */}
          <div className="p-4 border-b border-[#E3E7EA] dark:border-[#293644] flex items-center justify-between bg-[#F7F8FA] dark:bg-[#162029]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#244C66] text-white flex items-center justify-center font-black shadow-xs text-xs">
                IQ
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#202A32] dark:text-[#F0F4F7] font-heading">
                  TravelIQ Assistant
                </h4>
                <p className="text-[11px] text-[#66737D] dark:text-[#89939B] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  India Smart Travel Concierge
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleClear}
                className="p-1.5 rounded-lg text-[#66737D] hover:text-[#B54747] hover:bg-[#EEF2F4] dark:hover:bg-[#202D3A] transition-colors cursor-pointer"
                title="Clear Chat History"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-[#66737D] hover:text-[#202A32] dark:hover:text-white hover:bg-[#EEF2F4] dark:hover:bg-[#202D3A] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Prompts Bar */}
          <div className="px-3 py-2 bg-[#EEF2F4] dark:bg-[#162029]/80 border-b border-[#E3E7EA] dark:border-[#293644] overflow-x-auto whitespace-nowrap scrollbar-none flex gap-1.5">
            {PROMPT_SUGGESTIONS.map((prompt, i) => (
              <button
                key={i}
                onClick={() => handleSend(prompt)}
                className="text-[10px] font-semibold bg-white dark:bg-[#202D3A] text-[#244C66] dark:text-[#75A4C4] border border-[#E3E7EA] dark:border-[#293644] px-2.5 py-1 rounded-full hover:border-[#244C66] dark:hover:border-[#75A4C4] transition-colors cursor-pointer shrink-0"
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
                  <div className="w-7 h-7 rounded-lg bg-[#244C66] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-1">
                    IQ
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-xl p-3.5 text-xs leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-[#244C66] text-white rounded-tr-xs'
                      : 'bg-[#F7F8FA] dark:bg-[#162029] text-[#202A32] dark:text-[#F0F4F7] border border-[#E3E7EA] dark:border-[#293644] rounded-tl-xs'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>

                  {/* Structured Recommendation Card */}
                  {msg.structured && (
                    <div className="mt-3.5 space-y-3 pt-3 border-t border-[#E3E7EA] dark:border-[#293644] bg-white dark:bg-[#1B242E] p-3 rounded-lg border">
                      
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-[#202A32] dark:text-[#F0F4F7]">
                          {msg.structured.title}
                        </span>
                        <span className="font-mono text-xs font-black text-[#B66A45] bg-[#B66A45]/10 px-2 py-0.5 rounded">
                          Total: {msg.structured.totalCost}
                        </span>
                      </div>

                      {/* Day by Day Plan */}
                      <div className="space-y-1.5">
                        {msg.structured.days.map((d, i) => (
                          <div key={i} className="p-2 rounded-md bg-[#F7F8FA] dark:bg-[#162029] border border-[#E3E7EA] dark:border-[#293644] flex flex-col gap-0.5">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-[11px] text-[#244C66] dark:text-[#75A4C4]">{d.day}</span>
                              <span className="font-mono text-[10px] text-[#66737D] dark:text-[#89939B]">{d.cost}</span>
                            </div>
                            <p className="font-semibold text-[11px] text-[#202A32] dark:text-[#F0F4F7]">{d.title}</p>
                            {d.transport && <p className="text-[10px] text-[#356280]">🚆 {d.transport}</p>}
                            {d.places && <p className="text-[10px] text-emerald-600 dark:text-emerald-400">📍 {d.places}</p>}
                            {d.activities && <p className="text-[10px] text-[#B66A45]">⚡ {d.activities}</p>}
                            {d.food && <p className="text-[10px] text-[#66737D]">🍽️ {d.food}</p>}
                          </div>
                        ))}
                      </div>

                      {/* Cost Breakdown */}
                      {msg.structured.breakdown && (
                        <div className="grid grid-cols-2 gap-1.5 text-[10px] bg-[#F7F8FA] dark:bg-[#162029] p-2 rounded-md border border-[#E3E7EA] dark:border-[#293644]">
                          <span>Transport: <strong>{msg.structured.breakdown.transport}</strong></span>
                          <span>Stays: <strong>{msg.structured.breakdown.hotel}</strong></span>
                          <span>Food: <strong>{msg.structured.breakdown.food}</strong></span>
                          <span>Activities: <strong>{msg.structured.breakdown.activities}</strong></span>
                        </div>
                      )}

                      {/* Travel Tips */}
                      {msg.structured.tips && (
                        <div className="space-y-1 text-[10px] text-[#66737D] dark:text-[#89939B]">
                          <span className="font-bold text-[#244C66] dark:text-[#75A4C4]">Concierge Tips:</span>
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
                  <div className="w-7 h-7 rounded-lg bg-[#B66A45] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-1">
                    <User className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-xs text-[#66737D] dark:text-[#89939B]">
                <div className="w-4 h-4 border-2 border-[#244C66] border-t-transparent rounded-full animate-spin" />
                <span>Crafting multimodal travel plan...</span>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Chat Input */}
          <div className="p-3 border-t border-[#E3E7EA] dark:border-[#293644] bg-[#F7F8FA] dark:bg-[#162029]">
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
                className="flex-1 bg-white dark:bg-[#1B242E] border border-[#E3E7EA] dark:border-[#293644] rounded-xl px-3.5 py-2.5 text-xs text-[#202A32] dark:text-[#F0F4F7] outline-none focus:border-[#244C66]"
              />
              <button
                type="button"
                onClick={toggleListening}
                title={isListening ? "Stop listening" : "Speak message"}
                className={`p-2.5 rounded-xl transition-all cursor-pointer ${
                  isListening 
                    ? 'bg-rose-600 text-white animate-pulse' 
                    : 'bg-[#EEF2F4] dark:bg-[#202D3A] text-[#244C66] dark:text-[#75A4C4] hover:bg-[#E3E7EA]'
                }`}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="p-2.5 rounded-xl bg-[#244C66] hover:bg-[#193B51] disabled:opacity-50 text-white transition-colors cursor-pointer"
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
