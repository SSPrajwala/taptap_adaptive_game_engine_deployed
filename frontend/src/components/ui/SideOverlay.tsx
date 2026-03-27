import React, { useEffect } from "react"

interface Props {
  open:     boolean
  onClose:  () => void
  title:    string
  subtitle?: string
  width?:   number
  children: React.ReactNode
}

export const SideOverlay: React.FC<Props> = ({
  open, onClose, title, subtitle, width = 500, children,
}) => {
  // Lock body scroll while open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : ""
    return () => { document.body.style.overflow = "" }
  }, [open])

  if (!open) return null

  return (
    <>
      {/* ── Backdrop ──────────────────────────────────────────────────────── */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, zIndex: 900,
          background: "rgba(4,2,16,0.72)",
          backdropFilter: "blur(6px)",
          WebkitBackdropFilter: "blur(6px)",
          animation: "overlayFadeIn 0.22s ease",
        }}
      />

      {/* ── Side Panel ────────────────────────────────────────────────────── */}
      <div style={{
        position:      "fixed",
        top:           0,
        right:         0,
        bottom:        0,
        width:         `${width}px`,
        maxWidth:      "100vw",
        zIndex:        901,
        background:    "rgba(9,6,26,0.94)",
        backdropFilter:"blur(48px) saturate(200%)",
        WebkitBackdropFilter: "blur(48px) saturate(200%)",
        borderLeft:    "1px solid rgba(168,85,247,0.22)",
        boxShadow:     "-24px 0 80px rgba(0,0,0,0.85), inset 1px 0 0 rgba(168,85,247,0.08)",
        display:       "flex",
        flexDirection: "column",
        animation:     "slideInRight 0.3s cubic-bezier(0.4,0,0.2,1)",
      }}>

        {/* Header */}
        <div style={{
          display:        "flex",
          alignItems:     "center",
          justifyContent: "space-between",
          padding:        "18px 24px",
          borderBottom:   "1px solid rgba(168,85,247,0.14)",
          background:     "rgba(168,85,247,0.05)",
          flexShrink:     0,
        }}>
          <div>
            <div style={{
              fontFamily: "Orbitron, monospace",
              fontSize:   "0.92rem",
              fontWeight: 800,
              background: "linear-gradient(135deg,#C0C0D8,#E8E8FF,#A855F7)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor:  "transparent",
              backgroundClip:       "text",
              letterSpacing: "0.03em",
            }}>
              {title}
            </div>
            {subtitle && (
              <div style={{
                fontSize:   "0.72rem",
                color:      "rgba(168,85,247,0.55)",
                fontFamily: "Exo 2, sans-serif",
                marginTop:  "2px",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
              }}>
                {subtitle}
              </div>
            )}
          </div>

          <button
            onClick={onClose}
            style={{
              background:   "rgba(168,85,247,0.08)",
              border:       "1px solid rgba(168,85,247,0.2)",
              color:        "rgba(232,224,255,0.6)",
              width:        "34px",
              height:       "34px",
              borderRadius: "9px",
              cursor:       "pointer",
              fontSize:     "1rem",
              display:      "flex",
              alignItems:   "center",
              justifyContent: "center",
              transition:   "all 0.2s",
              flexShrink:   0,
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.background = "rgba(168,85,247,0.18)"
              ;(e.currentTarget as HTMLButtonElement).style.color     = "rgba(232,224,255,0.9)"
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.background = "rgba(168,85,247,0.08)"
              ;(e.currentTarget as HTMLButtonElement).style.color     = "rgba(232,224,255,0.6)"
            }}
          >
            ✕
          </button>
        </div>

        {/* Scrollable body */}
        <div style={{
          flex:       1,
          overflowY:  "auto",
          padding:    "24px",
          scrollbarWidth: "thin",
          scrollbarColor: "rgba(168,85,247,0.3) transparent",
        }}>
          {children}
        </div>
      </div>
    </>
  )
}
