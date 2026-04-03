# TapTap v3.0 — Upgrade Setup Guide

Run these steps once after pulling the latest code.

---

## 1. Get Your Gemini API Key (FREE)

1. Go to https://aistudio.google.com/app/apikey
2. Click **"Create API Key"** → copy it
3. Open `backend/.env` and paste it:
   ```
   GEMINI_API_KEY=your_key_here
   ```

---

## 2. Install Backend Dependencies

```bash
cd backend
npm install
```

This installs: `@prisma/client`, `@google/generative-ai`, `helmet`, `express-rate-limit`, `dotenv`

---

## 3. Push Database Schema to Supabase

```bash
npx prisma db push
```

This creates all 7 tables in your Supabase PostgreSQL:
- `users`, `user_profiles`, `games`, `game_sessions`
- `user_skill_progress`, `ai_generations`, `admins`

---

## 4. Seed the Database (games + admin account)

```bash
node prisma/seed.js
```

This inserts all 8 games and the admin account into Supabase.

> ✅ You only need to run this once. If you run it again, it will skip existing entries.

---

## 5. Start the Backend

```bash
npm run dev   # development (auto-restart)
# or
npm start     # production
```

---

## 6. Frontend — No Changes Needed

The frontend `npm install` and `npm run dev` work as before.

---

## What's New in v3.0

### Backend
- **Supabase PostgreSQL** via Prisma ORM (replaces JSON file storage)
- **7 new routes**: `/api/games` (CRUD), `/api/skills`, `/api/ai/*`, updated leaderboard + admin
- **AI endpoints**: quiz generation, flashcard generation, explanations, skill reports, post-game analysis, lesson plans
- **Blackbuck mascot chat** (`POST /api/ai/mascot/chat`)
- Rate limiting, Helmet security headers, dotenv

### Frontend
- **Blackbuck AI panel** — click the deer mascot or "🤖 AI Studio" to open
- **"Why?" button** — appears after wrong answers; asks Gemini to explain
- **My Games section** — AI-generated or user-created private games shown separately
- **Aptitude tags** shown on game cards (TCS NQT, Infosys, etc.)
- **Sign-up** now collects Branch + Target Company for personalised AI reports
- All API URLs now use `VITE_API_URL` env var (no more hardcoded localhost)

---

## Railway + Vercel Deployment

### Railway (backend)
Add these environment variables in the Railway dashboard:
```
DATABASE_URL=postgresql://postgres.xxx:taptap%23game%23engine@aws-0-ap-south-1.pooler.supabase.com:6543/postgres
DIRECT_URL=postgresql://postgres.xxx:taptap%23game%23engine@aws-0-ap-south-1.supabase.com:5432/postgres
JWT_SECRET=<generate a long random string>
ADMIN_SECRET=<generate another long random string>
GEMINI_API_KEY=<your Gemini key>
FRONTEND_URL=https://taptapadaptivegameenginedeployed7.vercel.app
```

### Vercel (frontend)
Add this in the Vercel dashboard → Project Settings → Environment Variables:
```
VITE_API_URL=https://<your-railway-url>.railway.app/api
```

---

## Admin Login

After seeding, the admin account is:
- **Name**: `TapTap Admin`
- **Access Code**: `taptap2024`

Change these in `backend/prisma/seed.js` before seeding if you want custom credentials.
