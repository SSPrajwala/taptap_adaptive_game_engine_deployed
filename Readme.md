# ⚡ TapTap Adaptive Game Engine

> **A reusable, plugin-based, JSON-driven game engine framework for gamified learning — built for the TapTap × Blackbucks Hackathon 2026**

🎮 **Live Demo:** [taptapadaptivegameenginedeployed7.vercel.app](https://taptapadaptivegameenginedeployed7.vercel.app/)
📁 **Repository:** [github.com/SSPrajwala/taptap_adaptive_game_engine_deployed](https://github.com/SSPrajwala/taptap_adaptive_game_engine_deployed)

---

## 🌟 What is TapTap Game Engine?

TapTap is not just one game — it is the **infrastructure that hosts unlimited games**. Every aspect of gameplay — questions, levels, rules, scoring, difficulty — is controlled entirely by JSON configuration files. Changing one line in a JSON file changes the game behaviour. No code changes required.

The engine now supports **8 game types** including real-time **motion games** and a full **WebSocket multiplayer system** where multiple players compete simultaneously with live scoring.

---

## 🏗️ Architecture Overview

```
taptap_adaptive_game_engine/
├── backend/                          ← Node.js + Express + Socket.io
│   ├── server.js                     ← Entry point, CORS, REST + WS mount
│   ├── roomManager.js                ← In-memory room state (Kahoot-style)
│   ├── socketHandlers.js             ← All Socket.io event handlers
│   └── taptap_db.json                ← Persisted game configs (admin edits)
│
└── frontend/src/
    ├── types/engine.types.ts         ← Single source of truth for all TypeScript types
    ├── engine/
    │   ├── EngineCore.ts             ← Pure reducer — reduce(state, action): GameState
    │   ├── ScoreEngine.ts            ← Points, time bonus, streak multiplier
    │   ├── AdaptiveEngine.ts         ← JSON-driven adaptive difficulty rules
    │   ├── LevelManager.ts           ← Level progression + unlock conditions
    │   └── PluginRegistry.ts         ← Singleton plugin registry
    ├── plugins/
    │   ├── index.ts                  ← ONLY file that registers plugins
    │   ├── quiz/QuizPlugin.tsx        ← Multiple choice
    │   ├── puzzle/PuzzlePlugin.tsx    ← Number pattern sequences
    │   ├── flashcard/                 ← Flip-card self-assessment
    │   ├── memory/                    ← Card pair matching
    │   ├── sudoku/                    ← Full 9×9 grid
    │   ├── wordbuilder/               ← Letter-based word building
    │   ├── tapblitz/TapBlitzPlugin.tsx     ← Motion game: tap the correct side
    │   └── binaryrunner/BinaryRunnerPlugin.tsx ← Motion game: steer into correct lane
    ├── games/                        ← JSON config per game (8 games)
    ├── components/
    │   ├── GameRenderer.tsx          ← Dynamic renderer — zero plugin coupling
    │   └── ui/
    │       ├── HowToPlayModal.tsx    ← Reusable how-to overlay + help button
    │       ├── SplashScreen.tsx
    │       ├── DeerMascot.tsx
    │       ├── TopRibbon.tsx
    │       └── HexBackground.tsx
    ├── hooks/
    │   ├── useGameEngine.ts          ← Wires useReducer + timer + hints
    │   └── useMultiplayerRoom.ts     ← Full multiplayer state machine
    ├── services/
    │   └── MultiplayerService.ts     ← Socket.io singleton + persistent playerId
    └── pages/
        ├── MultiplayerPage.tsx       ← Lobby → countdown → live game → scoreboard
        ├── LeaderboardPage.tsx
        └── AdminPanel.tsx
```

---

## 🚀 Quick Start (Local)

### Frontend only
```bash
git clone https://github.com/SSPrajwala/taptap_adaptive_game_engine_deployed.git
cd taptap_adaptive_game_engine_deployed/frontend
npm install
npm run dev
```
Open `http://localhost:5173`. Static games work immediately — no backend needed.

### Full stack (frontend + multiplayer backend)
```bash
# Terminal 1 — backend
cd taptap_adaptive_game_engine_deployed/backend
npm install
node server.js          # runs on http://localhost:3001

# Terminal 2 — frontend
cd taptap_adaptive_game_engine_deployed/frontend
npm install
npm run dev             # runs on http://localhost:5173
```

---

## 🎮 Supported Game Types (8 Plugins)

| Plugin | Type | Description |
|--------|------|-------------|
| `quiz` | Multiple Choice | Timed questions with hints, explanations, streak bonus |
| `puzzle` | Pattern Sequence | Arithmetic, geometric, quadratic sequence detection |
| `flashcard` | Flip Card | Self-graded flip cards with category tags |
| `memory` | Grid Match | Card pair matching with shuffle and animation |
| `sudoku` | Grid-based | Full 9×9 Sudoku with conflict detection and numpad |
| `wordbuilder` | Letter-based | Build words from letter tiles, bonus word detection |
| `tapblitz` | Motion Game | Tap left/right in real time as questions fly toward you |
| `binaryrunner` | Motion Game | Steer a runner into the correct binary answer lane |

### Motion Games
TapBlitz and Binary Runner are **canvas-rendered real-time games** where questions approach the player and must be answered by physical action before they reach the end. They feature:
- 3-2-1 countdown that **pauses** when the How-to-Play modal is open
- Auto-advance to the next question after answering (no button needed)
- A floating "?" help button during gameplay
- Neon visual design with glow effects and lane labels

---

## 🌐 Real-Time Multiplayer

The engine includes a full **Kahoot-style multiplayer system** built on Socket.io.

### How it works
1. Host creates a room → gets a 6-character code (e.g. `XKT9Q2`)
2. Guests enter the code and their name → join the lobby
3. Host picks any game from the library → clicks Start
4. All players answer the **same question simultaneously**
5. Live leaderboard updates after every answer
6. Final scoreboard shows rank, score, accuracy for all players

### Reconnect resilience
- Every browser tab gets a **persistent player ID** stored in `sessionStorage`
- This ID is sent to the server on every socket connection
- If a player refreshes their tab, the server restores them to their room automatically
- A 12-second grace period holds the slot before removing a disconnected player

### Multiplayer event contract
| Client → Server | Description |
|----------------|-------------|
| `room:create` | Create a new room |
| `room:join` | Join existing room by code |
| `room:ready` | Toggle ready state |
| `room:selectGame` | Host picks a game |
| `room:start` | Host starts the countdown |
| `game:answer` | Submit answer for current question |
| `room:leave` | Leave the room |

| Server → Client | Description |
|----------------|-------------|
| `room:created` | Sent to creator with room state |
| `room:joined` | Sent to joiner with room state |
| `room:updated` | Broadcast to all players on any change |
| `room:restored` | Sent to reconnecting player to restore phase |
| `game:countdown` | Countdown tick (3, 2, 1) |
| `game:start` | Game begins, first question index |
| `game:question` | Advance to question at index |
| `game:scoreUpdate` | Leaderboard after each answer |
| `game:end` | Final leaderboard |

---

## 🧠 JSON-Driven Gameplay

**Everything** comes from JSON. Change the JSON → change the game. No code touch needed.

```json
{
  "id": "my-game",
  "plugin": "quiz",
  "questions": [{
    "id": "q1", "type": "quiz", "difficulty": "easy", "points": 100,
    "prompt": "Your question here?",
    "options": ["A", "B", "C", "D"],
    "correctIndex": 2,
    "hint": "Optional hint",
    "explanation": "Why this is correct"
  }],
  "adaptiveRules": [{
    "condition": { "metric": "accuracy", "operator": ">=", "value": 0.8 },
    "action": { "type": "adjustDifficulty", "payload": { "difficulty": "hard" } }
  }],
  "scoring": {
    "basePoints": 100,
    "timeBonus": true,
    "timeBonusPerSecond": 3,
    "streakMultiplier": true,
    "streakThreshold": 3,
    "streakMultiplierValue": 1.5
  }
}
```

---

## 🔌 Adding a New Game Type (4 Steps)

**Step 1 — Add your question type to `engine.types.ts`:**
```ts
export interface FlashcardQuestion extends BaseQuestion {
  type: "flashcard"
  front: string
  back: string
}
export type Question = QuizQuestion | ... | FlashcardQuestion
```

**Step 2 — Create your plugin:**
```tsx
// src/plugins/flashcard/FlashcardPlugin.tsx
export const FlashcardPlugin: GamePlugin<FlashcardQuestion> = {
  id: "flashcard",
  handles: ["flashcard"],
  validateQuestion(q): q is FlashcardQuestion { return q.type === "flashcard" },
  Component: FlashcardComponent,
}
```

**Step 3 — Register in `src/plugins/index.ts`:**
```ts
pluginRegistry.register(FlashcardPlugin)
```

**Step 4 — Create a JSON config with `"plugin": "flashcard"`**

✅ Zero other files change. The engine picks it up automatically.

---

## 🚢 Production Deployment

The frontend and backend are deployed as two separate services.

| Service | Platform | Notes |
|---------|----------|-------|
| Frontend (React/Vite) | Vercel | Auto-deploys on `git push` |
| Backend (Node.js + Socket.io) | Railway | Persistent WebSocket support |

### Environment variable (set in Vercel dashboard)
```
VITE_API_URL = https://your-backend.up.railway.app/api
```

This single variable wires both the REST API calls and the Socket.io connection to the production backend.

---

## ⚙️ Admin Panel

The Admin Panel allows changing game content without touching code:

- **Questions tab:** Add, edit, delete questions. Set correct answer with one click.
- **Levels tab:** Assign/remove questions from levels via dropdown.
- **Settings tab:** Change title, description, scoring config, UI flags.

Changes are saved to the backend (`taptap_db.json`) and immediately reflected for all players.

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript (strict mode) |
| Build | Vite |
| State | useReducer (pure reducer pattern) |
| Realtime | Socket.io (WebSocket + polling fallback) |
| Canvas | HTML5 Canvas 2D API (motion games) |
| Backend | Node.js, Express |
| Styling | CSS Variables, custom design system |
| Fonts | Orbitron (display), Exo 2 (body) |
| Deployment | Vercel (frontend) + Railway (backend) |

---

## 📦 Judging Criteria — How We Satisfy Each

| Criterion | Weight | How Satisfied |
|-----------|--------|--------------|
| Functionality & Stability | 30% | 8 fully playable game types, multiplayer with reconnect recovery, adaptive difficulty |
| Architecture & Reusability | 25% | Plugin registry, pure reducer, JSON config, Socket.io room manager, zero hardcoding |
| UI/UX Design | 20% | Neon dark theme, canvas motion games, animated mascot, glassmorphism, hex geometry |
| Code Quality | 15% | TypeScript strict, separated concerns, single-responsibility, persistent player identity |
| Innovation & Creativity | 10% | Real-time multiplayer, canvas motion games, adaptive difficulty from JSON rules |

---

## 👤 Developer

**S. S. Prajwala**
TapTap × Blackbucks Hackathon 2026 — League 1: Engine League

---

## 📄 License

Built for the TapTap Hackathon. Original work only.
