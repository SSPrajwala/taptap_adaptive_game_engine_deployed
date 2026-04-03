/**
 * AIService — typed wrapper for all /api/ai endpoints
 */

const API = import.meta.env.VITE_API_URL ?? "http://localhost:3001/api"

function authHeaders(token: string) {
  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`,
  }
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface GenerateQuizInput {
  topic:          string
  difficulty?:    "easy" | "medium" | "hard"
  questionCount?: number
  targetCompany?: string
  tags?:          string[]
}

export interface GenerateFlashcardInput {
  topic:       string
  cardCount?:  number
  difficulty?: "easy" | "medium" | "hard"
}

export interface ExplanationInput {
  concept?:       string
  question?:      string
  correctAnswer?: string
  studentAnswer?: string
  context?:       string
}

export interface AnalysisInput {
  gameTitle:      string
  score:          number
  accuracy:       number
  timeTaken:      number
  difficulty?:    string
  wrongAnswers?:  { question: string; answer: string; correct: string }[]
  correctAnswers?: string[]
}

export interface LessonInput {
  topic:          string
  targetCompany?: string
  duration?:      string
  level?:         string
}

export interface MascotMessage {
  role: "user" | "assistant"
  text: string
}

export interface SkillReport {
  summary:         string
  strengths:       string[]
  improvements:    string[]
  recommendations: { skill: string; action: string; games: string[] }[]
  readiness:       { score: number; level: string; message: string }
  weeklyPlan:      { day: string; focus: string; duration: string }[]
}

export interface SessionAnalysis {
  grade:           string
  feedback:        string
  mistakePatterns: string[]
  focusTip:        string
  encouragement:   string
}

// ── Service ───────────────────────────────────────────────────────────────────

export const AIService = {

  async generateQuiz(token: string, input: GenerateQuizInput) {
    const res  = await fetch(`${API}/ai/generate/quiz`, {
      method:  "POST",
      headers: authHeaders(token),
      body:    JSON.stringify(input),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error ?? "AI quiz generation failed.")
    return data as { generationId: string; config: Record<string, unknown> }
  },

  async generateFlashcard(token: string, input: GenerateFlashcardInput) {
    const res  = await fetch(`${API}/ai/generate/flashcard`, {
      method:  "POST",
      headers: authHeaders(token),
      body:    JSON.stringify(input),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error ?? "AI flashcard generation failed.")
    return data as { generationId: string; config: Record<string, unknown> }
  },

  async getExplanation(token: string, input: ExplanationInput): Promise<string> {
    const res  = await fetch(`${API}/ai/generate/explanation`, {
      method:  "POST",
      headers: authHeaders(token),
      body:    JSON.stringify(input),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error ?? "Failed to get explanation.")
    return data.explanation as string
  },

  async generateReport(token: string): Promise<SkillReport> {
    const res  = await fetch(`${API}/ai/generate/report`, {
      method:  "POST",
      headers: authHeaders(token),
      body:    JSON.stringify({}),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error ?? "Failed to generate report.")
    return data.report as SkillReport
  },

  async analyseSession(token: string, input: AnalysisInput): Promise<SessionAnalysis> {
    const res  = await fetch(`${API}/ai/generate/analysis`, {
      method:  "POST",
      headers: authHeaders(token),
      body:    JSON.stringify(input),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error ?? "Failed to analyse session.")
    return data.analysis as SessionAnalysis
  },

  async generateLesson(token: string, input: LessonInput) {
    const res  = await fetch(`${API}/ai/generate/lesson`, {
      method:  "POST",
      headers: authHeaders(token),
      body:    JSON.stringify(input),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error ?? "Failed to generate lesson.")
    return data.lesson
  },

  async chat(token: string, message: string, history: MascotMessage[] = [], context?: string): Promise<string> {
    const res  = await fetch(`${API}/ai/mascot/chat`, {
      method:  "POST",
      headers: authHeaders(token),
      body:    JSON.stringify({ message, history, context }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error ?? "Blackbuck is unavailable right now.")
    return data.reply as string
  },

  async getHistory(token: string, type?: string) {
    const url = type ? `${API}/ai/history?type=${type}` : `${API}/ai/history`
    const res = await fetch(url, { headers: authHeaders(token) })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error ?? "Failed to load history.")
    return data as { id: string; type: string; prompt: string; createdAt: string }[]
  },

  async getGeneration(token: string, id: string) {
    const res  = await fetch(`${API}/ai/history/${id}`, { headers: authHeaders(token) })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error ?? "Generation not found.")
    return data
  },
}
