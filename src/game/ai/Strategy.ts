// Strategy enum - 4 tactical options for player
export enum Strategy {
  ENGAGE = 'engage',
  GUARD = 'guard',
  EVADE = 'evade',
  BURST = 'burst'
}

// Strategy configuration - will be expanded in C4
export const STRATEGY_CONFIG = {
  [Strategy.ENGAGE]: {
    name: 'ENGAGE',
    color: 0xff3333,
    description: 'Aggressive forward combat'
  },
  [Strategy.GUARD]: {
    name: 'GUARD',
    color: 0x33ff33,
    description: 'Defensive damage reduction'
  },
  [Strategy.EVADE]: {
    name: 'EVADE',
    color: 0x3333ff,
    description: 'Mobility and repositioning'
  },
  [Strategy.BURST]: {
    name: 'BURST',
    color: 0xffff33,
    description: 'High damage window'
  }
} as const
