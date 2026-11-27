# 🛡️ FinGuard AI: Emergency Financial Preparedness Coach

> Built for the **State Farm Financial Wellness** hackathon track.
> **Live demo:** https://kenkaneki132.github.io/Hackathon-2026/ (static build) · original Vercel deploy: https://hackathon-2026-gamma.vercel.app

![React](https://img.shields.io/badge/React-Vite-61DAFB?logo=react&logoColor=black)
![FastAPI](https://img.shields.io/badge/FastAPI-Python-009688?logo=fastapi&logoColor=white)
![Tests](https://img.shields.io/badge/tests-pytest%20%2B%20vitest-success)

Many households can't absorb an unexpected expense. Most finance apps track spending, but few help people **prepare** for job loss, medical bills or natural disasters. FinGuard AI turns a 3-step questionnaire into a **preparedness score**, a **4-week action plan**, insurance-gap recommendations and an **AI coach**. A **Life Impact Simulator** stress-tests big decisions (buying a car, moving, taking a loan, changing jobs) against a job-loss shock.

## Features

| | |
|---|---|
| 🧭 **Assessment** | Age, income, expenses, dependents, housing, ZIP and savings produce emergency-fund, insurance and flood scores |
| 🗓 **Action plan** | A week-by-week plan with dollar amounts computed from your own numbers |
| ⚡ **Life Impact Simulator** | Safe, balanced and risky versions of a decision, scored on financial stability, stress, risk, goal progress and resilience, plus a job-loss shock test |
| 💬 **AI coach** | Gemini when configured, otherwise a built-in offline coach |
| 🔊 **Listen** | ElevenLabs voice when configured, otherwise the browser's built-in speech |
| 🔐 **Auth** | Auth0 when configured, otherwise guest mode |

## Three ways to run it

| Mode | What you need | What you get |
|---|---|---|
| **Static demo** (`VITE_DEMO_MODE=true`) | nothing | Everything runs in the browser: scoring/simulator engine ported to JS, offline coach, browser voice, guest login |
| **Local full stack** | Python + Node | FastAPI backend; the frontend falls back to the in-browser engine automatically if the API is down |
| **Production** | Auth0, Gemini and ElevenLabs keys | Authenticated users, LLM coach, natural voice |

## Run it on a new machine

**Requirements:** **Python 3.11–3.14** (CI uses 3.12) and **Node.js 20+** with npm (CI uses Node 22). No keys are needed to run or test it: without Auth0 you are signed in as a guest, without Gemini the coach answers from built-in guidance, and without ElevenLabs the browser reads answers aloud.

```bash
git clone https://github.com/kenkaneki132/Hackathon-2026.git
cd Hackathon-2026

# backend
cd backend
python -m venv venv && source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env                                  # keys are optional
uvicorn main:app --reload --port 8000                 # http://localhost:8000/docs

# frontend (new terminal)
cd frontend
cp .env.example .env                                  # leave Auth0 empty for guest mode
npm ci && npm run dev                                 # http://localhost:5173
```

No backend at all? `cd frontend && VITE_DEMO_MODE=true npm run dev` (PowerShell: `$env:VITE_DEMO_MODE='true'; npm run dev`).

Run every check the way CI does: `cd backend && pip install -r requirements-dev.txt && python -m pytest -q`, then `cd ../frontend && npm test && npm run build`.

## Tests

```bash
cd backend  && pip install -r requirements-dev.txt && pytest -q    # 65 tests
cd frontend && npm test                                             # 180 tests
```

- **Backend (pytest):** deterministic scoring (regression for the old `random.randint` insurance score), score bounds over a profile grid, simulator invariants (safe < balanced < risky cost; job loss hurts unemployed users more), offline-coach topics, auth-protected routes, input validation.
- **Frontend (Vitest):** **exact parity** between the JavaScript engine and the Python engine on 145 cases exported by `backend/scripts/export_engine_fixtures.py`, including Python's banker's rounding. Also covers API fallback behavior (network errors, 404 and 5xx fall back; 401 and 422 don't) and speech helpers.
- `tests.yml` runs both suites on every push; `deploy-pages.yml` runs the frontend tests before publishing.

If you change the scoring logic in `backend/main.py`, regenerate the fixtures:
`cd backend && python scripts/export_engine_fixtures.py`

## Architecture

```
frontend/ (React 18 + Vite)
  src/auth.jsx               Auth0 or guest session
  src/utils/api.js           backend first → falls back to localEngine.js
  src/utils/localEngine.js   JS port of the scoring + simulator engine (parity-tested)
  src/utils/speech.js        Web Speech API fallback for "Listen"
  pages/  Landing · Onboarding · Dashboard · Chat · SimulatorOnboarding · SimulatorDashboard

backend/ (FastAPI)
  main.py                    scoring, simulator, Gemini coach, ElevenLabs TTS, Auth0 JWT checks
  scripts/export_engine_fixtures.py
  tests/test_engine.py
```

## API

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Health + which integrations are configured |
| POST | `/api/analyze` | Profile → scores, action plan, insurance recommendations |
| POST | `/api/simulate` | Decision → 3 scenarios + job-loss shock test |
| POST | `/api/chat`, `/api/simulate/chat` | Coach reply (`source`: `gemini` or `fallback`) |
| GET | `/api/flood-risk/{zip}` | Flood risk tier + tip |
| POST | `/api/tts` 🔒 | ElevenLabs audio |
| GET | `/api/me` 🔒 | Auth0 profile |

## Changelog (portfolio-upgrade)

- Insurance score is now **deterministic**. It was `random.randint(30, 70)`, so the same profile scored differently on every request.
- Gemini coach re-enabled behind `GEMINI_API_KEY`, with the key sent in a header instead of the URL; falls back to an expanded offline coach.
- Static demo mode: JS engine, guest auth, hash routing and browser TTS, so the app runs on GitHub Pages.
- Removed committed `.env` files and stopped referencing an ElevenLabs key in frontend code, where Vite would have embedded it in public JavaScript. Added `.env.example` files.
- CORS origins configurable via `ALLOWED_ORIGINS`; credentials are only allowed with explicit origins.
- Added the pytest and Vitest suites and CI.

## Team

Built at the hackathon by the FinGuard team (simulator engine by Charan). <!-- add names / roles -->
