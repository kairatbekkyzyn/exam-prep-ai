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
```