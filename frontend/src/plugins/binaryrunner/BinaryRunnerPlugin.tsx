// ─────────────────────────────────────────────────────────────────────────────
// BinaryRunnerPlugin.tsx  —  "Binary Runner"
//
// 3-lane endless runner. You are a "Data Packet" blasting through a CPU.
// Binary/logic-gate challenges appear as obstacles: you must be in the correct
// lane (0 or 1) before the obstacle reaches you.
//
// Each JSON "question" = one run stage with configurable speed & challenge set.
// The plugin manages its own 60fps canvas loop (requestAnimationFrame).
// ─────────────────────────────────────────────────────────────────────────────

/* eslint-disable react-refresh/only-export-components */
import React, { useRef, useEffect, useCallback, useState } from "react"
import type {
  GamePlugin,
  PluginRenderProps,
  BinaryRunnerQuestion,
  Question,
  AnswerResult,
} from "../../types/engine.types"

// ── Internal types ────────────────────────────────────────────────────────────

interface Challenge {
  id:       number
  z:        number      // depth position — starts at FAR_Z, shrinks to NEAR_Z
  label:    string      // e.g.  "1 OR 0 = ?"
  answer:   0 | 1      // correct lane index: 0 (left) or 1 (right)
  answered: boolean
  hitTime:  number
  correct:  boolean | null
}

interface Particle {
  x: number; y: number
  vx: number; vy: number
  life: number; color: string; r: number
}

// ── Constants ─────────────────────────────────────────────────────────────────

const W = 800, H = 500

// 3D perspective: z goes from FAR_Z (far) to 0 (at camera)
const FAR_Z  = 220
const NEAR_Z = 0
// Two lanes: left = 0, right = 1  (centre gap is the road divider)
const LANE_X = [W * 0.28, W * 0.72]   // screen X of each lane centre at horizon
const LANE_X_NEAR = [W * 0.18, W * 0.82] // screen X spread at screen bottom

const HORIZON_Y = H * 0.36
const FLOOR_Y   = H * 0.96

const OBSTACLE_COLORS = [
  { fill: "#FF2D78", border: "#FFB3CC", glow: "#FF2D78" },  // red  — wrong lane
  { fill: "#22FFAA", border: "#A7F3D0", glow: "#22FFAA" },  // green — correct lane (revealed on approach)
]

// ── Challenge generation ──────────────────────────────────────────────────────

type Op = "AND" | "OR" | "XOR" | "NAND" | "NOR"

function buildChallenges(
  count: number,
  ops: Op[]
): Array<{ label: string; answer: 0 | 1 }> {
  const out: Array<{ label: string; answer: 0 | 1 }> = []
  for (let i = 0; i < count; i++) {
    const op  = ops[Math.floor(Math.random() * ops.length)]
    const a   = Math.round(Math.random()) as 0 | 1
    const b   = Math.round(Math.random()) as 0 | 1
    let result: number
    switch (op) {
      case "AND":  result = a & b; break
      case "OR":   result = a | b; break
      case "XOR":  result = a ^ b; break
      case "NAND": result = +(!(a & b)); break
      case "NOR":  result = +(!(a | b)); break
      default:     result = 0
    }
    out.push({ label: `${a} ${op} ${b} = ?`, answer: result as 0 | 1 })
  }
  return out
}

// ── Perspective helpers ───────────────────────────────────────────────────────

// Map z (0=near, FAR_Z=far) → screen coords
function perspX(laneIdx: number, z: number): number {
  const t    = z / FAR_Z          // 0=near, 1=far
  const near = LANE_X_NEAR[laneIdx]
  const far  = LANE_X[laneIdx]
  return near + (far - near) * t
}

function perspY(z: number): number {
  const t = z / FAR_Z
  return FLOOR_Y + (HORIZON_Y - FLOOR_Y) * t
}

function perspScale(z: number): number {
  const t = z / FAR_Z
  return 0.1 + (1 - 0.1) * (1 - t)    // 1.0 at z=0, 0.1 at z=FAR_Z
}

function hexToRgba(hex: string, a: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${a})`
}

// ── Main Component ────────────────────────────────────────────────────────────

const BinaryRunnerComponent: React.FC<PluginRenderProps<BinaryRunnerQuestion>> = ({
  question,
  onAnswer,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef    = useRef<number>(0)

  const gameRef = useRef({
    playerLane:     0 as 0 | 1,    // current lane
    targetLane:     0 as 0 | 1,    // lane being animated to
    laneAnim:       0,              // 0..1 lerp progress
    challenges:     [] as Challenge[],
    particles:      [] as Particle[],
    nextId:         0,
    score:          0,
    lives:          3,
    combo:          0,
    answered:       0,             // total answered
    correct:        0,
    speed:          question.initialSpeed,
    distance:       0,
    lastSpawn:      0,
    spawnInterval:  question.spawnInterval * 1000,
    startTime:      0,
    ended:          false,
    sessionAnswered:false,
    // Challenge bank
    bank:           [] as Array<{ label: string; answer: 0 | 1 }>,
    bankIdx:        0,
  })

  const [score,    setScore]    = useState(0)
  const [lives,    setLives]    = useState(3)
  const [combo,    setCombo]    = useState(0)
  const [timeLeft, setTimeLeft] = useState(question.duration)
  const [ended,    setEnded]    = useState(false)
  const [curLabel, setCurLabel] = useState<string | null>(null)
  const [countDown, setCountDown] = useState(3)
  const [started,   setStarted]   = useState(false)
  const [wrongFlash, setWrongFlash] = useState(false)

  // ── Keyboard handling ───────────────────────────────────────────────────────
  useEffect(() => {
    const g = gameRef.current
    const onKey = (e: KeyboardEvent) => {
      if (g.ended || !started) return
      if (e.key === "ArrowLeft"  || e.key === "a" || e.key === "A") {
        g.targetLane = 0; g.laneAnim = 0
      }
      if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
        g.targetLane = 1; g.laneAnim = 0
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [started])

  // ── Countdown ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (countDown <= 0) { setStarted(true); return }
    const t = setTimeout(() => setCountDown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countDown])

  // ── End run ────────────────────────────────────────────────────────────────
  const endRun = useCallback(() => {
    const g = gameRef.current
    if (g.sessionAnswered) return
    g.ended          = true
    g.sessionAnswered = true
    cancelAnimationFrame(rafRef.current)
    setEnded(true)

    const correct = g.correct > g.answered - g.correct
    const result: AnswerResult = {
      questionId:    question.id,
      correct,
      pointsAwarded: g.score,
      timeTaken:     question.duration,
      feedback:      `${g.correct}/${g.answered} correct · ${Math.round(g.distance)}m`,
    }
    setTimeout(() => onAnswer(result), 2000)
  }, [question, onAnswer])

  // ── Spawn obstacle ─────────────────────────────────────────────────────────
  const spawnChallenge = useCallback((now: number) => {
    const g = gameRef.current
    if (g.bank.length === 0) return
    const item = g.bank[g.bankIdx % g.bank.length]
    g.bankIdx++
    g.challenges.push({
      id:       g.nextId++,
      z:        FAR_Z,
      label:    item.label,
      answer:   item.answer,
      answered: false,
      hitTime:  0,
      correct:  null,
    })
    g.lastSpawn = now
    // show upcoming challenge label
    setCurLabel(item.label)
  }, [])

  // ── Particle burst ─────────────────────────────────────────────────────────
  const burst = useCallback((x: number, y: number, color: string, count = 14) => {
    const g = gameRef.current
    for (let i = 0; i < count; i++) {
      const ang = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.4
      const spd = 2 + Math.random() * 5
      g.particles.push({
        x, y, vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd - 1,
        life: 1, color, r: 2 + Math.random() * 3,
      })
    }
  }, [])

  // ── Main game loop ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!started) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")!

    const g      = gameRef.current
    g.startTime  = performance.now()
    g.bank       = buildChallenges(60, question.operations as Op[])
    g.lastSpawn  = g.startTime - g.spawnInterval  // spawn immediately

    const loop = (now: number) => {
      if (g.ended) return
      const elapsed   = now - g.startTime
      const remaining = question.duration * 1000 - elapsed
      setTimeLeft(Math.max(0, Math.ceil(remaining / 1000)))
      if (remaining <= 0 || g.lives <= 0) { endRun(); return }

      const dt = 1 / 60

      // Speed ramp
      g.speed = Math.min(
        question.initialSpeed + elapsed / 1000 * question.speedRampPerSec,
        question.maxSpeed
      )
      g.distance += g.speed * dt * 0.1

      // Lane animation
      if (g.playerLane !== g.targetLane) {
        g.laneAnim = Math.min(1, g.laneAnim + dt * 8)
        if (g.laneAnim >= 1) g.playerLane = g.targetLane
      }

      // Spawn
      if (now - g.lastSpawn >= g.spawnInterval / g.speed * 80) {
        spawnChallenge(now)
      }

      // Update challenges
      const Z_HIT = 14   // depth where player hits the challenge
      for (let i = g.challenges.length - 1; i >= 0; i--) {
        const c = g.challenges[i]
        if (c.answered) {
          if (now - c.hitTime > 600) g.challenges.splice(i, 1)
          continue
        }
        c.z -= g.speed * dt

        // Hit zone
        if (c.z <= Z_HIT) {
          c.answered = true
          c.hitTime  = now
          g.answered++

          const laneAtHit = g.laneAnim > 0.5 ? g.targetLane : g.playerLane
          const hit = laneAtHit === c.answer
          c.correct = hit

          if (hit) {
            g.combo++
            const pts = 100 + g.combo * 25
            g.score  += pts
            g.correct++
            setScore(g.score)
            setCombo(g.combo)
            burst(perspX(laneAtHit, Z_HIT), perspY(Z_HIT), "#22FFAA")
          } else {
            g.combo   = 0
            g.lives   = Math.max(0, g.lives - 1)
            setLives(g.lives)
            setCombo(0)
            setWrongFlash(true)
            setTimeout(() => setWrongFlash(false), 280)
            burst(perspX(laneAtHit, Z_HIT), perspY(Z_HIT), "#FF2D78")
          }
        }

        if (c.z < -30) g.challenges.splice(i, 1)
      }

      // Update particles
      for (let i = g.particles.length - 1; i >= 0; i--) {
        const p = g.particles[i]
        p.x   += p.vx; p.y += p.vy; p.vy += 0.18
        p.life -= 0.04
        if (p.life <= 0) g.particles.splice(i, 1)
      }

      // ── Draw ────────────────────────────────────────────────────────────────
      ctx.clearRect(0, 0, W, H)

      // Sky gradient
      const sky = ctx.createLinearGradient(0, 0, 0, HORIZON_Y)
      sky.addColorStop(0, "#030112")
      sky.addColorStop(1, "#0D0730")
      ctx.fillStyle = sky
      ctx.fillRect(0, 0, W, HORIZON_Y)

      // Road
      const road = ctx.createLinearGradient(0, HORIZON_Y, 0, FLOOR_Y)
      road.addColorStop(0, "#080520")
      road.addColorStop(1, "#0F0836")
      ctx.fillStyle = road
      ctx.fillRect(0, HORIZON_Y, W, FLOOR_Y - HORIZON_Y)

      // Stars (static — generated once using a seeded pattern)
      ctx.fillStyle = "rgba(255,255,255,0.55)"
      for (let si = 0; si < 60; si++) {
        const sx = ((si * 137 + 41) % W)
        const sy = ((si * 97  + 17) % HORIZON_Y)
        ctx.beginPath(); ctx.arc(sx, sy, 0.8, 0, Math.PI * 2); ctx.fill()
      }

      // Perspective grid lines (floor)
      ctx.strokeStyle = "rgba(168,85,247,0.18)"
      ctx.lineWidth   = 1
      for (let gz = 0; gz <= FAR_Z; gz += 20) {
        const animatedZ = (gz - (g.distance * 100) % 20 + 20) % FAR_Z
        const gy = perspY(animatedZ)
        if (gy < HORIZON_Y) continue
        ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke()
      }
      // Vanishing lines
      for (let lx = 0; lx <= W; lx += W / 8) {
        ctx.beginPath()
        ctx.moveTo(lx, FLOOR_Y)
        ctx.lineTo(W / 2, HORIZON_Y)
        ctx.stroke()
      }

      // Road centre divider
      ctx.setLineDash([8, 12])
      ctx.strokeStyle = "rgba(168,85,247,0.35)"
      ctx.lineWidth   = 2
      ctx.beginPath()
      ctx.moveTo(W / 2, FLOOR_Y)
      ctx.lineTo(W / 2, HORIZON_Y)
      ctx.stroke()
      ctx.setLineDash([])

      // Lane labels at bottom
      const laneLabels = ["◀  0", "1  ▶"]
      const laneColors = ["#00D4FF", "#A855F7"]
      laneLabels.forEach((lbl, li) => {
        const bx = LANE_X_NEAR[li]
        ctx.font      = "bold 14px Orbitron, monospace"
        ctx.fillStyle = laneColors[li]
        ctx.textAlign = "center"
        ctx.fillText(lbl, bx, FLOOR_Y - 8)
      })

      // ── Challenges (obstacles) ───────────────────────────────────────────────
      for (const c of [...g.challenges].sort((a, b) => b.z - a.z)) {
        const scale  = perspScale(c.z)
        const boxW   = 110 * scale
        const boxH   = 62  * scale
        const ansX   = perspX(c.answer, c.z)
        const wrongX = perspX(c.answer === 0 ? 1 : 0, c.z)
        const cy     = perspY(c.z) - boxH / 2

        // Show correct/wrong lane colour only when close
        const reveal = c.z < FAR_Z * 0.45

        // Wrong lane block (neutral/red)
        drawBlock(ctx, wrongX, cy, boxW, boxH, c.answered && !c.correct
          ? "#FF2D78" : "#1A0A2E",
          c.answered && !c.correct ? "#FF2D78" : "rgba(168,85,247,0.4)",
          scale, "")

        // Correct lane block
        drawBlock(ctx, ansX, cy, boxW, boxH,
          reveal ? hexToRgba("#22FFAA", 0.18) : "rgba(168,85,247,0.1)",
          reveal ? "#22FFAA" : "rgba(168,85,247,0.5)",
          scale,
          c.answered && c.correct ? "✓" : "")

        // Challenge text — appears on both blocks, prominently
        const fontSize = Math.max(9, 13 * scale)
        ctx.font        = `bold ${fontSize}px Orbitron, monospace`
        ctx.textAlign   = "center"
        ctx.fillStyle   = c.answered ? (c.correct ? "#22FFAA" : "#FF2D78") : "#E8E0FF"
        ctx.shadowColor = c.answered ? (c.correct ? "#22FFAA" : "#FF2D78") : "#A855F7"
        ctx.shadowBlur  = 8 * scale

        // Position the label above both blocks
        const midX = (ansX + wrongX) / 2
        ctx.fillText(c.label, midX, cy - 6 * scale)
        ctx.shadowBlur = 0

        // Lane answer labels on each block
        const smallFont = Math.max(8, 11 * scale)
        ctx.font        = `bold ${smallFont}px Orbitron, monospace`
        ctx.fillStyle   = reveal ? "#22FFAA" : "rgba(232,224,255,0.4)"
        ctx.fillText(`${c.answer}`, ansX, cy + boxH / 2 - 2)
        ctx.fillStyle = "rgba(232,224,255,0.25)"
        ctx.fillText(`${c.answer === 0 ? 1 : 0}`, wrongX, cy + boxH / 2 - 2)
      }

      // ── Player (Data Packet) ────────────────────────────────────────────────
      {
        const lerpT   = g.laneAnim
        const fromX   = LANE_X_NEAR[g.playerLane]
        const toX     = LANE_X_NEAR[g.targetLane]
        const px      = fromX + (toX - fromX) * easeInOut(lerpT)
        const py      = FLOOR_Y - 32
        const lean    = (toX - fromX) * lerpT * 0.04  // subtle rotation lean

        ctx.save()
        ctx.translate(px, py)
        ctx.rotate(lean)

        // Thruster glow under the packet
        const thruster = ctx.createRadialGradient(0, 20, 0, 0, 20, 35)
        thruster.addColorStop(0, "rgba(168,85,247,0.55)")
        thruster.addColorStop(1, "rgba(168,85,247,0)")
        ctx.fillStyle = thruster
        ctx.fillRect(-35, 10, 70, 40)

        // Main body
        const bodyGrad = ctx.createLinearGradient(-18, -22, 18, 22)
        bodyGrad.addColorStop(0, "#C084FC")
        bodyGrad.addColorStop(1, "#7C3AED")
        ctx.shadowColor = "#A855F7"
        ctx.shadowBlur  = 18
        roundRect(ctx, -18, -22, 36, 44, 6)
        ctx.fillStyle = bodyGrad
        ctx.fill()

        // Circuit lines on packet
        ctx.strokeStyle = "rgba(255,255,255,0.35)"
        ctx.lineWidth   = 1
        ;[[-8, -14, 8, -14], [-8, 0, 8, 0], [-8, 12, 8, 12]].forEach(([x1,y1,x2,y2]) => {
          ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke()
        })

        // Highlight
        const hl = ctx.createLinearGradient(-18, -22, 0, 0)
        hl.addColorStop(0, "rgba(255,255,255,0.3)")
        hl.addColorStop(1, "rgba(255,255,255,0)")
        roundRect(ctx, -18, -22, 36, 44, 6)
        ctx.fillStyle = hl; ctx.fill()

        ctx.shadowBlur = 0
        ctx.restore()

        // Speed lines (motion blur effect)
        const sLineAlpha = Math.min(0.25, g.speed / question.maxSpeed * 0.25)
        ctx.strokeStyle = `rgba(168,85,247,${sLineAlpha})`
        ctx.lineWidth   = 1.5
        for (let sl = 0; sl < 6; sl++) {
          const slx = px - 30 + sl * 12
          ctx.beginPath()
          ctx.moveTo(slx, py - 18)
          ctx.lineTo(slx, py + 25)
          ctx.stroke()
        }
      }

      // ── Particles ────────────────────────────────────────────────────────────
      for (const p of g.particles) {
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = hexToRgba(p.color, p.life)
        ctx.fill()
      }

      // ── Wrong flash overlay ──────────────────────────────────────────────────
      // (handled via React state + CSS)

      rafRef.current = requestAnimationFrame(loop)
    }

    rafRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafRef.current)
  }, [started, question, spawnChallenge, endRun, burst])

  useEffect(() => () => cancelAnimationFrame(rafRef.current), [])

  // ── Click to switch lane ───────────────────────────────────────────────────
  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const g = gameRef.current
    if (g.ended || !started) return
    const rect  = canvasRef.current!.getBoundingClientRect()
    const cx    = (e.clientX - rect.left) / rect.width * W
    g.targetLane = cx < W / 2 ? 0 : 1
    g.laneAnim   = 0
  }, [started])

  // ── Wave end screen ─────────────────────────────────────────────────────────
  if (ended) {
    const g   = gameRef.current
    const acc = g.answered > 0 ? Math.round(g.correct / g.answered * 100) : 0
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", minHeight: "360px", gap: "16px" }}>
        <div style={{ fontSize: "2.8rem" }}>{acc >= 70 ? "🚀" : acc >= 40 ? "⚡" : "💡"}</div>
        <h2 style={{ fontFamily: "Orbitron, monospace", color: "#A855F7", margin: 0 }}>
          Stage Clear!
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "14px", textAlign: "center" }}>
          {[
            { label: "Score",    val: score },
            { label: "Accuracy", val: `${acc}%` },
            { label: "Distance", val: `${Math.round(gameRef.current.distance)}m` },
          ].map(({ label, val }) => (
            <div key={label} style={{ background: "rgba(168,85,247,0.1)",
              border: "1px solid rgba(168,85,247,0.3)", borderRadius: "12px", padding: "14px 18px" }}>
              <div style={{ fontSize: "1.5rem", fontFamily: "Orbitron, monospace", color: "#A855F7" }}>{val}</div>
              <div style={{ fontSize: "0.72rem", color: "rgba(232,224,255,0.45)", marginTop: "4px" }}>{label}</div>
            </div>
          ))}
        </div>
        <p style={{ fontSize: "0.78rem", color: "rgba(232,224,255,0.3)", fontStyle: "italic" }}>
          Advancing to next stage…
        </p>
      </div>
    )
  }

  if (!started) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", minHeight: "360px", gap: "20px" }}>
        <h2 style={{ fontFamily: "Orbitron, monospace", color: "#00D4FF", fontSize: "1.15rem", margin: 0 }}>
          {question.instruction}
        </h2>
        <div style={{ fontSize: "6rem", fontFamily: "Orbitron, monospace", color: "#A855F7",
          textShadow: "0 0 40px rgba(168,85,247,0.8)" }}>
          {countDown > 0 ? countDown : "RUN!"}
        </div>
        <p style={{ fontSize: "0.8rem", color: "rgba(232,224,255,0.4)", textAlign: "center" }}>
          ◀ A / ← key  or  click left half  →  Lane 0<br/>
          ▶ D / → key  or  click right half  →  Lane 1
        </p>
      </div>
    )
  }

  const timeRatio = timeLeft / question.duration

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>

      {/* HUD */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "8px 16px", background: "rgba(4,2,18,0.8)",
        border: "1px solid rgba(168,85,247,0.2)", borderRadius: "10px",
        fontFamily: "Orbitron, monospace", fontSize: "0.82rem" }}>
        <span style={{ color: "#A855F7" }}>⚡ {score}</span>
        <span style={{ color: "#22FFAA" }}>
          {curLabel ? `❓ ${curLabel}` : "Watch the road…"}
        </span>
        <div style={{ display: "flex", gap: "14px", alignItems: "center" }}>
          {combo >= 3 && <span style={{ color: "#FFD700" }}>🔥 ×{combo}</span>}
          <span>{"❤️".repeat(lives)}{"🖤".repeat(Math.max(0, 3 - lives))}</span>
          <span style={{ color: timeRatio < 0.2 ? "#FF2D78" : "#00D4FF" }}>⏱ {timeLeft}s</span>
        </div>
      </div>

      {/* Time bar */}
      <div style={{ height: "3px", background: "rgba(255,255,255,0.05)", borderRadius: "4px" }}>
        <div style={{ height: "100%", borderRadius: "4px",
          width: `${timeRatio * 100}%`,
          background: timeRatio < 0.2 ? "#FF2D78" : "linear-gradient(90deg,#A855F7,#00D4FF)",
          transition: "width 0.25s linear" }} />
      </div>

      {/* Canvas */}
      <div style={{ position: "relative", borderRadius: "14px", overflow: "hidden",
        border: "1px solid rgba(168,85,247,0.35)",
        boxShadow: "0 0 40px rgba(168,85,247,0.15)" }}>
        <canvas
          ref={canvasRef} width={W} height={H}
          onClick={handleCanvasClick}
          style={{ display: "block", width: "100%", height: "auto", cursor: "pointer",
            outline: wrongFlash ? "3px solid #FF2D78" : "none",
            transition: "outline 0.1s" }}
        />
      </div>

      {/* Controls reminder */}
      <div style={{ display: "flex", justifyContent: "center", gap: "24px",
        fontSize: "0.72rem", color: "rgba(232,224,255,0.3)", fontFamily: "Exo 2, sans-serif" }}>
        <span>◀ A / ← → Lane 0</span>
        <span>·</span>
        <span>Lane 1  D / → ▶</span>
        <span>·</span>
        <span>OR click left / right half of screen</span>
      </div>
    </div>
  )
}

// ── Canvas helpers ────────────────────────────────────────────────────────────

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y,     x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h,     x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y,         x + r, y)
  ctx.closePath()
}

function drawBlock(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, bw: number, bh: number,
  fill: string, stroke: string,
  scale: number, label: string
) {
  const x = cx - bw / 2
  ctx.save()
  ctx.shadowColor = stroke
  ctx.shadowBlur  = 10 * scale
  roundRect(ctx, x, cy, bw, bh, 6 * scale)
  ctx.fillStyle   = fill
  ctx.fill()
  ctx.strokeStyle = stroke
  ctx.lineWidth   = 2 * scale
  ctx.stroke()
  ctx.shadowBlur  = 0
  if (label) {
    ctx.font        = `bold ${14 * scale}px Orbitron, monospace`
    ctx.fillStyle   = "#22FFAA"
    ctx.textAlign   = "center"
    ctx.fillText(label, cx, cy + bh / 2 - 4 * scale)
  }
  ctx.restore()
}

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
}

// ── Plugin definition ─────────────────────────────────────────────────────────

export const BinaryRunnerPlugin: GamePlugin<BinaryRunnerQuestion> = {
  id:      "binaryrunner",
  name:    "Binary Runner — Logic Gate Endless Runner",
  handles: ["binaryrunner"],

  validateQuestion(q: Question): q is BinaryRunnerQuestion {
    const bq = q as BinaryRunnerQuestion
    return (
      q.type === "binaryrunner" &&
      typeof bq.duration      === "number" &&
      typeof bq.initialSpeed  === "number" &&
      Array.isArray(bq.operations)
    )
  },

  Component: BinaryRunnerComponent,

  calculateScore() { return 0 },
}
