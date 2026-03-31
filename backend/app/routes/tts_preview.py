"""
routes/tts_preview.py — Temporary endpoint for previewing Edge TTS voices.

Returns MP3 audio for a given voice name. Used by the voice preview modal
on the dashboard. This is a draft/temporary feature for voice selection.
"""

import base64
from fastapi import APIRouter, Query
from fastapi.responses import JSONResponse
from app.services import edge_tts_service

router = APIRouter()

SAMPLE_TEXT = (
    "Hello, welcome to your mock interview. "
    "I'll be your interviewer today. Let's get started with the first question."
)


@router.get("/tts/preview")
async def preview_voice(voice: str = Query(..., description="Edge TTS voice name")):
    """Generate a TTS audio preview for the given voice."""
    try:
        audio_bytes = await edge_tts_service.text_to_speech(SAMPLE_TEXT, voice=voice)
        b64_audio = base64.b64encode(audio_bytes).decode("ascii")
        return JSONResponse({"audio": b64_audio, "voice": voice})
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=400)
