/**
 * useInterviewWS.js — WebSocket hook for live interview communication.
 *
 * Manages the WebSocket connection to the backend interview server,
 * handles all incoming messages, and exposes a clean API for the
 * InterviewPage component.
 *
 * Voice pipeline:
 *   TTS: Backend generates Edge TTS MP3 → sends as tts_audio message → frontend plays
 *   STT: Browser Web Speech API → frontend sends speech_text messages → backend processes
 */

import { useState, useEffect, useRef, useCallback } from 'react';

const WS_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:8000')
    .replace(/^http/, 'ws');

export default function useInterviewWS(sessionId) {
    const [state, setState] = useState('connecting');
    const [question, setQuestion] = useState('');
    const [questionIndex, setQuestionIndex] = useState(0);
    const [totalQuestions, setTotalQuestions] = useState(0);
    const [countdown, setCountdown] = useState(10);
    const [elapsed, setElapsed] = useState(0);
    const [aiSpeaking, setAiSpeaking] = useState(false);
    const [pace, setPace] = useState('good');
    const [connected, setConnected] = useState(false);
    const [error, setError] = useState(null);
    const [endReason, setEndReason] = useState(null);
    const [endText, setEndText] = useState('');

    const wsRef = useRef(null);
    const countdownRef = useRef(null);
    const elapsedRef = useRef(null);
    const stateRef = useRef('connecting');
    const onTtsAudioRef = useRef(null);  // Callback for MP3 TTS audio playback
    const reconnectAttemptsRef = useRef(0);

    // Keep stateRef in sync
    useEffect(() => {
        stateRef.current = state;
    }, [state]);

    // ── Timer helpers ────────────────────────────────────────────────────────

    const startCountdown = useCallback((seconds) => {
        clearInterval(countdownRef.current);
        setCountdown(seconds);
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

    const startElapsed = useCallback(() => {
        clearInterval(elapsedRef.current);
        setElapsed(0);
        elapsedRef.current = setInterval(() => {
            setElapsed(prev => prev + 1);
        }, 1000);
    }, []);

    const stopTimers = useCallback(() => {
        clearInterval(countdownRef.current);
        clearInterval(elapsedRef.current);
    }, []);

    // ── Message handler ──────────────────────────────────────────────────────

    const handleMessage = useCallback((event) => {
        let msg;
        try {
            msg = JSON.parse(event.data);
        } catch {
            console.error('[WS] Failed to parse message:', event.data);
            return;
        }

        switch (msg.type) {
            case 'greeting':
                setState('greeting');
                setAiSpeaking(true);
                setQuestion(msg.text);
                setQuestionIndex(msg.question_index || 0);
                setTotalQuestions(msg.total_questions || 0);
                break;

            case 'question':
                setState('greeting');
                setAiSpeaking(true);
                setQuestion(msg.text);
                setQuestionIndex(msg.question_index || 0);
                if (msg.total_questions) setTotalQuestions(msg.total_questions);
                break;

            case 'tts_audio':
                // Edge TTS MP3 audio — forward to playback hook
                setAiSpeaking(true);
                if (msg.data && onTtsAudioRef.current) {
                    onTtsAudioRef.current(msg.data);
                }
                break;

            case 'start_timer':
                setAiSpeaking(false);
                if (msg.timer_type === 'initial') {
                    setState('waiting');
                    startCountdown(msg.seconds || 10);
                }
                break;

            case 'listening':
                setState('listening');
                stopTimers();
                startElapsed();
                break;

            case 'answer_finalized':
                setState('transitioning');
                stopTimers();
                break;

            case 'transition':
                setState('transitioning');
                setAiSpeaking(true);
                break;

            case 'pace_feedback':
                setPace(msg.pace || 'good');
                break;



            case 'turn_complete':
                setAiSpeaking(false);
                break;

            case 'user_speaking_detected':
                setState('listening');
                stopTimers();
                startElapsed();
                break;

            case 'interview_ended':
                setState('ended');
                setEndReason(msg.reason);
                setEndText(msg.text || '');
                stopTimers();
                setAiSpeaking(false);
                break;

            case 'session_info':
                break;

            case 'error':
                setError(msg.message);
                console.error('[WS] Server error:', msg.message);
                break;

            default:
                console.warn('[WS] Unknown message type:', msg.type);
        }
    }, [startCountdown, startElapsed, stopTimers]);

    // ── WebSocket connection ─────────────────────────────────────────────────

    const reconnectTimerRef = useRef(null);
    const MAX_RECONNECT_ATTEMPTS = 36;

    const connectWS = useCallback(() => {
        const token = localStorage.getItem('mm_token');
        if (!token) {
            setError('No auth token found');
            return;
        }

        const wsUrl = `${WS_BASE}/ws/interview/${sessionId}?token=${token}`;
        console.log('[WS] Connecting to:', wsUrl);

        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
            console.log('[WS] Connected');
            setConnected(true);
            setError(null);
            reconnectAttemptsRef.current = 0;
        };

        ws.onmessage = handleMessage;

        ws.onerror = (event) => {
            console.error('[WS] Error:', event);
        };

        ws.onclose = (event) => {
            console.log(`[WS] Closed: code=${event.code}, reason=${event.reason}`);
            setConnected(false);

            if (stateRef.current !== 'ended') {
                setError(`Connection lost (code: ${event.code})`);

                if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
                    console.log(`[WS] Scheduling reconnect attempt ${reconnectAttemptsRef.current + 1}/${MAX_RECONNECT_ATTEMPTS}`);
                    reconnectTimerRef.current = setTimeout(() => {
                        reconnectAttemptsRef.current += 1;
                        connectWS();
                    }, 5000);
                } else {
                    setError('Connection lost permanently. Redirecting to dashboard...');
                }
            }
        };
    }, [sessionId, handleMessage]);

    useEffect(() => {
        if (!sessionId) return;
        connectWS();

        return () => {
            stopTimers();
            if (reconnectTimerRef.current) {
                clearTimeout(reconnectTimerRef.current);
                reconnectTimerRef.current = null;
            }
            if (wsRef.current?.readyState === WebSocket.OPEN || wsRef.current?.readyState === WebSocket.CONNECTING) {
                wsRef.current.close();
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sessionId]);

    // ── Send helpers ─────────────────────────────────────────────────────────

    const send = useCallback((msg) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify(msg));
        } else {
            console.warn('[WS] Cannot send — not connected');
        }
    }, []);

    const notifySpeaking = useCallback(() => {
        send({ type: 'user_speaking' });
    }, [send]);

    const sendText = useCallback((text) => {
        send({ type: 'speech_text', text });
    }, [send]);

    const endInterview = useCallback(() => {
        send({ type: 'end_interview' });
    }, [send]);

    const requestRepeat = useCallback(() => {
        send({ type: 'repeat_request' });
    }, [send]);



    const sendTtsDone = useCallback(() => {
        send({ type: 'tts_done' });
    }, [send]);

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
        onTtsAudioRef,
    };
}
