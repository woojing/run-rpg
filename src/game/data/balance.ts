/**
 * Balance configuration - all tunable values in one place
 * Based on PRD section 11: 전투 밸런스
 */

export const BALANCE = {
  // ========== Run Settings ==========
  runDuration: 120, // seconds (90-180s range for tuning)

  // ========== Agent Stats ==========
  agent: {
    maxHp: 100,
    baseDamage: 10,
    moveSpeed: 140,
    baseSpeed: 140,
    attackCooldownMax: 600, // ms
    attackRange: 60 // px
  },

  // ========== Agent Abilities ==========
  abilities: {
    engage: {
      dashCooldown: 2000, // ms
      dashSpeed: 420,
      dashDuration: 180 // ms
    },
    guard: {
      damageReduction: 0.5 // 50%
    },
    evade: {
      dashCooldown: 1000, // ms
      dashSpeed: 520,
      invulnerabilityWindow: 120, // ms
      postEvadeWindow: 800 // ms - counterattack window
    },
    burst: {
      cooldown: 3000, // ms
      burstDuration: 1500, // ms
      fatigueDuration: 1000, // ms
      damageMultiplier: 1.3,
      attackSpeedMultiplier: 0.5, // 50% faster (cooldown * 0.5)
      fatigueSpeedPenalty: 0.4 // 40% slower
    }
  },

  // ========== Enemy Stats ==========
  enemies: {
    rusher: {
      hp: 25,
      speed: 120,
      damage: 8,
      attackRange: 18,
      attackCooldownMax: 1000 // ms
    },
    sniper: {
      hp: 18,
      speed: 80,
      damage: 12,
      attackRange: 220,
      attackCooldownMax: 1500, // ms
      projectileSpeed: 300, // px/s
      projectileRange: 250, // px
      projectileRadius: 8, // px
      optimalRangeMin: 180, // px - preferred distance
      optimalRangeMax: 220 // px
    },
    elite: {
      hp: 120,
      speed: 90,
      damage: 18,
      attackRange: 30,
      attackCooldownMax: 2000, // ms
      chargeTelegraphTime: 800, // ms
      chargeSpeed: 520, // px/s
      chargeDuration: 400, // ms
      chargeRangeMin: 50, // px - minimum distance to start charge
      chargeRangeMax: 150 // px
    }
  },

  // ========== Spawn Settings ==========
  spawning: {
    wave1: {
      duration: 30, // seconds (0-30s)
      spawnInterval: 3000, // ms
      types: ['rusher']
    },
    wave2: {
      duration: 40, // seconds (30-70s)
      spawnInterval: 2500, // ms
      types: ['rusher', 'sniper'],
      sniperChance: 0.4 // 40% chance
    },
    wave3: {
      duration: 50, // seconds (70-120s)
      spawnInterval: 2000, // ms
      types: ['rusher', 'sniper', 'elite'],
      eliteChance: 0.2, // 20% chance
      sniperChance: 0.3 // 30% chance (remaining 50% = rusher)
    }
  },

  // ========== Environmental Hazards ==========
  hazards: {
    electricBarrier: {
      damagePerSecond: 20,
      width: 20, // px - damage zone width
      positions: [
        // Hardcoded barrier positions for POC
        { x1: 200, y1: 200, x2: 400, y2: 400 },    // Top-left diagonal
        { x1: 1720, y1: 200, x2: 1520, y2: 400 },  // Top-right diagonal
        { x1: 200, y1: 880, x2: 400, y2: 680 },    // Bottom-left diagonal
        { x1: 1720, y1: 880, x2: 1520, y2: 680 }   // Bottom-right diagonal
      ]
    }
  },

  // ========== Growth System (C6) ==========
  growth: {
    profiles: {
      dodge: {
        threshold: 60, // score 0-100
        traits: ['T1_PHANTOM_TRACE', 'T2_REFLEX_BURST']
      },
      aggression: {
        threshold: 60,
        traits: ['T3_OVERCLOCK_CHARGE', 'T4_BLOOD_EXCHANGE']
      },
      defense: {
        threshold: 60,
        traits: ['T5_ADAPTIVE_SHIELD']
      },
      sniperKiller: {
        // Special profile: high sniper deaths
        threshold: 3, // 3+ deaths to snipers
        traits: ['T6_THREAT_REDIRECT']
      }
    },
    traits: {
      phantomTrace: {
        damageReduction: 0.5, // 50%
        duration: 800 // ms
      },
      reflexBurst: {
        damageBonus: 0.4, // 40%
        duration: 800 // ms
      },
      overclockCharge: {
        dashDistanceBonus: 0.25, // 25%
        knockbackBonus: 0.2 // 20%
      },
      bloodExchange: {
        lifestealPercent: 0.03 // 3%
      },
      adaptiveShield: {
        staminaRegenBonus: 1.5 // 50% faster (placeholder - stamina not implemented yet)
      },
      threatRedirect: {
        sniperThreatWeightReduction: 0.5 // 50% reduction
      }
    },
    maxTraits: 4, // Maximum traits to grant per run
    minTraits: 2  // Minimum traits to grant per run
  },

  // ========== Debug Flags ==========
  debug: {
    showColliders: false,
    godMode: false,
    showThreatLines: false,
    showDamageNumbers: false,
    infiniteBurst: false // Burst never goes on cooldown
  }
} as const
