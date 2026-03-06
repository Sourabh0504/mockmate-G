"""
models/session.py — Pydantic schemas for Interview Session.

Covers creation, status updates, Q&A transcript entries, and full report.
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Literal
from datetime import datetime


# ── Sub-schemas ───────────────────────────────────────────────────────────────

class QuestionEntry(BaseModel):
    id: str
    module: int                          # 1 | 2 | 3
    section: str                         # opener | education | experience | project | certification | jd | followup
    question_text: str
    source: str                          # fixed | resume | jd | followup
    jd_relevance_score: Optional[float] = None


class TranscriptEntry(BaseModel):
    question_id: str
    question_text: str
    raw_answer: Optional[str] = None     # STT output before correction
    corrected_answer: Optional[str] = None  # Spell-corrected, filler words preserved
    answer_duration_sec: Optional[float] = None
    filler_word_count: Optional[int] = None
    speech_rate_wps: Optional[float] = None
    silence_duration_sec: Optional[float] = None
    ai_score: Optional[float] = None
    rule_score: Optional[float] = None
    final_score: Optional[float] = None
    ai_comment: Optional[str] = None
    ai_suggestion: Optional[str] = None
    expected_answer: Optional[str] = None


class SkillScores(BaseModel):
    technological_knowledge: Optional[float] = None
    communication: Optional[float] = None
    problem_solving: Optional[float] = None
    leadership: Optional[float] = None
    cultural_fit: Optional[float] = None


class SessionScores(BaseModel):
    overall: Optional[float] = None
    fluency: Optional[float] = None
    confidence: Optional[float] = None
    content_quality: Optional[float] = None
    skills: SkillScores = SkillScores()


class InterruptionPoint(BaseModel):
    question_id: Optional[str] = None
    module: Optional[int] = None
    remaining_time_sec: Optional[float] = None


# ── API request/response schemas ──────────────────────────────────────────────

class SessionCreate(BaseModel):
    role: str = Field(..., min_length=1, max_length=200)
    jd_text: str = Field(..., min_length=50)
    resume_id: str
    difficulty: Literal["Easy", "Moderate", "Hard"]
    duration: Literal[10, 15, 20, 25, 30]


class SessionStatus(BaseModel):
    id: str
    role: str
    status: str
    difficulty: str
    duration: int
    created_at: datetime
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    scores: Optional[SessionScores] = None
    jd_quality_warning: bool = False
    termination_type: Optional[str] = None


class SessionReport(BaseModel):
    id: str
    role: str
    jd_text: str
    difficulty: str
    duration_selected: int
    duration_actual: Optional[float] = None
    created_at: datetime
    completed_at: Optional[datetime] = None
    jd_quality_score: Optional[float] = None
    jd_quality_warning: bool = False
    jd_type: Optional[str] = None
    scores: Optional[SessionScores] = None
    summary_text: Optional[str] = None
    ai_suggestions_behavioral: List[str] = []
    ai_suggestions_technical: List[str] = []
    transcript: List[TranscriptEntry] = []
    structured_resume_snapshot: Optional[dict] = None
    total_questions_asked: int = 0
    total_questions_attempted: int = 0
