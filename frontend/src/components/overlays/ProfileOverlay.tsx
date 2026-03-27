import React, { useMemo } from "react"
import { SideOverlay } from "../ui/SideOverlay"
import { useAuth } from "../../context/AuthContext"
import type { LeaderboardEntry } from "../../types/engine.types"
import { LeaderboardService } from "../../engine/LeaderboardService"

interface Props {
  open:    boolean
  onClose: () => void
}

function initials(name: string): string {
  return name.split(" ").map(w => w[0] ?? "").join("").toUpperCase().slice(0, 2) || "?"
}

function timeAgo(ts: number): string {
  const s  = Math.floor((Date.now() - ts) / 1000)
  if (s < 60)  return "just now"
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

const DIFF_COLOR: Record<string, string> = {
  easy:   "#22FFAA",
  medium: "#FFD700",
  hard:   "#FF2D78",
}

export const ProfileOverlay: React.FC<Props> = ({ open, onClose }) => {
  const { user, logout, isLoggedIn } = useAuth()

  // Compute scores directly — no effect needed, localStorage is synchronous
  const scores = useMemo<LeaderboardEntry[]>(() => {
    if (!open || !user) return []
    return LeaderboardService.getAll()
      .filter(e => e.playerName.toLowerCase() === user.name.toLowerCase())
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 8)
  }, [open, user])

  const handleLogout = () => {
    logout()
    onClose()
  }

  if (!isLoggedIn || !user) return null

  const bestScore = scores.length ? Math.max(...scores.map(s => s.score)) : 0
  const avgAcc    = scores.length
    ? Math.round((scores.reduce((s, e) => s + e.accuracy, 0) / scores.length) * 100)
    : 0

  return (
    <SideOverlay
      open={open}
      onClose={onClose}
      title="Profile"
      subtitle={user.college || "TapTap Player"}
      width={420}
    >
      {/* Avatar + info card */}
      <div style={{
        background:   "linear-gradient(135deg,rgba(168,85,247,0.12),rgba(59,130,246,0.08))",
        border:       "1px solid rgba(168,85,247,0.2)",
        borderRadius: "14px",
        padding:      "20px",
        marginBottom: "24px",
        display:      "flex",
        alignItems:   "center",
        gap:          "18px",
      }}>
        {/* Avatar */}
        <div style={{
          width:        "60px",
          height:       "60px",
          borderRadius: "50%",
          background:   "linear-gradient(135deg,#A855F7,#3B82F6)",
          border:       "2px solid rgba(168,85,247,0.5)",
          display:      "flex",
          alignItems:   "center",
          justifyContent: "center",
          fontFamily:   "Orbitron, monospace",
          fontSize:     "1.2rem",
          fontWeight:   900,
          color:        "#fff",
          flexShrink:   0,
          boxShadow:    "0 0 20px rgba(168,85,247,0.35)",
        }}>
          {initials(user.name)}
        </div>

        {/* Name / email */}
        <div style={{ minWidth: 0 }}>
          <div style={{
            fontFamily: "Orbitron, monospace",
            fontSize:   "0.92rem",
            fontWeight: 800,
            color:      "#E8E0FF",
            marginBottom: "3px",
            overflow:   "hidden",
            textOverflow:"ellipsis",
            whiteSpace: "nowrap",
          }}>
            {user.name}
          </div>
          <div style={{ color: "rgba(168,85,247,0.7)", fontFamily: "Exo 2, sans-serif", fontSize: "0.78rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {user.email}
          </div>
          {user.college && (
            <div style={{ color: "rgba(232,224,255,0.4)", fontFamily: "Exo 2, sans-serif", fontSize: "0.72rem", marginTop: "2px" }}>
              🏫 {user.college}
            </div>
          )}
        </div>
      </div>

      {/* Stats row */}
      {scores.length > 0 && (
        <div style={{
          display:      "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap:          "10px",
          marginBottom: "24px",
        }}>
          {[
            { label: "Games",    value: scores.length,       color: "#A855F7" },
            { label: "Best",     value: bestScore,           color: "#FFD700" },
            { label: "Accuracy", value: `${avgAcc}%`,        color: "#22FFAA" },
          ].map(stat => (
            <div key={stat.label} style={{
              background:   "rgba(168,85,247,0.06)",
              border:       "1px solid rgba(168,85,247,0.14)",
              borderRadius: "10px",
              padding:      "12px 8px",
              textAlign:    "center",
            }}>
              <div style={{ fontFamily: "Orbitron, monospace", fontSize: "1rem", fontWeight: 800, color: stat.color }}>{stat.value}</div>
              <div style={{ fontFamily: "Exo 2, sans-serif", fontSize: "0.68rem", color: "rgba(232,224,255,0.4)", marginTop: "3px", textTransform: "uppercase", letterSpacing: "0.06em" }}>{stat.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Recent scores */}
      {scores.length > 0 ? (
        <>
          <div style={{ fontFamily: "Orbitron, monospace", fontSize: "0.72rem", fontWeight: 700, color: "rgba(168,85,247,0.6)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "10px" }}>
            Recent Games
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "24px" }}>
            {scores.map(s => (
              <div key={s.id} style={{
                background:   "rgba(168,85,247,0.05)",
                border:       "1px solid rgba(168,85,247,0.12)",
                borderRadius: "10px",
                padding:      "10px 14px",
                display:      "flex",
                alignItems:   "center",
                gap:          "12px",
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: "#E8E0FF", fontFamily: "Exo 2, sans-serif", fontSize: "0.83rem", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {s.gameTitle}
                  </div>
                  <div style={{ color: "rgba(232,224,255,0.35)", fontFamily: "Exo 2, sans-serif", fontSize: "0.72rem", marginTop: "2px" }}>
                    <span style={{ color: DIFF_COLOR[s.difficulty] ?? "#A855F7" }}>{s.difficulty}</span>
                    {" · "}{timeAgo(s.timestamp)}
                  </div>
                </div>
                <div style={{ fontFamily: "Orbitron, monospace", fontSize: "0.88rem", fontWeight: 800, color: "#FFD700", flexShrink: 0 }}>
                  {s.score.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div style={{
          textAlign:    "center",
          padding:      "24px",
          color:        "rgba(232,224,255,0.3)",
          fontFamily:   "Exo 2, sans-serif",
          fontSize:     "0.84rem",
          marginBottom: "24px",
        }}>
          🎮 No games played yet. Go play something!
        </div>
      )}

      {/* Logout button */}
      <button
        onClick={handleLogout}
        style={{
          width:        "100%",
          padding:      "11px",
          background:   "rgba(255,45,120,0.08)",
          border:       "1px solid rgba(255,45,120,0.25)",
          borderRadius: "10px",
          color:        "#FF6090",
          fontFamily:   "Exo 2, sans-serif",
          fontWeight:   700,
          fontSize:     "0.88rem",
          cursor:       "pointer",
          transition:   "all 0.2s",
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,45,120,0.15)"
          ;(e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,45,120,0.4)"
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,45,120,0.08)"
          ;(e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,45,120,0.25)"
        }}
      >
        Sign Out
      </button>
    </SideOverlay>
  )
}
