import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';

// --- Low-Poly Detailed Indian Express Train ---
function IndianTrain({ progressRef }) {
  const trainGroup = useRef();

  useFrame((state, delta) => {
    if (progressRef) {
      progressRef.current = (progressRef.current + delta * 0.12) % (Math.PI * 2);
      const angle = progressRef.current;
      const radius = 3.6;
      if (trainGroup.current) {
        trainGroup.current.position.x = Math.cos(angle) * radius;
        trainGroup.current.position.z = Math.sin(angle) * radius;
        trainGroup.current.rotation.y = -angle + Math.PI / 2;
      }
    }
  });

  return (
    <group ref={trainGroup} position={[3.6, 0.28, 0]}>
      {/* Locomotive (WAP-7 / Indian Railways style) */}
      <group position={[0, 0, 0.4]}>
        {/* Engine Body - Royal Travel Blue & White Band */}
        <mesh position={[0, 0.22, 0]} castShadow>
          <boxGeometry args={[0.38, 0.32, 0.9]} />
          <meshStandardMaterial color="#1E3A8A" roughness={0.4} />
        </mesh>
        {/* White / Cream Stripe */}
        <mesh position={[0, 0.18, 0]}>
          <boxGeometry args={[0.39, 0.06, 0.91]} />
          <meshStandardMaterial color="#FFFDF7" roughness={0.3} />
        </mesh>
        {/* Red Accent Band */}
        <mesh position={[0, 0.12, 0]}>
          <boxGeometry args={[0.385, 0.04, 0.9]} />
          <meshStandardMaterial color="#DC2626" roughness={0.3} />
        </mesh>
        {/* Cab Windshield */}
        <mesh position={[0, 0.26, 0.455]}>
          <boxGeometry args={[0.28, 0.12, 0.02]} />
          <meshStandardMaterial color="#1E293B" roughness={0.2} metalness={0.8} />
        </mesh>
        {/* Pantograph on Roof */}
        <mesh position={[0, 0.42, -0.1]}>
          <boxGeometry args={[0.16, 0.08, 0.2]} />
          <meshStandardMaterial color="#64748B" metalness={0.6} roughness={0.3} />
        </mesh>
        {/* Headlight */}
        <mesh position={[0, 0.18, 0.46]}>
          <sphereGeometry args={[0.04, 8, 8]} />
          <meshStandardMaterial color="#FEF08A" emissive="#FDE047" emissiveIntensity={0.6} />
        </mesh>
        {/* Wheels / Bogies */}
        <mesh position={[-0.16, 0.05, 0.25]}>
          <cylinderGeometry args={[0.06, 0.06, 0.04, 8]} rotation={[0, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#334155" />
        </mesh>
        <mesh position={[0.16, 0.05, 0.25]}>
          <cylinderGeometry args={[0.06, 0.06, 0.04, 8]} rotation={[0, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#334155" />
        </mesh>
        <mesh position={[-0.16, 0.05, -0.25]}>
          <cylinderGeometry args={[0.06, 0.06, 0.04, 8]} rotation={[0, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#334155" />
        </mesh>
        <mesh position={[0.16, 0.05, -0.25]}>
          <cylinderGeometry args={[0.06, 0.06, 0.04, 8]} rotation={[0, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#334155" />
        </mesh>
      </group>

      {/* Passenger Coach 1 */}
      <group position={[0, 0, -0.6]}>
        <mesh position={[0, 0.22, 0]} castShadow>
          <boxGeometry args={[0.36, 0.3, 0.95]} />
          <meshStandardMaterial color="#2563EB" roughness={0.4} />
        </mesh>
        {/* Window Stripe */}
        <mesh position={[0, 0.24, 0]}>
          <boxGeometry args={[0.37, 0.08, 0.9]} />
          <meshStandardMaterial color="#0F172A" roughness={0.2} />
        </mesh>
        {/* Roof */}
        <mesh position={[0, 0.38, 0]}>
          <boxGeometry args={[0.34, 0.04, 0.93]} />
          <meshStandardMaterial color="#CBD5E1" roughness={0.5} />
        </mesh>
      </group>

      {/* Passenger Coach 2 */}
      <group position={[0, 0, -1.6]}>
        <mesh position={[0, 0.22, 0]} castShadow>
          <boxGeometry args={[0.36, 0.3, 0.95]} />
          <meshStandardMaterial color="#2563EB" roughness={0.4} />
        </mesh>
        <mesh position={[0, 0.24, 0]}>
          <boxGeometry args={[0.37, 0.08, 0.9]} />
          <meshStandardMaterial color="#0F172A" roughness={0.2} />
        </mesh>
        <mesh position={[0, 0.38, 0]}>
          <boxGeometry args={[0.34, 0.04, 0.93]} />
          <meshStandardMaterial color="#CBD5E1" roughness={0.5} />
        </mesh>
      </group>
    </group>
  );
}

// --- Miniature Sleek Airplane ---
function CruiseAirplane() {
  const planeRef = useRef();

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() * 0.4;
    if (planeRef.current) {
      planeRef.current.position.x = Math.sin(t) * 3.8;
      planeRef.current.position.z = Math.cos(t) * 3.2;
      planeRef.current.position.y = 2.4 + Math.sin(t * 2) * 0.15;
      planeRef.current.rotation.y = -t - Math.PI / 2;
      planeRef.current.rotation.z = Math.sin(t * 2) * 0.08;
      planeRef.current.rotation.x = 0.05;
    }
  });

  return (
    <group ref={planeRef} position={[0, 2.4, 0]}>
      {/* Fuselage */}
      <mesh castShadow>
        <cylinderGeometry args={[0.1, 0.09, 1.1, 16]} rotation={[Math.PI / 2, 0, 0]} />
        <meshStandardMaterial color="#FFFDF7" roughness={0.2} metalness={0.1} />
      </mesh>
      {/* Nose Cone */}
      <mesh position={[0, 0, 0.58]}>
        <coneGeometry args={[0.09, 0.18, 16]} rotation={[Math.PI / 2, 0, 0]} />
        <meshStandardMaterial color="#1E3A8A" roughness={0.3} />
      </mesh>
      {/* Main Wings */}
      <mesh position={[0, 0, 0.05]} castShadow>
        <boxGeometry args={[1.6, 0.02, 0.28]} />
        <meshStandardMaterial color="#FFFDF7" roughness={0.2} />
      </mesh>
      {/* Wingtip accents (Sunset Orange) */}
      <mesh position={[-0.8, 0.02, 0.05]}>
        <boxGeometry args={[0.04, 0.06, 0.1]} />
        <meshStandardMaterial color="#E58A3A" />
      </mesh>
      <mesh position={[0.8, 0.02, 0.05]}>
        <boxGeometry args={[0.04, 0.06, 0.1]} />
        <meshStandardMaterial color="#E58A3A" />
      </mesh>
      {/* Tail Fin */}
      <mesh position={[0, 0.18, -0.48]} rotation={[0.3, 0, 0]}>
        <boxGeometry args={[0.03, 0.3, 0.2]} />
        <meshStandardMaterial color="#1E3A8A" roughness={0.3} />
      </mesh>
      {/* Horizontal Stabilizers */}
      <mesh position={[0, 0.04, -0.5]}>
        <boxGeometry args={[0.55, 0.015, 0.14]} />
        <meshStandardMaterial color="#FFFDF7" roughness={0.2} />
      </mesh>
      {/* Jet Engines */}
      <mesh position={[-0.32, -0.07, 0.05]} castShadow>
        <cylinderGeometry args={[0.05, 0.05, 0.2, 12]} rotation={[Math.PI / 2, 0, 0]} />
        <meshStandardMaterial color="#94A3B8" metalness={0.6} roughness={0.3} />
      </mesh>
      <mesh position={[0.32, -0.07, 0.05]} castShadow>
        <cylinderGeometry args={[0.05, 0.05, 0.2, 12]} rotation={[Math.PI / 2, 0, 0]} />
        <meshStandardMaterial color="#94A3B8" metalness={0.6} roughness={0.3} />
      </mesh>
    </group>
  );
}

// --- Travel Bus on Road ---
function TravelBus() {
  const busRef = useRef();

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() * 0.18 + 1.2;
    const r = 2.3;
    if (busRef.current) {
      busRef.current.position.x = Math.sin(t) * r;
      busRef.current.position.z = Math.cos(t) * r;
      busRef.current.rotation.y = t + Math.PI;
    }
  });

  return (
    <group ref={busRef} position={[0, 0.22, 0]}>
      {/* Bus Body */}
      <mesh position={[0, 0.14, 0]} castShadow>
        <boxGeometry args={[0.26, 0.22, 0.65]} />
        <meshStandardMaterial color="#E58A3A" roughness={0.4} />
      </mesh>
      {/* White Top / Roof */}
      <mesh position={[0, 0.25, 0]}>
        <boxGeometry args={[0.25, 0.04, 0.64]} />
        <meshStandardMaterial color="#FFFDF7" roughness={0.3} />
      </mesh>
      {/* Windows */}
      <mesh position={[0, 0.16, 0]}>
        <boxGeometry args={[0.27, 0.08, 0.58]} />
        <meshStandardMaterial color="#1E293B" roughness={0.1} />
      </mesh>
      {/* Wheels */}
      <mesh position={[-0.12, 0.04, 0.18]}>
        <cylinderGeometry args={[0.04, 0.04, 0.03, 8]} rotation={[0, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#1E293B" />
      </mesh>
      <mesh position={[0.12, 0.04, 0.18]}>
        <cylinderGeometry args={[0.04, 0.04, 0.03, 8]} rotation={[0, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#1E293B" />
      </mesh>
      <mesh position={[-0.12, 0.04, -0.18]}>
        <cylinderGeometry args={[0.04, 0.04, 0.03, 8]} rotation={[0, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#1E293B" />
      </mesh>
      <mesh position={[0.12, 0.04, -0.18]}>
        <cylinderGeometry args={[0.04, 0.04, 0.03, 8]} rotation={[0, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#1E293B" />
      </mesh>
    </group>
  );
}

// --- 3D Location Marker Pin with Pulse Ring ---
function LocationPin3D({ position = [0, 0.5, 0] }) {
  const pinRef = useRef();
  const ringRef = useRef();

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (pinRef.current) {
      pinRef.current.position.y = position[1] + Math.sin(t * 2) * 0.06;
    }
    if (ringRef.current) {
      const scale = 1 + (Math.sin(t * 2.5) + 1) * 0.25;
      ringRef.current.scale.set(scale, scale, scale);
      ringRef.current.material.opacity = 0.6 - (scale - 1) * 0.8;
    }
  });

  return (
    <group position={position}>
      {/* Ground Pulse Ring */}
      <mesh ref={ringRef} position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.18, 0.26, 24]} />
        <meshBasicMaterial color="#E58A3A" transparent opacity={0.5} side={THREE.DoubleSide} />
      </mesh>

      {/* Pin Body */}
      <group ref={pinRef}>
        {/* Head Sphere */}
        <mesh position={[0, 0.55, 0]} castShadow>
          <sphereGeometry args={[0.22, 20, 20]} />
          <meshStandardMaterial color="#DC2626" roughness={0.3} metalness={0.1} />
        </mesh>
        {/* Center dot in Pin */}
        <mesh position={[0, 0.55, 0.16]}>
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshStandardMaterial color="#FFFFFF" roughness={0.2} />
        </mesh>
        {/* Tapered Needle */}
        <mesh position={[0, 0.26, 0]} rotation={[Math.PI, 0, 0]} castShadow>
          <coneGeometry args={[0.18, 0.45, 20]} />
          <meshStandardMaterial color="#DC2626" roughness={0.3} />
        </mesh>
      </group>
    </group>
  );
}

// --- 3D Leather Travel Suitcase ---
function VintageSuitcase({ position = [-1.4, 0.28, 1.2], rotation = [0, 0.35, 0] }) {
  return (
    <group position={position} rotation={rotation}>
      {/* Main Suitcase Box */}
      <RoundedBox args={[0.65, 0.44, 0.28]} radius={0.04} smoothness={4} castShadow>
        <meshStandardMaterial color="#8B5A2B" roughness={0.6} />
      </RoundedBox>
      {/* Leather Straps */}
      <mesh position={[-0.16, 0, 0]}>
        <boxGeometry args={[0.04, 0.45, 0.29]} />
        <meshStandardMaterial color="#4A2E16" roughness={0.5} />
      </mesh>
      <mesh position={[0.16, 0, 0]}>
        <boxGeometry args={[0.04, 0.45, 0.29]} />
        <meshStandardMaterial color="#4A2E16" roughness={0.5} />
      </mesh>
      {/* Brass Corner Buckles */}
      <mesh position={[-0.28, 0.18, 0.12]}>
        <boxGeometry args={[0.06, 0.06, 0.04]} />
        <meshStandardMaterial color="#E58A3A" metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[0.28, 0.18, 0.12]}>
        <boxGeometry args={[0.06, 0.06, 0.04]} />
        <meshStandardMaterial color="#E58A3A" metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Top Handle */}
      <mesh position={[0, 0.26, 0]}>
        <torusGeometry args={[0.07, 0.02, 8, 16, Math.PI]} />
        <meshStandardMaterial color="#4A2E16" roughness={0.4} />
      </mesh>
    </group>
  );
}

// --- 3D Brass Compass ---
function BrassCompass({ position = [1.5, 0.1, 1.3], rotation = [-0.1, -0.4, 0] }) {
  const needleRef = useRef();

  useFrame(({ clock }) => {
    if (needleRef.current) {
      needleRef.current.rotation.y = Math.sin(clock.getElapsedTime() * 0.8) * 0.2 + 0.4;
    }
  });

  return (
    <group position={position} rotation={rotation}>
      {/* Compass Outer Ring */}
      <mesh castShadow>
        <cylinderGeometry args={[0.32, 0.32, 0.08, 24]} />
        <meshStandardMaterial color="#D97706" metalness={0.8} roughness={0.3} />
      </mesh>
      {/* Inner Dial Face */}
      <mesh position={[0, 0.042, 0]}>
        <cylinderGeometry args={[0.28, 0.28, 0.01, 24]} />
        <meshStandardMaterial color="#FFFDF7" roughness={0.4} />
      </mesh>
      {/* Compass Needle */}
      <group ref={needleRef} position={[0, 0.055, 0]}>
        {/* North (Red) */}
        <mesh position={[0, 0, 0.1]}>
          <coneGeometry args={[0.04, 0.2, 4]} rotation={[-Math.PI / 2, 0, 0]} />
          <meshStandardMaterial color="#DC2626" />
        </mesh>
        {/* South (Blue / Dark) */}
        <mesh position={[0, 0, -0.1]}>
          <coneGeometry args={[0.04, 0.2, 4]} rotation={[Math.PI / 2, 0, 0]} />
          <meshStandardMaterial color="#1E3A8A" />
        </mesh>
        {/* Center Pivot */}
        <mesh>
          <sphereGeometry args={[0.025, 8, 8]} />
          <meshStandardMaterial color="#D97706" metalness={0.9} />
        </mesh>
      </group>
    </group>
  );
}

// --- Miniature Mountains & Hills ---
function MountainRange() {
  return (
    <group position={[0, 0, -1.8]}>
      {/* Peak 1 (Snow capped) */}
      <mesh position={[-1.6, 0.85, 0]} castShadow>
        <coneGeometry args={[0.95, 1.7, 5]} />
        <meshStandardMaterial color="#475569" roughness={0.8} flatShading />
      </mesh>
      {/* Snow Top 1 */}
      <mesh position={[-1.6, 1.45, 0]}>
        <coneGeometry args={[0.35, 0.55, 5]} />
        <meshStandardMaterial color="#F8FAFC" roughness={0.3} flatShading />
      </mesh>

      {/* Main Peak 2 (Center Majestic) */}
      <mesh position={[-0.4, 1.2, -0.3]} castShadow>
        <coneGeometry args={[1.2, 2.4, 6]} />
        <meshStandardMaterial color="#334155" roughness={0.8} flatShading />
      </mesh>
      {/* Snow Top 2 */}
      <mesh position={[-0.4, 2.05, -0.3]}>
        <coneGeometry args={[0.42, 0.72, 6]} />
        <meshStandardMaterial color="#FFFFFF" roughness={0.3} flatShading />
      </mesh>

      {/* Peak 3 (Forest Green Slope) */}
      <mesh position={[0.9, 0.7, 0.1]} castShadow>
        <coneGeometry args={[0.85, 1.4, 5]} />
        <meshStandardMaterial color="#2F7D32" roughness={0.8} flatShading />
      </mesh>

      {/* Peak 4 (Right Hill) */}
      <mesh position={[1.8, 0.55, -0.2]} castShadow>
        <coneGeometry args={[0.75, 1.1, 5]} />
        <meshStandardMaterial color="#3F6212" roughness={0.8} flatShading />
      </mesh>
    </group>
  );
}

// --- Pine Trees & Palms ---
function Trees() {
  const treePositions = useMemo(() => [
    [-2.2, 0.1, 0.8],
    [-1.9, 0.1, 0.3],
    [-2.5, 0.1, -0.5],
    [1.8, 0.1, 0.2],
    [2.3, 0.1, -0.7],
    [0.7, 0.1, 0.9],
    [-0.8, 0.1, 1.6],
    [2.1, 0.1, 1.1]
  ], []);

  return (
    <group>
      {treePositions.map((pos, idx) => (
        <group key={idx} position={pos}>
          {/* Trunk */}
          <mesh position={[0, 0.12, 0]} castShadow>
            <cylinderGeometry args={[0.03, 0.04, 0.24, 6]} />
            <meshStandardMaterial color="#78350F" roughness={0.9} />
          </mesh>
          {/* Foliage Tier 1 */}
          <mesh position={[0, 0.28, 0]} castShadow>
            <coneGeometry args={[0.18, 0.28, 6]} />
            <meshStandardMaterial color={idx % 2 === 0 ? "#15803D" : "#166534"} roughness={0.8} flatShading />
          </mesh>
          {/* Foliage Tier 2 */}
          <mesh position={[0, 0.42, 0]} castShadow>
            <coneGeometry args={[0.13, 0.22, 6]} />
            <meshStandardMaterial color={idx % 2 === 0 ? "#16A34A" : "#15803D"} roughness={0.8} flatShading />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// --- Terrain Island Base ---
function TerrainBase() {
  return (
    <group position={[0, -0.15, 0]}>
      {/* Main Island Podium (Warm Cream / Soft Sandstone) */}
      <mesh receiveShadow position={[0, 0, 0]}>
        <cylinderGeometry args={[4.4, 4.6, 0.4, 48]} />
        <meshStandardMaterial color="#E8D5B5" roughness={0.8} />
      </mesh>

      {/* Lush Green Top Layer */}
      <mesh receiveShadow position={[0, 0.21, 0]}>
        <cylinderGeometry args={[4.35, 4.38, 0.05, 48]} />
        <meshStandardMaterial color="#2F7D32" roughness={0.9} />
      </mesh>

      {/* Coastal Ocean Bay / River Curve */}
      <mesh receiveShadow position={[-0.8, 0.22, 0.6]} rotation={[-Math.PI / 2, 0, 0.4]}>
        <ringGeometry args={[0.9, 1.8, 32, 1, 0, Math.PI * 0.8]} />
        <meshStandardMaterial color="#2F80A8" roughness={0.2} metalness={0.2} />
      </mesh>

      {/* Circular Railway Track Curve */}
      <mesh position={[0, 0.23, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[3.5, 3.7, 48]} />
        <meshStandardMaterial color="#475569" roughness={0.6} />
      </mesh>
      {/* Rails */}
      <mesh position={[0, 0.24, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[3.55, 3.57, 48]} />
        <meshStandardMaterial color="#94A3B8" metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.24, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[3.63, 3.65, 48]} />
        <meshStandardMaterial color="#94A3B8" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Roadway Ring */}
      <mesh position={[0, 0.225, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[2.15, 2.45, 48]} />
        <meshStandardMaterial color="#334155" roughness={0.7} />
      </mesh>
      {/* Road Center Dashed Line */}
      <mesh position={[0, 0.228, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[2.29, 2.31, 48]} />
        <meshStandardMaterial color="#FDE047" roughness={0.4} />
      </mesh>
    </group>
  );
}

// --- Interactive 3D World Scene Master ---
function TravelSceneContainer() {
  const trainProgress = useRef(0);
  const worldGroup = useRef();

  useFrame(({ mouse }) => {
    if (worldGroup.current) {
      // Subtle cursor parallax tilt
      worldGroup.current.rotation.y = THREE.MathUtils.lerp(
        worldGroup.current.rotation.y,
        mouse.x * 0.25 - 0.2,
        0.05
      );
      worldGroup.current.rotation.x = THREE.MathUtils.lerp(
        worldGroup.current.rotation.x,
        0.45 - mouse.y * 0.15,
        0.05
      );
    }
  });

  return (
    <group ref={worldGroup} position={[0, -0.4, 0]} rotation={[0.45, -0.2, 0]}>
      {/* Terrain base */}
      <TerrainBase />

      {/* Mountain range backdrop */}
      <MountainRange />

      {/* Trees & Vegetation */}
      <Trees />

      {/* Indian Express Train running on circular track */}
      <IndianTrain progressRef={trainProgress} />

      {/* Travel bus on road */}
      <TravelBus />

      {/* Airplane cruising above */}
      <CruiseAirplane />

      {/* 3D Realistic Travel Props */}
      <LocationPin3D position={[0.2, 0.25, 0.4]} />
      <LocationPin3D position={[-1.2, 0.25, -0.6]} />
      <VintageSuitcase position={[-1.3, 0.35, 1.4]} rotation={[0, 0.4, 0]} />
      <BrassCompass position={[1.4, 0.25, 1.3]} rotation={[-0.1, -0.3, 0]} />
    </group>
  );
}

export default function Travel3DHeroScene() {
  const [hasWebGL, setHasWebGL] = useState(true);

  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) setHasWebGL(false);
    } catch {
      setHasWebGL(false);
    }
  }, []);

  if (!hasWebGL) {
    return (
      <div className="w-full h-full min-h-[420px] rounded-2xl bg-[#F7F5EF] dark:bg-[#172722] border border-[#E3DED2] dark:border-[#273E36] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-[#14532D]/10 dark:bg-white/10 flex items-center justify-center text-[#14532D] dark:text-[#EEF2ED] mb-3">
          🚆
        </div>
        <h3 className="font-bold text-lg text-[#14532D] dark:text-white">Interactive 3D Travel World</h3>
        <p className="text-xs text-[#64748B] max-w-sm mt-1">
          Explore multimodal routes across India including trains, flights, and road transit.
        </p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[460px] sm:h-[520px] lg:h-[580px] rounded-2xl overflow-hidden select-none bg-gradient-to-b from-[#FFFDF7]/60 via-[#F7F5EF]/40 to-[#E8D5B5]/30 dark:from-[#172722]/80 dark:to-[#101B17] border border-[#E3DED2] dark:border-[#273E36]">
      {/* Floating Info Badges */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-white/90 dark:bg-[#172722]/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-[#E3DED2] dark:border-[#273E36] shadow-sm text-xs font-semibold text-[#14532D] dark:text-[#EEF2ED]">
        <span className="w-2 h-2 rounded-full bg-[#2F7D32] animate-pulse" />
        <span>Live 3D Travel Engine</span>
      </div>

      <div className="absolute bottom-4 right-4 z-10 hidden sm:flex items-center gap-2 bg-white/90 dark:bg-[#172722]/90 backdrop-blur-md px-3.5 py-2 rounded-xl border border-[#E3DED2] dark:border-[#273E36] shadow-sm text-xs text-[#1F2933] dark:text-[#F7F5EF]">
        <div className="flex items-center gap-1.5 font-medium">
          <span className="text-[#E58A3A] font-bold">10,000+</span> Indian Routes Visualized
        </div>
      </div>

      {/* R3F Canvas */}
      <Canvas
        camera={{ position: [0, 4.5, 7.5], fov: 42 }}
        shadows
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        style={{ width: '100%', height: '100%' }}
      >
        {/* Soft Natural Daylight & Sun Angle */}
        <ambientLight intensity={0.7} color="#F7F5EF" />
        <directionalLight
          position={[6, 9, 4]}
          intensity={1.5}
          color="#FFF7E6"
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
          shadow-camera-near={0.5}
          shadow-camera-far={25}
          shadow-camera-left={-6}
          shadow-camera-right={6}
          shadow-camera-top={6}
          shadow-camera-bottom={-6}
        />
        <directionalLight position={[-4, 3, -4]} intensity={0.4} color="#C4DCF0" />
        <hemisphereLight skyColor="#EAF2EC" groundColor="#E8D5B5" intensity={0.5} />

        {/* 3D Scene */}
        <TravelSceneContainer />

        {/* User Orbit Controls with restricted bounds */}
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          maxPolarAngle={Math.PI / 2.2}
          minPolarAngle={Math.PI / 4}
          rotateSpeed={0.5}
        />
      </Canvas>
    </div>
  );
}
