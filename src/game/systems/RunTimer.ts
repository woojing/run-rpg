import Phaser from 'phaser'

export class RunTimer {
  scene: Phaser.Scene
  duration: number // seconds
  elapsedTime: number = 0
  isComplete: boolean = false
  onComplete!: () => void

  constructor(scene: Phaser.Scene, duration: number) {
    this.scene = scene
    this.duration = duration
  }

  start() {
    this.elapsedTime = 0
    this.isComplete = false
  }

  update(delta: number) {
    if (this.isComplete) return

    this.elapsedTime += delta / 1000

    if (this.elapsedTime >= this.duration) {
      this.elapsedTime = this.duration
      this.isComplete = true

      if (this.onComplete) {
        this.onComplete()
      }
    }
  }

  getRemainingTime(): number {
    return Math.max(0, this.duration - this.elapsedTime)
  }
}
