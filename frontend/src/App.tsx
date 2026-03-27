import React, { useState } from "react"
import { GameRenderer }    from "./components/GameRenderer"
import { LeaderboardPage } from "./pages/LeaderboardPage"
import { AdminPanel }      from "./pages/AdminPanel"
import { SplashScreen }    from "./components/ui/SplashScreen"
import { DeerMascot }      from "./components/ui/DeerMascot"
import { HexBackground }   from "./components/ui/HexBackground"
import type { GameConfig } from "./types/engine.types"

import logicGameRaw      from "./games/logic-game.json"
import patternPuzzleRaw  from "./games/pattern-puzzle.json"
import worldCapitalsRaw  from "./games/world-capitals.json"
import emojiMemoryRaw    from "./games/emoji-memory.json"
import sudokuRaw         from "./games/sudoku.json"
import wordbuilderRaw    from "./games/wordbuilder.json"

import "./plugins"
import "./styles.css"

type Page = "library" | "game" | "leaderboard" | "admin"

// Each plugin gets a unique neon accent color
const PLUGIN_COLORS: Record<string, string> = {
  quiz:        "linear-gradient(135deg,#A855F7,#3B82F6)",
  puzzle:      "linear-gradient(135deg,#00D4FF,#22FFAA)",
  flashcard:   "linear-gradient(135deg,#A855F7,#FF2D78)",
  memory:      "linear-gradient(135deg,#22FFAA,#00D4FF)",
  sudoku:      "linear-gradient(135deg,#FFD700,#FF8C00)",
  wordbuilder: "linear-gradient(135deg,#FF2D78,#A855F7)",
}

const PLUGIN_TEXT_COLORS: Record<string, string> = {
  quiz:        "#A855F7",
  puzzle:      "#00D4FF",
  flashcard:   "#FF2D78",
  memory:      "#22FFAA",
  sudoku:      "#FFD700",
  wordbuilder: "#FF2D78",
}

// Hex SVG logo mark
const HexLogo = () => (
  <svg className="app-logo-hex" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%"   stopColor="#A855F7" />
        <stop offset="50%"  stopColor="#3B82F6" />
        <stop offset="100%" stopColor="#00D4FF" />
      </linearGradient>
    </defs>
    <polygon points="24,3 43,13 43,35 24,45 5,35 5,13" fill="rgba(168,85,247,0.15)" stroke="url(#logoGrad)" strokeWidth="1.5"/>
    <text x="24" y="28" textAnchor="middle" dominantBaseline="central" fill="url(#logoGrad)" fontSize="14" fontFamily="Orbitron" fontWeight="900">TT</text>
    <path d="M17,16 L17,10 M17,10 L14,7 M17,10 L20,7 M31,16 L31,10 M31,10 L28,7 M31,10 L34,7" stroke="#22FFAA" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
  </svg>
)

export default function App() {
  const [showSplash, setShowSplash] = useState(true)
  const [games, setGames] = useState<GameConfig[]>([
    logicGameRaw     as unknown as GameConfig,
    patternPuzzleRaw as unknown as GameConfig,
    worldCapitalsRaw as unknown as GameConfig,
    emojiMemoryRaw   as unknown as GameConfig,
    sudokuRaw        as unknown as GameConfig,
    wordbuilderRaw   as unknown as GameConfig,
  ])

  const [page,       setPage]       = useState<Page>("library")
  const [activeGame, setActiveGame] = useState<GameConfig | null>(null)

  // Show splash on first load
  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />
  }

  if (page === "game" && activeGame) {
    return (
      <div className="app-shell">
        <HexBackground />
        <GameRenderer config={activeGame} onBack={() => setPage("library")} />
        <DeerMascot state="idle" />
      </div>
    )
  }

  if (page === "leaderboard") {
    return (
      <div className="app-shell">
        <HexBackground />
        <LeaderboardPage onBack={() => setPage("library")} />
        <DeerMascot state="idle" />
      </div>
    )
  }

  if (page === "admin") {
    return (
      <div className="app-shell">
        <HexBackground />
        <AdminPanel games={games} onBack={() => setPage("library")} onSave={setGames} />
        <DeerMascot state="idle" />
      </div>
    )
  }

  // ── Library ────────────────────────────────────────────────────────────────
  return (
    <div className="app-shell">
      <HexBackground />

      {/* Header */}
      <header className="app-header animate-in">
        <div className="app-logo-mark">
          <HexLogo />
          <h1>TapTap Engine</h1>
        </div>
        <p>Adaptive · Plugin-based · JSON-driven</p>
      </header>

      {/* Navigation */}
      <nav className="app-nav animate-in stagger-1">
        <button className="nav-btn nav-btn-active">🎮 Games</button>
        <button className="nav-btn" onClick={() => setPage("leaderboard")}>🏆 Leaderboard</button>
        <button className="nav-btn" onClick={() => setPage("admin")}>⚙️ Admin</button>
      </nav>

      {/* Game cards */}
      <div className="game-library">
        {games.map((game, i) => (
          <div
            key={game.id}
            className={`game-card animate-in stagger-${Math.min(i + 2, 6)}`}
            style={{ "--card-accent": PLUGIN_COLORS[game.plugin] ?? "var(--grad-brand)" } as React.CSSProperties}
            onClick={() => { setActiveGame(game); setPage("game") }}
          >
            {/* Inner glow on hover */}
            <div className="game-card-inner-glow" />

            <div className="card-top">
              <span className="card-emoji">{game.ui?.emoji ?? "🎮"}</span>
              <span
                className="card-plugin-tag"
                style={{ color: PLUGIN_TEXT_COLORS[game.plugin] ?? "#A855F7" }}
              >
                {game.plugin}
              </span>
            </div>

            <h2 className="card-title">{game.title}</h2>
            <p  className="card-desc">{game.description}</p>

            <div className="card-footer">
              <div className="card-meta">
                <span>📚 {game.levels.length} levels</span>
                <span>❓ {game.questions.length} questions</span>
              </div>
              <button
                className="btn-play"
                onClick={e => { e.stopPropagation(); setActiveGame(game); setPage("game") }}
              >
                Play →
              </button>
            </div>
          </div>
        ))}
      </div>

      <footer className="app-footer">
        <span>TapTap Adaptive Game Engine · S. S. Prajwala</span>
        <span>{games.length} games · {games.reduce((s, g) => s + g.questions.length, 0)} questions</span>
      </footer>

      {/* Deer mascot always visible */}
      <DeerMascot state="idle" />
    </div>
  )
}