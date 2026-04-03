/**
 * AI Routes — Gemini-powered generation + analysis
 * Uses Google Gemini 1.5 Flash (free tier: 1500 req/day, 15 req/min)
 *
 * POST /api/ai/generate/quiz         → full quiz game JSON
 * POST /api/ai/generate/flashcard    → flashcard game JSON
 * POST /api/ai/generate/lesson       → structured lesson plan
 * POST /api/ai/generate/report       → skill-gap analysis report
 * POST /api/ai/generate/explanation  → explain a specific concept
 * POST /api/ai/generate/analysis     → analyse a completed session
 * POST /api/ai/mascot/chat           → Blackbuck AI companion chat
 * GET  /api/ai/history               → user's past generations
 * GET  /api/ai/history/:id           → a single stored generation
 */

require("dotenv").config()
const express                = require("express")
const { GoogleGenerativeAI } = require("@google/generative-ai")
const prisma                 = require("../prisma/client")
const { requireAuth }        = require("../middleware/auth")

const router = express.Router()
const genAI  = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "")

// Gemini model — Flash is the free tier workhorse
function getModel() {
  return genAI.getGenerativeModel({ model: "gemini-1.5-flash" })
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Call Gemini with a given system context + user prompt.
 * Returns the raw text response.
 */
async function callGemini(systemPrompt, userPrompt) {
  const model  = getModel()
  const result = await model.generateContent([
    { role: "user", parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] },
  ])
  return result.response.text()
}

/**
 * Call Gemini and parse the JSON from the response.
 * Gemini Flash sometimes wraps JSON in ```json ... ``` fences — strip them.
 */
async function callGeminiJSON(systemPrompt, userPrompt) {
  const raw  = await callGemini(systemPrompt, userPrompt)
  const text = raw.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim()
  return JSON.parse(text)
}

// ── System Prompts ────────────────────────────────────────────────────────────

const GAME_SCHEMA = `
You are TapTap AI, an expert educational game designer. You must return ONLY valid JSON with NO explanation, NO markdown, NO extra text.

The TapTap Game Engine accepts quiz games in this exact TypeScript shape:
interface GameConfig {
  id: string           // kebab-case, unique
  title: string
  plugin: "quiz" | "flashcard"
  version: "1.0.0"
  description: string
  questions: Question[]
  adaptiveRules?: AdaptiveRule[]
  settings?: { timeLimit?: number, allowRetry?: boolean }
}

interface Question {
  id: string           // "q1", "q2", ...
  type: "mcq" | "true_false" | "fill_blank"
  prompt: string
  options?: string[]   // required for mcq (4 options), true_false (["True","False"])
  answer: string       // exact match from options, or fill_blank answer
  explanation: string  // why this answer is correct (shown after answering)
  difficulty: "easy" | "medium" | "hard"
  tags?: string[]
}

interface AdaptiveRule {
  condition: { metric: "accuracy", operator: "lt" | "gt", value: number }
  action: { type: "filter", difficulty: "easy" | "medium" | "hard" }
}
`

const FLASHCARD_SCHEMA = `
You are TapTap AI, an expert educational game designer. You must return ONLY valid JSON with NO explanation, NO markdown, NO extra text.

The TapTap flashcard plugin uses this exact shape:
{
  "id": "kebab-case-unique-id",
  "title": "string",
  "plugin": "flashcard",
  "version": "1.0.0",
  "description": "string",
  "questions": [
    {
      "id": "q1",
      "type": "true_false",
      "prompt": "Front of flashcard — the question or term",
      "options": ["True", "False"],
      "answer": "True",
      "explanation": "Explanation shown after flip",
      "difficulty": "medium",
      "tags": []
    }
  ]
}
All items must have type "true_false" with options ["True","False"] for the flip-card mechanic.
`

// ── POST /api/ai/generate/quiz ────────────────────────────────────────────────
router.post("/generate/quiz", requireAuth, async (req, res) => {
  const { topic, difficulty, questionCount, targetCompany, tags } = req.body ?? {}
  if (!topic) return res.status(400).json({ error: "topic is required." })

  const count   = Math.min(Number(questionCount ?? 10), 20)
  const diff    = difficulty ?? "medium"
  const company = targetCompany ? ` tailored for ${targetCompany} aptitude tests` : ""
  const tagStr  = tags?.length ? ` Focus areas: ${tags.join(", ")}.` : ""

  const userPrompt = `Create a quiz game about "${topic}"${company}.
- Exactly ${count} questions
- Difficulty mix: mostly ${diff} (60%), some easier (20%) and harder (20%)
- Include MCQ, true/false, and fill-blank types
- Each question must have a clear, educational explanation
- Generate a unique kebab-case id like "ai-${topic.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}"${tagStr}
Return ONLY the JSON game config.`

  try {
    const config       = await callGeminiJSON(GAME_SCHEMA, userPrompt)
    const tokensUsed   = Math.round(JSON.stringify(config).length / 4) // rough estimate

    // Save to ai_generations table
    const gen = await prisma.aiGeneration.create({
      data: {
        userId:     req.user.id,
        type:       "quiz",
        prompt:     userPrompt,
        result:     config,
        tokensUsed,
      },
    })

    res.json({ success: true, generationId: gen.id, config })
  } catch (err) {
    console.error("AI quiz generation error:", err)
    res.status(500).json({ error: "AI generation failed. Please try again.", detail: err.message })
  }
})

// ── POST /api/ai/generate/flashcard ──────────────────────────────────────────
router.post("/generate/flashcard", requireAuth, async (req, res) => {
  const { topic, cardCount, difficulty } = req.body ?? {}
  if (!topic) return res.status(400).json({ error: "topic is required." })

  const count = Math.min(Number(cardCount ?? 12), 24)

  const userPrompt = `Create a flashcard game for studying "${topic}".
- Exactly ${count} cards (each is a "true_false" type for the flip mechanic)
- Difficulty: ${difficulty ?? "medium"}
- Prompts should be on one side: definition, concept, or term
- Answer "True" means the statement is correct / the definition is accurate
- Answer "False" means the opposite / incorrect statement
- Each card must have a thorough explanation
- Generate unique kebab-case id
Return ONLY the JSON game config.`

  try {
    const config     = await callGeminiJSON(FLASHCARD_SCHEMA, userPrompt)
    const tokensUsed = Math.round(JSON.stringify(config).length / 4)

    const gen = await prisma.aiGeneration.create({
      data: {
        userId:     req.user.id,
        type:       "flashcard",
        prompt:     userPrompt,
        result:     config,
        tokensUsed,
      },
    })

    res.json({ success: true, generationId: gen.id, config })
  } catch (err) {
    console.error("AI flashcard generation error:", err)
    res.status(500).json({ error: "AI generation failed. Please try again.", detail: err.message })
  }
})

// ── POST /api/ai/generate/explanation ────────────────────────────────────────
// Explain a concept (shown in-game after wrong answer via Blackbuck AI)
router.post("/generate/explanation", requireAuth, async (req, res) => {
  const { concept, question, correctAnswer, studentAnswer, context } = req.body ?? {}
  if (!concept && !question)
    return res.status(400).json({ error: "concept or question is required." })

  const systemPrompt = `You are Blackbuck, a friendly and encouraging AI tutor for engineering students in India.
You explain concepts clearly, using relatable Indian examples (UPSC, competitive exams, college life).
Keep explanations concise (3-5 sentences), warm, and end with an encouraging line.
Return plain text (no JSON, no markdown formatting).`

  const questionContext = question ? `\nQuestion that was asked: "${question}"` : ""
  const answerContext   = correctAnswer ? `\nCorrect answer: ${correctAnswer}` : ""
  const wrongContext    = studentAnswer ? `\nStudent answered: ${studentAnswer}` : ""
  const extraCtx        = context ? `\nAdditional context: ${context}` : ""

  const userPrompt = `Explain the concept: "${concept ?? question}"${questionContext}${answerContext}${wrongContext}${extraCtx}
Help the student understand why the correct answer is right.`

  try {
    const explanation = await callGemini(systemPrompt, userPrompt)
    const tokensUsed  = Math.round((systemPrompt.length + userPrompt.length + explanation.length) / 4)

    const gen = await prisma.aiGeneration.create({
      data: {
        userId:     req.user.id,
        type:       "explanation",
        prompt:     userPrompt,
        result:     { explanation },
        tokensUsed,
      },
    })

    res.json({ success: true, generationId: gen.id, explanation })
  } catch (err) {
    console.error("AI explanation error:", err)
    res.status(500).json({ error: "Failed to generate explanation.", detail: err.message })
  }
})

// ── POST /api/ai/generate/report ──────────────────────────────────────────────
// Generate a personalised skill-gap report based on the user's skill progress
router.post("/generate/report", requireAuth, async (req, res) => {
  try {
    // Fetch user's skill progress
    const skills  = await prisma.userSkillProgress.findMany({ where: { userId: req.user.id } })
    const profile = await prisma.userProfile.findUnique({ where: { userId: req.user.id } })
    const user    = await prisma.user.findUnique({ where: { id: req.user.id } })

    const systemPrompt = `You are Blackbuck, an expert career counsellor for engineering students in India.
You analyse a student's game performance data and provide a structured, actionable skill-gap report.
Return ONLY valid JSON — no markdown, no extra text.`

    const skillSummary = skills.map(s =>
      `${s.skillArea}: Level ${s.level}/5, XP ${s.xp}, Accuracy ${s.accuracy}%, ${s.gamesPlayed} games`
    ).join("\n")

    const targetCompany = profile?.targetCompany ?? "top tech companies"
    const userPrompt    = `Generate a skill gap report for:
Student: ${user?.username ?? "Student"}
Target Company: ${targetCompany}
Campus Year: ${profile?.campusYear ?? "not specified"}
Branch: ${profile?.branch ?? "not specified"}

Skill Performance:
${skillSummary || "No games played yet"}

Return this exact JSON structure:
{
  "summary": "2-3 sentence overview of strengths and gaps",
  "strengths": ["skill area 1", "skill area 2"],
  "improvements": ["skill area 1", "skill area 2"],
  "recommendations": [
    { "skill": "skill_area", "action": "specific action to take", "games": ["game suggestions"] }
  ],
  "readiness": { "score": 0-100, "level": "Beginner|Developing|Ready|Strong", "message": "..." },
  "weeklyPlan": [
    { "day": "Monday", "focus": "...", "duration": "20 min" }
  ]
}`

    const report     = await callGeminiJSON(systemPrompt, userPrompt)
    const tokensUsed = Math.round(JSON.stringify(report).length / 4)

    const gen = await prisma.aiGeneration.create({
      data: {
        userId:     req.user.id,
        type:       "report",
        prompt:     userPrompt,
        result:     report,
        tokensUsed,
      },
    })

    res.json({ success: true, generationId: gen.id, report })
  } catch (err) {
    console.error("AI report generation error:", err)
    res.status(500).json({ error: "Failed to generate report.", detail: err.message })
  }
})

// ── POST /api/ai/generate/analysis ────────────────────────────────────────────
// Post-game session analysis (called right after finishing a game)
router.post("/generate/analysis", requireAuth, async (req, res) => {
  const { gameTitle, score, accuracy, timeTaken, difficulty, wrongAnswers, correctAnswers } = req.body ?? {}
  if (!gameTitle) return res.status(400).json({ error: "gameTitle is required." })

  const systemPrompt = `You are Blackbuck, a supportive AI tutor. Analyse a student's game performance and give brief, actionable feedback.
Return ONLY valid JSON — no markdown, no extra text.`

  const wrongList  = wrongAnswers?.slice(0, 5).map((w, i) => `${i + 1}. Q: ${w.question} — Wrong: ${w.answer} (Correct: ${w.correct})`).join("\n") ?? "none"
  const userPrompt = `Student just completed: "${gameTitle}"
Score: ${score}, Accuracy: ${accuracy}%, Time: ${timeTaken}s, Difficulty: ${difficulty}

Wrong answers (up to 5):
${wrongList}

Return this exact JSON:
{
  "grade": "A+|A|B|C|D",
  "feedback": "1-2 warm sentences about their performance",
  "mistakePatterns": ["pattern 1 if any", "pattern 2 if any"],
  "focusTip": "One specific tip to improve next time",
  "encouragement": "A motivating closing line"
}`

  try {
    const analysis   = await callGeminiJSON(systemPrompt, userPrompt)
    const tokensUsed = Math.round(JSON.stringify(analysis).length / 4)

    const gen = await prisma.aiGeneration.create({
      data: {
        userId:     req.user.id,
        type:       "analysis",
        prompt:     userPrompt,
        result:     analysis,
        tokensUsed,
      },
    })

    res.json({ success: true, generationId: gen.id, analysis })
  } catch (err) {
    console.error("AI analysis error:", err)
    res.status(500).json({ error: "Failed to generate analysis.", detail: err.message })
  }
})

// ── POST /api/ai/generate/lesson ──────────────────────────────────────────────
// Generate a structured lesson plan
router.post("/generate/lesson", requireAuth, async (req, res) => {
  const { topic, targetCompany, duration, level } = req.body ?? {}
  if (!topic) return res.status(400).json({ error: "topic is required." })

  const systemPrompt = `You are Blackbuck, a smart study planner for Indian engineering students.
Create structured lesson plans optimised for aptitude and placement preparation.
Return ONLY valid JSON — no markdown, no extra text.`

  const company    = targetCompany ? ` for ${targetCompany} placement` : ""
  const userPrompt = `Create a lesson plan for: "${topic}"${company}
Level: ${level ?? "beginner to intermediate"}
Study session: ${duration ?? "45 minutes"}

Return this exact JSON:
{
  "title": "lesson title",
  "overview": "1-2 sentence description",
  "objectives": ["objective 1", "objective 2", "objective 3"],
  "sections": [
    {
      "title": "section title",
      "duration": "X minutes",
      "content": "what to study / key concepts",
      "practiceType": "quiz|flashcard|practice problems",
      "tips": "exam tip for this section"
    }
  ],
  "keyFormulas": ["formula or rule 1 if applicable"],
  "commonMistakes": ["mistake to avoid 1", "mistake to avoid 2"],
  "practiceRecommendation": "which TapTap game type to play for this topic"
}`

  try {
    const lesson     = await callGeminiJSON(systemPrompt, userPrompt)
    const tokensUsed = Math.round(JSON.stringify(lesson).length / 4)

    const gen = await prisma.aiGeneration.create({
      data: {
        userId:     req.user.id,
        type:       "lesson",
        prompt:     userPrompt,
        result:     lesson,
        tokensUsed,
      },
    })

    res.json({ success: true, generationId: gen.id, lesson })
  } catch (err) {
    console.error("AI lesson generation error:", err)
    res.status(500).json({ error: "Failed to generate lesson.", detail: err.message })
  }
})

// ── POST /api/ai/mascot/chat ──────────────────────────────────────────────────
// Blackbuck AI companion — conversational chat endpoint
router.post("/mascot/chat", requireAuth, async (req, res) => {
  const { message, history, context } = req.body ?? {}
  if (!message) return res.status(400).json({ error: "message is required." })

  const systemPrompt = `You are Blackbuck, a friendly, witty, and knowledgeable AI study companion for engineering students in India.
You help with aptitude preparation, placement readiness, and concept clarification.
Personality: encouraging, slightly humorous, uses relatable Indian student references.
Keep responses concise (2-4 sentences) unless the student asks for detailed explanation.
Never say you are Google or Gemini — you are Blackbuck, the TapTap mascot.
${context ? `Current context: ${context}` : ""}`

  // Build conversation history string
  const historyText = (history ?? [])
    .slice(-6) // last 3 exchanges
    .map(m => `${m.role === "user" ? "Student" : "Blackbuck"}: ${m.text}`)
    .join("\n")

  const fullPrompt = historyText
    ? `Previous conversation:\n${historyText}\n\nStudent: ${message}`
    : `Student: ${message}`

  try {
    const reply      = await callGemini(systemPrompt, fullPrompt)
    const tokensUsed = Math.round((systemPrompt.length + fullPrompt.length + reply.length) / 4)

    // Store mascot chats as "explanation" type
    await prisma.aiGeneration.create({
      data: {
        userId:     req.user.id,
        type:       "explanation",
        prompt:     message,
        result:     { reply },
        tokensUsed,
      },
    })

    res.json({ success: true, reply })
  } catch (err) {
    console.error("AI mascot chat error:", err)
    res.status(500).json({ error: "Blackbuck is thinking too hard. Try again!", detail: err.message })
  }
})

// ── GET /api/ai/history ───────────────────────────────────────────────────────
router.get("/history", requireAuth, async (req, res) => {
  try {
    const type = req.query.type // optional filter: quiz|flashcard|report|...
    const gens = await prisma.aiGeneration.findMany({
      where: {
        userId: req.user.id,
        ...(type ? { type } : {}),
      },
      orderBy: { createdAt: "desc" },
      take:    50,
      select: {
        id:         true,
        type:       true,
        prompt:     true,
        tokensUsed: true,
        gameId:     true,
        createdAt:  true,
        // Don't return full result in the list — it can be huge
      },
    })

    res.json(gens)
  } catch (err) {
    console.error("GET /api/ai/history error:", err)
    res.status(500).json({ error: "Failed to load generation history." })
  }
})

// ── GET /api/ai/history/:id ───────────────────────────────────────────────────
router.get("/history/:id", requireAuth, async (req, res) => {
  try {
    const gen = await prisma.aiGeneration.findUnique({ where: { id: req.params.id } })
    if (!gen) return res.status(404).json({ error: "Generation not found." })
    if (gen.userId !== req.user.id) return res.status(403).json({ error: "Access denied." })
    res.json(gen)
  } catch (err) {
    console.error("GET /api/ai/history/:id error:", err)
    res.status(500).json({ error: "Failed to load generation." })
  }
})

module.exports = router
