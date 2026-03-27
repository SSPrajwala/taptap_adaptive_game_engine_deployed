# ⚡ TapTap Adaptive Game Engine

> **A reusable, plugin-based, JSON-driven game engine framework for gamified learning — built for the TapTap × Blackbucks Hackathon 2026**

🎮 **Live Demo:** [taptapadaptivegameengine.vercel.app](https://taptapadaptivegameengine.vercel.app)
📁 **Repository:** [github.com/SSPrajwala/TapTap_Game_Engine](https://github.com/SSPrajwala/TapTap_Game_Engine)

---

## 🌟 What is TapTap Game Engine?

TapTap is not just one game — it is the **infrastructure that hosts unlimited games**. Every aspect of gameplay — questions, levels, rules, scoring, difficulty — is controlled entirely by JSON configuration files. Changing one line in a JSON file changes the game behaviour. No code changes required.

---

## 🏗️ Architecture Overview

```
src/
├── types/engine.types.ts        ← Single source of truth for all TypeScript types
├── engine/
│   ├── EngineCore.ts            ← Pure reducer — reduce(state, action): GameState
│   ├── ScoreEngine.ts           ← Points, time bonus, streak multiplier
│   ├── AdaptiveEngine.ts        ← JSON-driven adaptive difficulty rules
│   ├── LevelManager.ts          ← Level progression + unlock conditions
│   ├── PluginRegistry.ts        ← Singleton plugin registry
│   └── LeaderboardService.ts    ← localStorage + mock API score submission
├── plugins/
│   ├── index.ts                 ← ONLY file that registers plugins
│   ├── quiz/QuizPlugin.tsx      ← Multiple choice game type
│   ├── puzzle/PuzzlePlugin.tsx  ← Number pattern sequences
│   ├── flashcard/               ← Flip-card self-assessment
│   ├── memory/                  ← Card pair matching
│   ├── sudoku/                  ← Full 9×9 grid with conflict detection
│   └── wordbuilder/             ← Letter-based word building
├── games/
│   ├── logic-game.json          ← 12 quiz questions, 3 adaptive levels
│   ├── pattern-puzzle.json      ← Arithmetic + geometric + quadratic sequences
│   ├── world-capitals.json      ← Flashcard geography game
│   ├── emoji-memory.json        ← Memory matching game
│   ├── sudoku.json              ← 5 Sudoku puzzles across 3 levels
│   └── wordbuilder.json         ← 5 word sets across 3 levels
├── components/
│   └── GameRenderer.tsx         ← Dynamic renderer — zero plugin coupling
├── components/ui/
│   ├── SplashScreen.tsx         ← Animated entry with electric hex logo
│   ├── DeerMascot.tsx           ← SVG mascot with 4 reaction states
│   ├── TopRibbon.tsx            ← Glassmorphism header with search
│   ├── Footer.tsx               ← Glassmorphism footer
│   └── HexBackground.tsx        ← Floating hex particles + orbs
├── hooks/useGameEngine.ts       ← Wires useReducer + timer + hints
├── pages/
│   ├── LeaderboardPage.tsx      ← Filterable scores with time tiebreaker
│   └── AdminPanel.tsx           ← In-browser game configuration
└── App.tsx                      ← Navigation + game library
```

---

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/SSPrajwala/TapTap_Game_Engine.git
cd TapTap_Game_Engine/frontend

# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

Open `http://localhost:5173` in your browser.

---

## 🎮 Supported Game Types (6 Plugins)

| Plugin | Type | Description |
|--------|------|-------------|
| `quiz` | Multiple Choice | Timed questions with hints, explanations, streak bonus |
| `puzzle` | Pattern Sequence | Arithmetic, geometric, quadratic sequence detection |
| `flashcard` | Flip Card | Self-graded flip cards with category tags |
| `memory` | Grid Match | Card pair matching with shuffle and animation |
| `sudoku` | Grid-based | Full 9×9 Sudoku with conflict detection and numpad |
| `wordbuilder` | Letter-based | Build words from letter tiles, bonus word detection |

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

**Step 4 — Create JSON config with `"plugin": "flashcard"`**

✅ Zero other files change. The engine picks it up automatically.

---

## 🏆 Leaderboard & Scoring

- Scores saved to `localStorage` (client-side, no backend required)
- Sorted by **score descending**, ties broken by **time taken ascending** (faster = higher rank)
- Filterable by game or global view
- Score submitted to a REST API endpoint on save (`LeaderboardService.submitToAPI`)
- Player sees their rank immediately after finishing

---

## ⚙️ Admin Panel

The Admin Panel demonstrates JSON-driven gameplay without editing files:

- **Questions tab:** Add, edit, delete quiz questions. Set correct answer with one click.
- **Levels tab:** Assign/remove questions from levels via dropdown.
- **Settings tab:** Change title, description, scoring config, UI flags.

> **Note:** The Admin Panel is currently open to all users for prototype demonstration. Authentication and role-based access will be added in Level 2.

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript (strict mode) |
| Build | Vite |
| State | useReducer (pure reducer pattern) |
| Styling | CSS Variables, custom design system |
| Fonts | Orbitron (display), Exo 2 (body) |
| Persistence | localStorage |
| API | Fetch (mock REST endpoint) |
| Deployment | Vercel |

---

## 🔮 Planned for Level 2

- [ ] Node.js / Express backend with real database (MongoDB / Supabase)
- [ ] JWT authentication — Sign In / Sign Up fully functional
- [ ] Admin Panel restricted to authenticated admin roles
- [ ] Real leaderboard API synced across all players
- [ ] Documentation page (architecture walkthrough)
- [ ] About page with team information
- [ ] Profile page with player history and statistics
- [ ] More game types: Logic Grids, Word Scramble, Aptitude Blitz
- [ ] TapTap content backend integration for dynamic game loading

---

## 📦 Judging Criteria — How We Satisfy Each

| Criterion | Weight | How Satisfied |
|-----------|--------|--------------|
| Functionality & Stability | 30% | 6 fully playable game types, all levels, scoring, leaderboard |
| Architecture & Reusability | 25% | Plugin registry, pure reducer, JSON config, zero hardcoding |
| UI/UX Design | 20% | Neon dark theme, animated mascot, glassmorphism, hex geometry |
| Code Quality | 15% | TypeScript strict, separated concerns, single-responsibility |
| Innovation & Creativity | 10% | Adaptive difficulty from JSON rules, electric splash screen |

---

## 👤 Developer

**S. S. Prajwala**
TapTap × Blackbucks Hackathon 2026 — League 1: Engine League

---

## 📄 License

Built for the TapTap Hackathon. Original work only.