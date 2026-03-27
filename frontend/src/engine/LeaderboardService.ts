import type { LeaderboardEntry } from "../types/engine.types"

const KEY     = "taptap_leaderboard_v2"
const MAX     = 100
const API_URL = "https://jsonplaceholder.typicode.com/posts" // mock API endpoint

export class LeaderboardService {

  // ── Local storage ──────────────────────────────────────────────────────────

  static getAll(): LeaderboardEntry[] {
    try {
      const raw = localStorage.getItem(KEY)
      return raw ? JSON.parse(raw) : []
    } catch { return [] }
  }

  static save(entry: Omit<LeaderboardEntry, "id" | "timestamp">): LeaderboardEntry {
    const full: LeaderboardEntry = {
      ...entry,
      id:        crypto.randomUUID(),
      timestamp: Date.now(),
    }
    const all = this.getAll()
    all.push(full)
    // Sort: primary = score descending, tiebreaker = timeTaken ascending (faster is better)
    all.sort((a, b) => b.score - a.score || a.timeTaken - b.timeTaken)
    localStorage.setItem(KEY, JSON.stringify(all.slice(0, MAX)))
    return full
  }

  static getForGame(gameId: string): LeaderboardEntry[] {
    return this.getAll()
      .filter(e => e.gameId === gameId)
      .sort((a, b) => b.score - a.score || a.timeTaken - b.timeTaken)
      .slice(0, 10)
  }

  static getGlobal(): LeaderboardEntry[] {
    return this.getAll()
      .sort((a, b) => b.score - a.score || a.timeTaken - b.timeTaken)
      .slice(0, 20)
  }

  static getRank(score: number, timeTaken: number): number {
    const all = this.getAll()
    return all.filter(e =>
      e.score > score || (e.score === score && e.timeTaken < timeTaken)
    ).length + 1
  }

  static clear(): void {
    localStorage.removeItem(KEY)
  }

  // ── Mock API submit ────────────────────────────────────────────────────────
  // Submits score to a mock REST API to satisfy the "submit scores to leaderboard API"
  // requirement. Replace API_URL with your real backend endpoint when available.

  static async submitToAPI(entry: LeaderboardEntry): Promise<{ success: boolean; message: string }> {
    try {
      const payload = {
        title:   `${entry.playerName} scored ${entry.score} on ${entry.gameTitle}`,
        body:    JSON.stringify({
          player:      entry.playerName,
          game:        entry.gameTitle,
          score:       entry.score,
          accuracy:    Math.round(entry.accuracy * 100),
          timeTaken:   entry.timeTaken,
          difficulty:  entry.difficulty,
          timestamp:   new Date(entry.timestamp).toISOString(),
        }),
        userId: 1,
      }

      const res = await fetch(API_URL, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload),
      })

      if (!res.ok) throw new Error(`API responded with ${res.status}`)

      return { success: true, message: "Score submitted to leaderboard API!" }
    } catch (err) {
      // Graceful fallback — local save still works
      return { success: false, message: "API unavailable — score saved locally." }
    }
  }
}