/**
 * SkillRadar — SVG hexagonal radar chart for skill levels
 * Shows 6 core aptitude skills as a filled hexagon.
 * Also shows a compact SkillBadge for individual skills.
 */
import React, { useEffect, useState } from "react"
import { SkillService, SKILL_LABELS, SKILL_EMOJIS } from "../../services/SkillService"
import type { SkillProgress } from "../../services/SkillService"
import { useAuth } from "../../context/AuthContext"

// ── SkillBadge — tiny level indicator used on game cards ─────────────────────

interface BadgeProps {
  skillArea: string
  level:     number
  size?:     "sm" | "md"
}

export const SkillBadge: React.FC<BadgeProps> = ({ skillArea, level, size = "sm" }) => {
  const color = SkillService.levelColor(level)
  const emoji = SKILL_EMOJIS[skillArea] ?? "⭐"
  const isSm  = size === "sm"

  return (
    <span style={{
      display:        "inline-flex",
      alignItems:     "center",
      gap:            "4px",
      background:     "rgba(255,255,255,0.07)",
      borderRadius:   "20px",
      padding:        isSm ? "2px 8px" : "4px 12px",
      fontSize:       isSm ? "0.68rem" : "0.78rem",
      fontFamily:     "Orbitron, monospace",
      fontWeight:     700,
      border:         "1px solid rgba(255,255,255,0.1)",
    }}>
      <span>{emoji}</span>
      <span style={{ color: "#rgba(255,255,255,0.75)" }}>{SKILL_LABELS[skillArea] ?? skillArea}</span>
      <span style={{ color: color.replace("text-", "") === color ? "#00D4FF" : undefined, fontWeight: 900 }}>
        L{level}
      </span>
    </span>
  )
}

// ── SkillRadar — full radar chart ─────────────────────────────────────────────

const RADAR_SKILLS = [
  "logical_reasoning",
  "algorithms",
  "numerical_ability",
  "attention_to_detail",
  "vocabulary",
  "pattern_recognition",
]

interface RadarProps {
  skills?: SkillProgress[]  // if not provided, loads from API
  size?:   number
  showLabels?: boolean
}

export const SkillRadar: React.FC<RadarProps> = ({ skills: propSkills, size = 280, showLabels = true }) => {
  const { token, isLoggedIn } = useAuth()
  const [skills, setSkills] = useState<SkillProgress[]>(propSkills ?? [])
  const [loading, setLoading] = useState(!propSkills && isLoggedIn)

  useEffect(() => {
    if (propSkills) { setSkills(propSkills); return }
    if (!token) return
    setLoading(true)
    SkillService.getMySkills(token)
      .then(data => setSkills(data.skills))
      .catch(() => {/* silently fail */})
      .finally(() => setLoading(false))
  }, [propSkills, token])

  if (loading) {
    return (
      <div style={{ width: size, height: size, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.8rem" }}>Loading skills...</div>
      </div>
    )
  }

  const cx = size / 2
  const cy = size / 2
  const maxR = size * 0.36  // radius at level 5
  const n    = RADAR_SKILLS.length

  // Get level for each skill in radar order
  const levels = RADAR_SKILLS.map(area => {
    const s = skills.find(sk => sk.skillArea === area)
    return s?.level ?? 1
  })

  // Calculate polygon point for (skill index, level)
  function point(i: number, level: number) {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2
    const r     = (level / 5) * maxR
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    }
  }

  // Background grid rings (levels 1-5)
  function gridRing(level: number) {
    const pts = Array.from({ length: n }, (_, i) => point(i, level))
    return pts.map(p => `${p.x},${p.y}`).join(" ")
  }

  // Data polygon
  const dataPoints = levels.map((l, i) => point(i, l))
  const dataPolygon = dataPoints.map(p => `${p.x},${p.y}`).join(" ")

  // Label positions (slightly outside max ring)
  const labelPts = RADAR_SKILLS.map((_, i) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2
    const r     = maxR + (showLabels ? 28 : 8)
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) }
  })

  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Grid rings */}
        {[1, 2, 3, 4, 5].map(l => (
          <polygon
            key={l}
            points={gridRing(l)}
            fill={l === 5 ? "rgba(0,212,255,0.04)" : "none"}
            stroke={l === 5 ? "rgba(0,212,255,0.3)" : "rgba(255,255,255,0.06)"}
            strokeWidth={l === 5 ? 1.5 : 1}
          />
        ))}

        {/* Axis lines */}
        {RADAR_SKILLS.map((_, i) => {
          const outer = point(i, 5)
          return <line key={i} x1={cx} y1={cy} x2={outer.x} y2={outer.y} stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
        })}

        {/* Data polygon */}
        <polygon
          points={dataPolygon}
          fill="rgba(0,212,255,0.18)"
          stroke="#00D4FF"
          strokeWidth="2"
          strokeLinejoin="round"
        />

        {/* Level dots */}
        {dataPoints.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="5" fill="#00D4FF" stroke="#0A1628" strokeWidth="2" />
        ))}

        {/* Skill labels */}
        {showLabels && labelPts.map((p, i) => {
          const skill = RADAR_SKILLS[i]
          const level = levels[i]
          const emoji = SKILL_EMOJIS[skill] ?? "⭐"
          const lbl   = (SKILL_LABELS[skill] ?? skill).split(" ").slice(0, 2).join(" ")

          return (
            <g key={i}>
              <text
                x={p.x} y={p.y - 8}
                textAnchor="middle"
                fontSize="10"
                fontFamily="Orbitron, sans-serif"
                fontWeight="700"
                fill="rgba(255,255,255,0.55)"
              >
                {emoji} L{level}
              </text>
              <text
                x={p.x} y={p.y + 4}
                textAnchor="middle"
                fontSize="8.5"
                fontFamily="sans-serif"
                fill="rgba(255,255,255,0.35)"
              >
                {lbl}
              </text>
            </g>
          )
        })}

        {/* Center label */}
        <text x={cx} y={cy + 4} textAnchor="middle" fontSize="11" fontFamily="Orbitron, monospace" fontWeight="900" fill="rgba(0,212,255,0.6)">
          SKILLS
        </text>
      </svg>
    </div>
  )
}

// ── SkillProgressBar — single skill with XP bar ───────────────────────────────

interface BarProps {
  skill: SkillProgress
}

export const SkillProgressBar: React.FC<BarProps> = ({ skill }) => {
  const pct   = SkillService.xpProgress(skill.level, skill.xp)
  const color = getLevelHex(skill.level)
  const label = SkillService.levelLabel(skill.level)
  const emoji = SKILL_EMOJIS[skill.skillArea] ?? "⭐"

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ color: "rgba(255,255,255,0.8)", fontSize: "0.8rem" }}>
          {emoji} {SKILL_LABELS[skill.skillArea] ?? skill.skillArea}
        </span>
        <span style={{
          color, fontFamily: "Orbitron, monospace", fontSize: "0.7rem", fontWeight: 800,
        }}>
          {label.toUpperCase()} · L{skill.level}
        </span>
      </div>
      <div style={{
        height: 6, borderRadius: 99, background: "rgba(255,255,255,0.08)",
        overflow: "hidden",
      }}>
        <div style={{
          height: "100%", width: `${pct}%`,
          background: `linear-gradient(90deg, ${color}AA, ${color})`,
          borderRadius: 99,
          transition: "width 0.6s ease",
        }} />
      </div>
      {skill.level < 5 && (
        <div style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.68rem", textAlign: "right" }}>
          {skill.xp} / {SkillService.xpToNext(skill.level)} XP
        </div>
      )}
    </div>
  )
}

function getLevelHex(level: number): string {
  if (level >= 5) return "#FFD700"
  if (level >= 4) return "#C084FC"
  if (level >= 3) return "#60A5FA"
  if (level >= 2) return "#4ADE80"
  return "#9CA3AF"
}
