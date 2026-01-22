import { Strategy } from '../ai/Strategy.js'
import { Enemy } from '../entities/Enemy.js'

export interface TelemetryData {
  // Strategy usage
  strategyTime: { [key in Strategy]: number } // ms spent in each
  strategySwitchCount: number

  // Survival/danger
  timeBelowHp30: number // ms
  hitsTakenCount: number
  damageTakenTotal: number

  // Evasion
  evadeCount: number
  evadeSuccessCount: number // Successful = no damage 0.5s after evade

  // Offense
  damageDealtTotal: number
  killsByArchetype: { [key: string]: number }
  burstActivations: number

  // Performance metrics
  sniperKillTimeAvg: number // Avg time to kill snipers (placeholder for C7)

  // Run metadata
  runDuration: number // seconds
  runResult: 'victory' | 'defeat'
}

export class Telemetry {
  data: TelemetryData
  private strategySwitchTimestamps: number[] = []
  private evadeTimestamps: number[] = []
  private sniperKillTimes: number[] = []

  constructor() {
    this.data = this.initializeData()
  }

  private initializeData(): TelemetryData {
    return {
      strategyTime: {
        [Strategy.ENGAGE]: 0,
        [Strategy.GUARD]: 0,
        [Strategy.EVADE]: 0,
        [Strategy.BURST]: 0
      },
      strategySwitchCount: 0,
      timeBelowHp30: 0,
      hitsTakenCount: 0,
      damageTakenTotal: 0,
      evadeCount: 0,
      evadeSuccessCount: 0,
      damageDealtTotal: 0,
      killsByArchetype: {
        'Rusher': 0,
        'Sniper': 0,
        'Elite': 0,
        'Unknown': 0
      },
      burstActivations: 0,
      sniperKillTimeAvg: 0,
      runDuration: 0,
      runResult: 'victory'
    }
  }

  // ========== Recording Methods ==========

  recordStrategyChange(oldStrategy: Strategy, newStrategy: Strategy, time: number) {
    this.data.strategySwitchCount++
    this.strategySwitchTimestamps.push(time)
  }

  recordStrategyTime(strategy: Strategy, deltaTime: number) {
    this.data.strategyTime[strategy] += deltaTime
  }

  recordDamageTaken(amount: number, currentHp: number, maxHp: number, deltaTime: number) {
    this.data.hitsTakenCount++
    this.data.damageTakenTotal += amount
  }

  recordTimeBelowHp30(deltaTime: number) {
    this.data.timeBelowHp30 += deltaTime
  }

  recordEvade(time: number) {
    this.data.evadeCount++
    this.evadeTimestamps.push(time)
  }

  recordEvadeSuccess() {
    this.data.evadeSuccessCount++
  }

  recordDamageDealt(amount: number) {
    this.data.damageDealtTotal += amount
  }

  recordKill(enemy: Enemy, timeOfDeath: number) {
    // Read archetype from enemy (Rusher/Sniper/Elite)
    // Guard against undefined archetype
    const archetype = enemy.archetype || 'unknown'
    const archName = archetype.charAt(0).toUpperCase() + archetype.slice(1)
    this.data.killsByArchetype[archName]++

    // Track sniper kill times for performance metric
    if (enemy.archetype === 'sniper') {
      this.sniperKillTimes.push(timeOfDeath)
    }
  }

  recordBurstActivation() {
    this.data.burstActivations++
  }

  // ========== Finalization ==========

  finalizeRun(duration: number, result: 'victory' | 'defeat'): TelemetryData {
    this.data.runDuration = duration
    this.data.runResult = result

    // Calculate derived stats
    if (this.sniperKillTimes.length > 0) {
      this.data.sniperKillTimeAvg =
        this.sniperKillTimes.reduce((a, b) => a + b) / this.sniperKillTimes.length
    }

    return this.data
  }

  // ========== Utility Methods ==========

  getStrategyPercentages(): { [key in Strategy]: number } {
    const totalTime = Object.values(this.data.strategyTime).reduce((a, b) => a + b, 0)

    return {
      [Strategy.ENGAGE]: totalTime > 0 ? (this.data.strategyTime[Strategy.ENGAGE] / totalTime) * 100 : 0,
      [Strategy.GUARD]: totalTime > 0 ? (this.data.strategyTime[Strategy.GUARD] / totalTime) * 100 : 0,
      [Strategy.EVADE]: totalTime > 0 ? (this.data.strategyTime[Strategy.EVADE] / totalTime) * 100 : 0,
      [Strategy.BURST]: totalTime > 0 ? (this.data.strategyTime[Strategy.BURST] / totalTime) * 100 : 0
    }
  }

  getEvadeSuccessRate(): number {
    if (this.data.evadeCount === 0) return 0
    return (this.data.evadeSuccessCount / this.data.evadeCount) * 100
  }

  reset() {
    this.data = this.initializeData()
    this.strategySwitchTimestamps = []
    this.evadeTimestamps = []
    this.sniperKillTimes = []
  }
}
