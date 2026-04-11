"""
services/edge_tts_service.py — Free text-to-speech using Microsoft Edge TTS.

Generates MP3 audio from text using the edge-tts library.
Zero cost, high quality, supports multiple voices.

Usage:
    audio_bytes = await text_to_speech("Hello, world!")
    # audio_bytes is MP3 data ready to send to the client
"""

import io
import logging
import edge_tts

logger = logging.getLogger("edge_tts_service")

# Default voice — professional male voice good for interviews
DEFAULT_VOICE = "en-US-AndrewMultilingualNeural"


async def text_to_speech(text: str, voice: str = DEFAULT_VOICE) -> bytes:
    """
    Convert text to MP3 audio using Microsoft Edge TTS (buffered).
    Used by tts_preview route. For live interview use stream_tts() instead.
    """
    communicate = edge_tts.Communicate(text, voice)
    audio_buffer = io.BytesIO()

    async for chunk in communicate.stream():
        if chunk["type"] == "audio":
            audio_buffer.write(chunk["data"])

    audio_bytes = audio_buffer.getvalue()
    logger.debug(f"[Edge TTS] Generated {len(audio_bytes)} bytes for: {text[:60]}...")
    return audio_bytes


async def stream_tts(text: str, voice: str = DEFAULT_VOICE):
    """
    Async generator that yields raw MP3 audio chunks as they arrive from Edge TTS.

    Enables progressive streaming — first chunk arrives in ~150-300ms instead of
    buffering the entire MP3 before sending. Each yielded value is raw bytes.

    Usage:
        async for chunk in stream_tts("Hello world"):
            send_to_client(base64.b64encode(chunk))
    """
    communicate = edge_tts.Communicate(text, voice)
    async for chunk in communicate.stream():
        if chunk["type"] == "audio":
            yield chunk["data"]


async def list_voices() -> list[dict]:
    """List all available Edge TTS voices (for debugging)."""
    voices = await edge_tts.list_voices()
    return [
        {"name": v["Name"], "locale": v["Locale"], "gender": v["Gender"]}
        for v in voices
        if v["Locale"].startswith("en-")
    ]
