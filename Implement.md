# MockMate AI — End-to-End Implementation Plan

**Date:** 2026-03-10  
**Goal:** Take MockMate AI from its current state to a fully functional, end-to-end working product as described in `plan.md` and `idea.md`.

---

## Current State Summary

### ✅ What's Already Working

| Layer | What's Built |
|---|---|
| **Auth** | Register, Login, JWT (bcrypt), Protected Routes, AuthContext |
| **Resume** | Upload (PDF/DOCX), Gemini parsing, validation (projects + education required), FIFO max-5, structured JSON storage |
| **Session Creation** | Form (role, company, JD, resume, difficulty, duration), background question generation via Gemini, JD quality analysis, JD type classification, session status lifecycle (creating → ready) |
| **Question Generation** | Module 1 (resume-based, caps enforced), Module 2+3 (JD-based), follow-up generation function (exists but unused without WS) |
| **Post-Interview Eval** | Per-question AI scoring, rule-based scoring, hybrid 70/30 merge, spell correction, expected answer generation, per-Q feedback (comment + suggestion), overall summary, behavioral + technical suggestions, skill aggregation with JD-type weights |
| **Dashboard UI** | Session cards (all 6 states), sidebar (performance cards, skill bars, achievements, recommendations), polling, LIFO ordering, create session modal, rules modal |
| **Report UI** | 5-tab modal (Transcript, Skills, Resume, Summary, Export), capsule score cards, collapsible Q&A, JSON export |
| **Interview UI** | Full-screen layout (camera + AI avatar), demo state machine (5 dummy questions), end-call dialog, network overlay UI, pace indicator |
| **Public Pages** | Home, How It Works, About, Contact, Profile, 404 |

### ❌ What's Missing (Core Gaps)

1. **WebSocket Server** — No real-time communication exists between frontend and backend during interview
2. **Gemini Live API Integration** — No STT/TTS streaming; Gemini is only used for text generation currently
3. **Real Interview Flow** — Frontend uses hardcoded dummy questions; no actual question delivery, answer capture, or real-time evaluation
4. **Audio Pipeline** — No microphone audio capture → backend streaming → STT → answer processing pipeline
5. **PDF Export** — Button exists, shows placeholder alert
6. **Resume Tab Wiring** — Report modal uses dummy data instead of session's actual `structured_resume_snapshot`
7. **AI Recommendations Wiring** — Dashboard sidebar uses hardcoded data instead of API data
8. **Admin View** — Not built
9. **Demo Mode** — Not built
10. **Privacy UI** — Account deletion API exists, but no UI to trigger it

---

## Implementation Phases

The work is organized into **6 sequential phases**, ordered by dependency chain and risk (hardest/riskiest work first).

---

## Phase 1: WebSocket Server Foundation

**Why first:** Everything else (audio, STT, TTS, real-time Q&A) depends on having a working WebSocket connection between frontend and backend.

### Step 1.1 — Backend WebSocket Endpoint

**Files to create/modify:**
- `backend/app/routes/interview_ws.py` **[NEW]**
- `backend/app/services/interview_manager.py` **[NEW]**
- `backend/app/main.py` **[MODIFY]** — register WS route

**What to build:**
1. Create WebSocket endpoint at `WSS /ws/interview/{session_id}?token={jwt}`
2. On connection:
   - Validate JWT token from query param
   - Validate session belongs to user and status is `ready` or `interrupted`
   - Update session status to `live`, set `started_at`
   - Load the pre-generated question bank from DB
3. Create `InterviewManager` class that manages a single interview session state:
   - Current question index and module tracker
   - Timer management (session timer, per-question timers)
   - Transcript accumulation (auto-saved to DB every 20s)
   - Follow-up question counter (max 2 per topic)
4. Define WebSocket message protocol (JSON):

```
# Client → Server
{ "type": "audio_chunk", "data": "<base64 PCM audio>" }
{ "type": "end_interview" }
{ "type": "repeat_request" }

# Server → Client
{ "type": "greeting", "text": "Hello {name}...", "audio": "<base64>" }
{ "type": "question", "text": "...", "audio": "<base64>", "question_index": 1, "module": 1 }
{ "type": "transition", "text": "Alright.", "audio": "<base64>" }
{ "type": "start_timer", "timer_type": "initial", "seconds": 10 }
{ "type": "start_timer", "timer_type": "silence", "seconds": 7 }
{ "type": "listening" }
{ "type": "answer_finalized", "transcript": "..." }
{ "type": "interview_ended", "reason": "completed|manual|timeout" }
{ "type": "error", "message": "..." }
```

5. Implement session timer tracking:
   - Module 1: 35% of total duration
   - Module 2+3: 65% of total duration
   - When timer expires: no new questions, allow current answer to finish (120s max)

### Step 1.2 — Frontend WebSocket Hook

**Files to create/modify:**
- `frontend/src/hooks/useInterviewWS.js` **[NEW]**
- `frontend/src/pages/InterviewPage.jsx` **[MODIFY]**

**What to build:**
1. Create `useInterviewWS(sessionId)` hook:
   - Connects to `WSS /ws/interview/{session_id}?token={jwt}`
   - Manages connection lifecycle (connect, reconnect, cleanup)
   - Exposes: `state`, `currentQuestion`, `aiSpeaking`, `send(msg)`, `disconnect()`
   - Handles all incoming message types and updates corresponding state
2. Remove dummy questions and demo state machine from `InterviewPage.jsx`
3. Wire InterviewPage to `useInterviewWS` hook instead of local timer-based state machine

### Step 1.3 — Connection Handshake Test

**Verification:**
- Start backend with `uvicorn app.main:app --reload`
- Start frontend with `npm run dev`
- Create a session, let it reach "Ready" status
- Click "Start Interview" → verify WebSocket connects successfully
- Check backend logs for connection events
- Verify session status updates to `live` in MongoDB

---

## Phase 2: Audio Pipeline — STT & TTS via Gemini Live API

**Why second:** Once WebSocket is established, we need actual audio flowing through it.

### Step 2.1 — Research Gemini Live API

**What to do:**
1. Review Gemini Live API documentation for real-time audio streaming
2. Determine the exact API surface:
   - Is it a separate WebSocket connection to Gemini?
   - What audio format does it accept (PCM, Opus, WebM)?
   - What's the latency profile?
   - How does bidirectional (STT+TTS) work simultaneously?
3. Check `google-generativeai` SDK version for Live API support
4. If the SDK doesn't support Live API yet → evaluate alternatives:
   - Gemini REST API with chunked audio
   - Google Cloud Speech-to-Text + Gemini TTS
   - Web Speech API (browser-native STT) + Gemini TTS as fallback

> **⚠️ DECISION POINT:** The Gemini Live API might have specific constraints on availability, pricing, or SDK support. This step determines the exact audio architecture. The user should review and decide on the approach before proceeding.

### Step 2.2 — Backend Audio Bridge

**Files to create/modify:**
- `backend/app/services/audio_service.py` **[NEW]**
- `backend/requirements.txt` **[MODIFY]** — add audio dependencies

**What to build:**
1. Audio service that bridges the client's audio stream to Gemini:
   - Receives PCM/Opus audio chunks from the client WebSocket
   - Streams them to Gemini's STT endpoint
   - Receives text transcription results
   - Sends transcription text to `InterviewManager` for processing
2. TTS service:
   - Takes question text / transition phrase from `InterviewManager`
   - Sends to Gemini's TTS endpoint
   - Streams audio chunks back to client via WebSocket
3. Handle the "interviewer speaks" → "user answers" flow:
   - While AI is speaking: mute STT (don't process user audio)
   - Detect when AI finishes speaking → start STT
   - Implement echo cancellation logic if needed

### Step 2.3 — Frontend Audio Capture

**Files to create/modify:**
- `frontend/src/hooks/useAudioCapture.js` **[NEW]**
- `frontend/src/hooks/useInterviewWS.js` **[MODIFY]**

**What to build:**
1. `useAudioCapture()` hook:
   - Uses `MediaRecorder` API or `AudioWorklet` for real-time PCM capture
   - Chunks audio into ~100ms segments
   - Base64 encodes and sends via WebSocket
   - Handles mic permission state
2. Audio playback for AI voice:
   - Receives audio chunks from WebSocket
   - Plays via `AudioContext` with seamless buffering
   - Tracks when AI finishes speaking (triggers `aiSpeaking` state change)

### Step 2.4 — End-to-End Audio Test

**Verification:**
- Start interview session
- Speak into mic → verify audio reaches backend → Gemini STT returns text
- Backend sends question → TTS audio plays in browser
- Full Q&A cycle with real audio

---

## Phase 3: Real-Time Interview Flow

**Why third:** With WebSocket and audio working, implement the actual interview logic.

### Step 3.1 — Question Delivery & Timer System

**Files to modify:**
- `backend/app/services/interview_manager.py` **[MODIFY]**
- `frontend/src/hooks/useInterviewWS.js` **[MODIFY]**
- `frontend/src/pages/InterviewPage.jsx` **[MODIFY]**

**What to build:**
1. **Greeting flow:**
   - AI greets candidate by name (TTS)
   - Asks first question: "Please introduce yourself"
   - Send `{ type: "question", text: "...", audio: "..." }` to client
2. **10-second initial timer:**
   - After AI finishes speaking question: start 10s countdown
   - If user starts speaking within 10s → switch to listening mode
   - If 10s expires with no speech → skip question, move to next
3. **7-second silence detection:**
   - After user starts speaking: if 7s of consecutive silence → finalize answer
   - Backend detects silence from audio energy levels
4. **120-second max per answer:**
   - Hard cap on answer duration
   - Notify user at 100s mark (optional warning)
5. **Session timer:**
   - Module 1 gets 35% of total time
   - Module 2+3 gets 65%
   - When session timer expires: no new questions, let current answer finish

### Step 3.2 — Answer Processing Pipeline

**Files to modify:**
- `backend/app/services/interview_manager.py` **[MODIFY]**
- `backend/app/services/gemini_service.py` **[MODIFY]** (if needed)

**What to build:**
Per-answer pipeline after answer is finalized:
1. Raw STT transcript stored immediately
2. Send transition phrase TTS ("Alright.", "I see.", "Let's move forward.")
3. Start next question (or follow-up decision)
4. Auto-save transcript to DB every 20s concurrently

### Step 3.3 — Follow-up Question Logic

**What to build:**
1. After each answer in Module 2/3:
   - Backend decides: next question from bank, or follow-up?
   - If follow-up: call `generate_followup_question()` (already implemented)
   - Max 2 follow-ups per topic, tracked by `InterviewManager`
2. Follow-up questions insert into the flow without disrupting module timers

### Step 3.4 — Special Interactions

**What to build:**
1. **"Can you repeat that?" detection:**
   - Backend scans STT output for repeat keywords
   - If detected: re-ask same question (verbatim or rephrased), reset timers
2. **Interruption handling:**
   - If user speaks while AI is still speaking
   - AI stops TTS immediately
   - Switch to listening mode
3. **Transition phrases:**
   - AI says natural filler: "Alright.", "I understand.", "Good."
   - ~200ms micro-pauses between sentences in TTS

### Step 3.5 — Interview Completion

**What to build:**
1. **Normal completion:**
   - Session timer expires → AI: "Thank you for your time, {name}. This concludes our interview."
   - WS sends `{ type: "interview_ended", reason: "completed" }`
   - Frontend navigates to `/dashboard`
2. **Manual termination:**
   - User clicks End Call → confirms → WS sends `{ type: "end_interview" }`
   - Backend marks session as `completed` with `termination_type: "manual"`
   - Backend queues evaluation immediately
3. **Call POST `/sessions/{id}/end`** from WS handler:
   - Triggers the existing `evaluate_session()` background task
   - All the existing evaluation logic runs (AI scoring, rule scoring, summary, etc.)

### Step 3.6 — Full Interview Flow Test

**Verification:**
- Run a complete 10-minute interview session end-to-end
- Verify: all questions delivered, answers captured, timers work, follow-ups asked
- End interview → verify evaluation runs → dashboard updates → report shows real data
- Test edge cases: silence skip, repeat request, manual end call

---

## Phase 4: Network Resilience & Interview Resume

### Step 4.1 — Network Disconnect Detection

**Files to modify:**
- `backend/app/services/interview_manager.py` **[MODIFY]**
- `frontend/src/hooks/useInterviewWS.js` **[MODIFY]**
- `frontend/src/pages/InterviewPage.jsx` **[MODIFY]**

**What to build:**
1. **Backend:** Detect WebSocket disconnect
   - Save current state (question index, module, remaining time, partial transcript)
   - Mark session as `interrupted` with `interruption_point`
   - Do NOT start evaluation
   - Hold state for 180 seconds
2. **Frontend:** Detect `onclose` / `onerror` events
   - Show existing network overlay (already built)
   - Start 180s countdown (already built)
   - Attempt reconnection every 5 seconds
3. **Reconnection:**
   - Client sends new WS connection to same session
   - Server validates: session is `interrupted`, within 180s window
   - Resume from interruption point (same question, adjusted timer)
   - AI says: "Welcome back. Let's continue where we left off."
   - Excluded time: time during disconnect NOT counted toward session timer
4. **Timeout:**
   - If 180s expires: mark session as `interrupted` permanently
   - Navigate user to dashboard
   - Card shows "Interrupted" badge + "Resume Interview" button

### Step 4.2 — Resume Interrupted Session

**Files to modify:**
- `backend/app/routes/interview_ws.py` **[MODIFY]**
- `frontend/src/components/SessionCard.jsx` **[MODIFY]**

**What to build:**
1. SessionCard "Resume" button already exists → wire it:
   - Opens RulesModal → navigates to `/interview/:session_id`
   - InterviewPage connects WS with `action: "resume"`
2. Backend: on resume connection:
   - Load saved `interruption_point`
   - Restore question index, module, remaining time
   - Continue from where it stopped

### Step 4.3 — Network Test

**Verification:**
- During a live interview, simulate network drop (disable Wi-Fi / kill WS)
- Verify overlay appears, countdown starts
- Reconnect within 180s → verify interview resumes seamlessly
- Disconnect and wait 180s+ → verify session becomes permanently interrupted
- Click "Resume" on interrupted card → verify session resumes correctly

---

## Phase 5: Small Feature Wiring & Polish

These are independent tasks that can be done in any order after the core interview flow works.

### Step 5.1 — Wire Resume Tab in Report Modal

**Files to modify:**
- `frontend/src/components/ReportModal.jsx` **[MODIFY]**

**What to do:**
1. Replace `DUMMY_RESUME` import with `fetchedSession.structured_resume_snapshot`
2. The backend already returns this field in the report API response
3. Handle null case (old sessions without snapshot)

### Step 5.2 — Wire AI Recommendations on Dashboard

**Files to modify:**
- `frontend/src/pages/DashboardPage.jsx` **[MODIFY]**

**What to do:**
1. Replace hardcoded `recommendations` array with data from latest scored session
2. Fetch `ai_suggestions_behavioral` and `ai_suggestions_technical` from session report
3. Format as recommendation cards

### Step 5.3 — PDF Export

**Files to create/modify:**
- `frontend/src/utils/pdfExport.js` **[NEW]**
- `frontend/src/components/ReportModal.jsx` **[MODIFY]**
- `frontend/package.json` **[MODIFY]** — add `jspdf` dependency

**What to do:**
1. Install `jspdf` and optionally `jspdf-autotable`
2. Create `generateReportPDF(session, report)` function:
   - Header: role, company, date, difficulty, duration
   - Overall score section
   - Summary paragraph
   - Transcript table (Q, A, Score, Comment)
   - Skill analysis bar chart
   - Suggestions lists
3. Replace `alert('PDF export coming soon!')` with actual PDF download

### Step 5.4 — Speaking Pace — Wire to Real Data

**Files to modify:**
- `frontend/src/pages/InterviewPage.jsx` **[MODIFY]**
- `backend/app/services/interview_manager.py` **[MODIFY]**

**What to do:**
1. Backend: calculate speech rate in real-time from STT timestamps
   - Words per second (wps): < 2 = too slow, 2-4 = good, > 4 = too fast
2. Send pace feedback via WS: `{ type: "pace_feedback", pace: "good|too_fast|too_slow" }`
3. Frontend: update pace indicator from WS message instead of hardcoded demo

### Step 5.5 — Custom Scrollbar Everywhere

**Status:** ✅ Already done in `index.css` (completed in previous session)

### Step 5.6 — Account Deletion UI

**Files to modify:**
- `frontend/src/pages/ProfilePage.jsx` **[MODIFY]**

**What to do:**
1. Add "Delete Account" button in profile page (destructive styling)
2. Confirmation dialog: "This will permanently delete all your data including sessions, reports, and resumes."
3. On confirm: call `authApi.deleteAccount()` → clear localStorage → redirect to `/`

### Step 5.7 — Data Export UI

**Files to modify:**
- `frontend/src/pages/ProfilePage.jsx` **[MODIFY]**

**What to do:**
1. Add "Export All Data" button in profile page
2. Fetches all sessions with reports and downloads as JSON
3. Filename: `mockmate_export_{date}.json`

---

## Phase 6: Admin View & Demo Mode

### Step 6.1 — Admin View

**Files to create:**
- `frontend/src/pages/AdminPage.jsx` **[NEW]**
- `backend/app/routes/admin.py` **[NEW]**
- `backend/app/services/admin_service.py` **[NEW]**

**What to build:**
1. Route: `/admin` (protected, admin-only)
2. Select any session by ID
3. Debug view showing:
   - Exact Gemini prompts used (resume parsing, JD analysis, question gen, evaluation)
   - Full scoring breakdown per question (AI score, rule score, weights, final)
   - Module timings (time spent in Module 1 vs 2/3)
   - Raw STT transcript vs corrected transcript (side by side diff)
   - JD classification result and quality score

### Step 6.2 — Demo Mode

**Files to create/modify:**
- `frontend/src/data/demoSession.js` **[NEW]**
- `frontend/src/pages/DashboardPage.jsx` **[MODIFY]**
- `frontend/src/pages/InterviewPage.jsx` **[MODIFY]**

**What to build:**
1. Create a complete pre-recorded demo session with:
   - 5-6 Q&A pairs with realistic answers and scores
   - Full evaluation data (scores, summary, suggestions)
   - Structured resume snapshot
2. Toggle/flag (URL param `?demo=true` or env var) that:
   - Loads demo data instead of API calls
   - Interview screen plays back pre-recorded Q&A with timers
   - Dashboard shows demo session card with scores
   - Report modal shows full demo report

---

## Phase Summary & Priority Order

| Phase | Name | Complexity | Dependencies | Must-Have? |
|---|---|---|---|---|
| 1 | WebSocket Server Foundation | 🔴 High | None | ✅ Yes |
| 2 | Audio Pipeline (STT & TTS) | 🔴 High | Phase 1 | ✅ Yes |
| 3 | Real-Time Interview Flow | 🔴 High | Phase 1 + 2 | ✅ Yes |
| 4 | Network Resilience & Resume | 🟡 Medium | Phase 3 | ✅ Yes |
| 5 | Feature Wiring & Polish | 🟢 Low | Independent | ⚠️ Partial (5.1-5.3 important) |
| 6 | Admin & Demo | 🟢 Low | Phase 3+ | ❌ Nice-to-have |

> **Critical path:** Phase 1 → Phase 2 → Phase 3. These three phases transform the demo-state-machine into a real, working AI interview platform. Everything else is polish.

---

## Key Technical Decisions Needed

Before implementation begins, the following decisions should be made:

### 1. Gemini Live API Availability

The current `google-generativeai==0.8.3` SDK may or may not support the Gemini Live API for real-time audio streaming. Options if it doesn't:

| Option | Pros | Cons |
|---|---|---|
| **A) Gemini Live API (if available)** | Single ecosystem, lowest complexity | May require SDK upgrade, pricing unknown |
| **B) Google Cloud STT + Gemini TTS** | STT is battle-tested, reliable | Two services to manage, higher latency |
| **C) Web Speech API (browser STT) + Gemini TTS** | No backend STT needed, instant | Browser-dependent, accuracy varies, no accent correction at STT level |
| **D) Deepgram/AssemblyAI STT + Gemini TTS** | Best STT accuracy, real-time | Extra cost, extra dependency |

### 2. Audio Format

- **PCM 16-bit 16kHz mono** — most compatible, larger bandwidth
- **Opus** — compressed, lower bandwidth, needs encoding/decoding
- **WebM** — browser-native from MediaRecorder, needs demuxing on backend

### 3. Frontend Audio Strategy

- **MediaRecorder API** — simple but limited control over chunks
- **AudioWorklet** — precise control, raw PCM, lower latency, more complex

---

## File Map — All New Files

```
backend/
├── app/
│   ├── routes/
│   │   ├── interview_ws.py          [NEW — Phase 1]
│   │   └── admin.py                 [NEW — Phase 6]
│   ├── services/
│   │   ├── interview_manager.py     [NEW — Phase 1]
│   │   ├── audio_service.py         [NEW — Phase 2]
│   │   └── admin_service.py         [NEW — Phase 6]
│   └── main.py                      [MODIFY — Phase 1]

frontend/
├── src/
│   ├── hooks/
│   │   ├── useInterviewWS.js        [NEW — Phase 1]
│   │   └── useAudioCapture.js       [NEW — Phase 2]
│   ├── utils/
│   │   └── pdfExport.js             [NEW — Phase 5]
│   ├── data/
│   │   └── demoSession.js           [NEW — Phase 6]
│   ├── pages/
│   │   ├── InterviewPage.jsx        [MODIFY — Phase 1-3]
│   │   ├── DashboardPage.jsx        [MODIFY — Phase 5]
│   │   ├── ProfilePage.jsx          [MODIFY — Phase 5]
│   │   └── AdminPage.jsx            [NEW — Phase 6]
│   └── components/
│       └── ReportModal.jsx          [MODIFY — Phase 5]
```

---

*This document is the implementation roadmap for making MockMate AI fully functional. Refer to `plan.md` for detailed product specification and business rules, `frontend.md` for current UI implementation details, and `idea.md` for the original project vision.*
