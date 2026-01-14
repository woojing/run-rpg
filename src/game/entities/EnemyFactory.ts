import Phaser from 'phaser'
import { Enemy } from './Enemy.js'
import { EnemyArchetype, WAVES, WaveConfig } from '../data/enemyArchetypes.js'

export class EnemyFactory {
  scene: Phaser.Scene
  lastSpawnTime: number = 0

  constructor(scene: Phaser.Scene) {
    this.scene = scene
  }

  spawnWave(elapsedTime: number): Enemy[] {
    const spawned: Enemy[] = []

    // Determine which wave config to use
    let waveConfig: WaveConfig

    if (elapsedTime < WAVES.wave1.duration) {
      waveConfig = WAVES.wave1
    } else if (elapsedTime < WAVES.wave1.duration + WAVES.wave2.duration) {
      waveConfig = WAVES.wave2
    } else {
      waveConfig = WAVES.wave3
    }

    // Check if it's time to spawn
    if (elapsedTime - this.lastSpawnTime >= waveConfig.spawnInterval / 1000) {
      const archetype = this.selectArchetype(waveConfig)
      spawned.push(this.spawnEnemy(archetype))
      this.lastSpawnTime = elapsedTime
    }

    return spawned
  }

  private selectArchetype(waveConfig: WaveConfig): EnemyArchetype {
    // If only one type, return it
    if (waveConfig.types.length === 1) {
      return waveConfig.types[0]
    }

    // Use spawn chances if provided
    if (waveConfig.chances) {
      const roll = Math.random()
      let cumulative = 0

      for (const type of waveConfig.types) {
        const chance = waveConfig.chances![type]
        if (chance !== undefined) {
          cumulative += chance
          if (roll <= cumulative) {
            return type
          }
        }
      }

      // Fallback to last type if chances don't sum to 1
      return waveConfig.types[waveConfig.types.length - 1]
    }

    // Random selection if no chances specified
    return waveConfig.types[Math.floor(Math.random() * waveConfig.types.length)]
  }

  private spawnEnemy(archetype: EnemyArchetype): Enemy {
    // Spawn at edge of screen, away from center
    const side = Math.floor(Math.random() * 4) // 0: top, 1: right, 2: bottom, 3: left
    let x: number, y: number

    switch (side) {
      case 0: // Top
        x = Math.random() * 1920
        y = -50
        break
      case 1: // Right
        x = 1970
        y = Math.random() * 1080
        break
      case 2: // Bottom
        x = Math.random() * 1920
        y = 1130
        break
      case 3: // Left
        x = -50
        y = Math.random() * 1080
        break
      default:
        x = 960
        y = 0
    }

    const enemy = new Enemy(this.scene, x, y, archetype)
    this.scene.add.existing(enemy)
    return enemy
  }
}
