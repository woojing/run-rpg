import Phaser from 'phaser'
import { EnemyArchetype, ARCHETYPES, ArchetypeConfig } from '../data/enemyArchetypes.js'

export class Enemy extends Phaser.GameObjects.Container {
  public body!: Phaser.Physics.Arcade.Body

  // Archetype
  archetype: EnemyArchetype
  config: ArchetypeConfig

  // Stats
  hp: number
  maxHp: number
  damage: number
  speed: number
  attackRange: number

  // Combat
  attackCooldown: number = 0
  attackCooldownMax: number

  // AI state for Elite charge
  isCharging: boolean = false
  chargeTelegraphTimer: number = 0
  telegraphGraphics?: Phaser.GameObjects.Graphics

  // Projectile tracking for Sniper
  projectiles: Phaser.GameObjects.Container[] = []

  // Visual
  graphics!: Phaser.GameObjects.Graphics
  hpBar!: Phaser.GameObjects.Graphics

  constructor(scene: Phaser.Scene, x: number, y: number, archetype: EnemyArchetype = EnemyArchetype.RUSHER) {
    super(scene, x, y)
    this.scene.add.existing(this)

    // Set archetype and config
    this.archetype = archetype
    this.config = ARCHETYPES[archetype]

    // Apply archetype stats
    this.hp = this.config.hp
    this.maxHp = this.config.hp
    this.damage = this.config.damage
    this.speed = this.config.speed
    this.attackRange = this.config.attackRange
    this.attackCooldownMax = this.config.attackCooldownMax

    // Setup physics body
    this.scene.physics.add.existing(this)
    const body = this.body as Phaser.Physics.Arcade.Body
    body.setCircle(this.config.radius)
    body.setCollideWorldBounds(true)
    body.setMaxSpeed(this.speed)

    this.createVisuals()
  }

  private createVisuals() {
    const radius = this.config.radius

    // Draw enemy based on archetype
    this.graphics = this.scene.add.graphics()
    this.graphics.fillStyle(this.config.color, 1)

    if (this.archetype === EnemyArchetype.SNIPER) {
      // Triangle for Sniper
      this.graphics.fillTriangle(0, -radius, -radius, radius, radius, radius)
    } else if (this.archetype === EnemyArchetype.ELITE) {
      // Hexagon for Elite
      this.graphics.beginPath()
      for (let i = 0; i < 6; i++) {
        const angle = (i * 60 - 90) * Math.PI / 180
        const x = Math.cos(angle) * radius
        const y = Math.sin(angle) * radius
        if (i === 0) {
          this.graphics.moveTo(x, y)
        } else {
          this.graphics.lineTo(x, y)
        }
      }
      this.graphics.closePath()
      this.graphics.fillPath()
    } else {
      // Square for Rusher
      this.graphics.fillRect(-radius, -radius, radius * 2, radius * 2)
    }

    this.add(this.graphics)

    // HP bar
    this.hpBar = this.scene.add.graphics()
    this.add(this.hpBar)

    this.updateHpBar()
  }

  private updateHpBar() {
    this.hpBar.clear()

    const barWidth = this.config.radius * 2
    const barHeight = 4
    const barY = -this.config.radius - 10

    // Background
    this.hpBar.fillStyle(0x333333, 1)
    this.hpBar.fillRect(-barWidth / 2, barY, barWidth, barHeight)

    // Health
    const healthPercent = this.hp / this.maxHp
    const healthWidth = barWidth * healthPercent

    this.hpBar.fillStyle(this.config.color, 1)
    this.hpBar.fillRect(-barWidth / 2, barY, healthWidth, barHeight)
  }

  update(agent: Agent, delta: number) {
    if (!agent.active) return

    // Reduce attack cooldown
    if (this.attackCooldown > 0) {
      this.attackCooldown -= delta
    }

    // Route to archetype-specific AI
    switch (this.archetype) {
      case EnemyArchetype.RUSHER:
        this.updateRusher(agent, delta)
        break
      case EnemyArchetype.SNIPER:
        this.updateSniper(agent, delta)
        break
      case EnemyArchetype.ELITE:
        this.updateElite(agent, delta)
        break
    }
  }

  // ==================== RUSHER AI ====================
  private updateRusher(agent: Agent, delta: number) {
    const dist = Phaser.Math.Distance.Between(this.x, this.y, agent.x, agent.y)

    // Move toward agent
    const angle = Phaser.Math.Angle.Between(this.x, this.y, agent.x, agent.y)
    const velocity = {
      x: Math.cos(angle) * this.speed,
      y: Math.sin(angle) * this.speed
    }

    const body = this.body as Phaser.Physics.Arcade.Body
    body.setVelocity(velocity.x, velocity.y)

    // Melee attack if in range
    if (dist <= this.attackRange + 40 && this.attackCooldown <= 0) {
      this.meleeAttack(agent)
    }
  }

  // ==================== SNIPER AI ====================
  private updateSniper(agent: Agent, delta: number) {
    const dist = Phaser.Math.Distance.Between(this.x, this.y, agent.x, agent.y)

    // Maintain optimal range (180-220px)
    if (dist < 150) {
      // Too close - flee
      this.fleeFromAgent(agent)
    } else if (dist > 240) {
      // Too far - approach slowly
      this.approachAgent(agent, 0.6)
    } else {
      // Good range - orbit slowly
      this.orbitAgent(agent, 210, 0.4)
    }

    // Fire projectile when ready and in range
    if (this.attackCooldown <= 0 && dist <= this.config.attackRange) {
      this.fireProjectile(agent)
    }
  }

  private fleeFromAgent(agent: Agent) {
    const angle = Phaser.Math.Angle.Between(agent.x, agent.y, this.x, this.y)
    const velocity = {
      x: Math.cos(angle) * this.speed,
      y: Math.sin(angle) * this.speed
    }

    const body = this.body as Phaser.Physics.Arcade.Body
    body.setVelocity(velocity.x, velocity.y)
  }

  private approachAgent(agent: Agent, speedMultiplier: number) {
    const angle = Phaser.Math.Angle.Between(this.x, this.y, agent.x, agent.y)
    const velocity = {
      x: Math.cos(angle) * this.speed * speedMultiplier,
      y: Math.sin(angle) * this.speed * speedMultiplier
    }

    const body = this.body as Phaser.Physics.Arcade.Body
    body.setVelocity(velocity.x, velocity.y)
  }

  private orbitAgent(agent: Agent, targetRadius: number, speedMultiplier: number) {
    const dist = Phaser.Math.Distance.Between(this.x, this.y, agent.x, agent.y)

    // Move toward or away to maintain target radius
    if (dist < targetRadius - 20) {
      this.approachAgent(agent, -speedMultiplier) // Back away
    } else if (dist > targetRadius + 20) {
      this.approachAgent(agent, speedMultiplier) // Move closer
    } else {
      // Maintain distance with slight strafing
      const angle = Phaser.Math.Angle.Between(this.x, this.y, agent.x, agent.y)
      const strafeAngle = angle + Math.PI / 2 // Perpendicular
      const velocity = {
        x: Math.cos(strafeAngle) * this.speed * speedMultiplier,
        y: Math.sin(strafeAngle) * this.speed * speedMultiplier
      }

      const body = this.body as Phaser.Physics.Arcade.Body
      body.setVelocity(velocity.x, velocity.y)
    }
  }

  private fireProjectile(agent: Agent) {
    this.attackCooldown = this.attackCooldownMax

    // Create projectile visual - use Graphics directly with physics
    const projectile = this.scene.add.graphics()
    projectile.fillStyle(0xffff00, 1)
    projectile.fillCircle(0, 0, 8)
    projectile.setPosition(this.x, this.y)

    // Add physics to the graphics object
    this.scene.physics.add.existing(projectile)

    const projBody = projectile.body as Phaser.Physics.Arcade.Body
    projBody.setCircle(8)
    projBody.setCollideWorldBounds(true)

    // Calculate velocity toward agent
    const angle = Phaser.Math.Angle.Between(this.x, this.y, agent.x, agent.y)
    const velocity = {
      x: Math.cos(angle) * this.config.projectileSpeed!,
      y: Math.sin(angle) * this.config.projectileSpeed!
    }
    projBody.setVelocity(velocity.x, velocity.y)

    // Track projectile
    this.projectiles.push(projectile as any)

    // Auto-destruct after range/time
    const lifetime = this.config.projectileRange! / this.config.projectileSpeed! * 1000
    this.scene.time.delayedCall(lifetime, () => {
      if (projectile.active) {
        projectile.destroy()
        this.projectiles = this.projectiles.filter(p => p !== projectile)
      }
    })

    // Collision detection with agent
    this.scene.physics.add.overlap(projBody, agent.body, () => {
      if (!agent.invulnerable) {
        agent.takeDamage(this.damage)
      }
      projectile.destroy()
      this.projectiles = this.projectiles.filter(p => p !== projectile)
    })
  }

  // ==================== ELITE AI ====================
  private updateElite(agent: Agent, delta: number) {
    // Handle charging state
    if (this.isCharging) {
      this.chargeTelegraphTimer -= delta
      if (this.chargeTelegraphTimer <= 0) {
        this.executeCharge(agent)
      }
      return
    }

    const dist = Phaser.Math.Distance.Between(this.x, this.y, agent.x, agent.y)

    // Slow approach until in range
    if (dist > 100) {
      this.approachAgent(agent, 0.7)
    } else {
      // In range - slow movement
      const body = this.body as Phaser.Physics.Arcade.Body
      body.setVelocity(0, 0)
    }

    // Start charge when ready and in range
    if (this.attackCooldown <= 0 && dist < 150 && dist > 50) {
      this.startCharge(agent)
    }

    // Melee attack if very close and not charging
    if (dist <= this.attackRange + 40 && this.attackCooldown <= 0 && !this.isCharging) {
      this.meleeAttack(agent)
    }
  }

  private startCharge(agent: Agent) {
    this.isCharging = true
    this.chargeTelegraphTimer = this.config.chargeTelegraphTime!

    // Create telegraph visual (growing red circle)
    this.telegraphGraphics = this.scene.add.graphics()
    this.telegraphGraphics.lineStyle(4, 0xff0000, 1)
    this.telegraphGraphics.strokeCircle(0, 0, 0)
    this.add(this.telegraphGraphics)

    // Animate telegraph
    this.scene.tweens.add({
      targets: this.telegraphGraphics,
      scale: 3,
      duration: this.config.chargeTelegraphTime,
      onComplete: () => {
        if (this.telegraphGraphics) {
          this.telegraphGraphics.destroy()
          this.telegraphGraphics = undefined
        }
      }
    })
  }

  private executeCharge(agent: Agent) {
    this.attackCooldown = this.attackCooldownMax
    this.isCharging = false

    // Dash toward agent's current position
    const angle = Phaser.Math.Angle.Between(this.x, this.y, agent.x, agent.y)
    const velocity = {
      x: Math.cos(angle) * this.config.chargeSpeed!,
      y: Math.sin(angle) * this.config.chargeSpeed!
    }

    const body = this.body as Phaser.Physics.Arcade.Body
    body.setVelocity(velocity.x, velocity.y)

    // Stop after charge duration
    this.scene.time.delayedCall(this.config.chargeDuration!, () => {
      body.setVelocity(0, 0)
    })

    // Visual feedback
    this.graphics.clear()
    this.graphics.fillStyle(0xff6666, 1)
    const radius = this.config.radius
    this.graphics.fillRect(-radius, -radius, radius * 2, radius * 2)

    this.scene.time.delayedCall(200, () => {
      this.graphics.clear()
      this.graphics.fillStyle(this.config.color, 1)
      this.graphics.fillRect(-radius, -radius, radius * 2, radius * 2)
    })
  }

  // ==================== SHARED ====================
  meleeAttack(agent: Agent) {
    this.attackCooldown = this.attackCooldownMax

    // Visual feedback
    this.graphics.clear()
    this.graphics.fillStyle(0xffffff, 1)
    const radius = this.config.radius
    this.graphics.fillRect(-radius, -radius, radius * 2, radius * 2)

    this.scene.time.delayedCall(100, () => {
      this.graphics.clear()
      this.graphics.fillStyle(this.config.color, 1)
      if (this.archetype === EnemyArchetype.SNIPER) {
        this.graphics.fillTriangle(0, -radius, -radius, radius, radius, radius)
      } else if (this.archetype === EnemyArchetype.ELITE) {
        this.graphics.beginPath()
        for (let i = 0; i < 6; i++) {
          const angle = (i * 60 - 90) * Math.PI / 180
          const x = Math.cos(angle) * radius
          const y = Math.sin(angle) * radius
          if (i === 0) {
            this.graphics.moveTo(x, y)
          } else {
            this.graphics.lineTo(x, y)
          }
        }
        this.graphics.closePath()
        this.graphics.fillPath()
      } else {
        this.graphics.fillRect(-radius, -radius, radius * 2, radius * 2)
      }
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
    return this.config.radius
  }

  private die() {
    // Clean up telegraph if charging
    if (this.telegraphGraphics) {
      this.telegraphGraphics.destroy()
      this.telegraphGraphics = undefined
    }

    // Clean up projectiles
    this.projectiles.forEach(p => {
      if (p.active) p.destroy()
    })
    this.projectiles = []

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
