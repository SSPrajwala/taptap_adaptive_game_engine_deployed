import type { Level } from "../GameTypes"

export interface GamePlugin {
  name: string
  start(level: Level): void
}