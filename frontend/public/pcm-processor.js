/**
 * pcm-processor.js — AudioWorkletProcessor for real-time PCM capture.
 *
 * Runs in the AudioWorklet thread.
 * Accumulates raw float32 samples into chunks and posts them
 * as Int16 PCM to the main thread every ~100ms.
 */

class PCMProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        this._buffer = [];
        this._bufferSize = 1600; // 100ms at 16kHz = 1600 samples
    }

    process(inputs /*, outputs, parameters */) {
        const input = inputs[0];
        if (!input || !input[0]) return true;

        const channelData = input[0]; // mono
        for (let i = 0; i < channelData.length; i++) {
            this._buffer.push(channelData[i]);
        }

        // When we have enough samples, send a chunk
        while (this._buffer.length >= this._bufferSize) {
            const chunk = this._buffer.splice(0, this._bufferSize);

            // Convert float32 [-1, 1] to int16 [-32768, 32767]
            const pcm16 = new Int16Array(chunk.length);
            for (let i = 0; i < chunk.length; i++) {
                const s = Math.max(-1, Math.min(1, chunk[i]));
                pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
            }

            this.port.postMessage(pcm16.buffer, [pcm16.buffer]);
        }

        return true;
    }
}

registerProcessor("pcm-processor", PCMProcessor);
