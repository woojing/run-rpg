import Phaser from 'phaser'
import { phaserConfig } from './game/config.js'
import BootScene from './game/scenes/BootScene.js'
import BattleScene from './game/scenes/BattleScene.js'

// Add scenes to config
phaserConfig.scene = [BootScene, BattleScene]

// Create and start game instance
new Phaser.Game(phaserConfig)
