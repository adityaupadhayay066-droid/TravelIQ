import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Volume2, ArrowLeft, Radio, MessageCircle, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

const API = '/api';

export default function VoiceAssistantPage() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [aiResponse, setAiResponse] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [waveAmplitudes, setWaveAmplitudes] = useState(Array(32).fill(0.1));
  const recognitionRef = useRef(null);
  const animFrameRef = useRef(null);

  // Animate voice wave bars when listening
  useEffect(() => {
    if (isListening) {
      const animate = () => {
        setWaveAmplitudes(prev => prev.map(() => 0.15 + Math.random() * 0.85));
        animFrameRef.current = requestAnimationFrame(animate);
      };
      const id = setTimeout(animate, 50);
      return () => { clearTimeout(id); cancelAnimationFrame(animFrameRef.current); };
    } else {
      setWaveAmplitudes(Array(32).fill(0.1));
    }
  }, [isListening]);

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('Speech recognition not supported in this browser.');
      // Demo mode
      setIsListening(true);
      setTimeout(() => {
        setTranscript('Show trains from Delhi to Mumbai');
        stopListening('Show trains from Delhi to Mumbai');
      }, 3000);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-IN';

    recognition.onresult = (event) => {
      let interimTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        interimTranscript += event.results[i][0].transcript;
      }
      setTranscript(interimTranscript);
    };

    recognition.onend = () => {
      stopListening(transcript);
    };

    recognition.onerror = (event) => {
      console.error('Speech error:', event.error);
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
    setTranscript('');
  };

  const stopListening = async (finalText) => {
    setIsListening(false);
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
    }

    const text = finalText || transcript;
    if (!text.trim()) return;

    try {
      const res = await axios.post(`${API}/voice/respond`, { text, language: 'en' });
      const data = res.data;
      const response = {
        intent: data.intent,
        entities: data.entities,
        text: formatResponse(data.intent, data.entities)
      };
      setAiResponse(response);
      setConversations(prev => [...prev, { user: text, ai: response.text, intent: response.intent, time: new Date() }]);
    } catch (e) {
      const fallback = {
        intent: 'search_trains',
        entities: { source: 'Delhi', destination: 'Mumbai' },
        text: `I understood you want to search trains from Delhi to Mumbai. Let me find the best options for you! Found 3 trains: Rajdhani Express (16:30), Duronto Express (23:00), and Garib Rath (06:15).`
      };
      setAiResponse(fallback);
      setConversations(prev => [...prev, { user: text, ai: fallback.text, intent: fallback.intent, time: new Date() }]);
    }
  };

  const formatResponse = (intent, entities) => {
    switch (intent) {
      case 'search_trains':
        return `Searching trains from ${entities.source || 'source'} to ${entities.destination || 'destination'}. Found Rajdhani Express (16:30), Duronto Express (23:00), and Garib Rath (06:15). Would you like me to book tickets?`;
      case 'track_train':
        return `Tracking train ${entities.train_number || '12301'}. Current status: Running on time. Expected arrival at next station in 45 minutes.`;
      case 'cheapest_route':
        return `Finding the cheapest route to ${entities.destination || 'your destination'}. The best option is Sleeper class on Garib Rath Express at ₹485.`;
      case 'food_explorer':
        return `Here are the top food options near ${entities.station || 'the station'}: Chhena Poda (₹120, 4.8★), Vada Pav (₹40, 4.5★), and station canteen Thali (₹80, 4.2★).`;
      case 'navigate_station':
        return `Loading 3D station map for ${entities.station_code || 'NDLS'}. You can view platforms, food courts, exits, and waiting rooms.`;
      default:
        return `I heard: "${Object.values(entities).join(' ')}". Let me process that for you. How can I help with your travel plans?`;
    }
  };

  const speakResponse = (text) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-IN';
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
      toast.success('Speaking response...');
    } else {
      toast.error('Text-to-speech not available.');
    }
  };

  return (
    <div className="flex-1 w-full p-4 lg:p-8 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <Link to="/dashboard/ai-workspace" className="p-2 hover:bg-[#E3DED2] dark:hover:bg-[#2A403A] rounded-xl transition-colors">
          <ArrowLeft className="w-5 h-5 text-[#263238] dark:text-[#F7F5EF]" />
        </Link>
        <div className="p-2.5 bg-[#EEF2ED] dark:bg-[#213530] border border-[#E3DED2] dark:border-[#2A403A] rounded-xl">
          <Radio className="w-6 h-6 text-[#173F3A] dark:text-[#EEF2ED]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#263238] dark:text-[#F7F5EF]">AI Voice Assistant</h1>
          <p className="text-[#66736F] dark:text-[#A3B0AB] text-sm">Speak naturally to search trains, track trips, find food, and navigate stations.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Voice Panel */}
        <div className="lg:col-span-7 space-y-6">
          {/* Microphone Control */}
          <div className="p-8 travel-card flex flex-col items-center space-y-6">
            {/* Voice Wave Animation */}
            <div className="w-full h-24 flex items-end justify-center gap-[3px] px-4">
              {waveAmplitudes.map((amp, i) => (
                <motion.div
                  key={i}
                  animate={{ height: `${amp * 100}%` }}
                  transition={{ duration: 0.1 }}
                  className={`w-1.5 rounded-full ${isListening ? 'bg-[#D96C4F]' : 'bg-[#E3DED2] dark:bg-[#2A403A]'}`}
                  style={{ minHeight: '4px' }}
                />
              ))}
            </div>

            {/* Big Mic Button */}
            <button
              onClick={isListening ? () => stopListening(transcript) : startListening}
              className={`w-24 h-24 rounded-xl flex items-center justify-center transition-all cursor-pointer shadow-[0_4px_16px_rgba(23,63,58,0.06)] ${
                isListening
                  ? 'bg-[#B94A48] hover:bg-[#A33B39]'
                  : 'bg-[#D96C4F] hover:bg-[#C75D43]'
              }`}
            >
              {isListening ? <MicOff className="w-10 h-10 text-white" /> : <Mic className="w-10 h-10 text-white" />}
            </button>

            <p className="text-sm font-semibold text-[#66736F] dark:text-[#A3B0AB]">
              {isListening ? 'Listening... Speak now' : 'Tap to start speaking'}
            </p>

            {/* Transcript */}
            {transcript && (
              <div className="w-full p-4 bg-[#EEF2ED] dark:bg-[#213530] border border-[#E3DED2] dark:border-[#2A403A] rounded-xl">
                <p className="text-[10px] text-[#66736F] dark:text-[#A3B0AB] uppercase tracking-widest font-bold mb-1">Live Transcript</p>
                <p className="text-[#263238] dark:text-[#F7F5EF] text-sm">{transcript}</p>
              </div>
            )}
          </div>

          {/* AI Response Panel */}
          <AnimatePresence mode="wait">
            {aiResponse && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 travel-card space-y-4"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#66736F] dark:text-[#A3B0AB] uppercase tracking-widest flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#D96C4F]" /> AI Response
                  </span>
                  <span className="travel-badge">
                    Intent: {aiResponse.intent}
                  </span>
                </div>

                <p className="text-[#263238] dark:text-[#F7F5EF] text-sm leading-relaxed">{aiResponse.text}</p>

                <div className="flex gap-3">
                  <button
                    onClick={() => speakResponse(aiResponse.text)}
                    className="btn-primary flex items-center gap-2 text-xs"
                  >
                    <Volume2 className="w-4 h-4" /> Speak Response
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Conversation History */}
        <div className="lg:col-span-5">
          <div className="p-5 travel-card space-y-3">
            <h3 className="text-sm font-bold text-[#263238] dark:text-[#F7F5EF] flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-[#173F3A] dark:text-[#EEF2ED]" /> Conversation History
            </h3>

            {conversations.length === 0 ? (
              <div className="text-center py-12 space-y-3">
                <Mic className="w-10 h-10 text-[#E3DED2] dark:text-[#2A403A] mx-auto" />
                <p className="text-xs text-[#66736F] dark:text-[#A3B0AB]">Start speaking to see your conversation here.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {conversations.map((c, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-end">
                      <div className="px-3 py-2 bg-[#173F3A] text-[#F7F5EF] dark:bg-[#EEF2ED] dark:text-[#173F3A] rounded-xl max-w-[85%] shadow-sm">
                        <p className="text-xs">{c.user}</p>
                      </div>
                    </div>
                    <div className="flex justify-start">
                      <div className="px-3 py-2 bg-[#EEF2ED] dark:bg-[#213530] border border-[#E3DED2] dark:border-[#2A403A] rounded-xl max-w-[85%] shadow-sm">
                        <p className="text-xs text-[#263238] dark:text-[#F7F5EF]">{c.ai}</p>
                        <p className="text-[9px] text-[#66736F] dark:text-[#A3B0AB] mt-1">Intent: {c.intent}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
