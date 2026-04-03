/**
 * Auth Routes — backed by Supabase PostgreSQL via Prisma
 *
 * POST /api/auth/register
 * POST /api/auth/login
 * GET  /api/auth/me
 * PUT  /api/auth/profile   (update target company, branch, etc.)
 */
const express        = require("express")
const bcrypt         = require("bcryptjs")
const jwt            = require("jsonwebtoken")
const prisma         = require("../prisma/client")
const { requireAuth } = require("../middleware/auth")

const router     = express.Router()
const JWT_SECRET = process.env.JWT_SECRET || "taptap_engine_jwt_secret_2024_production"
const EXPIRY     = "7d"

function makeToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: EXPIRY }
  )
}

// ── POST /api/auth/register ──────────────────────────────────────────────────
router.post("/register", async (req, res) => {
  const { name, username, email, password, college, branch, targetCompany } = req.body ?? {}

  if (!email || !password || (!name && !username))
    return res.status(400).json({ error: "Name, email and password are required." })

  const finalUsername = (username || name).trim().replace(/\s+/g, "_").toLowerCase()

  try {
    const existingEmail    = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } })
    if (existingEmail) return res.status(409).json({ error: "This email is already registered." })

    const existingUsername = await prisma.user.findUnique({ where: { username: finalUsername } })
    if (existingUsername) return res.status(409).json({ error: "This username is already taken." })

    const passwordHash = await bcrypt.hash(password, 12)

    const user = await prisma.user.create({
      data: {
        email:        email.toLowerCase().trim(),
        username:     finalUsername,
        passwordHash,
        role:         "user",
        profile: {
          create: {
            college:       (college ?? "").trim() || null,
            branch:        (branch ?? "").trim() || null,
            targetCompany: (targetCompany ?? "").trim() || null,
          },
        },
      },
      include: { profile: true },
    })

    const token = makeToken(user)
    res.status(201).json({
      user:  { id: user.id, username: user.username, email: user.email, role: user.role, profile: user.profile },
      token,
    })
  } catch (err) {
    console.error("register error:", err)
    res.status(500).json({ error: "Server error during registration." })
  }
})

// ── POST /api/auth/login ─────────────────────────────────────────────────────
router.post("/login", async (req, res) => {
  const { email, password } = req.body ?? {}
  if (!email || !password)
    return res.status(400).json({ error: "Email and password are required." })

  try {
    const user = await prisma.user.findUnique({
      where:   { email: email.toLowerCase().trim() },
      include: { profile: true },
    })
    if (!user) return res.status(401).json({ error: "Invalid email or password." })

    const match = await bcrypt.compare(password, user.passwordHash)
    if (!match) return res.status(401).json({ error: "Invalid email or password." })

    const token = makeToken(user)
    res.json({
      user:  { id: user.id, username: user.username, email: user.email, role: user.role, profile: user.profile },
      token,
    })
  } catch (err) {
    console.error("login error:", err)
    res.status(500).json({ error: "Server error during login." })
  }
})

// ── GET /api/auth/me ─────────────────────────────────────────────────────────
router.get("/me", requireAuth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where:   { id: req.user.id },
      include: { profile: true },
    })
    if (!user) return res.status(404).json({ error: "User not found." })
    res.json({ id: user.id, username: user.username, email: user.email, role: user.role, profile: user.profile })
  } catch (err) {
    res.status(500).json({ error: "Server error." })
  }
})

// ── PUT /api/auth/profile ────────────────────────────────────────────────────
router.put("/profile", requireAuth, async (req, res) => {
  const { targetCompany, campusYear, branch, college } = req.body ?? {}
  try {
    const profile = await prisma.userProfile.upsert({
      where:  { userId: req.user.id },
      update: {
        ...(targetCompany !== undefined && { targetCompany }),
        ...(campusYear    !== undefined && { campusYear }),
        ...(branch        !== undefined && { branch }),
        ...(college       !== undefined && { college }),
      },
      create: {
        userId:        req.user.id,
        targetCompany: targetCompany ?? null,
        campusYear:    campusYear ?? null,
        branch:        branch ?? null,
        college:       college ?? null,
      },
    })
    res.json({ success: true, profile })
  } catch (err) {
    console.error("profile update error:", err)
    res.status(500).json({ error: "Server error updating profile." })
  }
})

module.exports = router
