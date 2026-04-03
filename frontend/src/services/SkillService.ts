/**
 * SkillService — typed wrapper for all /api/skills endpoints
 */

const API = import.meta.env.VITE_API_URL ?? "http://localhost:3001/api"

function authHeaders(token: string) {
  return { "Authorization": `Bearer ${token}` }
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface SkillProgress {
  skillArea:   string
  level:       number        // 1–5
  xp:          number
  gamesPlayed: number
  accuracy:    number        // 0–100
  updatedAt:   string | null
}

export interface SkillSummary {
  skills:  SkillProgress[]
  summary: {
    overallLevel:  number
    totalXp:       number
    totalGames:    number
    activeSkills:  number
  }
}

export interface SkillLeaderboardEntry {
  rank:        number
  userId:      string
  username:    string
  college:     string
  totalXp:     number
  avgLevel:    number
  gamesPlayed: number
}

// Label map for display
export const SKILL_LABELS: Record<string, string> = {
  logical_reasoning:   "Logical Reasoning",
  algorithms:          "Algorithms",
  vocabulary:          "Vocabulary",
  attention_to_detail: "Attention to Detail",
  numerical_ability:   "Numerical Ability",
  pattern_recognition: "Pattern Recognition",
  problem_solving:     "Problem Solving",
  verbal_ability:      "Verbal Ability",
  memory:              "Memory",
  focus:               "Focus",
  general_knowledge:   "General Knowledge",
}

export const SKILL_EMOJIS: Record<string, string> = {
  logical_reasoning:   "🧠",
  algorithms:          "⚙️",
  vocabulary:          "📚",
  attention_to_detail: "🔍",
  numerical_ability:   "🔢",
  pattern_recognition: "🔮",
  problem_solving:     "💡",
  verbal_ability:      "💬",
  memory:              "🧩",
  focus:               "🎯",
  general_knowledge:   "🌍",
}

// ── Service ───────────────────────────────────────────────────────────────────

export const SkillService = {

  async getMySkills(token: string): Promise<SkillSummary> {
    const res  = await fetch(`${API}/skills`, { headers: authHeaders(token) })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error ?? "Failed to load skills.")
    return data as SkillSummary
  },

  async getSkill(token: string, skillArea: string): Promise<SkillProgress> {
    const res  = await fetch(`${API}/skills/${skillArea}`, { headers: authHeaders(token) })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error ?? "Failed to load skill.")
    return data as SkillProgress
  },

  async getLeaderboard(): Promise<SkillLeaderboardEntry[]> {
    const res  = await fetch(`${API}/skills/leaderboard`)
    const data = await res.json()
    if (!res.ok) throw new Error(data.error ?? "Failed to load skill leaderboard.")
    return data as SkillLeaderboardEntry[]
  },

  /** Returns level colour class for TailwindCSS */
  levelColor(level: number): string {
    if (level >= 5) return "text-yellow-400"
    if (level >= 4) return "text-purple-400"
    if (level >= 3) return "text-blue-400"
    if (level >= 2) return "text-green-400"
    return "text-gray-400"
  },

  /** Returns level badge label */
  levelLabel(level: number): string {
    return ["", "Beginner", "Developing", "Competent", "Advanced", "Expert"][level] ?? "Expert"
  },

  /** XP needed to reach next level */
  xpToNext(level: number): number {
    const thresholds = [0, 100, 200, 350, 500]
    return thresholds[level] ?? 500
  },

  /** Progress percentage toward next level (0–100) */
  xpProgress(level: number, xp: number): number {
    if (level >= 5) return 100
    const needed = SkillService.xpToNext(level)
    return Math.min(100, Math.round((xp / needed) * 100))
  },
}
