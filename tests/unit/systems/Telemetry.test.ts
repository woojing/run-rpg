import { describe, it, expect, beforeEach } from 'vitest'
import { Telemetry } from '@/game/systems/Telemetry'
import { Strategy } from '@/game/ai/Strategy'

// Mock Enemy class for testing
class MockEnemy {
  archetype: string
  constructor(archetype: string) {
    this.archetype = archetype
  }
}

describe('Telemetry', () => {
  let telemetry: Telemetry

  beforeEach(() => {
    telemetry = new Telemetry()
  })

  describe('initialization', () => {
    it('should initialize with zero values', () => {
      expect(telemetry.data.hitsTakenCount).toBe(0)
      expect(telemetry.data.damageTakenTotal).toBe(0)
      expect(telemetry.data.evadeCount).toBe(0)
      expect(telemetry.data.runResult).toBe('victory')
      expect(telemetry.data.runDuration).toBe(0)
    })

    it('should initialize all strategy times to zero', () => {
      expect(telemetry.data.strategyTime[Strategy.ENGAGE]).toBe(0)
      expect(telemetry.data.strategyTime[Strategy.GUARD]).toBe(0)
      expect(telemetry.data.strategyTime[Strategy.EVADE]).toBe(0)
      expect(telemetry.data.strategyTime[Strategy.BURST]).toBe(0)
    })

    it('should initialize kill counts to zero', () => {
      expect(telemetry.data.killsByArchetype['Rusher']).toBe(0)
      expect(telemetry.data.killsByArchetype['Sniper']).toBe(0)
      expect(telemetry.data.killsByArchetype['Elite']).toBe(0)
    })
  })

  describe('recordDamageTaken', () => {
    it('should increment hit count and damage total', () => {
      telemetry.recordDamageTaken(10, 90, 100, 16)

      expect(telemetry.data.hitsTakenCount).toBe(1)
      expect(telemetry.data.damageTakenTotal).toBe(10)
    })

    it('should accumulate multiple damage events', () => {
      telemetry.recordDamageTaken(10, 90, 100, 16)
      telemetry.recordDamageTaken(20, 70, 100, 16)

      expect(telemetry.data.hitsTakenCount).toBe(2)
      expect(telemetry.data.damageTakenTotal).toBe(30)
    })

    it('should track damage for death flow verification', () => {
      // Simulate damage before death
      telemetry.recordDamageTaken(30, 70, 100, 16)
      expect(telemetry.data.damageTakenTotal).toBe(30)

      // Fatal damage
      telemetry.recordDamageTaken(70, 0, 100, 16)
      expect(telemetry.data.damageTakenTotal).toBe(100)
      expect(telemetry.data.hitsTakenCount).toBe(2)
    })
  })

  describe('recordStrategyTime', () => {
    it('should accumulate time for each strategy', () => {
      telemetry.recordStrategyTime(Strategy.ENGAGE, 1000)
      telemetry.recordStrategyTime(Strategy.ENGAGE, 500)

      expect(telemetry.data.strategyTime[Strategy.ENGAGE]).toBe(1500)
    })

    it('should track multiple strategies independently', () => {
      telemetry.recordStrategyTime(Strategy.ENGAGE, 1000)
      telemetry.recordStrategyTime(Strategy.GUARD, 2000)
      telemetry.recordStrategyTime(Strategy.EVADE, 500)

      expect(telemetry.data.strategyTime[Strategy.ENGAGE]).toBe(1000)
      expect(telemetry.data.strategyTime[Strategy.GUARD]).toBe(2000)
      expect(telemetry.data.strategyTime[Strategy.EVADE]).toBe(500)
    })
  })

  describe('recordEvade and recordEvadeSuccess', () => {
    it('should increment evade count', () => {
      telemetry.recordEvade(1000)
      telemetry.recordEvade(2000)

      expect(telemetry.data.evadeCount).toBe(2)
    })

    it('should track successful evades', () => {
      telemetry.recordEvade(1000)
      telemetry.recordEvadeSuccess()

      telemetry.recordEvade(2000)
      telemetry.recordEvadeSuccess()

      expect(telemetry.data.evadeCount).toBe(2)
      expect(telemetry.data.evadeSuccessCount).toBe(2)
    })

    it('should calculate evade success rate', () => {
      telemetry.recordEvade(1000)
      telemetry.recordEvadeSuccess()

      telemetry.recordEvade(2000)
      // No success for second evade

      expect(telemetry.getEvadeSuccessRate()).toBe(50)
    })

    it('should return 0 success rate when no evades', () => {
      expect(telemetry.getEvadeSuccessRate()).toBe(0)
    })
  })

  describe('recordKill', () => {
    it('should increment kill count for archetype', () => {
      const rusher = new MockEnemy('rusher') as any
      telemetry.recordKill(rusher, 5000)

      expect(telemetry.data.killsByArchetype['Rusher']).toBe(1)
    })

    it('should track sniper kill times', () => {
      const sniper = new MockEnemy('sniper') as any
      telemetry.recordKill(sniper, 5000)
      telemetry.recordKill(sniper, 10000)

      const result = telemetry.finalizeRun(120, 'victory')
      expect(result.sniperKillTimeAvg).toBe(7500)
    })

    it('should handle multiple archetypes', () => {
      const rusher = new MockEnemy('rusher') as any
      const sniper = new MockEnemy('sniper') as any
      const elite = new MockEnemy('elite') as any

      telemetry.recordKill(rusher, 5000)
      telemetry.recordKill(sniper, 6000)
      telemetry.recordKill(rusher, 7000)
      telemetry.recordKill(elite, 8000)

      expect(telemetry.data.killsByArchetype['Rusher']).toBe(2)
      expect(telemetry.data.killsByArchetype['Sniper']).toBe(1)
      expect(telemetry.data.killsByArchetype['Elite']).toBe(1)
    })

    it('should handle undefined archetype gracefully', () => {
      const enemyWithoutArchetype = { archetype: undefined } as any

      // Should not throw error
      expect(() => {
        telemetry.recordKill(enemyWithoutArchetype, 5000)
      }).not.toThrow()

      expect(telemetry.data.killsByArchetype['Unknown']).toBe(1)
    })

    it('should handle empty string archetype', () => {
      const enemyWithEmptyArchetype = { archetype: '' } as any

      // Should not throw error
      expect(() => {
        telemetry.recordKill(enemyWithEmptyArchetype, 5000)
      }).not.toThrow()

      // Empty string becomes 'Unknown'
      expect(telemetry.data.killsByArchetype['Unknown']).toBe(1)
    })
  })

  describe('recordBurstActivation', () => {
    it('should increment burst activation count', () => {
      telemetry.recordBurstActivation()
      telemetry.recordBurstActivation()

      expect(telemetry.data.burstActivations).toBe(2)
    })
  })

  describe('finalizeRun', () => {
    it('should set duration and result', () => {
      const result = telemetry.finalizeRun(120, 'defeat')

      expect(result.runDuration).toBe(120)
      expect(result.runResult).toBe('defeat')
    })

    it('should set result to victory', () => {
      const result = telemetry.finalizeRun(90, 'victory')

      expect(result.runDuration).toBe(90)
      expect(result.runResult).toBe('victory')
    })

    it('should calculate average sniper kill time', () => {
      const sniper = new MockEnemy('sniper') as any
      telemetry.recordKill(sniper, 5000)
      telemetry.recordKill(sniper, 10000)

      const result = telemetry.finalizeRun(120, 'victory')

      expect(result.sniperKillTimeAvg).toBe(7500)
    })

    it('should return 0 for sniper avg when no sniper kills', () => {
      const result = telemetry.finalizeRun(120, 'victory')

      expect(result.sniperKillTimeAvg).toBe(0)
    })

    it('should support death flow with defeat result', () => {
      // Simulate taking damage then dying
      telemetry.recordDamageTaken(30, 70, 100, 16)
      telemetry.recordDamageTaken(70, 0, 100, 16)

      const result = telemetry.finalizeRun(45, 'defeat')

      expect(result.runResult).toBe('defeat')
      expect(result.runDuration).toBe(45)
      expect(result.hitsTakenCount).toBe(2)
      expect(result.damageTakenTotal).toBe(100)
    })
  })

  describe('getStrategyPercentages', () => {
    it('should calculate percentage distribution', () => {
      telemetry.recordStrategyTime(Strategy.ENGAGE, 1000)
      telemetry.recordStrategyTime(Strategy.GUARD, 1000)
      telemetry.recordStrategyTime(Strategy.EVADE, 2000)

      const percentages = telemetry.getStrategyPercentages()

      expect(percentages[Strategy.ENGAGE]).toBe(25)
      expect(percentages[Strategy.GUARD]).toBe(25)
      expect(percentages[Strategy.EVADE]).toBe(50)
      expect(percentages[Strategy.BURST]).toBe(0)
    })

    it('should return 0 for all strategies when no time recorded', () => {
      const percentages = telemetry.getStrategyPercentages()

      expect(percentages[Strategy.ENGAGE]).toBe(0)
      expect(percentages[Strategy.GUARD]).toBe(0)
      expect(percentages[Strategy.EVADE]).toBe(0)
      expect(percentages[Strategy.BURST]).toBe(0)
    })

    it('should handle 100% single strategy', () => {
      telemetry.recordStrategyTime(Strategy.ENGAGE, 5000)

      const percentages = telemetry.getStrategyPercentages()

      expect(percentages[Strategy.ENGAGE]).toBe(100)
      expect(percentages[Strategy.GUARD]).toBe(0)
      expect(percentages[Strategy.EVADE]).toBe(0)
      expect(percentages[Strategy.BURST]).toBe(0)
    })
  })

  describe('recordTimeBelowHp30', () => {
    it('should accumulate time below 30% HP', () => {
      telemetry.recordTimeBelowHp30(100)
      telemetry.recordTimeBelowHp30(200)

      expect(telemetry.data.timeBelowHp30).toBe(300)
    })
  })

  describe('recordDamageDealt', () => {
    it('should accumulate damage dealt', () => {
      telemetry.recordDamageDealt(50)
      telemetry.recordDamageDealt(30)

      expect(telemetry.data.damageDealtTotal).toBe(80)
    })
  })

  describe('reset', () => {
    it('should reset all data to initial values', () => {
      telemetry.recordDamageTaken(10, 90, 100, 16)
      telemetry.recordStrategyTime(Strategy.ENGAGE, 1000)
      telemetry.recordEvade(1000)

      telemetry.reset()

      expect(telemetry.data.hitsTakenCount).toBe(0)
      expect(telemetry.data.damageTakenTotal).toBe(0)
      expect(telemetry.data.strategyTime[Strategy.ENGAGE]).toBe(0)
      expect(telemetry.data.evadeCount).toBe(0)
    })
  })
})
