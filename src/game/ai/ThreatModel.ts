import { Agent } from '../entities/Agent.js'
import { Enemy } from '../entities/Enemy.js'

export class ThreatModel {
  /**
   * Calculate threat scores for all enemies
   * Returns a map of enemy -> threat score (higher = more threatening)
   */
  calculateThreats(agent: Agent, enemies: Enemy[]): Map<Enemy, number> {
    const scores = new Map<Enemy, number>()

    enemies.forEach(enemy => {
      if (!enemy.active) return

      let score = 0

      // Distance factor: closer = more threatening
      const dist = Phaser.Math.Distance.Between(agent.x, agent.y, enemy.x, enemy.y)
      score += (1000 / (dist + 1)) * 2.0

      // DPS factor (from damage stat)
      score += enemy.damage * 1.5

      // Low HP enemies are less threatening (they're about to die)
      if (enemy.hp < enemy.maxHp * 0.3) {
        score *= 0.5
      }

      scores.set(enemy, score)
    })

    return scores
  }

  /**
   * Get the primary threat (highest score)
   */
  getPrimaryThreat(agent: Agent, enemies: Enemy[]): Enemy | null {
    const threats = this.calculateThreats(agent, enemies)

    if (threats.size === 0) return null

    let maxScore = -Infinity
    let primaryThreat: Enemy | null = null

    threats.forEach((score, enemy) => {
      if (score > maxScore) {
        maxScore = score
        primaryThreat = enemy
      }
    })

    return primaryThreat
  }

  /**
   * Get top N threats sorted by score
   */
  getTopThreats(agent: Agent, enemies: Enemy[], count: number): Enemy[] {
    const threats = this.calculateThreats(agent, enemies)

    const sorted = Array.from(threats.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, count)
      .map(([enemy]) => enemy)

    return sorted
  }
}
