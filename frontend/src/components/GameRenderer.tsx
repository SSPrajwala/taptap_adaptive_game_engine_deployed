import React, { useState, useRef, useEffect } from "react"
import type { GameConfig, AnswerResult, Question } from "../types/engine.types"
import { pluginRegistry }     from "../plugins"
import { useGameEngine }      from "../hooks/useGameEngine"
import { LeaderboardService } from "../engine/LeaderboardService"
import { Confetti }           from "./ui/Confetti"
import { BlackbuckAI }        from "./ui/BlackbuckAI"
import { useAuth }            from "../context/AuthContext"

interface Props {
  config:       GameConfig
  onBack:       () => void
  onCorrect?:   () => void
  onWrong?:     () => void
  onVictory?:   () => void
}

// Motion game plugins manage their own end screen — the engine should
// auto-advance to the next question without requiring a manual "Next" click.
const MOTION_PLUGINS = new Set(["tapblitz", "binaryrunner"])

export const GameRenderer: React.FC<Props> = ({ config, onBack, onCorrect, onWrong, onVictory }) => {
  const {
    state, engine, currentQuestion, lastResult,
    isShowingHint, timeRemaining,
    handleAnswer, handleHint, send,
  } = useGameEngine(config)

  const isMotionGame = MOTION_PLUGINS.has(config.plugin)

  const { user, token } = useAuth()

  // ── Deer mascot + victory reactions ──────────────────────────────────────────
  useEffect(() => engine.on(event => {
    if (event.type === "ANSWER_SUBMITTED") {
      if (event.payload.correct) onCorrect?.()
      else                       onWrong?.()
    }
    if (event.type === "GAME_OVER" || event.type === "LEVEL_COMPLETE") {
      onVictory?.()
    }
  }), [engine, onCorrect, onWrong, onVictory])

  // Pre-fill name from logged-in user (username field in new schema)
  const [playerName, setPlayerName] = useState((user as { username?: string } | null)?.username ?? "")
  const [scoreSaved, setScoreSaved] = useState(false)
  const [apiStatus,  setApiStatus]  = useState<string | null>(null)
  const [saving,     setSaving]     = useState(false)

  // ── Blackbuck AI explain panel ─────────────────────────────────────────────
  const [aiOpen,       setAiOpen]       = useState(false)
  const [explainCtx,   setExplainCtx]   = useState<{
    concept: string; question?: string; correctAnswer?: string; studentAnswer?: string
  } | undefined>(undefined)

  const gameStartRef = useRef<number>(0)
  const [timeTaken,  setTimeTaken]  = useState(0)

  useEffect(() => {
    if (state.status === "playing" && gameStartRef.current === 0) {
      gameStartRef.current = Date.now()
    }
  }, [state.status])

  useEffect(() => {
    if (state.status === "gameOver" && gameStartRef.current > 0) {
      setTimeTaken(Math.round((Date.now() - gameStartRef.current) / 1000))
    }
  }, [state.status])

  // ── Motion game auto-advance ───────────────────────────────────────────────
  // After a motion game wave ends (answered → true), automatically fire
  // NEXT_QUESTION after 2.4s so the plugin's own result screen has time to show.
  // This means players never need to manually click "Next →" between waves.
  const answeredRef = useRef(false)
  useEffect(() => {
    if (!isMotionGame) return
    const answered = currentQuestion ? state.answeredIds.has(currentQuestion.id) : false
    if (answered && !answeredRef.current) {
      answeredRef.current = true
      const t = setTimeout(() => {
        answeredRef.current = false
        send({ type: "NEXT_QUESTION" })
      }, 2400)
      return () => clearTimeout(t)
    }
    if (!answered) answeredRef.current = false
  })

  const plugin = pluginRegistry.get(config.plugin)
  if (!plugin) {
    return (
      <div className="engine-error">
        <code>Unknown plugin: "{config.plugin}"</code>
        <p>Registered: {pluginRegistry.list().join(", ")}</p>
      </div>
    )
  }

  const currentLevel = config.levels.find(l => l.id === state.currentLevelId)
  const totalQ  = state.levelQuestions.length
  const doneQ   = state.questionIndex
  const answered = currentQuestion ? state.answeredIds.has(currentQuestion.id) : false

  const handleSaveScore = async () => {
    if (!playerName.trim() || saving) return
    setSaving(true)
    const entry = LeaderboardService.save({
      playerName:    playerName.trim(),
      gameId:        config.id,
      gameTitle:     config.title,
      score:         state.stats.score,
      accuracy:      state.stats.accuracy,
      totalAnswered: state.stats.totalAnswered,
      timeTaken,
      difficulty:    state.stats.difficulty,
    })
    const result = await LeaderboardService.submitToAPI(entry, token, config.learningOutcomes)
    setApiStatus(result.message)
    setScoreSaved(true)
    setSaving(false)
  }

  const handleRestart = () => {
    gameStartRef.current = 0
    setScoreSaved(false)
    setPlayerName("")
    setApiStatus(null)
    setTimeTaken(0)
    send({ type: "RESTART" })
  }

  if (state.status === "idle") {
    return (
      <div className="screen screen-idle">
        <button className="back-btn" onClick={onBack}>← Library</button>
        <div className="idle-badge">{config.plugin}</div>
        <h1 className="idle-title">{config.ui?.emoji ?? "🎮"} {config.title}</h1>
        <p className="idle-desc">{config.description}</p>
        <div className="level-list">
          {config.levels.map((lvl, i) => (
            <div key={lvl.id} className="level-row">
              <span className="level-num">0{i + 1}</span>
              <div>
                <div className="level-row-title">{lvl.title}</div>
                <div className="level-row-sub">{lvl.description}</div>
              </div>
              <span className="level-row-count">{lvl.questionIds.length}q</span>
            </div>
          ))}
        </div>
        <button className="btn-primary" onClick={() => send({ type: "START_GAME" })}>
          Start Game →
        </button>
      </div>
    )
  }

  if (state.status === "levelComplete") {
    const nextLevel = config.levels[config.levels.findIndex(l => l.id === state.currentLevelId) + 1]
    return (
      <div className="screen screen-complete">
        <Confetti active count={40} />
        <div className="complete-ring">✓</div>
        <h2>Level Complete!</h2>
        <p className="complete-level-name">{currentLevel?.title}</p>
        <div className="stats-row">
          <div className="stat-block"><span className="stat-val">{state.stats.score}</span><span className="stat-lbl">Score</span></div>
          <div className="stat-block"><span className="stat-val">{Math.round(state.stats.accuracy * 100)}%</span><span className="stat-lbl">Accuracy</span></div>
          <div className="stat-block"><span className="stat-val">{state.stats.streak}</span><span className="stat-lbl">Streak</span></div>
        </div>
        <div className="complete-actions">
          <button className="btn-primary" onClick={() => send({ type: "NEXT_LEVEL" })}>
            {nextLevel ? `Next: ${nextLevel.title} →` : "Finish →"}
          </button>
          <button className="btn-ghost" onClick={handleRestart}>Restart</button>
        </div>
      </div>
    )
  }

  if (state.status === "gameOver") {
    const rank = LeaderboardService.getRank(state.stats.score, timeTaken)
    return (
      <div className="screen screen-gameover">
        <Confetti active count={60} />
        <div className="gameover-trophy">🏆</div>
        <h2>Game Complete!</h2>
        <div className="final-score-display">
          <span className="final-score-num">{state.stats.score.toLocaleString()}</span>
          <span className="final-score-lbl">final score · rank #{rank}</span>
        </div>
        <div className="stats-row">
          <div className="stat-block"><span className="stat-val">{Math.round(state.stats.accuracy * 100)}%</span><span className="stat-lbl">Accuracy</span></div>
          <div className="stat-block"><span className="stat-val">{state.stats.totalAnswered}</span><span className="stat-lbl">Answered</span></div>
          <div className="stat-block"><span className="stat-val">{timeTaken}s</span><span className="stat-lbl">Time</span></div>
        </div>
        {!scoreSaved ? (
          <div className="save-score-form">
            <p className="save-score-label">Save your score to the leaderboard</p>
            <div className="save-score-row">
              <input
                className="admin-input save-name-input"
                placeholder="Your name"
                value={playerName}
                onChange={e => setPlayerName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSaveScore()}
              />
              <button className="btn-primary btn-sm" onClick={handleSaveScore} disabled={!playerName.trim() || saving}>
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        ) : (
          <div className="save-score-success">
            ✓ Score saved!
            {apiStatus && <div className="api-status">{apiStatus}</div>}
          </div>
        )}
        <div className="complete-actions">
          <button className="btn-primary" onClick={handleRestart}>Play Again</button>
          <button className="btn-ghost" onClick={onBack}>← Library</button>
        </div>
      </div>
    )
  }

  if (!currentQuestion) return <div className="engine-error">No question found.</div>

  if (!plugin.validateQuestion(currentQuestion)) {
    return (
      <div className="engine-error">
        Question failed validation for plugin <code>{plugin.id}</code>.
        Expected: <code>{plugin.handles.join(" | ")}</code>, got: <code>{(currentQuestion as Question).type}</code>
      </div>
    )
  }

  const PluginComponent = plugin.Component as React.ComponentType<{
    question:      Question
    stats:         typeof state.stats
    config:        GameConfig
    onAnswer:      (r: AnswerResult) => void
    onRequestHint: () => void
    isShowingHint: boolean
    timeRemaining?: number
  }>

  return (
    <div className="game-renderer">
      <div className="gr-header">
        <div className="gr-header-left">
          <button className="gr-back-btn" onClick={onBack}>←</button>
          <div>
            <div className="gr-game-name">{config.title}</div>
            <div className="gr-level-name">{currentLevel?.title}</div>
          </div>
        </div>
        <div className="gr-header-right">
          {config.ui?.showStreak && state.stats.streak > 1 && (
            <span className="pill pill-streak">🔥 {state.stats.streak}</span>
          )}
          <span className="pill pill-score">{state.stats.score.toLocaleString()} pts</span>
        </div>
      </div>
      {config.ui?.showProgress !== false && (
        <div className="gr-progress-wrap">
          <div className="gr-progress-fill" style={{ width: `${(doneQ / totalQ) * 100}%` }} />
          <span className="gr-progress-label">{doneQ + 1} / {totalQ}</span>
        </div>
      )}
      <div className="gr-plugin-area">
        {/* key=currentQuestionId remounts the plugin on every new question,
            which resets all local state without needing useEffect resets in plugins */}
        <PluginComponent
          key={state.currentQuestionId}
          question={currentQuestion}
          stats={state.stats}
          config={config}
          onAnswer={handleAnswer}
          onRequestHint={handleHint}
          isShowingHint={isShowingHint}
          timeRemaining={timeRemaining}
        />
      </div>
      {/* Motion games auto-advance — no manual Next button needed.
          Regular games show the continue bar with the feedback toast. */}
      {answered && !isMotionGame && (
        <div className="gr-continue">
          {lastResult && (
            <span className={`result-toast ${lastResult.correct ? "toast-ok" : "toast-fail"}`}>
              {lastResult.feedback}
            </span>
          )}
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            {/* "Why?" AI explanation button — only shown after a wrong answer when logged in */}
            {token && lastResult && !lastResult.correct && (
              <button
                className="btn-ghost btn-sm"
                title="Ask Blackbuck AI to explain this"
                onClick={() => {
                  const q = currentQuestion as Question & { prompt?: string; answer?: string }
                  setExplainCtx({
                    concept:       config.title,
                    question:      q.prompt ?? "",
                    correctAnswer: q.answer ?? "",
                    studentAnswer: lastResult.feedback,
                  })
                  setAiOpen(true)
                }}
                style={{
                  background: "rgba(0,212,255,0.12)",
                  border: "1px solid rgba(0,212,255,0.3)",
                  color: "#00D4FF",
                  fontFamily: "Orbitron, monospace",
                  fontSize: "0.68rem",
                }}
              >
                🤖 Why?
              </button>
            )}
            <button className="btn-primary btn-sm" onClick={() => send({ type: "NEXT_QUESTION" })}>
              {doneQ + 1 < totalQ ? "Next →" : "Finish Level →"}
            </button>
          </div>
        </div>
      )}

      {/* Blackbuck AI explanation panel */}
      <BlackbuckAI
        isOpen={aiOpen}
        onClose={() => { setAiOpen(false); setExplainCtx(undefined) }}
        explainContext={explainCtx}
      />
    </div>
  )
}