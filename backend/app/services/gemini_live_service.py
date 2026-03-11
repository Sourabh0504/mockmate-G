"""
services/gemini_live_service.py — Bridge between our WebSocket and Gemini Live API.

Manages a single Gemini Live API session for one interview.
Handles:
  - Bidirectional audio streaming (user mic → STT, question text → TTS)
  - Automatic input/output transcription
  - Turn management and VAD
  - 15-minute session auto-reconnect
  - System instruction injection for interviewer persona

Architecture:
  Frontend (mic PCM) → Our WebSocket → This service → Gemini Live API
  Gemini Live API → This service (TTS audio + transcriptions) → Our WebSocket → Frontend (speaker)
"""

import asyncio
import base64
import time
import logging
from typing import Callable, Awaitable, Optional

from google import genai
from google.genai import types

from app.config import get_settings

logger = logging.getLogger("gemini_live")

# Gemini Live model for native audio
LIVE_MODEL = "gemini-2.5-flash-native-audio-preview-12-2025"

# Session limit is 15 minutes — reconnect before that
SESSION_MAX_SECONDS = 14 * 60  # Reconnect at 14 min to be safe


class GeminiLiveSession:
    """
    Manages a single Gemini Live API session for one interview.

    Usage:
        session = GeminiLiveSession(api_key, system_instruction)
        await session.start(
            on_audio=...,
            on_input_transcript=...,
            on_output_transcript=...,
            on_turn_complete=...,
            on_interrupted=...,
        )
        await session.send_audio(pcm_bytes)
        await session.send_text("Ask this question")
        await session.close()
    """

    def __init__(self, api_key: str, system_instruction: str, voice: str = "Puck"):
        self.api_key = api_key
        self.system_instruction = system_instruction
        self.voice = voice

        self.client = genai.Client(api_key=api_key)
        self._session = None
        self._running = False
        self._receive_task: Optional[asyncio.Task] = None
        self._session_start_time = 0

        # Callbacks (set via start())
        self._on_audio: Optional[Callable[[bytes], Awaitable[None]]] = None
        self._on_input_transcript: Optional[Callable[[str], Awaitable[None]]] = None
        self._on_output_transcript: Optional[Callable[[str], Awaitable[None]]] = None
        self._on_turn_complete: Optional[Callable[[], Awaitable[None]]] = None
        self._on_interrupted: Optional[Callable[[], Awaitable[None]]] = None

        # Audio queue for sending to Gemini
        self._audio_queue: asyncio.Queue[bytes] = asyncio.Queue()

    async def start(
        self,
        on_audio: Callable[[bytes], Awaitable[None]],
        on_input_transcript: Callable[[str], Awaitable[None]],
        on_output_transcript: Callable[[str], Awaitable[None]],
        on_turn_complete: Callable[[], Awaitable[None]],
        on_interrupted: Callable[[], Awaitable[None]],
    ):
        """
        Start the Gemini Live session and begin processing.
        All callbacks are async functions.
        """
        self._on_audio = on_audio
        self._on_input_transcript = on_input_transcript
        self._on_output_transcript = on_output_transcript
        self._on_turn_complete = on_turn_complete
        self._on_interrupted = on_interrupted
        self._running = True

        await self._connect()

    async def _connect(self):
        """Establish or re-establish the Gemini Live connection."""
        config = types.LiveConnectConfig(
            response_modalities=[types.Modality.AUDIO],
            speech_config=types.SpeechConfig(
                voice_config=types.VoiceConfig(
                    prebuilt_voice_config=types.PrebuiltVoiceConfig(
                        voice_name=self.voice
                    )
                )
            ),
            system_instruction=types.Content(
                parts=[types.Part(text=self.system_instruction)]
            ),
            input_audio_transcription=types.AudioTranscriptionConfig(),
            output_audio_transcription=types.AudioTranscriptionConfig(),
        )

        logger.info("[Gemini Live] Connecting...")
        self._session = await self.client.aio.live.connect(
            model=LIVE_MODEL, config=config
        )
        self._session_start_time = time.time()
        logger.info("[Gemini Live] Connected successfully")

        # Start background tasks for sending/receiving
        self._receive_task = asyncio.create_task(self._receive_loop())
        self._send_task = asyncio.create_task(self._send_audio_loop())

    async def _receive_loop(self):
        """Listen for responses from Gemini Live API."""
        try:
            while self._running:
                async for response in self._session.receive():
                    if not self._running:
                        break

                    server_content = response.server_content

                    if server_content:
                        # TTS audio data from model
                        if server_content.model_turn:
                            for part in server_content.model_turn.parts:
                                if part.inline_data:
                                    await self._on_audio(part.inline_data.data)

                        # Input transcription (user's speech → text)
                        if (
                            server_content.input_transcription
                            and server_content.input_transcription.text
                        ):
                            await self._on_input_transcript(
                                server_content.input_transcription.text
                            )

                        # Output transcription (model's speech → text)
                        if (
                            server_content.output_transcription
                            and server_content.output_transcription.text
                        ):
                            await self._on_output_transcript(
                                server_content.output_transcription.text
                            )

                        # Model finished speaking
                        if server_content.turn_complete:
                            await self._on_turn_complete()

                        # User interrupted (barge-in)
                        if server_content.interrupted:
                            await self._on_interrupted()

        except asyncio.CancelledError:
            pass
        except Exception as e:
            logger.error(f"[Gemini Live] Receive error: {e}", exc_info=True)

    async def _send_audio_loop(self):
        """Send queued audio chunks to Gemini Live API."""
        try:
            while self._running:
                chunk = await self._audio_queue.get()
                if chunk is None:
                    break

                # Check session expiry
                if self._needs_reconnect():
                    logger.info("[Gemini Live] Session nearing 15-min limit, reconnecting...")
                    await self._reconnect()

                await self._session.send_realtime_input(
                    audio=types.Blob(
                        data=chunk, mime_type="audio/pcm;rate=16000"
                    )
                )
        except asyncio.CancelledError:
            pass
        except Exception as e:
            logger.error(f"[Gemini Live] Send audio error: {e}", exc_info=True)

    def _needs_reconnect(self) -> bool:
        """Check if we need to reconnect due to 15-min session limit."""
        return (time.time() - self._session_start_time) >= SESSION_MAX_SECONDS

    async def _reconnect(self):
        """Reconnect the Gemini Live session (transparent to user)."""
        logger.info("[Gemini Live] Reconnecting session...")

        # Cancel existing receive task
        if self._receive_task and not self._receive_task.done():
            self._receive_task.cancel()
            try:
                await self._receive_task
            except asyncio.CancelledError:
                pass

        # Close old session
        try:
            if self._session:
                await self._session.close()
        except Exception:
            pass

        # Reconnect
        config = types.LiveConnectConfig(
            response_modalities=[types.Modality.AUDIO],
            speech_config=types.SpeechConfig(
                voice_config=types.VoiceConfig(
                    prebuilt_voice_config=types.PrebuiltVoiceConfig(
                        voice_name=self.voice
                    )
                )
            ),
            system_instruction=types.Content(
                parts=[types.Part(text=self.system_instruction)]
            ),
            input_audio_transcription=types.AudioTranscriptionConfig(),
            output_audio_transcription=types.AudioTranscriptionConfig(),
        )

        self._session = await self.client.aio.live.connect(
            model=LIVE_MODEL, config=config
        )
        self._session_start_time = time.time()
        self._receive_task = asyncio.create_task(self._receive_loop())

        logger.info("[Gemini Live] Reconnected successfully")

    # ── Public API ────────────────────────────────────────────────────────────

    async def send_audio(self, pcm_bytes: bytes):
        """Queue raw PCM audio chunk for sending to Gemini."""
        if self._running:
            await self._audio_queue.put(pcm_bytes)

    async def send_text(self, text: str):
        """
        Send text to Gemini for TTS (e.g., question text to be spoken).
        Uses send_client_content which triggers a model response.
        """
        if self._session and self._running:
            await self._session.send_client_content(
                turns=types.Content(
                    role="user",
                    parts=[types.Part(text=text)],
                ),
                turn_complete=True,
            )

    async def send_context(self, text: str):
        """
        Send context text to Gemini without triggering a response.
        Used for injecting interview context (question bank, etc.).
        """
        if self._session and self._running:
            await self._session.send_client_content(
                turns=types.Content(
                    role="user",
                    parts=[types.Part(text=text)],
                ),
                turn_complete=False,
            )

    async def close(self):
        """Close the Gemini Live session and clean up."""
        self._running = False

        # Signal send loop to stop
        await self._audio_queue.put(None)

        # Cancel tasks
        for task in [self._receive_task, getattr(self, '_send_task', None)]:
            if task and not task.done():
                task.cancel()
                try:
                    await task
                except asyncio.CancelledError:
                    pass

        # Close session
        try:
            if self._session:
                await self._session.close()
        except Exception:
            pass

        logger.info("[Gemini Live] Session closed")


def build_interviewer_system_instruction(
    role: str, company: str, jd_text: str, user_name: str = ""
) -> str:
    """
    Build the system instruction for the AI interviewer persona.
    This is injected into the Gemini Live session config.
    """
    name_instruction = f"The candidate's name is {user_name}. Use their name in the greeting and 2-3 times during the interview." if user_name else ""

    return f"""You are a professional AI interviewer conducting a mock interview for the role of {role} at {company}.

{name_instruction}

Your behavior rules:
1. You are an INTERVIEWER — you ask questions, not answer them.
2. Speak in a professional, calm, and slightly warm tone.
3. NEVER break character. You are always the interviewer.
4. After the candidate answers, say a brief natural transition phrase like "I see.", "Alright.", "Thank you for that." before the next question.
5. Do NOT evaluate or grade answers out loud. Just acknowledge and move on.
6. Keep your speaking concise — do not lecture or give long explanations.
7. If the candidate says "Can you repeat that?" or similar, repeat the current question verbatim.
8. If the candidate goes off-topic, gently redirect: "That's interesting, but let's focus on..."
9. Do NOT discuss answer quality, scores, or feedback during the interview.

Job Description Context:
{jd_text[:800]}

You will receive questions to ask via text input. When you receive a question, ask it to the candidate naturally. Do not add extra questions on your own — only ask what is sent to you.
When you receive audio from the candidate, listen and acknowledge when they finish speaking."""
