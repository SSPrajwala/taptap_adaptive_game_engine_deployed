const express        = require("express")
const bcrypt         = require("bcryptjs")
const jwt            = require("jsonwebtoken")
const { randomUUID } = require("crypto")
const db             = require("../db")

const router     = express.Router()
const JWT_SECRET = process.env.JWT_SECRET || "taptap_engine_secret_2024"
const EXPIRY     = "7d"

function makeToken(user) {
  return jwt.sign({ id: user.id, name: user.name, email: user.email }, JWT_SECRET, { expiresIn: EXPIRY })
}

// ── POST /api/auth/register ──────────────────────────────────────────────────
router.post("/register", async (req, res) => {
  const { name, email, password, college } = req.body ?? {}
  if (!name || !email || !password)
    return res.status(400).json({ error: "Name, email and password are required." })

  if (db.findUserByEmail(email))
    return res.status(409).json({ error: "This email is already registered." })

  try {
    const passwordHash = await bcrypt.hash(password, 10)
    const user = db.createUser({
      id:           randomUUID(),
      name:         name.trim(),
      email:        email.toLowerCase().trim(),
      passwordHash,
      college:      (college ?? "").trim(),
      createdAt:    Date.now(),
    })
    const token = makeToken(user)
    res.status(201).json({
      user:  { id: user.id, name: user.name, email: user.email, college: user.college },
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

  const user = db.findUserByEmail(email)
  if (!user)
    return res.status(401).json({ error: "Invalid email or password." })

  try {
    const match = await bcrypt.compare(password, user.passwordHash)
    if (!match)
      return res.status(401).json({ error: "Invalid email or password." })

    const token = makeToken(user)
    res.json({
      user:  { id: user.id, name: user.name, email: user.email, college: user.college },
      token,
    })
  } catch (err) {
    console.error("login error:", err)
    res.status(500).json({ error: "Server error during login." })
  }
})

// ── GET /api/auth/me ─────────────────────────────────────────────────────────
router.get("/me", (req, res) => {
  const auth = req.headers.authorization
  if (!auth?.startsWith("Bearer "))
    return res.status(401).json({ error: "No token provided." })
  try {
    const payload = jwt.verify(auth.slice(7), JWT_SECRET)
    const user    = db.findUserById(payload.id)
    if (!user) return res.status(404).json({ error: "User not found." })
    res.json({ id: user.id, name: user.name, email: user.email, college: user.college })
  } catch {
    res.status(401).json({ error: "Invalid or expired token." })
  }
})

module.exports = router
