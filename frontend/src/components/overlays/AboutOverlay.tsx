import React from "react"
import { SideOverlay } from "../ui/SideOverlay"

interface Props { open: boolean; onClose: () => void }

const pill = (label: string, color: string) => (
  <span key={label} style={{
    display:      "inline-block",
    padding:      "3px 10px",
    borderRadius: "99px",
    fontSize:     "0.72rem",
    fontFamily:   "Exo 2, sans-serif",
    fontWeight:   700,
    border:       `1px solid ${color}44`,
    color,
    background:   `${color}11`,
    margin:       "3px 4px 3px 0",
  }}>{label}</span>
)

const Section: React.FC<{ icon: string; title: string; children: React.ReactNode }> = ({ icon, title, children }) => (
  <div style={{ marginBottom: "28px" }}>
    <div style={{
      display:    "flex",
      alignItems: "center",
      gap:        "8px",
      marginBottom: "10px",
    }}>
      <span style={{ fontSize: "1.1rem" }}>{icon}</span>
      <span style={{
        fontFamily:  "Orbitron, monospace",
        fontSize:    "0.78rem",
        fontWeight:  700,
        color:       "#A855F7",
        letterSpacing: "0.08em",
        textTransform: "uppercase",
      }}>{title}</span>
    </div>
    <div style={{
      color:      "rgba(232,224,255,0.75)",
      fontFamily: "Exo 2, sans-serif",
      fontSize:   "0.86rem",
      lineHeight: 1.7,
    }}>
      {children}
    </div>
  </div>
)

export const AboutOverlay: React.FC<Props> = ({ open, onClose }) => (
  <SideOverlay open={open} onClose={onClose} title="About TapTap Engine" subtitle="Adaptive · Modular · JSON-driven">

    {/* Hero card */}
    <div style={{
      background:   "linear-gradient(135deg,rgba(168,85,247,0.12),rgba(59,130,246,0.08))",
      border:       "1px solid rgba(168,85,247,0.2)",
      borderRadius: "14px",
      padding:      "20px",
      marginBottom: "28px",
    }}>
      <div style={{
        fontFamily:  "Orbitron, monospace",
        fontSize:    "1.05rem",
        fontWeight:  900,
        background:  "linear-gradient(135deg,#C0C0D8,#E8E8FF,#A855F7)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor:  "transparent",
        backgroundClip:       "text",
        marginBottom: "8px",
      }}>
        TapTap Adaptive Modular Game Engine
      </div>
      <div style={{ color: "rgba(232,224,255,0.65)", fontFamily: "Exo 2, sans-serif", fontSize: "0.84rem", lineHeight: 1.6 }}>
        A configuration-driven web game engine that loads any learning game from a JSON file and runs it with adaptive scoring, difficulty progression, and a shared leaderboard.
      </div>
    </div>

    <Section icon="🎯" title="What It Does">
      Instead of building one-time games, TapTap provides a universal execution layer that
      dynamically loads and runs <strong style={{ color: "#A855F7" }}>6 game types</strong> from
      pure JSON — no code changes needed per game. New games are just new config files.
    </Section>

    <Section icon="🧩" title="6 Built-in Game Types">
      <div style={{ display: "flex", flexWrap: "wrap" }}>
        {pill("Quiz",        "#A855F7")}
        {pill("Puzzle",      "#00D4FF")}
        {pill("Flashcard",   "#FF2D78")}
        {pill("Memory",      "#22FFAA")}
        {pill("Sudoku",      "#FFD700")}
        {pill("Word Builder","#FF8C00")}
      </div>
    </Section>

    <Section icon="⚙️" title="Core Architecture">
      <strong style={{ color: "#E8E0FF" }}>EngineCore</strong> — Pure reducer (Redux-style state machine){" "}<br />
      <strong style={{ color: "#E8E0FF" }}>AdaptiveEngine</strong> — Adjusts difficulty based on accuracy{" "}<br />
      <strong style={{ color: "#E8E0FF" }}>ScoreEngine</strong> — Time bonus + streak multipliers{" "}<br />
      <strong style={{ color: "#E8E0FF" }}>LevelManager</strong> — Level progression &amp; unlock logic{" "}<br />
      <strong style={{ color: "#E8E0FF" }}>PluginRegistry</strong> — Self-registering game type plugins
    </Section>

    <Section icon="🛠️" title="Tech Stack">
      <div style={{ display: "flex", flexWrap: "wrap" }}>
        {pill("React 19",    "#61DAFB")}
        {pill("TypeScript",  "#3178C6")}
        {pill("Vite 7",      "#A855F7")}
        {pill("Node.js",     "#22FFAA")}
        {pill("Express",     "#FFD700")}
        {pill("ESLint v9",   "#FF8C00")}
      </div>
    </Section>

    <Section icon="📈" title="Adaptive Intelligence">
      The engine evaluates player accuracy after every level:
      <ul style={{ margin: "8px 0 0 16px", padding: 0, lineHeight: 2 }}>
        <li><span style={{ color: "#22FFAA" }}>Accuracy &gt; 80%</span> → Jumps to higher difficulty</li>
        <li><span style={{ color: "#FFD700" }}>Accuracy 50–80%</span> → Normal progression</li>
        <li><span style={{ color: "#FF2D78" }}>Accuracy &lt; 50%</span> → Repeats level</li>
      </ul>
    </Section>

    <Section icon="🏆" title="Built For">
      TapTap Hackathon — Career Readiness Platform for students across India.
      Goal: make learning addictive through game mechanics and real-time competition.
    </Section>

  </SideOverlay>
)
