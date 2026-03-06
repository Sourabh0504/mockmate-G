> [!IMPORTANT]
> **CHANGELOG RULE — READ BEFORE MAKING ANY CHANGES**
> Every time you make a change to the codebase, UI, or any project file, you **MUST** add an entry to `CHANGES.md` at the **top** of the file (most recent first).
> Format: `## YYYY-MM-DD HH:MM IST` followed by `### Added / Changed / Fixed / Removed` sections.
> Do not skip this step. The changelog is the live history of this project.

# Mockmate AI – Complete Project Specification

## 1. Project Overview

Mockmate AI is a real-time, voice-based interview simulator powered by Generative AI. It helps candidates prepare for job interviews by conducting realistic, adaptive conversations based on their resume and a specific job description (JD). The system combines low-latency speech-to-text (STT) and text-to-speech (TTS) with an LLM (Gemini) to generate context-aware questions, evaluate answers using a hybrid (AI + rule-based) scoring model, and present detailed feedback in a modern dark-themed dashboard.

Key differentiators:
- Ultra-realistic voice interaction (natural pacing, micro-pauses, interruption handling)
- Dynamic question generation driven by JD + resume, with weighted scoring per role type
- Privacy-first: no audio stored, only text transcripts; resumes auto-deleted (FIFO) but structured text retained per session
- Hybrid scoring (content quality + hesitation/fluency analysis)
- Comprehensive dashboard with session cards, skill analysis, and AI recommendations

## 2. Core Features

Resume Management: Upload (PDF/DOCX), parse, structure (Education, Experience, Projects, Certifications, Skills). FIFO queue of 5 resumes. Immediate validation for mandatory sections (Projects, Education).

Session Creation: Input: Role (metadata), JD, Resume, Difficulty (Easy/Moderate/Hard), Duration (10-30 min). Background generation of question bank (Module 1: resume-based caps; Module 2/3: JD-based).

Live Interview: Two-way voice with AI avatar. Question displayed on screen. 10s initial answer timer -> 7s silence detection. Max 120s per answer. Interruption handling, "can you repeat?" detection, speaking pace feedback.

Network Resilience: 180s reconnect window; auto-save transcript every 20s; resume from interruption point with adjusted total time.

Evaluation: Per-question hybrid scoring (AI content + rule-based). Overall metrics: Fluency, Confidence, Content Quality. Skill analysis: Technological Knowledge, Communication, Problem Solving, Leadership, Cultural Fit (weights adjusted by JD type).

Dashboard: Section A: Interview sessions (stack order). Section B: Overtime insights (recent session). Section C: Skill progress bars. Section D: AI recommendations.

Detailed Report: Per-question transcript (with filler words preserved), scores, skill breakdown, structured resume dropdown, overall summary (4-5 lines), export as PDF.

Admin/Demo: Admin view (internal prompts, scoring breakdown, module timings). Demo mode with pre-recorded sample interview.

## 3. User Journey

### 3.1 Dashboard Layout

Section A shows interview session cards in stack order (newest first). Each card displays Role, Date, Status (Creating Session/Start Interview/Completed), and Score (after evaluation). A "Create Session" button is present.

Section B shows Overtime Insights from the most recent session: Overall Score, Fluency, Content Quality, Confidence.

Section C shows Skill Analysis with progress bars for Technological Knowledge, Communication, Problem Solving, Leadership, Cultural Fit.

Section D shows AI Recommendations with improvement suggestions.

### 3.2 Creating an Interview Session

User clicks "Create Session" in Section A. A popup appears with:

- Role field (free text, stored as metadata)
- Job Description textarea
- Resume section with dropdown to select from previously uploaded resumes (max 5, oldest first) or upload new (PDF/DOCX)
- On upload, system immediately parses and validates Projects and Education sections. If missing -> error: "Resume must contain Projects and Education sections."
- Difficulty selector (Easy/Moderate/Hard)
- Duration selector (10/15/20/25/30 min)

User clicks "Create Interview Session". Popup closes. New card appears at top of Section A with Role, Date, Status "Creating session" and subtext "It might take 2-3 minutes to review the Profile and Job Description." with animated spinner.

### 3.3 Background Processing

Resume parsing and structuring: Extract text from PDF/DOCX. Use Gemini to split into sections (Education, Experience, Projects, Certifications, Skills). Store structured JSON permanently with session.

JD analysis: Quality check - if JD too vague (<5/10), store warning. Role classification - determine "technical" vs "managerial" for weight adjustment.

Question bank generation:
- Module 1 (35% of total time): Resume-based questions with caps
  - Education: max 3 (focus on highest qualification)
  - Experience: max 3 (focus on most relevant + longest)
  - Projects: max 3 (focus on JD relevance)
  - Certifications: max 3 (focus on JD relevance)
  - Plus opening "Introduce yourself"
- Module 2 and 3 (65% of total time): JD-based questions (technical/deep-dive), including follow-ups

All questions stored with metadata. When ready, card status updates to "Start Interview".

### 3.4 Starting the Interview

User clicks "Start Interview" on card. Rules and Regulations popup appears with:

- Consent for audio recording (only text stored)
- Camera use (for realism, not recorded)
- Expected duration
- Network disconnection policy
- Option to end early
- Checkbox "I agree"

User clicks "Agree and Start Interview". System checks microphone and camera permissions. If not granted, prompts user.

Interview screen loads with:
- Left: user's camera feed
- Right: AI avatar (image/animation)
- Top center: current question displayed
- Timer area showing countdowns
- Bottom: End Call button

### 3.5 Live Interview Experience

Greeting: "Hello [Name], I'm Mockmate AI, here to conduct your interview. Let's start now." (2-second pause)

First question: "Please introduce yourself." (question appears on screen)

Question-answer cycle:
- AI asks question (voice + on-screen)
- 10-second initial timer starts for user to begin speaking
- If user speaks within 10s -> switch to 7-second silence detection
- During answer, each pause >7s triggers warning: "Will ask next question in 7 seconds. Speak up to stop timer." If user resumes, timer resets
- Max answer time per question: 120 seconds (auto-cut with polite move-on)

Natural transitions: Between questions, AI inserts subtle phrases like "Alright.", "I understand.", "Let's move forward."

Interruption handling: If user speaks while AI is talking, AI stops immediately and listens.

"Can you repeat?" detection: Simple keyword spotting - if user asks for repetition, AI either repeats verbatim or rephrases.

Speaking pace feedback: Visual indicator appears if user speaks too fast/slow.

End Call: If clicked, confirmation popup "Terminate session?" If Yes -> interview ends immediately, status = Completed, evaluation begins. Manual termination cannot be resumed.

### 3.6 Network Failure Handling

On connection drop: session pauses, UI shows countdown (180s).

If reconnected within 180s:
- Message: "Welcome back. Let's continue where we left off."
- Resume at exact point (question, timer adjusted for lost time)
- Partial transcript from auto-save (every 20s) is available

If no reconnection after 180s:
- Terminate with apology message
- Card status = "Completed" with "Continue" button (only for network/system failures)
- Clicking "Continue" resumes session from interruption point

### 3.7 Post-Interview Evaluation

Card shows: Status "Completed" + animated progress indicator + "Evaluating the interview".

Evaluation process:
- For each Q&A, compute hybrid score
  - AI score (Gemini): evaluates technical accuracy, relevance, depth (0-100)
  - Rule-based score: based on filler words count, silence duration, speech rate, answer length vs expected (0-100)
  - Final = 0.7*AI + 0.3*Rule
- Aggregate overall metrics: Fluency, Confidence, Content Quality
- Skill analysis: Technological Knowledge, Communication, Problem Solving, Leadership, Cultural Fit (each 0-100). Weights adjusted per JD type
- Generate Overall Interview Summary (4-5 lines) using Gemini

When done, card updates: Score appears, "Detailed Info" becomes clickable.

### 3.8 Detailed Report

Clicking on completed session card opens detailed popup with tabs:

Transcript tab: List of Q&A pairs, each with score and answer text (spell-corrected, filler words preserved).

Skill Analysis tab: Progress bars for five skills with numeric values.

Resume tab: Collapsible dropdown showing structured resume sections.

Summary tab: 4-5 line narrative plus overall score.

Export tab: Buttons to download as PDF or export raw JSON.

## 4. System Architecture

### 4.1 High-Level Diagram

Browser communicates via WebRTC (video) and WebSocket (audio + events) to Backend Server. REST API handles session management and file upload to Database. Admin/Dev tools connect to Admin View.

### 4.2 Frontend

React/Next.js with TypeScript. UI Components include Dashboard, session cards, modals, interview screen. Real-time video display. Timer and warning displays. Audio recording via MediaRecorder API streamed to backend via WebSocket. WebSocket Client sends audio chunks, receives events. State Management via Redux or Context. Dark theme with modern animations.

### 4.3 Backend

FastAPI with Python. REST Endpoints:
- /auth for user login/registration
- /resumes for upload, list, delete
- /sessions for create, get, update, delete
- /sessions/{id}/report for detailed report
- /admin for internal views

WebSocket Server handles real-time audio streaming, timers, silence detection, interruptions, orchestrates STT -> LLM -> TTS pipeline.

Background Tasks handle resume parsing, question generation, post-interview evaluation.

### 4.4 Database

PostgreSQL with tables:
- users: id, email, password_hash, created_at, data_retention_consent
- resumes: id, user_id, filename, upload_time, structured_text (JSONB)
- sessions: id, user_id, role, jd_text, difficulty, duration, status, created_at, questions_json, transcript_json, scores_json, summary_text, structured_resume_json
- evaluation_queue: session_id, status

### 4.5 AI Services Integration

Gemini API for resume parsing, JD quality check, role classification, question generation, real-time answer evaluation, transcript spell correction, summary generation.

STT: ElevenLabs Scribe v2 Realtime (150ms latency) with WebSocket streaming.

TTS: Sonic-3 (Cartesia) with SSML break tags for micro-pauses (90ms latency).

## 5. AI Integration Details

### 5.1 Prompts

Resume Parsing: "You are an expert resume parser. Extract the following sections from the resume text: Education, Experience, Projects, Certifications, Skills. Return a JSON object with these keys. If a section is missing, use an empty list. Preserve all details as they appear."

JD Quality Check: "Analyze the following job description. Rate its detail level from 1 (very vague) to 10 (highly detailed). Consider length, specificity of requirements, responsibilities, and nice-to-haves. Return JSON: {'score': int, 'warning': bool, 'message': str}. If score < 5, set warning=true and suggest uploading a more detailed JD."

Role Classification: "Classify this job description as either 'technical' (focus on hard skills, coding, tools) or 'managerial' (focus on leadership, team management, strategy). Return JSON: {'type': 'technical'|'managerial'}."

Question Generation Module 1: "Based on the following resume section: {section_name: details}, generate up to {cap} questions that probe the candidate's experience. Focus on relevance to the job description: {JD}. Questions should be open-ended and designed to assess depth. Return a JSON array of strings."

Question Generation Module 2/3: "You are an interviewer for the role described in the JD. Generate {num_questions} technical/behavioral questions (as appropriate) that test the candidate's fit. Include follow-up possibilities. Return JSON array of strings."

Real-time Answer Evaluation: "You are evaluating an interview answer. Question: {question} Answer: {answer} Score the answer on content quality, relevance, and depth from 0 to 100. Provide a brief reason. Return JSON: {'score': int, 'reason': str}."

Transcript Spell Correction: "Correct the spelling in the following transcript. Do not remove or paraphrase any words, including filler words like 'um', 'uh'. Return only the corrected text."

Overall Summary: "Write a 4-5 line summary of the candidate's performance in this interview. Highlight strengths and areas for improvement. Use a professional, constructive tone."

### 5.2 Scoring Weights Adjustment

If JD type = "technical":
- Technological Knowledge: 40%
- Communication: 15%
- Problem Solving: 20%
- Leadership: 10%
- Cultural Fit: 15%

If JD type = "managerial":
- Technological Knowledge: 20%
- Communication: 20%
- Problem Solving: 15%
- Leadership: 25%
- Cultural Fit: 20%

### 5.3 Rule-Based Scoring Metrics

Filler word count normalized to score 0-100 based on expected range. Silence duration per answer: shorter silences higher score. Speech rate within 2.5-4 words/sec high score. Answer length relative to expected based on question type.

## 6. Voice Processing

STT: ElevenLabs Scribe v2 Realtime with 150ms latency, Voice Activity Detection, next word prediction. WebSocket streaming.

TTS: Sonic-3 (Cartesia) with 90ms latency, supports SSML break tags for micro-pauses. WebSocket streaming.

Natural breathing implementation: Insert break time="200ms" after sentences and transition phrases. Use dashes/hyphens for mid-sentence pauses.

Real-time audio pipeline:
- User speaks -> browser captures audio -> sent via WebSocket
- Backend forwards chunks to ElevenLabs STT
- Transcribed text returned -> stored temporarily, sent to Gemini for evaluation
- AI response text -> sent to Sonic-3 TTS -> audio chunks streamed back to browser
- All audio discarded after processing

## 7. Data Model SQL

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    data_retention_consent BOOLEAN DEFAULT FALSE
);

CREATE TABLE resumes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    filename VARCHAR(255),
    upload_time TIMESTAMP DEFAULT NOW(),
    structured_text JSONB NOT NULL
);

CREATE TABLE sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(255),
    jd_text TEXT,
    difficulty VARCHAR(20),
    duration INTEGER,
    status VARCHAR(50) DEFAULT 'creating',
    created_at TIMESTAMP DEFAULT NOW(),
    questions JSONB,
    transcript JSONB,
    scores JSONB,
    summary_text TEXT,
    structured_resume JSONB
);

CREATE TABLE evaluation_queue (
    session_id INTEGER PRIMARY KEY REFERENCES sessions(id),
    status VARCHAR(20) DEFAULT 'pending'
);

## 8. Edge Cases and Error Handling

Resume missing Projects or Education: Block upload, show error.

JD too vague: Warning during session creation.

User interrupts AI: AI stops speaking immediately, timer resets, listens.

User asks to repeat: Keyword match triggers repeat or rephrase.

User speaks too fast/slow: Visual indicator only.

Network drop: 180s reconnect window, auto-save every 20s.

Session creation fails: Retry up to 3 times, then mark failed.

STT/TTS unavailable: Fallback to alternative provider if possible.

User terminates manually: No resume option, evaluation starts immediately.

System crash during interview: On restart, session marked terminated, user can continue from last auto-save.

## 9. Privacy and Security

Data retention policy displayed on first use. User can delete account and all associated data anytime. No audio stored. Resumes only last 5 kept, older auto-deleted. Structured text stored per session. HTTPS for all communications, WebSocket over WSS. JWT tokens with short expiry. Export user data option.

## 10. Admin and Presentation Features

Admin view at /admin shows prompt history, scoring breakdown, module timings, raw STT vs corrected transcript, JD classification result.

Demo mode toggle loads pre-recorded sample interview.

Export report as PDF using jsPDF or react-pdf with session metadata, overall score, summary, transcript, skill progress bars, structured resume.

## 11. Development Phases

Phase 1 MVP Weeks 1-4:
- User authentication basic
- Resume upload PDF only plus simple parsing
- Session creation with JD, resume, difficulty, duration
- Hardcoded question generation
- Basic interview screen with WebSocket audio test services
- Timer logic 10s/7s/120s without interruptions
- Store transcript and mock score
- Dashboard with session cards

Phase 2 Core AI and Realism Weeks 5-8:
- Integrate Gemini for resume parsing, JD analysis, question generation
- Implement module caps and 35/65 split
- Add hybrid scoring AI plus rule-based
- Implement interruption handling and repeat detection
- Add natural transitions and micro-pauses with SSML
- Network failure handling simulated
- Admin view basics

Phase 3 Refinements and Dashboard Weeks 9-10:
- Dashboard Sections B, C, D with real data
- Detailed report with tabs
- Export PDF
- Speaking pace feedback
- JD quality check and role classification
- Privacy policy, data export, account deletion

Phase 4 Testing and Polish Weeks 11-12:
- Extensive testing with diverse accents
- Performance optimization latency
- UI/UX refinements
- Prepare demo mode
- Documentation

## 12. Conclusion

Mockmate AI is a comprehensive realistic interview simulator combining cutting-edge voice AI with intelligent adaptive questioning and detailed feedback. It is designed as a standout final year project demonstrating full-stack development, AI integration, real-time systems, and user-centered design. This specification provides a complete roadmap for implementation.