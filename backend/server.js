/**
 * TapTap Adaptive Game Engine – Backend Server
 * ─────────────────────────────────────────────
 * Stack : Express · bcryptjs · jsonwebtoken · JSON file DB (no native deps)
 * Run   : node server.js  (or: npm run dev with nodemon)
 * Port  : 3001 (configurable via PORT env var)
 */

const express           = require("express")
const cors              = require("cors")
const authRoutes        = require("./routes/auth")
const leaderboardRoutes = require("./routes/leaderboard")
const adminRoutes       = require("./routes/admin")
const gamesRoutes       = require("./routes/games")

const app  = express()
const PORT = process.env.PORT ?? 3001

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({
  origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
  credentials: true,
}))
app.use(express.json({ limit: "10mb" }))  // 10mb for large game configs

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/api/auth",        authRoutes)
app.use("/api/leaderboard", leaderboardRoutes)
app.use("/api/admin",       adminRoutes)
app.use("/api/games",       gamesRoutes)

app.get("/api/health", (_req, res) =>
  res.json({ status: "ok", engine: "TapTap Backend v1.0", timestamp: Date.now() })
)

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ error: "Not found" }))

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🎮  TapTap Backend running at http://localhost:${PORT}`)
  console.log(`    Health     →  GET  /api/health`)
  console.log(`    Auth       →  POST /api/auth/register  |  POST /api/auth/login`)
  console.log(`    Scores     →  GET  /api/leaderboard    |  POST /api/leaderboard/submit`)
  console.log(`    Games      →  GET  /api/games`)
  console.log(`    Admin      →  POST /api/admin/login    (name: "Engine Owner"  code: TAPTAP-ADMIN-2024)`)
  console.log(`    Admin DB   →  GET  /api/admin/stats    (admin token required)\n`)
})
