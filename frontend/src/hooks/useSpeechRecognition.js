/**
 * useSpeechRecognition.js — Browser-based speech-to-text using Web Speech API.
 *
 * Sends FINAL results only to the server (Q1:Option A).
 * Supports canStartRef: when canStartRef.current === true, recognition will not
 * start (or auto-restart after silence). This prevents the mic from picking up
 * TTS audio playing through speakers (echo feedback fix).
 *
 * Usage:
 *   const { isListening, start, stop, supported } = useSpeechRecognition({
 *       onSpeechStart: () => notifySpeaking(),
 *       onResult: (text, isFinal) => { if (isFinal) sendText(text); },
 *       canStartRef: isTtsBusyRef,   // Ref<boolean> — blocks start when true
 *   });
 */

import { useState, useRef, useCallback, useEffect } from 'react';

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

export default function useSpeechRecognition({ onSpeechStart, onResult, canStartRef }) {
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef(null);
    const hasFiredSpeechStart = useRef(false);
    const onSpeechStartRef = useRef(onSpeechStart);
    const onResultRef = useRef(onResult);
    const shouldBeListeningRef = useRef(false);
    const lastProcessedIndexRef = useRef(0);

    // Keep refs current
    onSpeechStartRef.current = onSpeechStart;
    onResultRef.current = onResult;

    const supported = !!SpeechRecognition;

    const start = useCallback(() => {
        if (!SpeechRecognition) {
            console.warn('[STT] Web Speech API not supported in this browser');
            return;
        }

        // Block start if TTS audio is currently in-flight (echo feedback prevention)
        if (canStartRef?.current === true) {
            return;
        }

        shouldBeListeningRef.current = true;

        // Don't restart if already listening
        if (recognitionRef.current) return;

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;  // Still need interim to detect speech start
        recognition.lang = 'en-US';
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
            setIsListening(true);
            hasFiredSpeechStart.current = false;
            // NOTE: lastProcessedIndexRef is intentionally NOT reset here.
            // Each new SpeechRecognition instance starts its own result index from 0,
            // so we reset it when starting fresh (in stop() → start() cycle).
            lastProcessedIndexRef.current = 0;
        };

        recognition.onresult = (event) => {
            // Notify that user started speaking (first result only per activation)
            if (!hasFiredSpeechStart.current) {
                hasFiredSpeechStart.current = true;
                onSpeechStartRef.current?.();
            }

            // Process only new results since last processed index
            for (let i = lastProcessedIndexRef.current; i < event.results.length; i++) {
                const result = event.results[i];
                const text = result[0].transcript;
                const isFinal = result.isFinal;

                if (text.trim()) {
                    onResultRef.current?.(text.trim(), isFinal);
                }

                // Advance index only on final results
                // (interim results at same index are processed once, then overwritten)
                if (isFinal) {
                    lastProcessedIndexRef.current = i + 1;
                }
            }
        };

        recognition.onerror = (event) => {
            // 'no-speech' and 'aborted' are normal auto-stop events — restart silently
            if (event.error === 'no-speech' || event.error === 'aborted') return;
            console.error('[STT] Recognition error:', event.error);
        };

        recognition.onend = () => {
            setIsListening(false);
            recognitionRef.current = null;

            // Auto-restart if we should still be listening (recognition stops after silence)
            // Also check canStartRef — don't restart during TTS playback
            if (shouldBeListeningRef.current) {
                setTimeout(() => {
                    if (shouldBeListeningRef.current && canStartRef?.current !== true) {
                        start();
                    }
                }, 100);
            }
        };

        recognitionRef.current = recognition;

        try {
            recognition.start();
        } catch (err) {
            console.error('[STT] Failed to start:', err);
            recognitionRef.current = null;
        }
    }, [canStartRef]);  // canStartRef is a stable ref object — read imperatively

    const stop = useCallback(() => {
        shouldBeListeningRef.current = false;
        hasFiredSpeechStart.current = false;
        lastProcessedIndexRef.current = 0;  // Reset index on explicit stop

        if (recognitionRef.current) {
            try { recognitionRef.current.stop(); } catch { /* already stopped */ }
            recognitionRef.current = null;
        }
        setIsListening(false);
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            shouldBeListeningRef.current = false;
            if (recognitionRef.current) {
                try { recognitionRef.current.stop(); } catch {}
                recognitionRef.current = null;
            }
        };
    }, []);

    return { isListening, start, stop, supported };
}
