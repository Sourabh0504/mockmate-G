"""
services/whisper_service.py — Local Whisper STT for MockMate AI.

Replaces browser Web Speech API (Chrome-only) with server-side transcription:
  - Uses faster-whisper 'small' model (~245MB)
  - GPU (CUDA float16) primary; CPU int8 fallback
  - Async API — runs sync transcription in thread pool to avoid blocking

Model selection rationale (4GB GPU):
  tiny   (~39MB)  — too inaccurate for Indian accents
  base   (~74MB)  — acceptable but misses domain terms
  small  (~245MB) — best accuracy/speed for 4GB GPU  ← chosen
  medium (~769MB) — too slow on 4GB for real-time use
"""

import asyncio
import logging
import numpy as np

logger = logging.getLogger("whisper_service")

_model = None


def _load_model():
    """Load faster-whisper model. Called once at module import time."""
    global _model
    try:
        from faster_whisper import WhisperModel
        logger.info("[Whisper] Loading 'small' model on CUDA (float16)...")
        _model = WhisperModel("small", device="cuda", compute_type="float16")
        logger.info("[Whisper] Model ready — CUDA float16.")
    except Exception as cuda_err:
        logger.warning(f"[Whisper] CUDA load failed ({cuda_err}), falling back to CPU int8...")
        try:
            from faster_whisper import WhisperModel
            _model = WhisperModel("small", device="cpu", compute_type="int8")
            logger.info("[Whisper] Model ready — CPU int8 fallback.")
        except Exception as cpu_err:
            logger.error(f"[Whisper] CRITICAL: Could not load model: {cpu_err}")
            _model = None


def _sync_transcribe(pcm_float32_bytes: bytes) -> str:
    """
    Synchronous transcription of raw float32 PCM audio.

    Args:
        pcm_float32_bytes: Raw bytes of a float32 numpy array, 16kHz mono.

    Returns:
        Transcribed text string. Empty string on failure or no speech.
    """
    if _model is None:
        logger.error("[Whisper] Model not loaded — cannot transcribe")
        return ""

    if not pcm_float32_bytes or len(pcm_float32_bytes) < 640:
        # Less than 20ms of audio — skip
        return ""

    try:
        audio = np.frombuffer(pcm_float32_bytes, dtype=np.float32)

        if len(audio) == 0:
            return ""

        segments, _info = _model.transcribe(
            audio,
            language="en",
            beam_size=1,               # Greedy — fastest inference
            vad_filter=True,           # Whisper built-in VAD as extra filter
            vad_parameters=dict(
                min_silence_duration_ms=300,
                speech_pad_ms=100,
            ),
            temperature=0.0,           # Deterministic — no random sampling
            word_timestamps=False,
            condition_on_previous_text=False,  # Prevents hallucination carry-over
        )

        text = " ".join(seg.text.strip() for seg in segments).strip()
        if text:
            logger.info(f"[Whisper] {len(audio)/16000:.1f}s → '{text[:80]}'")
        return text

    except Exception as e:
        logger.error(f"[Whisper] Transcription error: {e}", exc_info=True)
        return ""


async def transcribe(pcm_float32_bytes: bytes) -> str:
    """
    Async transcription — runs sync Whisper in thread pool executor.

    Args:
        pcm_float32_bytes: bytes of float32 PCM at 16kHz mono (from browser AudioWorklet).

    Returns:
        Transcribed text string.
    """
    if not pcm_float32_bytes:
        return ""
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, _sync_transcribe, pcm_float32_bytes)


# Load model at import time so it is warm before the first interview starts.
_load_model()
