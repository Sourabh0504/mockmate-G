/**
 * useSpeechRecognition.js — Browser-based speech-to-text using Web Speech API.
 *
 * Uses the browser's built-in SpeechRecognition (Chrome) for free, real-time
 * speech transcription. No API costs, no audio streaming to backend.
 *
 * Usage:
 *   const { isListening, start, stop, supported } = useSpeechRecognition({
 *       onSpeechStart: () => notifySpeaking(),
 *       onResult: (text, isFinal) => sendText(text),
 *   });
 */

import { useState, useRef, useCallback, useEffect } from 'react';

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

export default function useSpeechRecognition({ onSpeechStart, onResult }) {
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef(null);
    const hasFiredSpeechStart = useRef(false);
    const onSpeechStartRef = useRef(onSpeechStart);
    const onResultRef = useRef(onResult);
    const shouldBeListeningRef = useRef(false);
    const lastProcessedIndexRef = useRef(0); // Track which results we've already sent

    // Keep refs current
    onSpeechStartRef.current = onSpeechStart;
    onResultRef.current = onResult;

    const supported = !!SpeechRecognition;

    const start = useCallback(() => {
        if (!SpeechRecognition) {
            console.warn('[STT] Web Speech API not supported in this browser');
            return;
        }

        shouldBeListeningRef.current = true;

        // Don't restart if already listening
        if (recognitionRef.current) return;

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
            setIsListening(true);
            hasFiredSpeechStart.current = false;
            lastProcessedIndexRef.current = 0;
        };

        recognition.onresult = (event) => {
            // Notify that user started speaking (first result only)
            if (!hasFiredSpeechStart.current) {
                hasFiredSpeechStart.current = true;
                onSpeechStartRef.current?.();
            }

            // Only process new results (avoid duplicates)
            for (let i = lastProcessedIndexRef.current; i < event.results.length; i++) {
                const result = event.results[i];
                const text = result[0].transcript;
                const isFinal = result.isFinal;

                if (text.trim()) {
                    onResultRef.current?.(text.trim(), isFinal);
                }

                // Once finalized, advance the index past this result
                if (isFinal) {
                    lastProcessedIndexRef.current = i + 1;
                }
            }
        };

        recognition.onerror = (event) => {
            // 'no-speech' and 'aborted' are normal — restart silently
            if (event.error === 'no-speech' || event.error === 'aborted') {
                return;
            }
            console.error('[STT] Recognition error:', event.error);
        };

        recognition.onend = () => {
            setIsListening(false);
            recognitionRef.current = null;

            // Auto-restart if we should still be listening
            // (recognition auto-stops after silence — we need to keep it going)
            if (shouldBeListeningRef.current) {
                setTimeout(() => {
                    if (shouldBeListeningRef.current) {
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
    }, []);

    const stop = useCallback(() => {
        shouldBeListeningRef.current = false;
        hasFiredSpeechStart.current = false;

        if (recognitionRef.current) {
            try {
                recognitionRef.current.stop();
            } catch {
                // Already stopped
            }
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
