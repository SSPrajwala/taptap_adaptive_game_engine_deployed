/**
 * Public Games Route
 * GET /api/games  — returns all game configs from JSON files (no auth required)
 * This lets the frontend always load the latest admin-saved versions.
 */
const express = require("express")
const db      = require("../db")
const router  = express.Router()

router.get("/", (_req, res) => {
  const configs = []
  for (const id of db.listGameIds()) {
    try {
      configs.push(db.readGameFile(id))
    } catch { /* skip if file missing */ }
  }
  res.json(configs)
})

module.exports = router
