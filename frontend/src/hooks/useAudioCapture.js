/**
 * useAudioCapture.js — Real-time microphone capture for WebSocket streaming.
 *
 * Uses AudioWorklet with a custom PCM processor to capture raw 16-bit PCM
 * audio at 16kHz in ~100ms chunks.
 *
 * Usage:
 *   const { isCapturing, startCapture, stopCapture, micPermission } = useAudioCapture(sendAudioChunk);
 *   // sendAudioChunk receives ArrayBuffer of Int16 PCM
 */

import { useState, useRef, useCallback } from 'react';

export default function useAudioCapture(onChunk) {
    const [isCapturing, setIsCapturing] = useState(false);
    const [micPermission, setMicPermission] = useState('prompt'); // 'prompt' | 'granted' | 'denied'

    const audioContextRef = useRef(null);
    const workletNodeRef = useRef(null);
    const streamRef = useRef(null);
    const onChunkRef = useRef(onChunk);
    onChunkRef.current = onChunk;

    const startCapture = useCallback(async () => {
        try {
            // Request mic access at 16kHz
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    sampleRate: 16000,
                    channelCount: 1,
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                },
                video: false,
            });
            streamRef.current = stream;
            setMicPermission('granted');

            // Create AudioContext at 16kHz
            const audioContext = new AudioContext({ sampleRate: 16000 });
            audioContextRef.current = audioContext;

            // Load the PCM processor worklet
            await audioContext.audioWorklet.addModule('/pcm-processor.js');

            // Create worklet node
            const workletNode = new AudioWorkletNode(audioContext, 'pcm-processor');
            workletNodeRef.current = workletNode;

            // Listen for PCM chunks from the worklet
            workletNode.port.onmessage = (event) => {
                if (onChunkRef.current) {
                    onChunkRef.current(event.data); // ArrayBuffer of Int16 PCM
                }
            };

            // Connect mic → worklet
            const source = audioContext.createMediaStreamSource(stream);
            source.connect(workletNode);
            // Don't connect worklet to destination (we don't want to play back our own mic)

            setIsCapturing(true);
        } catch (err) {
            console.error('[AudioCapture] Failed to start:', err);
            if (err.name === 'NotAllowedError') {
                setMicPermission('denied');
            }
        }
    }, []);

    const stopCapture = useCallback(() => {
        // Disconnect worklet
        if (workletNodeRef.current) {
            workletNodeRef.current.disconnect();
            workletNodeRef.current = null;
        }

        // Close AudioContext
        if (audioContextRef.current) {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }

        // Stop mic stream
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop());
            streamRef.current = null;
        }

        setIsCapturing(false);
    }, []);

    return {
        isCapturing,
        micPermission,
        startCapture,
        stopCapture,
    };
}
