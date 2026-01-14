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
  postEvadeTimer: number = 0 // For post-evade trait effects

  // Traits system
  activeTraits: Set<string> = new Set()
  traitModifiers: {
    // T1 PhantomTrace
    phantomTraceActive: boolean
    // T2 ReflexBurst
    reflexBurstActive: boolean
    // T3 OverclockCharge
    engageDashBonus: number
    knockbackBonus: number
    // T4 BloodExchange
    lifestealPercent: number
    // T5 AdaptiveShield
    guardBonus: boolean
    // T6 ThreatRedirect
    threatRedirectActive: boolean
  }

  // Visual
  graphics!: Phaser.GameObjects.Graphics
  hpBar!: Phaser.GameObjects.Graphics

  constructor(scene: Phaser.Scene, x: number, y: number, initialTraits: string[] = []) {
    super(scene, x, y)
    this.scene.add.existing(this)
    this.scene.physics.add.existing(this)

    // Initialize trait modifiers
    this.traitModifiers = {
      phantomTraceActive: false,
      reflexBurstActive: false,
      engageDashBonus: 0,
      knockbackBonus: 0,
      lifestealPercent: 0,
      guardBonus: false,
      threatRedirectActive: false
    }

    // Apply initial traits
    initialTraits.forEach(traitId => this.applyTrait(traitId))

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

    // Apply damage reduction
    let finalReduction = this.damageReduction

    // T1 PhantomTrace: Additional damage reduction in post-evade window
    if (this.traitModifiers.phantomTraceActive && this.postEvadeTimer > 0) {
      finalReduction += 0.5 // Additional 50% reduction
    }

    const reducedAmount = amount * (1 - finalReduction)
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

    // T2 ReflexBurst: Post-evade damage bonus
    let attackDamageMultiplier = this.damageMultiplier
    if (this.traitModifiers.reflexBurstActive && this.postEvadeTimer > 0) {
      attackDamageMultiplier += 0.4 // Additional 40% damage

      // Consume the post-evade window (one-time bonus)
      this.postEvadeTimer = 0
    }

    // Deal damage to enemies in range
    enemies.forEach(enemy => {
      if (!enemy.active) return

      const dist = Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y)
      if (dist <= this.attackRange + enemy.getRadius()) {
        // Apply damage multiplier (from BURST strategy + traits)
        const finalDamage = this.damage * attackDamageMultiplier
        enemy.takeDamage(finalDamage)

        // T4 BloodExchange: Lifesteal
        if (this.traitModifiers.lifestealPercent > 0) {
          const healAmount = finalDamage * this.traitModifiers.lifestealPercent
          this.heal(healAmount)
        }
      }
    })
  }

  heal(amount: number) {
    this.hp = Math.min(this.hp + amount, this.maxHp)
    this.updateHpBar()

    // Visual feedback - flash green
    this.scene.tweens.add({
      targets: this.graphics,
      alpha: 0.5,
      duration: 50,
      yoyo: true,
      onYoyo: () => {
        this.graphics.clear()
        this.graphics.fillStyle(COLORS.agent, 1)
        this.graphics.fillCircle(0, 0, 40)
      }
    })
  }

  update(delta: number) {
    // Reduce attack cooldown
    if (this.attackCooldown > 0) {
      this.attackCooldown -= delta
    }

    // Reduce post-evade timer
    if (this.postEvadeTimer > 0) {
      this.postEvadeTimer -= delta
    }
  }

  // ========== TRAIT SYSTEM ==========

  /**
   * Apply a trait to this agent
   */
  applyTrait(traitId: string) {
    if (this.activeTraits.has(traitId)) return // Already has this trait

    this.activeTraits.add(traitId)

    switch (traitId) {
      case 'T1_PHANTOM_TRACE':
        this.traitModifiers.phantomTraceActive = true
        break

      case 'T2_REFLEX_BURST':
        this.traitModifiers.reflexBurstActive = true
        break

      case 'T3_OVERCLOCK_CHARGE':
        this.traitModifiers.engageDashBonus = 0.25 // 25% bonus
        this.traitModifiers.knockbackBonus = 0.2 // 20% bonus
        break

      case 'T4_BLOOD_EXCHANGE':
        this.traitModifiers.lifestealPercent = 0.03 // 3% lifesteal
        break

      case 'T5_ADAPTIVE_SHIELD':
        this.traitModifiers.guardBonus = true
        break

      case 'T6_THREAT_REDIRECT':
        this.traitModifiers.threatRedirectActive = true
        break
    }

    console.log(`Agent: Applied trait ${traitId}`)
  }

  /**
   * Remove a trait from this agent
   */
  removeTrait(traitId: string) {
    if (!this.activeTraits.has(traitId)) return

    this.activeTraits.delete(traitId)

    switch (traitId) {
      case 'T1_PHANTOM_TRACE':
        this.traitModifiers.phantomTraceActive = false
        break

      case 'T2_REFLEX_BURST':
        this.traitModifiers.reflexBurstActive = false
        break

      case 'T3_OVERCLOCK_CHARGE':
        this.traitModifiers.engageDashBonus = 0
        this.traitModifiers.knockbackBonus = 0
        break

      case 'T4_BLOOD_EXCHANGE':
        this.traitModifiers.lifestealPercent = 0
        break

      case 'T5_ADAPTIVE_SHIELD':
        this.traitModifiers.guardBonus = false
        break

      case 'T6_THREAT_REDIRECT':
        this.traitModifiers.threatRedirectActive = false
        break
    }

    console.log(`Agent: Removed trait ${traitId}`)
  }

  /**
   * Check if agent has a specific trait
   */
  hasTrait(traitId: string): boolean {
    return this.activeTraits.has(traitId)
  }

  /**
   * Set post-evade window (for trait effects)
   */
  setPostEvadeWindow(duration: number) {
    this.postEvadeTimer = duration
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
