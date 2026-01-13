import { Agent } from '../entities/Agent.js'
import { Enemy } from '../entities/Enemy.js'

export class CombatSystem {
  checkMeleeHit(agent: Agent, enemies: Enemy[]): void {
    // Check if agent can attack (cooldown ready)
    if (agent.attackCooldown > 0) return

    // Find enemies in range
    const enemiesInRange = enemies.filter(enemy => {
      if (!enemy.active) return false

      const dist = Phaser.Math.Distance.Between(agent.x, agent.y, enemy.x, enemy.y)
      return dist <= agent.attackRange + enemy.getRadius()
    })

    // Attack if enemies in range
    if (enemiesInRange.length > 0) {
      agent.basicAttack(enemies)
    }
  }

  checkContactDamage(agent: Agent, enemies: Enemy[]): void {
    // Contact damage is handled in Enemy.update() - enemies attack when in range
    // This method can be used for additional effects or validation
  }
}
