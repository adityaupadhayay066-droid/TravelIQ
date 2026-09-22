import React, { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Sphere, Html, Line, PointMaterial, Points } from '@react-three/drei';
import * as THREE from 'three';
import { motion } from 'framer-motion';
import { Cpu, TrendingDown, ShieldCheck, Sun } from 'lucide-react';

const HUBS = [
  { name: 'New Delhi', lat: 28.6139, lon: 77.2090, label: 'DEL' },
  { name: 'London', lat: 51.5074, lon: -0.1278, label: 'LHR' },
  { name: 'New York', lat: 40.7128, lon: -74.0060, label: 'JFK' },
  { name: 'Tokyo', lat: 35.6762, lon: 139.6503, label: 'NRT' },
  { name: 'Sydney', lat: -33.8688, lon: 151.2093, label: 'SYD' },
  { name: 'Dubai', lat: 25.2048, lon: 55.2708, label: 'DXB' },
  { name: 'Paris', lat: 48.8566, lon: 2.3522, label: 'CDG' }
];

const ROUTES = [
  { from: 1, to: 0 },
  { from: 2, to: 1 },
  { from: 0, to: 3 },
  { from: 3, to: 4 },
  { from: 0, to: 5 },
  { from: 5, to: 6 },
  { from: 2, to: 5 }
];

// Sphere Radius set to 4.5; combined with Camera Z=12.5 gives a ~650px-700px crisp uncropped globe
const GLOBE_RADIUS = 4.5;

const get3DPoint = (lat, lon, radius = GLOBE_RADIUS) => {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = (radius * Math.sin(phi) * Math.sin(theta));
  const y = (radius * Math.cos(phi));
  return new THREE.Vector3(x, y, z);
};

// Moving Airplanes / Jet Sprites along Bezier Curves
const FlightParticle = ({ curve, speedScale = 1 }) => {
  const meshRef = useRef();
  const progress = useRef(Math.random());

  useFrame((state, delta) => {
    progress.current += delta * 0.15 * speedScale;
    if (progress.current > 1) progress.current = 0;
    if (meshRef.current) {
      const position = curve.getPoint(progress.current);
      meshRef.current.position.copy(position);
      
      const nextPos = curve.getPoint(Math.min(progress.current + 0.02, 1));
      meshRef.current.lookAt(nextPos);
    }
  });

  return (
    <group ref={meshRef}>
      <mesh>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshBasicMaterial color="#D96C4F" />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.18, 16, 16]} />
        <meshBasicMaterial color="#E5B85C" transparent opacity={0.45} blending={THREE.AdditiveBlending} />
      </mesh>
    </group>
  );
};

const FlightRoute = ({ start, end, index }) => {
  const curve = useMemo(() => {
    const v1 = get3DPoint(start.lat, start.lon, GLOBE_RADIUS);
    const v2 = get3DPoint(end.lat, end.lon, GLOBE_RADIUS);
    
    const midPoint = v1.clone().lerp(v2, 0.5);
    const distance = v1.distanceTo(v2);
    midPoint.normalize().multiplyScalar(GLOBE_RADIUS + distance * 0.32);

    return new THREE.QuadraticBezierCurve3(v1, midPoint, v2);
  }, [start, end]);

  const points = useMemo(() => curve.getPoints(50), [curve]);

  return (
    <group>
      <Line points={points} color="#D96C4F" lineWidth={2.5} opacity={0.65} transparent />
      <FlightParticle curve={curve} speedScale={1 + (index % 3) * 0.2} />
    </group>
  );
};

// Dotted 3D Holographic Globe Grid
const EarthGrid = () => {
  const points = useMemo(() => {
    const pts = [];
    for (let lat = -80; lat <= 80; lat += 4.5) {
      const cosLat = Math.cos(lat * Math.PI / 180);
      const lonStep = cosLat > 0 ? Math.max(4.5, Math.round(4.5 / cosLat)) : 40;
      for (let lon = -180; lon < 180; lon += lonStep) {
        pts.push(get3DPoint(lat, lon, GLOBE_RADIUS + 0.02));
      }
    }
    return pts;
  }, []);

  const positions = new Float32Array(points.length * 3);
  points.forEach((p, i) => {
    positions[i * 3] = p.x;
    positions[i * 3 + 1] = p.y;
    positions[i * 3 + 2] = p.z;
  });

  return (
    <Points positions={positions}>
      <PointMaterial color="#E5B85C" size={0.035} transparent opacity={0.5} sizeAttenuation />
    </Points>
  );
};

// Latitude & Longitude Neon Rings
const LatLonRings = () => {
  const lines = useMemo(() => {
    const allLines = [];
    [-60, -30, 0, 30, 60].forEach(lat => {
      const pts = [];
      for (let lon = -180; lon <= 180; lon += 5) {
        pts.push(get3DPoint(lat, lon, GLOBE_RADIUS + 0.01));
      }
      allLines.push(pts);
    });
    [-120, -60, 0, 60, 120, 180].forEach(lon => {
      const pts = [];
      for (let lat = -90; lat <= 90; lat += 5) {
        pts.push(get3DPoint(lat, lon, GLOBE_RADIUS + 0.01));
      }
      allLines.push(pts);
    });
    return allLines;
  }, []);

  return (
    <group>
      {lines.map((pts, i) => (
        <Line key={i} points={pts} color="#E3DED2" lineWidth={1.2} opacity={0.22} transparent />
      ))}
    </group>
  );
};

// Orbiting Satellites around Earth
const OrbitingSatellites = () => {
  const sat1 = useRef();
  const sat2 = useRef();
  const tRef = useRef(0);

  useFrame((state, delta) => {
    tRef.current += delta;
    const t = tRef.current;
    if (sat1.current) {
      const r = GLOBE_RADIUS + 1.2;
      sat1.current.position.x = Math.cos(t * 0.4) * r;
      sat1.current.position.z = Math.sin(t * 0.4) * r;
      sat1.current.position.y = Math.sin(t * 0.8) * 1.2;
    }
    if (sat2.current) {
      const r = GLOBE_RADIUS + 1.6;
      sat2.current.position.x = Math.sin(t * -0.35) * r;
      sat2.current.position.z = Math.cos(t * -0.35) * r;
      sat2.current.position.y = Math.cos(t * 0.6) * 1.5;
    }
  });

  return (
    <group>
      <group ref={sat1}>
        <mesh>
          <boxGeometry args={[0.15, 0.06, 0.1]} />
          <meshStandardMaterial color="#E5B85C" metalness={0.9} roughness={0.1} />
        </mesh>
        <mesh position={[0.2, 0, 0]}>
          <boxGeometry args={[0.22, 0.02, 0.12]} />
          <meshBasicMaterial color="#D96C4F" />
        </mesh>
        <mesh position={[-0.2, 0, 0]}>
          <boxGeometry args={[0.22, 0.02, 0.12]} />
          <meshBasicMaterial color="#D96C4F" />
        </mesh>
      </group>

      <group ref={sat2}>
        <mesh>
          <sphereGeometry args={[0.1, 16, 16]} />
          <meshStandardMaterial color="#D96C4F" metalness={0.8} />
        </mesh>
        <mesh>
          <sphereGeometry args={[0.18, 16, 16]} />
          <meshBasicMaterial color="#D96C4F" transparent opacity={0.4} blending={THREE.AdditiveBlending} />
        </mesh>
      </group>
    </group>
  );
};

// Holographic Orbit Rings
const OrbitRings = () => {
  const ringRef1 = useRef();
  const ringRef2 = useRef();

  useFrame((state, delta) => {
    if (ringRef1.current) ringRef1.current.rotation.z += delta * 0.05;
    if (ringRef2.current) ringRef2.current.rotation.x += delta * 0.03;
  });

  return (
    <group>
      <group ref={ringRef1} rotation={[Math.PI / 3, Math.PI / 6, 0]}>
        <mesh>
          <ringGeometry args={[GLOBE_RADIUS + 0.9, GLOBE_RADIUS + 0.95, 64]} />
          <meshBasicMaterial color="#E3DED2" transparent opacity={0.35} side={THREE.DoubleSide} />
        </mesh>
      </group>
      <group ref={ringRef2} rotation={[-Math.PI / 4, Math.PI / 3, 0]}>
        <mesh>
          <ringGeometry args={[GLOBE_RADIUS + 1.4, GLOBE_RADIUS + 1.44, 64]} />
          <meshBasicMaterial color="#E5B85C" transparent opacity={0.25} side={THREE.DoubleSide} />
        </mesh>
      </group>
    </group>
  );
};

// Scanning Ring Wave
const ScanningWave = () => {
  const scanRef = useRef();
  const tRef = useRef(0);

  useFrame((state, delta) => {
    tRef.current += delta;
    if (scanRef.current) {
      scanRef.current.position.y = Math.sin(tRef.current * 0.8) * (GLOBE_RADIUS - 0.2);
    }
  });

  return (
    <mesh ref={scanRef} rotation={[Math.PI / 2, 0, 0]}>
      <ringGeometry args={[GLOBE_RADIUS - 0.1, GLOBE_RADIUS + 0.12, 64]} />
      <meshBasicMaterial color="#D96C4F" transparent opacity={0.16} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} />
    </mesh>
  );
};

const HubMarker = ({ position, label, name }) => {
  const ref = useRef();
  
  useEffect(() => {
    if (ref.current) ref.current.lookAt(0, 0, 0);
  }, []);

  return (
    <group position={position}>
      <group ref={ref}>
        <mesh>
          <sphereGeometry args={[0.07, 16, 16]} />
          <meshBasicMaterial color="#D96C4F" />
        </mesh>
        <mesh>
          <ringGeometry args={[0.1, 0.22, 32]} />
          <meshBasicMaterial color="#E5B85C" transparent opacity={0.6} side={THREE.DoubleSide} />
        </mesh>
      </group>

      <Html center distanceFactor={42} occlude position={[0, 0.25, 0]}>
        <div className="flex items-center gap-1 bg-[#FFFFFF] dark:bg-[#1B2C28] border border-[#E3DED2] dark:border-[#2A403A] shadow-sm px-1.5 py-0.5 rounded-full select-none whitespace-nowrap pointer-events-none">
          <span className="w-1.5 h-1.5 rounded-full bg-[#D96C4F]" />
          <span className="text-[9px] font-bold text-[#173F3A] dark:text-[#EEF2ED] tracking-wider">{label}</span>
          <span className="text-[8px] text-[#66736F] dark:text-[#A3B0AB] font-medium hidden sm:inline">({name})</span>
        </div>
      </Html>
    </group>
  );
};

const GlobeScene = () => {
  const groupRef = useRef();
  const { mouse } = useThree();

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.07;
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, mouse.y * 0.2, 0.05);
      groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, -mouse.x * 0.2, 0.05);
    }
  });

  return (
    <group ref={groupRef}>
      <Sphere args={[GLOBE_RADIUS, 64, 64]}>
        <meshPhongMaterial color="#173F3A" emissive="#0F332F" specular="#E5B85C" shininess={40} />
      </Sphere>

      <Sphere args={[GLOBE_RADIUS + 0.28, 32, 32]}>
        <meshBasicMaterial color="#EEF2ED" transparent opacity={0.16} side={THREE.BackSide} blending={THREE.AdditiveBlending} />
      </Sphere>

      <Sphere args={[GLOBE_RADIUS + 0.65, 32, 32]}>
        <meshBasicMaterial color="#E3DED2" transparent opacity={0.08} side={THREE.BackSide} blending={THREE.AdditiveBlending} />
      </Sphere>

      <EarthGrid />
      <LatLonRings />
      <ScanningWave />
      <OrbitingSatellites />
      <OrbitRings />

      {HUBS.map((hub, i) => {
        const pos = get3DPoint(hub.lat, hub.lon, GLOBE_RADIUS + 0.04);
        return <HubMarker key={i} position={pos} label={hub.label} name={hub.name} />;
      })}

      {ROUTES.map((r, i) => (
        <FlightRoute key={i} index={i} start={HUBS[r.from]} end={HUBS[r.to]} />
      ))}
    </group>
  );
};

export default function Globe3D() {
  return (
    <div className="w-full h-[320px] sm:h-[450px] md:h-[600px] lg:h-[720px] flex items-center justify-center relative select-none overflow-visible">
      
      {/* THREE.JS CANVAS CONTAINER */}
      <div className="w-full h-full cursor-grab active:cursor-grabbing">
        <Canvas 
          camera={{ position: [0, 0, 12.5], fov: 45 }}
          style={{ background: 'transparent' }}
          dpr={[1, 2]}
          performance={{ min: 0.6 }}
          gl={{ antialias: true, alpha: true }}
        >
          <ambientLight intensity={0.65} />
          <directionalLight position={[10, 12, 6]} intensity={1.3} color="#ffffff" />
          <directionalLight position={[-10, -10, -5]} intensity={0.5} color="#E5B85C" />
          
          <GlobeScene />
          
          <OrbitControls 
            enableZoom={false} 
            enablePan={false} 
            rotateSpeed={0.5} 
            autoRotate 
            autoRotateSpeed={0.5} 
          />
        </Canvas>
      </div>

      {/* ===== 4 FLOATING CARDS STRICTLY ORBITING AROUND THE OUTER EDGES ===== */}

      {/* Card 1: AI Route Optimization (Top-Left Outer Corner) */}
      <motion.div 
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="hidden sm:block absolute top-2 left-2 sm:left-4 p-3 sm:p-3.5 bg-[#FFFFFF] dark:bg-[#1B2C28] border border-[#E3DED2] dark:border-[#2A403A] rounded-xl shadow-sm max-w-[190px] sm:max-w-[210px] pointer-events-auto hover:border-[#173F3A] dark:hover:border-[#EEF2ED] transition-all duration-300 group z-20"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-[#EEF2ED] dark:bg-[#213530] border border-[#E3DED2] dark:border-[#2A403A] flex items-center justify-center text-[#173F3A] dark:text-[#EEF2ED] flex-shrink-0">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[9px] text-[#66736F] dark:text-[#A3B0AB] font-bold uppercase tracking-wider">AI Route Optimization</p>
            <p className="text-xs font-bold text-[#263238] dark:text-[#F7F5EF] flex items-center gap-1">
              99.2% <span className="text-[9px] text-[#173F3A] dark:text-[#EEF2ED] font-normal">Accuracy</span>
            </p>
          </div>
        </div>
        <div className="mt-2 pt-1.5 border-t border-[#E3DED2] dark:border-[#2A403A] flex items-center justify-between text-[9px] text-[#66736F] dark:text-[#A3B0AB]">
          <span>Graph Neural Net</span>
          <span className="text-[#4F7D62] font-bold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#4F7D62]" /> Active
          </span>
        </div>
      </motion.div>

      {/* Card 2: Price Prediction (Bottom-Left Outer Corner) */}
      <motion.div 
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, delay: 0.4 }}
        className="hidden sm:block absolute bottom-4 left-2 sm:left-4 p-3 sm:p-3.5 bg-[#FFFFFF] dark:bg-[#1B2C28] border border-[#E3DED2] dark:border-[#2A403A] rounded-xl shadow-sm max-w-[190px] sm:max-w-[210px] pointer-events-auto hover:border-[#173F3A] dark:hover:border-[#EEF2ED] transition-all duration-300 group z-20"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-[#EEF2ED] dark:bg-[#213530] border border-[#E3DED2] dark:border-[#2A403A] flex items-center justify-center text-[#173F3A] dark:text-[#EEF2ED] flex-shrink-0">
            <TrendingDown className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[9px] text-[#66736F] dark:text-[#A3B0AB] font-bold uppercase tracking-wider">Price Prediction</p>
            <p className="text-xs font-bold text-[#263238] dark:text-[#F7F5EF]">
              Drop in 2 Days
            </p>
          </div>
        </div>
        <div className="mt-2 pt-1.5 border-t border-[#E3DED2] dark:border-[#2A403A] flex items-center justify-between text-[9px] text-[#66736F] dark:text-[#A3B0AB]">
          <span>Fare Trend</span>
          <span className="text-[#D96C4F] font-bold">₹1,240 Saved</span>
        </div>
      </motion.div>

      {/* Card 3: Delay Forecast (Top-Right Outer Corner) */}
      <motion.div 
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, delay: 0.3 }}
        className="hidden sm:block absolute top-2 right-2 sm:right-4 p-3 sm:p-3.5 bg-[#FFFFFF] dark:bg-[#1B2C28] border border-[#E3DED2] dark:border-[#2A403A] rounded-xl shadow-sm max-w-[190px] sm:max-w-[210px] pointer-events-auto hover:border-[#173F3A] dark:hover:border-[#EEF2ED] transition-all duration-300 group z-20"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-[#EEF2ED] dark:bg-[#213530] border border-[#E3DED2] dark:border-[#2A403A] flex items-center justify-center text-[#173F3A] dark:text-[#EEF2ED] flex-shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[9px] text-[#66736F] dark:text-[#A3B0AB] font-bold uppercase tracking-wider">Delay Forecast</p>
            <p className="text-xs font-bold text-[#263238] dark:text-[#F7F5EF] flex items-center gap-1">
              94% <span className="text-[9px] text-[#66736F] dark:text-[#A3B0AB] font-normal">Confidence</span>
            </p>
          </div>
        </div>
        <div className="mt-2 pt-1.5 border-t border-[#E3DED2] dark:border-[#2A403A] flex items-center justify-between text-[9px] text-[#66736F] dark:text-[#A3B0AB]">
          <span>LSTM Shield</span>
          <span className="text-[#4F7D62] font-bold">0 Delays</span>
        </div>
      </motion.div>

      {/* Card 4: Weather Intelligence (Bottom-Right Outer Corner) */}
      <motion.div 
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, delay: 0.5 }}
        className="hidden sm:block absolute bottom-4 right-2 sm:right-4 p-3 sm:p-3.5 bg-[#FFFFFF] dark:bg-[#1B2C28] border border-[#E3DED2] dark:border-[#2A403A] rounded-xl shadow-sm max-w-[190px] sm:max-w-[210px] pointer-events-auto hover:border-[#173F3A] dark:hover:border-[#EEF2ED] transition-all duration-300 group z-20"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-[#EEF2ED] dark:bg-[#213530] border border-[#E3DED2] dark:border-[#2A403A] flex items-center justify-center text-[#E5B85C] flex-shrink-0">
            <Sun className="w-5 h-5 animate-spin-slow" />
          </div>
          <div>
            <p className="text-[9px] text-[#66736F] dark:text-[#A3B0AB] font-bold uppercase tracking-wider">Weather Intelligence</p>
            <p className="text-xs font-bold text-[#263238] dark:text-[#F7F5EF]">
              Live 24°C Sunny
            </p>
          </div>
        </div>
        <div className="mt-2 pt-1.5 border-t border-[#E3DED2] dark:border-[#2A403A] flex items-center justify-between text-[9px] text-[#66736F] dark:text-[#A3B0AB]">
          <span>Climate Risk</span>
          <span className="text-[#173F3A] dark:text-[#EEF2ED] font-bold">Optimal Window</span>
        </div>
      </motion.div>

    </div>
  );
}
