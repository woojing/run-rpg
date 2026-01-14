import Phaser from 'phaser'
import { COLORS } from '../constants.js'
import { Agent } from './Agent.js'

/**
 * Electric Barrier - Environmental Hazard
 * Neon line that deals continuous damage on contact
 */
export class ElectricBarrier extends Phaser.GameObjects.Container {
  isActive: boolean = true
  damagePerSecond: number = 20

  // Visual components
  private line!: Phaser.GameObjects.Graphics
  private glowLine!: Phaser.GameObjects.Graphics
  private particles!: Phaser.GameObjects.Particles.ParticleEmitter

  // Damage zone
  private damageZone!: Phaser.GameObjects.Zone

  // Barrier dimensions
  private x2: number
  private y2: number
  private length: number
  private angle: number

  constructor(scene: Phaser.Scene, x1: number, y1: number, x2: number, y2: number) {
    super(scene, x1, y1)
    this.x2 = x2
    this.y2 = y2

    // Calculate angle and length
    this.angle = Phaser.Math.Angle.Between(x1, y1, x2, y2)
    this.length = Phaser.Math.Distance.Between(x1, y1, x2, y2)

    this.createVisuals()
    this.createDamageZone()

    // Rotation
    this.setRotation(this.angle)
  }

  private createVisuals() {
    // Outer glow (thicker, more transparent)
    this.glowLine = this.scene.add.graphics()
    this.glowLine.lineStyle(8, COLORS.hazard, 0.3)
    this.glowLine.lineBetween(0, 0, this.length, 0)
    this.add(this.glowLine)

    // Main neon line
    this.line = this.scene.add.graphics()
    this.line.lineStyle(3, COLORS.hazard, 1)
    this.line.lineBetween(0, 0, this.length, 0)
    this.add(this.line)

    // Electric particles (simulated with simple shapes)
    this.createParticles()

    // Animate the barrier
    this.animateBarrier()
  }

  private createParticles() {
    // Create particle texture programmatically
    const particleTexture = this.scene.make.graphics({ x: 0, y: 0, add: false })
    particleTexture.fillStyle(0x00ffff, 1)
    particleTexture.fillCircle(4, 4, 4)
    particleTexture.generateTexture('electric-particle', 8, 8)
    particleTexture.destroy()

    // Particle emitter
    this.particles = this.scene.add.particles(0, 0, 'electric-particle', {
      lifespan: 400,
      speedX: { min: -30, max: 30 },
      speedY: { min: -30, max: 30 },
      scale: { start: 0.8, end: 0 },
      quantity: 1,
      frequency: 150,
      tint: COLORS.hazard,
      alpha: { start: 0.8, end: 0 },
      emitting: true
    }) as Phaser.GameObjects.Particles.ParticleEmitter

    // Position particles along the line
    this.particles.start()
    this.add(this.particles)

    // Move particles to random positions along the line
    this.scene.time.addEvent({
      delay: 200,
      callback: this.moveParticles,
      callbackScope: this,
      loop: true
    })
  }

  private moveParticles() {
    if (!this.particles || !this.particles.active) return

    const randomX = Math.random() * this.length
    this.particles.emitParticleAt(randomX, 0)
  }

  private animateBarrier() {
    // Pulse effect for glow
    this.scene.tweens.add({
      targets: this.glowLine,
      alpha: 0.6,
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    })

    // Flicker effect for main line
    this.scene.tweens.add({
      targets: this.line,
      alpha: 0.7,
      duration: 100,
      yoyo: true,
      repeat: -1,
      ease: 'Linear.none',
      onRepeat: () => {
        // Random flicker intensity
        this.line.alpha = 0.5 + Math.random() * 0.5
      }
    })
  }

  private createDamageZone() {
    // Create invisible zone for collision detection
    this.damageZone = this.scene.add.zone(
      this.length / 2,
      0,
      this.length,
      20  // Width of damage zone
    )
    this.scene.physics.add.existing(this.damageZone, true) // Static body
    this.add(this.damageZone)

    // Static body already has no gravity and is immovable
    // No need to call setAllowGravity on zone bodies
  }

  /**
   * Update barrier - check collision with agent and deal damage
   */
  update(delta: number, agent: Agent) {
    if (!this.isActive) return

    const zoneBody = this.damageZone.body as Phaser.Physics.Arcade.Body
    const agentBody = agent.body as Phaser.Physics.Arcade.Body

    // Check overlap with agent
    const overlap = this.scene.physics.overlap(zoneBody, agentBody)

    if (overlap && !agent.invulnerable) {
      // Calculate damage based on delta time (damagePerSecond * seconds)
      const damage = this.damagePerSecond * (delta / 1000)
      agent.takeDamage(damage)
    }
  }

  /**
   * Activate/deactivate the barrier
   */
  setActive(active: boolean) {
    this.isActive = active
    this.setVisible(active)
  }

  /**
   * Clean up when destroyed
   */
  destroy() {
    if (this.particles) {
      this.particles.stop()
      this.particles.destroy()
    }

    // Remove particle texture
    if (this.scene.textures.exists('electric-particle')) {
      this.scene.textures.remove('electric-particle')
    }

    super.destroy()
  }
}
