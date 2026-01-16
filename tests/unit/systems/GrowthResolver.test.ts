import { describe, it, expect } from 'vitest'
import { GrowthResolver } from '@/game/systems/GrowthResolver'
import { TelemetryData } from '@/game/systems/Telemetry'
import { Strategy } from '@/game/ai/Strategy'

describe('GrowthResolver', () => {
  const resolver = new GrowthResolver()

  describe('dodge score calculation', () => {
    it('should calculate high dodge score from high evade success rate', () => {
      const telemetry: TelemetryData = {
        strategyTime: {
          [Strategy.ENGAGE]: 0,
          [Strategy.GUARD]: 0,
          [Strategy.EVADE]: 60000,
          [Strategy.BURST]: 0
        },
        strategySwitchCount: 0,
        timeBelowHp30: 0,
        hitsTakenCount: 0,
        damageTakenTotal: 0,
        evadeCount: 20,
        evadeSuccessCount: 19,
        damageDealtTotal: 0,
        killsByArchetype: { Rusher: 0, Sniper: 0, Elite: 0 },
        burstActivations: 0,
        sniperKillTimeAvg: 0,
        runDuration: 60, // 1 minute
        runResult: 'victory'
      }

      const result = resolver.resolve(telemetry)

      expect(result.profile.dodgeScore).toBeGreaterThan(60)
      expect(result.profile.profileName).toContain('Dodge')
    })

    it('should calculate dodge score with high evade frequency', () => {
      const telemetry: TelemetryData = {
        strategyTime: {
          [Strategy.ENGAGE]: 0,
          [Strategy.GUARD]: 0,
          [Strategy.EVADE]: 60000,
          [Strategy.BURST]: 0
        },
        strategySwitchCount: 0,
        timeBelowHp30: 0,
        hitsTakenCount: 5,
        damageTakenTotal: 50,
        evadeCount: 30, // High evade count
        evadeSuccessCount: 20,
        damageDealtTotal: 0,
        killsByArchetype: { Rusher: 0, Sniper: 0, Elite: 0 },
        burstActivations: 0,
        sniperKillTimeAvg: 0,
        runDuration: 60, // 1 minute
        runResult: 'victory'
      }

      const result = resolver.resolve(telemetry)

      // Should have high dodge score from frequency alone
      expect(result.profile.dodgeScore).toBeGreaterThan(50)
    })
  })

  describe('aggression score calculation', () => {
    it('should calculate high aggression score from burst and engage', () => {
      const telemetry: TelemetryData = {
        strategyTime: {
          [Strategy.ENGAGE]: 50000, // 83% engage time
          [Strategy.GUARD]: 0,
          [Strategy.EVADE]: 0,
          [Strategy.BURST]: 10000
        },
        strategySwitchCount: 0,
        timeBelowHp30: 0,
        hitsTakenCount: 0,
        damageTakenTotal: 0,
        evadeCount: 0,
        evadeSuccessCount: 0,
        damageDealtTotal: 0,
        killsByArchetype: { Rusher: 0, Sniper: 0, Elite: 0 },
        burstActivations: 10, // High burst
        sniperKillTimeAvg: 0,
        runDuration: 60, // 1 minute
        runResult: 'victory'
      }

      const result = resolver.resolve(telemetry)

      expect(result.profile.aggressionScore).toBeGreaterThan(60)
      expect(result.profile.profileName).toContain('Aggro')
    })

    it('should grant aggression traits when score >= 60', () => {
      const telemetry: TelemetryData = {
        strategyTime: {
          [Strategy.ENGAGE]: 50000,
          [Strategy.GUARD]: 0,
          [Strategy.EVADE]: 0,
          [Strategy.BURST]: 10000
        },
        strategySwitchCount: 0,
        timeBelowHp30: 0,
        hitsTakenCount: 0,
        damageTakenTotal: 0,
        evadeCount: 0,
        evadeSuccessCount: 0,
        damageDealtTotal: 0,
        killsByArchetype: { Rusher: 0, Sniper: 0, Elite: 0 },
        burstActivations: 10,
        sniperKillTimeAvg: 0,
        runDuration: 60,
        runResult: 'victory'
      }

      const result = resolver.resolve(telemetry)

      expect(result.grantedTraits).toContain('T3_OVERCLOCK_CHARGE')
      expect(result.grantedTraits).toContain('T4_BLOOD_EXCHANGE')
    })
  })

  describe('defense score calculation', () => {
    it('should calculate high defense score from guard time', () => {
      const telemetry: TelemetryData = {
        strategyTime: {
          [Strategy.ENGAGE]: 0,
          [Strategy.GUARD]: 55000, // 92% guard time
          [Strategy.EVADE]: 0,
          [Strategy.BURST]: 5000
        },
        strategySwitchCount: 0,
        timeBelowHp30: 0,
        hitsTakenCount: 0,
        damageTakenTotal: 0,
        evadeCount: 0,
        evadeSuccessCount: 0,
        damageDealtTotal: 0,
        killsByArchetype: { Rusher: 0, Sniper: 0, Elite: 0 },
        burstActivations: 0,
        sniperKillTimeAvg: 0,
        runDuration: 60,
        runResult: 'victory'
      }

      const result = resolver.resolve(telemetry)

      // 92% * 0.7 = 64.4, should be >= 60
      expect(result.profile.defenseScore).toBeGreaterThan(60)
      expect(result.profile.profileName).toContain('Shield')
    })

    it('should reduce defense score for high time below 30% HP', () => {
      const telemetry: TelemetryData = {
        strategyTime: {
          [Strategy.ENGAGE]: 0,
          [Strategy.GUARD]: 50000,
          [Strategy.EVADE]: 0,
          [Strategy.BURST]: 10000
        },
        strategySwitchCount: 0,
        timeBelowHp30: 30000, // 30 seconds below 30% HP
        hitsTakenCount: 0,
        damageTakenTotal: 0,
        evadeCount: 0,
        evadeSuccessCount: 0,
        damageDealtTotal: 0,
        killsByArchetype: { Rusher: 0, Sniper: 0, Elite: 0 },
        burstActivations: 0,
        sniperKillTimeAvg: 0,
        runDuration: 60,
        runResult: 'victory'
      }

      const result = resolver.resolve(telemetry)

      // Defense score should be reduced due to low HP time
      expect(result.profile.defenseScore).toBeLessThan(70)
    })
  })

  describe('profile determination', () => {
    it('should return Balanced when all scores below threshold', () => {
      const telemetry: TelemetryData = {
        strategyTime: {
          [Strategy.ENGAGE]: 15000,
          [Strategy.GUARD]: 15000,
          [Strategy.EVADE]: 15000,
          [Strategy.BURST]: 15000
        },
        strategySwitchCount: 0,
        timeBelowHp30: 0,
        hitsTakenCount: 0,
        damageTakenTotal: 0,
        evadeCount: 1,
        evadeSuccessCount: 0,
        damageDealtTotal: 0,
        killsByArchetype: { Rusher: 0, Sniper: 0, Elite: 0 },
        burstActivations: 0,
        sniperKillTimeAvg: 0,
        runDuration: 60,
        runResult: 'victory'
      }

      const result = resolver.resolve(telemetry)

      expect(result.profile.profileName).toBe('Balanced')
      expect(result.grantedTraits).toHaveLength(0)
    })

    it('should return Aggro-Burst with high aggression', () => {
      const telemetry: TelemetryData = {
        strategyTime: {
          [Strategy.ENGAGE]: 50000,
          [Strategy.GUARD]: 0,
          [Strategy.EVADE]: 0,
          [Strategy.BURST]: 10000
        },
        strategySwitchCount: 0,
        timeBelowHp30: 0,
        hitsTakenCount: 0,
        damageTakenTotal: 0,
        evadeCount: 0,
        evadeSuccessCount: 0,
        damageDealtTotal: 0,
        killsByArchetype: { Rusher: 0, Sniper: 0, Elite: 0 },
        burstActivations: 10,
        sniperKillTimeAvg: 0,
        runDuration: 60,
        runResult: 'victory'
      }

      const result = resolver.resolve(telemetry)

      expect(result.profile.profileName).toBe('Aggro-Burst')
    })

    it('should return Dodge-Counter with high dodge', () => {
      const telemetry: TelemetryData = {
        strategyTime: {
          [Strategy.ENGAGE]: 0,
          [Strategy.GUARD]: 0,
          [Strategy.EVADE]: 60000,
          [Strategy.BURST]: 0
        },
        strategySwitchCount: 0,
        timeBelowHp30: 0,
        hitsTakenCount: 0,
        damageTakenTotal: 0,
        evadeCount: 20,
        evadeSuccessCount: 19,
        damageDealtTotal: 0,
        killsByArchetype: { Rusher: 0, Sniper: 0, Elite: 0 },
        burstActivations: 0,
        sniperKillTimeAvg: 0,
        runDuration: 60,
        runResult: 'victory'
      }

      const result = resolver.resolve(telemetry)

      expect(result.profile.profileName).toBe('Dodge-Counter')
    })

    it('should return Shield-Control with high defense', () => {
      const telemetry: TelemetryData = {
        strategyTime: {
          [Strategy.ENGAGE]: 0,
          [Strategy.GUARD]: 55000, // 92% guard time
          [Strategy.EVADE]: 0,
          [Strategy.BURST]: 5000
        },
        strategySwitchCount: 0,
        timeBelowHp30: 0,
        hitsTakenCount: 0,
        damageTakenTotal: 0,
        evadeCount: 0,
        evadeSuccessCount: 0,
        damageDealtTotal: 0,
        killsByArchetype: { Rusher: 0, Sniper: 0, Elite: 0 },
        burstActivations: 0,
        sniperKillTimeAvg: 0,
        runDuration: 60,
        runResult: 'victory'
      }

      const result = resolver.resolve(telemetry)

      expect(result.profile.profileName).toBe('Shield-Control')
    })

    it('should return Skirmisher with high dodge + aggression', () => {
      const telemetry: TelemetryData = {
        strategyTime: {
          [Strategy.ENGAGE]: 30000,
          [Strategy.GUARD]: 0,
          [Strategy.EVADE]: 30000,
          [Strategy.BURST]: 0
        },
        strategySwitchCount: 0,
        timeBelowHp30: 0,
        hitsTakenCount: 0,
        damageTakenTotal: 0,
        evadeCount: 20,
        evadeSuccessCount: 19,
        damageDealtTotal: 0,
        killsByArchetype: { Rusher: 0, Sniper: 0, Elite: 0 },
        burstActivations: 10,
        sniperKillTimeAvg: 0,
        runDuration: 60,
        runResult: 'victory'
      }

      const result = resolver.resolve(telemetry)

      expect(result.profile.profileName).toBe('Skirmisher')
    })
  })

  describe('trait assignment', () => {
    it('should grant dodge traits when dodge score >= 60', () => {
      const telemetry: TelemetryData = {
        strategyTime: {
          [Strategy.ENGAGE]: 0,
          [Strategy.GUARD]: 0,
          [Strategy.EVADE]: 60000,
          [Strategy.BURST]: 0
        },
        strategySwitchCount: 0,
        timeBelowHp30: 0,
        hitsTakenCount: 0,
        damageTakenTotal: 0,
        evadeCount: 20,
        evadeSuccessCount: 19,
        damageDealtTotal: 0,
        killsByArchetype: { Rusher: 0, Sniper: 0, Elite: 0 },
        burstActivations: 0,
        sniperKillTimeAvg: 0,
        runDuration: 60,
        runResult: 'victory'
      }

      const result = resolver.resolve(telemetry)

      expect(result.grantedTraits).toContain('T1_PHANTOM_TRACE')
      expect(result.grantedTraits).toContain('T2_REFLEX_BURST')
    })

    it('should grant aggression traits when aggression score >= 60', () => {
      const telemetry: TelemetryData = {
        strategyTime: {
          [Strategy.ENGAGE]: 50000,
          [Strategy.GUARD]: 0,
          [Strategy.EVADE]: 0,
          [Strategy.BURST]: 10000
        },
        strategySwitchCount: 0,
        timeBelowHp30: 0,
        hitsTakenCount: 0,
        damageTakenTotal: 0,
        evadeCount: 0,
        evadeSuccessCount: 0,
        damageDealtTotal: 0,
        killsByArchetype: { Rusher: 0, Sniper: 0, Elite: 0 },
        burstActivations: 10,
        sniperKillTimeAvg: 0,
        runDuration: 60,
        runResult: 'victory'
      }

      const result = resolver.resolve(telemetry)

      expect(result.grantedTraits).toContain('T3_OVERCLOCK_CHARGE')
      expect(result.grantedTraits).toContain('T4_BLOOD_EXCHANGE')
    })

    it('should grant defense traits when defense score >= 60', () => {
      const telemetry: TelemetryData = {
        strategyTime: {
          [Strategy.ENGAGE]: 0,
          [Strategy.GUARD]: 55000, // 92% guard time
          [Strategy.EVADE]: 0,
          [Strategy.BURST]: 5000
        },
        strategySwitchCount: 0,
        timeBelowHp30: 0,
        hitsTakenCount: 0,
        damageTakenTotal: 0,
        evadeCount: 0,
        evadeSuccessCount: 0,
        damageDealtTotal: 0,
        killsByArchetype: { Rusher: 0, Sniper: 0, Elite: 0 },
        burstActivations: 0,
        sniperKillTimeAvg: 0,
        runDuration: 60,
        runResult: 'victory'
      }

      const result = resolver.resolve(telemetry)

      expect(result.grantedTraits).toContain('T5_ADAPTIVE_SHIELD')
    })

    it('should grant threat redirect trait with 3+ sniper deaths', () => {
      const telemetry: TelemetryData = {
        strategyTime: {
          [Strategy.ENGAGE]: 15000,
          [Strategy.GUARD]: 15000,
          [Strategy.EVADE]: 15000,
          [Strategy.BURST]: 15000
        },
        strategySwitchCount: 0,
        timeBelowHp30: 0,
        hitsTakenCount: 0,
        damageTakenTotal: 0,
        evadeCount: 0,
        evadeSuccessCount: 0,
        damageDealtTotal: 0,
        killsByArchetype: { Rusher: 0, Sniper: 3, Elite: 0 },
        burstActivations: 0,
        sniperKillTimeAvg: 0,
        runDuration: 60,
        runResult: 'victory'
      }

      const result = resolver.resolve(telemetry)

      expect(result.grantedTraits).toContain('T6_THREAT_REDIRECT')
    })

    it('should not grant threat redirect trait with less than 3 sniper deaths', () => {
      const telemetry: TelemetryData = {
        strategyTime: {
          [Strategy.ENGAGE]: 15000,
          [Strategy.GUARD]: 15000,
          [Strategy.EVADE]: 15000,
          [Strategy.BURST]: 15000
        },
        strategySwitchCount: 0,
        timeBelowHp30: 0,
        hitsTakenCount: 0,
        damageTakenTotal: 0,
        evadeCount: 0,
        evadeSuccessCount: 0,
        damageDealtTotal: 0,
        killsByArchetype: { Rusher: 0, Sniper: 2, Elite: 0 },
        burstActivations: 0,
        sniperKillTimeAvg: 0,
        runDuration: 60,
        runResult: 'victory'
      }

      const result = resolver.resolve(telemetry)

      expect(result.grantedTraits).not.toContain('T6_THREAT_REDIRECT')
    })
  })

  describe('explanations', () => {
    it('should generate dodge explanations', () => {
      const telemetry: TelemetryData = {
        strategyTime: {
          [Strategy.ENGAGE]: 0,
          [Strategy.GUARD]: 0,
          [Strategy.EVADE]: 60000,
          [Strategy.BURST]: 0
        },
        strategySwitchCount: 0,
        timeBelowHp30: 0,
        hitsTakenCount: 0,
        damageTakenTotal: 0,
        evadeCount: 20,
        evadeSuccessCount: 19,
        damageDealtTotal: 0,
        killsByArchetype: { Rusher: 0, Sniper: 0, Elite: 0 },
        burstActivations: 0,
        sniperKillTimeAvg: 0,
        runDuration: 60,
        runResult: 'victory'
      }

      const result = resolver.resolve(telemetry)

      expect(result.explanations.length).toBeGreaterThan(0)
      expect(result.explanations.some(e => e.includes('회피'))).toBe(true)
    })

    it('should generate kill statistics', () => {
      const telemetry: TelemetryData = {
        strategyTime: {
          [Strategy.ENGAGE]: 15000,
          [Strategy.GUARD]: 15000,
          [Strategy.EVADE]: 15000,
          [Strategy.BURST]: 15000
        },
        strategySwitchCount: 0,
        timeBelowHp30: 0,
        hitsTakenCount: 0,
        damageTakenTotal: 0,
        evadeCount: 0,
        evadeSuccessCount: 0,
        damageDealtTotal: 0,
        killsByArchetype: { Rusher: 5, Sniper: 2, Elite: 1 },
        burstActivations: 0,
        sniperKillTimeAvg: 0,
        runDuration: 60,
        runResult: 'victory'
      }

      const result = resolver.resolve(telemetry)

      expect(result.explanations.some(e => e.includes('총 처치: 8'))).toBe(true)
    })
  })
})
