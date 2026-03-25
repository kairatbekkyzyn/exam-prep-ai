# 🎓 ExamAI – Personalized Exam Preparation Platform

> Diploma project: Development of a platform for personalized exam preparation with gamification and generative AI elements.

---

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Backend | **FastAPI** (Python) | Async, auto docs, fastest-growing Python framework in 2026 |
| Database | **SQLite + SQLAlchemy 2.0 async** | Zero-config for MVP, trivially upgrades to PostgreSQL |
| AI | **OpenAI GPT-4o-mini** | Best cost/quality ratio for structured quiz generation |
| Auth | **JWT (python-jose)** | Stateless, works across any frontend |
| Frontend | **React 18 + Vite + TypeScript** | Industry standard, fast HMR dev experience |
| Styling | **Tailwind CSS** | Utility-first, no separate CSS files |
| State | **Zustand** | Minimal, no boilerplate (Redux is overkill for MVP) |
| Charts | **Recharts** | Composable, React-native chart library |

---

## Project Structure

```
examai/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app + CORS + router registration
│   │   ├── database.py          # Async SQLAlchemy engine + session
│   │   ├── models.py            # User, Material, Question, QuizAttempt, Badge
│   │   ├── schemas.py           # Pydantic v2 request/response schemas
│   │   ├── auth.py              # JWT creation + bcrypt password hashing
│   │   ├── routers/
│   │   │   ├── auth_router.py   # POST /register, POST /login, GET /me
│   │   │   ├── materials.py     # CRUD for study materials + AI question gen
│   │   │   ├── quizzes.py       # Adaptive next question, answer submit, badges
│   │   │   └── stats.py         # Per-topic accuracy + AI recommendations
│   │   └── services/
│   │       └── ai_service.py    # OpenAI GPT-4o-mini integration
│   ├── requirements.txt
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   ├── client.ts        # Axios + JWT interceptor + 401 redirect
│   │   │   └── index.ts         # Typed API functions for all endpoints
│   │   ├── store/
│   │   │   └── authStore.ts     # Zustand global auth + XP state
│   │   ├── components/
│   │   │   └── Layout.tsx       # Sidebar nav + XP bar + streak display
│   │   ├── pages/
│   │   │   ├── Login.tsx        # Email/password login form
│   │   │   ├── Register.tsx     # Registration form
│   │   │   ├── Dashboard.tsx    # Overview: XP, stats, quick actions, AI tip
│   │   │   ├── Quiz.tsx         # Adaptive quiz with instant feedback
│   │   │   ├── Materials.tsx    # Upload notes → AI generates questions
│   │   │   ├── Stats.tsx        # Radar + bar charts + topic breakdown
│   │   │   └── Badges.tsx       # Achievement gallery (earned/locked)
│   │   ├── App.tsx              # Routes + private route guard
│   │   ├── main.tsx             # React entry point
│   │   └── index.css            # Tailwind + custom component classes
│   ├── package.json
│   ├── vite.config.ts           # Dev server + /api proxy to :8000
│   └── tailwind.config.js
│
├── start.sh                     # One-command startup script
└── README.md
```

---

## Features (MVP)

### Core Learning
- **AI Question Generation** — paste any study text, GPT-4o-mini creates N multiple-choice questions with explanations and topic tags
- **Adaptive Quiz Engine** — prioritizes questions you've answered wrong or never seen before
- **Instant Feedback** — correct answer highlighted + AI-written explanation after every answer

### Gamification (survey-driven)
- **XP System** — +10 XP correct, +2 XP wrong (rewards effort), +30 XP bonus for 5 consecutive correct
- **Level System** — every 100 XP = new level, shown in sidebar with progress bar
- **Daily Streak** — tracks consecutive study days, shown with 🔥 icon
- **7 Badges** — First Step, On a Roll, Scholar, Consistent, Dedicated, Perfectionist, Exam Ready

### Analytics
- **Per-Topic Accuracy** — radar chart + sorted bar chart by weakest topics
- **AI Study Coach** — personalized 2-3 sentence recommendation on weak areas
- **Session Stats** — live accuracy during each quiz session

### UX (survey-driven)
- Dark mode, distraction-free interface
- Material filter during quiz (study one topic at a time)
- Badge notification toasts on new achievement unlock

---

## Quick Start

### 1. Prerequisites
- Python 3.11+
- Node.js 20+
- OpenAI API key

### 2. Setup

```bash
# Clone / enter project
cd examai

# Set up backend environment
cp backend/.env.example backend/.env
# Edit backend/.env and set OPENAI_API_KEY=sk-...

# Run everything
./start.sh
```

### 3. Manual setup (alternative)

```bash
# Terminal 1 — Backend
cd backend
pip install -r requirements.txt
cp .env.example .env   # add your OPENAI_API_KEY
uvicorn app.main:app --reload --port 8000

# Terminal 2 — Frontend
cd frontend
npm install
npm run dev
```

### 4. Access
| URL | What |
|-----|------|
| http://localhost:5173 | Web app |
| http://localhost:8000/docs | Interactive API docs (Swagger UI) |
| http://localhost:8000 | Health check |

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Get JWT token |
| GET | `/api/auth/me` | Current user info |
| GET | `/api/materials/` | List my materials |
| POST | `/api/materials/` | Upload material + generate questions |
| DELETE | `/api/materials/{id}` | Delete material |
| GET | `/api/quizzes/next` | Get next adaptive question |
| POST | `/api/quizzes/answer` | Submit answer + get XP |
| GET | `/api/quizzes/badges` | All badges with earned status |
| GET | `/api/stats/` | Full stats + AI recommendation |

---

## Survey Alignment

| Survey Finding | Platform Response |
|---------------|-------------------|
| Difficulty identifying important topics | Topic tags on every question, radar chart shows coverage |
| Strong demand for mistake analysis | Explanations on every answer, adaptive engine re-asks failed questions |
| Preference for short structured materials | Chunked quiz format, one question at a time |
| Need for continuous practice + feedback | XP, streaks, instant answer feedback |
| Simple distraction-free interface | Dark minimal UI, single-focus quiz screen |
| Adaptive quizzes highly rated | Adaptive engine prioritizes weak topics |
| Automatic test generation highly rated | Core feature: paste text → AI generates quiz |
| Personalized plan rated useful | AI coach recommendation on Stats page |

---

## Database Schema

```
users          → id, email, name, password_hash, xp, streak_days, last_active_date
materials      → id, user_id, title, content, question_count
questions      → id, material_id, user_id, question_text, options (JSON), correct_answer, explanation, topic
quiz_attempts  → id, user_id, question_id, selected_answer, is_correct, created_at
badges         → id, key, name, description, icon
user_badges    → id, user_id, badge_id, earned_at
```# 🎓 ExamAI – Personalized Exam Preparation Platform

> Diploma project: Development of a platform for personalized exam preparation with gamification and generative AI elements.

Live demo: **https://exam-prep-ai-pink.vercel.app**

---

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Backend | **FastAPI** (Python 3.11) | Async, auto docs, production-ready |
| Database | **PostgreSQL** via Supabase | Free forever, no expiry, relational |
| ORM | **SQLAlchemy 2.0 async** + asyncpg | Type-safe, async queries |
| AI (text) | **Groq llama-3.3-70b-versatile** | Free tier, fast, high quality |
| AI (vision/OCR) | **Groq llama-4-scout-17b** | Reads image-based PDFs and photos |
| Auth | **JWT** + **bcrypt** | Stateless, secure password hashing |
| Email OTP | **Brevo HTTP API** | 300 emails/day free forever, HTTPS (no firewall issues) |
| Frontend | **React 18 + Vite + TypeScript** | Industry standard, fast HMR |
| Styling | **Tailwind CSS** + CSS variables | Utility-first, full light/dark mode |
| State | **Zustand** | Minimal, no boilerplate |
| Charts | **Recharts** | Composable React charts |
| Deployment (FE) | **Vercel** | Free, auto-deploy on git push |
| Deployment (BE) | **Render** | Free tier, auto-deploy on git push |

---

## Project Structure

```
examai/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app + CORS (Vercel + localhost)
│   │   ├── database.py          # Async SQLAlchemy — SQLite local, PostgreSQL prod
│   │   ├── models.py            # User, Material, Question, QuizAttempt, Badge, UserBadge
│   │   ├── schemas.py           # Pydantic v2 request/response schemas
│   │   ├── auth.py              # JWT + bcrypt (no passlib)
│   │   ├── routers/
│   │   │   ├── auth_router.py   # register, verify-otp, resend-otp, login, me
│   │   │   ├── materials.py     # upload (PDF/DOCX/TXT/image), text paste, delete
│   │   │   ├── quizzes.py       # adaptive next question, submit answer, badges
│   │   │   └── stats.py         # per-topic accuracy + AI recommendation
│   │   └── services/
│   │       ├── ai_service.py    # Groq: question generation + OCR + recommendations
│   │       └── email_service.py # Brevo HTTPS API: OTP email delivery
│   ├── requirements.txt
│   ├── Procfile                 # uvicorn start command for Render
│   ├── nixpacks.toml            # Build config for Render
│   ├── railway.json             # Railway deploy config (alternative)
│   └── .env.example
│
└── frontend/
    ├── src/
    │   ├── api/
    │   │   ├── client.ts        # Axios + JWT interceptor + VITE_API_URL support
    │   │   └── index.ts         # Typed API functions for all endpoints
    │   ├── store/
    │   │   └── authStore.ts     # Zustand: auth + XP + light/dark theme
    │   ├── components/
    │   │   └── Layout.tsx       # Sidebar: icon+label nav, XP bar, theme toggle
    │   ├── pages/
    │   │   ├── Login.tsx        # Email login form
    │   │   ├── Register.tsx     # 2-step: form → 6-digit OTP verification
    │   │   ├── Dashboard.tsx    # XP hero, stat cards, AI coach, quick actions
    │   │   ├── Quiz.tsx         # Adaptive quiz: seen_ids dedup, badge toasts
    │   │   ├── Materials.tsx    # Drag-drop upload (PDF/DOCX/TXT/image) + text paste
    │   │   ├── Stats.tsx        # Radar chart, bar chart, topic list, AI tip
    │   │   └── Badges.tsx       # Achievement gallery with earn dates
    │   ├── App.tsx              # Routes + private route guard + theme init
    │   ├── main.tsx
    │   ├── index.css            # Tailwind + CSS variables + utility classes
    │   └── vite-env.d.ts        # VITE_API_URL type declaration
    ├── package.json
    ├── vite.config.ts           # Dev proxy /api → :8000
    ├── tailwind.config.js
    └── vercel.json              # SPA rewrite rule for Vercel
```

---

## Features

### Core Learning
- **File upload** — PDF, DOCX, TXT, JPG, PNG, WEBP drag-and-drop
- **OCR support** — image-only PDFs and photos are read via Groq vision model
- **AI question generation** — Groq llama-3.3-70b creates N multiple-choice questions with explanations and topic tags per upload
- **Adaptive quiz engine** — prioritises questions you've never seen or previously got wrong; excludes correctly-answered ones; resets when all mastered
- **Instant feedback** — correct answer + explanation shown after every answer
- **AI study coach** — personalized 2-3 sentence recommendation based on weakest topics (shown on Stats and Dashboard)

### Authentication & Security
- **Email OTP** — 6-digit code sent via Brevo; unverified accounts cannot log in
- **JWT auth** — 7-day tokens, stored in localStorage, auto-attached to all requests
- **bcrypt** — passwords hashed with direct bcrypt (no passlib)

### Gamification (survey-driven)
- **XP system** — +10 correct, +2 wrong (rewards practice), +30 bonus for 5 consecutive correct
- **Level system** — every 100 XP = new level, sidebar progress bar
- **Daily streak** — consecutive study days tracked
- **7 achievement badges** — First Step, On a Roll, Scholar, Consistent, Dedicated, Perfectionist, Exam Ready

### Analytics
- **Per-topic accuracy** — radar chart + horizontal bar chart sorted weakest first
- **Full topic table** — accuracy %, correct/total, trend arrows
- **Session stats** — live accuracy during each quiz session

### UX
- **Light / dark mode** — toggle in sidebar, persisted to localStorage
- **Drag-and-drop upload** — drop zone with file type detection and auto-title
- **Theme-aware colors** — all text uses CSS variables (no hardcoded white/black)
- **Go-to-quiz hint** — after upload, success banner links directly to Quiz page

---

## Local Development

### Prerequisites
- Python 3.11+
- Node.js 20+
- Groq API key (free at console.groq.com)

### Setup

```bash
# 1. Backend
cd backend
cp .env.example .env
# Edit .env — add OPENAI_API_KEY (your Groq key), SECRET_KEY
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# 2. Frontend (separate terminal)
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173**

During local dev with no `BREVO_API_KEY` set, OTP codes print to the backend terminal — no email setup needed.

---

## Production Deployment

### Backend — Render
1. Connect GitHub repo → New Web Service → root directory: `/backend`
2. Build command: `pip install -r requirements.txt`
3. Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Add environment variables (see `.env.example`)

### Database — Supabase (free forever)
1. supabase.com → New Project → Settings → Database → **Session pooler** URI
2. Add as `DATABASE_URL` in Render env vars
3. Tables are created automatically on first startup

### Frontend — Vercel
1. Connect GitHub repo → root directory: `/frontend`
2. Add env var: `VITE_API_URL=https://your-backend.onrender.com`
3. Auto-deploys on every push

---

## Environment Variables

```env
# backend/.env

OPENAI_API_KEY=your_groq_api_key      # Groq API key (named OPENAI for compatibility)
SECRET_KEY=random-string-here          # JWT signing secret
DATABASE_URL=sqlite+aiosqlite:///./examai.db   # local (auto PostgreSQL in prod)

BREVO_API_KEY=xkeysib-...             # Brevo free API key
FROM_EMAIL=you@gmail.com              # Must match Brevo account email
```

---

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/register` | — | Create account, send OTP |
| POST | `/api/auth/verify-otp` | — | Verify code, get JWT |
| POST | `/api/auth/resend-otp` | — | Resend verification code |
| POST | `/api/auth/login` | — | Login, get JWT |
| GET | `/api/auth/me` | ✓ | Current user info |
| GET | `/api/materials/` | ✓ | List uploaded materials |
| POST | `/api/materials/` | ✓ | Create from text + generate questions |
| POST | `/api/materials/upload` | ✓ | Upload file (PDF/DOCX/TXT/image) |
| DELETE | `/api/materials/{id}` | ✓ | Delete material and its questions |
| GET | `/api/quizzes/next` | ✓ | Next adaptive question |
| POST | `/api/quizzes/answer` | ✓ | Submit answer, get XP |
| GET | `/api/quizzes/badges` | ✓ | All badges with earned status |
| GET | `/api/stats/` | ✓ | Full stats + AI recommendation |

Interactive API docs at `/docs` (Swagger UI).

---

## Database Schema

```
users          → id, email, name, password_hash, is_verified, otp_code,
                 otp_expires_at, xp, streak_days, last_active_date
materials      → id, user_id, title, content, question_count
questions      → id, material_id, user_id, question_text, options (JSON),
                 correct_answer, explanation, topic
quiz_attempts  → id, user_id, question_id, selected_answer, is_correct, created_at
badges         → id, key, name, description, icon
user_badges    → id, user_id, badge_id, earned_at
```

---

## Survey Alignment

| Survey Finding | Platform Response |
|---------------|-------------------|
| Difficulty identifying important topics | Topic tags on every question; radar chart shows coverage |
| Demand for mistake analysis | Explanations on every answer; adaptive engine re-asks failed questions |
| Preference for short structured materials | One question at a time, chunked format |
| Need for continuous practice + feedback | XP, streaks, instant feedback per answer |
| Simple distraction-free interface | Dark/light minimal UI, single-focus quiz screen |
| Adaptive quizzes rated useful | Core feature: wrong answers resurface, correct ones retire |
| Auto test generation rated useful | Paste text or upload file → AI generates quiz instantly |
| Personalized plan rated useful | AI coach recommendation on Stats and Dashboard pages |