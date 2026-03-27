import React, { useState } from "react"
import { SideOverlay } from "../ui/SideOverlay"

interface Props { open: boolean; onClose: () => void }

type DocSection = { id: string; icon: string; title: string; content: React.ReactNode }

const H = ({ children }: { children: React.ReactNode }) => (
  <div style={{ fontFamily: "Orbitron, monospace", fontSize: "0.78rem", fontWeight: 700, color: "#A855F7", letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: "8px" }}>
    {children}
  </div>
)

const P = ({ children }: { children: React.ReactNode }) => (
  <p style={{ color: "rgba(232,224,255,0.75)", fontFamily: "Exo 2, sans-serif", fontSize: "0.85rem", lineHeight: 1.75, marginBottom: "12px" }}>
    {children}
  </p>
)

const Code = ({ children }: { children: React.ReactNode }) => (
  <code style={{
    background:   "rgba(168,85,247,0.1)",
    border:       "1px solid rgba(168,85,247,0.2)",
    borderRadius: "5px",
    padding:      "1px 7px",
    fontFamily:   "monospace",
    fontSize:     "0.82rem",
    color:        "#C0A0FF",
  }}>
    {children}
  </code>
)

const Block = ({ children }: { children: React.ReactNode }) => (
  <div style={{
    background:   "rgba(0,0,0,0.4)",
    border:       "1px solid rgba(168,85,247,0.15)",
    borderRadius: "10px",
    padding:      "14px",
    fontFamily:   "monospace",
    fontSize:     "0.78rem",
    color:        "#C0A0FF",
    whiteSpace:   "pre",
    overflowX:    "auto",
    lineHeight:   1.6,
    marginBottom: "12px",
  }}>
    {children}
  </div>
)

const SECTIONS: DocSection[] = [
  {
    id: "overview",
    icon: "📖",
    title: "Overview",
    content: (
      <>
        <P>
          The <strong style={{ color: "#E8E0FF" }}>TapTap Adaptive Modular Game Engine (TAMGE)</strong> is
          a configuration-driven web game engine. It separates game logic from content through JSON-based
          configuration, enabling any game type to run from a single reusable engine core.
        </P>
        <P>
          New games require <em>zero code changes</em> — only a new JSON config file. The engine
          handles all rendering, scoring, adaptive difficulty, and leaderboard submission automatically.
        </P>
      </>
    ),
  },
  {
    id: "json-config",
    icon: "🗂️",
    title: "Game Config Schema",
    content: (
      <>
        <P>Every game is defined by a single JSON configuration file with this structure:</P>
        <Block>{`{
  "id":          "my-game",
  "plugin":      "quiz",          // quiz | puzzle | flashcard
  "title":       "My Quiz Game",  // memory | sudoku | wordbuilder
  "description": "...",
  "ui": { "emoji": "🧠" },
  "levels": [
    {
      "id": "level-1",
      "name": "Level 1 – Easy",
      "difficulty": "easy",
      "timeLimit": 60,
      "unlockCondition": { "minScore": 0 }
    }
  ],
  "questions": [
    {
      "id": "q1",
      "level": "level-1",
      "prompt": "What is 2+2?",
      "choices": ["3","4","5"],
      "answer": "4"
    }
  ]
}`}</Block>
      </>
    ),
  },
  {
    id: "engine-core",
    icon: "⚙️",
    title: "Engine Core",
    content: (
      <>
        <H>EngineCore</H>
        <P>
          Pure Redux-style reducer powered by <Code>useReducer</Code>. Manages all game state
          (current level, question, score, timer) through typed actions. Zero side effects in
          the state machine — all mutations flow through <Code>engine.dispatch(action)</Code>.
        </P>
        <H>Supported Actions</H>
        <Block>{`START_GAME
SUBMIT_ANSWER  { answerId, timeTaken }
NEXT_QUESTION
COMPLETE_LEVEL
GAME_OVER
TICK           (timer decrement)`}</Block>
        <H>Event System</H>
        <P>
          Subscribers can listen to engine events via <Code>engine.on(handler)</Code>.
          Events include <Code>ANSWER_SUBMITTED</Code>, <Code>LEVEL_COMPLETE</Code>, and
          <Code>GAME_OVER</Code> — used by the Deer Mascot and Confetti system.
        </P>
      </>
    ),
  },
  {
    id: "adaptive",
    icon: "🧠",
    title: "Adaptive Engine",
    content: (
      <>
        <P>
          After each level, the <strong style={{ color: "#E8E0FF" }}>AdaptiveEngine</strong> evaluates
          the player's accuracy and selects the next difficulty:
        </P>
        <Block>{`accuracy > 80%  →  jump to HARD
accuracy < 50%  →  drop to EASY (retry)
otherwise       →  normal progression`}</Block>
        <P>
          The adaptive model ensures the experience stays challenging but never frustrating —
          automatically calibrating to each student's skill level.
        </P>
      </>
    ),
  },
  {
    id: "scoring",
    icon: "🏅",
    title: "Score Engine",
    content: (
      <>
        <P>Scores are calculated using three components:</P>
        <Block>{`basePoints   =  100 per correct answer
timeBonus    =  (timeLimit - timeTaken) × 2
streakBonus  =  streak × 15  (consecutive correct)

finalScore   =  basePoints + timeBonus + streakBonus`}</Block>
        <P>
          Wrong answers break the streak. Faster responses yield higher time bonuses, creating
          a competitive edge for quick thinkers.
        </P>
      </>
    ),
  },
  {
    id: "plugins",
    icon: "🔌",
    title: "Plugin System",
    content: (
      <>
        <P>
          Each game type is a self-registering plugin. Plugins implement a common
          <Code>PluginProps</Code> interface and register with the <Code>PluginRegistry</Code>.
        </P>
        <Block>{`// Register a plugin
PluginRegistry.register("quiz", QuizPlugin)

// Props every plugin receives
interface PluginProps {
  question: Question
  onAnswer: (answerId: string) => void
  disabled: boolean
  state: EngineState
}`}</Block>
        <P>
          The key-based remount pattern (<Code>key=&#123;questionId&#125;</Code>) ensures each
          plugin resets cleanly on every new question — no manual reset logic needed.
        </P>
      </>
    ),
  },
  {
    id: "leaderboard",
    icon: "🏆",
    title: "Leaderboard API",
    content: (
      <>
        <H>Endpoints</H>
        <Block>{`GET  /api/leaderboard          # global top 50
GET  /api/leaderboard/:gameId  # top 10 for a game
POST /api/leaderboard/submit   # submit a score`}</Block>
        <H>Submit Payload</H>
        <Block>{`{
  "playerName": "Alice",
  "gameId":     "world-capitals",
  "gameTitle":  "World Capitals Quiz",
  "score":      1450,
  "accuracy":   0.87,
  "timeTaken":  42,
  "difficulty": "hard"
}`}</Block>
        <P>
          Signed-in users have their college automatically attached. Scores are ranked by
          score descending, then by time ascending (faster wins ties).
        </P>
      </>
    ),
  },
  {
    id: "auth",
    icon: "🔐",
    title: "Auth API",
    content: (
      <>
        <Block>{`POST /api/auth/register
  body: { name, email, password, college }
  returns: { user, token }

POST /api/auth/login
  body: { email, password }
  returns: { user, token }

GET  /api/auth/me
  header: Authorization: Bearer <token>
  returns: { id, name, email, college }`}</Block>
        <P>
          Tokens are JWT-signed and valid for 7 days. Include the token as
          <Code>Authorization: Bearer &lt;token&gt;</Code> when submitting scores to
          link them to your profile.
        </P>
      </>
    ),
  },
  {
    id: "future",
    icon: "🚀",
    title: "Roadmap",
    content: (
      <>
        <P>The engine is designed to grow. Planned future capabilities:</P>
        <ul style={{ color: "rgba(232,224,255,0.72)", fontFamily: "Exo 2, sans-serif", fontSize: "0.85rem", lineHeight: 2, paddingLeft: "20px" }}>
          <li>AI-based difficulty prediction from historical performance</li>
          <li>Real-time multiplayer via WebSockets</li>
          <li>Campus-level leaderboard clustering</li>
          <li>Skill analytics dashboard for institutions</li>
          <li>Behavioral performance analytics &amp; skill gap detection</li>
        </ul>
      </>
    ),
  },
]

export const DocsOverlay: React.FC<Props> = ({ open, onClose }) => {
  const [activeId, setActiveId] = useState("overview")
  const active = SECTIONS.find(s => s.id === activeId) ?? SECTIONS[0]

  return (
    <SideOverlay open={open} onClose={onClose} title="Documentation" subtitle="TapTap Engine v1.0" width={560}>
      <div style={{ display: "flex", gap: "16px", minHeight: "100%" }}>

        {/* Sidebar nav */}
        <div style={{
          flexShrink: 0,
          width:      "148px",
          borderRight:"1px solid rgba(168,85,247,0.12)",
          paddingRight:"14px",
        }}>
          {SECTIONS.map(s => (
            <button
              key={s.id}
              onClick={() => setActiveId(s.id)}
              style={{
                display:      "flex",
                alignItems:   "center",
                gap:          "7px",
                width:        "100%",
                padding:      "8px 10px",
                marginBottom: "2px",
                background:   activeId === s.id ? "rgba(168,85,247,0.14)" : "transparent",
                border:       activeId === s.id ? "1px solid rgba(168,85,247,0.25)" : "1px solid transparent",
                borderRadius: "8px",
                cursor:       "pointer",
                color:        activeId === s.id ? "#E8E0FF" : "rgba(232,224,255,0.45)",
                fontFamily:   "Exo 2, sans-serif",
                fontSize:     "0.78rem",
                fontWeight:   activeId === s.id ? 600 : 400,
                textAlign:    "left",
                transition:   "all 0.15s",
              }}
            >
              <span>{s.icon}</span>
              <span>{s.title}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily:    "Orbitron, monospace",
            fontSize:      "0.85rem",
            fontWeight:    800,
            color:         "#E8E0FF",
            marginBottom:  "16px",
            paddingBottom: "10px",
            borderBottom:  "1px solid rgba(168,85,247,0.12)",
          }}>
            {active.icon} {active.title}
          </div>
          {active.content}
        </div>
      </div>
    </SideOverlay>
  )
}
