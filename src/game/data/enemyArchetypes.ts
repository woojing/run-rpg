import { COLORS } from '../constants'

/**
 * Enemy archetype types
 */
export enum EnemyArchetype {
  RUSHER = 'rusher',
  SNIPER = 'sniper',
  ELITE = 'elite'
}

/**
 * Configuration for each enemy archetype
 */
export interface ArchetypeConfig {
  // Core stats
  hp: number
  speed: number
  damage: number
  attackRange: number
  attackCooldownMax: number

  // Special properties (archetype-specific)
  projectileSpeed?: number
  projectileRange?: number
  chargeTelegraphTime?: number
  chargeSpeed?: number
  chargeDuration?: number

  // Visuals
  color: number
  radius: number
}

/**
 * Archetype configurations
 * Based on PRD section 11: 전투 밸런스
 */
export const ARCHETYPES: { [key in EnemyArchetype]: ArchetypeConfig } = {
  [EnemyArchetype.RUSHER]: {
    // Basic melee enemy
    hp: 25,
    speed: 120,
    damage: 8,
    attackRange: 18,
    attackCooldownMax: 1000,
    color: COLORS.enemy,
    radius: 20
  },

  [EnemyArchetype.SNIPER]: {
    // Ranged enemy that maintains distance
    hp: 18,
    speed: 80,
    damage: 12,
    attackRange: 220,
    attackCooldownMax: 1500,
    projectileSpeed: 300,
    projectileRange: 250,
    color: COLORS.sniper,
    radius: 18
  },

  [EnemyArchetype.ELITE]: {
    // Tanky enemy with charge attack
    hp: 120,
    speed: 90,
    damage: 18,
    attackRange: 30,
    attackCooldownMax: 2000,
    chargeTelegraphTime: 800,
    chargeSpeed: 520,
    chargeDuration: 400,
    color: COLORS.elite,
    radius: 35
  }
}

/**
 * Spawn configuration for waves
 */
export interface WaveConfig {
  duration: number        // Wave duration in seconds
  spawnInterval: number   // Time between spawns in ms
  types: EnemyArchetype[] // Available enemy types
  chances?: { [key in EnemyArchetype]?: number } // Spawn chances (0-1)
}

/**
 * Wave configurations
 * Based on PRD section 11: 스폰
 */
export const WAVES: {
  wave1: WaveConfig
  wave2: WaveConfig
  wave3: WaveConfig
} = {
  wave1: {
    // 0-30s: Learning phase - Rushers only
    duration: 30,
    spawnInterval: 3000,
    types: [EnemyArchetype.RUSHER]
  },

  wave2: {
    // 30-70s: Judgment phase - Rushers + Snipers
    duration: 40,
    spawnInterval: 2500,
    types: [EnemyArchetype.RUSHER, EnemyArchetype.SNIPER],
    chances: {
      [EnemyArchetype.SNIPER]: 0.4 // 40% chance
    }
  },

  wave3: {
    // 70-120s: Final test - All types + Elites
    duration: 50,
    spawnInterval: 2000,
    types: [EnemyArchetype.RUSHER, EnemyArchetype.SNIPER, EnemyArchetype.ELITE],
    chances: {
      [EnemyArchetype.ELITE]: 0.2,  // 20% chance
      [EnemyArchetype.SNIPER]: 0.3  // 30% chance (remaining 50% = Rusher)
    }
  }
}
