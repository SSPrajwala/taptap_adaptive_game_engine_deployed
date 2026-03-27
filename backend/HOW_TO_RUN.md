# TapTap Backend — Quick Start

## 1. Install dependencies (first time only)
```
cd backend
npm install
```

## 2. Start the server
```
node server.js
```
Or with auto-reload on file changes:
```
npm run dev
```

The server starts at **http://localhost:3001**

---

## API Endpoints

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/health` | Health check |
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Sign in |
| GET | `/api/auth/me` | Get current user (requires token) |
| GET | `/api/leaderboard` | Global top 50 scores |
| GET | `/api/leaderboard/:gameId` | Top 10 for a specific game |
| POST | `/api/leaderboard/submit` | Submit a score |

---

## Data Storage
All data is saved to `backend/taptap_db.json` (auto-created on first run).
No external database needed.

---

## Run both frontend + backend

Open **two terminals**:

**Terminal 1 — Backend:**
```
cd backend
node server.js
```

**Terminal 2 — Frontend:**
```
cd frontend
npm run dev
```

Then open http://localhost:5173
