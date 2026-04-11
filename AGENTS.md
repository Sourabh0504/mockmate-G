> [!IMPORTANT]
> **MANDATORY CHANGELOG RULE — ENFORCED ON EVERY TASK**
> Before starting any work: read `plan.md`, `AGENTS.md`, `frontend.md`, and `prompts.md`.
> After completing any work (code change, file creation, bug fix, config change): add an entry to **`CHANGES.md`** at the **very top** (most recent first).
> Format:
> ```
> ## YYYY-MM-DD HH:MM IST
> ### Added / Changed / Fixed / Removed
> - Description of what changed and why
> ```
> **Never skip the changelog update. It is not optional.**

> [!IMPORTANT]
> **MANDATORY PROMPT SYNC RULE — ENFORCED ON EVERY PROMPT CHANGE**
> Whenever you edit any prompt string inside `backend/app/services/gemini_service.py`, you **MUST** also update the corresponding section in **`prompts.md`**:
> - Bump the version number (v1 → v2, etc.)
> - Copy the new prompt template into a new versioned block
> - Describe what changed and why
> - Move the old version into the History block for that prompt
> `prompts.md` is the single source of truth for all prompt history and optimization notes.

# AGENTS.md — MockMate AI Codebase Guide

> This file is the authoritative guide for any AI agent or developer working on this codebase.
> Read this BEFORE making any changes. Refer to `plan.md` for full product requirements.

---

## Project Identity

**MockMate AI** is a Real-time, Voice-Based, Adaptive Interview Simulator.
- AI conducts adaptive mock interviews based on JD + Resume (not Role)
- Uses Gemini API for LLM tasks and Gemini Live API for STT/TTS
- Hybrid scoring: 70% AI + 30% rule-based
- No audio stored. Text-only persistence. Privacy-first.

---

## Repository Structure

```
MockmateGemini/
├── plan.md               # Complete product specification — READ BEFORE CODING
├── AGENTS.md             # This file — codebase guide for AI agents
├── CHANGES.md            # Changelog — update on every meaningful change
├── prompts.md            # Prompt engineering registry — update on EVERY prompt change
├── idea.md               # Original idea notes (reference only)
│
├── backend/              # FastAPI Python backend
│   ├── app/
│   │   ├── main.py           # FastAPI app entry, CORS, router registration
│   │   ├── config.py         # All env config via pydantic-settings
│   │   ├── database.py       # MongoDB connection — single source of truth
│   │   │
│   │   ├── models/           # Pydantic models (request/response schemas)
│   │   │   ├── user.py       # User create, login, response schemas
│   │   │   ├── resume.py     # Resume upload, parsed structure schemas
│   │   │   └── session.py    # Session create, status, report schemas
│   │   │
│   │   ├── routes/           # API route handlers (thin — delegate to services)
│   │   │   ├── auth.py       # /auth/register, /auth/login, /auth/account
│   │   │   ├── resumes.py    # /resumes — list, upload, delete
│   │   │   └── sessions.py   # /sessions — CRUD, report, resume
│   │   │
│   │   ├── services/         # All business logic lives here
│   │   │   ├── auth_service.py     # Password hashing, JWT creation/validation
│   │   │   ├── resume_service.py   # FIFO queue mgmt, validation, parsing orchestration
│   │   │   ├── gemini_service.py   # ALL Gemini API calls (LLM + Live)
│   │   │   └── session_service.py  # Session creation, question bank gen, eval
│   │   │
│   │   ├── utils/            # Pure utility functions, no business logic
│   │   │   ├── jwt_utils.py        # JWT encode/decode helpers
│   │   │   └── file_parser.py      # Extract raw text from PDF/DOCX
│   │   │
│   │   └── middleware/       # FastAPI middleware
│   │       └── auth_middleware.py  # JWT auth dependency for protected routes
│   │
│   ├── requirements.txt      # Python dependencies
│   ├── .env.example          # Template for environment variables
│   └── .env                  # Actual secrets (git-ignored)
│
└── frontend/             # React (Vite) frontend
    ├── src/
    │   ├── main.jsx          # React entry point
    │   ├── App.jsx           # Root component, routing
    │   ├── index.css         # Global styles, CSS variables, dark theme
    │   │
    │   ├── pages/            # One file per route/page
    │   │   ├── LoginPage.jsx
    │   │   ├── RegisterPage.jsx
    │   │   └── DashboardPage.jsx
    │   │
    │   ├── components/       # Reusable UI components
    │   │   ├── SessionCard.jsx       # Interview session card
    │   │   ├── CreateSessionModal.jsx# Create session popup
    │   │   └── Navbar.jsx            # Top navigation
    │   │
    │   ├── services/         # API communication layer
    │   │   └── api.js        # All axios calls to backend — import from here
    │   │
    │   └── context/          # React Context for global state
    │       └── AuthContext.jsx   # Auth state (user, token, login/logout)
    │
    ├── index.html
    ├── vite.config.js
    └── package.json
```

---

## Core Conventions

### Backend (Python / FastAPI)

1. **Routes are thin** — route handlers only validate input and call a service. No business logic in routes.
2. **Services are thick** — all logic (DB, Gemini calls, FIFO management, scoring) lives in `services/`.
3. **Single DB import** — always import `db` from `app.database`. Never create new connections elsewhere.
4. **Config via env** — all secrets and config from `app.config`. Never hardcode values.
5. **Pydantic models** — all request/response bodies use Pydantic models from `app/models/`.
6. **Gemini calls** — ALL Gemini API interactions go through `app/services/gemini_service.py`. Never call Gemini directly from routes or other services.
7. **Async everywhere** — all route functions and service functions use `async def`.
8. **Error handling** — raise `HTTPException` with appropriate status codes. Never return raw errors.

### Frontend (React / Vite)

1. **API calls** — always use `src/services/api.js`. Never use fetch/axios directly in components.
2. **Auth state** — always read from `AuthContext`. Never store token in component state.
3. **Pages vs Components** — pages are route-level. Components are reusable units.
4. **CSS** — use CSS variables from `index.css`. No inline styles unless absolutely necessary.
5. **Naming** — PascalCase for components/pages, camelCase for functions/variables.

---

## Database (MongoDB Atlas)

- **Connection string** is in `.env` as `MONGODB_URI`
- **Database name** is in `.env` as `MONGODB_DB_NAME`
- All switching between local/Atlas is done ONLY in `app/database.py` and `.env`
- Collections: `users`, `resumes`, `sessions`
- All documents use `_id` as ObjectId. When returning to frontend, convert to string.

---

## Environment Variables (see `.env.example`)

```
MONGODB_URI=           # MongoDB Atlas connection string
MONGODB_DB_NAME=       # Database name
JWT_SECRET=            # Secret key for JWT signing
JWT_ALGORITHM=         # HS256
JWT_EXPIRY_MINUTES=    # Token expiry in minutes
GEMINI_API_KEY=        # Google Gemini API key
FRONTEND_URL=          # Frontend URL for CORS
```

---

## Key Rules from plan.md (Never Violate)

1. Role input is stored as metadata only. AI never uses it.
2. Only PDF and DOCX resume formats accepted.
3. Max 5 resumes per user — FIFO, oldest deleted on 6th upload.
4. Mandatory resume sections: Projects + Education (fuzzy match).
5. No audio ever stored — real-time streaming only.
6. Evaluation happens on RAW transcript BEFORE spell correction.
7. Filler words (um, uh, like) preserved in corrected transcript.
8. Per-session resume JSON snapshot stored in session document permanently.
9. Session card order: LIFO (newest first) always.
10. Manual termination = no resume. Network failure = resume allowed.

---

## How to Add a New Feature

1. Read `plan.md`, `AGENTS.md`, `frontend.md`, and `prompts.md` before starting
2. Add/update Pydantic models in `app/models/`
3. Add service logic in `app/services/`
4. Add route in `app/routes/` (thin — just calls service)
5. Register route in `app/main.py` if new router
6. Add API call helper in `frontend/src/services/api.js`
7. Build the UI component/page
8. **If you added or modified any Gemini prompt:** update `prompts.md` with the new version, old version history, and reason for change.
9. **Update `CHANGES.md` at the TOP** — use format `## YYYY-MM-DD HH:MM IST` with `### Added / Changed / Fixed / Removed` sub-sections. Most recent entry always at the top.

---

## How to Run

### Backend
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

---

## Do Not

- Do not put business logic in route handlers
- Do not call Gemini API outside `gemini_service.py`
- Do not store audio files anywhere
- Do not show live transcription to the user
- Do not use Role input for any AI logic
- Do not create a new DB connection outside `database.py`
- Do not hardcode secrets or API keys
- Do not forget to update `CHANGES.md`
- Do not edit a prompt in `gemini_service.py` without updating `prompts.md`
