# CHANGES.md — MockMate AI Changelog

> **Stack order — most recent entry is always at the TOP.**
> Format for each entry: `## YYYY-MM-DD HH:MM IST` then `### Added / Changed / Fixed / Removed` sub-sections.
> Every code change, file creation, bug fix, or config update must be logged here immediately.

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
