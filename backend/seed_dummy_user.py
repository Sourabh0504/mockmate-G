"""
seed_dummy_user.py - One-time seed script.

Creates demo user 'Sourabh Chaudhari' with:
  - Email: connect@sourabhchaudhari.com
  - Password: mockmate@123 (bcrypt-hashed, same as app auth)
  - 1 resume (from Lovable DUMMY_RESUME)
  - 6 interview sessions (from Lovable DUMMY_SESSIONS)
  - Full reports for sessions 1 & 2

Usage:
    cd backend
    python seed_dummy_user.py

Safe to re-run - idempotent (skips already-existing data).
"""

import os
import sys
from datetime import datetime, timezone, timedelta

import bcrypt
from bson import ObjectId
from pymongo import MongoClient
from dotenv import load_dotenv

# Fix Windows encoding for print statements
sys.stdout.reconfigure(encoding='utf-8')

# Load .env
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
MONGODB_DB  = os.getenv("MONGODB_DB_NAME", "mockmate")

USER_EMAIL    = "connect@sourabhchaudhari.com"
USER_PASSWORD = "mockmate@123"
USER_NAME     = "Sourabh Chaudhari"

# Connect
client = MongoClient(MONGODB_URI)
db     = client[MONGODB_DB]
print(f"[DB] Connected to {MONGODB_DB}")


# ==============================================================================
# STEP 1 - Create user (same logic as auth_service.register_user)
# ==============================================================================
existing_user = db["users"].find_one({"email": USER_EMAIL})
if existing_user:
    user_id = existing_user["_id"]
    print(f"[SKIP] User already exists (id: {user_id})")
else:
    hashed = bcrypt.hashpw(USER_PASSWORD.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    user_doc = {
        "name":                   USER_NAME,
        "email":                  USER_EMAIL,
        "password_hash":          hashed,
        "created_at":             datetime.now(timezone.utc),
        "data_retention_consent": False,
    }
    result  = db["users"].insert_one(user_doc)
    user_id = result.inserted_id
    print(f"[OK] User created: {USER_EMAIL}  (id: {user_id})")


# ==============================================================================
# STEP 2 - Insert resume
# Field mapping: Lovable DUMMY_RESUME -> StructuredResume schema
#   education[].gpa       -> grade
#   experience[].title    -> role
#   experience[].bullets  -> responsibilities
#   skills (dict)         -> flat list of strings
# ==============================================================================
existing_resume = db["resumes"].find_one({"user_id": user_id})
if existing_resume:
    resume_id = existing_resume["_id"]
    print(f"[SKIP] Resume already exists (id: {resume_id})")
else:
    structured_json = {
        "name":  USER_NAME,
        "email": USER_EMAIL,
        "phone": "+91 98765 43210",
        "education": [
            {
                "degree":      "M.S. Computer Science",
                "institution": "Stanford University",
                "year":        "2022",
                "grade":       "3.9 GPA",
            },
            {
                "degree":      "B.Tech Information Technology",
                "institution": "MIT",
                "year":        "2020",
                "grade":       "3.8 GPA",
            },
        ],
        "experience": [
            {
                "company":          "Google",
                "role":             "Software Engineer II",
                "duration":         "2022 - Present",
                "responsibilities": [
                    "Led frontend architecture migration to React 18 with concurrent features",
                    "Reduced page load time by 40% through code splitting and lazy loading",
                    "Mentored 3 junior developers on TypeScript best practices",
                ],
            },
            {
                "company":          "Meta",
                "role":             "Software Engineering Intern",
                "duration":         "Summer 2021",
                "responsibilities": [
                    "Built real-time notification system handling 10K+ events/second",
                    "Implemented A/B testing framework for news feed ranking",
                ],
            },
        ],
        "projects": [
            {
                "name":        "AI Code Reviewer",
                "description": "Automated code review tool using GPT-4 for pull request analysis",
                "tech_stack":  ["Python", "OpenAI API", "GitHub Actions", "FastAPI"],
                "highlights":  [],
            },
            {
                "name":        "Real-time Collaboration Editor",
                "description": "Google Docs-like editor with CRDT-based conflict resolution",
                "tech_stack":  ["React", "TypeScript", "WebSocket", "Yjs"],
                "highlights":  [],
            },
            {
                "name":        "Cloud Cost Optimizer",
                "description": "Dashboard for AWS cost analysis and optimization recommendations",
                "tech_stack":  ["Next.js", "D3.js", "AWS SDK", "PostgreSQL"],
                "highlights":  [],
            },
        ],
        "certifications": [
            {"name": "AWS Solutions Architect Associate", "issuer": "Amazon", "year": "2023"},
            {"name": "Google Cloud Professional Developer", "issuer": "Google",  "year": "2023"},
        ],
        "skills": [
            "JavaScript", "TypeScript", "Python", "Go", "Java",
            "React", "Next.js", "Node.js", "FastAPI", "Express",
            "Docker", "Kubernetes", "AWS", "GCP", "Terraform",
            "PostgreSQL", "MongoDB", "Redis", "DynamoDB",
        ],
    }

    resume_doc = {
        "user_id":         user_id,
        "filename":        "Sourabh_Chaudhari_Resume.pdf",
        "upload_time":     datetime.now(timezone.utc),
        "structured_json": structured_json,
    }
    result    = db["resumes"].insert_one(resume_doc)
    resume_id = result.inserted_id
    print(f"[OK] Resume inserted (id: {resume_id})")


# ==============================================================================
# Helper - build transcript entry from question dict
# Maps Lovable question -> TranscriptEntry schema
# ==============================================================================
def make_transcript_entry(q):
    return {
        "question_id":          str(ObjectId()),
        "question_text":        q["questionText"],
        "raw_answer":           q["userAnswer"],
        "corrected_answer":     q["userAnswer"],
        "answer_duration_sec":  None,
        "filler_word_count":    None,
        "speech_rate_wps":      None,
        "silence_duration_sec": None,
        "ai_score":             q["score"] * 10,  # Lovable: /10 -> our schema: /100
        "rule_score":           None,
        "final_score":          q["score"] * 10,
        "ai_comment":           q["comment"],
        "ai_suggestion":        q["suggestion"],
        "expected_answer":      q["expectedAnswer"],
        "section":              q["section"],
    }


# ==============================================================================
# STEP 3 - Insert 6 sessions from Lovable DUMMY_SESSIONS
# ==============================================================================
NOW = datetime.now(timezone.utc)

SESSIONS = [
    # sess_001: Senior Frontend Developer - COMPLETED (score 85)
    {
        "role":                     "Senior Frontend Developer",
        "status":                   "completed",
        "difficulty":               "Hard",
        "duration_selected":        15,
        "created_at":               NOW - timedelta(hours=2),
        "started_at":               NOW - timedelta(hours=1, minutes=55),
        "completed_at":             NOW - timedelta(hours=1),
        "jd_text":                  "Looking for a Senior Frontend Developer with 5+ years of React experience...",
        "jd_quality_warning":       False,
        "jd_quality_score":         0.88,
        "jd_type":                  "tech",
        "duration_actual":          14.5,
        "total_questions_asked":    5,
        "total_questions_attempted":5,
        "scores": {
            "overall":         85,
            "fluency":         82,
            "content_quality": 88,
            "confidence":      79,
            "skills": {
                "technological_knowledge": 88,
                "communication":           82,
                "problem_solving":         85,
                "leadership":              68,
                "cultural_fit":            80,
            },
        },
        "summary_text": (
            "Sourabh demonstrated strong technical knowledge and excellent communication skills. "
            "His answers on React architecture and state management were particularly impressive. "
            "Areas for improvement include providing more structured responses to behavioral questions "
            "and showcasing leadership experience more effectively."
        ),
        "ai_suggestions_behavioral": [
            "Use the STAR method (Situation, Task, Action, Result) for all behavioral questions",
            "Prepare 3-4 concrete examples of conflict resolution in team settings",
            "Practice articulating your decision-making process more clearly",
        ],
        "ai_suggestions_technical": [
            "Deep dive into system design patterns for large-scale applications",
            "Review advanced TypeScript patterns like conditional types and mapped types",
            "Practice explaining complex concepts in simple terms for non-technical stakeholders",
        ],
        "transcript": [
            make_transcript_entry({
                "questionText":  "Explain the virtual DOM in React and how reconciliation works.",
                "userAnswer":    "The virtual DOM is an in-memory representation of the real DOM. When state changes, React creates a new virtual DOM tree and diffs it with the previous one using a reconciliation algorithm. The fiber architecture allows React to pause and resume work.",
                "score":         9,
                "comment":       "Excellent explanation covering key concepts including fiber architecture.",
                "suggestion":    "Could mention the heuristic assumptions React makes during diffing.",
                "expectedAnswer":"The Virtual DOM is a lightweight JavaScript representation of the actual DOM. React maintains two virtual DOM trees and diffs them with O(n) complexity. The Fiber architecture enables incremental rendering by breaking work into units.",
                "section":       "Technical",
            }),
            make_transcript_entry({
                "questionText":  "Tell me about a time you had to deal with a difficult team member.",
                "userAnswer":    "At Google, I worked with a colleague who dismissed code review feedback. I scheduled a 1-on-1 and we agreed on a clearer review process. The relationship improved significantly.",
                "score":         7,
                "comment":       "Good real example but could use more structure. The resolution was somewhat vague.",
                "suggestion":    "Apply the STAR method - clearly separate Situation, Task, Action, and Result with measurable outcomes.",
                "expectedAnswer":"A strong answer would follow STAR with quantifiable results (improved turnaround by X%, positive feedback from team).",
                "section":       "Behavioral",
            }),
            make_transcript_entry({
                "questionText":  "How would you design a real-time collaborative text editor?",
                "userAnswer":    "I would use CRDTs like Yjs for conflict-free collaboration with a WebSocket server for real-time syncing and a PostgreSQL persistence layer.",
                "score":         8,
                "comment":       "Strong answer with practical experience. Good mention of CRDTs.",
                "suggestion":    "Discuss trade-offs between OT and CRDT approaches and scaling considerations.",
                "expectedAnswer":"Key components: CRDT vs OT conflict resolution, WebSocket communication, event sourcing persistence, cursor awareness, and scaling strategy.",
                "section":       "Technical",
            }),
            make_transcript_entry({
                "questionText":  "Your team finds a critical bug 2 hours before launch. What do you do?",
                "userAnswer":    "Assess severity, set up a war room, assign to the most familiar developer, and communicate the delay to stakeholders with a revised timeline.",
                "score":         8,
                "comment":       "Solid crisis management approach with clear prioritization.",
                "suggestion":    "Mention rollback strategies, monitoring after fix, and post-mortem processes.",
                "expectedAnswer":"1) Assess severity, 2) Communicate to stakeholders, 3) Decide hotfix vs delay, 4) Deploy with monitoring, 5) Conduct post-mortem.",
                "section":       "Situational",
            }),
            make_transcript_entry({
                "questionText":  "Explain the differences between REST and GraphQL and when you would choose each.",
                "userAnswer":    "REST uses fixed endpoints with HTTP caching. GraphQL has a single endpoint with flexible client-specified queries, reducing over-fetching for complex UIs.",
                "score":         9,
                "comment":       "Comprehensive comparison with practical decision-making framework.",
                "suggestion":    "Could mention specific caching strategies for GraphQL like Apollo cache.",
                "expectedAnswer":"REST: resource-based URLs, HTTP verbs, excellent caching. GraphQL: single endpoint, client queries, strong typing. Choose based on data complexity and client needs.",
                "section":       "Technical",
            }),
        ],
        "structured_resume_snapshot": {
            "name":  USER_NAME,
            "email": USER_EMAIL,
            "skills": ["JavaScript", "TypeScript", "Python", "React", "Next.js", "FastAPI", "Docker", "AWS"],
        },
    },

    # sess_002: Full Stack Engineer - COMPLETED (score 73)
    {
        "role":                     "Full Stack Engineer",
        "status":                   "completed",
        "difficulty":               "Moderate",
        "duration_selected":        20,
        "created_at":               NOW - timedelta(hours=26),
        "started_at":               NOW - timedelta(hours=25, minutes=57),
        "completed_at":             NOW - timedelta(hours=25),
        "jd_text":                  "Full Stack Engineer role requiring proficiency in React and Node.js...",
        "jd_quality_warning":       False,
        "jd_quality_score":         0.82,
        "jd_type":                  "tech",
        "duration_actual":          19.2,
        "total_questions_asked":    1,
        "total_questions_attempted":1,
        "scores": {
            "overall":         73,
            "fluency":         78,
            "content_quality": 70,
            "confidence":      71,
            "skills": {
                "technological_knowledge": 75,
                "communication":           78,
                "problem_solving":         70,
                "leadership":              65,
                "cultural_fit":            76,
            },
        },
        "summary_text": "Solid performance with strong fundamentals. Backend knowledge is good but could be deeper on distributed systems. Communication was clear but responses were sometimes too brief.",
        "ai_suggestions_behavioral": [
            "Provide more detailed examples with specific metrics and outcomes",
            "Practice longer-form storytelling for behavioral questions",
        ],
        "ai_suggestions_technical": [
            "Study distributed systems concepts - CAP theorem, consensus algorithms",
            "Practice database design and optimization questions",
        ],
        "transcript": [
            make_transcript_entry({
                "questionText":  "Explain database indexing and when you would use composite indexes.",
                "userAnswer":    "Indexes speed up queries by creating a data structure for quick lookups. Composite indexes are useful when queries filter on multiple columns.",
                "score":         6,
                "comment":       "Correct but too brief. Missing key details about B-tree structure and index ordering.",
                "suggestion":    "Discuss B-tree vs hash indexes and the importance of column order in composite indexes.",
                "expectedAnswer":"Indexes are data structures (typically B-trees) that speed up retrieval. Composite indexes cover multiple columns - column order matters as the index works on leftmost prefix.",
                "section":       "Technical",
            }),
        ],
        "structured_resume_snapshot": {
            "name": USER_NAME, "email": USER_EMAIL,
            "skills": ["JavaScript", "React", "Node.js", "PostgreSQL", "MongoDB"],
        },
    },

    # sess_003: Backend Engineer - READY
    {
        "role":               "Backend Engineer",
        "status":             "ready",
        "difficulty":         "Hard",
        "duration_selected":  15,
        "created_at":         NOW - timedelta(hours=1),
        "jd_text":            "Backend Engineer role requiring strong Python and FastAPI skills...",
        "jd_quality_warning": True,
        "jd_quality_score":   0.42,
        "jd_type":            "generic",
        "scores":             None,
        "transcript":         [],
    },

    # sess_004: DevOps Engineer - CREATING
    {
        "role":               "DevOps Engineer",
        "status":             "creating",
        "difficulty":         "Moderate",
        "duration_selected":  20,
        "created_at":         NOW - timedelta(minutes=5),
        "jd_text":            "DevOps Engineer with Kubernetes and CI/CD expertise...",
        "jd_quality_warning": False,
        "jd_quality_score":   None,
        "jd_type":            None,
        "scores":             None,
        "transcript":         [],
    },

    # sess_005: Data Scientist - INTERRUPTED
    {
        "role":               "Data Scientist",
        "status":             "interrupted",
        "difficulty":         "Easy",
        "duration_selected":  25,
        "created_at":         NOW - timedelta(days=3),
        "jd_text":            "Data Scientist role with ML and Python expertise...",
        "jd_quality_warning": False,
        "jd_quality_score":   0.75,
        "jd_type":            "tech",
        "scores":             None,
        "transcript":         [],
    },

    # sess_006: ML Engineer - FAILED
    {
        "role":               "ML Engineer",
        "status":             "failed",
        "difficulty":         "Hard",
        "duration_selected":  15,
        "created_at":         NOW - timedelta(days=5),
        "jd_text":            "ML Engineer with deep learning and PyTorch expertise...",
        "jd_quality_warning": False,
        "jd_quality_score":   0.80,
        "jd_type":            "tech",
        "scores":             None,
        "transcript":         [],
    },
]

for sess in SESSIONS:
    label    = f"{sess['role']} ({sess['status']})"
    existing = db["sessions"].find_one({
        "user_id": user_id,
        "role":    sess["role"],
        "status":  sess["status"],
    })
    if existing:
        print(f"[SKIP] Session already exists: {label}")
        continue

    doc = {**sess, "user_id": user_id, "resume_id": resume_id}
    db["sessions"].insert_one(doc)
    print(f"[OK] Session inserted: {label}")


# Done
print()
print("=" * 60)
print(f"  Done! Login with:")
print(f"  Email:    {USER_EMAIL}")
print(f"  Password: {USER_PASSWORD}")
print("=" * 60)

client.close()
