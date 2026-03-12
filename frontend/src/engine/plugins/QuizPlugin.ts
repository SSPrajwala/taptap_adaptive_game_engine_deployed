import type { Level } from "../GameTypes"
import type { GamePlugin } from "./GamePlugin"

export const QuizPlugin: GamePlugin = {

  name: "quiz",

  start(level: Level) {
    console.log("Quiz Level Started:", level.levelId)
  }

}