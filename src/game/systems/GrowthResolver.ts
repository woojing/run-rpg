import { TelemetryData } from './Telemetry.js'
import { PlaystyleProfile, getTraitsForProfile } from '../data/growthTraits.js'
import { Strategy } from '../ai/Strategy.js'

/**
 * Result of profile resolution
 */
export interface GrowthResult {
  profile: PlaystyleProfile
  grantedTraits: string[]
  explanations: string[]
}

/**
 * Growth Resolver - Analyzes telemetry and determines profile + traits
 * Based on PRD section 10.1: 프로필 판정(스코어링)
 */
export class GrowthResolver {
  /**
   * Analyze telemetry and determine profile with traits
   */
  resolve(telemetry: TelemetryData): GrowthResult {
    // Calculate profile scores
    const profile = this.calculateProfile(telemetry)

    // Get traits based on profile
    const traitIds = getTraitsForProfile(profile)

    // Generate explanations
    const explanations = this.generateExplanations(telemetry, profile, traitIds)

    return {
      profile,
      grantedTraits: traitIds,
      explanations
    }
  }

  /**
   * Calculate profile scores from telemetry
   * Based on PRD section 10.1 algorithm
   */
  private calculateProfile(telemetry: TelemetryData): PlaystyleProfile {
    // Get total run time in minutes
    const runDurationMinutes = telemetry.runDuration / 60

    // ========== DODGE SCORE ==========
    // Formula: (evadeSuccessRate * 60) + (evadeCountPerMinute * 20 * 40)
    const evadeSuccessRate = telemetry.evadeCount > 0
      ? (telemetry.evadeSuccessCount / telemetry.evadeCount) * 100
      : 0

    const evadeCountPerMinute = runDurationMinutes > 0
      ? telemetry.evadeCount / runDurationMinutes
      : 0

    const dodgeScore = (evadeSuccessRate * 0.6) + (evadeCountPerMinute * 20 * 0.4)

    // ========== AGGRESSION SCORE ==========
    // Formula: (burstActivationsPerMinute * 15) + (engageTimePercent * 50)
    const burstActivationsPerMinute = runDurationMinutes > 0
      ? telemetry.burstActivations / runDurationMinutes
      : 0

    const strategyPercentages = this.getStrategyPercentages(telemetry)
    const engageTimePercent = strategyPercentages[Strategy.ENGAGE] || 0

    const aggressionScore = (burstActivationsPerMinute * 15) + (engageTimePercent * 0.5)

    // ========== DEFENSE SCORE ==========
    // Formula: (guardTimePercent * 70) + (timeBelowHp30Percent * -30)
    const guardTimePercent = strategyPercentages[Strategy.GUARD] || 0

    const timeBelowHp30Percent = telemetry.runDuration > 0
      ? (telemetry.timeBelowHp30 / (telemetry.runDuration * 1000)) * 100
      : 0

    const defenseScore = (guardTimePercent * 0.7) - (timeBelowHp30Percent * 0.3)

    // Clamp scores to 0-100
    const clampedDodge = Math.max(0, Math.min(100, dodgeScore))
    const clampedAggression = Math.max(0, Math.min(100, aggressionScore))
    const clampedDefense = Math.max(0, Math.min(100, defenseScore))

    // ========== DETERMINE PROFILE NAME ==========
    const profileName = this.determineProfileName(
      clampedDodge,
      clampedAggression,
      clampedDefense
    )

    // Count sniper deaths
    const sniperDeaths = telemetry.killsByArchetype['Sniper'] || 0

    return {
      dodgeScore: Math.round(clampedDodge),
      aggressionScore: Math.round(clampedAggression),
      defenseScore: Math.round(clampedDefense),
      sniperDeaths,
      profileName
    }
  }

  /**
   * Determine profile name based on dominant scores
   */
  private determineProfileName(
    dodge: number,
    aggression: number,
    defense: number
  ): string {
    const threshold = 60

    // Count how many scores are above threshold
    const highScores = [
      dodge >= threshold ? 'dodge' : null,
      aggression >= threshold ? 'aggression' : null,
      defense >= threshold ? 'defense' : null
    ].filter(Boolean)

    if (highScores.length === 0) {
      return 'Balanced'
    }

    if (highScores.length === 1) {
      // Single dominant style
      if (dodge >= threshold) return 'Dodge-Counter'
      if (aggression >= threshold) return 'Aggro-Burst'
      if (defense >= threshold) return 'Shield-Control'
    }

    // Multiple high scores - hybrid profiles
    if (dodge >= threshold && aggression >= threshold) {
      return 'Skirmisher' // High dodge + aggression
    }
    if (dodge >= threshold && defense >= threshold) {
      return 'Tactician' // High dodge + defense
    }
    if (aggression >= threshold && defense >= threshold) {
      return 'Brawler' // High aggression + defense
    }

    // All three high
    return 'Master'
  }

  /**
   * Generate explanations for why traits were granted
   */
  private generateExplanations(
    telemetry: TelemetryData,
    profile: PlaystyleProfile,
    traits: string[]
  ): string[] {
    const explanations: string[] = []

    const runDurationMinutes = telemetry.runDuration / 60

    // Dodge explanations
    if (profile.dodgeScore >= 60) {
      const evadeSuccessRate = telemetry.evadeCount > 0
        ? Math.round((telemetry.evadeSuccessCount / telemetry.evadeCount) * 100)
        : 0

      const evadeCountPerMinute = runDurationMinutes > 0
        ? Math.round(telemetry.evadeCount / runDurationMinutes)
        : 0

      explanations.push(
        `회피 성공률 ${evadeSuccessRate}% (${telemetry.evadeSuccessCount}/${telemetry.evadeCount}) → 회피-반격 트레잇 부여`
      )
      explanations.push(
        `분당 회피 ${evadeCountPerMinute}회 → Evasion 강화`
      )
    }

    // Aggression explanations
    if (profile.aggressionScore >= 60) {
      const strategyPercentages = this.getStrategyPercentages(telemetry)
      const engagePercent = Math.round(strategyPercentages[Strategy.ENGAGE] || 0)

      const burstPerMinute = runDurationMinutes > 0
        ? Math.round(telemetry.burstActivations / runDurationMinutes)
        : 0

      explanations.push(
        `Engage 유지 ${engagePercent}% + 분당 Burst ${burstPerMinute}회 → 공격형 트레잇 부여`
      )
    }

    // Defense explanations
    if (profile.defenseScore >= 60) {
      const strategyPercentages = this.getStrategyPercentages(telemetry)
      const guardPercent = Math.round(strategyPercentages[Strategy.GUARD] || 0)

      const avgHp = telemetry.runDuration > 0
        ? Math.round(100 - (telemetry.damageTakenTotal / 100))
        : 100

      explanations.push(
        `Guard 유지 ${guardPercent}% + 평균 체력 유지 ${avgHp}% → 방어형 트레잇 부여`
      )
    }

    // Sniper death explanation
    if (profile.sniperDeaths >= 3) {
      explanations.push(
        `Sniper에게 ${profile.sniperDeaths}회 사망 → 위협도 재조정 트레잇 부여`
      )
    }

    // Damage dealt explanation
    const totalKills = Object.values(telemetry.killsByArchetype).reduce((a, b) => a + b, 0)
    if (totalKills > 0) {
      explanations.push(
        `총 처치: ${totalKills} (Rusher: ${telemetry.killsByArchetype['Rusher']}, ` +
        `Sniper: ${telemetry.killsByArchetype['Sniper']}, Elite: ${telemetry.killsByArchetype['Elite']})`
      )
    }

    return explanations
  }

  /**
   * Calculate strategy time percentages
   */
  private getStrategyPercentages(telemetry: TelemetryData): { [key in Strategy]: number } {
    const totalTime = Object.values(telemetry.strategyTime).reduce((a, b) => a + b, 0)

    return {
      [Strategy.ENGAGE]: totalTime > 0 ? (telemetry.strategyTime[Strategy.ENGAGE] / totalTime) * 100 : 0,
      [Strategy.GUARD]: totalTime > 0 ? (telemetry.strategyTime[Strategy.GUARD] / totalTime) * 100 : 0,
      [Strategy.EVADE]: totalTime > 0 ? (telemetry.strategyTime[Strategy.EVADE] / totalTime) * 100 : 0,
      [Strategy.BURST]: totalTime > 0 ? (telemetry.strategyTime[Strategy.BURST] / totalTime) * 100 : 0
    }
  }
}
