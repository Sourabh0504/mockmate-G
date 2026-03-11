/**
 * useAudioPlayback.js — Seamless playback of PCM audio chunks from WebSocket.
 *
 * Receives base64-encoded PCM audio (24kHz, Int16) from the server,
 * buffers and plays it through Web Audio API with gapless stitching.
 *
 * Usage:
 *   const { isPlaying, enqueue, clearBuffer } = useAudioPlayback();
 *   // enqueue(base64String) — add audio chunk to playback queue
 *   // clearBuffer() — stop playback and clear queue (for barge-in)
 */

import { useState, useRef, useCallback, useEffect } from 'react';

const OUTPUT_SAMPLE_RATE = 24000; // Gemini Live outputs at 24kHz

export default function useAudioPlayback() {
    const [isPlaying, setIsPlaying] = useState(false);

    const audioContextRef = useRef(null);
    const queueRef = useRef([]); // Queue of AudioBuffers
    const isPlayingRef = useRef(false);
    const nextStartTimeRef = useRef(0);

    // Initialize AudioContext lazily (must be after user interaction)
    const getAudioContext = useCallback(() => {
        if (!audioContextRef.current) {
            audioContextRef.current = new AudioContext({ sampleRate: OUTPUT_SAMPLE_RATE });
        }
        return audioContextRef.current;
    }, []);

    // Convert base64 PCM Int16 to AudioBuffer
    const decodeChunk = useCallback((base64Data) => {
        const ctx = getAudioContext();

        // Decode base64 to raw bytes
        const binaryStr = atob(base64Data);
        const len = binaryStr.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryStr.charCodeAt(i);
        }

        // Interpret as Int16 PCM
        const int16 = new Int16Array(bytes.buffer);
        const numSamples = int16.length;

        // Convert to Float32 for Web Audio
        const audioBuffer = ctx.createBuffer(1, numSamples, OUTPUT_SAMPLE_RATE);
        const channelData = audioBuffer.getChannelData(0);
        for (let i = 0; i < numSamples; i++) {
            channelData[i] = int16[i] / 32768.0;
        }

        return audioBuffer;
    }, [getAudioContext]);

    // Play next buffer from queue
    const playNext = useCallback(() => {
        if (queueRef.current.length === 0) {
            isPlayingRef.current = false;
            setIsPlaying(false);
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

    // Enqueue a base64 PCM chunk for playback
    const enqueue = useCallback((base64Data) => {
        try {
            const audioBuffer = decodeChunk(base64Data);
            queueRef.current.push(audioBuffer);

            if (!isPlayingRef.current) {
                isPlayingRef.current = true;
                setIsPlaying(true);
                playNext();
            }
        } catch (err) {
            console.error('[AudioPlayback] Failed to decode audio:', err);
        }
    }, [decodeChunk, playNext]);

    // Clear all queued audio (for barge-in / interruption)
    const clearBuffer = useCallback(() => {
        queueRef.current = [];
        nextStartTimeRef.current = 0;
        isPlayingRef.current = false;
        setIsPlaying(false);

        // Stop any currently playing audio by closing and recreating context
        if (audioContextRef.current) {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (audioContextRef.current) {
                audioContextRef.current.close();
            }
        };
    }, []);

    return {
        isPlaying,
        enqueue,
        clearBuffer,
    };
}
