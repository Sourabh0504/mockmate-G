> [!IMPORTANT]
> **CHANGELOG RULE — READ BEFORE MAKING ANY CHANGES**
> Every time you make a change to the codebase, UI, or any project file, you **MUST** add an entry to `CHANGES.md` at the **top** of the file (most recent first).
> Format: `## YYYY-MM-DD HH:MM IST` followed by `### Added / Changed / Fixed / Removed` sections.
> Do not skip this step. The changelog is the live history of this project.

# MockMate AI — Master Project Plan

**Version:** 1.0  
**Date:** 2026-03-01  
**Author:** Sourabh Chaudhari  
**Identity:** MockMate AI is a Real-time, Voice-Based, Adaptive Interview Simulator powered by Generative AI (Gemini).

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [System Architecture](#3-system-architecture)
4. [User Authentication](#4-user-authentication)
5. [Resume Management](#5-resume-management)
6. [Session Creation Flow](#6-session-creation-flow)
7. [Background Processing — Question Bank Generation](#7-background-processing--question-bank-generation)
8. [Interview Screen Layout](#8-interview-screen-layout)
9. [Live Interview Flow — Detailed](#9-live-interview-flow--detailed)
10. [Real-Time Voice Pipeline](#10-real-time-voice-pipeline)
11. [Answer Processing & Transcription Rules](#11-answer-processing--transcription-rules)
12. [Network & System Failure Handling](#12-network--system-failure-handling)
13. [Manual Termination](#13-manual-termination)
14. [Post-Interview Evaluation](#14-post-interview-evaluation)
15. [Scoring System — Detailed](#15-scoring-system--detailed)
16. [Dashboard Layout](#16-dashboard-layout)
17. [Detailed Report Popup](#17-detailed-report-popup)
18. [Data Models (MongoDB)](#18-data-models-mongodb)
19. [API Endpoints](#19-api-endpoints)
20. [Privacy & Security](#20-privacy--security)
21. [Admin & Demo Features](#21-admin--demo-features)
22. [UI/UX Directives](#22-uiux-directives)
23. [Development Phases](#23-development-phases)
24. [All Edge Cases & Rules](#24-all-edge-cases--rules)

---

## 1. Project Overview

MockMate AI is a GenAI-powered system that conducts **realistic, adaptive mock interviews** using voice interaction. It is designed for job seekers who want to practice interviews tailored to a specific Job Description and their own Resume.

### Core Differentiators

- Voice-first, real-time conversation (no typing)
- Fully adaptive: AI generates follow-up questions based on what the user actually says
- JD + Resume-driven: not generic, every interview is unique to the role and the candidate
- Hybrid scoring: AI intelligence + rule-based mathematics
- No audio storage: privacy-first design
- Dark, modern, premium UI

### What the AI Does

- Parses and structures resume into JSON
- Analyzes JD quality and classifies role type (technical vs managerial)
- Generates a prioritized question bank
- Conducts a real voice interview with natural pacing and transitions
- Evaluates each answer live (before spell correction)
- Generates per-question feedback, ideal answers, and overall summary
- Produces skill analysis and improvement recommendations

### What the System Does

- Applies rule-based scoring metrics (filler words, silence, speech rate)
- Applies difficulty multiplier, JD-priority weight, module weight
- Calculates final numeric scores
- Manages session state, module transitions, timers
- Handles network failures, auto-saves, session resumption

---

## 2. Tech Stack

| Layer | Technology | Notes |
|---|---|---|
| Frontend | ReactJS (Vite) | Dark-themed, Tailwind CSS, Radix UI primitives, Lucide React icons |
| Backend | FastAPI (Python) | REST + WebSocket server |
| Database | MongoDB | All data stored as JSON documents |
| AI / LLM | Gemini API | Question gen, evaluation, parsing, summary |
| STT | Gemini Live API | Real-time speech-to-text, lowest latency |
| TTS | Gemini Live API | Real-time text-to-speech with natural pacing |
| Real-time Communication | WebSocket (WSS) | Audio streaming + session events |
| Auth | JWT (bcrypt) | Short expiry tokens, bcrypt password hashing |
| PDF Export | jsPDF or react-pdf | Detailed report download (not yet implemented) |
| UI Components | Radix UI + cva | Dialog, Tabs, Select, Checkbox, Collapsible, Slider, ScrollArea |
| Styling | Tailwind CSS | HSL CSS variables, glassmorphism, gradient accents |
| Fonts | Google Fonts | Poppins (primary), Inter (secondary), Montserrat (dates) |

> **Why Gemini Live API for STT & TTS:** Keeps the entire AI pipeline within one ecosystem, reduces integration complexity, and provides real-time streaming with natural voice quality. No need for ElevenLabs or Cartesia.

---

## 3. System Architecture

```
Browser (ReactJS)
    │
    ├── REST API (HTTPS) ──────────────── FastAPI Backend
    │       sessions, resumes,                │
    │       auth, reports                     ├── MongoDB (all data)
    │                                         ├── Gemini API (LLM tasks)
    └── WebSocket (WSS) ───────────────── FastAPI WebSocket Server
            audio chunks,                     │
            session events,                   ├── Gemini Live API (STT)
            timers, interrupts                └── Gemini Live API (TTS)
```

### Key Architectural Points

- WebSocket handles the entire live interview: audio in, audio out, timer events, interruption signals, silence detection, session state transitions
- REST handles everything else: auth, resume upload, session creation, report retrieval
- MongoDB stores all sessions, resumes, transcripts, scores as JSON documents
- Background tasks (question bank generation, post-interview evaluation) run as async FastAPI background tasks
- No audio is ever persisted — streamed in, processed, discarded

---

## 4. User Authentication

- User registers with email + password
- Passwords hashed (bcrypt)
- JWT tokens issued on login, short expiry
- On first login, show **Data Retention Policy** — exactly what is stored and for how long
- User controls available:
  - Export all interview data (transcripts, reports)
  - Delete account and all associated data permanently

---

## 5. Resume Management

### Upload Rules

- Accepted formats: **PDF and DOCX only**. All other formats are rejected with an error message.
- Max **5 resumes** per user at any time
- Storage pattern: **FIFO Queue** — when user uploads a 6th resume, the oldest is auto-deleted from the system
- Resume files themselves are not permanently stored; only the structured JSON extraction is retained

### Immediate Validation on Upload

When a resume is uploaded, the system **immediately** (before session creation):
1. Extracts raw text from the PDF/DOCX
2. Sends to Gemini for structured parsing
3. Validates mandatory sections

### Mandatory Sections

| Section | Required? | Notes |
|---|---|---|
| Projects | ✅ Yes | AI uses fuzzy/semantic matching — "Portfolio", "Work Samples", "Built", etc. are recognized |
| Education | ✅ Yes | AI uses fuzzy/semantic matching — "Academic Background", "Qualifications", etc. are recognized |
| Experience | ❌ No | Optional — freshers may not have it |
| Certifications | ❌ No | Optional |
| Skills | ❌ No | Optional |

**If Projects or Education are missing:** Block upload, show error: *"Resume must contain Projects and Education sections to proceed."*

**Minimum viable resume:** Even 1 project entry + 1 education entry is sufficient. The system will work with whatever is present.

### Resume Parsing Output (JSON Structure)

Gemini structures the resume into the following JSON format for storage in MongoDB:

```json
{
  "name": "string",
  "email": "string",
  "phone": "string",
  "education": [
    {
      "degree": "string",
      "institution": "string",
      "year": "string",
      "grade": "string"
    }
  ],
  "experience": [
    {
      "company": "string",
      "role": "string",
      "duration": "string",
      "responsibilities": ["string"]
    }
  ],
  "projects": [
    {
      "name": "string",
      "description": "string",
      "tech_stack": ["string"],
      "highlights": ["string"]
    }
  ],
  "certifications": [
    {
      "name": "string",
      "issuer": "string",
      "year": "string"
    }
  ],
  "skills": ["string"]
}
```

### Per-Session Resume Snapshot

When a session is created:
- The structured JSON resume is **copied and stored permanently within the session document in MongoDB**
- This snapshot is session-specific and is **never deleted**, even if the original resume file and resume record are FIFO-deleted
- Rationale: The user must always be able to see what resume they used for any past interview

### Resume Reuse

When creating a new session, user sees a dropdown showing their previously uploaded resumes (up to 5, in FIFO order — most recent first). They can select an existing one or upload a new one.

---

## 6. Session Creation Flow

### Step-by-Step

1. User clicks **"Create Session"** button on the Dashboard (Section A)
2. A modal/popup appears with the following fields:
   - **Role** (free text input) — label only, stored as metadata, not used by AI for interview logic
   - **Job Description** (textarea — large, multi-line)
   - **Resume selector** — dropdown of previous resumes OR upload new (PDF/DOCX)
   - **Difficulty** — dropdown: Easy / Moderate / Hard
   - **Duration** — dropdown: 10 / 15 / 20 / 25 / 30 minutes
3. User clicks **"Create Interview Session"**
4. Modal closes
5. New session card **immediately appears at the top** of Section A (LIFO stack order — newest always first)
6. Card status: **"Creating session..."**
7. Card subtext: *"It might take 2–3 minutes to review the Profile and Job Description"*
8. Card shows: animated spinner

### Important Rule About Role Input

- **Role field is purely a label** for the user to identify this session later (e.g., "Frontend Engineer at Google")
- The AI does NOT use the Role field in any analysis or question generation
- All interview intelligence comes exclusively from **JD + Resume**
- Reason: The same role title at two different companies can require completely different skills. The JD contains the actual requirements.

---

## 7. Background Processing — Question Bank Generation

While the card shows "Creating session...", the backend performs the following in sequence:

### Step 1: Resume Parsing (Already Done at Upload)

The structured JSON resume is already available from upload-time parsing. It is retrieved and attached to the session.

### Step 2: JD Quality Analysis

Gemini analyzes the JD and returns:

```json
{
  "quality_score": 7,
  "warning": false,
  "message": "Job description is detailed and specific."
}
```

- Score range: 1 (very vague) to 10 (highly detailed)
- If score < 5: `warning: true`, message stored: *"Job description seems brief. Questions may be generic. Consider uploading a more detailed JD for better relevance."*
- This warning is stored in the session and surfaced in the session card/report

### Step 3: JD Role Classification

Gemini classifies the JD as either:
- `"technical"` — focus on hard skills, coding, tools, frameworks
- `"managerial"` — focus on leadership, team management, strategy

This classification affects skill analysis weights in scoring (see Section 15).

### Step 4: Question Bank Generation

The question bank is divided into two modules:

#### Module 1 — Resume-Based Questions (covers 35% of session duration)

Questions are generated from the structured resume JSON. Strict caps apply:

| Resume Section | Max Questions | Generation Priority Rules |
|---|---|---|
| Opener | 1 (fixed) | Always: "Please introduce yourself." — not counted in caps |
| Education | Max 3 | Skip 10th grade entirely. Focus on highest qualification (e.g., Master's > Bachelor's > Diploma). Only include most relevant to JD. |
| Experience | Max 3 | Focus on most JD-relevant role first, then longest tenure. Skip very short or unrelated stints. |
| Projects | Max 3 | Focus on projects most relevant to JD tech stack and responsibilities. |
| Certifications | Max 3 | Focus on certifications most relevant to JD requirements. |

**Key rule:** The AI cherry-picks which items from each section are worth asking about. It does NOT ask about every entry. For example, if user has 8 projects, AI selects the 3 most JD-relevant.

**Total Module 1 questions:** ~13 max (1 opener + 3 + 3 + 3 + 3), but typically fewer based on what's present in the resume.

#### Module 2 & 3 — JD-Based Questions (covers 65% of session duration)

- Generated from the JD: technical skills, role responsibilities, domain knowledge, behavioral aspects
- Pre-generated batch stored in the question bank
- PLUS: AI generates **follow-up questions on the fly** during the interview based on the user's actual answers
- Follow-up depth limit: **Max 2 follow-ups per topic** — prevents interrogation on a single subject
- This is where the adaptive intelligence is most prominent

**Module 2 vs Module 3:** Both are JD-based. The distinction is internal only — Module 2 covers broad JD questions, Module 3 is deeper follow-ups and behavioral. The user experiences it as a seamless interview.

#### Module Label Note

These module numbers (1, 2, 3) are **internal developer and AI model references only**. The user never sees these. The interview flows as one continuous conversation.

### Step 5: Question Bank Stored in MongoDB

All generated questions are stored in the session document as a JSON array with metadata:

```json
{
  "questions": [
    {
      "id": "q1",
      "module": 1,
      "section": "opener",
      "question_text": "Please introduce yourself.",
      "source": "fixed",
      "jd_relevance_score": null
    },
    {
      "id": "q2",
      "module": 1,
      "section": "education",
      "question_text": "Tell me about your Master's in Computer Science...",
      "source": "resume",
      "jd_relevance_score": 8.2
    }
  ]
}
```

### Step 6: Session Status Update

When question bank is ready → session document status updated to `"ready"` → card button changes to **"Start Interview"**

---

## 8. Interview Screen Layout

When user clicks "Start Interview", a **permission check** happens first:

```
Check microphone access → if denied, block with prompt
Check camera access → if denied, block with prompt
```

Only after both are granted does the interview screen load.

### Screen Layout

```
┌────────────────────────────────────────────────────────┐
│          Current Question (displayed as text)           │
│  [Answer Timer Display — visible countdown]             │
├─────────────────────┬──────────────────────────────────┤
│                     │                                  │
│   User Camera Feed  │     AI Avatar (Woman image/      │
│   (live, not        │     animation — to be provided   │
│    recorded)        │     by developer later)          │
│                     │                                  │
├─────────────────────┴──────────────────────────────────┤
│  [Speaking Pace Indicator]      [🔴 End Call Button]    │
└────────────────────────────────────────────────────────┘
```

### Layout Rules

- **Question text displayed at top center** — so user can read it even if they missed it verbally
- **Two cards side by side** — user camera (left), AI avatar (right)
- **Timer visible** — countdown for the answer window
- **Speaking pace indicator** — subtle visual cue (too fast / too slow / good pace) — not intrusive
- **End Call button** — bottom right, red, phone/end icon (Google Meet-style)
- **No live transcription shown** — audio is processed internally, user does not see their words being transcribed on screen

### Pre-Interview: Mic/Camera Test

Before the very first interview a user does, provide a **test mode** screen where they can:
- Confirm microphone is working
- Confirm camera is working
- Adjust if needed before entering the interview

---

## 9. Live Interview Flow — Detailed

### 9.1 Greeting Sequence

1. AI TTS speaks: *"Hello [Name], I'm MockMate AI, here to conduct your interview. Let's start now."*
2. System waits exactly **2 seconds** (silence/pause)
3. AI TTS speaks the first question: *"Please introduce yourself."*
4. Question text appears on screen simultaneously

### 9.2 Name Usage Policy

- AI uses the user's name in the **greeting** (mandatory)
- AI uses the user's name **2–3 times randomly** throughout the rest of the interview at natural moments
- AI does **NOT** use the name in every question — that would feel robotic and unnatural

### 9.3 Per-Question Answer Cycle (Exact Logic)

```
STEP 1: AI finishes speaking the question
         ↓
STEP 2: 10-second initial timer starts
         (waiting for user to begin speaking)
         If user does NOT speak within 10s → STEP 5 (move to next question)
         ↓
STEP 3: User begins speaking → 10s timer STOPS
         (system now in "listening" mode)
         ↓
STEP 4: User pauses/stops speaking
         → 7-second silence timer starts
         → Warning text shown on screen: 
           "Will ask next question in 7 seconds. Speak up to stop timer."
         → If user resumes speaking → 7s timer RESETS
         → If user stays silent for full 7s → answer is finalized → STEP 6
         ↓
STEP 5: Hard cap — 120 seconds max per answer
         Regardless of silence state, answer is cut at 120s
         AI politely says: "Thank you, let's move on." and transitions
         ↓
STEP 6: Answer finalized → AI transition phrase plays
         → Next question displayed on screen + spoken by AI
```

### 9.4 AI Natural Transitions Between Questions

After each answer is finalized, the AI does NOT jump immediately to the next question. It first speaks one of the following neutral transition phrases (randomly selected):

- *"Alright."*
- *"I understand."*
- *"Let's move forward."*
- *"I see."*
- *"Good."*

These are **subtle, not dramatic**. They serve to create human-like conversational pacing. After the transition phrase, the AI asks the next question.

### 9.5 Natural Voice Pacing (TTS Micro-Pauses)

All AI-spoken text is sent to Gemini Live API TTS with **SSML-style break tags** (or equivalent Gemini Live pausing mechanism) to simulate:
- ~200ms pause after each sentence
- ~100–150ms pause at natural comma/clause breaks
- Slight pause before transition phrases

This makes the AI voice sound natural rather than robotic or rushed.

### 9.6 Interruption Handling

- If the user **speaks while the AI is still talking**, the AI TTS audio stream is **cut immediately**
- System switches to listening mode
- This mimics how a real interviewer would stop and listen when interrupted
- No penalty to the user for interrupting

### 9.7 "Can You Repeat?" Detection

- System performs keyword matching on the incoming STT transcript
- Trigger phrases include: "can you repeat", "repeat that", "say that again", "can you say that again", "what was the question", "pardon", "sorry could you"
- If triggered:
  - AI either **repeats the question verbatim** OR **rephrases it slightly** (Gemini decides)
  - Timer resets to give the user proper time to answer
  - This event is logged but does NOT count against the user's scoring

### 9.8 Speaking Pace Visual Indicator

- Target pace: **2.5–4 words per second**
- If user speaks faster than 4 wps → subtle indicator appears (e.g., "Slow down" or a speed icon)
- If user speaks slower than 2.5 wps → subtle indicator appears (e.g., "Speak up" or a pace icon)
- Indicator appears at bottom of screen, unobtrusive
- This is a **visual-only** feature — AI does not verbally comment on pace during the interview

### 9.9 "Introduce Yourself" Evaluation

The opener question is NOT just a free pass. Gemini evaluates it against the resume:
- Did the user mention their key experiences?
- Did the user mention relevant projects?
- Did the user align their introduction to the role/JD?
- Score is generated for this answer like any other

### 9.10 Session Timer & Module Transition

- The session duration (10–30 min) is the total interview time
- Module 1 gets 35% of total time, Module 2+3 get 65%
- System tracks time per module and transitions accordingly
- When total session timer runs out:
  - If user is **currently answering the last question** → allow them up to **120 seconds** to complete the answer, then terminate
  - If user is between questions or AI is about to ask a new one → session terminates immediately
  - No new questions are asked after total time expires

---

## 10. Real-Time Voice Pipeline

### Audio Flow (User Speaking)

```
User speaks into mic
    → Browser captures audio via MediaRecorder API / WebAudio API (`pcm-processor.js`)
    → **VAD Filter:** Root Mean Square (RMS) volume gate drops silent/ambient chunks natively in the browser, slashing Gemini Live Input Audio costs by ~50%.
    → Active audio chunks sent via WebSocket to FastAPI backend
    → Backend streams chunks to Gemini Live API (STT)
    → STT returns real-time transcription as text
    → Text stored in session memory (NOT displayed to user)
    → Silence detection runs on audio stream
    → When answer finalized → text sent to Gemini for evaluation
    → Audio chunks DISCARDED (never saved to disk or database)
```

### Audio Flow (AI Speaking)

```
Gemini generates question text / transition phrase
    → Text sent to Gemini Live API (TTS)
    → TTS returns audio stream
    → Audio chunks streamed back to browser via WebSocket
    → Browser plays audio through speakers
    → Audio chunks DISCARDED after playback (never saved)
```

### Key Non-Negotiable Rules

1. **No audio files are ever stored** — neither user answers nor AI questions
2. **No live transcription is shown on screen** — it is purely internal
3. **Text-only storage** — only the final corrected plain-text transcript is persisted in MongoDB
4. **All audio is ephemeral** — processed in real-time and discarded immediately after

---

## 11. Answer Processing & Transcription Rules

### Processing Order (Critical — Do NOT Reverse)

```
Step 1: Raw STT transcript received (accent errors possible, filler words present)
Step 2: AI EVALUATION happens on the RAW transcript
         → Captures filler words (um, uh, like, you know)
         → Captures hesitation and confidence signals
         → Scores the answer based on the natural response
Step 3: Spell correction applied to raw transcript
         → Gemini corrects only accent/STT-induced spelling errors
         → Filler words (um, uh, like, you know) are INTENTIONALLY PRESERVED
         → No paraphrasing, no summarizing, no restructuring
         → Only fix: obvious STT errors caused by accents or noise
Step 4: Corrected transcript stored in MongoDB with the session
Step 5: Corrected transcript shown in Detailed Report
```

### Why This Order Matters

Evaluating BEFORE spell correction ensures the scoring captures the natural, authentic response including hesitation and filler word frequency. If we corrected first, we'd lose the signals needed for accurate Fluency and Confidence scoring.

### Transcript Storage Rules

- Filler words **always preserved** in stored transcript
- User's response displayed as-is (with filler words) in the Detailed Report
- The report is meant to be authentic — showing the user exactly what they said

---

## 12. Network & System Failure Handling

### On Disconnection Detected

1. Interview **pauses immediately** — no more questions, TTS stops
2. Overlay appears on screen: *"Connection lost. Attempting to reconnect…"*
3. **180-second countdown timer** begins (visible to user)
4. Microphone listening pauses
5. Current question context and session state are preserved in memory
6. **Auto-save transcript every 20 seconds** runs throughout the interview — so the last auto-save is at most 20 seconds old when the disconnect happens

### If Reconnected Within 180 Seconds

1. AI TTS speaks: *"Welcome back. Let's continue where we left off."*
2. Resume from exact interruption point:
   - If the user was mid-answer → resume that same question
   - If the answer had already been finalized → move to next question
3. The **interrupted time is excluded** from the interview timer — the user does not lose interview time due to a network issue
4. Remaining time continues normally

### If NOT Reconnected Within 180 Seconds

1. System displays: *"Due to connectivity issues, the session has been on hold for too long. The interview will be terminated for now."*
2. Session status in MongoDB: `"interrupted"`
3. All auto-saved transcript data preserved

### Session Card After Network Termination

- Card status: **"Interrupted"**
- Card shows button: **"Resume Interview"**
- When user clicks Resume:
  - Interview screen opens
  - AI says: *"Welcome back. Let's continue where we left off."*
  - Continue from same module, same question (or next if finalized)
  - Previous answers preserved
  - Adjusted time continues

### Termination Type Matrix

| Termination Cause | Status | Resume Button | Evaluation |
|---|---|---|---|
| Network / System Failure | Interrupted | ✅ Yes — "Resume Interview" | Only after user resumes and finishes |
| Manual End Call (user chose to end) | Completed (Early) | ❌ No | Starts immediately |
| Normal session time expiry | Completed | ❌ No | Starts immediately |

---

## 13. Manual Termination

- **End Call button:** Red, phone-hang-up icon, Google Meet-style. Located at the bottom of the interview screen.
- On click → **Confirmation popup** appears:
  - Text: *"Are you sure you want to terminate the session?"*
  - Button: **"Yes, End Interview"** (red)
  - Button: **"No, Continue"** (cancel)
- If user clicks **"Yes"**:
  - Interview ends immediately
  - No resume option — this termination is permanent and final
  - Status: `"completed"` (early termination)
  - Evaluation begins immediately on whatever transcript was collected
- If user clicks **"No"**:
  - Popup closes, interview continues normally

---

## 14. Post-Interview Evaluation

### Immediate Steps After Interview Ends

1. User is **redirected to the Dashboard**
2. Session card updates:
   - Status: **"Completed"**
   - Animated progress indicator (spinner/progress bar)
   - Sub-text: *"Evaluating the interview"*
3. Evaluation runs **asynchronously** as a background task — user can navigate the dashboard while evaluation runs

### Evaluation Process (Thorough, No Rushing)

For each Q&A pair in the transcript:

1. **AI Score** (Gemini): Send question + raw answer → get content quality score, relevance score, reasoning, strengths, weaknesses (0–100)
2. **Rule-based Score**: Calculate from transcript metrics (filler word frequency, silence durations, speech rate, answer length)
3. **Combine** into final per-question score: `0.7 × AI_score + 0.3 × rule_score`
4. Generate **per-question feedback**: comment on the answer + improvement suggestion + expected/ideal answer

After all questions are scored:
5. Generate **overall metrics**: Fluency, Confidence, Content Quality
6. Generate **skill analysis**: 5 skill scores (0–100 each)
7. Generate **behavioral and technical improvement suggestions**
8. Generate **4–5 line Overall Interview Summary** (Gemini)

### When Evaluation Completes

- Animated indicator stops
- Card shows: **Overall Score** (numeric)
- **"Detailed Report"** button becomes clickable

---

## 15. Scoring System — Detailed

### Separation of Concerns

| Who | What |
|---|---|
| **Gemini (AI Intelligence)** | Qualitative analysis — relevance reasoning, depth reasoning, strengths, weaknesses, confidence inference (text-based) |
| **System (Mathematics)** | Applies weights, multipliers, calculates final numbers |

### Per-Question Hybrid Score

```
Final Score = (0.7 × AI_Content_Score) + (0.3 × Rule_Score)
```

**AI Content Score (0–100):** Gemini evaluates:
- Relevance to the question
- Depth of knowledge demonstrated  
- Technical/behavioral accuracy
- Coherence and structure of response

**Rule-Based Score (0–100):** System calculates from:
- Filler word count (um, uh, like, you know) — normalized to 0–100 range
- Silence/pause duration per answer — shorter appropriate pauses = higher score
- Speech rate (2.5–4 words/sec = ideal; outside this range = penalty)
- Answer length relative to expected length for that question type

### Additional Multipliers Applied by System

- **Difficulty Multiplier:** Easy session questions weighted differently than Hard session
- **JD-Priority Weight:** Questions drawn from core JD responsibilities weighted higher
- **Module Weight:** Module 2+3 answers (65% time) carry more weight than Module 1 (35% time)

### Overall Metrics

| Metric | Derived From |
|---|---|
| Fluency | Speech rate consistency, filler word frequency |
| Confidence | Hesitation frequency, pause patterns, pace consistency |
| Content Quality | Average AI content scores across all questions |

### Skill Analysis (5 Dimensions)

Each skill scored 0–100 using a weighted combination of relevant Q&A scores:

| Skill | Technical JD Weight | Managerial JD Weight |
|---|---|---|
| Technological Knowledge | 40% | 20% |
| Communication | 15% | 20% |
| Problem Solving | 20% | 15% |
| Leadership | 10% | 25% |
| Cultural Fit | 15% | 20% |

The JD classification (`"technical"` or `"managerial"`) determined during session creation is what drives which weight column is applied. This ensures the scoring is aligned to what the company actually needs.

---

## 16. Dashboard Layout

The dashboard is divided into 4 sections:

### Section A — Interview Sessions

- **Stack/LIFO order** — newest session always at top, oldest at bottom
- Each session card shows:
  - **Role** (the label the user gave)
  - **Duration** (e.g., "30 min")
  - **Date created**
  - **Status** (one of: Creating Session / Start Interview / Completed / Interrupted)
  - **Score** (only after evaluation is complete)
  - **"Detailed Report"** button with icon (only for completed sessions)
  - **"Resume Interview"** button (only for interrupted sessions)
- **"Create Session"** button is always visible in this section

### Session Card Statuses & Lifecycle

```
[Creating Session...]     ← spinning, building question bank
       ↓
[Start Interview]         ← question bank ready, user can begin
       ↓
[Live Interview]          ← interview in progress
       ↓
[Completed] + Evaluating  ← interview done, evaluation running
       ↓
[Completed] + Score       ← evaluation done, report available

OR:

[Live Interview]
       ↓ (network failure)
[Interrupted]             ← resume available

OR:

[Live Interview]
       ↓ (manual end)
[Completed] + Evaluating  ← evaluation starts immediately
```

### Section B — Overtime Insights (Most Recent Session)

Shows metrics from the **most recently completed session**:
- Overall Score
- Fluency
- Content Quality
- Confidence

### Section C — Skill Analysis

Progress bars (0–100%) for all 5 skills from the most recent session:
- Technological Knowledge
- Communication
- Problem Solving
- Leadership
- Cultural Fit

### Section D — AI Recommendations

AI-generated improvement suggestions based on latest session results. Both behavioral and technical. Displayed as a readable list.

---

## 17. Detailed Report Popup

Triggered by clicking **"View Report"** on a completed session card.

Opens as a large modal (`sm:max-w-4xl`) with premium glassmorphism styling.

The report data is fetched dynamically from `/sessions/{id}/report` API endpoint when the modal opens.

### Header (always visible above tabs)

**Left column:**
- "Interview Report" badge with Sparkles icon
- Role title (text-2xl, font-poppins)
- Metadata pills: Company (Building2 icon, if available) · Date (Calendar icon) · Duration (Clock icon) · Difficulty badge

**Right column — Overall Score Capsule:**
- Rounded card with score value (text-3xl) + "/100" + progress bar (color-coded by score)

**Below header — Score Breakdown (3 capsule cards):**
- Fluency (Mic icon), Content (Brain icon), Confidence (Target icon)
- Each: icon + label (uppercase) + score value "/100" + horizontal progress bar
- Color-coded: ≥80 green, ≥60 blue, <60 purple

### Tabs (5 tabs)

#### Tab 1 — Transcript
- Per-question collapsible cards with: Q number badge, section badge, score badge (/10)
- Question text, user's answer, Comment card (green), Suggestion card (accent)
- Expandable "Show Expected Answer" section

#### Tab 2 — Skill Analysis
- Progress bars for all skills from `scores.skills` with glow shadows
- 2-column grid layout

#### Tab 3 — Resume Snapshot
- Collapsible accordion: Personal Info, Education, Experience, Projects, Skills
- Currently uses dummy data — needs to be wired to session's `structured_resume_snapshot`

#### Tab 4 — Summary
- Large SVG score ring + score rating text (Excellent/Good/Fair/Needs Work)
- AI-generated summary paragraph
- 2-column suggestion cards: Behavioral (green) + Technical (blue)

#### Tab 5 — Export
- "Download PDF" button (placeholder — shows alert)
- "Download JSON" button (functional — downloads session + report as JSON blob)

### Report Data Normalization

The frontend normalizes the flat backend response into the expected report structure:
- `summary_text` → `report.summary`
- `ai_suggestions_behavioral` → `report.behavioral_suggestions`
- `ai_suggestions_technical` → `report.technical_suggestions`
- `scores.skills` → `report.skill_scores`
- `transcript[]` → `report.questions[]` (mapped with score conversion from /100 to /10 scale)

---

## 18. Data Models (MongoDB)

### Collection: `users`
```json
{
  "_id": "ObjectId",
  "email": "string (unique)",
  "password_hash": "string",
  "name": "string",
  "created_at": "datetime",
  "data_retention_consent": "boolean"
}
```

### Collection: `resumes`
```json
{
  "_id": "ObjectId",
  "user_id": "ObjectId → users",
  "filename": "string",
  "upload_time": "datetime",
  "structured_json": {
    "name": "...",
    "education": [...],
    "experience": [...],
    "projects": [...],
    "certifications": [...],
    "skills": [...]
  }
}
```
Note: Max 5 documents per user. On insertion of 6th, oldest is deleted.

### Collection: `sessions`
```json
{
  "_id": "ObjectId",
  "user_id": "ObjectId → users",
  "role": "string (label only)",
  "jd_text": "string",
  "jd_quality_score": "number",
  "jd_quality_warning": "boolean",
  "jd_type": "technical | managerial",
  "difficulty": "Easy | Moderate | Hard",
  "duration_selected": "number (minutes)",
  "duration_actual": "number (minutes)",
  "status": "creating | ready | live | completed | interrupted",
  "created_at": "datetime",
  "started_at": "datetime",
  "completed_at": "datetime",
  "structured_resume_snapshot": { ... },
  "questions": [
    {
      "id": "string",
      "module": "number (1|2|3)",
      "section": "string (opener|education|experience|project|certification|jd)",
      "question_text": "string",
      "source": "string (fixed|resume|jd|followup)",
      "jd_relevance_score": "number"
    }
  ],
  "transcript": [
    {
      "question_id": "string",
      "question_text": "string",
      "raw_answer": "string",
      "corrected_answer": "string",
      "answer_duration_sec": "number",
      "filler_word_count": "number",
      "speech_rate_wps": "number",
      "silence_duration_sec": "number",
      "ai_score": "number",
      "rule_score": "number",
      "final_score": "number",
      "ai_comment": "string",
      "ai_suggestion": "string",
      "expected_answer": "string"
    }
  ],
  "autosave_transcript": [...],
  "scores": {
    "overall": "number",
    "fluency": "number",
    "confidence": "number",
    "content_quality": "number",
    "skills": {
      "technological_knowledge": "number",
      "communication": "number",
      "problem_solving": "number",
      "leadership": "number",
      "cultural_fit": "number"
    }
  },
  "summary_text": "string",
  "ai_suggestions_behavioral": ["string"],
  "ai_suggestions_technical": ["string"],
  "termination_type": "normal | manual | network_failure",
  "interruption_point": {
    "question_id": "string",
    "module": "number",
    "remaining_time_sec": "number"
  }
}
```

---

## 19. API Endpoints

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/register` | Register new user |
| POST | `/auth/login` | Login, receive JWT |
| DELETE | `/auth/account` | Delete account and all data |

### Resumes
| Method | Endpoint | Description |
|---|---|---|
| GET | `/resumes` | List user's resumes (max 5) |
| POST | `/resumes/upload` | Upload new resume (PDF/DOCX), parse & validate immediately |
| DELETE | `/resumes/{id}` | Delete a specific resume |

### Sessions
| Method | Endpoint | Description |
|---|---|---|
| GET | `/sessions` | List all sessions for user (LIFO order) |
| POST | `/sessions` | Create new session (starts background processing) |
| GET | `/sessions/{id}` | Get session details |
| GET | `/sessions/{id}/report` | Get full detailed report |
| POST | `/sessions/{id}/resume` | Resume an interrupted session |
| DELETE | `/sessions/{id}` | Delete a session |

### Export
| Method | Endpoint | Description |
|---|---|---|
| GET | `/sessions/{id}/export/pdf` | Download report as PDF |
| GET | `/export/all` | Export all user interview data |

### Admin
| Method | Endpoint | Description |
|---|---|---|
| GET | `/admin/sessions/{id}/debug` | Internal: prompts used, scoring breakdown, module timings, raw vs corrected transcript, JD classification |

### WebSocket
| Endpoint | Description |
|---|---|
| `WSS /ws/interview/{session_id}` | Main interview WebSocket — handles audio in/out, timer events, interruptions, silence detection, session state |

---

## 20. Privacy & Security

- **No audio stored** — ever. All audio is processed in real-time over WebSocket and discarded.
- **No video recorded** — camera feed is local, browser-only. Never sent to backend.
- **Text-only persistence** — only transcripts and structured data stored in MongoDB.
- **Resume FIFO** — max 5 per user. Older files auto-deleted.
- **Per-session resume snapshot** — stored as JSON within session, never deleted.
- **Data retention policy** — displayed to user on first login. States exactly what is stored and for how long.
- **User controls:**
  - Export all data (transcripts + reports) as JSON download
  - Delete account → deletes all associated data from MongoDB
- **Transport security:** HTTPS for all REST, WSS for all WebSocket
- **Auth:** JWT tokens with short expiry. Refresh token flow for extended sessions.

---

## 21. Admin & Demo Features

### Admin View (`/admin`)
For developer/internal use only. Shows for any session:
- Exact prompts sent to Gemini (resume parsing, JD analysis, question generation, evaluation)
- Full scoring breakdown per question (AI score, rule score, weights applied, final score)
- Module timings (how much time was spent in Module 1 vs 2/3)
- Raw STT transcript vs corrected transcript (side by side)
- JD classification result and quality score

### Demo Mode
- A toggle/flag that loads a pre-recorded sample interview
- All screens function normally but data is pre-populated
- Used for presentations, demos, and project evaluation
- Does not require API calls or a real interview session

---

## 22. UI/UX Directives

- **Theme:** Dark mode — primary aesthetic. No light mode.
- **Feel:** Modern, premium, high-quality. Not a generic student project look.
- **Colors:** Dark backgrounds with vibrant accent colors (not plain red/blue/green). Curated palette.
- **Typography:** Google Fonts — Inter, Outfit, or similar clean sans-serif.
- **Animations:** Smooth micro-animations on hover, transitions, loading states. Not overdone.
- **Interview screen:** Immersive, focused. Minimal distractions.
- **Dashboard:** Information-dense but visually clean. Card-based layout.
- **Responsive:** Works on desktop. Mobile is secondary priority.
- **AI Avatar:** Woman image or animation provided by developer. Placeholder can be used during development.

---

## 23. Development Phases

### Phase 1 — Foundation (Weeks 1–3) ✅ COMPLETE
- [x] User auth (register, login, JWT with bcrypt)
- [x] Resume upload (PDF/DOCX), immediate Gemini parsing, validation
- [x] Resume FIFO queue (max 5)
- [x] Session creation form (with company field, slider duration, button-group difficulty)
- [x] Dashboard UI with dark theme, Tailwind CSS, Radix UI components
- [x] MongoDB schema setup
- [x] Public pages (Home, How It Works, About, Contact)
- [x] Navigation bar (auth-aware, mobile responsive)
- [x] Profile page

### Phase 2 — Question Bank & Session Creation (Weeks 4–5) ✅ COMPLETE
- [x] JD quality analysis (Gemini)
- [x] JD role classification (technical/managerial)
- [x] Module 1 question generation (resume-based, with caps and priority rules)
- [x] Module 2+3 question generation (JD-based)
- [x] Session status lifecycle management (creating → ready)
- [x] Session card all states (creating, ready, live, completed evaluating, completed scored, interrupted, failed)

### Phase 3 — Live Interview (Weeks 6–8) ⚠️ PARTIAL
- [ ] WebSocket server setup (backend)
- [ ] Gemini Live API integration (STT + TTS)
- [x] Interview screen UI (camera, AI avatar, question display, timers, pace indicator)
- [x] Per-question answer cycle (10s/7s/120s timer logic — demo state machine)
- [ ] Real WebSocket-driven answer cycle
- [ ] Interruption handling (real-time)
- [ ] "Can you repeat?" detection
- [ ] Natural transitions and micro-pauses in TTS
- [x] Speaking pace visual indicator (demo)
- [ ] Session timer and module transitions
- [x] End Call button + confirmation popup (Radix Dialog)
- [ ] Auto-save transcript every 20 seconds
- [x] Network failure overlay UI (built, not yet wired)

### Phase 4 — Failure Handling & Evaluation (Weeks 9–10) ⚠️ PARTIAL
- [ ] Network disconnect detection (WebSocket)
- [x] 180-second reconnect window with countdown UI
- [ ] Session resume from interruption point logic
- [x] Post-interview routing to dashboard
- [x] Evaluation background task (per-question AI + rule scoring — backend)
- [x] Overall metrics aggregation (Fluency, Confidence, Content Quality)
- [x] Skill analysis scoring with JD-type weight adjustment
- [x] Overall summary generation (Gemini)
- [x] Animated evaluation progress indicator on card

### Phase 5 — Detailed Report & Dashboard (Weeks 11–12) ⚠️ PARTIAL
- [x] Detailed report modal (5 tabs: Transcript, Skills, Resume, Summary, Export)
- [x] Per-question comment, suggestion, and expected answer in transcript tab
- [x] Resume collapsible dropdown in report (currently uses dummy data)
- [ ] Wire resume tab to actual session's structured_resume_snapshot
- [ ] PDF export (button exists, shows placeholder alert)
- [x] JSON export (functional)
- [x] Dashboard sidebar: Overall Performance cards, Skill Breakdown bars
- [x] Dashboard: Achievements section
- [ ] Dashboard: Wire AI Recommendations to API data (currently hardcoded)
- [x] Rules & Regulations modal with mic/camera permission checks
- [x] JD quality warning in session card UI
- [ ] Mic/camera pre-interview test screen (separate from RulesModal)
- [x] Custom scrollbar matching site theme

### Phase 6 — Admin, Demo & Polish (Weeks 13–14)
- [ ] Admin view at /admin
- [ ] Demo mode with pre-recorded sample
- [ ] Privacy: data export, account deletion UI (API exists, UI not wired)
- [ ] Speaking pace — wire to real STT data
- [ ] Accent/STT correction testing
- [ ] UI/UX polish pass
- [ ] Performance optimization

---

## 24. All Edge Cases & Rules

This section is the authoritative reference for all specific rules and edge cases discussed.

| # | Rule | Detail |
|---|---|---|
| 1 | Role input is metadata only | AI does NOT use Role in any question generation or evaluation logic |
| 2 | Resume formats | Only PDF and DOCX accepted. All other formats rejected |
| 3 | Resume max storage | 5 resumes per user max. FIFO — 6th upload triggers auto-deletion of oldest |
| 4 | Resume mandatory sections | Projects + Education required. Fuzzy/semantic matching used. |
| 5 | Single entry is valid | 1 project + 1 education is sufficient. Interview proceeds. |
| 6 | 10th grade skipped | AI must NOT generate questions about 10th grade. Skip entirely. |
| 7 | Question caps | Education: max 3, Experience: max 3, Projects: max 3, Certifications: max 3 |
| 8 | AI picks best items | AI chooses WHICH items to ask about (not all). Prioritizes JD relevance. |
| 9 | Opener is fixed | "Introduce yourself" always first. Not counted in section caps. |
| 10 | Intro evaluated vs resume | AI scores the intro against the resume content (did they mention key items?) |
| 11 | Module 1 is 35% | Resume-based questions get 35% of total session time |
| 12 | Module 2+3 is 65% | JD-based questions get 65% of total session time |
| 13 | Module labels internal | Never shown to user. Interview is experienced as seamless. |
| 14 | Follow-ups max 2 per topic | Prevents interrogation on a single subject |
| 15 | 10s initial timer | After AI finishes speaking the question, user has 10s to START speaking |
| 16 | 7s silence timer | After user has spoken at least once, 7s of silence finalizes the answer |
| 17 | 120s max per answer | Hard cap regardless of silence state |
| 18 | Last question exception | If session timer expires while user is answering last question, give them 120s to finish |
| 19 | No new questions after timer | After total session time expires, no new questions asked |
| 20 | Name usage | Used in greeting + 2–3 random times during interview. Not more. |
| 21 | Interruption handling | If user speaks while AI talks, AI STOPS immediately and listens |
| 22 | Repeat detection | Keyword match triggers re-ask (verbatim or rephrased). Timer resets. |
| 23 | Speaking pace | Visual indicator only. AI does not comment verbally on pace. |
| 24 | Transitions between questions | AI says one of: "Alright.", "I understand.", "Let's move forward.", "I see.", "Good." |
| 25 | TTS micro-pauses | ~200ms breaks after sentences, natural breathing pacing in AI voice |
| 26 | No live transcription shown | User never sees words being transcribed on screen during interview |
| 27 | Evaluation order | Raw transcript → Evaluate FIRST → THEN spell-correct → Store corrected |
| 28 | Spell correction rules | Fix only STT/accent errors. No paraphrasing. Filler words preserved. |
| 29 | Filler words preserved | um, uh, like, you know, etc. kept in stored transcript intentionally |
| 30 | No audio stored | Zero audio persistence. Real-time processing, immediate discard. |
| 31 | No video recorded | Camera is local only. Never sent to backend. |
| 32 | Auto-save every 20s | Transcript auto-saved every 20 seconds during live interview |
| 33 | Network failure | 180s reconnect window. Time excluded from interview timer if reconnected. |
| 34 | Resume message on reconnect | AI says: "Welcome back. Let's continue where we left off." |
| 35 | Interrupted status | Network failure → card shows "Interrupted" + "Resume Interview" button |
| 36 | Manual termination is final | No resume option. Evaluation starts immediately. |
| 37 | Manual termination status | "Completed (Early Termination)" — different from normal completion |
| 38 | End call confirmation | Clicking End Call shows confirmation popup. User must confirm. |
| 39 | Evaluation is async | Runs in background. User can browse dashboard while evaluation runs. |
| 40 | Evaluation is thorough | No rushing. All Q&A pairs evaluated. Takes the time it needs. |
| 41 | Hybrid scoring ratio | 70% Gemini AI score + 30% rule-based score |
| 42 | JD type weight adjustment | Technical JD → 40% tech weight. Managerial JD → 25% leadership weight. |
| 43 | Expected answer is personal | Tailored to JD + that specific user's resume. Not generic. |
| 44 | Resume snapshot per session | Resume JSON stored within session permanently. Not deleted by FIFO. |
| 45 | Resume display structured | Shown as AI-cleaned, section-organized view. Not raw text dump. |
| 46 | Report resume collapsed | Resume section in report is collapsed by default. User clicks to expand. |
| 47 | JD quality check | If JD quality score < 5, warning stored and surfaced to user |
| 48 | Dashboard order is LIFO | Newest session always at top. No reordering. |
| 49 | Section B uses latest session | Overtime Insights always from most recently completed session |
| 50 | Pre-interview test | First-time users get mic/camera test screen before first interview |
| 51 | Data retention notice | Shown on first login. States what is stored and for how long. |
| 52 | Data export | User can download all their interview data as JSON |
| 53 | Account deletion | User can delete account → all data permanently removed from MongoDB |
| 54 | Admin view | /admin shows prompts, scores breakdown, module timings, raw vs corrected transcript |
| 55 | Demo mode | Pre-recorded sample interview. No real API calls needed. For presentations. |
| 56 | PDF export | Download detailed report as PDF from report popup |
