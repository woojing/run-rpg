// Scene keys
export const SCENE_KEYS = {
  BOOT: 'BootScene',
  BATTLE: 'BattleScene',
  SUMMARY: 'SummaryScene'
} as const

// Color palette (Cyberpunk theme)
export const COLORS = {
  background: 0x0a0a0f,
  agent: 0x3388ff,      // Blue
  enemy: 0xff3333,      // Red
  engage: 0xff3333,     // Red - Aggressive
  guard: 0x33ff33,      // Green - Defensive
  evade: 0x3333ff,      // Blue - Mobility
  burst: 0xffff33,      // Yellow - High damage
  text: 0xffffff,
  uiBg: 0x1a1a2e,
  sniper: 0xffff33,     // Yellow
  elite: 0xff33ff,      // Purple
  hazard: 0x00ffff      // Cyan
} as const

// Game constants
export const GAME_CONSTANTS = {
  BASE_WIDTH: 1920,
  BASE_HEIGHT: 1080
} as const
