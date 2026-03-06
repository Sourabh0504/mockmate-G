# MockMate AI — Frontend User Journey & UI Specification

**Version:** 1.0  
**Date:** 2026-03-02  
**Scope:** Complete UI flow, component breakdown, and interaction design for every screen the user encounters from first visit to final report.

---

## Table of Contents

1. [Design System](#1-design-system)
2. [Routing & Auth Guard](#2-routing--auth-guard)
3. [Screen 1 — Register Page](#3-screen-1--register-page)
4. [Screen 2 — Login Page](#4-screen-2--login-page)
5. [Screen 3 — Dashboard](#5-screen-3--dashboard)
   - [Navbar](#51-navbar)
   - [Section A — Interview Sessions](#52-section-a--interview-sessions)
   - [Section B — Overtime Insights](#53-section-b--overtime-insights)
   - [Section C — Skill Analysis](#54-section-c--skill-analysis)
   - [Section D — AI Recommendations](#55-section-d--ai-recommendations)
6. [Modal — Create Session](#6-modal--create-session)
7. [Session Card — All States](#7-session-card--all-states)
8. [Modal — Rules & Regulations](#8-modal--rules--regulations)
9. [Screen 4 — Interview Screen](#9-screen-4--interview-screen)
   - [Interview Layout](#91-interview-layout)
   - [Answer Cycle UI Behaviour](#92-answer-cycle-ui-behaviour)
   - [Interruption & Repeat Handling](#93-interruption--repeat-handling)
   - [Network Failure Overlay](#94-network-failure-overlay)
   - [End Call Flow](#95-end-call-flow)
10. [Screen 5 — Post-Interview (Dashboard Update)](#10-screen-5--post-interview-dashboard-update)
11. [Modal — Detailed Report](#11-modal--detailed-report)
    - [Tab 1 — Transcript](#111-tab-1--transcript)
    - [Tab 2 — Skill Analysis](#112-tab-2--skill-analysis)
    - [Tab 3 — Resume Snapshot](#113-tab-3--resume-snapshot)
    - [Tab 4 — Summary](#114-tab-4--summary)
    - [Tab 5 — Export](#115-tab-5--export)
12. [Complete User Journey Map](#12-complete-user-journey-map)
13. [Pages & Components To Build](#13-pages--components-to-build)
14. [State Management Reference](#14-state-management-reference)

---

## 1. Design System

All UI is built on a **dark theme** with the following design tokens defined in `src/index.css`:

### Color Palette

| Token | Value | Usage |
|---|---|---|
| `--bg-primary` | `#0a0a0f` | Page backgrounds |
| `--bg-secondary` | `#111118` | Input backgrounds, metric boxes |
| `--bg-card` | `#16161f` | Cards, sections |
| `--bg-card-hover` | `#1c1c28` | Card hover state |
| `--bg-modal` | `#13131a` | Modal backgrounds |
| `--accent-primary` | `#6c63ff` | Primary buttons, links, scores |
| `--accent-secondary` | `#4ecdc4` | Progress bars, gradients |
| `--accent-danger` | `#ff4757` | Danger button, End Call |
| `--accent-success` | `#2ed573` | "Start Interview" badge |
| `--accent-warning` | `#ffa502` | Interrupted badge, warnings |
| `--text-primary` | `#f0f0f5` | Headings, button text |
| `--text-secondary` | `#9090a8` | Labels, subtitles |
| `--text-muted` | `#5a5a72` | Timestamps, placeholders |
| `--border-color` | `#2a2a3a` | All borders |

### Typography

- **Font:** Inter (Google Fonts, weights 300–700)
- **Base size:** 16px
- **Anti-aliased:** `-webkit-font-smoothing: antialiased`

### Component Tokens

| Class | Appearance |
|---|---|
| `.btn-primary` | Purple `#6c63ff`, white text, hover lifts `-1px` |
| `.btn-danger` | Red `#ff4757`, white text |
| `.btn-ghost` | Transparent, border `--border-color`, hover border turns purple |
| `.card` | Dark card bg, border, `border-radius: 18px`, hover darkens |
| `.badge-creating` | Purple tint on dark |
| `.badge-ready` | Green tint on dark |
| `.badge-live` | Bright green tint |
| `.badge-completed` | Blue tint on dark |
| `.badge-interrupted` | Orange/amber tint |
| `.error-msg` | Red tint box with red border |
| `.info-msg` | Purple tint box |
| `.spinner` | 20×20px purple rotating ring |

### Modal Style

Modals appear centered over a `rgba(0,0,0,0.7)` backdrop with `backdrop-filter: blur(4px)`. Max-width `540px`, scrollable if content overflows.

---

## 2. Routing & Auth Guard

```
Route: /           → redirect to /dashboard
Route: /login      → PublicRoute (redirect to /dashboard if already logged in)
Route: /register   → PublicRoute (redirect to /dashboard if already logged in)
Route: /dashboard  → ProtectedRoute (redirect to /login if not authenticated)
Route: /interview/:session_id  → ProtectedRoute [TO BUILD]
Route: /report/:session_id     → ProtectedRoute [TO BUILD] (optional — could be modal)
```

**Auth state** lives in `AuthContext`. JWT token read from `localStorage` on app load. If token exists and is valid → user is authenticated.

**Loading state:** While auth is initialising (checking localStorage), the app renders a centered purple "Loading..." text. No flash of wrong screen.

---

## 3. Screen 1 — Register Page

**Route:** `/register`  
**File:** `src/pages/RegisterPage.jsx`  
**Guard:** Public only — authenticated users are redirected away.

### Layout

Centered vertically and horizontally on a `--bg-primary` full-height background. A single card (`max-width: 400px`) contains all content.

### Elements (top to bottom)

1. **Logo** — "MockMate **AI**" where "AI" is in `--accent-primary` (purple). Font size 24px, weight 700.
2. **Heading** — "Create your account" — 22px, weight 600.
3. **Subtitle** — "Start practicing for your dream job" — 14px, `--text-secondary`.
4. **Error message** — `.error-msg` box appears above the form if any field fails. Hidden by default.
5. **Form fields:**
   - **Full Name** — text input, placeholder "Your full name", autofocused
   - **Email** — email input, placeholder "you@example.com"
   - **Password** — password input, placeholder "••••••••", min 6 chars
   - **Confirm Password** — password input, placeholder "Repeat password"; client-validated to match
6. **Submit button** — `.btn-primary`, full width, "Create Account". Shows spinner while loading.
7. **Footer link** — "Already have an account? [Sign in]" — links to `/login`.

### Behaviour

- On submit: POST to `/auth/register` → on success, auto-login and redirect to `/dashboard`
- On error: Show backend error detail in `.error-msg` box
- Password mismatch detected client-side before API call — shows "Passwords do not match"

---

## 4. Screen 2 — Login Page

**Route:** `/login`  
**File:** `src/pages/LoginPage.jsx`  
**Guard:** Public only.

### Layout

Same centered card layout as Register (`max-width: 400px`).

### Elements (top to bottom)

1. **Logo** — "MockMate **AI**" (same purple accent)
2. **Heading** — "Welcome back" — 22px, weight 600
3. **Subtitle** — "Sign in to continue your interview practice"
4. **Error message** — `.error-msg` box, hidden by default
5. **Form fields:**
   - **Email** — email input, autofocused
   - **Password** — password input
6. **Submit button** — `.btn-primary`, full width, "Sign In". Shows spinner while loading.
7. **Footer link** — "Don't have an account? [Create one]" — links to `/register`

### Behaviour

- On submit → POST `/auth/login` → on success: store JWT + user in `AuthContext` → redirect to `/dashboard`
- On error: display `.error-msg` with backend message (e.g. "Invalid credentials")

---

## 5. Screen 3 — Dashboard

**Route:** `/dashboard`  
**File:** `src/pages/DashboardPage.jsx`  
**Guard:** Protected.

### Overall Layout

```
┌──────────────────────────────────────────────────────────────────────────┐
│  NAVBAR (full width)                                                      │
├──────────────────────────────────────────────────────────────────────────┤
│  Content Area (max-width: 1280px, centered, padding: 32px 24px)          │
│  ┌────────────────────────────────────┐  ┌──────────────────────────┐    │
│  │  SECTION A                         │  │  SECTION B               │    │
│  │  Interview Sessions (LIFO stack)   │  │  Overtime Insights       │    │
│  │                                    │  │  (most recent session)   │    │
│  │  [Session Card 1 — newest]         │  ├──────────────────────────┤    │
│  │  [Session Card 2]                  │  │  SECTION C               │    │
│  │  [Session Card 3]                  │  │  Skill Analysis          │    │
│  │  ...                               │  ├──────────────────────────┤    │
│  │                                    │  │  SECTION D               │    │
│  │                                    │  │  AI Recommendations      │    │
│  └────────────────────────────────────┘  └──────────────────────────┘    │
└──────────────────────────────────────────────────────────────────────────┘
```

Grid: `1fr 380px` — sessions column expands, right column is fixed width sidebar.

---

### 5.1 Navbar

**File:** `src/components/Navbar.jsx`

Full-width top bar with:
- **Left:** "MockMate **AI**" logo (purple accent on "AI")
- **Right:** User email (smaller muted text) + "Sign Out" ghost button

Clicking Sign Out calls `logout()` from `AuthContext` → clears token → redirects to `/login`.

---

### 5.2 Section A — Interview Sessions

**Header row:**
- Left: "Interview Sessions" heading (17px, weight 600)
- Right: **"+ Create Session"** primary button → opens Create Session modal

**Empty state** (no sessions yet):
- Centered card with: "No interview sessions yet." + "Create your first session to get started."

**Session list:**
- Sessions rendered in LIFO order (newest at top)
- Each session is a `SessionCard` component separated by 12px gap
- Dashboard polls the backend every 10 seconds when any session has status `creating` or `live`, to pick up status changes automatically

---

### 5.3 Section B — Overtime Insights

Shows metrics from the **most recently completed session** that has a non-null overall score.

**When data exists:**
```
┌──────────────┬──────────────┐
│  Overall     │  Fluency     │
│  Score       │              │
│  [large num] │  [large num] │
├──────────────┼──────────────┤
│  Content     │  Confidence  │
│  Quality     │              │
│  [large num] │  [large num] │
└──────────────┴──────────────┘
```
- 2×2 grid of metric boxes
- Each box: large number (26px, bold, `--accent-primary`) + label (11px, `--text-muted`)
- Values are rounded integers (0–100)

**When no completed session:** "Complete an interview to see insights." muted text.

---

### 5.4 Section C — Skill Analysis

Shows 5 skill progress bars from the most recent completed session.

**Skills displayed:**
1. Technological Knowledge
2. Communication
3. Problem Solving
4. Leadership
5. Cultural Fit

**Each skill row:**
- Left label (13px, `--text-secondary`) + right numeric value (13px, bold)
- Full-width progress track (6px height, `--bg-secondary` background)
- Filled bar: gradient from `--accent-primary` → `--accent-secondary`, width = `${value}%`
- Animated via `transition: width 0.6s ease`

**Empty state:** "Skill analysis will appear after your first interview."

---

### 5.5 Section D — AI Recommendations

Shows AI-generated improvement suggestions from the latest session report.

**When data available** (fetched from session report endpoint):
- Two subsections: "Behavioral" and "Technical"
- Each presented as a numbered or bulleted list of 2–4 suggestions
- Each suggestion is a complete sentence, actionable and specific

**Empty state:** "Complete an interview to get personalized recommendations."

> **Note:** Currently a stub in `DashboardPage.jsx`. Needs to be wired to the session report API to fetch `ai_suggestions_behavioral` and `ai_suggestions_technical`.

---

## 6. Modal — Create Session

**Trigger:** Clicking "+ Create Session" in Section A header.  
**File:** `src/components/CreateSessionModal.jsx`

The modal overlays the dashboard (backdrop blur). Clicking outside the modal box closes it.

### Fields (top to bottom)

1. **Role Title** *(required)*
   - Free text input
   - Label: "Role Title (for reference only)" — the "(for reference only)" is muted to signal the AI doesn't use it
   - Placeholder: "e.g. Frontend Engineer at Google"
   - Used purely as a label for the session card — AI never reads this

2. **Job Description** *(required)*
   - Textarea, `min-height: 140px`, resizable vertically
   - Placeholder: "Paste the full job description here..."
   - `minLength: 50` — enforced client-side

3. **Resume** *(select from existing)*
   - If user has uploaded resumes: dropdown showing `filename — upload date` for each (most recent first, up to 5)
   - First resume auto-selected by default
   - If no resumes exist: shows "No resumes uploaded yet." text in muted colour

4. **Upload New Resume** *(optional)*
   - File input accepting `.pdf` and `.docx` only
   - "Upload" ghost button beside the input
   - On click: POST to `/resumes/upload` with `FormData`
   - While uploading: button shows spinner
   - On success: new resume added to dropdown, auto-selected
   - On failure: `.error-msg` shows backend error (e.g., "Resume must contain Projects and Education sections")

5. **Difficulty** + **Duration** *(side by side, 2-column grid)*
   - **Difficulty:** dropdown — Easy / Moderate / Hard (default: Moderate)
   - **Duration:** dropdown — 10 / 15 / 20 / 25 / 30 minutes (default: 20)

### Action Buttons (full-width row at bottom)

- **Cancel** (ghost, flex: 1) → closes modal, no changes
- **Create Interview Session** (primary, flex: 2) → submits form

### Submission Flow

1. Validate `resume_id` is selected (error if not)
2. POST to `/sessions/` with `{ role, jd_text, resume_id, difficulty, duration }`
3. While submitting: button shows `spinner + "Creating..."`
4. **On success:**
   - Modal closes
   - New session card immediately appears at top of Section A with status `creating`
   - Dashboard polls every 10s for status updates
5. **On error:** `.error-msg` shows inside the modal, modal stays open

---

## 7. Session Card — All States

**File:** `src/components/SessionCard.jsx`

Each card shows: **Role title**, **date · duration · difficulty**, **status badge**, and context-specific content below.

### State: `creating`

```
┌─────────────────────────────────────────────────────┐
│  Frontend Engineer at Google          [Creating...] │
│  02 Mar 2026 · 20 min · Moderate                    │
│  ┌─────────────────────────────────────────────┐    │
│  │ 🔄  It might take 2–3 minutes to review     │    │
│  │     your Profile and Job Description.       │    │
│  └─────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────┘
```

- Badge: purple tint "Creating Session"
- Inline spinner (16×16) + italic subtext in a purple-tinted info box
- No action button

### State: `ready`

```
┌─────────────────────────────────────────────────────┐
│  Frontend Engineer at Google          [Start →  ]   │
│  02 Mar 2026 · 20 min · Moderate                    │
│  ⚠️ JD quality warning (if applicable)              │
│                           [Start Interview]         │
└─────────────────────────────────────────────────────┘
```

- Badge: green tint "Start Interview"
- Optional: if JD was rated < 5/10, a `.info-msg` warning appears: `⚠️ {jd_quality_message}`
- Action button: **"Start Interview"** (primary) → opens Rules & Regulations modal

### State: `live`

```
┌─────────────────────────────────────────────────────┐
│  Frontend Engineer at Google          [• Live]      │
│  02 Mar 2026 · 20 min · Moderate                    │
└─────────────────────────────────────────────────────┘
```

- Badge: bright green "Live"
- No action button (interview in progress in another tab/screen)

### State: `completed` (evaluating)

```
┌─────────────────────────────────────────────────────┐
│  Frontend Engineer at Google          [Completed]   │
│  02 Mar 2026 · 20 min · Moderate                    │
│  🔄  Evaluating the interview...                    │
└─────────────────────────────────────────────────────┘
```

- Badge: blue tint "Completed"
- Spinner + "Evaluating the interview..." — shown while `scores.overall` is null

### State: `completed` (scored)

```
┌─────────────────────────────────────────────────────┐
│  Frontend Engineer at Google          [Completed]   │
│  02 Mar 2026 · 20 min · Moderate                    │
│  ─────────────────────────────────────────────────  │
│  Overall Score                             78/100   │
│                               [📄 Detailed Report]  │
└─────────────────────────────────────────────────────┘
```

- Score row: "Overall Score" label + `78` (22px, bold, purple) + `/100` (muted)
- **"📄 Detailed Report"** ghost button → opens Detailed Report modal/page

### State: `interrupted`

```
┌─────────────────────────────────────────────────────┐
│  Frontend Engineer at Google        [Interrupted]   │
│  02 Mar 2026 · 20 min · Moderate                    │
│                           [Resume Interview]        │
└─────────────────────────────────────────────────────┘
```

- Badge: amber/orange tint "Interrupted"
- **"Resume Interview"** primary button → re-enters the interview at the interruption point

### State: `failed`

- Badge: red/orange tint "Failed"
- Optional retry clarification message
- No action button

---

## 8. Modal — Rules & Regulations

**Trigger:** Clicking "Start Interview" on a `ready` session card.  
**File to build:** `src/components/RulesModal.jsx` [NOT YET BUILT]

This popup appears before the interview screen loads. It ensures the user understands what they're about to do.

### Content

**Title:** "Before You Begin"

**Body sections:**

1. **About this interview**
   - Duration: e.g. "This interview is set for 20 minutes"
   - Format: "Voice-based — the AI will speak questions aloud. You respond using your microphone."

2. **Privacy Notice**
   - ✅ "Your audio is processed in real time and is never stored."
   - ✅ "Only the text transcript of your answers is saved."
   - ✅ "Your camera feed is used for realism only — it is not recorded."

3. **Rules**
   - You have 10 seconds to start speaking after each question
   - If you pause for more than 7 seconds, the AI will move to the next question
   - Maximum 120 seconds per answer
   - You can say "Can you repeat that?" to hear the question again
   - You can end the interview early. Partial results will be evaluated.

4. **Network Policy**
   - If you lose connection, you have 180 seconds to reconnect. The interview will pause.
   - If you cannot reconnect within 3 minutes, the session is saved and you can resume later.

5. **Checkbox** — "I understand and agree to these rules" (required to enable the start button)

### Action Buttons

- **"Cancel"** (ghost) → closes modal, returns to dashboard
- **"Agree and Start Interview"** (primary, disabled until checkbox is checked) → triggers mic + camera permission check → loads Interview Screen

### Permission Check Flow (after "Agree and Start")

1. Browser requests microphone permission
   - If denied: show error "Microphone access is required to proceed. Please allow microphone access in your browser settings." + Cancel button
2. Browser requests camera permission
   - If denied: show warning "Camera is optional but recommended for a realistic interview experience." + option to proceed without camera
3. If mic granted → navigate to `/interview/:session_id`

---

## 9. Screen 4 — Interview Screen

**Route:** `/interview/:session_id`  
**File to build:** `src/pages/InterviewPage.jsx`  
**File to build:** `src/hooks/useInterviewWS.js`  

This is the main interview experience. The WebSocket connection to `/ws/interview/{session_id}?token={jwt}` is established immediately on page load.

---

### 9.1 Interview Layout

```
┌──────────────────────────────────────────────────────────────────────────┐
│  ┌──────────────────────────────────────────────────────────────────┐    │
│  │  Tell me about a project where you had to deal with a complex... │    │
│  │                                               [Timer: 0:42 ⏱]   │    │
│  └──────────────────────────────────────────────────────────────────┘    │
│                                                                           │
│  ┌───────────────────────────────┐  ┌────────────────────────────────┐   │
│  │                               │  │                                │   │
│  │    USER CAMERA FEED           │  │    AI AVATAR                   │   │
│  │    (live webcam, not saved)   │  │    (image / animation)         │   │
│  │                               │  │    Animated speaking indicator │   │
│  │    [Name tag: Sourabh]        │  │    [Name tag: MockMate AI]     │   │
│  └───────────────────────────────┘  └────────────────────────────────┘   │
│                                                                           │
│  [Speaking pace: ✅ Good pace]                    [🔴 End Call]           │
└──────────────────────────────────────────────────────────────────────────┘
```

### Element Breakdown

**Question Area (top banner):**
- Current question text — large, centered, readable (18–20px, `--text-primary`)
- Timer display — shows remaining answer time (e.g. "0:42") with a clock icon
- Subtle background: slight card style, not distracting

**User Camera Feed (left card):**
- Live `<video>` element from `getUserMedia()` — mirrored horizontally
- "Not recorded" tag in bottom-left corner of video
- Name tag at bottom: the user's name
- If camera permission denied: shows a user silhouette placeholder

**AI Avatar (right card):**
- Static image or subtle looping animation (e.g. breathing/pulsing effect)
- When AI is speaking: avatar has an active indicator (glowing border, waveform animation below)
- When AI is silent/listening: indicator dims
- Name tag: "MockMate AI"

**Speaking Pace Indicator (bottom-left):**
- Shows one of three states: `✅ Good pace` / `⚡ Too fast — slow down` / `🐢 Too slow — speak up`
- Only appears when user is actively being measured
- Small and unobtrusive — does not block other content

**End Call Button (bottom-right):**
- Red circle button with phone hang-up icon (Google Meet style)
- On click: triggers End Call confirmation popup

---

### 9.2 Answer Cycle UI Behaviour

**Phase 1 — AI Speaking:**
- AI avatar glows / shows speaking animation
- Current question text fades in at the top
- Timer hidden
- Interruption detection: if user's mic picks up voice, AI TTS cuts immediately

**Phase 2 — Waiting for user to start (10s timer):**
- Timer area shows: "Starting in 10s..." with a countdown bar
- User has 10 seconds to begin speaking before AI moves on
- If user speaks: transition to Phase 3

**Phase 3 — User Speaking (listening mode):**
- Listening indicator shows (could be animated microphone icon or waveform visualizer)
- 120-second total answer cap runs silently in background
- 7-second silence detection runs

**Phase 4 — Silence Warning (7s countdown):**
- Warning overlay appears inside the question area or bottom of screen:
  > "Moving to the next question in **7 seconds**. Speak up to stop the timer."
- Countdown: 7, 6, 5... (ticks down visibly)
- If user speaks again: warning disappears, silence timer resets, returns to Phase 3
- If 7s elapses without speech: answer finalized → Phase 5

**Phase 5 — Transition:**
- AI avatar speaks filler phrase ("Alright.", "I see.", etc.) — animated speaking indicator
- Next question fades in
- Cycle repeats from Phase 1

**Hard Cap — 120s:**
- If user has been speaking for 120s continuously, answer is cut
- AI speaks: "Thank you, let's move on." → next question

---

### 9.3 Interruption & Repeat Handling

**Interruption (user speaks while AI is speaking):**
- AI audio stream cuts mid-sentence immediately
- Avatar stops speaking animation
- System enters listening mode (Phase 3)
- No visual warning — this is normal, expected behaviour

**"Can you repeat?" detection:**
- If STT transcript contains phrases like: "can you repeat", "repeat that", "say that again", "what was the question", "pardon", "sorry could you"
- System replays the question (AI speaks it again, or a slight rephrase)
- Repeat indicator may briefly flash: "♻️ Repeating question..."
- Timers reset to give user proper time to answer
- Event logged but not penalised in scoring

---

### 9.4 Network Failure Overlay

Appears on top of the interview screen when WebSocket disconnects.

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│       📡  Connection Lost                                           │
│       Attempting to reconnect...                                    │
│                                                                     │
│       Reconnect window: 2:47                                        │
│       ████████░░░░░░░░░░░░  (countdown progress bar)               │
│                                                                     │
│       Your progress is being saved.                                 │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

- Full-screen semi-transparent overlay
- 180-second countdown timer (visible, ticking)
- Progress bar showing time remaining
- "Your progress is being saved." reassurance text
- If reconnected: overlay fades out, AI says "Welcome back. Let's continue where we left off."
- If 180s expires: overlay shows "Session paused. You can resume from your dashboard." + "Go to Dashboard" button

---

### 9.5 End Call Flow

**Step 1 — End Call clicked:**
- Confirmation popup appears (small modal, centered):
  ```
  ┌────────────────────────────────────┐
  │  End this interview?               │
  │                                    │
  │  This action is final. Your        │
  │  interview cannot be resumed.      │
  │                                    │
  │  [Cancel]  [Yes, End Interview]    │
  └────────────────────────────────────┘
  ```
- "Yes, End Interview" button is red (`.btn-danger`)

**Step 2 — If confirmed:**
- WebSocket sends `{ type: "end_interview" }` message to server
- Server marks session as `completed` (early termination)
- WebSocket closes
- User is **redirected to `/dashboard`**
- Session card immediately shows `completed` status with evaluation spinner

**Step 3 — If cancelled:**
- Popup closes, interview resumes exactly where it was

---

## 10. Screen 5 — Post-Interview (Dashboard Update)

After the interview ends (normally, manually, or via network expiry), the user is on the Dashboard.

### What Changes

**Session card updates:**
- Status: `completed`
- Shows animated spinner + "Evaluating the interview..." text below score area
- "Detailed Report" button is disabled / not shown yet

**Dashboard continues polling** every 10 seconds.

**When evaluation completes (backend writes scores to MongoDB):**
- Score appears on card: "Overall Score: **78**/100"
- "📄 Detailed Report" button becomes active
- Section B (Overtime Insights): updates to show new session's scores
- Section C (Skill Analysis): updates to show new session's skill breakdown
- Section D (AI Recommendations): loads new suggestions

---

## 11. Modal — Detailed Report

**Trigger:** Clicking "📄 Detailed Report" on a completed session card.  
**File to build:** `src/pages/ReportPage.jsx` or `src/components/ReportModal.jsx`

Opens as a large full-screen modal (or dedicated page). Contains multiple tabs.

### Header (always visible)

```
Frontend Engineer at Google
02 Mar 2026  ·  20 min  ·  Moderate  ·  JD: Technical

Overall Score: 78/100
```

Also shows JD quality warning (if applicable): `⚠️ JD quality warning message`

---

### 11.1 Tab 1 — Transcript

Shows all Q&A pairs in interview order.

**Each entry:**
```
─────────────────────────────────────────────────────────
Q3  [Projects · Score: 82/100]
Tell me about a project where you optimised database queries.

Your Answer:
"So, uh, in my final year project, I worked on a, um, e-commerce platform
where we had significant latency issues. I identified that the problem was
in our product listing query which was doing full table scans..."

💬 Comment: Strong answer demonstrating practical problem-solving skills.
            Good use of a specific example with measurable impact.

💡 Suggestion: Consider structuring your answer using STAR format to make
               the narrative clearer. Avoid filler words like "uh" and "um".

✅ Expected Answer: [click to expand]
   "In my e-commerce project, I resolved N+1 query issues by implementing
    eager loading with JOIN queries, reducing page load time by 60%..."
─────────────────────────────────────────────────────────
```

Details per entry:
- Question number, section tag, score badge (colour-coded by score range)
- Question text (bold)
- User's corrected answer (preserves filler words)
- AI Comment (2–3 sentences)
- AI Suggestion (actionable improvement)
- Collapsible "Expected Answer" section

Score colour coding:
- 80–100: green
- 60–79: blue/purple
- 40–59: amber/orange
- 0–39: red

---

### 11.2 Tab 2 — Skill Analysis

Full skill breakdown with larger progress bars and numeric scores.

```
Technological Knowledge    ████████████████░░░░  82
Communication              ████████████░░░░░░░░  61
Problem Solving            ██████████████░░░░░░  70
Leadership                 ████████░░░░░░░░░░░░  40
Cultural Fit               ██████████████████░░  90
```

- Each skill: label + filled progress bar + numeric value
- JD type shown: "Scoring weights applied: Technical Role"
- Brief explanatory note: "Technological Knowledge weighted at 40% for technical roles"

---

### 11.3 Tab 3 — Resume Snapshot

Shows the structured resume that was used for this interview (permanent snapshot).

Displayed as a collapsible accordion:

```
▼ Personal Info
   Sourabh Chaudhari · sourabh@example.com · +91 XXXXXXXXXX

▼ Education
   B.E. Computer Engineering, University of Pune, 2025, CGPA: 8.4

▼ Experience
   (empty for fresher)

▼ Projects
   ► MockMate AI — Real-time voice interview simulator
     Tech: React, FastAPI, MongoDB, Gemini API
     ...

▼ Certifications
   ► Google Cloud Digital Leader — Google Cloud, 2024

▼ Skills
   Python, JavaScript, React, FastAPI, MongoDB, Docker...
```

Note: "This is the resume that was used for your interview on 02 Mar 2026. Even if you delete or replace this resume, this record is preserved."

---

### 11.4 Tab 4 — Summary

**Overall Score** — large display  
**Overall Interview Summary** (4–5 line AI paragraph, professional tone):

> "Sourabh demonstrated strong technical knowledge throughout the interview, particularly in database optimisation and full-stack development. His answers were well-structured for the more technical questions, though there were some opportunities to provide more specific metrics and outcomes. Communication clarity was generally good, though filler word frequency was higher than ideal. Problem solving skills showed depth, with practical examples from personal projects. Areas to improve include reducing verbal hesitation and deepening knowledge of system design concepts relevant to the role."

**Behavioral Suggestions:**
1. Work on reducing filler words (um, uh, like) — practice pausing instead of filling silence
2. Structure answers using STAR format (Situation, Task, Action, Result) for behavioral questions
3. Maintain a steady speaking pace — you occasionally spoke too fast during technical explanations
4. Build confidence by practising answers out loud before interviews

**Technical Suggestions:**
1. Study distributed system design and microservices architecture
2. Deepen knowledge of SQL query optimisation (indexes, execution plans, caching)
3. Revise REST API design principles and best practices
4. Review cloud platform services relevant to this role (GCP/AWS)

---

### 11.5 Tab 5 — Export

**Export as PDF** button (primary):
- Generates a PDF containing: header, overall score, summary, transcript (question + corrected answer + score), skill analysis bars, resume snapshot
- Uses `jsPDF` or `react-pdf`

**Export Raw JSON** button (ghost):
- Downloads full session data as `mockmate_report_{session_id}.json`
- Useful for personal records or analysis

---

## 12. Complete User Journey Map

```
NEW USER
   │
   ▼
/register ──► fill name, email, password ──► POST /auth/register
   │                                               │
   │                                          Success → auto-login
   │                                               │
   ▼                                               ▼
/dashboard ◄──────────────────────────────── /login (returning user)
   │
   ├── No sessions yet → "No interview sessions yet." empty state
   │
   ├── Click "+ Create Session" → CreateSessionModal opens
   │       │
   │       ├── Upload resume (if first time) → POST /resumes/upload
   │       │       │ Success → resume appears in dropdown
   │       │       │ Failure → error shown (missing sections / wrong format)
   │       │
   │       ├── Fill: Role, JD, Resume, Difficulty, Duration
   │       │
   │       └── Click "Create Interview Session" → POST /sessions/
   │               │
   │               └── Card appears at top: status "creating" + spinner
   │                       │
   │                       │  (background: Gemini analyses JD + generates questions)
   │                       │  ~2-3 minutes
   │                       ▼
   │               Card status → "Start Interview" (green badge)
   │
   ├── Click "Start Interview" on ready card → RulesModal opens
   │       │
   │       ├── Read rules + check consent checkbox
   │       │
   │       └── Click "Agree and Start Interview"
   │               │
   │               ├── Browser requests mic permission → granted
   │               ├── Browser requests camera permission → granted / optional
   │               │
   │               └── Navigate to /interview/:session_id
   │
   ├── /interview/:session_id
   │       │
   │       ├── WebSocket connects: /ws/interview/{id}?token={jwt}
   │       │
   │       ├── AI speaks greeting + first question "Please introduce yourself."
   │       │
   │       ├── [Q&A loop — N questions based on duration]
   │       │       │
   │       │       ├── AI speaks question → question appears on screen
   │       │       ├── User has 10s to start → speaking mode
   │       │       ├── 7s silence detection → warning → finalize answer
   │       │       ├── AI evaluation happens asynchronously in background
   │       │       ├── AI speaks transition phrase → next question
   │       │       └── [repeat...]
   │       │
   │       ├── [Network drop?] → Overlay: 180s reconnect countdown
   │       │       ├── Reconnect → "Welcome back. Let's continue."
   │       │       └── Timeout → session marked "interrupted", redirect to dashboard
   │       │
   │       ├── [User clicks End Call] → Confirmation popup
   │       │       ├── "Yes, End Interview" → session ends, redirect to dashboard
   │       │       └── "No, Continue" → interview resumes
   │       │
   │       └── [Session time expires] → Interview ends → redirect to dashboard
   │
   ├── Back on /dashboard
   │       │
   │       ├── Card shows: "Completed" + spinner + "Evaluating the interview..."
   │       │
   │       │  (background: full evaluation runs — per-Q scoring, summaries)
   │       │  ~1-3 minutes depending on session length
   │       │
   │       └── Card updates: Overall Score appears + "📄 Detailed Report" active
   │               │
   │               ├── Section B updates with new insights
   │               ├── Section C updates with skill scores
   │               └── Section D updates with AI recommendations
   │
   └── Click "📄 Detailed Report" → ReportModal / ReportPage opens
           │
           ├── Tab 1: Transcript (all Q&A with scores, comments, expected answers)
           ├── Tab 2: Skill Analysis (progress bars with weights explained)
           ├── Tab 3: Resume Snapshot (what was used in this interview)
           ├── Tab 4: Summary (AI narrative + behavioral + technical suggestions)
           └── Tab 5: Export (PDF download / JSON download)
```

---

## 13. Pages & Components To Build

### Status Key
- ✅ Built
- ⚠️ Partially built / stub
- ❌ Not yet built

### Pages

| File | Status | Notes |
|---|---|---|
| `pages/LoginPage.jsx` | ✅ Built | |
| `pages/RegisterPage.jsx` | ✅ Built | |
| `pages/DashboardPage.jsx` | ⚠️ Partial | Section D stub; AI recs not wired |
| `pages/InterviewPage.jsx` | ❌ Not built | Core live interview screen |
| `pages/ReportPage.jsx` | ❌ Not built | Or implement as modal |

### Components

| File | Status | Notes |
|---|---|---|
| `components/Navbar.jsx` | ✅ Built | |
| `components/SessionCard.jsx` | ✅ Built | Buttons not yet wired to routes |
| `components/CreateSessionModal.jsx` | ✅ Built | |
| `components/RulesModal.jsx` | ❌ Not built | Pre-interview consent |
| `components/ReportModal.jsx` | ❌ Not built | 5-tab detailed report |
| `components/EndCallConfirm.jsx` | ❌ Not built | Inline in InterviewPage is fine |
| `components/NetworkOverlay.jsx` | ❌ Not built | Inline in InterviewPage is fine |
| `components/SilenceWarning.jsx` | ❌ Not built | Inline in InterviewPage is fine |

### Hooks / Services

| File | Status | Notes |
|---|---|---|
| `hooks/useInterviewWS.js` | ❌ Not built | WebSocket client + audio management |
| `services/api.js` | ✅ Built | Needs interview + report endpoints added |

---

## 14. State Management Reference

### AuthContext (global, existing)

```js
// Values exposed:
{
  user,           // { id, email, name } or null
  isAuthenticated, // boolean
  loading,        // boolean (checking token on startup)
  login(token, user),   // stores token + user
  logout()        // clears token, redirects to /login
}
```

### DashboardPage state (local)

```js
const [sessions, setSessions] = useState([]);        // list of session objects
const [loading, setLoading] = useState(true);        // initial load
const [showCreateModal, setShowCreateModal] = useState(false);
```

### CreateSessionModal state (local)

```js
const [form, setForm] = useState({ role, jd_text, resume_id, difficulty, duration });
const [resumes, setResumes] = useState([]);  // loaded on mount
const [uploadFile, setUploadFile] = useState(null);
const [uploading, setUploading] = useState(false);
const [submitting, setSubmitting] = useState(false);
const [error, setError] = useState('');
```

### InterviewPage state (local, to build)

```js
const [status, setStatus] = useState('connecting'); // connecting|greeting|waiting|listening|transitioning|ended
const [currentQuestion, setCurrentQuestion] = useState('');
const [timerSeconds, setTimerSeconds] = useState(null);
const [silenceWarning, setSilenceWarning] = useState(false);
const [paceFeedback, setPaceFeedback] = useState('good'); // good|too_fast|too_slow
const [aiSpeaking, setAiSpeaking] = useState(false);
const [showEndConfirm, setShowEndConfirm] = useState(false);
const [networkLost, setNetworkLost] = useState(false);
const [reconnectSeconds, setReconnectSeconds] = useState(180);
```

---

*This document is the single source of truth for frontend UI and user journey decisions. Update whenever screens or interactions change. Refer to `plan.md` for full product specification and business rules.*
