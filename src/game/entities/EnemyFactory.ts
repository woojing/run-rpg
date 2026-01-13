import Phaser from 'phaser'
import { Enemy } from './Enemy.js'

export class EnemyFactory {
  scene: Phaser.Scene
  lastSpawnTime: number = 0

  constructor(scene: Phaser.Scene) {
    this.scene = scene
  }

  spawnWave(elapsedTime: number): Enemy[] {
    const spawned: Enemy[] = []

    // Wave 1: 0-30s - Rushers only (spawn every 3s)
    if (elapsedTime < 30) {
      if (elapsedTime - this.lastSpawnTime >= 3) {
        spawned.push(this.spawnEnemy())
        this.lastSpawnTime = elapsedTime
      }
    }
    // Wave 2: 30-70s - Rushers only for now (will add Snipers in C7)
    else if (elapsedTime < 70) {
      if (elapsedTime - this.lastSpawnTime >= 2.5) {
        spawned.push(this.spawnEnemy())
        this.lastSpawnTime = elapsedTime
      }
    }
    // Wave 3: 70-120s - Rushers only for now (will add Elites in C7)
    else {
      if (elapsedTime - this.lastSpawnTime >= 2) {
        spawned.push(this.spawnEnemy())
        this.lastSpawnTime = elapsedTime
      }
    }

    return spawned
  }

  private spawnEnemy(): Enemy {
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

    const enemy = new Enemy(this.scene, x, y)
    this.scene.add.existing(enemy)
    return enemy
  }
}
