import { GameLoader } from "./GameLoader"
import { AdaptiveEngine } from "./AdaptiveEngine"
import { ScoreEngine } from "./ScoreEngine"
import { LevelManager } from "./LevelManager"
import type { EngineResult } from "./EngineTypes"

import type { GameConfig } from "./GameLoader"
import type { PerformanceMetrics } from "./AdaptiveEngine"

export class EngineCore {
  static run(config: GameConfig, metrics: PerformanceMetrics): EngineResult {
    console.log("----- ENGINE START -----")

    const game = GameLoader.load(config)

    const levelManager = new LevelManager(game.levels)

    const currentLevel = levelManager.getCurrentLevel()

    console.log(`Starting Level: ${currentLevel.levelId}`)

    const decision = AdaptiveEngine.decide(metrics)

    const score = ScoreEngine.calculate(metrics)

    levelManager.applyDecision(decision)

    console.log("----- ENGINE END -----")

    return {
      game: game.gameName,
      level: currentLevel.levelId,
      decision: decision,
      score: score
    }
  }
}