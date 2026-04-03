/**
 * Skills Routes — UserSkillProgress endpoints
 *
 * GET  /api/skills              current user's full skill breakdown
 * GET  /api/skills/:skillArea   a single skill area's progress
 * GET  /api/skills/leaderboard  top users by total XP
 */
const express        = require("express")
const prisma         = require("../prisma/client")
const { requireAuth } = require("../middleware/auth")

const router = express.Router()

// All skill areas the engine tracks
const ALL_SKILL_AREAS = [
  "logical_reasoning",
  "algorithms",
  "vocabulary",
  "attention_to_detail",
  "numerical_ability",
  "pattern_recognition",
  "problem_solving",
  "verbal_ability",
  "memory",
  "focus",
  "general_knowledge",
]

// ── GET /api/skills ───────────────────────────────────────────────────────────
// Returns all skill areas for the current user.
// Areas with no progress yet are returned with level 1, xp 0.
router.get("/", requireAuth, async (req, res) => {
  try {
    const progress = await prisma.userSkillProgress.findMany({
      where:   { userId: req.user.id },
      orderBy: { skillArea: "asc" },
    })

    const progressMap = new Map(progress.map(p => [p.skillArea, p]))

    const result = ALL_SKILL_AREAS.map(area => {
      const p = progressMap.get(area)
      return {
        skillArea:   area,
        level:       p?.level ?? 1,
        xp:          p?.xp ?? 0,
        gamesPlayed: p?.gamesPlayed ?? 0,
        accuracy:    p ? Number(p.accuracy) : 0,
        updatedAt:   p?.updatedAt ?? null,
      }
    })

    // Also include any custom skill areas the user might have earned
    for (const p of progress) {
      if (!ALL_SKILL_AREAS.includes(p.skillArea)) {
        result.push({
          skillArea:   p.skillArea,
          level:       p.level,
          xp:          p.xp,
          gamesPlayed: p.gamesPlayed,
          accuracy:    Number(p.accuracy),
          updatedAt:   p.updatedAt,
        })
      }
    }

    // Calculate overall level (average of all areas with progress, rounded)
    const withProgress = result.filter(r => r.gamesPlayed > 0)
    const overallLevel = withProgress.length
      ? Math.round(withProgress.reduce((sum, r) => sum + r.level, 0) / withProgress.length)
      : 1
    const totalXp      = result.reduce((sum, r) => sum + r.xp, 0)
    const totalGames   = result.reduce((sum, r) => sum + r.gamesPlayed, 0)

    res.json({
      skills:      result,
      summary: {
        overallLevel,
        totalXp,
        totalGames,
        activeSkills: withProgress.length,
      },
    })
  } catch (err) {
    console.error("GET /api/skills error:", err)
    res.status(500).json({ error: "Failed to load skills." })
  }
})

// ── GET /api/skills/leaderboard ───────────────────────────────────────────────
// Top 20 users by total XP across all skill areas
router.get("/leaderboard", async (_req, res) => {
  try {
    // Sum XP per user
    const grouped = await prisma.userSkillProgress.groupBy({
      by:     ["userId"],
      _sum:   { xp: true },
      _avg:   { level: true },
      _count: { gamesPlayed: true },
      orderBy: { _sum: { xp: "desc" } },
      take:   20,
    })

    // Fetch usernames
    const userIds = grouped.map(g => g.userId)
    const users   = await prisma.user.findMany({
      where:   { id: { in: userIds } },
      include: { profile: true },
    })
    const userMap = new Map(users.map(u => [u.id, u]))

    const leaderboard = grouped.map((g, i) => {
      const user = userMap.get(g.userId)
      return {
        rank:         i + 1,
        userId:       g.userId,
        username:     user?.username ?? "Unknown",
        college:      user?.profile?.college ?? "",
        totalXp:      g._sum.xp ?? 0,
        avgLevel:     Math.round((g._avg.level ?? 1) * 10) / 10,
        gamesPlayed:  g._count.gamesPlayed ?? 0,
      }
    })

    res.json(leaderboard)
  } catch (err) {
    console.error("GET /api/skills/leaderboard error:", err)
    res.status(500).json({ error: "Failed to load skills leaderboard." })
  }
})

// ── GET /api/skills/:skillArea ────────────────────────────────────────────────
router.get("/:skillArea", requireAuth, async (req, res) => {
  const { skillArea } = req.params
  try {
    const progress = await prisma.userSkillProgress.findUnique({
      where: { userId_skillArea: { userId: req.user.id, skillArea } },
    })

    if (!progress) {
      return res.json({
        skillArea,
        level:       1,
        xp:          0,
        gamesPlayed: 0,
        accuracy:    0,
        updatedAt:   null,
      })
    }

    res.json({
      skillArea:   progress.skillArea,
      level:       progress.level,
      xp:          progress.xp,
      gamesPlayed: progress.gamesPlayed,
      accuracy:    Number(progress.accuracy),
      updatedAt:   progress.updatedAt,
    })
  } catch (err) {
    console.error("GET /api/skills/:skillArea error:", err)
    res.status(500).json({ error: "Failed to load skill progress." })
  }
})

module.exports = router
