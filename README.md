# Financial Tracker

Personal finance tracker with a Django REST backend and Expo React Native frontend.

## Project Structure

- `backend/` - Django API, auth, models, migrations
- `frontend/` - Expo app (iOS/Android/Web)

## Tech Stack

- Backend: Django, Django REST Framework, Token auth, SQLite (local)
- Frontend: Expo Router, React Native, TypeScript

## Prerequisites

- Python 3.11+
- Node.js 20.19.4+ (recommended for current React Native/Metro deps)
- npm 10+

## Local Setup

### 1) Backend

From repo root:

```bash
cd backend
python -m venv .venv
source .venv/Scripts/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

Backend runs at `http://127.0.0.1:8000`.

### 2) Frontend

In a separate terminal:

```bash
cd frontend
npm install
npm run start
```

Useful scripts:

- `npm run android`
- `npm run ios`
- `npm run web`
- `npm run lint`

## API Base URL

Frontend currently points to:

- `http://127.0.0.1:8000/financial_tracker/api`

Configured in:

- `frontend/src/api/client.ts`

## Important API Routes

- `POST /financial_tracker/api/register/`
- `POST /financial_tracker/api/login/`
- `GET/POST /financial_tracker/api/profiles`
- `GET/POST /financial_tracker/api/accounts`
- `GET/POST /financial_tracker/api/categories`
- `GET/POST /financial_tracker/api/transactions`
- `GET /financial_tracker/api/dashboard/`

## Notes

- Run Django commands from inside `backend/` (self-contained backend layout).
- If admin login fails after a fresh DB/migration, create a superuser again.
- Default local DB is `backend/db.sqlite3`.

## Deployment (High-Level)

- Frontend: static hosting (Cloudflare Pages / Vercel / Netlify)
- Backend: containerized deployment (for example Google Cloud Run)
- For no cold starts on Cloud Run, set minimum instances > 0 (not fully free)

