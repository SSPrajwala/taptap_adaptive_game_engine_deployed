/**
 * Leaderboard Routes — backed by Supabase PostgreSQL via Prisma
 *
 * GET  /api/leaderboard            global top 50 sessions
 * GET  /api/leaderboard/:gameId    top 10 for a specific game
 * POST /api/leaderboard/submit     save a completed game session + update skill progress
 * DELETE /api/leaderboard/clear    admin-only: clear all sessions
 */
const express                   = require("express")
const prisma                    = require("../prisma/client")
const { optionalAuth, requireAuth } = require("../middleware/auth")

const router = express.Router()

// ── Skill XP constants ────────────────────────────────────────────────────────
// XP per level threshold:  L1→L2 needs 100 XP,  L2→L3 needs 200 XP, etc.
const XP_PER_LEVEL = [0, 100, 200, 350, 500]  // index = current level (1-based)

function calcXpGain(score, accuracy, difficulty) {
  const diffMult = difficulty === "hard" ? 1.5 : difficulty === "easy" ? 0.7 : 1.0
  const base     = Math.round((score / 10) * (Number(accuracy) / 100) * diffMult)
  return Math.max(5, Math.min(base, 50)) // 5–50 XP per session
}

function nextLevel(current, xp) {
  if (current >= 5) return { level: 5, xp }
  const needed = XP_PER_LEVEL[current] // XP needed to advance from this level
  if (xp >= needed) return { level: current + 1, xp: xp - needed }
  return { level: current, xp }
}

// ── GET /api/leaderboard ──────────────────────────────────────────────────────
router.get("/", async (_req, res) => {
  try {
    const sessions = await prisma.gameSession.findMany({
      where:   { completed: true },
      orderBy: [{ score: "desc" }, { timeTaken: "asc" }],
      take:    50,
    })

    res.json(sessions.map(s => ({
      id:          s.id,
      playerName:  s.playerName ?? "Anonymous",
      gameId:      s.gameId,
      gameTitle:   s.gameTitle ?? s.gameId,
      score:       s.score,
      accuracy:    Number(s.accuracy),
      timeTaken:   s.timeTaken,
      difficulty:  s.difficulty ?? "medium",
      college:     s.college ?? "",
      timestamp:   s.createdAt.getTime(),
    })))
  } catch (err) {
    console.error("GET /api/leaderboard error:", err)
    res.status(500).json({ error: "Failed to load leaderboard." })
  }
})

// ── GET /api/leaderboard/:gameId ──────────────────────────────────────────────
router.get("/:gameId", async (req, res) => {
  try {
    const sessions = await prisma.gameSession.findMany({
      where:   { gameId: req.params.gameId, completed: true },
      orderBy: [{ score: "desc" }, { timeTaken: "asc" }],
      take:    10,
    })

    res.json(sessions.map(s => ({
      id:          s.id,
      playerName:  s.playerName ?? "Anonymous",
      gameId:      s.gameId,
      gameTitle:   s.gameTitle ?? s.gameId,
      score:       s.score,
      accuracy:    Number(s.accuracy),
      timeTaken:   s.timeTaken,
      difficulty:  s.difficulty ?? "medium",
      college:     s.college ?? "",
      timestamp:   s.createdAt.getTime(),
    })))
  } catch (err) {
    console.error("GET /api/leaderboard/:gameId error:", err)
    res.status(500).json({ error: "Failed to load game leaderboard." })
  }
})

// ── POST /api/leaderboard/submit ──────────────────────────────────────────────
router.post("/submit", optionalAuth, async (req, res) => {
  const {
    playerName, gameId, gameTitle,
    score, accuracy, timeTaken,
    totalAnswered, correctCount,
    difficulty, learningOutcomes,
  } = req.body ?? {}

  if (!playerName || !gameId || score == null)
    return res.status(400).json({ error: "playerName, gameId, and score are required." })

  try {
    // Fetch player's college if authenticated
    let college = ""
    if (req.user?.id) {
      const profile = await prisma.userProfile.findUnique({ where: { userId: req.user.id } })
      college = profile?.college ?? ""
    }

    // Save game session
    const session = await prisma.gameSession.create({
      data: {
        userId:       req.user?.id ?? null,
        gameId:       String(gameId),
        score:        Number(score),
        accuracy:     Number(accuracy ?? 0),
        totalAnswered: Number(totalAnswered ?? 0),
        correctCount:  Number(correctCount ?? 0),
        timeTaken:    Number(timeTaken ?? 0),
        difficulty:   String(difficulty ?? "medium"),
        completed:    true,
        playerName:   String(playerName),
        college,
        gameTitle:    String(gameTitle ?? gameId),
      },
    })

    // Update skill progress if user is logged in + game has learning outcomes
    if (req.user?.id && Array.isArray(learningOutcomes) && learningOutcomes.length > 0) {
      const xpGain = calcXpGain(Number(score), Number(accuracy ?? 0), String(difficulty ?? "medium"))

      for (const skillArea of learningOutcomes) {
        const existing = await prisma.userSkillProgress.findUnique({
          where: { userId_skillArea: { userId: req.user.id, skillArea } },
        })

        const currentLevel = existing?.level ?? 1
        const currentXp    = (existing?.xp ?? 0) + xpGain
        const { level: newLevel, xp: newXp } = nextLevel(currentLevel, currentXp)

        const newAccuracy = existing
          ? ((Number(existing.accuracy) * existing.gamesPlayed) + Number(accuracy ?? 0)) / (existing.gamesPlayed + 1)
          : Number(accuracy ?? 0)

        await prisma.userSkillProgress.upsert({
          where:  { userId_skillArea: { userId: req.user.id, skillArea } },
          update: {
            level:       newLevel,
            xp:          newXp,
            gamesPlayed: { increment: 1 },
            accuracy:    Math.round(newAccuracy * 100) / 100,
          },
          create: {
            userId:      req.user.id,
            skillArea,
            level:       newLevel,
            xp:          newXp,
            gamesPlayed: 1,
            accuracy:    Number(accuracy ?? 0),
          },
        })
      }
    }

    // Calculate rank among completed sessions for this game
    const rank = await prisma.gameSession.count({
      where: {
        gameId:    String(gameId),
        completed: true,
        OR: [
          { score: { gt: Number(score) } },
          { score: Number(score), timeTaken: { lt: Number(timeTaken ?? 0) } },
        ],
      },
    })

    res.status(201).json({
      success: true,
      session: {
        id:          session.id,
        playerName:  session.playerName,
        gameId:      session.gameId,
        gameTitle:   session.gameTitle,
        score:       session.score,
        accuracy:    Number(session.accuracy),
        timeTaken:   session.timeTaken,
        difficulty:  session.difficulty,
        college:     session.college,
        timestamp:   session.createdAt.getTime(),
      },
      rank: rank + 1,
    })
  } catch (err) {
    console.error("POST /api/leaderboard/submit error:", err)
    res.status(500).json({ error: "Failed to save score." })
  }
})

// ── DELETE /api/leaderboard/clear ─────────────────────────────────────────────
// Admin-only: verifies admin credentials, then deletes all game sessions
router.delete("/clear", async (req, res) => {
  const { adminName, accessCode } = req.body ?? {}
  if (!adminName || !accessCode)
    return res.status(400).json({ error: "adminName and accessCode are required." })

  try {
    const admin = await prisma.admin.findFirst({
      where: { name: adminName, accessCode },
    })
    if (!admin) return res.status(403).json({ error: "Admin name or access code is incorrect." })

    const { count } = await prisma.gameSession.deleteMany({})
    console.log(`[Leaderboard] ALL ${count} sessions cleared by admin: ${admin.name}`)
    res.json({ success: true, message: `Cleared ${count} sessions.`, clearedBy: admin.name })
  } catch (err) {
    console.error("DELETE /api/leaderboard/clear error:", err)
    res.status(500).json({ error: "Failed to clear leaderboard." })
  }
})

module.exports = router
