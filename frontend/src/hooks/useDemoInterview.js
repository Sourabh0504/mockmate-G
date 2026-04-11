/**
 * useDemoInterview.js — Simulated WebSocket hook for Demo Mode.
 * Mimics the exact interface of `useInterviewWS.js` but drives the interview
 * entirely through local static data from `demoSession.js`.
 *
 * Uses browser speechSynthesis API for real TTS (free, no backend needed).
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { demoInterviewFlow } from '../data/demoSession';
import { useAuth } from '../context/AuthContext';

// Pick a good English voice from the browser's available voices
function pickVoice(preferredName) {
    const voices = window.speechSynthesis?.getVoices() || [];
    
    // 1. Try to find an exact or fuzzy match for the user's preferred Edge TTS voice
    if (preferredName) {
        const exactMatch = voices.find(v => v.name.includes(preferredName) || preferredName.includes(v.name));
        if (exactMatch) return exactMatch;
        
        const shortName = preferredName.split('-')[2]?.replace(/MultilingualNeural|Neural|Expressive/gi, '');
        if (shortName) {
            const fuzzyMatch = voices.find(v => v.name.includes(shortName));
            if (fuzzyMatch) return fuzzyMatch;
        }
    }

    // 2. Prefer a natural/premium English voice
    const preferred = voices.find(
        v => v.lang.startsWith('en') && /natural|neural|premium/i.test(v.name)
    );
    if (preferred) return preferred;
    
    // 3. Fall back to any English voice
    return voices.find(v => v.lang.startsWith('en')) || voices[0] || null;
}

export default function useDemoInterview(sessionId) {
    const isDemo = sessionId === 'demo-session';
    const { user } = useAuth();
    
    const [state, setState] = useState('connecting');
    const [question, setQuestion] = useState('');
    const [questionIndex, setQuestionIndex] = useState(0);
    const [totalQuestions] = useState(demoInterviewFlow.length - 1);
    const [countdown, setCountdown] = useState(0);
    const [elapsed, setElapsed] = useState(0);
    const [aiSpeaking, setAiSpeaking] = useState(false);
    const [pace] = useState('good');
    const [connected, setConnected] = useState(false);
    const [error, setError] = useState(null);
    const [endReason, setEndReason] = useState(null);
    const [endText, setEndText] = useState('');

    const countdownRef = useRef(null);
    const elapsedRef = useRef(null);
    const flowTimerRef = useRef(null);
    const voiceRef = useRef(null);
    const hasSynthesis = typeof window !== 'undefined' && !!window.speechSynthesis;

    // Load voices (they may load asynchronously)
    useEffect(() => {
        if (!hasSynthesis) return;
        const preferredVoice = user?.preferred_voice || null;
        voiceRef.current = pickVoice(preferredVoice);
        const onVoicesChanged = () => { voiceRef.current = pickVoice(preferredVoice); };
        window.speechSynthesis.addEventListener('voiceschanged', onVoicesChanged);
        return () => window.speechSynthesis.removeEventListener('voiceschanged', onVoicesChanged);
    }, [hasSynthesis, user?.preferred_voice]);

    // Stop timers gracefully
    const stopTimers = useCallback(() => {
        clearInterval(countdownRef.current);
        clearInterval(elapsedRef.current);
    }, []);

    const startElapsed = useCallback(() => {
        clearInterval(elapsedRef.current);
        setElapsed(0);
        elapsedRef.current = setInterval(() => {
            setElapsed(prev => prev + 1);
        }, 1000);
    }, []);

    // ── Browser TTS Helper ───────────────────────────────────────────────────

    const speak = useCallback((text, onEnd) => {
        if (hasSynthesis) {
            window.speechSynthesis.cancel(); // Clear any queued speech
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 1.0;
            utterance.pitch = 1.0;
            if (voiceRef.current) utterance.voice = voiceRef.current;
            utterance.onend = () => { if (onEnd) onEnd(); };
            utterance.onerror = () => { if (onEnd) onEnd(); };
            window.speechSynthesis.speak(utterance);
        } else {
            // Fallback: simulate with timeout if browser doesn't support speechSynthesis
            const speakTime = Math.min(text.length * 50, 5000);
            flowTimerRef.current = setTimeout(() => { if (onEnd) onEnd(); }, speakTime);
        }
    }, [hasSynthesis]);

    // ── Simulation Engine ────────────────────────────────────────────────────
    
    const triggerTurnComplete = useCallback(() => {
        setAiSpeaking(false);
        setState('waiting');
        setCountdown(10);
        
        countdownRef.current = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(countdownRef.current);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    }, []);

    const playFlowStep = useCallback((index) => {
        if (index >= demoInterviewFlow.length) return;
        
        const step = demoInterviewFlow[index];
        setAiSpeaking(true);
        setState('greeting');
        setQuestion(step.text);
        
        if (step.type === 'end') {
            setState('transitioning');
            setEndText(step.text);
            
            speak(step.text, () => {
                setState('ended');
                setEndReason('completed');
                setAiSpeaking(false);
            });
            return;
        }

        // Speak the question/greeting using browser TTS
        speak(step.text, () => {
            triggerTurnComplete();
        });
    }, [triggerTurnComplete, speak]);

    // Bootstrap
    useEffect(() => {
        if (!isDemo) return;

        // Simulate connection delay
        const connectTimeout = setTimeout(() => {
            setConnected(true);
            playFlowStep(0);
        }, 1500);

        return () => clearTimeout(connectTimeout);
    }, [isDemo, playFlowStep]);

    // Cleanup — cancel any active speech
    useEffect(() => {
        return () => {
            stopTimers();
            clearTimeout(flowTimerRef.current);
            if (hasSynthesis) window.speechSynthesis.cancel();
        };
    }, [stopTimers, hasSynthesis]);

    // ── Stubbed Send Methods ─────────────────────────────────────────────────

    const send = useCallback(() => {}, []);
    
    const notifySpeaking = useCallback(() => {
        if (!isDemo) return;
        setState('listening');
        stopTimers();
        startElapsed();
    }, [isDemo, stopTimers, startElapsed]);

    const sendText = useCallback(() => {}, []);
    
    const endInterview = useCallback(() => {
        if (!isDemo) return;
        if (hasSynthesis) window.speechSynthesis.cancel();
        setState('ended');
        setEndReason('manual');
        stopTimers();
    }, [isDemo, stopTimers, hasSynthesis]);
    
    const requestRepeat = useCallback(() => {}, []);
    const sendTtsDone = useCallback(() => {}, []);

    return {
        state,
        question,
        questionIndex,
        totalQuestions,
        countdown,
        elapsed,
        aiSpeaking,
        pace,
        connected,
        error,
        endReason,
        endText,
        send,
        notifySpeaking,
        sendText,
        endInterview,
        requestRepeat,
        sendTtsDone,
        onTtsAudioRef: { current: null },
        onAudioDataRef: { current: null },
        isTtsBusyRef: { current: false },  // Demo never blocks STT
    };
}

