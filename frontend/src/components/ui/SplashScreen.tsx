import React, { useEffect, useState } from "react"

interface Props {
  onComplete: () => void
}

export const SplashScreen: React.FC<Props> = ({ onComplete }) => {
  const [phase, setPhase] = useState<"deer" | "hex" | "title" | "done">("deer")

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("hex"),   800)
    const t2 = setTimeout(() => setPhase("title"), 1500)
    const t3 = setTimeout(() => setPhase("done"),  3000)
    const t4 = setTimeout(() => onComplete(),       3400)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4) }
  }, [onComplete])

  if (phase === "done") return null

  return (
    <div className="splash-screen">
      {/* Ambient orbs */}
      <div style={{
        position: "absolute", top: "20%", left: "20%",
        width: "300px", height: "300px",
        background: "radial-gradient(circle, rgba(168,85,247,0.3) 0%, transparent 70%)",
        borderRadius: "50%", animation: "orbFloat1 4s ease-in-out infinite",
        pointerEvents: "none"
      }} />
      <div style={{
        position: "absolute", bottom: "20%", right: "20%",
        width: "250px", height: "250px",
        background: "radial-gradient(circle, rgba(0,212,255,0.2) 0%, transparent 70%)",
        borderRadius: "50%", animation: "orbFloat2 5s ease-in-out infinite",
        pointerEvents: "none"
      }} />

      {/* Deer mascot running in */}
      <div className="splash-deer">🦌</div>

      {/* Hex logo assembles */}
      {(phase === "hex" || phase === "title") && (
        <div className="splash-hex-logo">
          <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="hexGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%"   stopColor="#A855F7" />
                <stop offset="50%"  stopColor="#3B82F6" />
                <stop offset="100%" stopColor="#00D4FF" />
              </linearGradient>
              <linearGradient id="innerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%"   stopColor="#22FFAA" />
                <stop offset="100%" stopColor="#00D4FF" />
              </linearGradient>
            </defs>
            {/* Outer hex */}
            <polygon
              points="80,8 144,44 144,116 80,152 16,116 16,44"
              fill="none" stroke="url(#hexGrad)" strokeWidth="3"
            />
            {/* Inner hex */}
            <polygon
              points="80,28 124,52 124,100 80,124 36,100 36,52"
              fill="rgba(168,85,247,0.1)" stroke="url(#innerGrad)" strokeWidth="1.5"
            />
            {/* TT letters */}
            <text
              x="80" y="88"
              textAnchor="middle"
              dominantBaseline="central"
              fill="url(#hexGrad)"
              fontSize="32"
              fontFamily="Orbitron"
              fontWeight="900"
              letterSpacing="2"
            >
              TT
            </text>
            {/* Deer antler silhouette above TT */}
            <path
              d="M60,55 L60,42 M60,42 L54,36 M60,42 L66,36 M100,55 L100,42 M100,42 L94,36 M100,42 L106,36 M60,45 L63,40 M100,45 L97,40"
              stroke="url(#innerGrad)" strokeWidth="2.5" fill="none" strokeLinecap="round"
            />
          </svg>
          {/* Shine effect */}
          <div className="splash-shine" />
        </div>
      )}

      {/* Title and subtitle */}
      {phase === "title" && (
        <>
          <h1 className="splash-title">TapTap Engine</h1>
          <p className="splash-subtitle">Adaptive · Plugin-based · JSON-driven</p>
        </>
      )}
    </div>
  )
}