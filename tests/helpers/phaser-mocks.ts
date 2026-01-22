import Phaser from 'phaser'
import BattleScene from '@/game/scenes/BattleScene'
import SummaryScene from '@/game/scenes/SummaryScene'
import { SCENE_KEYS } from '@/game/constants'

/**
 * Create a Phaser HEADLESS game instance for testing
 */
export function createTestGame(): Phaser.Game {
  const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.HEADLESS,
    width: 1920,
    height: 1080,
    parent: null,
    backgroundColor: '#0a0a0f',
    physics: {
      default: 'arcade',
      arcade: { debug: false }
    },
    scene: [],
    audio: { noAudio: true }
  }

  const game = new Phaser.Game(config)
  return game
}

/**
 * Create and start a BattleScene for testing
 */
export async function createBattleScene(): Promise<{
  game: Phaser.Game
  scene: BattleScene
}> {
  const game = createTestGame()

  const scene = new BattleScene()
  game.scene.add(SCENE_KEYS.BATTLE, scene)

  // Wait for scene to be ready
  await new Promise<void>((resolve) => {
    scene.events.once(Phaser.Scenes.Events.READY, () => resolve())
    game.scene.start(SCENE_KEYS.BATTLE)
  })

  return { game, scene }
}

/**
 * Create and start a SummaryScene for testing
 */
export async function createSummaryScene(
  telemetry: any
): Promise<{
  game: Phaser.Game
  scene: SummaryScene
}> {
  const game = createTestGame()

  const scene = new SummaryScene()
  game.scene.add(SCENE_KEYS.SUMMARY, scene)

  // Wait for scene to be ready
  await new Promise<void>((resolve) => {
    scene.events.once(Phaser.Scenes.Events.READY, () => resolve())
    scene.init({ telemetry })
    game.scene.start(SCENE_KEYS.SUMMARY)
  })

  return { game, scene }
}

/**
 * Clean up test game instance
 */
export function destroyTestGame(game: Phaser.Game) {
  if (game && !game.destroyed) {
    game.destroy(true)
  }
}

/**
 * Wait for a short delay (for async operations)
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
