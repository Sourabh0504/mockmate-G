"""
routes/interview_ws.py — WebSocket endpoint for live interview sessions.

Handles the real-time communication loop between the frontend and the
InterviewManager state machine. Bridges audio to/from Gemini Live API.

Protocol:
  Client → Server:
    { "type": "audio_chunk", "data": "<base64 PCM audio>" }
    { "type": "speech_text", "text": "transcribed text chunk" }     # Text-mode fallback
    { "type": "user_speaking" }                                      # Text-mode: user started speaking
    { "type": "end_interview" }
    { "type": "repeat_request" }

  Server → Client:
    { "type": "greeting", "text": "...", "question_index": 0, ... }
    { "type": "question", "text": "...", "question_id": "...", ... }
    { "type": "transition", "text": "..." }
    { "type": "start_timer", "timer_type": "initial|silence", "seconds": N }
    { "type": "listening" }
    { "type": "answer_finalized", "reason": "...", ... }
    { "type": "audio_data", "data": "<base64 PCM 24kHz>" }          # TTS audio
    { "type": "turn_complete" }                                      # AI finished speaking
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
from app.services.gemini_live_service import (
    GeminiLiveSession,
    build_interviewer_system_instruction,
)
from app.services import session_service

logger = logging.getLogger("interview_ws")

router = APIRouter()

# Active interview sessions: session_id → InterviewManager
active_interviews: dict[str, InterviewManager] = {}


async def _authenticate_ws(token: str, db) -> dict | None:
    """
    Validate JWT token for WebSocket connection.
    Returns user document or None if invalid.
    """
    try:
        payload = decode_access_token(token)
        user_id = payload.get("sub")
        if not user_id:
            return None
        user = await db["users"].find_one({"_id": ObjectId(user_id)})
        return user
    except Exception:
        return None


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
      3. Server initialises InterviewManager + Gemini Live session
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

    # ── Step 2: Load and validate session ─────────────────────────────────────
    session = await db["sessions"].find_one({
        "_id": ObjectId(session_id),
        "user_id": ObjectId(user_id),
    })

    if not session:
        await websocket.close(code=4004, reason="Session not found")
        return

    session_status = session.get("status")
    is_resume = session_status == "interrupted"

    if session_status not in ("ready", "interrupted"):
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

    # If resuming an interrupted session, restore state
    if is_resume and session.get("interruption_point"):
        manager.transcript = session.get("transcript", [])
        manager.restore_from_interruption(session["interruption_point"])

    active_interviews[session_id] = manager

    # ── Step 5: Initialize Gemini Live session ────────────────────────────────
    gemini_live = None
    audio_mode = bool(settings.GEMINI_API_KEY)  # Only use audio if API key is set

    if audio_mode:
        try:
            system_instruction = build_interviewer_system_instruction(
                role=session.get("target_role", "Software Engineer"),
                company=session.get("company_name", "the company"),
                jd_text=session.get("jd_text", ""),
                user_name=user_name or "",
            )

            gemini_live = GeminiLiveSession(
                api_key=settings.GEMINI_API_KEY,
                system_instruction=system_instruction,
            )

            # Define callbacks for Gemini Live events
            async def on_audio(data: bytes):
                """Forward TTS audio from Gemini to the client."""
                try:
                    encoded = base64.b64encode(data).decode("ascii")
                    await websocket.send_json({
                        "type": "audio_data",
                        "data": encoded,
                    })
                except Exception:
                    pass

            async def on_input_transcript(text: str):
                """User speech was transcribed by Gemini."""
                logger.debug(f"[Gemini] Input transcript: {text}")
                if manager.state == "listening":
                    # Check if user is asking to repeat the question
                    if manager.check_repeat_request(text):
                        logger.info(f"[WS] Repeat request detected: {text}")
                        # Discard current answer chunks and re-ask
                        manager.current_answer_chunks = []
                        question = manager.get_current_question()
                        if question:
                            q_text = question["question_text"]
                            await websocket.send_json({
                                "type": "question",
                                "text": q_text,
                                "question_id": question["id"],
                                "question_index": manager.current_question_index,
                                "is_repeat": True,
                            })
                            if gemini_live:
                                await gemini_live.send_text(f"I'll repeat the question: {q_text}")
                            else:
                                timer_msg = await manager.start_waiting()
                                await websocket.send_json(timer_msg)
                    else:
                        manager.receive_speech_text(text)
                elif manager.state == "waiting":
                    # VAD detected speech — auto-start listening
                    response = await manager.user_started_speaking()
                    await websocket.send_json(response)
                    manager.receive_speech_text(text)

            async def on_output_transcript(text: str):
                """AI speech was transcribed by Gemini."""
                logger.debug(f"[Gemini] Output transcript: {text}")

            async def on_turn_complete():
                """AI finished speaking — start the waiting timer."""
                logger.debug("[Gemini] Turn complete — AI done speaking")
                await websocket.send_json({"type": "turn_complete"})

                # If we're in greeting/transitioning state, start waiting
                if manager.state in ("greeting", "transitioning"):
                    timer_msg = await manager.start_waiting()
                    await websocket.send_json(timer_msg)

            async def on_interrupted():
                """User interrupted the AI (barge-in)."""
                logger.debug("[Gemini] Interrupted by user")
                # If AI was speaking a question, switch to listening
                if manager.state in ("greeting", "transitioning"):
                    response = await manager.user_started_speaking()
                    await websocket.send_json(response)

            await gemini_live.start(
                on_audio=on_audio,
                on_input_transcript=on_input_transcript,
                on_output_transcript=on_output_transcript,
                on_turn_complete=on_turn_complete,
                on_interrupted=on_interrupted,
            )
            logger.info(f"[WS] Gemini Live session started for session={session_id}")

        except Exception as e:
            logger.error(f"[WS] Failed to start Gemini Live: {e}", exc_info=True)
            audio_mode = False
            gemini_live = None
            # Fall back to text-only mode
            await websocket.send_json({
                "type": "error",
                "message": "Audio mode unavailable — falling back to text mode",
            })

    try:
        # ── Step 6: Start interview / deliver greeting ────────────────────────
        if is_resume:
            # Resume: welcome back + deliver next question
            resume_msg = {
                "type": "greeting",
                "text": "Welcome back. Let's continue where we left off.",
                "question_index": manager.current_question_index,
                "total_questions": len(manager.questions),
            }
            manager.state = "greeting"
            manager.session_start_time = time.time()
            manager.last_autosave_time = time.time()

            # Update status back to live
            await db["sessions"].update_one(
                {"_id": ObjectId(session_id)},
                {"$set": {"status": "live"}},
            )

            if gemini_live:
                # Have Gemini speak the welcome back message
                await gemini_live.send_text(resume_msg["text"])
            await websocket.send_json(resume_msg)
        else:
            # Fresh start: greeting + first question
            greeting = await manager.start()
            if gemini_live:
                # Have Gemini speak the greeting
                await gemini_live.send_text(greeting["text"])
            await websocket.send_json(greeting)

        # Give the client a moment to process the greeting
        await asyncio.sleep(0.5)

        # ── Step 7: Main interview loop ───────────────────────────────────────
        # Start the question delivery and timer monitoring concurrently
        # with the message receive loop
        monitor_task = asyncio.create_task(
            _monitor_timers(websocket, manager, gemini_live)
        )

        try:
            # Deliver the first question (or next question if resuming)
            await _deliver_next_question(websocket, manager, gemini_live)

            # Message receive loop
            while manager.state != "ended":
                try:
                    raw = await asyncio.wait_for(
                        websocket.receive_text(),
                        timeout=1.0,  # Check every second for timer events
                    )
                    msg = json.loads(raw)
                    await _handle_client_message(websocket, manager, msg, gemini_live)
                except asyncio.TimeoutError:
                    # No message received — continue (timer monitor handles timeouts)
                    pass
                except json.JSONDecodeError:
                    await websocket.send_json({
                        "type": "error",
                        "message": "Invalid message format"
                    })

                # Auto-save periodically
                await manager.autosave_if_needed()

        finally:
            monitor_task.cancel()
            try:
                await monitor_task
            except asyncio.CancelledError:
                pass

    except WebSocketDisconnect:
        # ── Network disconnect ────────────────────────────────────────────────
        logger.warning(f"[WS] Disconnected: session={session_id}")
        if manager.state != "ended":
            await manager.save_interruption_state()

    except Exception as e:
        logger.error(f"[WS] Error in session {session_id}: {e}", exc_info=True)
        if manager.state != "ended":
            await manager.save_interruption_state()
        try:
            await websocket.send_json({"type": "error", "message": str(e)})
        except Exception:
            pass

    finally:
        # ── Cleanup ───────────────────────────────────────────────────────────
        active_interviews.pop(session_id, None)

        # Close Gemini Live session
        if gemini_live:
            await gemini_live.close()

        # If interview ended normally, trigger evaluation
        if manager.state == "ended" and manager.termination_type in ("completed", "manual", "timeout"):
            logger.info(f"[WS] Triggering evaluation for session {session_id}")
            # Run evaluation in background (don't block WS cleanup)
            asyncio.create_task(
                session_service.evaluate_session(session_id, user_id, db)
            )

        logger.info(f"[WS] Cleaned up: session={session_id}")


# ── Message Handlers ─────────────────────────────────────────────────────────

async def _handle_client_message(
    websocket: WebSocket,
    manager: InterviewManager,
    msg: dict,
    gemini_live: GeminiLiveSession | None,
):
    """Handle an incoming message from the client."""
    msg_type = msg.get("type")

    if msg_type == "user_speaking":
        # User started speaking within the 10s window (text-mode fallback)
        if manager.state == "waiting":
            response = await manager.user_started_speaking()
            await websocket.send_json(response)

    elif msg_type == "speech_text":
        # Receive transcribed text chunk (text-mode fallback)
        text = msg.get("text", "")
        if text and manager.state == "listening":
            manager.receive_speech_text(text)

    elif msg_type == "audio_chunk":
        # Forward raw audio to Gemini Live for STT + processing
        audio_b64 = msg.get("data", "")
        if audio_b64 and gemini_live:
            try:
                pcm_bytes = base64.b64decode(audio_b64)
                await gemini_live.send_audio(pcm_bytes)
            except Exception as e:
                logger.error(f"[WS] Failed to decode audio chunk: {e}")

    elif msg_type == "end_interview":
        # User manually ended the interview
        end_msg = await manager.end_interview("manual")
        await websocket.send_json(end_msg)
        # Speak farewell through TTS
        if gemini_live:
            await gemini_live.send_text(end_msg["text"])

    elif msg_type == "repeat_request":
        # User asked to repeat the question
        question = manager.get_current_question()
        if question:
            q_text = question["question_text"]
            await websocket.send_json({
                "type": "question",
                "text": q_text,
                "question_id": question["id"],
                "question_index": manager.current_question_index,
                "is_repeat": True,
            })
            # Have Gemini speak the repeated question
            if gemini_live:
                await gemini_live.send_text(f"I'll repeat the question: {q_text}")
            else:
                # Text mode: start timer immediately
                timer_msg = await manager.start_waiting()
                await websocket.send_json(timer_msg)

    else:
        await websocket.send_json({
            "type": "error",
            "message": f"Unknown message type: {msg_type}",
        })


async def _deliver_next_question(
    websocket: WebSocket,
    manager: InterviewManager,
    gemini_live: GeminiLiveSession | None,
):
    """Deliver the next question to the client and start the timer."""
    question_msg = await manager.deliver_question()

    if question_msg is None:
        # No more questions — end the interview
        end_msg = await manager.end_interview("completed")
        await websocket.send_json(end_msg)
        # Speak farewell through TTS
        if gemini_live:
            await gemini_live.send_text(end_msg["text"])
        return

    await websocket.send_json(question_msg)

    if gemini_live:
        # Have Gemini speak the question via TTS
        q_text = question_msg.get("text", "")
        await gemini_live.send_text(f"Please ask the candidate: {q_text}")
        # Gemini's turn_complete callback will trigger start_waiting()
    else:
        # Text mode: simulate AI speaking with a delay, then start timer
        await asyncio.sleep(2.0)
        timer_msg = await manager.start_waiting()
        await websocket.send_json(timer_msg)


async def _handle_answer_transition(
    websocket: WebSocket,
    manager: InterviewManager,
    gemini_live: GeminiLiveSession | None,
):
    """
    Handle the transition after an answer is finalized.
    Checks for follow-up opportunity before delivering the next bank question.
    """
    # Send transition phrase
    transition = await manager.get_transition()
    await websocket.send_json(transition)
    if gemini_live:
        await gemini_live.send_text(transition["text"])
    await asyncio.sleep(1.5)

    # Check if we should ask a follow-up instead of moving to next question
    if manager.should_followup():
        followup_msg = await manager.prepare_followup()
        if followup_msg:
            await websocket.send_json(followup_msg)
            if gemini_live:
                q_text = followup_msg.get("text", "")
                await gemini_live.send_text(f"Please ask the candidate: {q_text}")
            else:
                await asyncio.sleep(2.0)
                timer_msg = await manager.start_waiting()
                await websocket.send_json(timer_msg)
            return  # Follow-up delivered, don't go to next bank question

    # No follow-up — deliver the next question from the bank
    await _deliver_next_question(websocket, manager, gemini_live)


async def _monitor_timers(
    websocket: WebSocket,
    manager: InterviewManager,
    gemini_live: GeminiLiveSession | None,
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
    waiting_since = 0  # Tracks when 'waiting' state started for 10s server-side enforcement

    try:
        while manager.state != "ended":
            await asyncio.sleep(1.0)

            # ── Check 10s initial timeout (server-side enforcement) ────────────
            if manager.state == "waiting":
                if waiting_since == 0:
                    waiting_since = time.time()
                elif (time.time() - waiting_since) >= 10.0:
                    # User didn't start speaking within 10s — skip this question
                    answer_msg = await manager.finalize_answer("initial_timeout")
                    await websocket.send_json(answer_msg)
                    waiting_since = 0

                    await _handle_answer_transition(websocket, manager, gemini_live)
            else:
                waiting_since = 0

            # ── Check 7s silence timeout ──────────────────────────────────────
            if manager.state == "listening" and manager.check_silence_timeout():
                answer_msg = await manager.finalize_answer("silence")
                await websocket.send_json(answer_msg)

                await _handle_answer_transition(websocket, manager, gemini_live)

            # ── Check 120s max duration ───────────────────────────────────────
            elif manager.state == "listening" and manager.check_max_duration():
                answer_msg = await manager.finalize_answer("max_duration")
                await websocket.send_json(answer_msg)

                await _handle_answer_transition(websocket, manager, gemini_live)

            # ── Check session time expiry ─────────────────────────────────────
            if manager.state not in ("ended", "idle"):
                info = manager.get_session_info()
                if info["remaining_seconds"] <= 0 and manager.state not in ("listening", "ended"):
                    # Session time expired and user is NOT mid-answer
                    end_msg = await manager.end_interview("timeout")
                    await websocket.send_json(end_msg)
                    # Speak farewell through TTS
                    if gemini_live:
                        await gemini_live.send_text(end_msg["text"])

            # ── Pace feedback (every 3 seconds while listening) ───────────────
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
