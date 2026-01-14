import { Strategy } from './Strategy.js'
import { ThreatModel } from './ThreatModel.js'
import { Steering } from './Steering.js'
import { Agent } from '../entities/Agent.js'
import { Enemy } from '../entities/Enemy.js'

/**
 * AgentAI - Finite State Machine for 4 strategy behaviors
 *
 * Each strategy has a distinct behavior pattern:
 * - ENGAGE: Aggressive forward combat, prioritize closest threats
 * - GUARD: Defensive, reduce damage, hold position
 * - EVADE: Mobility, dodge threats, maintain safe distance
 * - BURST: High damage window, then fatigue
 */
export class AgentAI {
  currentStrategy: Strategy = Strategy.ENGAGE
  threatModel: ThreatModel

  // Strategy state tracking
  private burstActive: boolean = false
  private burstFatigue: boolean = false
  private postEvadeWindow: boolean = false
  private specialCooldown: number = 0

  constructor() {
    this.threatModel = new ThreatModel()
  }

  setStrategy(strategy: Strategy) {
    this.currentStrategy = strategy
    console.log(`AgentAI: Strategy changed to ${strategy}`)

    // Reset burst state when leaving BURST
    if (strategy !== Strategy.BURST) {
      this.burstActive = false
      this.burstFatigue = false
    }
  }

  update(agent: Agent, enemies: Enemy[], dt: number) {
    // Reduce cooldowns
    if (this.specialCooldown > 0) {
      this.specialCooldown -= dt
    }

    // Execute strategy
    switch (this.currentStrategy) {
      case Strategy.ENGAGE:
        this.updateEngage(agent, enemies, dt)
        break
      case Strategy.GUARD:
        this.updateGuard(agent, enemies, dt)
        break
      case Strategy.EVADE:
        this.updateEvade(agent, enemies, dt)
        break
      case Strategy.BURST:
        this.updateBurst(agent, enemies, dt)
        break
    }
  }

  /**
   * ENGAGE: Aggressive forward combat
   * - Seek primary threat
   * - Use dash attack when ready
   * - Basic attack in range
   */
  private updateEngage(agent: Agent, enemies: Enemy[], dt: number) {
    const target = this.threatModel.getPrimaryThreat(agent, enemies)

    if (target) {
      // Move toward target
      const velocity = Steering.seek(agent.x, agent.y, target.x, target.y, agent.moveSpeed)
      this.applyVelocity(agent, velocity)

      // Use special: Dash attack (when ready and in range)
      const dist = Phaser.Math.Distance.Between(agent.x, agent.y, target.x, target.y)
      if (this.specialCooldown <= 0 && dist < 200) {
        this.dashAttack(agent, target)
      }
    }

    // Always basic attack when in range
    agent.basicAttack(enemies)
  }

  /**
   * GUARD: Defensive damage reduction
   * - Hold position or slow backward movement
   * - Take 50% less damage
   * - Counter-attack when HP > 50%
   */
  private updateGuard(agent: Agent, enemies: Enemy[], dt: number) {
    const target = this.threatModel.getPrimaryThreat(agent, enemies)

    if (target) {
      // Count nearby enemies
      const nearbyCount = this.countEnemiesInRange(agent, enemies, 150)

      if (nearbyCount >= 3) {
        // Too many enemies - slow retreat
        const velocity = Steering.flee(agent.x, agent.y, target.x, target.y, agent.moveSpeed * 0.5)
        this.applyVelocity(agent, velocity)
      } else {
        // Hold position
        this.applyVelocity(agent, Steering.stop())
      }

      // Apply damage reduction
      agent.damageReduction = 0.5
    }

    // Counter-attack only when healthy
    if (agent.hp > agent.maxHp * 0.5) {
      agent.basicAttack(enemies)
    }
  }

  /**
   * EVADE: Mobility and repositioning
   * - Maintain safe distance (200px)
   * - Dash away when too close
   * - Post-evade counter-attack bonus
   */
  private updateEvade(agent: Agent, enemies: Enemy[], dt: number) {
    const nearest = this.findNearestEnemy(agent, enemies)

    if (nearest) {
      const dist = Phaser.Math.Distance.Between(agent.x, agent.y, nearest.x, nearest.y)

      // Dash away if too close
      if (dist < 150 && this.specialCooldown <= 0) {
        this.dashEvade(agent)
        return
      }

      // Maintain safe distance
      let velocity: { x: number; y: number }
      if (dist < 200) {
        // Too close - flee
        velocity = Steering.flee(agent.x, agent.y, nearest.x, nearest.y, agent.moveSpeed * 1.2)
      } else if (dist > 300) {
        // Too far - approach
        velocity = Steering.seek(agent.x, agent.y, nearest.x, nearest.y, agent.moveSpeed * 0.8)
      } else {
        // Good distance - orbit
        velocity = Steering.orbit(agent.x, agent.y, nearest.x, nearest.y, 250, agent.moveSpeed * 0.6)
      }

      this.applyVelocity(agent, velocity)
    }

    // Post-evade counter-attack (0.8s window after dash)
    if (this.postEvadeWindow) {
      agent.basicAttack(enemies) // Bonus damage handled in Agent
    }
  }

  /**
   * BURST: High damage window, then fatigue
   * - Activate burst for 1.5s (attack speed +50%, damage +30%)
   * - Then 1.0s fatigue (attack speed -50%, move speed -40%)
   */
  private updateBurst(agent: Agent, enemies: Enemy[], dt: number) {
    const target = this.threatModel.getPrimaryThreat(agent, enemies)

    if (!this.burstActive && !this.burstFatigue && this.specialCooldown <= 0) {
      // Activate burst
      this.activateBurst(agent)
      return
    }

    if (target) {
      const dist = Phaser.Math.Distance.Between(agent.x, agent.y, target.x, target.y)

      // Optimize distance (not too close, not too far)
      let velocity: { x: number; y: number }
      if (dist < 80) {
        velocity = Steering.flee(agent.x, agent.y, target.x, target.y, agent.moveSpeed * 0.5)
      } else if (dist > 150) {
        velocity = Steering.seek(agent.x, agent.y, target.x, target.y, agent.moveSpeed * 1.1)
      } else {
        velocity = Steering.orbit(agent.x, agent.y, target.x, target.y, 115, agent.moveSpeed)
      }

      this.applyVelocity(agent, velocity)
    }

    // Rapid attacks during burst, no attacks during fatigue
    if (this.burstActive) {
      agent.basicAttack(enemies) // Cooldown reduced in burst mode
    }
  }

  // ========== Special Abilities ==========

  private dashAttack(agent: Agent, target: Enemy) {
    this.specialCooldown = 2000 // 2s cooldown

    // Quick dash toward target
    const angle = Phaser.Math.Angle.Between(agent.x, agent.y, target.x, target.y)
    const velocity = {
      x: Math.cos(angle) * 420, // Dash speed
      y: Math.sin(angle) * 420
    }

    const body = agent.body as Phaser.Physics.Arcade.Body
    body.setVelocity(velocity.x, velocity.y)

    // Stop dash after 180ms
    agent.scene.time.delayedCall(180, () => {
      body.setVelocity(0, 0)
    })

    console.log('AgentAI: Engage dash attack')
  }

  private dashEvade(agent: Agent) {
    this.specialCooldown = 1000 // 1s cooldown

    // Find nearest threat and dash away
    const nearest = this.findNearestEnemy(agent, [])
    if (!nearest) return

    const angle = Phaser.Math.Angle.Between(nearest.x, nearest.y, agent.x, agent.y)
    const velocity = {
      x: Math.cos(angle) * 520, // Faster dash
      y: Math.sin(angle) * 520
    }

    const body = agent.body as Phaser.Physics.Arcade.Body
    body.setVelocity(velocity.x, velocity.y)

    // Invulnerability window (120ms)
    agent.invulnerable = true
    agent.scene.time.delayedCall(120, () => {
      agent.invulnerable = false
      body.setVelocity(0, 0)

      // Post-evade counter-attack window (800ms)
      this.postEvadeWindow = true
      agent.scene.time.delayedCall(800, () => {
        this.postEvadeWindow = false
      })
    })

    console.log('AgentAI: Evade dash')
  }

  private activateBurst(agent: Agent) {
    this.burstActive = true
    this.specialCooldown = 3000 // 3s total (1.5s burst + 1s fatigue + buffer)

    // Apply burst bonuses
    agent.attackCooldownMax = 300 // 50% faster (600 -> 300)
    agent.damageMultiplier = 1.3

    // End burst after 1.5s, start fatigue
    agent.scene.time.delayedCall(1500, () => {
      this.burstActive = false
      this.burstFatigue = true

      // Apply fatigue penalties
      agent.attackCooldownMax = 900 // 50% slower (600 -> 900)
      agent.moveSpeed = agent.baseSpeed * 0.6

      // End fatigue after 1s
      agent.scene.time.delayedCall(1000, () => {
        this.burstFatigue = false

        // Reset to normal
        agent.attackCooldownMax = 600
        agent.damageMultiplier = 1.0
        agent.moveSpeed = agent.baseSpeed
      })
    })

    console.log('AgentAI: Burst activated')
  }

  // ========== Helper Methods ==========

  private applyVelocity(agent: Agent, velocity: { x: number; y: number }) {
    const body = agent.body as Phaser.Physics.Arcade.Body
    body.setVelocity(velocity.x, velocity.y)
  }

  private countEnemiesInRange(agent: Agent, enemies: Enemy[], range: number): number {
    return enemies.filter(enemy => {
      if (!enemy.active) return false
      const dist = Phaser.Math.Distance.Between(agent.x, agent.y, enemy.x, enemy.y)
      return dist <= range
    }).length
  }

  private findNearestEnemy(agent: Agent, enemies: Enemy[]): Enemy | null {
    let nearest: Enemy | null = null
    let minDist = Infinity

    enemies.forEach(enemy => {
      if (!enemy.active) return
      const dist = Phaser.Math.Distance.Between(agent.x, agent.y, enemy.x, enemy.y)
      if (dist < minDist) {
        minDist = dist
        nearest = enemy
      }
    })

    return nearest
  }
}
