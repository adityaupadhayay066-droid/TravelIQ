import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Network } from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const GROUP_COLORS = {
  city: '#D96C4F',     // accent
  station: '#E5B85C',  // secondary
  food: '#4F7D62',     // success
  hotel: '#173F3A',    // primary
  route: '#66736F',    // text-muted
  user: '#263238',     // text
  booking: '#B94A48'   // danger
};

const GROUP_LABELS = {
  city: '🏙 City', station: '🚉 Station', food: '🍲 Food', hotel: '🏨 Hotel',
  route: '🛤 Route', user: '👤 User', booking: '🎫 Booking'
};

export default function KnowledgeGraphPage() {
  const canvasRef = useRef(null);
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [hoveredNode, setHoveredNode] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);

  useEffect(() => {
    axios.get('/api/graph/data')
      .then(res => setGraphData(res.data))
      .catch(() => {
        // Fallback data
        setGraphData({
          nodes: [
            { id: 'city_delhi', label: 'New Delhi', group: 'city', value: 25 },
            { id: 'city_bbs', label: 'Bhubaneswar', group: 'city', value: 25 },
            { id: 'city_mumbai', label: 'Mumbai', group: 'city', value: 25 },
            { id: 'city_kolkata', label: 'Kolkata', group: 'city', value: 25 },
            { id: 'station_ndls', label: 'NDLS Station', group: 'station', value: 18 },
            { id: 'station_bbs', label: 'BBS Station', group: 'station', value: 18 },
            { id: 'station_csmt', label: 'CSMT Terminal', group: 'station', value: 18 },
            { id: 'station_hwh', label: 'Howrah Junction', group: 'station', value: 18 },
            { id: 'food_thaggu', label: 'Thaggu Laddu', group: 'food', value: 12 },
            { id: 'food_poda', label: 'Chhena Poda', group: 'food', value: 12 },
            { id: 'food_vada', label: 'Vada Pav', group: 'food', value: 12 },
            { id: 'hotel_royal', label: 'Royal Grand', group: 'hotel', value: 14 },
            { id: 'hotel_taj', label: 'Taj Palace', group: 'hotel', value: 14 },
            { id: 'route_del_bbs', label: 'Rajdhani NDLS-BBS', group: 'route', value: 16 },
            { id: 'route_mum_del', label: 'Duronto CSMT-NDLS', group: 'route', value: 16 },
            { id: 'user_current', label: 'You', group: 'user', value: 20 },
            { id: 'booking_active', label: 'Booking #B49201', group: 'booking', value: 15 }
          ],
          links: [
            { source: 'city_delhi', target: 'station_ndls', label: 'contains' },
            { source: 'city_bbs', target: 'station_bbs', label: 'contains' },
            { source: 'city_mumbai', target: 'station_csmt', label: 'contains' },
            { source: 'city_kolkata', target: 'station_hwh', label: 'contains' },
            { source: 'station_ndls', target: 'food_thaggu', label: 'popular' },
            { source: 'station_bbs', target: 'food_poda', label: 'delicacy' },
            { source: 'station_csmt', target: 'food_vada', label: 'famous' },
            { source: 'hotel_royal', target: 'city_bbs', label: 'located_in' },
            { source: 'hotel_taj', target: 'city_delhi', label: 'located_in' },
            { source: 'route_del_bbs', target: 'station_ndls', label: 'departs' },
            { source: 'route_del_bbs', target: 'station_bbs', label: 'arrives' },
            { source: 'route_mum_del', target: 'station_csmt', label: 'departs' },
            { source: 'route_mum_del', target: 'station_ndls', label: 'arrives' },
            { source: 'user_current', target: 'booking_active', label: 'holds' },
            { source: 'booking_active', target: 'route_del_bbs', label: 'reserved' },
            { source: 'user_current', target: 'food_poda', label: 'prefers' }
          ]
        });
      });
  }, []);

  // Canvas rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || graphData.nodes.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId;
    const resize = () => {
      canvas.width = canvas.parentElement.clientWidth;
      canvas.height = 560;
    };
    resize();
    window.addEventListener('resize', resize);

    const width = () => canvas.width;
    const height = () => canvas.height;

    // Layout nodes
    const computedNodes = graphData.nodes.map((n) => {
      const groups = graphData.nodes.filter(nd => nd.group === n.group);
      const idx = groups.indexOf(n);
      const count = groups.length;
      const groupOrder = ['city', 'station', 'route', 'hotel', 'food', 'booking', 'user'];
      const row = groupOrder.indexOf(n.group);
      return {
        ...n,
        baseX: 80 + (idx * (width() - 160)) / Math.max(count - 1, 1),
        baseY: 60 + row * 75,
        x: 0, y: 0,
        radius: n.value || 12,
        phase: Math.random() * Math.PI * 2
      };
    });

    const draw = () => {
      ctx.clearRect(0, 0, width(), height());
      const time = Date.now() * 0.001;

      computedNodes.forEach(n => {
        n.x = n.baseX + Math.sin(time + n.phase) * 6;
        n.y = n.baseY + Math.cos(time * 0.7 + n.phase) * 4;
      });

      // Draw links
      graphData.links.forEach(link => {
        const s = computedNodes.find(n => n.id === link.source);
        const t = computedNodes.find(n => n.id === link.target);
        if (!s || !t) return;
        const hl = (hoveredNode || selectedNode)?.id === s.id || (hoveredNode || selectedNode)?.id === t.id;
        ctx.strokeStyle = hl ? '#D96C4F' : '#E3DED2';
        ctx.lineWidth = hl ? 2.5 : 1;
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(t.x, t.y);
        ctx.stroke();
        if (hl) {
          ctx.fillStyle = '#66736F';
          ctx.font = '9px Inter, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(link.label, (s.x + t.x) / 2, (s.y + t.y) / 2 - 6);
        }
      });

      // Draw nodes
      computedNodes.forEach(node => {
        const isHl = (hoveredNode || selectedNode)?.id === node.id;
        if (isHl) {
          ctx.fillStyle = 'rgba(217, 108, 79, 0.15)'; // Accent subtle bg
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.radius + 10, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.fillStyle = GROUP_COLORS[node.group] || '#173F3A';
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#F7F5EF';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = '#66736F'; // Neutral text that works ok on light/dark backgrounds
        ctx.font = isHl ? 'bold 11px Inter, sans-serif' : '10px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(node.label, node.x, node.y + node.radius + 14);
      });

      animId = requestAnimationFrame(draw);
    };
    draw();

    const handleMouse = (e) => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      let found = null;
      for (const n of computedNodes) {
        if (Math.hypot(n.x - mx, n.y - my) <= n.radius + 5) { found = n; break; }
      }
      setHoveredNode(found);
    };
    const handleClick = (e) => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      let found = null;
      for (const n of computedNodes) {
        if (Math.hypot(n.x - mx, n.y - my) <= n.radius + 5) { found = n; break; }
      }
      setSelectedNode(found);
    };
    canvas.addEventListener('mousemove', handleMouse);
    canvas.addEventListener('click', handleClick);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('mousemove', handleMouse);
      canvas.removeEventListener('click', handleClick);
    };
  }, [graphData, hoveredNode, selectedNode]);

  const activeNode = selectedNode || hoveredNode;

  return (
    <div className="flex-1 w-full p-4 lg:p-8 space-y-6 max-w-7xl mx-auto font-inter">
      <div className="flex items-center gap-3 mb-2">
        <Link to="/dashboard/ai-workspace" className="p-2 hover:bg-[#E3DED2] dark:hover:bg-[#2A403A] rounded-xl transition-colors">
          <ArrowLeft className="w-5 h-5 text-[#66736F] dark:text-[#A3B0AB]" />
        </Link>
        <div className="p-2.5 bg-[#EEF2ED] dark:bg-[#213530] border border-[#E3DED2] dark:border-[#2A403A] rounded-xl">
          <Network className="w-6 h-6 text-[#D96C4F]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#263238] dark:text-[#F7F5EF] font-manrope">Knowledge Graph</h1>
          <p className="text-[#66736F] dark:text-[#A3B0AB] text-sm">Interactive relational graph of cities, stations, routes, foods, hotels, and bookings.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Canvas */}
        <div className="lg:col-span-9 bg-[#FFFFFF] dark:bg-[#1B2C28] border border-[#E3DED2] dark:border-[#2A403A] rounded-xl p-4 relative shadow-sm">
          <canvas ref={canvasRef} className="w-full block cursor-crosshair" />
          {activeNode && (
            <div className="absolute top-4 left-4 p-4 bg-[#FFFFFF] dark:bg-[#1B2C28] border border-[#E3DED2] dark:border-[#2A403A] rounded-xl shadow-[0_4px_16px_rgba(23,63,58,0.06)] max-w-[220px] z-10">
              <p className="text-[9px] text-[#66736F] dark:text-[#A3B0AB] uppercase tracking-widest font-bold font-manrope">{GROUP_LABELS[activeNode.group]}</p>
              <p className="text-sm font-bold text-[#263238] dark:text-[#F7F5EF] mt-1 font-manrope">{activeNode.label}</p>
              <p className="text-[10px] text-[#66736F] dark:text-[#A3B0AB] mt-1">
                {graphData.links.filter(l => l.source === activeNode.id || l.target === activeNode.id).length} connections
              </p>
            </div>
          )}
        </div>

        {/* Legend + Details */}
        <div className="lg:col-span-3 space-y-4">
          <div className="p-5 bg-[#FFFFFF] dark:bg-[#1B2C28] border border-[#E3DED2] dark:border-[#2A403A] rounded-xl shadow-sm">
            <h3 className="text-xs font-bold text-[#263238] dark:text-[#F7F5EF] mb-3 uppercase tracking-widest font-manrope">Legend</h3>
            <div className="space-y-2">
              {Object.entries(GROUP_LABELS).map(([key, label]) => (
                <div key={key} className="flex items-center gap-2 text-xs">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: GROUP_COLORS[key] }} />
                  <span className="text-[#263238] dark:text-[#F7F5EF] font-medium">{label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-5 bg-[#FFFFFF] dark:bg-[#1B2C28] border border-[#E3DED2] dark:border-[#2A403A] rounded-xl shadow-sm">
            <h3 className="text-xs font-bold text-[#263238] dark:text-[#F7F5EF] mb-3 uppercase tracking-widest font-manrope">Graph Stats</h3>
            <div className="space-y-2 text-xs text-[#66736F] dark:text-[#A3B0AB]">
              <div className="flex justify-between"><span>Nodes</span><span className="text-[#263238] dark:text-[#F7F5EF] font-bold">{graphData.nodes.length}</span></div>
              <div className="flex justify-between"><span>Links</span><span className="text-[#263238] dark:text-[#F7F5EF] font-bold">{graphData.links.length}</span></div>
              <div className="flex justify-between"><span>Groups</span><span className="text-[#263238] dark:text-[#F7F5EF] font-bold">{new Set(graphData.nodes.map(n => n.group)).size}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
