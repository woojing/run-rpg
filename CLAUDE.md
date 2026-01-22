# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Tactical Auto-Action RPG POC** - A Phaser 4-based proof of concept for a strategy-driven auto-battler where:
- Player only chooses 4 strategies (ENGAGE, GUARD, EVADE, BURST)
- Agent AI automatically executes combat based on selected strategy
- Each run is 120-180 seconds (instant run)
- Post-run: Playstyle analysis → temporary trait grants → statistics accumulation only (no permanent progression)

**Current Progress**: 62.5% (C1-C5 complete, working on C6-C8)

See `docs/implementation-progress.md` for detailed implementation status.

## Development Commands

```bash
# Start development server
npm run dev

# Production build
npm run build

# Preview production build
npm run preview

# Testing (Unit tests only - integration tests skipped due to Phaser 4 RC WebGL issues)
npm test                      # Watch mode
npm test -- --run            # Single run
npm test -- tests/unit/ai/Steering.test.ts --run  # Single test file

# Test UI and coverage
npm run test:ui
npm run test:coverage
```

## Architecture

### Core Game Loop

```
BootScene → BattleScene (120-180s gameplay) → SummaryScene → (next run)
                ↓
         Agent死亡 OR Timer完成 → endRun(victory?) → Telemetry.finalizeRun()
                ↓
         RunRecorder.saveRun() → GrowthResolver.resolve() → Show traits
```

### Key Scenes

- **BootScene**: Asset loading (none - all procedural)
- **BattleScene**: Main gameplay loop, orchestrates all systems
- **SummaryScene**: Post-run analysis, displays telemetry and granted traits

### AI/Combat System

```
Player Input (1-4 keys or click)
        ↓
StrategyBar.onStrategyChange()
        ↓
BattleScene.onStrategyChange()
        ↓
AgentAI.setStrategy() → FSM switches behavior
        ↓
AgentAI.update() every frame
        ↓
ThreatModel.getPrimaryThreat() → Steering.calculate()
        ↓
Agent takes action (move/attack/evade)
```

**4 Strategies (FSM states)**:
- **ENGAGE**: Aggressive forward combat, seek closest threat, dash attack
- **GUARD**: Defensive stance, 50% damage reduction, hold position
- **EVADE**: Mobile, dodge attacks, maintain safe distance, iframe during evade
- **BURST**: High damage window (2x damage), then fatigue (slow movement)

### Data Flow: Run → Growth

```
BattleScene tracks everything via Telemetry
        ↓
Telemetry.recordStrategyTime() / recordDamageTaken() / recordKill() / recordEvade()
        ↓
endRun() → Telemetry.finalizeRun(duration, result)
        ↓
GrowthResolver.resolve(telemetry.data)
        ↓
Calculate scores: dodgeScore, aggressionScore, defenseScore
        ↓
Determine profile: Dodger, Aggressor, Defender, Balanced
        ↓
getTraitsForProfile() → Returns trait IDs for next run
        ↓
RunRecorder.saveRun() → localStorage
```

### Critical Systems

**Telemetry** (`src/game/systems/Telemetry.ts`)
- Records all player actions and performance metrics
- Used by GrowthResolver to determine playstyle profile
- Key data: strategy time usage, damage taken/dealt, evade success rate, kills by archetype

**GrowthResolver** (`src/game/systems/GrowthResolver.ts`)
- Analyzes telemetry → calculates 3 scores (0-100)
- Determines profile based on highest score (>60 threshold)
- Returns trait IDs from `growthTraits.ts` for next run

**AgentAI** (`src/game/ai/AgentAI.ts`)
- FSM with 4 strategy states
- Uses ThreatModel for target selection
- Uses Steering for movement calculations
- Cooldowns: special abilities (dash, evade, burst activation)

**CombatSystem** (`src/game/systems/CombatSystem.ts`)
- Arcde physics collision detection
- Hit processing, knockback, damage application

### Entity Structure

**Agent** (`src/game/entities/Agent.ts`)
- Player-controlled character (auto-piloted by AI)
- HP, maxHp, moveSpeed, damageReduction
- Traits array from previous run (loaded from localStorage)
- Emits: 'died', 'damageTaken'

**Enemy** (`src/game/entities/Enemy.ts`)
- 3 archetypes: Rusher (melee), Sniper (ranged), Elite (tank)
- Spawned via EnemyFactory.spawnWave()
- Emits: 'died'

**ElectricBarrier** (`src/game/entities/ElectricBarrier.ts`)
- Environmental hazard (neon line)
- Deals 20 DPS on contact

### Important Constants

**SCENE_KEYS** (`src/game/constants.ts`)
- BOOT, BATTLE, SUMMARY (use these for scene transitions)

**COLORS** (`src/game/constants.ts`)
- Cyberpunk palette: agent (blue), enemy (red), engage (red), guard (green), evade (blue), burst (yellow)

**Strategy** (`src/game/ai/Strategy.ts`)
- Enum: ENGAGE, GUARD, EVADE, BURST

## Testing

### Unit Tests (77 tests passing)

Located in `tests/unit/`:
- `ai/Steering.test.ts` (10 tests) - Vector calculations
- `systems/Telemetry.test.ts` (29 tests) - Recording, finalizeRun, undefined archetype handling
- `systems/GrowthResolver.test.ts` (18 tests) - Profile determination
- `entities/ElectricBarrier.test.ts` (11 tests) - Null safety, damage calculation
- `ui/StrategyBar.test.ts` (9 tests) - Keyboard shortcuts (keydown-ONE through keydown-FOUR)

### Integration Tests (SKIPPED)

`tests/integration/` contains death flow tests but are skipped due to Phaser 4 RC WebGL issues:
- Error: `Cannot find module 'phaser3spectorjs'`
- jsdom/happy-dom don't provide native canvas support
- See test files for detailed problem descriptions and when to re-enable

**Alternative**: Unit tests already cover critical death flow logic (Telemetry, GrowthResolver).

### Phaser Mocking

For any new test file that imports Phaser classes:
```typescript
vi.mock('phaser', () => ({
  default: {
    GameObjects: {
      Container: class MockContainer { /* ... */ },
      // ...
    }
  }
}))
```

See `tests/unit/entities/ElectricBarrier.test.ts` or `tests/unit/ui/StrategyBar.test.ts` for complete mock patterns.

### Test Global Setup

`tests/setup.ts` provides:
- `global.Phaser.Math` mock (Angle.Between, Distance.Between)
- `global.localStorage` mock
- Canvas polyfill (for Phaser HEADLESS)

### Running Single Test

```bash
npm test -- path/to/test.test.ts --run
```

## Phaser 4 RC6 Known Issues

1. **Keyboard Events**: Use `keydown-ONE` not `key-ONE` (event naming changed from Phaser 3)
2. **WebGL Dependencies**: Integration tests fail due to `phaser3spectorjs` module not found
3. **HEADLESS Mode**: Requires DOM environment (jsdom/happy-dom), but still fails on WebGL deps
4. **Null Safety**: Always check `this.scene?.physics` before accessing (see ElectricBarrier fix)

## Common Patterns

### Scene Transition with Data

```typescript
this.scene.start(SCENE_KEYS.SUMMARY, { telemetry: this.telemetry.data })
```

Receiving scene uses `init(data)` to access passed data.

### Event-Driven Architecture

```typescript
// Agent death event
this.agent.on('died', () => this.endRun(false))

// Damage tracking
this.agent.on('damageTaken', (amount: number) => {
  this.telemetry.recordDamageTaken(amount, this.agent.hp, this.agent.maxHp, 0)
})
```

### Strategy Change Flow

```typescript
// UI → Scene → AI → HUD
StrategyBar → onStrategyChange(strategy)
    ↓
BattleScene.onStrategyChange(strategy)
    ↓
AgentAI.setStrategy(strategy)
    ↓
Hud.updateStrategy(strategy)
```

### Safe Property Access

Always use optional chaining for scene properties that may not exist:
```typescript
if (!this.scene?.physics) return
if (!this.damageZone?.body) return
```

## File Organization

```
src/game/
├── ai/                    # AI logic (Strategy, Steering, ThreatModel, AgentAI)
├── config.ts              # Game balance constants
├── constants.ts           # SCENE_KEYS, COLORS, GAME_CONSTANTS
├── data/                  # Static data (enemyArchetypes, balance, growthTraits)
├── entities/              # Game objects (Agent, Enemy, ElectricBarrier, EnemyFactory)
├── scenes/                # Phaser scenes (Boot, Battle, Summary)
├── systems/               # Core systems (Combat, Telemetry, GrowthResolver, RunRecorder, RunTimer)
└── ui/                    # UI components (Hud, StrategyBar, DebugOverlay)
```

## Development Notes

- **No graphics assets**: Everything is procedural (rectangles, circles, text)
- **1920x1080 base resolution**: Scaled to fit window
- **localStorage**: Used only for run history (traits reset each run)
- **Growth is temporary**: Traits granted for one run only, then reset
- **D key**: Toggle debug overlay in BattleScene
- **R key**: Restart scene (for testing)
