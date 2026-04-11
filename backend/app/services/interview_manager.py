"""
services/interview_manager.py — Core state machine for a single live interview.

Manages the lifecycle of one interview session over WebSocket:
  - Question delivery (Module 1 → Module 2/3, with follow-ups)
  - Timer tracking (session timer, per-question timers)
  - Transcript accumulation and periodic auto-save
  - Answer finalization (silence timeout, max duration, manual skip)
  - Session completion and handoff to evaluation pipeline

One InterviewManager instance is created per active WebSocket connection.
"""

import asyncio
import time
import random
import logging
from datetime import datetime, timezone
from bson import ObjectId
from app.services import gemini_service

logger = logging.getLogger("interview_manager")

# Must match session_service.py FILLER_WORDS
FILLER_WORDS = ("um", "uh", "like", "you know", "sort of", "kind of", "basically", "right", "so")


class InterviewManager:
    """
    State machine for a single live interview session.

    States:
        greeting    → AI is delivering initial greeting / speaking a question
        waiting     → Waiting for user to start speaking (10s countdown)
        listening   → User is speaking (7s silence detection, 120s max)
        transitioning → AI speaking transition phrase, preparing next question
        ended       → Interview has concluded (normal, manual, or timeout)
    """

    def __init__(self, session_doc: dict, db):
        self.db = db
        self.session_id = str(session_doc["_id"])
        self.user_id = str(session_doc["user_id"])
        self.user_name = None  # Set externally after loading user

        # Session metadata
        self.role = session_doc.get("role", "")
        self.company = session_doc.get("company", "")
        self.jd_text = session_doc.get("jd_text", "")
        self.jd_type = session_doc.get("jd_type", "technical")
        self.difficulty = session_doc.get("difficulty", "Moderate")
        self.duration_minutes = session_doc.get("duration_selected", 20)
        self.structured_resume = session_doc.get("structured_resume_snapshot", {})

        # Question bank (pre-generated during session creation)
        self.questions = session_doc.get("questions", [])

        # Interview state
        self.state = "idle"  # idle → greeting → waiting → listening → transitioning → ended
        self.current_question_index = 0
        self.current_module = 1  # 1, 2, or 3

        # Timer tracking
        self.session_start_time = None
        self.session_elapsed_sec = 0.0
        self.module1_time_sec = 0.0  # 35% of duration
        self.module23_time_sec = 0.0  # 65% of duration
        self.answer_start_time = None
        self.last_speech_time = None

        # Transcript
        self.transcript = []
        self.current_answer_chunks = []  # Accumulates STT text chunks for current answer
        self.silence_gaps = []           # Silence durations (>1.5s gaps between speech chunks)
        self.last_autosave_time = None

        # Follow-up tracking (max 2 per topic)
        self.followup_counts = {}  # question_id → count
        self.pending_followup = None  # If set, deliver this instead of next bank question

        # Pending action after next tts_done (event-driven turn management)
        # Values: None | "start_waiting" | "deliver_question" | "deliver_followup"
        self.pending_action = None

        # Audio buffer — accumulates raw float32 PCM bytes from browser AudioWorklet.
        # Cleared after each Whisper transcription and after tts_done.
        self.audio_buffer: bytes = b""

        # Completion tracking
        self.termination_type = None  # "normal" | "manual" | "network_failure"
        self.interruption_point = None

        # Calculate time budgets
        total_seconds = self.duration_minutes * 60
        self.module1_budget = total_seconds * 0.35
        self.module23_budget = total_seconds * 0.65
        self.total_budget = total_seconds

        # Track which questions are module 1 vs 2/3
        self.module1_questions = [q for q in self.questions if q.get("module") == 1]
        self.module2_questions = [q for q in self.questions if q.get("module") in (2, 3)]

        # Count name usage (used in greeting + 2-3 random times)
        self.name_usage_count = 0
        self.max_name_usage = 4  # greeting + 3 during interview

        # Repeat request detection keywords
        self._repeat_phrases = (
            "repeat", "say again", "say that again", "come again",
            "didn't catch", "didn't get that", "one more time",
            "can you repeat", "could you repeat", "pardon",
            "what was the question", "what did you say",
        )

    # ── Session Lifecycle ─────────────────────────────────────────────────────

    async def start(self) -> dict:
        """
        Initialize the interview session.
        Returns the greeting message to send to the client.
        """
        self.state = "greeting"
        self.session_start_time = time.time()
        self.last_autosave_time = time.time()

        # Update session status in DB
        await self.db["sessions"].update_one(
            {"_id": ObjectId(self.session_id)},
            {
                "$set": {
                    "status": "live",
                    "started_at": datetime.now(timezone.utc),
                }
            },
        )

        # Build greeting text (does NOT include Q0 — that's delivered separately)
        name_part = f", {self.user_name}" if self.user_name else ""
        greeting_text = (
            f"Hello{name_part}. Welcome to your mock interview. "
            f"I'll be your interviewer today. Let's get started."
        )
        self.name_usage_count += 1

        logger.info(f"[{self.session_id}] Interview started. {len(self.questions)} questions in bank.")

        return {
            "type": "greeting",
            "text": greeting_text,
            "question_index": 0,
            "total_questions": len(self.questions),
        }

    def get_current_question(self) -> dict | None:
        """Get the current question from the bank."""
        if self.pending_followup:
            return self.pending_followup
        if self.current_question_index < len(self.questions):
            return self.questions[self.current_question_index]
        return None

    async def deliver_question(self) -> dict | None:
        """
        Prepare the next question for delivery.
        Returns the question message dict, or None if interview should end.
        """
        # Check if session time has expired
        elapsed = time.time() - self.session_start_time
        if elapsed >= self.total_budget:
            return None  # Signal that interview should end

        # Check module transition
        if self.current_module == 1 and elapsed >= self.module1_budget:
            self.current_module = 2
            # Skip remaining module 1 questions
            while (
                self.current_question_index < len(self.questions)
                and self.questions[self.current_question_index].get("module") == 1
            ):
                self.current_question_index += 1

        question = self.get_current_question()
        if question is None:
            return None  # No more questions

        self.state = "greeting"  # AI is speaking the question

        return {
            "type": "question",
            "text": question["question_text"],
            "question_id": question["id"],
            "question_index": self.current_question_index,
            "module": question.get("module", 1),
            "section": question.get("section", ""),
            "total_questions": len(self.questions),
        }

    async def start_waiting(self) -> dict:
        """
        AI has finished speaking the question.
        Start the 10-second countdown for user to begin speaking.
        """
        self.state = "waiting"
        self.answer_start_time = None
        self.current_answer_chunks = []

        return {
            "type": "start_timer",
            "timer_type": "initial",
            "seconds": 10,
        }

    async def user_started_speaking(self) -> dict:
        """
        User began speaking within the 10-second window.
        Switch to listening mode.
        """
        self.state = "listening"
        self.answer_start_time = time.time()
        self.last_speech_time = time.time()

        return {
            "type": "listening",
        }

    def receive_speech_text(self, text: str):
        """
        Receive a chunk of STT text for the current answer.
        Updates last_speech_time for silence detection.
        Tracks silence gaps between speech chunks.
        """
        if text.strip():
            now = time.time()
            # Track silence gap (> 1.5s between chunks counts as silence)
            if self.last_speech_time is not None:
                gap = now - self.last_speech_time
                if gap > 1.5:
                    self.silence_gaps.append(gap)
            self.current_answer_chunks.append(text.strip())
            self.last_speech_time = now

    def check_silence_timeout(self) -> bool:
        """
        Check if 7 seconds of silence have passed since last speech.
        Returns True if answer should be finalized due to silence.
        """
        if self.state != "listening" or self.last_speech_time is None:
            return False
        return (time.time() - self.last_speech_time) >= 7.0

    def check_max_duration(self) -> bool:
        """
        Check if the user has been speaking for 120 seconds.
        Returns True if answer should be finalized due to max duration.
        """
        if self.state != "listening" or self.answer_start_time is None:
            return False
        return (time.time() - self.answer_start_time) >= 120.0

    async def finalize_answer(self, reason: str = "silence") -> dict:
        """
        Finalize the current answer and create a transcript entry.
        reason: "silence" | "max_duration" | "initial_timeout" | "manual"
        """
        question = self.get_current_question()
        if question is None:
            return {"type": "error", "message": "No active question"}

        # Combine all STT chunks into full answer
        raw_answer = " ".join(self.current_answer_chunks) if self.current_answer_chunks else ""
        answer_duration = (time.time() - self.answer_start_time) if self.answer_start_time else 0

        # Calculate speech metrics
        word_count = len(raw_answer.split()) if raw_answer else 0
        speech_rate_wps = (word_count / answer_duration) if answer_duration > 0 else 0

        # Count filler words (synced with session_service.py FILLER_WORDS)
        filler_count = 0
        answer_lower = raw_answer.lower()
        for filler in FILLER_WORDS:
            filler_count += answer_lower.count(filler)

        # Build transcript entry (matches session model TranscriptEntry)
        transcript_entry = {
            "question_id": question["id"],
            "question_text": question["question_text"],
            "section": question.get("section", ""),
            "raw_answer": raw_answer,
            "corrected_answer": None,  # Filled during post-interview evaluation
            "answer_duration_sec": round(answer_duration, 2),
            "filler_word_count": filler_count,
            "speech_rate_wps": round(speech_rate_wps, 2),
            "silence_duration_sec": round(sum(self.silence_gaps), 2),
            "ai_score": None,      # Filled during evaluation
            "rule_score": None,    # Filled during evaluation
            "final_score": None,   # Filled during evaluation
            "ai_comment": None,    # Filled during evaluation
            "ai_suggestion": None, # Filled during evaluation
            "expected_answer": None,  # Filled during evaluation
        }

        self.transcript.append(transcript_entry)

        # Clear current answer state
        self.current_answer_chunks = []
        self.silence_gaps = []
        self.answer_start_time = None
        self.last_speech_time = None
        self.state = "transitioning"

        # Move to next question
        if self.pending_followup:
            self.pending_followup = None
        else:
            self.current_question_index += 1

        logger.info(
            f"[{self.session_id}] Answer finalized for Q{len(self.transcript)} "
            f"({reason}): {word_count} words, {answer_duration:.1f}s"
        )

        return {
            "type": "answer_finalized",
            "reason": reason,
            "word_count": word_count,
            "duration_sec": round(answer_duration, 2),
            "question_index": self.current_question_index - 1,
        }

    # ── Follow-up Logic ──────────────────────────────────────────────────────

    def should_followup(self) -> bool:
        """
        Decide if a follow-up question should be asked after the last answer.
        Criteria:
          - Only in Module 2/3 (not Module 1 resume questions)
          - Max 2 follow-ups per original question
          - Answer must be substantial (> 20 words)
          - ~40% chance per eligible answer (to feel natural, not every time)
          - Don't follow-up on skipped questions (initial_timeout)
        """
        if not self.transcript:
            return False

        last_entry = self.transcript[-1]
        q_id = last_entry["question_id"]
        raw_answer = last_entry.get("raw_answer", "")

        # Only follow up in Module 2/3
        current_q = None
        for q in self.questions:
            if q["id"] == q_id:
                current_q = q
                break

        if not current_q or current_q.get("module") == 1:
            return False

        # Skip if answer was empty / too short (likely a timeout skip)
        if len(raw_answer.split()) < 20:
            return False

        # Max 2 follow-ups per original question
        if self.followup_counts.get(q_id, 0) >= 2:
            return False

        # Check time budget — don't follow up if running low
        elapsed = time.time() - self.session_start_time
        if elapsed >= self.total_budget * 0.85:
            return False

        # 40% chance (random) to feel natural
        return random.random() < 0.4

    async def prepare_followup(self) -> dict | None:
        """
        Generate and queue a follow-up question based on the last answer.
        Returns the follow-up question message dict, or None if generation failed.
        """
        if not self.transcript:
            return None

        last_entry = self.transcript[-1]
        q_id = last_entry["question_id"]
        q_text = last_entry["question_text"]
        raw_answer = last_entry.get("raw_answer", "")

        try:
            followup_text = await gemini_service.generate_followup_question(
                question=q_text,
                answer=raw_answer,
                jd_text=self.jd_text,
            )
        except Exception as e:
            logger.error(f"[{self.session_id}] Follow-up generation failed: {e}")
            return None

        # Create the follow-up question object
        followup_q = {
            "id": f"{q_id}_followup_{self.followup_counts.get(q_id, 0) + 1}",
            "question_text": followup_text,
            "module": 2,
            "section": "follow_up",
            "is_followup": True,
            "parent_question_id": q_id,
        }

        self.pending_followup = followup_q
        self.followup_counts[q_id] = self.followup_counts.get(q_id, 0) + 1

        self.state = "greeting"  # AI is speaking the follow-up

        logger.info(f"[{self.session_id}] Follow-up #{self.followup_counts[q_id]} for {q_id}: {followup_text[:60]}...")

        return {
            "type": "question",
            "text": followup_text,
            "question_id": followup_q["id"],
            "question_index": self.current_question_index,
            "module": 2,
            "section": "follow_up",
            "is_followup": True,
            "total_questions": len(self.questions),
        }

    # ── Repeat Request Detection ─────────────────────────────────────────────

    def check_repeat_request(self, text: str) -> bool:
        """
        Check if the user's STT transcription contains a repeat request.
        e.g., "Can you repeat that?", "Say that again", etc.
        Only triggers if the entire response is short (< 15 words)
        to avoid false positives in longer answers.
        """
        text_lower = text.lower().strip()
        words = text_lower.split()

        # Only detect repeats in short utterances (not mid-answer)
        if len(words) > 15:
            return False

        return any(phrase in text_lower for phrase in self._repeat_phrases)

    async def get_transition(self) -> dict:
        """
        Get a transition phrase for the AI to say between questions.
        """
        transitions = [
            "Alright.",
            "I understand.",
            "Let's move forward.",
            "I see.",
            "Good.",
            "Thank you for that.",
            "Okay, let's continue.",
        ]

        return {
            "type": "transition",
            "text": random.choice(transitions),
        }

    async def end_interview(self, reason: str = "normal") -> dict:
        """
        End the interview session.
        reason: "completed" | "manual" | "timeout" | "network_failure"
        """
        self.state = "ended"
        self.termination_type = reason

        duration_actual = (time.time() - self.session_start_time) if self.session_start_time else 0

        # Save final transcript to DB
        await self.db["sessions"].update_one(
            {"_id": ObjectId(self.session_id)},
            {
                "$set": {
                    "status": "completed",
                    "completed_at": datetime.now(timezone.utc),
                    "duration_actual": round(duration_actual / 60, 2),  # in minutes
                    "transcript": self.transcript,
                    "termination_type": reason,
                }
            },
        )

        # Build farewell text
        name_part = f", {self.user_name}" if self.user_name else ""
        if reason == "manual":
            farewell = f"Thank you{name_part}. The interview has been ended early. Your responses will still be evaluated."
        elif reason == "timeout":
            farewell = f"That's all the time we have{name_part}. Thank you for your time. Let me finish processing this last answer."
        else:
            farewell = f"Thank you for your time{name_part}. This concludes our interview. Your detailed report will be ready shortly."

        logger.info(
            f"[{self.session_id}] Interview ended ({reason}). "
            f"{len(self.transcript)} answers, {duration_actual:.0f}s"
        )

        return {
            "type": "interview_ended",
            "reason": reason,
            "text": farewell,
            "total_answers": len(self.transcript),
            "duration_minutes": round(duration_actual / 60, 1),
        }

    # ── Auto-Save ─────────────────────────────────────────────────────────────

    async def autosave_if_needed(self):
        """Save transcript to DB every 20 seconds."""
        if self.last_autosave_time and (time.time() - self.last_autosave_time) >= 20:
            await self.db["sessions"].update_one(
                {"_id": ObjectId(self.session_id)},
                {
                    "$set": {
                        "autosave_transcript": self.transcript,
                    }
                },
            )
            self.last_autosave_time = time.time()
            logger.debug(f"[{self.session_id}] Auto-saved transcript ({len(self.transcript)} entries)")

    # ── Network Interruption ──────────────────────────────────────────────────

    async def save_interruption_state(self):
        """
        Save current state for potential session resume after network failure.
        """
        elapsed = time.time() - self.session_start_time if self.session_start_time else 0
        remaining = max(0, self.total_budget - elapsed)

        current_q = self.get_current_question()
        self.interruption_point = {
            "question_id": current_q["id"] if current_q else None,
            "question_index": self.current_question_index,
            "module": self.current_module,
            "remaining_time_sec": round(remaining, 2),
            "transcript_so_far": len(self.transcript),
        }

        await self.db["sessions"].update_one(
            {"_id": ObjectId(self.session_id)},
            {
                "$set": {
                    "status": "interrupted",
                    "transcript": self.transcript,
                    "autosave_transcript": self.transcript,
                    "interruption_point": self.interruption_point,
                }
            },
        )

        logger.info(f"[{self.session_id}] Interruption state saved at Q{self.current_question_index}")

    def restore_from_interruption(self, interruption_point: dict):
        """
        Restore interview state from a saved interruption point.
        """
        self.current_question_index = interruption_point.get("question_index", 0)
        self.current_module = interruption_point.get("module", 1)

        # Adjust session time to account for time already spent
        remaining = interruption_point.get("remaining_time_sec", self.total_budget)
        self.total_budget = remaining
        self.module1_budget = min(self.module1_budget, remaining * 0.35)
        self.module23_budget = min(self.module23_budget, remaining * 0.65)

        logger.info(
            f"[{self.session_id}] Restored from interruption at Q{self.current_question_index}, "
            f"{remaining:.0f}s remaining"
        )

    # ── Pace Feedback ─────────────────────────────────────────────────────────

    def get_pace_feedback(self) -> str | None:
        """
        Calculate speaking pace feedback based on recent STT data.
        Returns: "good" | "too_fast" | "too_slow" | None
        """
        if self.state != "listening" or not self.current_answer_chunks:
            return None

        if self.answer_start_time is None:
            return None

        elapsed = time.time() - self.answer_start_time
        if elapsed < 3:
            return None  # Too early to judge

        total_words = sum(len(chunk.split()) for chunk in self.current_answer_chunks)
        wps = total_words / elapsed

        if wps > 4.0:
            return "too_fast"
        elif wps < 1.5:
            return "too_slow"
        else:
            return "good"

    # ── Session Info ──────────────────────────────────────────────────────────

    def get_session_info(self) -> dict:
        """Return current session state for status queries."""
        elapsed = (time.time() - self.session_start_time) if self.session_start_time else 0
        remaining = max(0, self.total_budget - elapsed)

        return {
            "state": self.state,
            "question_index": self.current_question_index,
            "total_questions": len(self.questions),
            "module": self.current_module,
            "elapsed_seconds": round(elapsed, 1),
            "remaining_seconds": round(remaining, 1),
            "answers_recorded": len(self.transcript),
        }
