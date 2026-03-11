# CHANGES.md — MockMate AI Changelog

> **Stack order — most recent entry is always at the TOP.**
> Format for each entry: `## YYYY-MM-DD HH:MM IST` then `### Added / Changed / Fixed / Removed` sub-sections.
> Every code change, file creation, bug fix, or config update must be logged here immediately.

---

## 2026-03-11 10:50 IST

### Changed
- `Voice.md` — Merged both versions into one comprehensive document: full comparison tables for all STT/TTS options (Vosk, Whisper, Deepgram, AssemblyAI, Google Cloud, Edge-TTS, Piper, pyttsx3, gTTS, Coqui, Qwen3-TTS, Web Speech API) PLUS project-specific technical integration details (code examples for `interview_ws.py`, audio format compatibility, silence detection with `struct`, barge-in logic, pace tracking, latency budget analysis, phased migration plan)

---

## 2026-03-11 09:54 IST

### Fixed
- `backend/app/services/gemini_service.py` — Resume parsing (and all LLM calls) failed with 404: model `gemini-1.5-flash` no longer available in API v1beta; updated default to `gemini-2.0-flash`

---

## 2026-03-11 09:47 IST

### Fixed
- `frontend/src/components/CreateSessionModal.jsx` — Resume list never loaded: was using `useState()` instead of `useEffect()` to fetch resumes on modal open
- `frontend/src/components/CreateSessionModal.jsx` — Session creation always failed with 422: was sending `job_description` and `duration_selected` but backend `SessionCreate` schema expects `jd_text` and `duration`
- `frontend/src/components/CreateSessionModal.jsx` — Resume upload errors were silently swallowed (`console.error` only): added error state + red error banner UI showing backend detail messages
- `frontend/src/components/CreateSessionModal.jsx` — Could attempt session creation without selecting a resume: added `resumeId` to `canCreate` validation check; changed label from "Resume (Optional)" to "Resume *"
- `frontend/src/components/CreateSessionModal.jsx` — File input not resettable after failed upload: added `e.target.value = ''` in finally block

---

## 2026-03-11 02:00 IST

### Added
- `frontend/src/components/ReportModal.jsx` — PDF export via `jsPDF` (dynamic import): generates report with header, scores, summary, and full transcript with page breaks
- `frontend/src/pages/ProfilePage.jsx` — Account Management section: Export All Data (JSON download) and Delete Account (with confirmation dialog, calls `authApi.deleteAccount()`)
- `frontend/package.json` — Added `jspdf` dependency

### Changed
- `frontend/src/components/ReportModal.jsx` — Replaced `DUMMY_RESUME` import with real `displaySession.structured_resume_snapshot` data; added null-safe rendering with fallback "No resume data" message
- `frontend/src/pages/DashboardPage.jsx` — Replaced hardcoded recommendations with real `ai_suggestions_behavioral` and `ai_suggestions_technical` from latest scored session; keeps fallback generic tips when no scored sessions exist
- `frontend/src/pages/ProfilePage.jsx` — Added `useNavigate`, `authApi` imports, `logout`/`navigate` for account deletion flow, `Download`/`AlertTriangle` icons

---

## 2026-03-11 01:42 IST

### Added
- `frontend/src/hooks/useInterviewWS.js` — Auto-reconnection on WebSocket disconnect: retries every 5s, max 36 attempts (180s total), cancels pending timers on cleanup
- `frontend/src/pages/InterviewPage.jsx` — 180s countdown timer during network loss with progress bar; auto-navigates to `/dashboard` when countdown expires; stops audio capture during disconnect

### Changed
- `frontend/src/hooks/useInterviewWS.js` — Refactored WS connection into `connectWS()` callback for reuse by reconnection logic; removed redundant `setError` on `onerror` (handled by `onclose`)

---

## 2026-03-11 01:25 IST

### Added
- `backend/app/services/interview_manager.py` — Follow-up question logic: `should_followup()` (Module 2/3 only, >20 words, max 2 per topic, time budget check, 40% random chance), `prepare_followup()` (calls `gemini_service.generate_followup_question()`, creates follow-up question objects with parent tracking)
- `backend/app/services/interview_manager.py` — Repeat request detection: `check_repeat_request()` scans STT transcription for "repeat", "say again", "pardon" etc. in short utterances (<15 words)
- `backend/app/routes/interview_ws.py` — `_handle_answer_transition()` helper that checks follow-up opportunity after each answer finalization before delivering next bank question

### Changed
- `backend/app/routes/interview_ws.py` — Wired follow-up logic into all answer finalization paths (silence, max_duration, initial_timeout); added repeat detection in `on_input_transcript` callback; added farewell TTS at interview end (manual, completed, timeout); deduplicated transition code
- `backend/app/services/interview_manager.py` — Added `gemini_service` import for follow-up generation; added repeat phrase keywords tuple

---

## 2026-03-11 00:20 IST

### Added
- `backend/app/services/gemini_live_service.py` — Gemini Live API bridge (`GeminiLiveSession` class) with bidirectional audio streaming, auto-transcription, 15-min session auto-reconnect, interviewer persona system instruction
- `frontend/public/pcm-processor.js` — AudioWorklet processor for real-time PCM capture at 16kHz
- `frontend/src/hooks/useAudioCapture.js` — Mic capture hook using AudioWorklet (16kHz PCM, echo cancellation, noise suppression)
- `frontend/src/hooks/useAudioPlayback.js` — TTS playback hook with gapless buffering via Web Audio API, barge-in support
- `backend/requirements.txt` — Added `google-genai>=1.0.0` (installed v1.66.0) for Gemini Live API

### Changed
- `backend/app/routes/interview_ws.py` — Integrated Gemini Live API audio bridge: audio chunks forwarded to Gemini for STT, questions delivered via TTS, turn_complete events drive flow, text-mode fallback preserved
- `frontend/src/hooks/useInterviewWS.js` — Added `audio_data`, `turn_complete`, `user_speaking_detected` message handlers; added `sendAudioChunk()` and `onAudioDataRef`; fixed stale state closure in WS onclose handler via `stateRef`
- `frontend/src/pages/InterviewPage.jsx` — Wired `useAudioCapture` and `useAudioPlayback` hooks; camera setup now video-only (mic handled separately); auto-start/stop capture based on interview state

### Fixed
- `backend/app/services/interview_manager.py` — 5 bugs: removed unused `gemini_service` import; fixed greeting embedding Q0 text (caused duplicate question delivery); synced filler word list with `session_service.py` (added "right", "so"); fixed `save_interruption_state` NoneType crash; moved `random` import to module top; added `section` field to transcript entries
- `backend/app/routes/interview_ws.py` — 3 bugs: replaced `__import__("time")` hack with proper import; removed inline `import time as _time` in loop; added server-side 10s timeout enforcement (was `pass` before — user could hang forever in waiting state)

---

## 2026-03-02 22:23 IST

### Added
- `frontend.md` — Complete frontend user journey and UI specification (all screens, states, interactions, state management reference)

### Changed
- `idea.md` — Added mandatory changelog rule reminder at top of file
- `plan.md` — Added mandatory changelog rule reminder at top of file
- `AGENTS.md` — Added mandatory changelog rule at top; updated "How to Add a New Feature" to include reading reference docs and explicit changelog format; added `frontend.md` to required pre-read list
- `CHANGES.md` — Switched to most-recent-first (stack) order; updated format to include time + IST timezone

---

## 2026-03-01

### Added
- `plan.md` — Complete product specification compiled from project discussions
- `AGENTS.md` — Codebase guide for AI agents and developers
- `CHANGES.md` — This changelog
- `idea.md` — Original project idea notes (reference)

### Backend — Initial Scaffold
- `backend/app/main.py` — FastAPI app entry point with CORS config
- `backend/app/config.py` — Pydantic-settings based config from .env
- `backend/app/database.py` — MongoDB Atlas connection (motor async client)
- `backend/app/models/user.py` — User Pydantic schemas
- `backend/app/models/resume.py` — Resume Pydantic schemas
- `backend/app/models/session.py` — Session Pydantic schemas
- `backend/app/routes/auth.py` — Auth routes: register, login, delete account
- `backend/app/routes/resumes.py` — Resume routes: list, upload, delete
- `backend/app/routes/sessions.py` — Session routes: CRUD, report
- `backend/app/services/auth_service.py` — Password hashing, JWT, user management
- `backend/app/services/resume_service.py` — FIFO queue, validation, parsing
- `backend/app/services/gemini_service.py` — All Gemini API calls
- `backend/app/services/session_service.py` — Session creation, question bank
- `backend/app/utils/jwt_utils.py` — JWT encode/decode helpers
- `backend/app/utils/file_parser.py` — PDF/DOCX text extraction
- `backend/app/middleware/auth_middleware.py` — JWT auth dependency
- `backend/requirements.txt` — Python dependencies
- `backend/.env.example` — Environment variable template

### Frontend — Initial Scaffold
- `frontend/` — Vite + React scaffold
- `frontend/src/index.css` — Dark theme CSS variables and global styles
- `frontend/src/App.jsx` — Root component with React Router
- `frontend/src/main.jsx` — Entry point
- `frontend/src/context/AuthContext.jsx` — Auth state management
- `frontend/src/services/api.js` — Axios API service layer
- `frontend/src/pages/LoginPage.jsx` — Login page
- `frontend/src/pages/RegisterPage.jsx` — Register page
- `frontend/src/pages/DashboardPage.jsx` — Main dashboard (4 sections)
- `frontend/src/components/Navbar.jsx` — Navigation bar
- `frontend/src/components/SessionCard.jsx` — Interview session card
- `frontend/src/components/CreateSessionModal.jsx` — Create session modal

---

## Template for Future Entries

```
## YYYY-MM-DD HH:MM IST

### Added
- What was added and why

### Changed
- What was modified and why

### Fixed
- What bug was fixed and how

### Removed
- What was removed and why
```
