import { useReducer, useEffect, useState, useCallback, useRef } from "react"
import type { GameConfig, AnswerResult, EngineAction } from "../types/engine.types"
import { EngineCore } from "../engine/EngineCore"

export function useGameEngine(config: GameConfig) {
  const engineRef = useRef<EngineCore | null>(null)
  if (!engineRef.current) engineRef.current = new EngineCore(config)
  const engine = engineRef.current

  const [state, dispatch] = useReducer(engine.reduce, undefined, () => engine.initialState())
  const [lastResult, setLastResult] = useState<AnswerResult | null>(null)
  const [isShowingHint, setIsShowingHint] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState<number | undefined>(undefined)

  useEffect(() => engine.on(event => { if (event.type === "ANSWER_SUBMITTED") setLastResult(event.payload) }), [engine])

  const currentQuestion = engine.currentQuestion(state)

  useEffect(() => {
    if (!currentQuestion?.timeLimit || state.status !== "playing") { setTimeRemaining(undefined); return }
    setTimeRemaining(currentQuestion.timeLimit)
    const tick = setInterval(() => {
      setTimeRemaining(t => {
        if (t === undefined || t <= 1) {
          clearInterval(tick)
          if (!state.answeredIds.has(currentQuestion.id)) {
            dispatch({ type: "SUBMIT_ANSWER", payload: { questionId: currentQuestion.id, correct: false, timeTaken: currentQuestion.timeLimit! } })
          }
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(tick)
  }, [state.currentQuestionId, state.status])

  useEffect(() => { setIsShowingHint(false); setLastResult(null) }, [state.currentQuestionId])

  const handleAnswer = useCallback((result: AnswerResult) => {
    const timeTaken = state.questionStartTime ? (Date.now() - state.questionStartTime) / 1000 : result.timeTaken
    dispatch({ type: "SUBMIT_ANSWER", payload: { questionId: result.questionId, correct: result.correct, timeTaken } })
  }, [state.questionStartTime])

  const handleHint = useCallback(() => { setIsShowingHint(true); dispatch({ type: "REQUEST_HINT" }) }, [])
  const send = useCallback((action: EngineAction) => dispatch(action), [])

  return { state, engine, currentQuestion, lastResult, isShowingHint, timeRemaining, handleAnswer, handleHint, send }
}