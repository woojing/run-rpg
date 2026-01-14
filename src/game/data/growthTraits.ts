import { Agent } from '../entities/Agent.js'

/**
 * Trait categories for profile matching
 */
export enum TraitCategory {
  DEFENSIVE = 'defensive',
  OFFENSIVE = 'offensive',
  MOBILITY = 'mobility',
  UTILITY = 'utility'
}

/**
 * Trait definition with effect functions
 */
export interface TraitDefinition {
  id: string
  name: string
  description: string
  category: TraitCategory

  // Function to apply trait effects to agent
  apply: (agent: Agent) => void

  // Function to remove trait effects from agent
  remove: (agent: Agent) => void

  // Whether trait is stackable (POC: all non-stackable)
  stackable: boolean
}

/**
 * All 6 traits defined in PRD
 * Based on PRD section 10.2: 트레잇(POC 6개)
 */
export const TRAITS: { [key: string]: TraitDefinition } = {
  // ========== DODGE TRAITS ==========

  T1_PHANTOM_TRACE: {
    id: 'T1_PHANTOM_TRACE',
    name: 'Phantom Trace',
    description: 'Evade 후 0.8초 동안 받는 피해 -50%',
    category: TraitCategory.DEFENSIVE,
    stackable: false,

    apply: (agent: Agent) => {
      // Set flag on agent
      ;(agent as any).hasPhantomTrace = true
      // This modifies Agent.takeDamage() to check if in post-evade window
    },

    remove: (agent: Agent) => {
      ;(agent as any).hasPhantomTrace = false
    }
  },

  T2_REFLEX_BURST: {
    id: 'T2_REFLEX_BURST',
    name: 'Reflex Burst',
    description: 'Evade 후 0.8초 동안 첫 공격 피해 +40%',
    category: TraitCategory.OFFENSIVE,
    stackable: false,

    apply: (agent: Agent) => {
      ;(agent as any).hasReflexBurst = true
      // This modifies Agent.basicAttack() to check post-evade window
    },

    remove: (agent: Agent) => {
      ;(agent as any).hasReflexBurst = false
    }
  },

  // ========== AGGRESSION TRAITS ==========

  T3_OVERCLOCK_CHARGE: {
    id: 'T3_OVERCLOCK_CHARGE',
    name: 'Overclock Charge',
    description: 'Engage 돌진 거리 +25%, 넉백 +20%',
    category: TraitCategory.OFFENSIVE,
    stackable: false,

    apply: (agent: Agent) => {
      ;(agent as any).hasOverclockCharge = true
      // Modify AgentAI.engageDashDistance and knockback
    },

    remove: (agent: Agent) => {
      ;(agent as any).hasOverclockCharge = false
    }
  },

  T4_BLOOD_EXCHANGE: {
    id: 'T4_BLOOD_EXCHANGE',
    name: 'Blood Exchange',
    description: '피해량의 3%만큼 흡혈',
    category: TraitCategory.OFFENSIVE,
    stackable: false,

    apply: (agent: Agent) => {
      ;(agent as any).hasBloodExchange = true
      // Modify Agent.damageDealt to heal for 3%
    },

    remove: (agent: Agent) => {
      ;(agent as any).hasBloodExchange = false
    }
  },

  // ========== DEFENSE TRAITS ==========

  T5_ADAPTIVE_SHIELD: {
    id: 'T5_ADAPTIVE_SHIELD',
    name: 'Adaptive Shield',
    description: 'Guard 중 피해 감소 지속시간 증가 (효과 강화)',
    category: TraitCategory.DEFENSIVE,
    stackable: false,

    apply: (agent: Agent) => {
      ;(agent as any).hasAdaptiveShield = true
      // Extend Guard damage reduction window
    },

    remove: (agent: Agent) => {
      ;(agent as any).hasAdaptiveShield = false
    }
  },

  // ========== UTILITY TRAITS ==========

  T6_THREAT_REDIRECT: {
    id: 'T6_THREAT_REDIRECT',
    name: 'Threat Redirect',
    description: 'Sniper 위협도 가중치 -50% (AI가 빨리 처치)',
    category: TraitCategory.UTILITY,
    stackable: false,

    apply: (agent: Agent) => {
      ;(agent as any).hasThreatRedirect = true
      // Modify ThreatModel to reduce Sniper threat weight
    },

    remove: (agent: Agent) => {
      ;(agent as any).hasThreatRedirect = false
    }
  }
}

/**
 * Get trait by ID
 */
export function getTrait(id: string): TraitDefinition | undefined {
  return TRAITS[id]
}

/**
 * Get all traits in a category
 */
export function getTraitsByCategory(category: TraitCategory): TraitDefinition[] {
  return Object.values(TRAITS).filter(t => t.category === category)
}

/**
 * Get traits for profile
 * Based on PRD section 10.1 프로필 판정
 */
export function getTraitsForProfile(profile: PlaystyleProfile): string[] {
  const traits: string[] = []

  if (profile.dodgeScore >= 60) {
    traits.push('T1_PHANTOM_TRACE', 'T2_REFLEX_BURST')
  }

  if (profile.aggressionScore >= 60) {
    traits.push('T3_OVERCLOCK_CHARGE', 'T4_BLOOD_EXCHANGE')
  }

  if (profile.defenseScore >= 60) {
    traits.push('T5_ADAPTIVE_SHIELD')
  }

  // Special case: high sniper deaths
  if (profile.sniperDeaths >= 3) {
    traits.push('T6_THREAT_REDIRECT')
  }

  return traits
}

/**
 * Playstyle profile for trait matching
 */
export interface PlaystyleProfile {
  dodgeScore: number // 0-100
  aggressionScore: number // 0-100
  defenseScore: number // 0-100
  sniperDeaths: number // Count
  profileName: string // 'Dodge-Counter', 'Aggro-Burst', 'Shield-Control', 'Balanced'
}
