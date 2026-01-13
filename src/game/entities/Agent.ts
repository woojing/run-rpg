import Phaser from 'phaser'
import { COLORS } from '../constants.js'

export class Agent extends Phaser.GameObjects.Container {
  public body!: Phaser.Physics.Arcade.Body

  // Stats
  hp: number = 100
  maxHp: number = 100
  damage: number = 10
  moveSpeed: number = 140
  baseSpeed: number = 140 // Base speed for fatigue calculations

  // Combat
  attackCooldown: number = 0
  attackCooldownMax: number = 600 // ms
  attackRange: number = 60 // px
  damageMultiplier: number = 1.0 // For burst mode
  damageReduction: number = 0.0 // For guard mode (0-1)

  // Special states
  invulnerable: boolean = false // For evade i-frames

  // Visual
  graphics!: Phaser.GameObjects.Graphics
  hpBar!: Phaser.GameObjects.Graphics

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y)
    this.scene.add.existing(this)
    this.scene.physics.add.existing(this)

    // Setup physics body
    const body = this.body as Phaser.Physics.Arcade.Body
    body.setCircle(40)
    body.setCollideWorldBounds(true)
    body.setMaxSpeed(this.moveSpeed)

    this.createVisuals()
  }

  private createVisuals() {
    // Blue circle for Agent
    this.graphics = this.scene.add.graphics()
    this.graphics.fillStyle(COLORS.agent, 1)
    this.graphics.fillCircle(0, 0, 40)
    this.add(this.graphics)

    // HP bar background
    this.hpBar = this.scene.add.graphics()
    this.add(this.hpBar)

    this.updateHpBar()
  }

  private updateHpBar() {
    this.hpBar.clear()

    const barWidth = 80
    const barHeight = 8
    const barY = -50

    // Background
    this.hpBar.fillStyle(0x333333, 1)
    this.hpBar.fillRect(-barWidth / 2, barY, barWidth, barHeight)

    // Health
    const healthPercent = this.hp / this.maxHp
    const healthWidth = barWidth * healthPercent

    let healthColor = 0x33ff33 // Green
    if (healthPercent <= 0.3) healthColor = 0xff3333 // Red
    else if (healthPercent <= 0.6) healthColor = 0xffff33 // Yellow

    this.hpBar.fillStyle(healthColor, 1)
    this.hpBar.fillRect(-barWidth / 2, barY, healthWidth, barHeight)
  }

  takeDamage(amount: number) {
    if (this.invulnerable) return

    // Apply damage reduction (from GUARD strategy)
    const reducedAmount = amount * (1 - this.damageReduction)
    this.hp -= reducedAmount

    // Emit event for telemetry
    this.emit('damageTaken', reducedAmount)

    // Visual feedback - flash white
    this.scene.tweens.add({
      targets: this.graphics,
      alpha: 0.3,
      duration: 50,
      yoyo: true,
      onYoyo: () => {
        this.graphics.clear()
        this.graphics.fillStyle(COLORS.agent, 1)
        this.graphics.fillCircle(0, 0, 40)
      }
    })

    this.updateHpBar()

    if (this.hp <= 0) {
      this.hp = 0
      this.die()
    }
  }

  basicAttack(enemies: Enemy[]) {
    if (this.attackCooldown > 0) return

    this.attackCooldown = this.attackCooldownMax

    // Show attack range visual
    const attackCircle = this.scene.add.circle(this.x, this.y, this.attackRange, 0xffffff, 0.3)
    this.scene.tweens.add({
      targets: attackCircle,
      scale: 1.5,
      alpha: 0,
      duration: 200,
      onComplete: () => attackCircle.destroy()
    })

    // Deal damage to enemies in range
    enemies.forEach(enemy => {
      if (!enemy.active) return

      const dist = Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y)
      if (dist <= this.attackRange + enemy.getRadius()) {
        // Apply damage multiplier (from BURST strategy)
        const finalDamage = this.damage * this.damageMultiplier
        enemy.takeDamage(finalDamage)
      }
    })
  }

  update(delta: number) {
    // Reduce attack cooldown
    if (this.attackCooldown > 0) {
      this.attackCooldown -= delta
    }
  }

  private die() {
    console.log('Agent: Died!')
    // Emit event for scene to handle
    this.emit('died')
  }
}

// Forward declaration for Enemy
export interface Enemy {
  active: boolean
  x: number
  y: number
  takeDamage(damage: number): void
  getRadius(): number
}
