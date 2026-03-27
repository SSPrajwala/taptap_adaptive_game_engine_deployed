import React, { useEffect, useState } from "react"

interface Props {
  onComplete: () => void
}

type Phase = "deer-running" | "hex-assembles" | "tt-lights" | "electric" | "done"

export const SplashScreen: React.FC<Props> = ({ onComplete }) => {
  const [phase, setPhase] = useState<Phase>("deer-running")
  const [deerX, setDeerX]  = useState(-150)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    // Phase timeline
    const t1 = setTimeout(() => setPhase("hex-assembles"),  900)   // hex draws in
    const t2 = setTimeout(() => setPhase("tt-lights"),      1700)  // TT + text light up
    const t3 = setTimeout(() => setPhase("electric"),       2300)  // electric wires spin
    const t4 = setTimeout(() => { setVisible(false); },     3800)  // fade out
    const t5 = setTimeout(() => onComplete(),                4200)  // call parent

    // Deer runs from left to center
    let x = -150
    const run = setInterval(() => {
      x += 12
      setDeerX(x)
      if (x >= 0) clearInterval(run)
    }, 16)

    return () => {
      clearTimeout(t1); clearTimeout(t2); clearTimeout(t3)
      clearTimeout(t4); clearTimeout(t5); clearInterval(run)
    }
  }, [onComplete])

  const showHex    = phase !== "deer-running"
  const showTT     = phase === "tt-lights" || phase === "electric"
  const showWires  = phase === "electric"

  return (
    <div style={{
      position:   "fixed",
      inset:      0,
      background: "#04040C",
      display:    "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      zIndex:     9999,
      opacity:    visible ? 1 : 0,
      transition: "opacity 0.5s ease",
      overflow:   "hidden",
    }}>
      {/* Background orbs */}
      <div style={{ position: "absolute", top: "15%", left: "10%", width: "400px", height: "400px",
        background: "radial-gradient(circle, rgba(168,85,247,0.2) 0%, transparent 70%)",
        borderRadius: "50%", animation: "orbFloat1 6s ease-in-out infinite" }} />
      <div style={{ position: "absolute", bottom: "15%", right: "10%", width: "350px", height: "350px",
        background: "radial-gradient(circle, rgba(0,212,255,0.15) 0%, transparent 70%)",
        borderRadius: "50%", animation: "orbFloat2 8s ease-in-out infinite" }} />
      <div style={{ position: "absolute", top: "60%", left: "30%", width: "250px", height: "250px",
        background: "radial-gradient(circle, rgba(34,255,170,0.1) 0%, transparent 70%)",
        borderRadius: "50%", animation: "orbFloat3 10s ease-in-out infinite" }} />

      {/* Hex background grid */}
      <div style={{
        position: "absolute", inset: 0, opacity: 0.06,
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='69'%3E%3Cpolygon points='30,2 58,17 58,52 30,67 2,52 2,17' fill='none' stroke='rgba(168,85,247,1)' stroke-width='1'/%3E%3C/svg%3E")`,
        backgroundSize: "60px 69px",
        animation: "hexDrift 20s linear infinite",
      }} />

      {/* ── Running deer (phase 1) ── */}
      <div style={{
        position:   "absolute",
        bottom:     "42%",
        left:       "50%",
        transform:  `translateX(calc(-50% + ${deerX}px))`,
        transition: deerX >= 0 ? "transform 0.3s cubic-bezier(0.34,1.56,0.64,1)" : "none",
        opacity:    showHex ? 0 : 1,
        transition2: "opacity 0.3s",
        zIndex:     10,
      } as React.CSSProperties}>
        {/* Neon outline deer SVG running */}
        <svg width="100" height="120" viewBox="0 0 120 140" xmlns="http://www.w3.org/2000/svg"
          style={{ filter: "drop-shadow(0 0 12px #A855F7) drop-shadow(0 0 24px #00D4FF)" }}>
          <defs>
            <linearGradient id="neonDeerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#E8E0FF" />
              <stop offset="50%" stopColor="#A855F7" />
              <stop offset="100%" stopColor="#00D4FF" />
            </linearGradient>
          </defs>
          <g fill="none" stroke="url(#neonDeerGrad)" strokeWidth="2.5" strokeLinecap="round" style={{ animation: "neonPulse 0.4s ease-in-out infinite alternate" }}>
            {/* Antlers */}
            <path d="M38,42 L32,22 L28,18 M32,22 L36,16 M32,22 L26,26"/>
            <path d="M82,42 L88,22 L92,18 M88,22 L84,16 M88,22 L94,26"/>
            {/* Head outline */}
            <ellipse cx="60" cy="52" rx="26" ry="24" fill="rgba(168,85,247,0.1)" stroke="url(#neonDeerGrad)" />
            {/* Eyes */}
            <circle cx="47" cy="48" r="5" fill="#A855F7" />
            <circle cx="73" cy="48" r="5" fill="#A855F7" />
            {/* Body */}
            <ellipse cx="60" cy="100" rx="28" ry="32" fill="rgba(168,85,247,0.08)" />
            {/* Running legs */}
            <line x1="45" y1="124" x2="38" y2="138" />
            <line x1="55" y1="126" x2="60" y2="140" />
            <line x1="65" y1="126" x2="70" y2="140" />
            <line x1="75" y1="124" x2="82" y2="138" />
            {/* Arms */}
            <line x1="32" y1="90" x2="20" y2="108" />
            <line x1="88" y1="90" x2="100" y2="108" />
          </g>
        </svg>
      </div>

      {/* ── Main Logo Assembly ── */}
      <div style={{
        display:    "flex",
        flexDirection: "column",
        alignItems: "center",
        gap:        "0px",
        position:   "relative",
      }}>
        {/* The Hex Logo SVG */}
        <div style={{
          position:   "relative",
          width:      "280px",
          height:     "280px",
          display:    "flex",
          alignItems: "center",
          justifyContent: "center",
        }}>
          <svg
            width="280" height="280"
            viewBox="0 0 280 280"
            xmlns="http://www.w3.org/2000/svg"
            style={{ position: "absolute", inset: 0 }}
          >
            <defs>
              <linearGradient id="hexOuterGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%"   stopColor="#C0C0C0" />
                <stop offset="30%"  stopColor="#E8E8F0" />
                <stop offset="60%"  stopColor="#A0A0B0" />
                <stop offset="100%" stopColor="#D0D0E0" />
              </linearGradient>
              <linearGradient id="ttGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%"   stopColor={showTT ? "#E8E0FF" : "#333"} />
                <stop offset="100%" stopColor={showTT ? "#A855F7" : "#333"} />
              </linearGradient>
              <linearGradient id="deerBodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%"   stopColor="#D4C4A0" />
                <stop offset="100%" stopColor="#B8A080" />
              </linearGradient>
              <filter id="hexShadow">
                <feDropShadow dx="0" dy="0" stdDeviation="8"
                  floodColor={showWires ? "#A855F7" : showTT ? "#6633AA" : "#444"} floodOpacity="0.8" />
              </filter>
              <filter id="innerGlow">
                <feGaussianBlur stdDeviation="3" result="blur"/>
                <feFlood floodColor={showTT ? "#A855F7" : "#222"} floodOpacity="0.4" result="color"/>
                <feComposite in="color" in2="blur" operator="in" result="glow"/>
                <feMerge><feMergeNode in="glow"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>

              {/* Electric wire gradient */}
              <linearGradient id="wire1Grad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%"   stopColor="#00D4FF" stopOpacity="0" />
                <stop offset="30%"  stopColor="#22FFAA" stopOpacity="1" />
                <stop offset="70%"  stopColor="#A855F7" stopOpacity="1" />
                <stop offset="100%" stopColor="#00D4FF" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="wire2Grad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%"   stopColor="#A855F7" stopOpacity="0" />
                <stop offset="40%"  stopColor="#00D4FF" stopOpacity="1" />
                <stop offset="60%"  stopColor="#22FFAA" stopOpacity="1" />
                <stop offset="100%" stopColor="#A855F7" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* ── Electric wires (spinning around hex) ── */}
            {showWires && (
              <g style={{ transformOrigin: "140px 140px", animation: "wireRotate1 2s linear infinite" }}>
                {/* Wire 1 - cyan/green */}
                <path
                  d="M140,20 Q200,15 240,60 Q270,100 260,150 Q250,195 215,225 Q175,260 130,255"
                  stroke="url(#wire1Grad)" strokeWidth="3" fill="none"
                  strokeDasharray="15 8"
                  style={{ animation: "wireDash 0.3s linear infinite", filter: "drop-shadow(0 0 6px #22FFAA)" }}
                />
              </g>
            )}
            {showWires && (
              <g style={{ transformOrigin: "140px 140px", animation: "wireRotate2 1.8s linear infinite reverse" }}>
                {/* Wire 2 - purple/cyan */}
                <path
                  d="M140,260 Q80,265 40,220 Q10,180 20,130 Q30,85 65,55 Q105,20 150,25"
                  stroke="url(#wire2Grad)" strokeWidth="2.5" fill="none"
                  strokeDasharray="10 12"
                  style={{ animation: "wireDash 0.4s linear infinite", filter: "drop-shadow(0 0 8px #A855F7)" }}
                />
              </g>
            )}
            {showWires && (
              <g style={{ transformOrigin: "140px 140px", animation: "wireRotate3 2.5s linear infinite" }}>
                {/* Wire 3 - flickering */}
                <path
                  d="M200,50 Q250,90 255,140 Q258,190 220,230"
                  stroke="#00D4FF" strokeWidth="2" fill="none"
                  strokeDasharray="6 14"
                  style={{ animation: "wireFlicker 0.15s linear infinite", filter: "drop-shadow(0 0 10px #00D4FF)" }}
                />
              </g>
            )}

            {/* Outer pulse ring */}
            {showTT && (
              <circle cx="140" cy="140" r="135" fill="none"
                stroke="rgba(168,85,247,0.3)" strokeWidth="1"
                style={{ animation: "pulsRing 1.5s ease-out infinite" }} />
            )}

            {/* Main hexagon */}
            {showHex && (
              <polygon
                points="140,18 248,76 248,192 140,250 32,192 32,76"
                fill="#0A0818"
                stroke="url(#hexOuterGrad)"
                strokeWidth="4"
                filter="url(#hexShadow)"
                style={{
                  animation: "hexScale 0.6s cubic-bezier(0.34,1.56,0.64,1)",
                  transformOrigin: "140px 140px",
                }}
              />
            )}

            {/* Inner hex (thinner) */}
            {showHex && (
              <polygon
                points="140,32 236,86 236,188 140,242 44,188 44,86"
                fill="none"
                stroke="rgba(200,200,220,0.2)"
                strokeWidth="1"
              />
            )}

            {/* Deer head inside hex */}
            {showHex && (
              <g filter="url(#innerGlow)">
                {/* Antlers */}
                <path d="M102,100 L88,66 L80,56 M88,66 L94,54 M88,66 L78,72" stroke="#8B6A40" strokeWidth="5" strokeLinecap="round" fill="none"/>
                <path d="M178,100 L192,66 L200,56 M192,66 L186,54 M192,66 L202,72" stroke="#8B6A40" strokeWidth="5" strokeLinecap="round" fill="none"/>
                {/* Head */}
                <ellipse cx="140" cy="112" rx="42" ry="38" fill="url(#deerBodyGrad)" />
                {/* Snout */}
                <ellipse cx="140" cy="130" rx="22" ry="16" fill="#D4B090" />
                {/* Nose */}
                <ellipse cx="140" cy="125" rx="8" ry="6" fill={showTT ? "#A855F7" : "#8B4040"} style={{ transition: "fill 0.5s" }} />
                {/* Eyes */}
                <circle cx="120" cy="106" r="9" fill="#0A0A0A" />
                <circle cx="160" cy="106" r="9" fill="#0A0A0A" />
                <circle cx="122" cy="103" r="3.5" fill="white" />
                <circle cx="162" cy="103" r="3.5" fill="white" />
                {/* TT letters */}
                <text
                  x="140" y="176"
                  textAnchor="middle"
                  fill="url(#ttGrad)"
                  fontSize="38"
                  fontFamily="Orbitron, monospace"
                  fontWeight="900"
                  letterSpacing="4"
                  style={{
                    filter: showTT ? "drop-shadow(0 0 12px #A855F7)" : "none",
                    transition: "filter 0.5s",
                    animation: showTT ? "ttPulse 1s ease-in-out infinite alternate" : "none",
                  }}
                >
                  TT
                </text>
              </g>
            )}

            {/* White pulse flash when hex assembles */}
            {phase === "hex-assembles" && (
              <polygon
                points="140,18 248,76 248,192 140,250 32,192 32,76"
                fill="white"
                opacity="0.3"
                style={{ animation: "flashPulse 0.6s ease-out forwards" }}
              />
            )}
          </svg>
        </div>

        {/* TapTap GAME ENGINE title */}
        <div style={{
          display:    "flex",
          flexDirection: "column",
          alignItems: "center",
          gap:        "4px",
          opacity:    showTT ? 1 : 0,
          transform:  showTT ? "translateY(0)" : "translateY(20px)",
          transition: "opacity 0.5s, transform 0.5s cubic-bezier(0.34,1.56,0.64,1)",
          marginTop:  "-10px",
        }}>
          {/* TapTap banner */}
          <div style={{
            background: "linear-gradient(135deg, #0A0818, #1A0A30)",
            border:     "2px solid rgba(200,200,220,0.4)",
            borderRadius: "8px",
            padding:    "8px 28px",
            position:   "relative",
          }}>
            {/* Corner accents */}
            <div style={{ position: "absolute", top: "-2px", left: "-2px", width: "12px", height: "2px", background: "#22FFAA" }} />
            <div style={{ position: "absolute", top: "-2px", left: "-2px", width: "2px", height: "12px", background: "#22FFAA" }} />
            <div style={{ position: "absolute", top: "-2px", right: "-2px", width: "12px", height: "2px", background: "#A855F7" }} />
            <div style={{ position: "absolute", top: "-2px", right: "-2px", width: "2px", height: "12px", background: "#A855F7" }} />
            <div style={{ position: "absolute", bottom: "-2px", left: "-2px", width: "12px", height: "2px", background: "#A855F7" }} />
            <div style={{ position: "absolute", bottom: "-2px", right: "-2px", width: "12px", height: "2px", background: "#22FFAA" }} />

            <span style={{
              fontFamily:    "Orbitron, monospace",
              fontSize:      "2.2rem",
              fontWeight:    900,
              background:    "linear-gradient(135deg, #C0C0D0 0%, #E8E8FF 40%, #A0A0C0 70%, #D0D0F0 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              letterSpacing: "0.06em",
              filter:        showWires ? "drop-shadow(0 0 10px rgba(168,85,247,0.6))" : "none",
              transition:    "filter 0.5s",
            }}>
              TapTaP
            </span>
          </div>

          <span style={{
            fontFamily:    "Orbitron, monospace",
            fontSize:      "0.85rem",
            fontWeight:    600,
            color:         "#888AAA",
            letterSpacing: "0.4em",
            textTransform: "uppercase",
            filter:        showWires ? "drop-shadow(0 0 6px #00D4FF)" : "none",
            transition:    "filter 0.5s",
          }}>
            GAME ENGINE
          </span>
        </div>
      </div>

      {/* Loading dots */}
      {showWires && (
        <div style={{ display: "flex", gap: "8px", marginTop: "24px" }}>
          {[0,1,2].map(i => (
            <div key={i} style={{
              width: "8px", height: "8px",
              borderRadius: "50%",
              background: ["#A855F7","#00D4FF","#22FFAA"][i],
              boxShadow: `0 0 10px ${["#A855F7","#00D4FF","#22FFAA"][i]}`,
              animation: `loadingDot 1s ease-in-out ${i * 0.15}s infinite`,
            }} />
          ))}
        </div>
      )}

      {/* Splash CSS animations */}
      <style>{`
        @keyframes hexScale {
          0%   { transform: scale(0) rotate(60deg); opacity: 0; }
          60%  { transform: scale(1.08) rotate(-4deg); opacity: 1; }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        @keyframes flashPulse {
          0%   { opacity: 0.5; }
          100% { opacity: 0; }
        }
        @keyframes ttPulse {
          0%   { filter: drop-shadow(0 0 8px #A855F7); }
          100% { filter: drop-shadow(0 0 20px #A855F7) drop-shadow(0 0 40px #00D4FF); }
        }
        @keyframes wireRotate1 {
          0%   { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes wireRotate2 {
          0%   { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes wireRotate3 {
          0%   { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes wireDash {
          0%   { stroke-dashoffset: 0; }
          100% { stroke-dashoffset: -46; }
        }
        @keyframes wireFlicker {
          0%,100% { opacity: 1; }
          30%     { opacity: 0.4; }
          60%     { opacity: 0.8; }
          75%     { opacity: 0.2; }
        }
        @keyframes pulsRing {
          0%   { r: 100; opacity: 0.6; }
          100% { r: 145; opacity: 0; }
        }
        @keyframes neonPulse {
          0%   { filter: drop-shadow(0 0 6px #A855F7) drop-shadow(0 0 12px #00D4FF); }
          100% { filter: drop-shadow(0 0 16px #A855F7) drop-shadow(0 0 32px #00D4FF); }
        }
        @keyframes loadingDot {
          0%,100% { transform: scale(1); opacity: 0.5; }
          50%     { transform: scale(1.5); opacity: 1; }
        }
        @keyframes hexIdle {
          0%,100% { opacity: 0.7; }
          50%     { opacity: 1; }
        }
        @keyframes deerBreath {
          0%,100% { transform: scaleY(1); }
          50%     { transform: scaleY(1.03); }
        }
        @keyframes deerJump {
          0%   { transform: translateY(0) scale(1); }
          30%  { transform: translateY(-40px) scale(1.15) rotate(8deg); }
          60%  { transform: translateY(-16px) scale(1.08) rotate(-4deg); }
          100% { transform: translateY(0) scale(1) rotate(0deg); }
        }
        @keyframes deerSadShake {
          0%,100% { transform: translateX(0) rotate(0deg); }
          20%     { transform: translateX(-10px) rotate(-4deg); }
          40%     { transform: translateX(10px) rotate(4deg); }
          60%     { transform: translateX(-6px) rotate(-2deg); }
          80%     { transform: translateX(6px) rotate(2deg); }
        }
        @keyframes deerVictoryDance {
          0%   { transform: scale(0.8) rotate(-10deg); }
          20%  { transform: scale(1.25) rotate(8deg) translateY(-20px); }
          40%  { transform: scale(1.15) rotate(-6deg) translateY(-30px); }
          60%  { transform: scale(1.2) rotate(5deg) translateY(-15px); }
          80%  { transform: scale(1.05) rotate(-2deg) translateY(-5px); }
          100% { transform: scale(1) rotate(0deg) translateY(0); }
        }
        @keyframes hexGlow {
          0%   { opacity: 0.5; filter: drop-shadow(0 0 4px currentColor); }
          100% { opacity: 1; filter: drop-shadow(0 0 16px currentColor); }
        }
        @keyframes noseGlow {
          0%   { filter: drop-shadow(0 0 4px currentColor); }
          100% { filter: drop-shadow(0 0 14px currentColor); }
        }
        @keyframes tearFall {
          0%   { transform: translateY(0); opacity: 1; }
          100% { transform: translateY(20px); opacity: 0; }
        }
        @keyframes starSpin {
          0%   { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes confettiFall {
          0%   { transform: translateY(-10px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(60px) rotate(360deg); opacity: 0; }
        }
        @keyframes popIn {
          0%   { transform: scale(0.5); opacity: 0; }
          70%  { transform: scale(1.1); }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  )
}