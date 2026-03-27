import React, { useEffect, useState } from "react"

export type DeerState = "idle" | "happy" | "sad" | "victory"

interface Props {
  state?: DeerState
  size?: number
}

export const DeerMascot: React.FC<Props> = ({ state = "idle", size = 40 }) => {
  const [overrideState, setOverrideState] = useState<DeerState | null>(null)

  useEffect(() => {
    if (state !== "idle") {
      const duration = state === "victory" ? 1200 : 700
      const t = setTimeout(() => setOverrideState(null), duration)
      return () => clearTimeout(t)
    }
  }, [state])

  const currentState = overrideState ?? state

  const tooltips: Record<DeerState, string> = {
    idle: "TapTap Mascot",
    happy: "Correct! 🎉",
    sad: "Wrong answer",
    victory: "You won! 🏆",
  }

  return (
    <div
      className={`deer-mascot-corner ${currentState}`}
      style={{ fontSize: size }}
      title={tooltips[currentState]}
    >
      🦌
    </div>
  )
}