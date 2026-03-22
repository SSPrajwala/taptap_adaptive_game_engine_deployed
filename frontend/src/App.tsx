import React, { useState } from "react"
import { GameRenderer }   from "./components/GameRenderer"
import { LeaderboardPage } from "./pages/LeaderboardPage"
import { AdminPanel }      from "./pages/AdminPanel"
import type { GameConfig } from "./types/engine.types"

import logicGameRaw      from "./games/logic-game.json"
import patternPuzzleRaw  from "./games/pattern-puzzle.json"
import worldCapitalsRaw  from "./games/world-capitals.json"
import emojiMemoryRaw    from "./games/emoji-memory.json"

import "./plugins"
import "./styles.css"

type Page = "library" | "game" | "leaderboard" | "admin"

const PLUGIN_COLORS: Record<string, string> = {
  quiz:      "var(--accent)",
  puzzle:    "#22d3ee",
  flashcard: "#a78bfa",
  memory:    "#34d399",
}

export default function App() {
  const [games, setGames] = useState<GameConfig[]>([
    logicGameRaw     as unknown as GameConfig,
    patternPuzzleRaw as unknown as GameConfig,
    worldCapitalsRaw as unknown as GameConfig,
    emojiMemoryRaw   as unknown as GameConfig,
  ])

  const [page, setPage]         = useState<Page>("library")
  const [activeGame, setActiveGame] = useState<GameConfig | null>(null)

  const handlePlayGame = (game: GameConfig) => {
    setActiveGame(game)
    setPage("game")
  }

  const handleAdminSave = (updated: GameConfig[]) => {
    setGames(updated)
  }

  // ── Game page ──────────────────────────────────────────────────────────────
  if (page === "game" && activeGame) {
    return <div className="app-shell"><GameRenderer config={activeGame} onBack={() => setPage("library")} /></div>
  }

  // ── Leaderboard ────────────────────────────────────────────────────────────
  if (page === "leaderboard") {
    return <div className="app-shell"><LeaderboardPage onBack={() => setPage("library")} /></div>
  }

  // ── Admin panel ────────────────────────────────────────────────────────────
  if (page === "admin") {
    return <div className="app-shell"><AdminPanel games={games} onBack={() => setPage("library")} onSave={handleAdminSave} /></div>
  }

  // ── Library ────────────────────────────────────────────────────────────────
  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-logo">⚡</div>
        <h1>TapTap Engine</h1>
        <p>Adaptive · Plugin-based · JSON-driven</p>
      </header>

      {/* Nav bar */}
      <nav className="app-nav">
        <button className="nav-btn nav-btn-active">🎮 Games</button>
        <button className="nav-btn" onClick={() => setPage("leaderboard")}>🏆 Leaderboard</button>
        <button className="nav-btn" onClick={() => setPage("admin")}>⚙️ Admin</button>
      </nav>

      {/* Game library */}
      <div className="game-library">
        {games.map(game => (
          <div key={game.id} className="game-card" onClick={() => handlePlayGame(game)}
            style={{ "--card-accent": PLUGIN_COLORS[game.plugin] ?? "var(--accent)" } as React.CSSProperties}>
            <div className="card-top">
              <span className="card-emoji">{game.ui?.emoji ?? "🎮"}</span>
              <span className="card-plugin-tag" style={{ color: PLUGIN_COLORS[game.plugin] ?? "var(--accent)" }}>{game.plugin}</span>
            </div>
            <h2 className="card-title">{game.title}</h2>
            <p className="card-desc">{game.description}</p>
            <div className="card-footer">
              <div className="card-meta">
                <span>📚 {game.levels.length} levels</span>
                <span>❓ {game.questions.length} questions</span>
              </div>
              <button className="btn-play">Play →</button>
            </div>
          </div>
        ))}
      </div>

      <footer className="app-footer">
        <span>TapTap Adaptive Game Engine</span>
        <span>{games.length} games · {games.reduce((s, g) => s + g.questions.length, 0)} questions</span>
      </footer>
    </div>
  )
}