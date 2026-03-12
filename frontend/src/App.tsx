import "./App.css"
import { EngineCore } from "./engine/EngineCore"
import type { EngineResult } from "./engine/EngineTypes"
import gameConfig from "./games/logic-game.json"

const metrics = {
  accuracy: 85,
  responseTime: 40,
  attempts: 1
}

function App() {

  const result: EngineResult = EngineCore.run(gameConfig, metrics)

  return (
    <div style={{ textAlign: "center", marginTop: "60px" }}>

      <h1>TapTap Adaptive Game Engine</h1>

      <h2>Game: {result.game}</h2>

      <h3>Level: {result.level}</h3>

      <h3>Decision: {result.decision}</h3>

      <h3>Score: {result.score}</h3>

    </div>
  )
}

export default App