import React, { useState, useEffect } from "react"
import type { LeaderboardEntry } from "../types/engine.types"
import { LeaderboardService } from "../engine/LeaderboardService"

interface Props { onBack: () => void }

export const LeaderboardPage: React.FC<Props> = ({ onBack }) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [filter,  setFilter]  = useState<"global" | string>("global")
  const [games,   setGames]   = useState<string[]>([])

  useEffect(() => {
    const all = LeaderboardService.getAll()
    const uniqueGames = [...new Set(all.map(e => e.gameTitle))]
    setGames(uniqueGames)
    if (filter === "global") {
      setEntries(LeaderboardService.getGlobal())
    } else {
      setEntries(
        all.filter(e => e.gameTitle === filter)
          .sort((a, b) => b.score - a.score || a.timeTaken - b.timeTaken)
          .slice(0, 20)
      )
    }
  }, [filter])

  const formatDate = (ts: number) =>
    new Date(ts).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })

  const formatTime = (s: number) => {
    if (s < 60) return `${s}s`
    return `${Math.floor(s / 60)}m ${s % 60}s`
  }

  const medals = ["🥇", "🥈", "🥉"]

  return (
    <div className="page-wrap">
      <div className="page-header">
        <button className="back-btn" onClick={onBack}>← Back</button>
        <h1 className="page-title">Leaderboard</h1>
        <button className="btn-danger-sm" onClick={() => { LeaderboardService.clear(); setEntries([]) }}>
          Clear
        </button>
      </div>

      <p className="lb-subtitle">Sorted by score · ties broken by fastest time</p>

      {/* Filter tabs */}
      <div className="filter-tabs">
        <button className={`filter-tab${filter === "global" ? " active" : ""}`} onClick={() => setFilter("global")}>
          🌐 Global
        </button>
        {games.map(g => (
          <button key={g} className={`filter-tab${filter === g ? " active" : ""}`} onClick={() => setFilter(g)}>
            {g}
          </button>
        ))}
      </div>

      {entries.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🏆</div>
          <p>No scores yet. Play a game to appear here!</p>
        </div>
      ) : (
        <div className="lb-list">
          {/* Header row */}
          <div className="lb-header-row">
            <div className="lb-col-rank">#</div>
            <div className="lb-col-name">Player</div>
            <div className="lb-col-score">Score</div>
            <div className="lb-col-time">Time</div>
            <div className="lb-col-acc">Acc</div>
            <div className="lb-col-date">Date</div>
          </div>

          {entries.map((entry, i) => (
            <div key={entry.id} className={`lb-row${i < 3 ? " lb-top" : ""}`}>
              <div className="lb-col-rank">{medals[i] ?? `#${i + 1}`}</div>
              <div className="lb-col-name">
                <div className="lb-name">{entry.playerName}</div>
                <div className="lb-game">{entry.gameTitle}</div>
              </div>
              <div className="lb-col-score">
                <span className="lb-score">{entry.score.toLocaleString()}</span>
              </div>
              <div className="lb-col-time">
                <span className="lb-time">{formatTime(entry.timeTaken)}</span>
              </div>
              <div className="lb-col-acc">
                <span className="lb-acc">{Math.round(entry.accuracy * 100)}%</span>
              </div>
              <div className="lb-col-date">
                <span className="lb-date">{formatDate(entry.timestamp)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}