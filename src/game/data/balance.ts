// Balance configuration - all tunable values in one place
// This file will be expanded in later commits

export const BALANCE = {
  // Run settings
  runDuration: 120, // seconds

  // Agent stats (will be expanded in C3)
  agent: {
    maxHp: 100,
    baseDamage: 10
  },

  // Debug flags
  debug: {
    showColliders: false,
    godMode: false
  }
} as const
