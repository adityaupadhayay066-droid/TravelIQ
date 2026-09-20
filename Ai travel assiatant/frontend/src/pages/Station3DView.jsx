import React, { useState, useEffect, useRef, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import axios from 'axios';
import { MapPin, Navigation, Footprints, Clock, Compass, AlertCircle, RefreshCw, Layers } from 'lucide-react';

import { getBackendURL } from '../utils/api';

// API Base URL
const API_URL = getBackendURL();

// ─── 3D Interactive Amenity Box Component ───
function AmenityMesh({ item, isSelected, onClick }) {
    const [hovered, setHovered] = useState(false);
    const meshRef = useRef();

    // Subtle scale pulsing if hovered or selected
    useFrame((state) => {
        if (meshRef.current) {
            if (isSelected) {
                const s = 1.2 + Math.sin(state.clock.getElapsedTime() * 8) * 0.15;
                meshRef.current.scale.set(s, s, s);
            } else if (hovered) {
                meshRef.current.scale.set(1.2, 1.2, 1.2);
            } else {
                meshRef.current.scale.set(1, 1, 1);
            }
        }
    });

    // Color mapping based on amenity type (using warmer/brand tones)
    const getColor = (type) => {
        switch (type) {
            case 'entrance': return '#4F7D62'; // Success Green
            case 'restroom': return '#66736F'; // Muted
            case 'food_court': return '#D96C4F'; // Accent Terracotta
            case 'water': return '#4F7D62'; 
            case 'help': return '#E5B85C'; // Secondary Gold
            case 'ticket': return '#173F3A'; // Primary Deep Forest
            case 'waiting': return '#C75D43'; 
            case 'medical': return '#B94A48'; // Danger Red
            default: return '#E3DED2'; // Border Warm Light
        }
    };

    return (
        <group position={[item.x, item.y + 1, item.z]}>
            <mesh
                ref={meshRef}
                onClick={(e) => {
                    e.stopPropagation();
                    onClick(item);
                }}
                onPointerOver={(e) => {
                    e.stopPropagation();
                    setHovered(true);
                    document.body.style.cursor = 'pointer';
                }}
                onPointerOut={(e) => {
                    e.stopPropagation();
                    setHovered(false);
                    document.body.style.cursor = 'default';
                }}
            >
                <boxGeometry args={[2.5, 2.5, 2.5]} />
                <meshStandardMaterial 
                    color={getColor(item.type)} 
                    emissive={getColor(item.type)}
                    emissiveIntensity={isSelected ? 0.3 : (hovered ? 0.1 : 0.0)}
                    roughness={0.6}
                    metalness={0.1}
                />
            </mesh>
            
            {/* Hover Tooltip or floating label */}
            {(hovered || isSelected) && (
                <Html distanceFactor={15} center position={[0, 2, 0]}>
                    <div className="bg-[#FFFFFF] dark:bg-[#1B2C28] text-[#263238] dark:text-[#F7F5EF] text-[11px] font-medium px-2 py-1 rounded-md shadow-sm border border-[#E3DED2] dark:border-[#2A403A] whitespace-nowrap select-none pointer-events-none transition-all">
                        {item.name}
                    </div>
                </Html>
            )}
        </group>
    );
}

// ─── 3D Walking Path Component ───
function WalkingPath({ points, simProgress }) {
    if (!points || points.length < 2) return null;

    const threePoints = points.map(p => new THREE.Vector3(p[0], p[1] + 0.3, p[2]));
    
    // Generate curved line for smooth 3D appearance
    const curve = new THREE.CatmullRomCurve3(threePoints);
    const tubeGeometry = new THREE.TubeGeometry(curve, 100, 0.4, 8, false);

    // Calculate simulation coordinates
    const simPosition = curve.getPointAt(simProgress);

    return (
        <group>
            {/* Guide path tube */}
            <mesh geometry={tubeGeometry}>
                <meshStandardMaterial 
                    color="#E5B85C" 
                    emissive="#E5B85C"
                    emissiveIntensity={0.5}
                    transparent 
                    opacity={0.8} 
                />
            </mesh>

            {/* Simulating traveler sphere */}
            {simProgress > 0 && simProgress < 1 && (
                <mesh position={simPosition}>
                    <sphereGeometry args={[0.9, 16, 16]} />
                    <meshStandardMaterial 
                        color="#D96C4F" 
                        emissive="#D96C4F" 
                        emissiveIntensity={0.8} 
                    />
                    <pointLight color="#D96C4F" intensity={2} distance={10} />
                </mesh>
            )}
        </group>
    );
}

// ─── Main 3D Station Scene Component ───
function StationScene({ modelData, selectedFrom, selectedTo, onAmenityClick, pathCoordinates, simProgress }) {
    const { platforms, amenities } = modelData;

    return (
        <>
            <ambientLight intensity={0.8} />
            <directionalLight position={[20, 40, 20]} intensity={1.5} castShadow />
            <pointLight position={[-20, 10, -20]} intensity={0.6} />

            {/* Render Platforms */}
            {platforms.map((p, index) => (
                <group key={`plat_${index}`} position={[p.x, p.y + p.height / 2, p.z]}>
                    <mesh receiveShadow castShadow>
                        <boxGeometry args={[p.width, p.height, p.length]} />
                        <meshStandardMaterial color="#E3DED2" roughness={0.9} />
                    </mesh>
                    
                    {/* Platform Numbers Floating Labels */}
                    <Html distanceFactor={25} center position={[0, p.height + 1, -p.length / 3]}>
                        <div className="bg-[#FFFFFF] dark:bg-[#1B2C28] text-[#173F3A] dark:text-[#EEF2ED] font-bold px-1.5 py-0.5 rounded-md text-[10px] border border-[#E3DED2] dark:border-[#2A403A] shadow-sm select-none">
                            P{p.number}
                        </div>
                    </Html>
                    <Html distanceFactor={25} center position={[0, p.height + 1, p.length / 3]}>
                        <div className="bg-[#FFFFFF] dark:bg-[#1B2C28] text-[#173F3A] dark:text-[#EEF2ED] font-bold px-1.5 py-0.5 rounded-md text-[10px] border border-[#E3DED2] dark:border-[#2A403A] shadow-sm select-none">
                            P{p.number}
                        </div>
                    </Html>
                </group>
            ))}

            {/* Render Tracks between Platforms */}
            {platforms.map((p, index) => {
                if (index === platforms.length - 1) return null;
                const nextPlatform = platforms[index + 1];
                const trackX = (p.x + nextPlatform.x) / 2;
                return (
                    <group key={`track_${index}`} position={[trackX, 0.1, 0]}>
                        {/* Left Rail */}
                        <mesh position={[-1.2, 0, 0]}>
                            <boxGeometry args={[0.2, 0.2, 120]} />
                            <meshStandardMaterial color="#66736F" metalness={0.6} roughness={0.4} />
                        </mesh>
                        {/* Right Rail */}
                        <mesh position={[1.2, 0, 0]}>
                            <boxGeometry args={[0.2, 0.2, 120]} />
                            <meshStandardMaterial color="#66736F" metalness={0.6} roughness={0.4} />
                        </mesh>
                        {/* Wooden ties (ties run every 2 meters) */}
                        {Array.from({ length: 40 }).map((_, j) => (
                            <mesh key={`tie_${index}_${j}`} position={[0, -0.05, -58 + j * 3]}>
                                <boxGeometry args={[3, 0.1, 0.4]} />
                                <meshStandardMaterial color="#263238" roughness={0.9} />
                            </mesh>
                        ))}
                    </group>
                );
            })}

            {/* Render Elevators/FOB bridges */}
            {/* FOB North bridge */}
            <mesh position={[0, 8, -30]}>
                <boxGeometry args={[platforms.length * 16 + 24, 0.5, 5]} />
                <meshStandardMaterial color="#E3DED2" opacity={0.9} transparent />
            </mesh>
            {/* FOB South bridge */}
            <mesh position={[0, 8, 30]}>
                <boxGeometry args={[platforms.length * 16 + 24, 0.5, 5]} />
                <meshStandardMaterial color="#E3DED2" opacity={0.9} transparent />
            </mesh>

            {/* Render Amenities */}
            {amenities.map((item) => (
                <AmenityMesh
                    key={item.id}
                    item={item}
                    isSelected={selectedFrom === item.id || selectedTo === item.id}
                    onClick={onAmenityClick}
                />
            ))}

            {/* Render 3D Calculated Path */}
            <WalkingPath points={pathCoordinates} simProgress={simProgress} />

            {/* Orbit Controls */}
            <OrbitControls 
                enableDamping 
                dampingFactor={0.05}
                maxPolarAngle={Math.PI / 2.1} // Avoid going below ground
                minDistance={15}
                maxDistance={150}
            />
        </>
    );
}

// ─── Main Station3DView React Component Page ───
export default function Station3DView() {
    const [stationCode, setStationCode] = useState('NDLS');
    const [loading, setLoading] = useState(false);
    const [modelData, setModelData] = useState(null);
    const [error, setError] = useState(null);

    // Navigation endpoints
    const [fromNode, setFromNode] = useState('');
    const [toNode, setToNode] = useState('');
    const [pathResult, setPathResult] = useState(null);

    // Simulation states
    const [simulating, setSimulating] = useState(false);
    const [simProgress, setSimProgress] = useState(0);
    const simIntervalRef = useRef(null);

    // Load station 3D config
    useEffect(() => {
        const fetchStationModel = async () => {
            setLoading(true);
            setError(null);
            setPathResult(null);
            setFromNode('');
            setToNode('');
            setSimProgress(0);
            setSimulating(false);
            
            try {
                const res = await axios.get(`${API_URL}/station/3d?station_code=${stationCode}`);
                setModelData(res.data.model_data);
            } catch (err) {
                console.error('Failed to load station 3D model:', err);
                setError('Could not retrieve 3D station data. Please check connection to backend.');
            } finally {
                setLoading(false);
            }
        };

        fetchStationModel();
    }, [stationCode]);

    // Interactive clicking of 3D box
    const handleAmenityClick = (item) => {
        if (!fromNode) {
            setFromNode(item.id);
        } else if (fromNode && !toNode && fromNode !== item.id) {
            setToNode(item.id);
        } else {
            // reset and pick start
            setFromNode(item.id);
            setToNode('');
            setPathResult(null);
        }
    };

    // Calculate inside routing path
    const handleFindPath = async () => {
        if (!fromNode || !toNode) return;
        setSimulating(false);
        setSimProgress(0);
        
        try {
            const res = await axios.post(`${API_URL}/station/navigation`, {
                station_code: stationCode,
                from: fromNode,
                to: toNode
            });
            setPathResult(res.data);
        } catch (err) {
            console.error('Pathfinding failed:', err);
            setError(err.response?.data?.message || 'Failed to compute walking path.');
        }
    };

    // Trigger walk simulation
    const toggleSimulation = () => {
        if (simulating) {
            clearInterval(simIntervalRef.current);
            setSimulating(false);
        } else {
            setSimulating(true);
            setSimProgress(0);
            
            const step = 0.005; // speed parameter
            simIntervalRef.current = setInterval(() => {
                setSimProgress(prev => {
                    if (prev >= 1) {
                        clearInterval(simIntervalRef.current);
                        setSimulating(false);
                        return 1;
                    }
                    return prev + step;
                });
            }, 30);
        }
    };

    useEffect(() => {
        return () => clearInterval(simIntervalRef.current);
    }, []);

    const resetSelection = () => {
        setFromNode('');
        setToNode('');
        setPathResult(null);
        setSimProgress(0);
        setSimulating(false);
        clearInterval(simIntervalRef.current);
    };

    return (
        <div className="flex flex-col xl:flex-row min-h-[calc(100vh-72px)] xl:h-[calc(100vh-72px)] w-full bg-[#F7F5EF] dark:bg-[#12201D] text-[#263238] dark:text-[#F7F5EF] overflow-y-auto xl:overflow-hidden font-sans">
            {/* Left 3D Viewport Panel */}
            <div className="relative w-full h-[380px] sm:h-[480px] xl:h-full flex-shrink-0 xl:flex-1 border-b xl:border-b-0 xl:border-r border-[#E3DED2] dark:border-[#2A403A]">
                {loading && (
                    <div className="absolute inset-0 bg-[#F7F5EF]/80 dark:bg-[#12201D]/80 flex items-center justify-center z-20">
                        <div className="text-center">
                            <RefreshCw className="h-10 w-10 text-[#173F3A] dark:text-[#EEF2ED] animate-spin mx-auto mb-3" />
                            <p className="text-[#173F3A] dark:text-[#EEF2ED] font-medium">Procedurally constructing 3D Station map...</p>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="absolute inset-x-6 top-6 bg-[#FFFFFF] dark:bg-[#1B2C28] border border-[#B94A48] rounded-xl p-4 z-20 flex items-start gap-3 shadow-sm">
                        <AlertCircle className="h-5 w-5 text-[#B94A48] flex-shrink-0 mt-0.5" />
                        <div>
                            <h4 className="font-bold text-[#B94A48]">System Error</h4>
                            <p className="text-[#66736F] dark:text-[#A3B0AB] text-sm mt-1">{error}</p>
                            <button onClick={() => setError(null)} className="text-xs bg-[#F7F5EF] dark:bg-[#12201D] text-[#263238] dark:text-[#F7F5EF] px-3 py-1 rounded-lg mt-2 border border-[#E3DED2] dark:border-[#2A403A] transition hover:bg-[#EEF2ED] dark:hover:bg-[#213530]">
                                Dismiss
                            </button>
                        </div>
                    </div>
                )}

                {/* Floating Instructions HUD Overlay */}
                <div className="hidden sm:flex absolute top-4 left-4 z-10 bg-[#FFFFFF]/90 dark:bg-[#1B2C28]/90 backdrop-blur border border-[#E3DED2] dark:border-[#2A403A] px-3 py-2 rounded-xl text-xs flex-col gap-1.5 shadow-sm select-none pointer-events-none">
                    <span className="font-bold text-[#173F3A] dark:text-[#EEF2ED] uppercase tracking-wider text-[10px]">Controls</span>
                    <span className="flex items-center gap-1.5 text-[#66736F] dark:text-[#A3B0AB]"><Compass className="h-3.5 w-3.5 text-[#173F3A] dark:text-[#EEF2ED]" /> Left-Click + Drag: Rotate</span>
                    <span className="flex items-center gap-1.5 text-[#66736F] dark:text-[#A3B0AB]"><Layers className="h-3.5 w-3.5 text-[#173F3A] dark:text-[#EEF2ED]" /> Right-Click + Drag: Pan</span>
                    <span className="flex items-center gap-1.5 text-[#66736F] dark:text-[#A3B0AB]"><Navigation className="h-3.5 w-3.5 text-[#173F3A] dark:text-[#EEF2ED]" /> Scroll / Pinch: Zoom</span>
                    <span className="flex items-center gap-1.5 text-[#66736F] dark:text-[#A3B0AB]"><MapPin className="h-3.5 w-3.5 text-[#173F3A] dark:text-[#EEF2ED]" /> Click meshes to select route</span>
                </div>

                {/* 3D Canvas R3F */}
                {!loading && modelData && (
                    <Canvas 
                        shadows 
                        camera={{ position: [0, 45, 75], fov: 45 }}
                        className="w-full h-full cursor-grab active:cursor-grabbing"
                    >
                        <Suspense fallback={null}>
                            {/* In a real scenario you might conditionally toggle this based on dark mode, but a neutral warm background works well for 3D visibility */}
                            <color attach="background" args={['#F7F5EF']} />
                            <fog attach="fog" args={['#F7F5EF', 60, 160]} />
                            <StationScene
                                modelData={modelData}
                                selectedFrom={fromNode}
                                selectedTo={toNode}
                                onAmenityClick={handleAmenityClick}
                                pathCoordinates={pathResult?.path}
                                simProgress={simProgress}
                            />
                        </Suspense>
                    </Canvas>
                )}
            </div>

            {/* Right Navigation & Controller Sidebar */}
            <div className="w-full xl:w-96 flex-1 xl:h-full bg-[#FFFFFF] dark:bg-[#1B2C28] flex flex-col overflow-y-auto border-l border-[#E3DED2] dark:border-[#2A403A]">
                {/* Station Selection */}
                <div className="p-5 border-b border-[#E3DED2] dark:border-[#2A403A]">
                    <h2 className="text-lg font-bold text-[#173F3A] dark:text-[#EEF2ED] flex items-center gap-2">
                        <Navigation className="h-5 w-5 text-[#173F3A] dark:text-[#EEF2ED]" />
                        Smart Station Navigator
                    </h2>
                    <p className="text-xs text-[#66736F] dark:text-[#A3B0AB] mt-1">Indoor 3D station pathfinding and routing</p>

                    <div className="mt-4 flex gap-2">
                        {['NDLS', 'BBS'].map((code) => (
                            <button
                                key={code}
                                onClick={() => setStationCode(code)}
                                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition ${
                                    stationCode === code
                                        ? 'bg-[#173F3A] text-[#FFFFFF] border-[#173F3A] dark:bg-[#EEF2ED] dark:text-[#12201D] dark:border-[#EEF2ED]'
                                        : 'bg-[#F7F5EF] text-[#66736F] border-[#E3DED2] hover:bg-[#EEF2ED] hover:text-[#263238] dark:bg-[#12201D] dark:text-[#A3B0AB] dark:border-[#2A403A] dark:hover:bg-[#213530] dark:hover:text-[#F7F5EF]'
                                }`}
                            >
                                {code === 'NDLS' ? 'New Delhi (NDLS)' : 'Bhubaneswar (BBS)'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Routing Form */}
                {modelData && (
                    <div className="p-5 border-b border-[#E3DED2] dark:border-[#2A403A] flex flex-col gap-4">
                        {/* Start Node */}
                        <div>
                            <label className="text-[11px] font-bold text-[#66736F] dark:text-[#A3B0AB] uppercase tracking-wider block mb-1.5">
                                Starting Location
                            </label>
                            <select
                                value={fromNode}
                                onChange={(e) => {
                                    setFromNode(e.target.value);
                                    setPathResult(null);
                                }}
                                className="w-full bg-[#F7F5EF] dark:bg-[#12201D] border border-[#E3DED2] dark:border-[#2A403A] rounded-lg px-3 py-2 text-xs text-[#263238] dark:text-[#F7F5EF] focus:outline-none focus:border-[#173F3A] dark:focus:border-[#EEF2ED] transition"
                            >
                                <option value="">Select location or click in 3D...</option>
                                {modelData.amenities.map((item) => (
                                    <option key={`from_${item.id}`} value={item.id}>
                                        {item.name} ({item.type.replace('_', ' ')})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* End Node */}
                        <div>
                            <label className="text-[11px] font-bold text-[#66736F] dark:text-[#A3B0AB] uppercase tracking-wider block mb-1.5">
                                Destination
                            </label>
                            <select
                                value={toNode}
                                onChange={(e) => {
                                    setToNode(e.target.value);
                                    setPathResult(null);
                                }}
                                className="w-full bg-[#F7F5EF] dark:bg-[#12201D] border border-[#E3DED2] dark:border-[#2A403A] rounded-lg px-3 py-2 text-xs text-[#263238] dark:text-[#F7F5EF] focus:outline-none focus:border-[#173F3A] dark:focus:border-[#EEF2ED] transition"
                            >
                                <option value="">Select location or click in 3D...</option>
                                {modelData.amenities.map((item) => (
                                    <option key={`to_${item.id}`} value={item.id}>
                                        {item.name} ({item.type.replace('_', ' ')})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 mt-1">
                            {(fromNode || toNode) && (
                                <button
                                    onClick={resetSelection}
                                    className="px-3 bg-[#F7F5EF] dark:bg-[#12201D] hover:bg-[#EEF2ED] dark:hover:bg-[#213530] border border-[#E3DED2] dark:border-[#2A403A] rounded-lg text-xs font-semibold text-[#66736F] dark:text-[#A3B0AB] transition"
                                >
                                    Reset
                                </button>
                            )}
                            <button
                                onClick={handleFindPath}
                                disabled={!fromNode || !toNode}
                                className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                                    fromNode && toNode
                                        ? 'bg-[#173F3A] dark:bg-[#EEF2ED] hover:bg-[#0F332F] dark:hover:bg-[#FFFFFF] text-[#FFFFFF] dark:text-[#12201D]'
                                        : 'bg-[#F7F5EF] dark:bg-[#12201D] text-[#66736F] dark:text-[#A3B0AB] cursor-not-allowed border border-[#E3DED2] dark:border-[#2A403A]'
                                }`}
                            >
                                <Navigation className="h-3.5 w-3.5" />
                                Get Walk Directions
                            </button>
                        </div>
                    </div>
                )}

                {/* Pathfinding Result and Step-by-Step UI */}
                {pathResult && (
                    <div className="p-5 flex-1 flex flex-col min-h-0">
                        {/* Summary Card */}
                        <div className="bg-[#F7F5EF] dark:bg-[#12201D] border border-[#E3DED2] dark:border-[#2A403A] rounded-xl p-4 flex flex-col gap-3 shadow-sm">
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-[#66736F] dark:text-[#A3B0AB] font-medium">Est. Distance & Time</span>
                                <span className="bg-[#EEF2ED] dark:bg-[#213530] text-[#173F3A] dark:text-[#EEF2ED] border border-[#E3DED2] dark:border-[#2A403A] text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                                    Fastest Path
                                </span>
                            </div>

                            <div className="flex items-center gap-6">
                                <div className="flex items-center gap-2">
                                    <div className="h-8 w-8 rounded-lg bg-[#EEF2ED] dark:bg-[#213530] flex items-center justify-center text-[#173F3A] dark:text-[#EEF2ED]">
                                        <Footprints className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-[#66736F] dark:text-[#A3B0AB] font-semibold uppercase">Distance</p>
                                        <p className="text-sm font-bold text-[#263238] dark:text-[#F7F5EF]">{pathResult.total_distance_meters} meters</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="h-8 w-8 rounded-lg bg-[#EEF2ED] dark:bg-[#213530] flex items-center justify-center text-[#173F3A] dark:text-[#EEF2ED]">
                                        <Clock className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-[#66736F] dark:text-[#A3B0AB] font-semibold uppercase">Walk Time</p>
                                        <p className="text-sm font-bold text-[#263238] dark:text-[#F7F5EF]">~ {pathResult.estimated_walk_time_mins} Min</p>
                                    </div>
                                </div>
                            </div>

                            {/* Simulation toggle */}
                            <button
                                onClick={toggleSimulation}
                                className={`w-full py-2 rounded-lg text-xs font-bold border transition flex items-center justify-center gap-1.5 ${
                                    simulating
                                        ? 'bg-[#FFFFFF] dark:bg-[#1B2C28] text-[#B94A48] border-[#B94A48] hover:bg-[#F7F5EF] dark:hover:bg-[#12201D]'
                                        : 'bg-[#173F3A] dark:bg-[#EEF2ED] text-[#FFFFFF] dark:text-[#12201D] hover:bg-[#0F332F] dark:hover:bg-[#FFFFFF]'
                                }`}
                            >
                                <Footprints className={`h-3.5 w-3.5 ${simulating ? 'animate-bounce' : ''}`} />
                                {simulating ? 'Pause Walk Simulation' : 'Start Walk Simulation'}
                            </button>
                        </div>

                        {/* Turn-by-Turn Instructions List */}
                        <div className="mt-4 flex-1 flex flex-col min-h-0">
                            <h3 className="text-xs font-bold text-[#66736F] dark:text-[#A3B0AB] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                <Compass className="h-4 w-4 text-[#173F3A] dark:text-[#EEF2ED]" />
                                Inside Route Details
                            </h3>

                            <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-3 max-h-[300px]">
                                {pathResult.instructions.map((inst, index) => {
                                    const isFirst = index === 0;
                                    const isLast = index === pathResult.instructions.length - 1;
                                    
                                    // Highlight current step in simulation
                                    const stepPct = index / (pathResult.instructions.length - 1);
                                    const isCurrentStep = simulating && Math.abs(simProgress - stepPct) < 0.2;

                                    return (
                                        <div 
                                            key={`inst_${index}`} 
                                            className={`flex gap-3 text-xs p-2 rounded-lg transition-all duration-300 ${
                                                isCurrentStep ? 'bg-[#EEF2ED] dark:bg-[#213530] border-l-2 border-[#173F3A] dark:border-[#EEF2ED] pl-3' : ''
                                            }`}
                                        >
                                            <div className="flex flex-col items-center">
                                                <div className={`h-5 w-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                                                    isFirst ? 'bg-[#173F3A] dark:bg-[#EEF2ED] text-[#FFFFFF] dark:text-[#12201D]' : (isLast ? 'bg-[#D96C4F] text-[#FFFFFF]' : 'bg-[#E3DED2] dark:bg-[#2A403A] text-[#263238] dark:text-[#F7F5EF]')
                                                }`}>
                                                    {index + 1}
                                                </div>
                                                {!isLast && <div className="w-0.5 bg-[#E3DED2] dark:bg-[#2A403A] flex-1 my-1" />}
                                            </div>
                                            <div className="flex-1 self-center">
                                                <p className={isLast || isFirst ? 'font-semibold text-[#263238] dark:text-[#F7F5EF]' : 'text-[#66736F] dark:text-[#A3B0AB]'}>{inst}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}

                {/* Empty State Instructions */}
                {!pathResult && (
                    <div className="p-8 text-center flex-1 flex flex-col justify-center items-center gap-3">
                        <MapPin className="h-12 w-12 text-[#E3DED2] dark:text-[#2A403A] stroke-1" />
                        <div>
                            <p className="text-sm font-medium text-[#263238] dark:text-[#F7F5EF]">No Route Selected</p>
                            <p className="text-xs text-[#66736F] dark:text-[#A3B0AB] mt-1 max-w-[200px] mx-auto">
                                Select starting and ending points from the lists above or click directly on 3D elements inside the viewer.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
