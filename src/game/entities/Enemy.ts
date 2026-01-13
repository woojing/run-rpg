import Phaser from 'phaser'
import { COLORS } from '../constants.js'

export class Enemy extends Phaser.GameObjects.Container {
  public body!: Phaser.Physics.Arcade.Body

  // Stats
  hp: number
  maxHp: number
  damage: number
  speed: number
  attackRange: number

  // Combat
  attackCooldown: number = 0
  attackCooldownMax: number = 1000 // ms

  // Visual
  graphics!: Phaser.GameObjects.Graphics
  hpBar!: Phaser.GameObjects.Graphics

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y)
    this.scene.add.existing(this)
    this.scene.physics.add.existing(this)

    // Base enemy stats (Rusher archetype)
    this.hp = 25
    this.maxHp = 25
    this.damage = 8
    this.speed = 120
    this.attackRange = 18

    // Setup physics body
    const body = this.body as Phaser.Physics.Arcade.Body
    body.setCircle(20)
    body.setCollideWorldBounds(true)
    body.setMaxSpeed(this.speed)

    this.createVisuals()
  }

  private createVisuals() {
    // Red square for Enemy
    this.graphics = this.scene.add.graphics()
    this.graphics.fillStyle(COLORS.enemy, 1)
    this.graphics.fillRect(-20, -20, 40, 40)
    this.add(this.graphics)

    // HP bar
    this.hpBar = this.scene.add.graphics()
    this.add(this.hpBar)

    this.updateHpBar()
  }

  private updateHpBar() {
    this.hpBar.clear()

    const barWidth = 40
    const barHeight = 4
    const barY = -30

    // Background
    this.hpBar.fillStyle(0x333333, 1)
    this.hpBar.fillRect(-barWidth / 2, barY, barWidth, barHeight)

    // Health
    const healthPercent = this.hp / this.maxHp
    const healthWidth = barWidth * healthPercent

    this.hpBar.fillStyle(0xff3333, 1)
    this.hpBar.fillRect(-barWidth / 2, barY, healthWidth, barHeight)
  }

  update(agent: Agent, delta: number) {
    if (!agent.active) return

    // Reduce attack cooldown
    if (this.attackCooldown > 0) {
      this.attackCooldown -= delta
    }

    // Move toward agent
    const angle = Phaser.Math.Angle.Between(this.x, this.y, agent.x, agent.y)
    const velocity = this.scene.physics.velocityFromRotation(angle, this.speed)

    const body = this.body as Phaser.Physics.Arcade.Body
    body.setVelocity(velocity.x, velocity.y)

    // Attack if in range
    const dist = Phaser.Math.Distance.Between(this.x, this.y, agent.x, agent.y)
    if (dist <= this.attackRange + 40 && this.attackCooldown <= 0) {
      this.meleeAttack(agent)
    }
  }

  meleeAttack(agent: Agent) {
    this.attackCooldown = this.attackCooldownMax

    // Visual feedback
    this.graphics.fillStyle(0xffffff, 1)
    this.graphics.fillRect(-20, -20, 40, 40)

    this.scene.time.delayedCall(100, () => {
      this.graphics.clear()
      this.graphics.fillStyle(COLORS.enemy, 1)
      this.graphics.fillRect(-20, -20, 40, 40)
    })

    // Deal damage
    agent.takeDamage(this.damage)
  }

  takeDamage(amount: number) {
    this.hp -= amount

    // Visual feedback
    this.scene.tweens.add({
      targets: this.graphics,
      alpha: 0.5,
      duration: 50,
      yoyo: true
    })

    this.updateHpBar()

    if (this.hp <= 0) {
      this.die()
    }
  }

  getRadius(): number {
    return 20
  }

  private die() {
    // Death animation - fade out
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      scale: 0.5,
      duration: 300,
      onComplete: () => {
        this.destroy()
      }
    })

    // Disable physics
    const body = this.body as Phaser.Physics.Arcade.Body
    body.stop()
    this.active = false
  }
}

// Import Agent to avoid circular dependency
import { Agent } from './Agent.js'
