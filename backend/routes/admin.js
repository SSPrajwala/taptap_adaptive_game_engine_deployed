/**
 * Admin Routes
 * ─────────────────────────────────────────────────────────────────────────────
 * POST /api/admin/login             verify name + accessCode → admin JWT
 * GET  /api/admin/me                check token validity
 * GET  /api/admin/games             list all game IDs and titles
 * GET  /api/admin/games/:gameId     read one game config from JSON file
 * PUT  /api/admin/games/:gameId     write changes directly to JSON file
 * GET  /api/admin/stats             full DB stats (for judges demo)
 */

const express        = require("express")
const jwt            = require("jsonwebtoken")
const db             = require("../db")

const router       = express.Router()
const ADMIN_SECRET = process.env.ADMIN_SECRET || "taptap_admin_secret_2024"
const ADMIN_EXPIRY = "8h"

// ── Admin auth middleware ─────────────────────────────────────────────────────

function requireAdmin(req, res, next) {
  const auth = req.headers.authorization
  if (!auth?.startsWith("Bearer ")) return res.status(401).json({ error: "Admin token required." })
  try {
    const payload = jwt.verify(auth.slice(7), ADMIN_SECRET)
    if (payload.role !== "admin") throw new Error("not admin")
    req.admin = payload
    next()
  } catch {
    res.status(401).json({ error: "Invalid or expired admin token. Please log in again." })
  }
}

// ── POST /api/admin/login ─────────────────────────────────────────────────────
// Body: { adminName: string, accessCode: string }
router.post("/login", (req, res) => {
  const { adminName, accessCode } = req.body ?? {}
  if (!adminName || !accessCode)
    return res.status(400).json({ error: "Admin name and access code are both required." })

  const admin = db.findAdminByNameAndCode(adminName, accessCode)
  if (!admin)
    return res.status(403).json({ error: "Admin name or access code is incorrect." })

  const token = jwt.sign(
    { id: admin.id, name: admin.name, role: "admin" },
    ADMIN_SECRET,
    { expiresIn: ADMIN_EXPIRY }
  )
  res.json({ admin: { id: admin.id, name: admin.name }, token })
})

// ── GET /api/admin/me ─────────────────────────────────────────────────────────
router.get("/me", requireAdmin, (req, res) => {
  res.json({ id: req.admin.id, name: req.admin.name, role: "admin" })
})

// ── GET /api/admin/games ──────────────────────────────────────────────────────
// Returns list of game IDs + titles (reads each file)
router.get("/games", requireAdmin, (_req, res) => {
  const ids = db.listGameIds()
  const list = []
  for (const id of ids) {
    try {
      const config = db.readGameFile(id)
      list.push({ id: config.id, title: config.title, plugin: config.plugin, questionCount: config.questions.length })
    } catch (e) {
      list.push({ id, title: id, error: String(e) })
    }
  }
  res.json(list)
})

// ── GET /api/admin/games/:gameId ──────────────────────────────────────────────
// Returns the full game config from JSON file
router.get("/games/:gameId", requireAdmin, (req, res) => {
  try {
    const config = db.readGameFile(req.params.gameId)
    res.json(config)
  } catch (e) {
    res.status(404).json({ error: String(e) })
  }
})

// ── PUT /api/admin/games/:gameId ──────────────────────────────────────────────
// Writes the updated game config directly to the JSON file.
// This is the SAVE operation — changes persist permanently in the source file.
router.put("/games/:gameId", requireAdmin, (req, res) => {
  const { gameId } = req.params
  const updatedConfig = req.body

  if (!updatedConfig?.id)
    return res.status(400).json({ error: "Game config must include an id field." })
  if (updatedConfig.id !== gameId)
    return res.status(400).json({ error: `ID mismatch: URL says "${gameId}", body says "${updatedConfig.id}".` })

  try {
    // Strip internal metadata before saving
    const { _savedAt, ...cleanConfig } = updatedConfig
    void _savedAt
    db.writeGameFile(gameId, cleanConfig)
    console.log(`[Admin] ${req.admin.name} saved game: ${gameId} (${cleanConfig.questions.length} questions)`)
    res.json({ success: true, gameId, savedBy: req.admin.name, questionCount: cleanConfig.questions.length })
  } catch (e) {
    res.status(500).json({ error: String(e) })
  }
})

// ── GET /api/admin/stats ──────────────────────────────────────────────────────
// Full database summary — great to show judges
router.get("/stats", requireAdmin, (_req, res) => {
  const dbData = db.read()
  const games  = []
  for (const id of db.listGameIds()) {
    try {
      const cfg = db.readGameFile(id)
      games.push({ id: cfg.id, title: cfg.title, plugin: cfg.plugin, questions: cfg.questions.length })
    } catch { /* skip unreadable */ }
  }

  res.json({
    database: {
      users:        dbData.users.length,
      scores:       dbData.scores.length,
      admins:       dbData.admins.length,
    },
    games,
    topScores:    dbData.scores.slice(0, 5),
    recentUsers:  dbData.users.slice(-5).map(u => ({
      id:       u.id,
      name:     u.name,
      email:    u.email,
      college:  u.college,
      joinedAt: u.createdAt,
    })),
    adminAccounts: dbData.admins.map(({ id, name }) => ({ id, name })),
  })
})

module.exports = router
