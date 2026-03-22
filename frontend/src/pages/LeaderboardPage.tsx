import React, { useState, useEffect } from "react"
import type { LeaderboardEntry } from "../types/engine.types"
import { LeaderboardService } from "../engine/LeaderboardService"

interface Props { onBack: () => void }

export const LeaderboardPage: React.FC<Props> = ({ onBack }) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [filter, setFilter] = useState<"global" | string>("global")
  const [games, setGames] = useState<string[]>([])

  useEffect(() => {
    const all = LeaderboardService.getAll()
    const uniqueGames = [...new Set(all.map(e => e.gameTitle))]
    setGames(uniqueGames)
    setEntries(filter === "global" ? LeaderboardService.getGlobal() : all.filter(e => e.gameTitle === filter).sort((a, b) => b.score - a.score).slice(0, 20))
  }, [filter])

  const formatDate = (ts: number) => {
    const d = new Date(ts)
    return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" })
  }

  const medals = ["🥇", "🥈", "🥉"]

  return (
    <div className="page-wrap">
      <div className="page-header">
        <button className="back-btn" onClick={onBack}>← Back</button>
        <h1 className="page-title">Leaderboard</h1>
        <button className="btn-danger-sm" onClick={() => { LeaderboardService.clear(); setEntries([]) }}>Clear</button>
      </div>

      {/* Filter tabs */}
      <div className="filter-tabs">
        <button className={`filter-tab${filter === "global" ? " active" : ""}`} onClick={() => setFilter("global")}>🌐 Global</button>
        {games.map(g => (
          <button key={g} className={`filter-tab${filter === g ? " active" : ""}`} onClick={() => setFilter(g)}>{g}</button>
        ))}
      </div>

      {entries.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🏆</div>
          <p>No scores yet. Play a game to appear here!</p>
        </div>
      ) : (
        <div className="lb-list">
          {entries.map((entry, i) => (
            <div key={entry.id} className={`lb-row${i < 3 ? " lb-top" : ""}`}>
              <div className="lb-rank">{medals[i] ?? `#${i + 1}`}</div>
              <div className="lb-info">
                <div className="lb-name">{entry.playerName}</div>
                <div className="lb-game">{entry.gameTitle} · {entry.difficulty}</div>
              </div>
              <div className="lb-stats">
                <div className="lb-score">{entry.score.toLocaleString()}</div>
                <div className="lb-acc">{Math.round(entry.accuracy * 100)}% acc</div>
              </div>
              <div className="lb-date">{formatDate(entry.timestamp)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}