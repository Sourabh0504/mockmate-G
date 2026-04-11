/**
 * pcm-processor.js — AudioWorklet for real-time mic capture with RMS VAD.
 *
 * Runs at 16kHz mono (AudioContext must be created with sampleRate: 16000).
 * Each process() call receives 128 Float32 samples (~8ms of audio).
 *
 * Voice Activity Detection (VAD):
 *   RMS > RMS_THRESHOLD  → speech frame
 *   RMS ≤ threshold for SILENCE_FRAMES_THRESHOLD frames → silence confirmed
 *
 * Messages posted to main thread:
 *   { type: "speaking_started" }              — first speech frame after silence
 *   { type: "audio", buffer: ArrayBuffer }    — Float32 audio during speech
 *   { type: "silence_detected" }              — sustained post-speech silence
 */
class PcmProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        this.speaking = false;
        this.silenceFrames = 0;

        // 75 frames × 128 samples / 16000 Hz ≈ 0.6s of silence to trigger speech_end
        // Short enough to feel responsive; server's 7s timer handles true finalization.
        this.SILENCE_FRAMES_THRESHOLD = 75;

        // Same RMS gate used in the previous pcm-processor VAD implementation
        this.RMS_THRESHOLD = 0.008;
    }

    process(inputs) {
        const channelData = inputs[0]?.[0];
        if (!channelData || channelData.length === 0) return true;

        // Compute Root Mean Square energy of this frame
        let sumSquares = 0;
        for (let i = 0; i < channelData.length; i++) {
            sumSquares += channelData[i] * channelData[i];
        }
        const rms = Math.sqrt(sumSquares / channelData.length);

        const hasSpeech = rms > this.RMS_THRESHOLD;

        if (hasSpeech) {
            if (!this.speaking) {
                this.speaking = true;
                this.port.postMessage({ type: 'speaking_started' });
            }
            this.silenceFrames = 0;

            // Copy channelData (shared buffer — must not be transferred directly)
            const copy = channelData.slice();
            this.port.postMessage({ type: 'audio', buffer: copy.buffer }, [copy.buffer]);

        } else if (this.speaking) {
            // Still in speech window — include this silent frame in the chunk
            // (preserves natural intra-word gaps without cutting the audio)
            const copy = channelData.slice();
            this.port.postMessage({ type: 'audio', buffer: copy.buffer }, [copy.buffer]);

            this.silenceFrames++;
            if (this.silenceFrames >= this.SILENCE_FRAMES_THRESHOLD) {
                this.speaking = false;
                this.silenceFrames = 0;
                this.port.postMessage({ type: 'silence_detected' });
            }
        }
        // If not speaking and no speech → do nothing (silence dropped, saves bandwidth)

        return true; // Keep processor alive
    }
}

registerProcessor('pcm-processor', PcmProcessor);
