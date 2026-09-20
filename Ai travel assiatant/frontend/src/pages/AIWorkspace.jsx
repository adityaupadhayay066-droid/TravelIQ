import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Sparkles, Database, Mic, Globe2, Building2, BarChart3, Network, Cpu, 
  Brain, ChevronRight, Zap, ShieldCheck, ArrowRight
} from 'lucide-react';

const FEATURES = [
  {
    title: 'Travel Copilot',
    desc: 'AI-powered itinerary planner with cost breakdowns, carbon analysis, and RAG-backed reasoning.',
    icon: Sparkles,
    to: '/dashboard/rag',
    emoji: '🤖',
    stats: '1,540 vectors indexed'
  },
  {
    title: 'RAG Knowledge Search',
    desc: 'Ask any travel question and get answers with source citations from our document knowledge base.',
    icon: Database,
    to: '/dashboard/rag',
    emoji: '🧠',
    stats: '184 documents'
  },
  {
    title: 'Voice Assistant',
    desc: 'Speak naturally to search trains, track trips, find food, and navigate stations hands-free.',
    icon: Mic,
    to: '/dashboard/voice-assistant',
    emoji: '🎤',
    stats: 'Hindi + English'
  },
  {
    title: '3D Travel Globe',
    desc: 'Explore global flight routes, carbon emission layers, and weather patterns on an interactive 3D globe.',
    icon: Globe2,
    to: '/dashboard/3d-globe',
    emoji: '🌍',
    stats: '7 hub cities'
  },
  {
    title: '3D Station Viewer',
    desc: 'Navigate railway stations in 3D — platforms, exits, food courts, parking, and waiting rooms.',
    icon: Building2,
    to: '/dashboard/station-3d',
    emoji: '🏢',
    stats: 'Interactive 3D'
  },
  {
    title: 'AI Predictions',
    desc: 'LSTM neural network predictions for train delays, fare forecasts, crowd density, and coach occupancy.',
    icon: BarChart3,
    to: '/dashboard/ai-predictions',
    emoji: '📊',
    stats: '8 deep learning models'
  },
  {
    title: 'Knowledge Graph',
    desc: 'Interactive relational graph mapping cities, stations, routes, foods, hotels, and bookings.',
    icon: Network,
    to: '/dashboard/knowledge-graph',
    emoji: '🕸',
    stats: '17 nodes / 16 links'
  },
  {
    title: 'Agentic Planner',
    desc: '8 autonomous AI agents cascade through route, booking, food, budget, weather, safety, carbon, and hotel.',
    icon: Cpu,
    to: '/dashboard/agentic-planner',
    emoji: '🤝',
    stats: '8 agents'
  }
];

export default function AIWorkspace() {
  return (
    <div className="flex-1 w-full p-4 lg:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Hero Header */}
      <div className="p-8 bg-[#FFFFFF] dark:bg-[#1B2C28] border border-[#E3DED2] dark:border-[#2A403A] rounded-xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-[#EEF2ED] dark:bg-[#213530] rounded-lg">
              <Brain className="w-7 h-7 text-[#173F3A] dark:text-[#EEF2ED]" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-[#263238] dark:text-[#F7F5EF] font-manrope">AI Workspace</h1>
              <p className="text-[#66736F] dark:text-[#A3B0AB] text-sm font-inter">Your central hub for all AI-powered travel intelligence features.</p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="flex flex-wrap gap-4 mt-6">
            {[
              { icon: Zap, label: 'PyTorch Models', value: '8 Active' },
              { icon: Database, label: 'RAG Vectors', value: '1,540 Chunks' },
              { icon: Cpu, label: 'AI Agents', value: '8 Ready' },
              { icon: ShieldCheck, label: 'Security', value: 'Shield Active' }
            ].map((stat, i) => (
              <div key={i} className="px-4 py-2.5 bg-[#F7F5EF] dark:bg-[#12201D] border border-[#E3DED2] dark:border-[#2A403A] rounded-lg flex items-center gap-3">
                <stat.icon className="w-4 h-4 text-[#D96C4F] dark:text-[#C75D43]" />
                <div>
                  <p className="text-[10px] text-[#66736F] dark:text-[#A3B0AB] font-bold uppercase tracking-widest">{stat.label}</p>
                  <p className="text-xs font-bold text-[#263238] dark:text-[#F7F5EF]">{stat.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Feature Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {FEATURES.map((feature, idx) => (
          <Link key={idx} to={feature.to} className="block">
            <motion.div
              whileHover={{ y: -4 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="group h-full p-6 bg-[#FFFFFF] dark:bg-[#1B2C28] border border-[#E3DED2] dark:border-[#2A403A] rounded-xl cursor-pointer transition-shadow shadow-sm hover:shadow-[0_4px_16px_rgba(23,63,58,0.06)] dark:hover:shadow-none flex flex-col"
            >
              {/* Emoji Badge */}
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-[#EEF2ED] dark:bg-[#213530] rounded-lg">
                  <feature.icon className="w-5 h-5 text-[#173F3A] dark:text-[#EEF2ED]" />
                </div>
                <span className="text-2xl">{feature.emoji}</span>
              </div>

              {/* Content */}
              <h3 className="text-base font-bold text-[#263238] dark:text-[#F7F5EF] font-manrope mb-1.5 group-hover:text-[#173F3A] dark:group-hover:text-[#FFFFFF] transition-colors">{feature.title}</h3>
              <p className="text-xs text-[#66736F] dark:text-[#A3B0AB] font-inter leading-relaxed mb-4 flex-grow">{feature.desc}</p>

              {/* Footer */}
              <div className="flex items-center justify-between mt-auto pt-2 border-t border-[#E3DED2]/50 dark:border-[#2A403A]/50">
                <span className="text-[10px] text-[#66736F] dark:text-[#A3B0AB] font-semibold">{feature.stats}</span>
                <div className="flex items-center gap-1 text-[10px] text-[#D96C4F] dark:text-[#D96C4F] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                  Open <ArrowRight className="w-3 h-3" />
                </div>
              </div>
            </motion.div>
          </Link>
        ))}
      </div>
    </div>
  );
}
