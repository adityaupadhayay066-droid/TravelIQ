import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Mic, MicOff, Volume2, X, RotateCcw, AlertTriangle, MessageSquareCode } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { getBackendURL } from '../utils/api';
import useScrollShrink from '../hooks/useScrollShrink';

const API_URL = getBackendURL();

export default function AIVoiceAssistant() {
    const navigate = useNavigate();
    const scrollScale = useScrollShrink(0.65, 350);
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
        <div 
            ref={containerRef} 
            className="fixed bottom-36 lg:bottom-24 right-4 lg:right-6 z-50 pointer-events-auto" 
            style={{ 
                fontFamily: "var(--font-sans)", 
                transform: `scale(${isOpen ? 1 : scrollScale})`, 
                transformOrigin: 'bottom right', 
                transition: 'transform 0.3s cubic-bezier(0.25, 1, 0.5, 1)' 
            }}
        >
            {/* Label + Mic row */}
            <div className="flex items-center justify-end gap-2.5">
                {/* Square-bordered label tag */}
                {!isOpen && (
                    <button
                        onClick={togglePanel}
                        className="hidden sm:flex items-center gap-2 px-3 py-2 cursor-pointer transition-all duration-200 hover:opacity-100"
                        style={{
                            background: 'var(--color-surface)',
                            border: '1px solid var(--color-border)',
                            borderRadius: '3px',
                            boxShadow: '0 2px 8px rgba(23, 63, 58, 0.08)',
                            opacity: 0.6,
                        }}
                        title="Open TravelIQ Voice Assistant"
                    >
                        <span
                            className="shrink-0"
                            style={{
                                width: 6,
                                height: 6,
                                background: '#E58A3A',
                                borderRadius: '1px',
                                animation: 'pulse 2s ease-in-out infinite',
                            }}
                        />
                        <span
                            className="whitespace-nowrap"
                            style={{
                                fontSize: '11px',
                                fontWeight: 600,
                                fontFamily: 'var(--font-heading)',
                                color: 'var(--color-text)',
                                letterSpacing: '0.02em',
                            }}
                        >
                            TravelIQ Voice Assistant
                        </span>
                    </button>
                )}

                {/* Mic FAB — matches chatbot's green circle style */}
                <button
                    onClick={togglePanel}
                    aria-label="TravelIQ Voice Assistant"
                    title="TravelIQ Voice Assistant"
                    className={`w-14 h-14 rounded-full flex items-center justify-center cursor-pointer transition-transform duration-200 hover:scale-105 active:scale-95 shrink-0 ${
                        isOpen
                            ? 'text-[#14532D] dark:text-[#EEF2ED]'
                            : 'text-white'
                    }`}
                    style={{
                        background: isOpen ? 'var(--color-surface)' : '#14532D',
                        border: isOpen ? '1px solid var(--color-border)' : '2px solid rgba(255,255,255,0.2)',
                        boxShadow: '0 4px 16px rgba(20, 83, 45, 0.25)',
                    }}
                >
                    {isOpen ? <X className="h-6 w-6" /> : (
                        <div className="relative">
                            <Mic className="h-6 w-6" />
                            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full" style={{ background: '#E58A3A' }} />
                        </div>
                    )}
                </button>
            </div>

            {/* Voice assistant dialog panel */}
            {isOpen && (
                <div
                    className="absolute bottom-16 right-0 w-[calc(100vw-1.5rem)] sm:w-96 max-w-sm overflow-hidden flex flex-col"
                    style={{
                        background: 'var(--color-surface)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-lg)',
                        boxShadow: '0 8px 30px rgba(23, 63, 58, 0.1)',
                    }}
                >
                    
                    {/* Header */}
                    <div
                        className="px-4 py-3 flex items-center justify-between"
                        style={{
                            background: 'var(--color-cream)',
                            borderBottom: '1px solid var(--color-border)',
                        }}
                    >
                        <div className="flex items-center gap-2">
                            <div
                                className="w-7 h-7 rounded-lg flex items-center justify-center"
                                style={{ background: '#14532D' }}
                            >
                                <Volume2 className="h-3.5 w-3.5 text-white" />
                            </div>
                            <div>
                                <span
                                    className="block"
                                    style={{
                                        fontSize: '12px',
                                        fontWeight: 700,
                                        fontFamily: 'var(--font-heading)',
                                        color: 'var(--color-text)',
                                    }}
                                >
                                    Voice Assistant
                                </span>
                                <span
                                    className="flex items-center gap-1"
                                    style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}
                                >
                                    <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#2F7D32' }} />
                                    TravelIQ AI
                                </span>
                            </div>
                        </div>
                        {/* Language Selection */}
                        <div
                            className="flex items-center gap-0.5 p-0.5"
                            style={{
                                background: 'var(--color-surface)',
                                border: '1px solid var(--color-border)',
                                borderRadius: 'var(--radius-sm)',
                            }}
                        >
                            <button
                                onClick={() => setLanguage('en')}
                                className="px-2 py-0.5 text-[10px] font-bold transition-colors duration-150"
                                style={{
                                    borderRadius: '4px',
                                    background: language === 'en' ? '#14532D' : 'transparent',
                                    color: language === 'en' ? '#fff' : 'var(--color-text-muted)',
                                }}
                            >
                                English
                            </button>
                            <button
                                onClick={() => setLanguage('hi')}
                                className="px-2 py-0.5 text-[10px] font-bold transition-colors duration-150"
                                style={{
                                    borderRadius: '4px',
                                    background: language === 'hi' ? '#14532D' : 'transparent',
                                    color: language === 'hi' ? '#fff' : 'var(--color-text-muted)',
                                }}
                            >
                                हिंदी
                            </button>
                        </div>
                    </div>

                    {/* Speech State Body */}
                    <div className="p-6 flex flex-col items-center justify-center min-h-[200px] gap-4">
                        
                        {/* Waveforms and State Animations */}
                        <div className="h-24 flex items-center justify-center">
                            {status === 'listening' && (
                                <div className="flex items-end gap-1 h-12">
                                    {[1, 2, 3, 4, 5, 4, 3, 2, 1].map((h, i) => (
                                        <div
                                            key={i}
                                            style={{ animationDelay: `${i * 0.1}s` }}
                                            className="w-1.5 rounded-full animate-[bounce_0.8s_infinite]"
                                            style={{ animationDelay: `${i * 0.1}s`, background: '#E58A3A' }}
                                        />
                                    ))}
                                </div>
                            )}

                            {status === 'processing' && (
                                <div className="relative h-12 w-12 flex items-center justify-center">
                                    <div
                                        className="absolute inset-0 rounded-full animate-spin"
                                        style={{
                                            border: '2px solid var(--color-border)',
                                            borderTopColor: '#E58A3A',
                                        }}
                                    />
                                </div>
                            )}

                            {status === 'speaking' && (
                                <div className="flex items-center gap-1.5 h-8">
                                    {[1.5, 3, 1, 4, 2, 4.5, 1].map((scale, i) => (
                                        <div
                                            key={i}
                                            style={{
                                                height: '100%',
                                                transform: `scaleY(${scale / 5})`,
                                                animation: 'pulse 1s ease-in-out infinite',
                                                background: '#14532D',
                                                width: 4,
                                                borderRadius: 2,
                                            }}
                                        />
                                    ))}
                                </div>
                            )}

                            {status === 'idle' && (
                                <button
                                    onClick={startListening}
                                    className="h-16 w-16 rounded-full flex items-center justify-center transition-colors duration-200 cursor-pointer"
                                    style={{
                                        background: 'var(--color-soft)',
                                        border: '1px solid var(--color-border)',
                                        color: 'var(--color-text)',
                                    }}
                                >
                                    <Mic className="h-7 w-7" />
                                </button>
                            )}

                            {status === 'error' && (
                                <div
                                    className="h-14 w-14 rounded-full flex items-center justify-center"
                                    style={{
                                        background: '#FDF0ED',
                                        border: '1px solid #F2C2C2',
                                        color: 'var(--color-danger)',
                                    }}
                                >
                                    <AlertTriangle className="h-6 w-6" />
                                </div>
                            )}
                        </div>

                        {/* Text Indicators */}
                        <div className="text-center w-full max-w-[280px]">
                            <p
                                className="uppercase tracking-wider"
                                style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)' }}
                            >
                                {status === 'listening' ? 'Listening...' :
                                 status === 'processing' ? 'Processing command...' :
                                 status === 'speaking' ? 'Speaking...' :
                                 status === 'error' ? 'Something went wrong' : 'Ready'}
                            </p>
                            
                            {transcript && (
                                <p className="text-sm italic font-medium mt-2 break-words" style={{ color: 'var(--color-text)' }}>
                                    "{transcript}"
                                </p>
                            )}

                            {spokenText && status !== 'listening' && (
                                <p className="text-xs mt-2 font-semibold break-words" style={{ color: '#14532D' }}>
                                    {spokenText}
                                </p>
                            )}

                            {errorMsg && (
                                <p className="text-xs mt-2 break-words" style={{ color: 'var(--color-danger)' }}>
                                    {errorMsg}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Bottom controls */}
                    <div
                        className="px-4 py-3 flex flex-col gap-2"
                        style={{
                            background: 'var(--color-cream)',
                            borderTop: '1px solid var(--color-border)',
                        }}
                    >
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
                                className="flex-1 px-3 py-1.5 text-xs outline-none transition-colors duration-150"
                                style={{
                                    background: 'var(--color-surface)',
                                    border: '1px solid var(--color-border)',
                                    borderRadius: 'var(--radius-sm)',
                                    color: 'var(--color-text)',
                                    fontSize: '12px',
                                }}
                            />
                            <button
                                onClick={() => {
                                    handleVoiceSubmit(typedFallback);
                                    setTypedFallback('');
                                }}
                                className="px-3 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors duration-150"
                                style={{
                                    background: '#14532D',
                                    color: '#fff',
                                    borderRadius: 'var(--radius-sm)',
                                    border: 'none',
                                }}
                            >
                                <MessageSquareCode className="h-3.5 w-3.5" />
                                Send
                            </button>
                        </div>

                        <div className="flex items-center justify-between mt-0.5" style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>
                            {status === 'listening' ? (
                                <button onClick={stopListening} className="font-bold hover:underline cursor-pointer" style={{ color: 'var(--color-danger)' }}>
                                    Stop Listening
                                </button>
                            ) : (
                                <button onClick={startListening} className="font-bold hover:underline cursor-pointer" style={{ color: '#14532D' }}>
                                    Start Listening
                                </button>
                            )}
                            <span style={{ color: 'var(--color-text-muted)' }}>Say: "Show trains from Delhi to Patna"</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
