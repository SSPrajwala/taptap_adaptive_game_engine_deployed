/**
 * Games Routes — backed by Supabase PostgreSQL via Prisma
 *
 * GET  /api/games                 list games (public always + user's private if logged in)
 * GET  /api/games/:gameId         get one game config
 * POST /api/games                 create a new user-owned private game
 * PUT  /api/games/:gameId         update a user-owned game
 * DELETE /api/games/:gameId       delete a user-owned game
 */
const express                   = require("express")
const prisma                    = require("../prisma/client")
const { requireAuth, optionalAuth } = require("../middleware/auth")

const router = express.Router()

// ── GET /api/games ────────────────────────────────────────────────────────────
// Returns public games + the authenticated user's private games (if logged in)
router.get("/", optionalAuth, async (req, res) => {
  try {
    const where = req.user
      ? { OR: [{ visibility: "public" }, { createdBy: req.user.id }] }
      : { visibility: "public" }

    const games = await prisma.game.findMany({
      where,
      orderBy: { createdAt: "asc" },
      select: {
        id:              true,
        title:           true,
        description:     true,
        plugin:          true,
        version:         true,
        config:          true,
        visibility:      true,
        createdBy:       true,
        learningOutcomes: true,
        aptitudeTags:    true,
        isAiGenerated:   true,
        createdAt:       true,
      },
    })

    // Return the config field directly (it IS the full GameConfig JSON)
    // but annotate each with metadata fields from the row
    const result = games.map(g => ({
      ...(g.config ?? {}),
      id:              g.id,
      title:           g.title,
      description:     g.description ?? "",
      plugin:          g.plugin,
      version:         g.version,
      visibility:      g.visibility,
      createdBy:       g.createdBy ?? null,
      learningOutcomes: g.learningOutcomes,
      aptitudeTags:    g.aptitudeTags,
      isAiGenerated:   g.isAiGenerated,
    }))

    res.json(result)
  } catch (err) {
    console.error("GET /api/games error:", err)
    res.status(500).json({ error: "Failed to load games." })
  }
})

// ── GET /api/games/:gameId ────────────────────────────────────────────────────
router.get("/:gameId", optionalAuth, async (req, res) => {
  try {
    const game = await prisma.game.findUnique({ where: { id: req.params.gameId } })
    if (!game) return res.status(404).json({ error: "Game not found." })

    // Private games: only visible to creator
    if (game.visibility === "private" && game.createdBy !== req.user?.id) {
      return res.status(403).json({ error: "This game is private." })
    }

    res.json({
      ...(game.config ?? {}),
      id:              game.id,
      title:           game.title,
      description:     game.description ?? "",
      plugin:          game.plugin,
      version:         game.version,
      visibility:      game.visibility,
      createdBy:       game.createdBy ?? null,
      learningOutcomes: game.learningOutcomes,
      aptitudeTags:    game.aptitudeTags,
      isAiGenerated:   game.isAiGenerated,
    })
  } catch (err) {
    console.error("GET /api/games/:gameId error:", err)
    res.status(500).json({ error: "Failed to load game." })
  }
})

// ── POST /api/games ───────────────────────────────────────────────────────────
// Create a user-owned private game (AI-generated or manually created)
router.post("/", requireAuth, async (req, res) => {
  const { id, title, description, plugin, version, config, learningOutcomes, aptitudeTags, isAiGenerated } = req.body ?? {}

  if (!id || !title || !plugin || !config)
    return res.status(400).json({ error: "id, title, plugin, and config are required." })

  try {
    // Prevent overwriting system/public games
    const existing = await prisma.game.findUnique({ where: { id } })
    if (existing) return res.status(409).json({ error: "A game with this ID already exists." })

    const game = await prisma.game.create({
      data: {
        id,
        title,
        description:     description ?? "",
        plugin,
        version:         version ?? "1.0.0",
        config,
        visibility:      "private",
        createdBy:       req.user.id,
        learningOutcomes: learningOutcomes ?? [],
        aptitudeTags:    aptitudeTags ?? [],
        isAiGenerated:   isAiGenerated ?? false,
      },
    })

    res.status(201).json({ success: true, game })
  } catch (err) {
    console.error("POST /api/games error:", err)
    res.status(500).json({ error: "Failed to create game." })
  }
})

// ── PUT /api/games/:gameId ────────────────────────────────────────────────────
// Update a user-owned game (only the creator can update)
router.put("/:gameId", requireAuth, async (req, res) => {
  const { gameId } = req.params
  try {
    const game = await prisma.game.findUnique({ where: { id: gameId } })
    if (!game) return res.status(404).json({ error: "Game not found." })
    if (game.createdBy !== req.user.id) return res.status(403).json({ error: "Only the creator can update this game." })

    const { title, description, plugin, version, config, learningOutcomes, aptitudeTags } = req.body ?? {}

    const updated = await prisma.game.update({
      where: { id: gameId },
      data: {
        ...(title            !== undefined && { title }),
        ...(description      !== undefined && { description }),
        ...(plugin           !== undefined && { plugin }),
        ...(version          !== undefined && { version }),
        ...(config           !== undefined && { config }),
        ...(learningOutcomes !== undefined && { learningOutcomes }),
        ...(aptitudeTags     !== undefined && { aptitudeTags }),
        updatedAt: new Date(),
      },
    })

    res.json({ success: true, game: updated })
  } catch (err) {
    console.error("PUT /api/games/:gameId error:", err)
    res.status(500).json({ error: "Failed to update game." })
  }
})

// ── DELETE /api/games/:gameId ─────────────────────────────────────────────────
// Delete a user-owned game (only creator can delete; admin games are protected)
router.delete("/:gameId", requireAuth, async (req, res) => {
  const { gameId } = req.params
  try {
    const game = await prisma.game.findUnique({ where: { id: gameId } })
    if (!game) return res.status(404).json({ error: "Game not found." })
    if (game.createdBy !== req.user.id) return res.status(403).json({ error: "Only the creator can delete this game." })

    await prisma.game.delete({ where: { id: gameId } })
    res.json({ success: true, message: "Game deleted." })
  } catch (err) {
    console.error("DELETE /api/games/:gameId error:", err)
    res.status(500).json({ error: "Failed to delete game." })
  }
})

module.exports = router
