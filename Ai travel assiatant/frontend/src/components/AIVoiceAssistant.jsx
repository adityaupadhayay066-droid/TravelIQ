import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Mic, MicOff, Volume2, X, RotateCcw, AlertTriangle, MessageSquareCode } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { getBackendURL } from '../utils/api';

const API_URL = getBackendURL();

export default function AIVoiceAssistant() {
    const navigate = useNavigate();
    const { user, openAuthModal } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [language, setLanguage] = useState('en'); // 'en' or 'hi'
    const [status, setStatus] = useState('idle'); // 'idle', 'listening', 'processing', 'speaking', 'error'
    const [transcript, setTranscript] = useState('');
    const [spokenText, setSpokenText] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [typedFallback, setTypedFallback] = useState('');

    const recognitionRef = useRef(null);
    const synthesisUtteranceRef = useRef(null);
    const containerRef = useRef(null);

    // Auto close when clicking outside or pressing Escape
    useEffect(() => {
        if (!isOpen) return;

        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                stopListening();
                setIsOpen(false);
            }
        };

        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                stopListening();
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

    // Initialize Web Speech API Recognition
    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            const rec = new SpeechRecognition();
            rec.continuous = false;
            rec.interimResults = false;
            rec.maxAlternatives = 1;

            rec.onstart = () => {
                setStatus('listening');
                setErrorMsg('');
                setTranscript('');
            };

            rec.onresult = async (event) => {
                const speechResult = event.results[0][0].transcript;
                setTranscript(speechResult);
                await handleVoiceSubmit(speechResult);
            };

            rec.onerror = (e) => {
                console.error('Speech recognition error:', e.error);
                if (e.error === 'no-speech') {
                    setStatus('idle');
                } else {
                    setStatus('error');
                    setErrorMsg(e.error === 'not-allowed' ? 'Microphone access denied.' : `Speech error: ${e.error}`);
                }
            };

            rec.onend = () => {
                // If it ended and we didn't advance to processing or speaking, return to idle
                setStatus(prev => (prev === 'listening' ? 'idle' : prev));
            };

            recognitionRef.current = rec;
        } else {
            console.warn('Web Speech API is not supported in this browser.');
        }
    }, [language]);

    // Handle voice submit
    const handleVoiceSubmit = async (textToSend) => {
        if (!textToSend.trim()) return;
        setStatus('processing');
        setErrorMsg('');

        try {
            const res = await axios.post(`${API_URL}/voice/respond`, {
                text: textToSend,
                language: language
            });

            const { action, spoken_reply } = res.data;
            setSpokenText(spoken_reply);

            // Trigger Text-to-Speech (TTS)
            speakBack(spoken_reply, () => {
                // Execute redirection/action after speech completes
                executeCommandAction(action);
            });

        } catch (err) {
            console.error('Failed to process voice response:', err);
            setStatus('error');
            setErrorMsg('Connection error. Could not reach AI voice engine.');
            speakBack(language === 'hi' ? 'माफ़ कीजिये, सर्वर से संपर्क नहीं हो पाया।' : 'Sorry, could not connect to server.');
        }
    };

    // Text to Speech synthesis helper
    const speakBack = (text, callback = () => {}) => {
        if (!window.speechSynthesis) {
            setStatus('idle');
            callback();
            return;
        }

        // Cancel current speaking
        window.speechSynthesis.cancel();
        setStatus('speaking');

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = language === 'hi' ? 'hi-IN' : 'en-US';

        // Select suitable local Hindi/English voice if available
        const voices = window.speechSynthesis.getVoices();
        const suitableVoice = voices.find(v => v.lang.startsWith(language === 'hi' ? 'hi' : 'en'));
        if (suitableVoice) {
            utterance.voice = suitableVoice;
        }

        utterance.onend = () => {
            setStatus('idle');
            callback();
        };

        utterance.onerror = (e) => {
            console.error('Speech synthesis error:', e);
            setStatus('idle');
            callback();
        };

        synthesisUtteranceRef.current = utterance;
        window.speechSynthesis.speak(utterance);
    };

    // Parse and trigger client-side actions
    const executeCommandAction = (action) => {
        if (!action || !action.route) return;

        // Perform redirection, passing search state variables in Router location state
        navigate(action.route, { state: action });
        setIsOpen(false);
    };

    // Start listening
    const startListening = () => {
        if (window.speechSynthesis) window.speechSynthesis.cancel();
        if (recognitionRef.current) {
            recognitionRef.current.lang = language === 'hi' ? 'hi-IN' : 'en-US';
            try {
                recognitionRef.current.start();
            } catch (err) {
                recognitionRef.current.stop();
                setTimeout(() => recognitionRef.current.start(), 200);
            }
        } else {
            setStatus('error');
            setErrorMsg('Speech recognition API is unavailable in this browser. Please type your query below.');
        }
    };

    // Stop listening / cancel
    const stopListening = () => {
        if (recognitionRef.current) recognitionRef.current.stop();
        if (window.speechSynthesis) window.speechSynthesis.cancel();
        setStatus('idle');
    };

    const togglePanel = () => {
        if (!user) {
            toast.error('Please sign in or create an account to use the AI Voice Assistant.');
            openAuthModal('login');
            return;
        }

        if (isOpen) {
            stopListening();
            setIsOpen(false);
        } else {
            setIsOpen(true);
            setStatus('idle');
            setTranscript('');
            setSpokenText('');
            setErrorMsg('');
        }
    };

    return (
        <div ref={containerRef} className="fixed bottom-36 lg:bottom-22 right-4 lg:right-6 z-50 font-sans">
            {/* Floating Microphone Action Button */}
            <button
                onClick={togglePanel}
                className={`h-12 w-12 rounded-full flex items-center justify-center cursor-pointer shadow-[0_4px_16px_rgba(23,63,58,0.2)] border transition duration-300 transform hover:scale-105 active:scale-95 ${
                    isOpen
                        ? 'bg-[#FFFFFF] dark:bg-[#1B2C28] border-[#E3DED2] dark:border-[#2A403A] text-[#263238] dark:text-[#F7F5EF] hover:bg-[#F7F5EF] dark:hover:bg-[#12201D]'
                        : 'bg-[#D96C4F] border-[#D96C4F] text-white hover:bg-[#C75D43]'
                }`}
            >
                {isOpen ? <X className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </button>

            {/* Assistant Dialog overlay panel */}
            {isOpen && (
                <div className="absolute bottom-16 right-0 w-[calc(100vw-1.5rem)] sm:w-96 max-w-sm bg-[#FFFFFF] dark:bg-[#1B2C28] border border-[#E3DED2] dark:border-[#2A403A] rounded-xl shadow-[0_4px_16px_rgba(23,63,58,0.06)] overflow-hidden flex flex-col transition-all duration-300">
                    
                    {/* Header */}
                    <div className="px-4 py-3 bg-[#F7F5EF] dark:bg-[#12201D] border-b border-[#E3DED2] dark:border-[#2A403A] flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Volume2 className="h-4 w-4 text-[#173F3A] dark:text-[#EEF2ED]" />
                            <span className="text-xs font-bold uppercase tracking-wider text-[#173F3A] dark:text-[#EEF2ED] font-manrope">TravelIQ AI</span>
                        </div>
                        {/* Language Selection */}
                        <div className="flex items-center gap-1 bg-[#FFFFFF] dark:bg-[#1B2C28] p-1 rounded-lg border border-[#E3DED2] dark:border-[#2A403A]">
                            <button
                                onClick={() => setLanguage('en')}
                                className={`px-2 py-0.5 rounded text-[10px] font-bold transition ${
                                    language === 'en' ? 'bg-[#173F3A] text-white dark:bg-[#EEF2ED] dark:text-[#173F3A]' : 'text-[#66736F] dark:text-[#A3B0AB]'
                                }`}
                            >
                                English
                            </button>
                            <button
                                onClick={() => setLanguage('hi')}
                                className={`px-2 py-0.5 rounded text-[10px] font-bold transition ${
                                    language === 'hi' ? 'bg-[#173F3A] text-white dark:bg-[#EEF2ED] dark:text-[#173F3A]' : 'text-[#66736F] dark:text-[#A3B0AB]'
                                }`}
                            >
                                हिंदी
                            </button>
                        </div>
                    </div>

                    {/* Speech State Body */}
                    <div className="p-6 flex flex-col items-center justify-center min-h-[200px] gap-4">
                        
                        {/* 1. Waveforms and State Animations */}
                        <div className="h-24 flex items-center justify-center">
                            {status === 'listening' && (
                                /* Bouncing wave bars */
                                <div className="flex items-end gap-1 h-12">
                                    {[1, 2, 3, 4, 5, 4, 3, 2, 1].map((h, i) => (
                                        <div
                                            key={i}
                                            style={{ animationDelay: `${i * 0.1}s` }}
                                            className="w-1.5 bg-[#D96C4F] rounded-full animate-[bounce_0.8s_infinite]"
                                        />
                                    ))}
                                </div>
                            )}

                            {status === 'processing' && (
                                /* Spinning loading halo */
                                <div className="relative h-12 w-12 flex items-center justify-center">
                                    <div className="absolute inset-0 rounded-full border-2 border-[#E3DED2] dark:border-[#2A403A] border-t-[#D96C4F] animate-spin" />
                                </div>
                            )}

                            {status === 'speaking' && (
                                /* Active voice soundwave rows */
                                <div className="flex items-center gap-1.5 h-8">
                                    {[1.5, 3, 1, 4, 2, 4.5, 1].map((scale, i) => (
                                        <div
                                            key={i}
                                            style={{
                                                height: '100%',
                                                transform: `scaleY(${scale / 5})`,
                                                animation: 'pulse 1s ease-in-out infinite'
                                            }}
                                            className="w-1 bg-[#173F3A] dark:bg-[#EEF2ED] rounded"
                                        />
                                    ))}
                                </div>
                            )}

                            {status === 'idle' && (
                                /* Inactive microphone circle */
                                <button
                                    onClick={startListening}
                                    className="h-16 w-16 rounded-full bg-[#EEF2ED] dark:bg-[#213530] border border-[#E3DED2] dark:border-[#2A403A] flex items-center justify-center text-[#263238] dark:text-[#F7F5EF] hover:bg-[#F7F5EF] dark:hover:bg-[#12201D] transition"
                                >
                                    <Mic className="h-7 w-7" />
                                </button>
                            )}

                            {status === 'error' && (
                                /* Error warning indicator */
                                <div className="h-14 w-14 rounded-full bg-[#FDF0ED] dark:bg-[#2C1818] border border-[#F2C2C2] dark:border-[#4A2828] flex items-center justify-center text-[#B94A48]">
                                    <AlertTriangle className="h-6 w-6" />
                                </div>
                            )}
                        </div>

                        {/* 2. Text Indicators */}
                        <div className="text-center w-full max-w-[280px]">
                            <p className="text-[11px] font-bold uppercase tracking-wider text-[#66736F] dark:text-[#A3B0AB]">
                                {status === 'listening' ? 'Listening...' :
                                 status === 'processing' ? 'Processing command...' :
                                 status === 'speaking' ? 'Speaking...' :
                                 status === 'error' ? 'Something went wrong' : 'Ready'}
                            </p>
                            
                            {/* Transcripts */}
                            {transcript && (
                                <p className="text-[#263238] dark:text-[#F7F5EF] text-sm italic font-medium mt-2 break-words">
                                    "{transcript}"
                                </p>
                            )}

                            {spokenText && status !== 'listening' && (
                                <p className="text-[#173F3A] dark:text-[#EEF2ED] text-xs mt-2 font-semibold break-words">
                                    {spokenText}
                                </p>
                            )}

                            {errorMsg && (
                                <p className="text-[#B94A48] text-xs mt-2 break-words">
                                    {errorMsg}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Bottom controls panel & typed keyboard input fallback */}
                    <div className="px-4 py-3 bg-[#F7F5EF] dark:bg-[#12201D] border-t border-[#E3DED2] dark:border-[#2A403A] flex flex-col gap-2">
                        
                        {/* Interactive keyboard input fallback */}
                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder={language === 'hi' ? 'कमांड लिखें (जैसे: Delhi to Patna)...' : 'Type voice command...'}
                                value={typedFallback}
                                onChange={(e) => setTypedFallback(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        handleVoiceSubmit(typedFallback);
                                        setTypedFallback('');
                                    }
                                }}
                                className="flex-1 bg-[#FFFFFF] dark:bg-[#1B2C28] border border-[#E3DED2] dark:border-[#2A403A] rounded-lg px-3 py-1.5 text-xs text-[#263238] dark:text-[#F7F5EF] placeholder-[#66736F] dark:placeholder-[#A3B0AB] focus:outline-none focus:border-[#173F3A] dark:focus:border-[#EEF2ED] transition"
                            />
                            <button
                                onClick={() => {
                                    handleVoiceSubmit(typedFallback);
                                    setTypedFallback('');
                                }}
                                className="px-3 bg-[#173F3A] hover:bg-[#0F332F] dark:bg-[#EEF2ED] dark:hover:bg-[#FFFFFF] text-white dark:text-[#12201D] rounded-lg text-xs font-bold transition flex items-center gap-1"
                            >
                                <MessageSquareCode className="h-3.5 w-3.5" />
                                Send
                            </button>
                        </div>

                        {/* Interactive Actions help guide */}
                        <div className="text-[10px] text-[#66736F] dark:text-[#A3B0AB] flex items-center justify-between mt-1">
                            {status === 'listening' ? (
                                <button onClick={stopListening} className="text-[#B94A48] font-bold hover:underline">
                                    Stop Listening
                                </button>
                            ) : (
                                <button onClick={startListening} className="text-[#173F3A] dark:text-[#EEF2ED] font-bold hover:underline">
                                    Start Listening
                                </button>
                            )}
                            <span className="text-[#66736F] dark:text-[#A3B0AB]">Say: "Show trains from Delhi to Patna"</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
