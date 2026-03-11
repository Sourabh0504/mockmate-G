# MockMate AI — Frontend User Journey & UI Specification

**Version:** 2.0  
**Date:** 2026-03-10  
**Scope:** Complete UI flow, component breakdown, and interaction design for every screen the user encounters from first visit to final report. This document reflects the **current implemented state** of the frontend.

---

## Table of Contents

1. [Design System](#1-design-system)
2. [Routing & Auth Guard](#2-routing--auth-guard)
3. [Screen 1 — Register Page](#3-screen-1--register-page)
4. [Screen 2 — Login Page](#4-screen-2--login-page)
5. [Screen 3 — Dashboard](#5-screen-3--dashboard)
   - [Navigation](#51-navigation)
   - [Greeting Header & Quick Stats](#52-greeting-header--quick-stats)
   - [Left Column — Session Cards](#53-left-column--session-cards)
   - [Right Column — Sidebar](#54-right-column--sidebar)
6. [Modal — Create Session](#6-modal--create-session)
7. [Session Card — All States](#7-session-card--all-states)
8. [Modal — Rules & Regulations](#8-modal--rules--regulations)
9. [Screen 4 — Interview Screen](#9-screen-4--interview-screen)
   - [Interview Layout](#91-interview-layout)
   - [Answer Cycle UI Behaviour](#92-answer-cycle-ui-behaviour)
   - [End Call Flow](#93-end-call-flow)
   - [Network Failure Overlay](#94-network-failure-overlay)
10. [Screen 5 — Post-Interview (Dashboard Update)](#10-screen-5--post-interview-dashboard-update)
11. [Modal — Detailed Report](#11-modal--detailed-report)
    - [Header](#111-header)
    - [Tab 1 — Transcript](#112-tab-1--transcript)
    - [Tab 2 — Skill Analysis](#113-tab-2--skill-analysis)
    - [Tab 3 — Resume Snapshot](#114-tab-3--resume-snapshot)
    - [Tab 4 — Summary](#115-tab-4--summary)
    - [Tab 5 — Export](#116-tab-5--export)
12. [Public Marketing Pages](#12-public-marketing-pages)
13. [Complete User Journey Map](#13-complete-user-journey-map)
14. [Pages & Components — Build Status](#14-pages--components--build-status)
15. [State Management Reference](#15-state-management-reference)

---

## 1. Design System

The UI is built on a **dark theme** using **Tailwind CSS** with **Radix UI** primitives (Dialog, Tabs, Select, Collapsible, Checkbox, Slider, ScrollArea) and **Lucide React** icons. All design tokens are defined as CSS custom properties in `src/index.css`.

### Color Palette (HSL CSS Variables)

| Token | HSL Value | Usage |
|---|---|---|
| `--background` | `240 10% 3.9%` | Page backgrounds |
| `--foreground` | `0 0% 98%` | Primary text |
| `--card` | `240 10% 6%` | Card / section backgrounds |
| `--card-foreground` | `0 0% 98%` | Text on cards |
| `--primary` | `210 100% 56%` | Electric blue primary — buttons, links, active states |
| `--primary-glow` | `210 100% 65%` | Primary gradient endpoint |
| `--secondary` | `142 76% 50%` | Vivid green — success indicators, high scores |
| `--secondary-glow` | `142 76% 60%` | Secondary gradient endpoint |
| `--accent` | `262 83% 65%` | Purple — accent highlights, medium scores |
| `--accent-glow` | `262 83% 75%` | Accent gradient endpoint |
| `--muted` | `240 10% 15%` | Muted backgrounds |
| `--muted-foreground` | `240 5% 64.9%` | Muted text, labels, subtitles |
| `--destructive` | `0 84.2% 60.2%` | Error, danger actions |
| `--border` | `240 10% 20%` | All borders |
| `--input` | `240 10% 15%` | Input backgrounds |
| `--ring` | `200 100% 50%` | Focus ring |
| `--radius` | `0.75rem` | Global border radius |

### Typography

- **Primary font:** Poppins (weights 400–900) — headings, body, scores
- **Secondary font:** Inter (weights 300–700) — general text
- **Tertiary font:** Montserrat (weights 400–700) — date labels
- **Anti-aliased rendering** enabled globally
- Loaded via Google Fonts import in `index.css`

### Component Styling

All UI components use **Tailwind utility classes** and follow the shared Radix + `class-variance-authority` (cva) pattern:

| Component | File | Notes |
|---|---|---|
| Button | `ui/button.jsx` | Variants: `default`, `destructive`, `outline`, `secondary`, `ghost`, `link` |
| Card | `ui/card.jsx` | `bg-card text-card-foreground rounded-xl border border-white/[0.08]` |
| Dialog | `ui/dialog.jsx` | Radix Dialog with overlay blur + custom close button |
| Tabs | `ui/tabs.jsx` | Radix Tabs with underline active state |
| Badge | `ui/badge.jsx` | Variants: `default`, `secondary`, `outline`, `destructive` |
| Input | `ui/input.jsx` | Dark input with focus ring |
| Select | `ui/select.jsx` | Radix Select with custom trigger + content |
| Checkbox | `ui/checkbox.jsx` | Radix Checkbox with primary checkmark |
| Collapsible | `ui/collapsible.jsx` | Radix Collapsible for accordion sections |
| Slider | `ui/slider.jsx` | Radix Slider for duration selection |
| ScrollArea | `ui/scroll-area.jsx` | Radix ScrollArea for scrollable containers |

### Additional CSS Classes (in `index.css`)

| Class | Purpose |
|---|---|
| `.glass-card` | Backdrop-blur glass card with gradient background |
| `.glass-card-enhanced` | Enhanced glass with inset highlight |
| `.text-neon-blue` / `.text-neon-green` / `.text-neon-purple` | Colored text helpers mapped to primary/secondary/accent |
| `.gradient-text` | Primary → Secondary gradient text |
| `.gradient-text-accent` | Primary → Accent gradient text |
| `.glow-primary` / `.glow-secondary` / `.glow-accent` | Colored box-shadow glows |
| `.bg-grid-pattern` / `.bg-neural-network` / `.bg-mesh-hero` | Decorative background patterns |

### Custom Scrollbar

Site-wide custom scrollbar matching the dark theme:
- **Width:** 6px
- **Track:** transparent
- **Thumb:** `bg-white/10`, hover → `bg-white/20`, rounded-full
- Firefox fallback via `scrollbar-width: thin; scrollbar-color: hsl(var(--muted-foreground) / 0.3) transparent`

---

## 2. Routing & Auth Guard

**File:** `src/App.jsx`

```
Route: /                     → PublicLayout → HomePage
Route: /how-it-works         → PublicLayout → HowItWorksPage
Route: /about                → PublicLayout → AboutPage
Route: /contact              → PublicLayout → ContactPage
Route: /login                → PublicRoute guard → LoginPage
Route: /register             → PublicRoute guard → RegisterPage
Route: /dashboard            → ProtectedRoute guard → DashboardPage
Route: /profile              → ProtectedRoute guard → ProfilePage
Route: /interview/:session_id → ProtectedRoute guard → InterviewPage
Route: *                     → NotFoundPage
```

**Auth state** lives in `AuthContext`. JWT token (`mm_token`) read from `localStorage` on app load. If token exists and is valid → user is authenticated.

**Route guards:**
- `ProtectedRoute`: Redirects to `/login` if no user
- `PublicRoute`: Redirects to `/dashboard` if user is already logged in

**Loading state:** While auth is initializing, returns `null` (no flash of wrong screen).

---

## 3. Screen 1 — Register Page

**Route:** `/register`  
**File:** `src/pages/RegisterPage.jsx`  
**Guard:** PublicRoute — authenticated users redirected to `/dashboard`.

### Layout

Full glass-card centered page with animated mesh background (`bg-mesh-hero`), grid pattern, and floating gradient blobs.

### Elements

1. **Logo** — "MockMate **AI**" with primary-gradient AI text
2. **Heading** — "Create Your Account" (font-poppins, text-3xl)
3. **Subtitle** — "Start your journey to interview mastery" (muted)
4. **Error message** — Red alert box, shown on validation/API errors
5. **Form fields:**
   - **Full Name** — text input w/ User icon
   - **Email** — email input w/ Mail icon
   - **Password** — password input w/ Lock icon (min 6 chars)
   - **Confirm Password** — password input w/ Lock icon
6. **Submit button** — Primary, full-width, "Create Account" with ArrowRight icon. Spinner on loading.
7. **Footer link** — "Already have an account? [Sign in]" → `/login`

### Behaviour

- Client-side: password match validation
- On submit: POST `/auth/register` → auto-login → redirect to `/dashboard`
- On error: backend message shown in error alert

---

## 4. Screen 2 — Login Page

**Route:** `/login`  
**File:** `src/pages/LoginPage.jsx`  
**Guard:** PublicRoute.

### Layout

Same glass-card centered layout as Register with animated background.

### Elements

1. **Logo** — "MockMate **AI**"
2. **Heading** — "Welcome Back"
3. **Subtitle** — "Sign in to continue your journey"
4. **Error message** — Red alert box
5. **Form fields:**
   - **Email** — email input w/ Mail icon
   - **Password** — password input w/ Lock icon
6. **Submit button** — Primary, full-width, "Sign In" with ArrowRight icon
7. **Footer link** — "Don't have an account? [Create one]" → `/register`

### Behaviour

- POST `/auth/login` → store JWT (`mm_token`) + user (`mm_user`) in localStorage via AuthContext → redirect to `/dashboard`
- On error: display backend error message

---

## 5. Screen 3 — Dashboard

**Route:** `/dashboard`  
**File:** `src/pages/DashboardPage.jsx`  
**Guard:** ProtectedRoute.

### Overall Layout

Two-column grid (`lg:grid-cols-5`): sessions (3/5 width) on left, sidebar (2/5 width) on right. Sidebar is sticky on desktop.

```
┌──────────────────────────────────────────────────────────────────────────┐
│  NAVIGATION BAR (full width, fixed)                                       │
├──────────────────────────────────────────────────────────────────────────┤
│  Greeting Header + "New Practice Session" button                          │
├──────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────┐  ┌─────────────────────────────┐   │
│  │  PRACTICE SESSIONS (3-cols)      │  │  Quick Stats (3-grid)       │   │
│  │  [Session Card 1 — newest]       │  │  Sessions | Avg Score | Time│   │
│  │  [Session Card 2]                │  ├─────────────────────────────┤   │
│  │  [Session Card 3]                │  │  Overall Performance (2x2)  │   │
│  │  ...                             │  │  Score cards w/ progress bars│   │
│  │                                  │  ├─────────────────────────────┤   │
│  │                                  │  │  Skill Breakdown             │   │
│  │                                  │  │  5 progress bars             │   │
│  │                                  │  ├─────────────────────────────┤   │
│  │                                  │  │  Achievements                │   │
│  │                                  │  ├─────────────────────────────┤   │
│  │                                  │  │  AI Recommendations          │   │
│  └──────────────────────────────────┘  └─────────────────────────────┘   │
├──────────────────────────────────────────────────────────────────────────┤
│  FOOTER                                                                   │
└──────────────────────────────────────────────────────────────────────────┘
```

---

### 5.1 Navigation

**File:** `src/components/layout/Navigation.jsx`

Full-width top navigation bar (fixed, `z-50`):
- **Left:** "MockMate AI" logo with gradient text
- **Center links (desktop):** Home, How It Works, About, Contact, Dashboard, Profile
- **Right:** User avatar circle (first letter) + dropdown (Profile, Sign Out)
- **Mobile:** Hamburger menu with slide-in sidebar
- Auth-aware: shows Login/Register buttons when logged out; avatar dropdown when logged in

---

### 5.2 Greeting Header & Quick Stats

**Greeting Header:**
- Left: Today's date label (Montserrat) + "Good Morning/Afternoon/Evening, **{firstName}**" (Poppins, text-4xl)
- Right: "New Practice Session" primary button → opens CreateSessionModal

**Quick Stats** (in sidebar, 3-grid):
- Sessions count (Flame icon, primary bg)
- Average Score (BarChart3 icon, secondary bg)
- Total Practice Time (Clock icon, accent bg)

---

### 5.3 Left Column — Session Cards

**Header row:** "Practice Sessions" + total count badge

**Empty state:** Centered card with Mic icon + "No sessions yet" + "Start First Interview" button

**Session list:** Sessions rendered in **LIFO order** (newest at top), each as a `SessionCard` component separated by `space-y-3` gap.

**Polling:** Dashboard polls backend every 10s when any session has status `creating` or `live`.

---

### 5.4 Right Column — Sidebar

Contains the following cards, each with animated slide-up entrance (`animate-slide-up`):

**1. Overall Performance** (2×2 metric grid) — Only visible when latest session has scores:
- Overall Score, Fluency, Content Quality, Confidence
- Each card: gradient icon box + score value `/100` + trend arrow (+/-) + progress bar
- Color-coded gradients per metric

**2. Skill Breakdown** — Only visible when skill scores exist:
- 5 progress bars: Technical, Communication, Problem Solving, Leadership, Cultural Fit
- Each: label + percentage + colored fill bar

**3. Achievements** — Always visible:
- 3 achievement badges: "First Step", "High Achiever", "Consistent"
- Green gradient icon when unlocked, muted when locked
- Sparkles icon on unlocked achievements

**4. AI Recommendations** — Always visible:
- 3 hardcoded recommendations (currently stub, not wired to API)
- Each: bullet dot + title + description
- **NOTE:** This section uses hardcoded data. Needs to be wired to `ai_suggestions_behavioral` and `ai_suggestions_technical` from the session report API.

---

## 6. Modal — Create Session

**Trigger:** Clicking "New Practice Session" button  
**File:** `src/components/CreateSessionModal.jsx`

Uses Radix Dialog with `sm:max-w-2xl` width and `backdrop-blur-2xl` overlay.

### Fields (top to bottom)

1. **Job Role** *(required)*
   - Text input with Briefcase icon
   - Placeholder: "e.g. Senior Frontend Engineer"
   - Label includes "(for reference)" in muted text

2. **Company** *(optional)*
   - Text input with Building2 icon
   - Placeholder: "e.g. Google, Microsoft, Startup"

3. **Job Description** *(required)*
   - Textarea with FileText icon, min-height ~4 rows
   - Placeholder: "Paste the complete job description..."
   - Minimum validation required

4. **Resume** *(select from existing or upload new)*
   - Dropdown of previously uploaded resumes (most recent first, up to 5)
   - First resume auto-selected
   - If no resumes: muted text "No resumes uploaded yet"
   - **Upload button:** File input accepting `.pdf`, `.docx` only
   - On upload: POST to `/resumes/upload` with spinner
   - On success: new resume added to dropdown, auto-selected
   - On failure: error shown (e.g., "Resume must contain Projects and Education sections")

5. **Duration** — Slider (Radix Slider) from 10 to 30 minutes, default 20

6. **Difficulty** — 3-button radio group: Easy / Moderate / Hard (default: Moderate)
   - Styled as selectable rounded pills with check icon when active

### Action Buttons

- **Cancel** (left, ghost with X icon)
- **Create Interview Session** (right, primary with Sparkles icon)
- Spinner on submit

### Submission Flow

1. Validate: role, jd_text, resume_id required
2. POST `/sessions/` with `{ role, company, jd_text, resume_id, difficulty, duration }`
3. On success: Modal closes, new session card appears at top (LIFO), `onSessionCreated` callback
4. On error: Error shown inside modal

---

## 7. Session Card — All States

**File:** `src/components/SessionCard.jsx`

Each card uses `Card` component with hover effects, left accent stripe (gradient), and hover gradient overlay.

### Common Elements

- **Role title** — `text-lg truncate`, displayed as heading
- **Company** — Optional, shown with Building2 icon in muted text
- **Status badge** — Colored pill with animated dot
- **Difficulty badge** — Colored pill (green/blue/red for Easy/Moderate/Hard)
- **Date + Duration** — "2m ago · 20m" format

### State: `creating`

- Status badge: "Creating Session" (muted dot)
- Info box: Loader2 spinner + "Setting up interview environment..."
- No action button

### State: `ready`

- Status badge: "Ready" (green dot)
- Left accent stripe: green gradient
- Optional JD quality warning: AlertTriangle icon + message (if `jd_quality` is low/medium)
- **"Start Interview"** primary button with Play + ChevronRight icons → opens RulesModal

### State: `live`

- Status badge: "Live" (red pulsing dot)
- No action button

### State: `completed` (evaluating)

- Status badge: "Evaluating" (accent pulsing dot)
- Info box: Loader2 spinner + "Evaluating your performance..."

### State: `completed` (scored)

- Status badge: "Completed" (green dot)
- **Circular SVG score dial** (top-right): Overall score with animated stroke dasharray
- **Score breakdown bars** (bottom, 3-col grid): Fluency (Mic icon), Content (Brain icon), Confidence (Target icon)
  - Each: icon + label + score value + progress bar
  - Color-coded: ≥80 green, ≥60 blue, <60 purple
- Left accent stripe: gradient matching score color
- **"View Report"** outline button with FileText + ChevronRight → opens ReportModal

### State: `interrupted`

- Status badge: "Interrupted" (accent dot)
- Message: "Session interrupted — you can resume where you left off."
- **"Resume"** outline button with RotateCcw icon → navigates to `/interview/{id}`

### State: `failed`

- Status badge: "Failed" (red dot)
- Message: "This session could not be completed."
- No action button

---

## 8. Modal — Rules & Regulations

**Trigger:** Clicking "Start Interview" on a `ready` session card  
**File:** `src/components/RulesModal.jsx`

Uses Radix Dialog. Ensures user understands interview process before starting.

### Content

**Title:** "Before You Begin" with Shield icon

**Body sections:**

1. **Rules** (bulleted list):
   - 10-second start window after each question
   - 7-second silence moves to next question
   - Max 120 seconds per answer
   - Can say "Can you repeat that?"
   - Can end interview early — partial results evaluated
   - Session duration display

2. **Permissions Toggle:**
   - Microphone toggle (Mic2 icon) — required
   - Camera toggle (Camera icon) — optional, for realism
   - Each has switch + status text ("Access granted" / "Not enabled")

3. **Consent:** "I understand and agree to start" checkbox (required to enable start button)

### Action Buttons

- **Cancel** — ghost, closes modal
- **Begin Interview** — primary with Rocket icon, disabled until consent checked + mic granted → navigates to `/interview/:session_id`

### Permission Check

- On toggle: requests `getUserMedia()` with relevant constraints
- If mic denied: blocks start, shows "Not enabled" status
- Camera is optional

---

## 9. Screen 4 — Interview Screen

**Route:** `/interview/:session_id`  
**File:** `src/pages/InterviewPage.jsx`

Full-screen immersive interview experience. Currently uses **dummy questions** for demo — real WebSocket integration is stubbed.

---

### 9.1 Interview Layout

```
┌──────────────────────────────────────────────────────────────────────────┐
│  ┌──────────────────────────────────────────────────────────────────┐    │
│  │  Question text (centered)                    [Timer: ⏳ 7s / 🎤] │    │
│  └──────────────────────────────────────────────────────────────────┘    │
│                                                                           │
│  ┌───────────────────────────────┐  ┌────────────────────────────────┐   │
│  │                               │  │                                │   │
│  │    USER CAMERA FEED           │  │    AI AVATAR (🤖 emoji)        │   │
│  │    (live webcam, mirrored)    │  │    Glow blob when speaking     │   │
│  │                               │  │    Waveform bars animation     │   │
│  │    [Name: {user}]             │  │    [Name: MockMate AI]         │   │
│  │    [NOT RECORDED badge]       │  │    [💬 Speaking badge]         │   │
│  │    [Pace: ✅/⚡/🐢]          │  │                                │   │
│  │    [LIVE badge]               │  │                                │   │
│  └───────────────────────────────┘  └────────────────────────────────┘   │
│                                                                           │
│                    ┌─────────────────────────┐                           │
│                    │  [🎤 Mic] ─── [🔴 End]  │                           │
│                    └─────────────────────────┘                           │
└──────────────────────────────────────────────────────────────────────────┘
```

### Element Details

**Question Area (top bar):**
- Glassmorphism card with blur backdrop
- States: "Connecting..." spinner → question text + timer → "Interview complete" ✓

**User Camera Feed (left card):**
- Live `<video>` mirrored horizontally, black background
- **Name tag**: user's name from AuthContext
- **"NOT RECORDED"** badge (bottom-right)
- **Pace indicator** (top-left): ✅ Good pace / ⚡ Too fast / 🐢 Too slow (only during `listening`)
- **LIVE badge** (top-right, green pulse, only during `listening`)

**AI Avatar (right card):**
- Dark semi-transparent card
- Purple glow blob (fades in/out with `aiSpeaking`)
- Avatar ring with 🤖 emoji, scales up when speaking
- Waveform bars animation (7 bars, random heights, bouncing)
- "💬 Speaking" pill badge when AI is active
- Name tag: "MockMate AI"

**Control Bar (bottom center, floating):**
- Glassmorphism pill (`backdrop-blur-24px`, rounded-full)
- **Mic indicator**: SVG mic icon, green when listening, muted otherwise. Pulsing ring animation when active.
- **Divider**
- **End Call button**: Red circle (52px), white phone-down icon (rotated 135°), red glow shadow

### Inline Styles Note
The Interview page currently uses **inline JavaScript `styles` objects** rather than Tailwind classes, maintaining its own isolated visual system with CSS variables like `var(--bg-primary)`, `var(--accent-primary)`, etc.

---

### 9.2 Answer Cycle UI Behaviour (Demo State Machine)

```
'connecting' → 'greeting' → 'waiting' → 'listening' → 'transitioning' → (next question or 'ended')
```

**connecting (2s):** Spinner + "Connecting to interview server..."
**greeting (3s):** AI speaking (glow + waveform), question text shown, timer hidden
**waiting (10s countdown):** Timer shows "⏳ {n}s" in warning yellow, counting down
**listening (~22s demo):** Timer shows "🎤 MM:SS" in green, elapsed counter, pace indicators cycle through
**transitioning (2s):** AI speaks filler, "Processing..." shown, then next question or end
**ended:** "✓ Interview complete. Redirecting to dashboard..." → auto-navigate to `/dashboard` after 2s

**NOTE:** This is a demo-only state machine with hardcoded dummy questions. Real WebSocket-driven flow (`useInterviewWS.js`) is not yet implemented.

---

### 9.3 End Call Flow

**Step 1:** User clicks red End Call button → Radix Dialog opens:
- AlertCircle icon in destructive circle
- Title: "End this interview?"
- Description: "This action is final. Your interview cannot be resumed, but partial results will be evaluated and saved to your dashboard."
- **"Continue Interview"** — green-tinted outline button
- **"Yes, End Interview"** — red destructive button

**Step 2 (confirmed):** Clears all timers, stops camera tracks, navigates to `/dashboard`
**Step 3 (cancelled):** Dialog closes, interview continues

---

### 9.4 Network Failure Overlay

Full-screen dark overlay (85% opacity, blur 8px) with:
- 📡 emoji
- "Connection Lost" heading
- "Attempting to reconnect..." subtitle
- Large countdown timer (MM:SS format, purple, from 180s)
- Progress bar showing remaining reconnect time
- "Your progress is being saved." reassurance text

**NOTE:** Network detection is stubbed — the `networkLost` state is never triggered in the current demo. This will be wired when the WebSocket integration is implemented.

---

## 10. Screen 5 — Post-Interview (Dashboard Update)

After interview ends (normally, manually, or timeout), user returns to Dashboard:

1. **Session card updates:** Status → `completed`, shows evaluation spinner + "Evaluating your performance..."
2. **Dashboard polls** every 10s to detect status changes
3. **When evaluation completes (backend writes scores):**
   - Card shows: overall score dial + score breakdown bars + "View Report" button
   - Sidebar updates: Overall Performance cards, Skill Breakdown bars

---

## 11. Modal — Detailed Report

**Trigger:** Clicking "View Report" on a completed + scored session card  
**File:** `src/components/ReportModal.jsx`

Uses Radix Dialog, `sm:max-w-4xl`, `max-h-[90vh]`, scrollable. Premium glassmorphism styling.

---

### 11.1 Header

The header section is always visible above the tabs:

**Background:** Gradient overlay (`from-primary/10 via-transparent to-accent/5`) + decorative blur circle

**Left column:**
- "Interview Report" badge (Sparkles icon, primary tint)
- **Role title** — DialogTitle, text-2xl, font-poppins
- **Metadata row** (pills): Company (Building2 icon, optional) · Date (Calendar icon) · Duration (Clock icon) · Difficulty badge

**Right column — Overall Score Capsule:**
- Card with `bg-card/40 border border-white/10 rounded-2xl`
- "OVERALL SCORE" label (uppercase, 10px)
- Score value (text-3xl, font-bold) + "/100"
- Progress bar (gradient fill matching score color)

**Below header — Score Breakdown (3 capsules):**
- Grid of 3 capsule cards (Fluency / Content / Confidence)
- Each capsule: `bg-card/40`, rounded-2xl, border, subtle gradient overlay
- Inside: icon + label (uppercase) + score value "/100" + progress bar
- Color-coded: ≥80 green (`bg-secondary`), ≥60 blue (`bg-primary`), <60 purple (`bg-accent`)
- Icons: Mic (Fluency), Brain (Content), Target (Confidence)

---

### 11.2 Tab 1 — Transcript

Shows all Q&A pairs in interview order as collapsible cards.

**Each entry:**
- Question number badge (`Q1`, mono font), section badge, score badge (color-coded `/10`)
- Question text (bold)
- **"Your Answer"** section: muted background card, user's corrected answer
- **2-column feedback grid:**
  - "Comment" (green tint card): AI observation
  - "Suggestion" (accent tint card): improvement advice
- **Collapsible "Show Expected Answer"**: Expandable section with ChevronDown/Up toggle, shows ideal answer in primary tint card

Score color coding (per 10-point scale):
- 8-10: neon-green
- 6-7: primary blue
- 4-5: accent purple
- 0-3: destructive red

---

### 11.3 Tab 2 — Skill Analysis

Full skill breakdown with `SkillBar` components.

- **Header:** Target icon + "Skill Breakdown"
- **2-column grid** of progress bars
- Each bar: label (title-cased) + percentage value + colored fill bar with glow shadow
- Colors cycle through: primary, neonBlue, neonGreen, accent, neonPurple
- Data source: `scores.skills` from session

---

### 11.4 Tab 3 — Resume Snapshot

Shows the structured resume used for this interview using collapsible accordion sections.

**Header note:** "This is the resume used for your interview on {date}."

**Sections** (each as `ResumeSection` collapsible):
1. **Personal Info** (User icon, default open): 2-column grid of Name, Email, Phone, Location
2. **Education** (GraduationCap icon): Degree, Institution, Year, GPA
3. **Experience** (Briefcase icon): Title at Company, Duration, bullet points
4. **Projects** (Code icon): Project name, Description, Tech stack badges
5. **Skills** (Award icon): Categorized skill badges

**NOTE:** Currently uses `DUMMY_RESUME` from `src/data/dummy.js`. Needs to be wired to the actual session's `structured_resume_snapshot`.

---

### 11.5 Tab 4 — Summary

**Overall Score Ring** (120px, SVG circular progress) + score rating text:
- ≥80: "Excellent" (neon-green)
- ≥60: "Good" (primary)
- ≥40: "Fair" (accent)
- <40: "Needs Work" (destructive)

**Summary paragraph** from `report.summary` (AI-generated narrative)

**2-column suggestion cards:**
- **Behavioral Suggestions** (neon-green tint): Lightbulb icon, bulleted list with → arrows
- **Technical Suggestions** (primary tint): Code icon, bulleted list with → arrows

---

### 11.6 Tab 5 — Export

Centered layout with trophy icon:
- **"Export Your Report"** heading
- **"Download PDF"** outline button (FileDown icon, primary hover) — currently shows `alert('PDF export coming soon!')`
- **"Download JSON"** outline button (Download icon, green hover) — downloads full session + report data as JSON blob

---

## 12. Public Marketing Pages

These pages are accessible without authentication, wrapped in `PublicLayout` (Navigation + Footer):

| Page | File | Description |
|---|---|---|
| Home | `pages/HomePage.jsx` | Marketing landing page with hero, features, testimonials |
| How It Works | `pages/HowItWorksPage.jsx` | Step-by-step explanation of the platform |
| About | `pages/AboutPage.jsx` | About the project and team |
| Contact | `pages/ContactPage.jsx` | Contact form and information |
| Profile | `pages/ProfilePage.jsx` | User profile management (protected) |
| 404 | `pages/NotFoundPage.jsx` | Custom not-found page |

---

## 13. Complete User Journey Map

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
   ├── No sessions → "No sessions yet" empty state + "Start First Interview" CTA
   │
   ├── Click "New Practice Session" → CreateSessionModal opens
   │       │
   │       ├── Upload resume (if first time) → POST /resumes/upload
   │       │       │ Success → resume appears in dropdown
   │       │       │ Failure → error shown (missing sections / wrong format)
   │       │
   │       ├── Fill: Role, Company, JD, Resume, Duration (slider), Difficulty (button group)
   │       │
   │       └── Click "Create Interview Session" → POST /sessions/
   │               │
   │               └── Card appears at top: status "creating" + spinner
   │                       │
   │                       │  (background: Gemini analyses JD + generates questions)
   │                       │  ~2-3 minutes
   │                       ▼
   │               Card status → "Ready" (green badge, "Start Interview" button)
   │
   ├── Click "Start Interview" on ready card → RulesModal opens
   │       │
   │       ├── Toggle mic (required) + camera (optional)
   │       ├── Check consent checkbox
   │       │
   │       └── Click "Begin Interview"
   │               │
   │               └── Navigate to /interview/:session_id
   │
   ├── /interview/:session_id
   │       │
   │       ├── Camera + mic requested via getUserMedia
   │       │
   │       ├── Demo state machine: connecting → greeting → Q&A loop → ended
   │       │   (Real WS integration pending)
   │       │
   │       ├── [End Call] → Confirmation dialog → navigate to /dashboard
   │       │
   │       └── [Session ends] → redirect to /dashboard
   │
   ├── Back on /dashboard
   │       │
   │       ├── Card shows: "Completed" + spinner + "Evaluating..."
   │       │  (polling every 10s)
   │       │
   │       └── Card updates: Score dial + breakdown bars + "View Report" button
   │               │
   │               ├── Sidebar: Overall Performance metrics update
   │               └── Sidebar: Skill Breakdown bars update
   │
   └── Click "View Report" → ReportModal opens
           │
           ├── Tab 1: Transcript (Q&A with scores, comments, suggestions, expected answers)
           ├── Tab 2: Skill Analysis (progress bars)
           ├── Tab 3: Resume Snapshot (collapsible accordion)
           ├── Tab 4: Summary (score ring + narrative + suggestions)
           └── Tab 5: Export (PDF placeholder + JSON download)
```

---

## 14. Pages & Components — Build Status

### Status Key
- ✅ Built & Functional
- ⚠️ Built but stubbed/partial
- ❌ Not yet built

### Pages

| File | Status | Notes |
|---|---|---|
| `pages/HomePage.jsx` | ✅ Built | Marketing landing |
| `pages/HowItWorksPage.jsx` | ✅ Built | Step-by-step explainer |
| `pages/AboutPage.jsx` | ✅ Built | About page |
| `pages/ContactPage.jsx` | ✅ Built | Contact form |
| `pages/LoginPage.jsx` | ✅ Built | |
| `pages/RegisterPage.jsx` | ✅ Built | |
| `pages/DashboardPage.jsx` | ⚠️ Partial | AI Recommendations hardcoded, not wired to API |
| `pages/ProfilePage.jsx` | ✅ Built | User profile management |
| `pages/InterviewPage.jsx` | ⚠️ Stubbed | UI complete, uses dummy questions, no real WebSocket |
| `pages/NotFoundPage.jsx` | ✅ Built | |

### Components

| File | Status | Notes |
|---|---|---|
| `components/layout/Navigation.jsx` | ✅ Built | Auth-aware, mobile hamburger |
| `components/layout/Footer.jsx` | ✅ Built | |
| `components/layout/PublicLayout.jsx` | ✅ Built | Wraps Nav + Footer |
| `components/SessionCard.jsx` | ✅ Built | All states functional, wired to RulesModal + ReportModal |
| `components/CreateSessionModal.jsx` | ✅ Built | Full functionality with resume upload |
| `components/RulesModal.jsx` | ✅ Built | Mic/camera permission toggles, consent checkbox |
| `components/ReportModal.jsx` | ✅ Built | 5 tabs, fetches report from API, premium UI |
| `components/ScrollToTop.jsx` | ✅ Built | Scrolls to top on route change |
| `components/auth/ProtectedRoute.jsx` | ✅ Built | Inline in App.jsx |

### UI Primitives (Radix + Tailwind)

| File | Status |
|---|---|
| `ui/button.jsx` | ✅ |
| `ui/card.jsx` | ✅ |
| `ui/dialog.jsx` | ✅ |
| `ui/tabs.jsx` | ✅ |
| `ui/badge.jsx` | ✅ |
| `ui/input.jsx` | ✅ |
| `ui/select.jsx` | ✅ |
| `ui/checkbox.jsx` | ✅ |
| `ui/collapsible.jsx` | ✅ |
| `ui/slider.jsx` | ✅ |
| `ui/scroll-area.jsx` | ✅ |

### Hooks / Services

| File | Status | Notes |
|---|---|---|
| `services/api.js` | ✅ Built | Auth, Resume, Session APIs. Includes JWT interceptor + 401 redirect. |
| `context/AuthContext.jsx` | ✅ Built | User state, login/logout, JWT management |
| `hooks/useInterviewWS.js` | ❌ Not built | WebSocket client for real-time interview |

---

## 15. State Management Reference

### AuthContext (global)

```js
{
  user,           // { id, email, name } or null
  loading,        // boolean (checking token on startup)
  login(token, userData), // stores token + user in localStorage + context
  logout()        // clears token, navigates to /login
}
```

### DashboardPage state (local)

```js
const [sessions, setSessions] = useState([]);        // list of session objects
const [loading, setLoading] = useState(true);        // initial load
const [createOpen, setCreateOpen] = useState(false);  // create session modal
```

### CreateSessionModal state (local)

```js
const [form, setForm] = useState({ role, company, jd_text, resume_id, difficulty, duration });
const [resumes, setResumes] = useState([]);  // loaded on mount
const [uploading, setUploading] = useState(false);
const [creating, setCreating] = useState(false);
const [error, setError] = useState('');
```

### InterviewPage state (local)

```js
const [state, setState] = useState('connecting'); // connecting|greeting|waiting|listening|transitioning|ended
const [questionIndex, setQuestionIndex] = useState(0);
const [currentQuestion, setCurrentQuestion] = useState('');
const [countdown, setCountdown] = useState(10);
const [elapsed, setElapsed] = useState(0);
const [aiSpeaking, setAiSpeaking] = useState(false);
const [pace, setPace] = useState('good'); // good | too_fast | too_slow
const [showEndDialog, setShowEndDialog] = useState(false);
const [networkLost, setNetworkLost] = useState(false);
const [reconnectSeconds, setReconnectSeconds] = useState(180);
```

### ReportModal state (local)

```js
const [fetchedSession, setFetchedSession] = useState(null); // full report data from API
const [loading, setLoading] = useState(false);               // loading report from backend
```

---

*This document is the single source of truth for frontend UI and user journey decisions. It reflects the current implemented state as of 2026-03-10. Update whenever screens or interactions change. Refer to `plan.md` for full product specification and business rules, and `idea.md` for the original project vision.*
