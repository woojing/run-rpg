import Phaser from 'phaser'
import { SCENE_KEYS } from '../constants.js'

export default class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENE_KEYS.BOOT })
  }

  create() {
    // Boot scene - initialize and transition to BattleScene
    console.log('BootScene: Starting game initialization')

    // Can add loading screens, asset preloading here in future
    // For POC, we transition immediately

    this.time.delayedCall(100, () => {
      this.scene.start(SCENE_KEYS.BATTLE)
    })
  }
}
