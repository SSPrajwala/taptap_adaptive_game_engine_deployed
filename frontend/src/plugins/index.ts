import { pluginRegistry } from "../engine/PluginRegistry"
import { QuizPlugin }      from "./quiz/QuizPlugin"
import { PuzzlePlugin }    from "./puzzle/PuzzlePlugin"
import { FlashcardPlugin } from "./flashcard/FlashcardPlugin"
import { MemoryPlugin }    from "./memory/MemoryPlugin"

pluginRegistry.register(QuizPlugin)
pluginRegistry.register(PuzzlePlugin)
pluginRegistry.register(FlashcardPlugin)
pluginRegistry.register(MemoryPlugin)

export { pluginRegistry }