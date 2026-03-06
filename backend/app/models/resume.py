"""
models/resume.py — Pydantic schemas for Resume.

Structured resume JSON mirrors the Gemini-parsed output stored in MongoDB.
"""

from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


# ── Resume section schemas ────────────────────────────────────────────────────

class EducationEntry(BaseModel):
    degree: str
    institution: str
    year: Optional[str] = None
    grade: Optional[str] = None


class ExperienceEntry(BaseModel):
    company: str
    role: str
    duration: Optional[str] = None
    responsibilities: List[str] = []


class ProjectEntry(BaseModel):
    name: str
    description: str
    tech_stack: List[str] = []
    highlights: List[str] = []


class CertificationEntry(BaseModel):
    name: str
    issuer: Optional[str] = None
    year: Optional[str] = None


# ── Structured resume (Gemini-parsed output) ──────────────────────────────────

class StructuredResume(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    education: List[EducationEntry] = []
    experience: List[ExperienceEntry] = []
    projects: List[ProjectEntry] = []
    certifications: List[CertificationEntry] = []
    skills: List[str] = []


# ── API response schema ───────────────────────────────────────────────────────

class ResumeResponse(BaseModel):
    id: str
    filename: str
    upload_time: datetime
    structured_json: StructuredResume
