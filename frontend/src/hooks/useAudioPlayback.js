/**
 * useAudioPlayback.js — Seamless playback of audio from WebSocket.
 *
 * Supports both:
 *   - MP3 base64 chunks (from Edge TTS)
 *   - Raw PCM Int16 24kHz (legacy Gemini Live format)
 *
 * Usage:
 *   const { isPlaying, enqueueMp3, enqueue, clearBuffer } = useAudioPlayback();
 *   // enqueueMp3(base64Mp3String) — play Edge TTS MP3 audio
 *   // enqueue(base64PcmString) — play raw PCM audio (legacy)
 *   // clearBuffer() — stop playback and clear queue (for barge-in)
 */

import { useState, useRef, useCallback, useEffect } from 'react';

const LEGACY_PCM_SAMPLE_RATE = 24000; // Only for legacy Gemini Live PCM path

export default function useAudioPlayback() {
    const [isPlaying, setIsPlaying] = useState(false);

    const audioContextRef = useRef(null);
    const queueRef = useRef([]); // Queue of AudioBuffers
    const isPlayingRef = useRef(false);
    const nextStartTimeRef = useRef(0);
    const onEndedCallbackRef = useRef(null); // Called when all audio finishes

    // Initialize AudioContext lazily (must be after user interaction)
    // Use browser default sample rate (typically 48kHz) for best Edge TTS quality
    const getAudioContext = useCallback(() => {
        if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
            audioContextRef.current = new AudioContext();
        }
        return audioContextRef.current;
    }, []);

    // Play next buffer from queue
    const playNext = useCallback(() => {
        if (queueRef.current.length === 0) {
            isPlayingRef.current = false;
            setIsPlaying(false);
            // Fire the ended callback when all queued audio is done
            if (onEndedCallbackRef.current) {
                onEndedCallbackRef.current();
            }
            return;
        }

        const ctx = getAudioContext();
        if (ctx.state === 'suspended') {
            ctx.resume();
        }

        const buffer = queueRef.current.shift();
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);

        // Schedule for gapless playback
        const now = ctx.currentTime;
        const startTime = Math.max(now, nextStartTimeRef.current);
        source.start(startTime);
        nextStartTimeRef.current = startTime + buffer.duration;

        // When this buffer finishes, play next
        source.onended = () => {
            playNext();
        };
    }, [getAudioContext]);

    // Enqueue MP3 audio (from Edge TTS)
    const enqueueMp3 = useCallback(async (base64Data) => {
        try {
            const ctx = getAudioContext();
            if (ctx.state === 'suspended') {
                await ctx.resume();
            }

            // Decode base64 to ArrayBuffer
            const binaryStr = atob(base64Data);
            const len = binaryStr.length;
            const bytes = new Uint8Array(len);
            for (let i = 0; i < len; i++) {
                bytes[i] = binaryStr.charCodeAt(i);
            }

            // Decode MP3 to AudioBuffer using Web Audio API
            const audioBuffer = await ctx.decodeAudioData(bytes.buffer);
            queueRef.current.push(audioBuffer);

            if (!isPlayingRef.current) {
                isPlayingRef.current = true;
                setIsPlaying(true);
                playNext();
            }
        } catch (err) {
            console.error('[AudioPlayback] Failed to decode MP3:', err);
        }
    }, [getAudioContext, playNext]);

    // Legacy: Enqueue raw PCM Int16 audio (from Gemini Live)
    const enqueue = useCallback((base64Data) => {
        try {
            const ctx = getAudioContext();

            const binaryStr = atob(base64Data);
            const len = binaryStr.length;
            const bytes = new Uint8Array(len);
            for (let i = 0; i < len; i++) {
                bytes[i] = binaryStr.charCodeAt(i);
            }

            const int16 = new Int16Array(bytes.buffer);
            const numSamples = int16.length;

            const audioBuffer = ctx.createBuffer(1, numSamples, LEGACY_PCM_SAMPLE_RATE);
            const channelData = audioBuffer.getChannelData(0);
            for (let i = 0; i < numSamples; i++) {
                channelData[i] = int16[i] / 32768.0;
            }

            queueRef.current.push(audioBuffer);

            if (!isPlayingRef.current) {
                isPlayingRef.current = true;
                setIsPlaying(true);
                playNext();
            }
        } catch (err) {
            console.error('[AudioPlayback] Failed to decode PCM:', err);
        }
    }, [getAudioContext, playNext]);

    // Clear all queued audio (for barge-in / interruption)
    // Suspends context instead of destroying it so future playback still works
    const clearBuffer = useCallback(() => {
        queueRef.current = [];
        nextStartTimeRef.current = 0;
        isPlayingRef.current = false;
        setIsPlaying(false);

        if (audioContextRef.current && audioContextRef.current.state === 'running') {
            audioContextRef.current.suspend();
        }
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
                audioContextRef.current.close();
            }
        };
    }, []);

    return {
        isPlaying,
        enqueue,
        enqueueMp3,
        clearBuffer,
        onEndedCallbackRef,
    };
}
