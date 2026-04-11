/**
 * useAudioCapture.js — Mic capture hook using AudioWorklet + VAD at 16kHz.
 *
 * Replaces useSpeechRecognition (Web Speech API / Chrome-only) with a
 * cross-browser microphone capture pipeline that streams raw Float32 PCM
 * to the backend for server-side Whisper transcription.
 *
 * Architecture:
 *   getUserMedia(audio, 16kHz) → AudioContext(16kHz) → AudioWorklet(pcm-processor)
 *     → RMS VAD gate
 *       → speech detected: accumulate Float32 chunks every 200ms → sendAudioChunk(base64)
 *       → silence detected: flush remaining chunks → onSpeechEnd()
 *
 * canStartRef (isTtsBusyRef):
 *   When true, audio accumulation and sending stop immediately.
 *   Prevents the mic from feeding audio during AI TTS playback (echo fix).
 *
 * Usage:
 *   const { isCapturing, start, stop } = useAudioCapture({
 *       onSpeechStart: () => notifySpeaking(),
 *       sendAudioChunk: (base64) => send({ type: 'audio_chunk', data: base64 }),
 *       onSpeechEnd: () => send({ type: 'speech_end' }),
 *       canStartRef: isTtsBusyRef,
 *   });
 */

import { useState, useRef, useCallback, useEffect } from 'react';

export default function useAudioCapture({ onSpeechStart, sendAudioChunk, onSpeechEnd, canStartRef }) {
    const [isCapturing, setIsCapturing] = useState(false);

    const audioContextRef  = useRef(null);
    const workletNodeRef   = useRef(null);
    const sourceNodeRef    = useRef(null);
    const silentGainRef    = useRef(null);
    const streamRef        = useRef(null);
    const isSpeakingRef    = useRef(false);
    const pendingChunksRef = useRef([]);   // Float32Arrays accumulated between flush ticks
    const sendIntervalRef  = useRef(null);
    const shouldCaptureRef = useRef(false);

    // Keep callback refs current (stable references into closures)
    const onSpeechStartRef = useRef(onSpeechStart);
    const sendAudioChunkRef = useRef(sendAudioChunk);
    const onSpeechEndRef = useRef(onSpeechEnd);
    onSpeechStartRef.current = onSpeechStart;
    sendAudioChunkRef.current = sendAudioChunk;
    onSpeechEndRef.current = onSpeechEnd;

    // ── Flush accumulated chunks to backend (every 200ms) ──────────────────

    const flushChunks = useCallback(() => {
        if (pendingChunksRef.current.length === 0) return;
        if (!sendAudioChunkRef.current) return;

        // Concatenate all pending Float32 arrays
        const totalLen = pendingChunksRef.current.reduce((n, arr) => n + arr.length, 0);
        const combined = new Float32Array(totalLen);
        let offset = 0;
        for (const chunk of pendingChunksRef.current) {
            combined.set(chunk, offset);
            offset += chunk.length;
        }
        pendingChunksRef.current = [];

        // Encode to base64 for JSON transport
        const bytes = new Uint8Array(combined.buffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
        sendAudioChunkRef.current(btoa(binary));
    }, []);

    // ── AudioWorklet message handler ─────────────────────────────────────────

    const handleWorkletMessage = useCallback((event) => {
        if (!shouldCaptureRef.current) return;
        if (canStartRef?.current === true) {
            // TTS is playing — discard audio and reset speaking state silently
            if (isSpeakingRef.current) {
                isSpeakingRef.current = false;
                pendingChunksRef.current = [];
            }
            return;
        }

        const { type, buffer } = event.data;

        if (type === 'speaking_started') {
            if (!isSpeakingRef.current) {
                isSpeakingRef.current = true;
                onSpeechStartRef.current?.();
            }
        } else if (type === 'audio' && isSpeakingRef.current) {
            pendingChunksRef.current.push(new Float32Array(buffer));
        } else if (type === 'silence_detected' && isSpeakingRef.current) {
            isSpeakingRef.current = false;
            flushChunks();               // Send remaining audio before signalling end
            onSpeechEndRef.current?.();
        }
    }, [canStartRef, flushChunks]);

    // ── start — initialize mic + AudioWorklet (called once per session) ──────

    const start = useCallback(async () => {
        if (shouldCaptureRef.current) return; // Already started
        if (canStartRef?.current === true) return;

        shouldCaptureRef.current = true;

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    channelCount: 1,
                    sampleRate: 16000,
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                },
                video: false,
            });
            streamRef.current = stream;

            const ctx = new AudioContext({ sampleRate: 16000 });
            audioContextRef.current = ctx;

            await ctx.audioWorklet.addModule('/pcm-processor.js');

            const source = ctx.createMediaStreamSource(stream);
            sourceNodeRef.current = source;

            const workletNode = new AudioWorkletNode(ctx, 'pcm-processor');
            workletNodeRef.current = workletNode;
            workletNode.port.onmessage = handleWorkletMessage;

            // Connect through a muted gain node so the worklet actually processes audio
            // (browsers require a connected graph to keep the worklet running)
            const silentGain = ctx.createGain();
            silentGain.gain.value = 0;
            silentGainRef.current = silentGain;

            source.connect(workletNode);
            workletNode.connect(silentGain);
            silentGain.connect(ctx.destination);

            setIsCapturing(true);

            // Flush accumulated chunks to backend every 200ms during speech
            sendIntervalRef.current = setInterval(flushChunks, 200);

        } catch (err) {
            console.error('[AudioCapture] Failed to initialize:', err);
            shouldCaptureRef.current = false;
        }
    }, [canStartRef, handleWorkletMessage, flushChunks]);

    // ── stop — tear down mic and AudioWorklet ────────────────────────────────

    const stop = useCallback(() => {
        shouldCaptureRef.current = false;
        isSpeakingRef.current = false;
        pendingChunksRef.current = [];

        clearInterval(sendIntervalRef.current);
        sendIntervalRef.current = null;

        if (workletNodeRef.current) {
            workletNodeRef.current.port.onmessage = null;
            workletNodeRef.current.disconnect();
            workletNodeRef.current = null;
        }
        if (sourceNodeRef.current) {
            sourceNodeRef.current.disconnect();
            sourceNodeRef.current = null;
        }
        if (silentGainRef.current) {
            silentGainRef.current.disconnect();
            silentGainRef.current = null;
        }
        if (audioContextRef.current) {
            audioContextRef.current.close().catch(() => {});
            audioContextRef.current = null;
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop());
            streamRef.current = null;
        }

        setIsCapturing(false);
    }, []);

    useEffect(() => () => stop(), [stop]);

    return { isCapturing, start, stop };
}
