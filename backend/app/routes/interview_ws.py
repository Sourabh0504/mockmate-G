"""
routes/interview_ws.py — WebSocket endpoint for live interview sessions.

Handles the real-time communication loop between the frontend and the
InterviewManager state machine.

Voice pipeline (100% free):
  TTS: Edge TTS (Microsoft, free) — generates MP3 audio on server
  STT: Web Speech API (browser, free) — transcribes speech on client

Protocol:
  Client → Server:
    { "type": "speech_text", "text": "transcribed text" }           # Browser STT result
    { "type": "user_speaking" }                                     # User started speaking
    { "type": "tts_done" }                                          # Client finished playing TTS audio
    { "type": "end_interview" }
    { "type": "repeat_request" }

  Server → Client:
    { "type": "greeting", "text": "...", "question_index": 0, ... }
    { "type": "question", "text": "...", "question_id": "...", ... }
    { "type": "transition", "text": "..." }
    { "type": "tts_audio", "data": "<base64 MP3>" }                 # Edge TTS audio
    { "type": "start_timer", "timer_type": "initial|silence", "seconds": N }
    { "type": "listening" }
    { "type": "answer_finalized", "reason": "...", ... }
    { "type": "turn_complete" }                                     # AI finished speaking
    { "type": "pace_feedback", "pace": "good|too_fast|too_slow" }
    { "type": "session_info", ... }
    { "type": "interview_ended", "reason": "...", "text": "..." }
    { "type": "error", "message": "..." }
"""

import asyncio
import base64
import json
import time
import logging
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from bson import ObjectId

from app.utils.jwt_utils import decode_access_token
from app.database import get_db
from app.config import get_settings
from app.services.interview_manager import InterviewManager
from app.services import edge_tts_service
from app.services import session_service

logger = logging.getLogger("interview_ws")

router = APIRouter()

# Active interview sessions: session_id → InterviewManager
active_interviews: dict[str, InterviewManager] = {}


async def _authenticate_ws(token: str, db) -> dict | None:
    """Validate JWT token for WebSocket connection."""
    try:
        payload = decode_access_token(token)
        user_id = payload.get("sub")
        if not user_id:
            return None
        user = await db["users"].find_one({"_id": ObjectId(user_id)})
        return user
    except Exception:
        return None


async def _speak(websocket: WebSocket, text: str, voice: str = "en-US-AndrewMultilingualNeural"):
    """
    Generate Edge TTS audio and send it to the client.
    The client will play the MP3 and send 'tts_done' when finished.
    """
    try:
        audio_bytes = await edge_tts_service.text_to_speech(text, voice)
        b64_audio = base64.b64encode(audio_bytes).decode("ascii")
        await websocket.send_json({
            "type": "tts_audio",
            "data": b64_audio,
        })
        logger.debug(f"[TTS] Sent {len(audio_bytes)} bytes for: {text[:60]}...")
    except Exception as e:
        logger.error(f"[TTS] Failed to generate audio: {e}", exc_info=True)


@router.websocket("/ws/interview/{session_id}")
async def interview_websocket(
    websocket: WebSocket,
    session_id: str,
    token: str = Query(...),
):
    """
    Main WebSocket endpoint for live interview sessions.

    Connection flow:
      1. Client connects with JWT token as query param
      2. Server validates token + session ownership
      3. Server initialises InterviewManager
      4. Client and server exchange messages for Q&A flow
      5. Interview ends → evaluation is triggered in background
    """
    db = get_db()
    settings = get_settings()

    # ── Step 1: Authenticate ──────────────────────────────────────────────────
    user = await _authenticate_ws(token, db)
    if not user:
        await websocket.close(code=4001, reason="Unauthorized")
        return

    user_id = str(user["_id"])
    user_name = user.get("name", "").split()[0] if user.get("name") else None
    user_voice = user.get("preferred_voice", "en-US-AndrewMultilingualNeural")

    # ── Step 2: Load and validate session ─────────────────────────────────────
    session = await db["sessions"].find_one({
        "_id": ObjectId(session_id),
        "user_id": ObjectId(user_id),
    })

    if not session:
        await websocket.close(code=4004, reason="Session not found")
        return

    session_status = session.get("status")
    # Only treat as a real resume if there's actual progress (transcript or interruption_point).
    # A bare "live" status with no data = React StrictMode ghost-mount, treat as fresh start.
    has_progress = bool(session.get("interruption_point")) or bool(session.get("transcript"))
    is_resume = session_status in ("interrupted", "live") and has_progress

    if session_status not in ("ready", "interrupted", "live"):
        await websocket.close(
            code=4003,
            reason=f"Session cannot be started (status: {session_status})",
        )
        return

    # ── Step 3: Accept connection ─────────────────────────────────────────────
    await websocket.accept()
    logger.info(f"[WS] Connected: session={session_id}, user={user_id}, resume={is_resume}")

    # ── Step 4: Initialize InterviewManager ───────────────────────────────────
    manager = InterviewManager(session, db)
    manager.user_name = user_name
    manager.preferred_voice = user_voice

    if is_resume and session.get("interruption_point"):
        manager.transcript = session.get("transcript", [])
        manager.restore_from_interruption(session["interruption_point"])

    active_interviews[session_id] = manager

    try:
        # ── Step 5: Start interview / deliver greeting ────────────────────────
        if is_resume:
            resume_msg = {
                "type": "greeting",
                "text": "Welcome back. Let's continue where we left off.",
                "question_index": manager.current_question_index,
                "total_questions": len(manager.questions),
            }
            manager.state = "greeting"
            manager.session_start_time = time.time()
            manager.last_autosave_time = time.time()

            await db["sessions"].update_one(
                {"_id": ObjectId(session_id)},
                {"$set": {"status": "live"}},
            )

            await websocket.send_json(resume_msg)
            manager.pending_action = "start_waiting"
            await _speak(websocket, resume_msg["text"], manager.preferred_voice)
        else:
            greeting = await manager.start()
            await websocket.send_json(greeting)
            manager.pending_action = "start_waiting"
            await _speak(websocket, greeting["text"], manager.preferred_voice)

        # ── Step 6: Main interview loop ───────────────────────────────────────
        monitor_task = asyncio.create_task(
            _monitor_timers(websocket, manager)
        )

        try:
            while manager.state != "ended":
                try:
                    raw = await asyncio.wait_for(
                        websocket.receive_text(),
                        timeout=1.0,
                    )
                    msg = json.loads(raw)
                    await _handle_client_message(websocket, manager, msg)
                except asyncio.TimeoutError:
                    pass
                except json.JSONDecodeError:
                    await websocket.send_json({
                        "type": "error",
                        "message": "Invalid message format"
                    })

                await manager.autosave_if_needed()

        finally:
            monitor_task.cancel()
            try:
                await monitor_task
            except asyncio.CancelledError:
                pass

    except WebSocketDisconnect:
        logger.warning(f"[WS] Disconnected: session={session_id}")
        # Only save interruption if there's real progress (avoids StrictMode ghost-disconnect)
        if manager.state != "ended" and len(manager.transcript) > 0:
            await manager.save_interruption_state()
        elif manager.state != "ended":
            # No progress — reset session back to "ready" so user can start fresh
            await db["sessions"].update_one(
                {"_id": ObjectId(session_id)},
                {"$set": {"status": "ready"}},
            )
            logger.info(f"[WS] No progress — reset session {session_id} to ready")

    except Exception as e:
        logger.error(f"[WS] Error in session {session_id}: {e}", exc_info=True)
        if manager.state != "ended":
            await manager.save_interruption_state()
        try:
            await websocket.send_json({"type": "error", "message": str(e)})
        except Exception:
            pass

    finally:
        active_interviews.pop(session_id, None)

        if manager.state == "ended" and manager.termination_type in ("completed", "manual", "timeout"):
            logger.info(f"[WS] Triggering evaluation for session {session_id}")
            asyncio.create_task(
                session_service.evaluate_session(session_id, user_id, db)
            )

        logger.info(f"[WS] Cleaned up: session={session_id}")


# ── Message Handlers ─────────────────────────────────────────────────────────

async def _handle_client_message(
    websocket: WebSocket,
    manager: InterviewManager,
    msg: dict,
):
    """Handle an incoming message from the client."""
    msg_type = msg.get("type")

    if msg_type == "user_speaking":
        # User started speaking (from browser STT)
        if manager.state == "waiting":
            response = await manager.user_started_speaking()
            await websocket.send_json(response)

    elif msg_type == "speech_text":
        # Receive transcribed text from browser Web Speech API
        text = msg.get("text", "")
        if text and manager.state == "listening":
            # Check for repeat request
            if manager.check_repeat_request(text):
                logger.info(f"[WS] Repeat request detected: {text}")
                manager.current_answer_chunks = []
                question = manager.get_current_question()
                if question:
                    q_text = question["question_text"]
                    manager.pending_action = "start_waiting"
                    await websocket.send_json({
                        "type": "question",
                        "text": q_text,
                        "question_id": question["id"],
                        "question_index": manager.current_question_index,
                        "is_repeat": True,
                    })
                    await _speak(websocket, f"I'll repeat the question: {q_text}", manager.preferred_voice)
            else:
                manager.receive_speech_text(text)

    elif msg_type == "tts_done":
        # Client finished playing TTS audio — AI done speaking
        await websocket.send_json({"type": "turn_complete"})

        # Execute pending action (event-driven turn management)
        action = manager.pending_action
        manager.pending_action = None

        if action == "start_waiting":
            timer_msg = await manager.start_waiting()
            await websocket.send_json(timer_msg)
        elif action == "deliver_question":
            # Check for follow-up first
            if manager.should_followup():
                followup_msg = await manager.prepare_followup()
                if followup_msg:
                    manager.pending_action = "start_waiting"
                    await websocket.send_json(followup_msg)
                    await _speak(websocket, followup_msg.get("text", ""), manager.preferred_voice)
                    return
            await _deliver_next_question(websocket, manager)
        elif action == "deliver_followup":
            followup_msg = await manager.prepare_followup()
            if followup_msg:
                manager.pending_action = "start_waiting"
                await websocket.send_json(followup_msg)
                await _speak(websocket, followup_msg.get("text", ""), manager.preferred_voice)
            else:
                await _deliver_next_question(websocket, manager)
        # If action is None or state is "ended", do nothing

    elif msg_type == "end_interview":
        end_msg = await manager.end_interview("manual")
        manager.pending_action = None  # No follow-up after farewell
        await websocket.send_json(end_msg)
        await _speak(websocket, end_msg["text"], manager.preferred_voice)

    elif msg_type == "repeat_request":
        question = manager.get_current_question()
        if question:
            q_text = question["question_text"]
            manager.pending_action = "start_waiting"
            await websocket.send_json({
                "type": "question",
                "text": q_text,
                "question_id": question["id"],
                "question_index": manager.current_question_index,
                "is_repeat": True,
            })
            await _speak(websocket, f"I'll repeat the question: {q_text}", manager.preferred_voice)

    else:
        await websocket.send_json({
            "type": "error",
            "message": f"Unknown message type: {msg_type}",
        })


async def _deliver_next_question(
    websocket: WebSocket,
    manager: InterviewManager,
):
    """Deliver the next question to the client and speak it via Edge TTS."""
    question_msg = await manager.deliver_question()

    if question_msg is None:
        end_msg = await manager.end_interview("completed")
        await websocket.send_json(end_msg)
        await _speak(websocket, end_msg["text"], manager.preferred_voice)
        return

    await websocket.send_json(question_msg)

    q_text = question_msg.get("text", "")
    manager.pending_action = "start_waiting"
    await _speak(websocket, q_text, manager.preferred_voice)
    # Timer will start when client sends 'tts_done' after audio playback


async def _handle_answer_transition(
    websocket: WebSocket,
    manager: InterviewManager,
):
    """
    Handle the transition after an answer is finalized.
    Sets pending_action so tts_done will trigger the next question delivery.
    """
    transition = await manager.get_transition()
    # When transition TTS finishes (tts_done), deliver the next question
    manager.pending_action = "deliver_question"
    await websocket.send_json(transition)
    await _speak(websocket, transition["text"], manager.preferred_voice)


async def _monitor_timers(
    websocket: WebSocket,
    manager: InterviewManager,
):
    """
    Background task that monitors timers and triggers events:
    - 10s initial timeout (skip question)
    - 7s silence detection (finalize answer)
    - 120s max answer duration
    - Session time expiry
    - Pace feedback updates
    """
    last_pace_update = 0
    waiting_since = 0

    try:
        while manager.state != "ended":
            await asyncio.sleep(1.0)

            # ── Check 10s initial timeout ────────────
            if manager.state == "waiting":
                if waiting_since == 0:
                    waiting_since = time.time()
                elif (time.time() - waiting_since) >= 10.0:
                    answer_msg = await manager.finalize_answer("initial_timeout")
                    await websocket.send_json(answer_msg)
                    waiting_since = 0
                    await _handle_answer_transition(websocket, manager)
            else:
                waiting_since = 0

            # ── Check 7s silence timeout ──────────────
            if manager.state == "listening" and manager.check_silence_timeout():
                answer_msg = await manager.finalize_answer("silence")
                await websocket.send_json(answer_msg)
                await _handle_answer_transition(websocket, manager)

            # ── Check 120s max duration ───────────────
            elif manager.state == "listening" and manager.check_max_duration():
                answer_msg = await manager.finalize_answer("max_duration")
                await websocket.send_json(answer_msg)
                await _handle_answer_transition(websocket, manager)

            # ── Check session time expiry ─────────────
            if manager.state not in ("ended", "idle"):
                info = manager.get_session_info()
                if info["remaining_seconds"] <= 0 and manager.state not in ("listening", "ended"):
                    end_msg = await manager.end_interview("timeout")
                    await websocket.send_json(end_msg)
                    await _speak(websocket, end_msg["text"], manager.preferred_voice)

            # ── Pace feedback (every 3 seconds while listening) ───
            now = time.time()
            if manager.state == "listening" and (now - last_pace_update) >= 3:
                pace = manager.get_pace_feedback()
                if pace:
                    await websocket.send_json({
                        "type": "pace_feedback",
                        "pace": pace,
                    })
                last_pace_update = now

    except asyncio.CancelledError:
        pass
    except Exception as e:
        logger.error(f"[Timer Monitor] Error: {e}", exc_info=True)
