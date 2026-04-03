/**
 * seed.js — Populates Supabase with existing games + default admin
 * Run: node prisma/seed.js
 */
require("dotenv").config({ path: require("path").join(__dirname, "../.env") })
const { PrismaClient } = require("@prisma/client")
const fs   = require("fs")
const path = require("path")

const prisma = new PrismaClient()

// ── Game files to seed ────────────────────────────────────────────────────────
const GAMES_DIR = path.join(__dirname, "../../frontend/src/games")

const GAME_FILES = [
  { file: "logic-game.json",      outcomes: ["logical_reasoning","problem_solving"],        tags: ["TCS_NQT","Infosys","Wipro"] },
  { file: "world-capitals.json",  outcomes: ["vocabulary","general_knowledge"],              tags: ["general"] },
  { file: "emoji-memory.json",    outcomes: ["attention_to_detail","memory"],                tags: ["general"] },
  { file: "pattern-puzzle.json",  outcomes: ["pattern_recognition","numerical_ability"],     tags: ["TCS_NQT","Accenture"] },
  { file: "sudoku.json",          outcomes: ["logical_reasoning","attention_to_detail"],     tags: ["Infosys"] },
  { file: "wordbuilder.json",     outcomes: ["vocabulary","verbal_ability"],                 tags: ["Wipro","general"] },
  { file: "tapblitz.json",        outcomes: ["focus","attention_to_detail","algorithms"],    tags: ["general"] },
  { file: "binaryrunner.json",    outcomes: ["algorithms","logical_reasoning","focus"],      tags: ["TCS_NQT","Infosys","Wipro","Accenture"] },
]

async function main() {
  console.log("🌱 Seeding TapTap database...\n")

  // ── Seed admin ──────────────────────────────────────────────────────────────
  await prisma.admin.upsert({
    where:  { name: "Engine Owner" },
    update: {},
    create: {
      name:       "Engine Owner",
      accessCode: "TAPTAP-ADMIN-2024",
    },
  })
  console.log("✅ Admin seeded")

  // ── Seed games ──────────────────────────────────────────────────────────────
  let seeded = 0
  for (const { file, outcomes, tags } of GAME_FILES) {
    const filePath = path.join(GAMES_DIR, file)
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  Skipping ${file} — file not found`)
      continue
    }
    try {
      const config = JSON.parse(fs.readFileSync(filePath, "utf8"))
      await prisma.game.upsert({
        where:  { id: config.id },
        update: {
          title:           config.title,
          description:     config.description ?? "",
          plugin:          config.plugin,
          version:         config.version ?? "1.0.0",
          config:          config,
          learningOutcomes: outcomes,
          aptitudeTags:    tags,
          updatedAt:       new Date(),
        },
        create: {
          id:              config.id,
          title:           config.title,
          description:     config.description ?? "",
          plugin:          config.plugin,
          version:         config.version ?? "1.0.0",
          config:          config,
          visibility:      "public",
          createdBy:       null,
          learningOutcomes: outcomes,
          aptitudeTags:    tags,
          isAiGenerated:   false,
        },
      })
      console.log(`✅ Game seeded: ${config.title} (${config.id})`)
      seeded++
    } catch (e) {
      console.error(`❌ Failed to seed ${file}:`, e.message)
    }
  }

  console.log(`\n🎮 ${seeded} games seeded into Supabase`)
  console.log("✨ Database ready!\n")
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
