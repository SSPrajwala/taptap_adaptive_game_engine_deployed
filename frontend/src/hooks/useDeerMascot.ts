import { useState } from "react"
import type { DeerState } from "../components/ui/DeerMascot"

export function useDeerMascot() {
  const [deerState, setDeerState] = useState<DeerState>("idle")

  const triggerCorrect = () => setDeerState("happy")
  const triggerWrong = () => setDeerState("sad")
  const triggerVictory = () => setDeerState("victory")
  const triggerIdle = () => setDeerState("idle")

  return { deerState, triggerCorrect, triggerWrong, triggerVictory, triggerIdle }
}