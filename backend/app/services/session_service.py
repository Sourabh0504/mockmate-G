"""
services/session_service.py — Interview session business logic.

Handles:
  - Session creation + background question bank generation
  - Session listing, retrieval, status updates
  - Post-interview evaluation orchestration
  - Rule-based scoring calculations
  - Skill analysis with JD-type weight adjustment
"""

import uuid
import asyncio
from datetime import datetime, timezone
from bson import ObjectId
from fastapi import HTTPException, status, BackgroundTasks

from app.models.session import SessionCreate
from app.services import gemini_service

# ── Skill Weights by JD Type ──────────────────────────────────────────────────

SKILL_WEIGHTS = {
    "technical": {
        "technological_knowledge": 0.40,
        "communication": 0.15,
        "problem_solving": 0.20,
        "leadership": 0.10,
        "cultural_fit": 0.15,
    },
    "managerial": {
        "technological_knowledge": 0.20,
        "communication": 0.20,
        "problem_solving": 0.15,
        "leadership": 0.25,
        "cultural_fit": 0.20,
    },
}

# ── Filler words for rule-based scoring ──────────────────────────────────────

FILLER_WORDS = {"um", "uh", "like", "you know", "sort of", "kind of", "basically", "right", "so"}


# ── Session Creation ──────────────────────────────────────────────────────────

async def create_session(data: SessionCreate, user_id: str, db, background_tasks: BackgroundTasks) -> dict:
    """
    Create a new interview session.
    Immediately returns the session doc (status: 'creating').
    Question bank generation runs in the background.
    """
    uid = ObjectId(user_id)

    # Validate resume ownership
    resume = await db["resumes"].find_one({
        "_id": ObjectId(data.resume_id),
        "user_id": uid,
    })
    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Selected resume not found.",
        )

    session_doc = {
        "user_id": uid,
        "role": data.role,                        # Stored as label only — AI never uses this
        "company": data.company,                  # Optional tag for tracking
        "jd_text": data.jd_text,
        "jd_quality_score": None,
        "jd_quality_warning": False,
        "jd_quality_message": None,
        "jd_type": None,
        "difficulty": data.difficulty,
        "duration_selected": data.duration,
        "duration_actual": None,
        "status": "creating",                     # creating → ready → live → completed/interrupted
        "created_at": datetime.now(timezone.utc),
        "started_at": None,
        "completed_at": None,
        "structured_resume_snapshot": resume["structured_json"],  # Permanent per-session copy
        "questions": [],
        "transcript": [],
        "autosave_transcript": [],
        "scores": {
            "overall": None,
            "fluency": None,
            "confidence": None,
            "content_quality": None,
            "skills": {
                "technological_knowledge": None,
                "communication": None,
                "problem_solving": None,
                "leadership": None,
                "cultural_fit": None,
            },
        },
        "summary_text": None,
        "ai_suggestions_behavioral": [],
        "ai_suggestions_technical": [],
        "termination_type": None,
        "interruption_point": None,
        "debug_data": {},
    }

    result = await db["sessions"].insert_one(session_doc)
    session_doc["_id"] = result.inserted_id
    session_id = str(result.inserted_id)

    # Queue background task for question bank generation
    background_tasks.add_task(
        _generate_question_bank_background,
        session_id=session_id,
        jd_text=data.jd_text,
        structured_resume=resume["structured_json"],
        duration=data.duration,
        db=db,
    )

    return _format_session_status(session_doc)


async def _generate_question_bank_background(
    session_id: str,
    jd_text: str,
    structured_resume: dict,
    duration: int,
    db,
):
    """
    Background task: generate full question bank after session creation.
    Updates session status to 'ready' when done.
    """
    try:
        debug_logs = {}
        # Step 1: Analyze JD quality
        jd_quality = await gemini_service.analyze_jd_quality(jd_text, debug_logs=debug_logs)

        # Step 2: Classify JD type (technical vs managerial)
        jd_type = await gemini_service.classify_jd_type(jd_text, debug_logs=debug_logs)

        # Step 3: Generate Module 1 — resume-based questions
        resume_questions_raw = await gemini_service.generate_resume_questions(structured_resume, jd_text, debug_logs=debug_logs)

        # Step 4: Generate Module 2/3 — JD-based questions
        # Number of JD questions scales with session duration
        jd_question_count = max(8, duration // 2)
        jd_questions_raw = await gemini_service.generate_jd_questions(
            jd_text, structured_resume, num_questions=jd_question_count, debug_logs=debug_logs
        )

        # Step 5: Build structured question bank
        questions = []

        # Fixed opener
        questions.append({
            "id": str(uuid.uuid4()),
            "module": 1,
            "section": "opener",
            "question_text": "Please introduce yourself.",
            "source": "fixed",
            "jd_relevance_score": None,
        })

        # Module 1 resume questions
        for q in resume_questions_raw:
            questions.append({
                "id": str(uuid.uuid4()),
                "module": 1,
                "section": q.get("section", "resume"),
                "question_text": q["question_text"],
                "source": "resume",
                "jd_relevance_score": q.get("jd_relevance_score"),
            })

        # Module 2/3 JD questions
        for q in jd_questions_raw:
            questions.append({
                "id": str(uuid.uuid4()),
                "module": 2,
                "section": "jd",
                "question_text": q["question_text"],
                "source": "jd",
                "jd_relevance_score": q.get("jd_relevance_score"),
            })

        # Step 6: Update session document
        await db["sessions"].update_one(
            {"_id": ObjectId(session_id)},
            {
                "$set": {
                    "status": "ready",
                    "jd_quality_score": jd_quality.get("quality_score"),
                    "jd_quality_warning": jd_quality.get("warning", False),
                    "jd_quality_message": jd_quality.get("message"),
                    "jd_type": jd_type,
                    "questions": questions,
                    "debug_data": debug_logs,
                }
            },
        )

    except Exception as e:
        # Mark session as failed if generation errors out
        await db["sessions"].update_one(
            {"_id": ObjectId(session_id)},
            {"$set": {"status": "failed", "error": str(e)}},
        )


# ── Session Retrieval ─────────────────────────────────────────────────────────

async def list_sessions(user_id: str, db) -> list[dict]:
    """
    List all sessions for a user in LIFO order (newest first).
    """
    uid = ObjectId(user_id)
    cursor = db["sessions"].find({"user_id": uid}).sort("created_at", -1)
    sessions = await cursor.to_list(length=100)
    return [_format_session_status(s) for s in sessions]


async def get_session(session_id: str, user_id: str, db) -> dict:
    """Get session by ID with ownership validation."""
    session = await _get_session_or_404(session_id, user_id, db)
    return _format_session_status(session)


async def get_session_report(session_id: str, user_id: str, db) -> dict:
    """Get full detailed session report. Only available for completed sessions."""
    session = await _get_session_or_404(session_id, user_id, db)

    if session["status"] not in ("completed", "interrupted"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Report is only available for completed or interrupted sessions.",
        )

    return _format_session_report(session)


# ── End Session (REST fallback) ───────────────────────────────────────────────

async def end_session(
    session_id: str,
    user_id: str,
    duration_actual: float | None,
    db,
    background_tasks: BackgroundTasks,
) -> dict:
    """
    End a live interview session via REST API.
    Marks status → 'completed', records actual duration, and queues
    post-interview evaluation as a background task.

    This is the REST fallback for ending sessions — normally, sessions
    are ended through the WebSocket by InterviewManager.end_interview().
    """
    session = await _get_session_or_404(session_id, user_id, db)

    if session["status"] not in ("live", "ready", "interrupted"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Session cannot be ended (current status: {session['status']}).",
        )

    update = {
        "status": "completed",
        "completed_at": datetime.now(timezone.utc),
        "termination_type": "manual",
    }
    if duration_actual is not None:
        update["duration_actual"] = round(duration_actual, 2)

    await db["sessions"].update_one(
        {"_id": ObjectId(session_id)},
        {"$set": update},
    )

    # Queue post-interview evaluation if there is a transcript
    if session.get("transcript"):
        background_tasks.add_task(evaluate_session, session_id, user_id, db)

    return {"message": "Session ended successfully.", "status": "completed"}


# ── Post-Interview Evaluation ─────────────────────────────────────────────────

async def evaluate_session(session_id: str, user_id: str, db):
    """
    Run full post-interview evaluation for a completed session.
    Called after interview ends (manual or time-based).
    Runs asynchronously.
    """
    session = await _get_session_or_404(session_id, user_id, db)

    if not session.get("transcript"):
        return  # Nothing to evaluate

    jd_text = session["jd_text"]
    structured_resume = session.get("structured_resume_snapshot", {})
    jd_type = session.get("jd_type", "technical")
    transcript = session["transcript"]
    debug_data = session.get("debug_data", {})

    evaluated_transcript = []

    for entry in transcript:
        raw_answer = entry.get("raw_answer", "")
        question_text = entry.get("question_text", "")

        if not raw_answer:
            entry["final_score"] = 0
            evaluated_transcript.append(entry)
            continue

        # 1. AI evaluation (on raw answer)
        ai_eval = await gemini_service.evaluate_answer(question_text, raw_answer, jd_text, debug_logs=debug_data)
        ai_score = ai_eval.get("ai_score", 0)

        # 2. Rule-based scoring
        rule_score = _calculate_rule_score(entry)

        # 3. Final hybrid score
        final_score = round((0.7 * ai_score) + (0.3 * rule_score), 2)

        # 4. Spell correction (AFTER evaluation)
        corrected_answer = await gemini_service.spell_correct_transcript(raw_answer, debug_logs=debug_data)

        # 5. Per-question feedback
        feedback = await gemini_service.generate_question_feedback(question_text, corrected_answer, ai_score, debug_logs=debug_data)

        # 6. Expected answer (JD + resume aligned)
        expected_answer = await gemini_service.generate_expected_answer(question_text, jd_text, structured_resume, debug_logs=debug_data)

        entry.update({
            "corrected_answer": corrected_answer,
            "ai_score": ai_score,
            "rule_score": rule_score,
            "final_score": final_score,
            "ai_comment": feedback.get("comment"),
            "ai_suggestion": feedback.get("suggestion"),
            "expected_answer": expected_answer,
        })
        evaluated_transcript.append(entry)

    # Aggregate overall metrics
    scores = _aggregate_scores(evaluated_transcript, jd_type)

    # Generate interview summary and AI suggestions
    summary_result = await gemini_service.generate_interview_summary(
        transcript=evaluated_transcript,
        scores=scores,
        jd_text=jd_text,
        debug_logs=debug_data,
    )

    # Update session with evaluation results
    await db["sessions"].update_one(
        {"_id": ObjectId(session_id)},
        {
            "$set": {
                "transcript": evaluated_transcript,
                "scores": scores,
                "summary_text": summary_result.get("summary_text"),
                "ai_suggestions_behavioral": summary_result.get("ai_suggestions_behavioral", []),
                "ai_suggestions_technical": summary_result.get("ai_suggestions_technical", []),
                "debug_data": debug_data,
            }
        },
    )


# ── Scoring Helpers ───────────────────────────────────────────────────────────

def _calculate_rule_score(transcript_entry: dict) -> float:
    """
    Calculate rule-based score (0–100) from transcript metadata.

    Factors:
    - Filler word count (lower is better)
    - Silence duration (moderate is ideal)
    - Speech rate (2.5–4 wps is ideal)
    - Answer length (appropriate for question type)
    """
    score = 100.0

    # Filler word penalty (each filler word deducts points, capped at -40)
    filler_count = transcript_entry.get("filler_word_count", 0)
    filler_penalty = min(filler_count * 3, 40)
    score -= filler_penalty

    # Silence penalty
    silence_sec = transcript_entry.get("silence_duration_sec", 0)
    if silence_sec > 10:
        score -= min((silence_sec - 10) * 2, 20)

    # Speech rate penalty
    wps = transcript_entry.get("speech_rate_wps", 3.0)
    if wps < 2.0 or wps > 5.0:
        score -= 15
    elif wps < 2.5 or wps > 4.0:
        score -= 5

    return max(0, round(score, 2))


def _aggregate_scores(transcript: list[dict], jd_type: str) -> dict:
    """
    Aggregate per-question scores into overall metrics and skill scores.
    Applies JD-type weight adjustments for skill analysis.
    """
    if not transcript:
        return {}

    answered = [e for e in transcript if e.get("final_score") is not None]
    if not answered:
        return {}

    # Overall scores
    overall = round(sum(e["final_score"] for e in answered) / len(answered), 2)

    ai_scores = [e.get("ai_score", 0) for e in answered]
    rule_scores = [e.get("rule_score", 0) for e in answered]
    filler_counts = [e.get("filler_word_count", 0) for e in answered]
    wps_values = [e.get("speech_rate_wps", 3.0) for e in answered if e.get("speech_rate_wps")]

    content_quality = round(sum(ai_scores) / len(ai_scores), 2)

    # Fluency: inversely related to filler words and irregular speech rate
    avg_fillers = sum(filler_counts) / len(filler_counts)
    fluency = max(0, round(100 - (avg_fillers * 5), 2))

    # Confidence: based on rule scores (silence, pace, filler pattern)
    confidence = round(sum(rule_scores) / len(rule_scores), 2)

    # Skill scores: weighted average of relevant answers
    # Simple heuristic: distribute scores across skills using JD-type weights
    weights = SKILL_WEIGHTS.get(jd_type, SKILL_WEIGHTS["technical"])
    skill_base = overall  # Foundation

    skills = {
        "technological_knowledge": round(skill_base * (0.8 + weights["technological_knowledge"] * 0.2), 2),
        "communication": round(fluency * (0.5) + content_quality * weights["communication"], 2),
        "problem_solving": round(content_quality * (0.5 + weights["problem_solving"]), 2),
        "leadership": round(skill_base * weights["leadership"] * 2, 2),
        "cultural_fit": round(confidence * weights["cultural_fit"] * 2, 2),
    }
    # Clamp all skill scores to 0-100
    skills = {k: min(100, max(0, v)) for k, v in skills.items()}

    return {
        "overall": overall,
        "fluency": fluency,
        "confidence": confidence,
        "content_quality": content_quality,
        "skills": skills,
    }


# ── Helpers ───────────────────────────────────────────────────────────────────

async def _get_session_or_404(session_id: str, user_id: str, db) -> dict:
    session = await db["sessions"].find_one({
        "_id": ObjectId(session_id),
        "user_id": ObjectId(user_id),
    })
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found.",
        )
    return session


def _format_session_status(doc: dict) -> dict:
    """Format session for list/status responses (minimal data)."""
    return {
        "id": str(doc["_id"]),
        "role": doc.get("role"),
        "company": doc.get("company"),
        "status": doc.get("status"),
        "difficulty": doc.get("difficulty"),
        "duration_selected": doc.get("duration_selected"),
        "created_at": doc.get("created_at"),
        "started_at": doc.get("started_at"),
        "completed_at": doc.get("completed_at"),
        "scores": doc.get("scores"),
        "jd_quality_warning": doc.get("jd_quality_warning", False),
        "jd_quality_message": doc.get("jd_quality_message"),
        "termination_type": doc.get("termination_type"),
    }


def _format_session_report(doc: dict) -> dict:
    """Format session for detailed report response."""
    transcript = doc.get("transcript", [])
    attempted = [e for e in transcript if e.get("corrected_answer")]

    return {
        "id": str(doc["_id"]),
        "role": doc.get("role"),
        "company": doc.get("company"),
        "jd_text": doc.get("jd_text"),
        "difficulty": doc.get("difficulty"),
        "duration_selected": doc.get("duration_selected"),
        "duration_actual": doc.get("duration_actual"),
        "created_at": doc.get("created_at"),
        "completed_at": doc.get("completed_at"),
        "jd_quality_score": doc.get("jd_quality_score"),
        "jd_quality_warning": doc.get("jd_quality_warning", False),
        "jd_type": doc.get("jd_type"),
        "scores": doc.get("scores"),
        "summary_text": doc.get("summary_text"),
        "ai_suggestions_behavioral": doc.get("ai_suggestions_behavioral", []),
        "ai_suggestions_technical": doc.get("ai_suggestions_technical", []),
        "transcript": transcript,
        "structured_resume_snapshot": doc.get("structured_resume_snapshot"),
        "total_questions_asked": len(transcript),
        "total_questions_attempted": len(attempted),
    }
