import type { GamePlugin } from "./plugins/GamePlugin"

export class PluginManager {

  private static plugins: Record<string, GamePlugin> = {}

  static register(plugin: GamePlugin) {
    this.plugins[plugin.name] = plugin
  }

  static getPlugin(name: string): GamePlugin | undefined {
    return this.plugins[name]
  }

}