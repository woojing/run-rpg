import Phaser from 'phaser'
import { SCENE_KEYS } from '../constants.js'
import { StrategyBar } from '../ui/StrategyBar.js'
import { Hud } from '../ui/Hud.js'
import { DebugOverlay, DebugData } from '../ui/DebugOverlay.js'
import { Strategy } from '../ai/Strategy.js'
import { AgentAI } from '../ai/AgentAI.js'
import { Agent } from '../entities/Agent.js'
import { Enemy } from '../entities/Enemy.js'
import { EnemyFactory } from '../entities/EnemyFactory.js'
import { ElectricBarrier } from '../entities/ElectricBarrier.js'
import { CombatSystem } from '../systems/CombatSystem.js'
import { RunTimer } from '../systems/RunTimer.js'
import { Telemetry } from '../systems/Telemetry.js'
import { RunRecorder } from '../systems/RunRecorder.js'

export default class BattleScene extends Phaser.Scene {
  // UI
  private strategyBar!: StrategyBar
  private hud!: Hud
  private debugOverlay!: DebugOverlay
  private currentStrategy: Strategy = Strategy.ENGAGE
  private previousStrategy: Strategy = Strategy.ENGAGE

  // Entities
  private agent!: Agent
  private enemies: Enemy[] = []
  private barriers: ElectricBarrier[] = []

  // Systems
  private agentAI!: AgentAI
  private enemyFactory!: EnemyFactory
  private combatSystem!: CombatSystem
  private runTimer!: RunTimer
  private telemetry!: Telemetry
  private runRecorder!: RunRecorder

  constructor() {
    super({ key: SCENE_KEYS.BATTLE })
  }

  create() {
    console.log('BattleScene: Creating game with telemetry')

    // Create telemetry system
    this.telemetry = new Telemetry()
    this.runRecorder = new RunRecorder()

    // Create AI system
    this.agentAI = new AgentAI()

    // Create other systems
    this.enemyFactory = new EnemyFactory(this)
    this.combatSystem = new CombatSystem()
    this.runTimer = new RunTimer(this, 120) // 120 seconds

    // Load previous run traits
    const previousTraits = this.loadPreviousRunTraits()

    // Create agent at center with traits from previous run
    this.agent = new Agent(this, 960, 540, previousTraits)
    this.agent.on('died', () => this.endRun(false))

    // Track damage taken for telemetry
    this.agent.on('damageTaken', (amount: number) => {
      this.telemetry.recordDamageTaken(amount, this.agent.hp, this.agent.maxHp, 0)
    })

    // Set initial AI strategy
    this.agentAI.setStrategy(this.currentStrategy)

    // Create HUD
    this.hud = new Hud(this)
    this.hud.create()
    this.hud.updateHp(this.agent.hp, this.agent.maxHp)
    this.hud.updateStrategy(this.currentStrategy)

    // Create Strategy Bar
    this.strategyBar = new StrategyBar(this)
    this.strategyBar.create((strategy) => this.onStrategyChange(strategy))

    // Create Debug Overlay
    this.debugOverlay = new DebugOverlay(this)
    this.add.existing(this.debugOverlay)

    // Keyboard controls
    this.setupKeyboardControls()

    // Setup timer complete callback
    this.runTimer.onComplete = () => this.endRun(true)

    // Start timer
    this.runTimer.start()

    // Info text
    const infoText = this.add.text(
      960,
      100,
      '4-Strategy Tactical Combat\nPress 1-4 or click buttons to switch strategies',
      {
        fontSize: '24px',
        color: '#aaaaaa',
        align: 'center'
      }
    )
    infoText.setOrigin(0.5)

    // Spawn electric barriers
    this.spawnBarriers()

    console.log('BattleScene: Game initialized with telemetry')
  }

  update(time: number, delta: number) {
    // Update timer
    this.runTimer.update(delta)
    this.hud.updateTimer(this.runTimer.getRemainingTime())

    // Record strategy time
    this.telemetry.recordStrategyTime(this.currentStrategy, delta)

    // Record time below 30% HP
    if (this.agent.hp <= this.agent.maxHp * 0.3) {
      this.telemetry.recordTimeBelowHp30(delta)
    }

    // Update AI (controls agent movement and abilities)
    this.agentAI.update(this.agent, this.enemies, delta)

    // Update agent (cooldowns, etc)
    this.agent.update(delta)

    // Track burst activations for telemetry
    if (this.currentStrategy === Strategy.BURST) {
      const aiBurstActive = (this.agentAI as any).burstActive
      if (aiBurstActive && (this.agentAI as any).specialCooldown > 2000) {
        // Just activated
        this.telemetry.recordBurstActivation()
      }
    }

    // Spawn enemies
    const newEnemies = this.enemyFactory.spawnWave(this.runTimer.elapsedTime)
    if (newEnemies.length > 0) {
      this.enemies.push(...newEnemies)
      console.log(`Spawned ${newEnemies.length} enemies. Total: ${this.enemies.length}`)
    }

    // Update enemies
    this.enemies.forEach((enemy) => {
      if (enemy.active) {
        enemy.update(this.agent, delta)
      }
    })

    // Clean up dead enemies
    const previousEnemyCount = this.enemies.length
    this.enemies = this.enemies.filter((enemy) => enemy.active)

    // Track kills for telemetry
    const killedCount = previousEnemyCount - this.enemies.length
    if (killedCount > 0) {
      // Enemies died in this frame - record kills
      // (Simplified: just record based on count reduction)
      for (let i = 0; i < killedCount; i++) {
        this.telemetry.recordKill(this.enemies[0] || {} as Enemy, this.runTimer.elapsedTime)
      }
    }

    // Update electric barriers
    this.barriers.forEach(barrier => barrier.update(delta, this.agent))

    // Update debug overlay if visible
    if (this.debugOverlay.isVisible) {
      const debugData = this.collectDebugData()
      this.debugOverlay.update(debugData)
    }

    // Update HUD
    this.hud.updateHp(this.agent.hp, this.agent.maxHp)
  }

  private onStrategyChange(strategy: Strategy) {
    console.log(`BattleScene: Strategy changing from ${this.currentStrategy} to ${strategy}`)

    // Record strategy change for telemetry
    this.telemetry.recordStrategyChange(this.currentStrategy, strategy, this.runTimer.elapsedTime)

    this.previousStrategy = this.currentStrategy
    this.currentStrategy = strategy

    // Update AI
    this.agentAI.setStrategy(strategy)

    // Update HUD
    this.hud.updateStrategy(strategy)

    // Emit event for other systems
    this.events.emit('strategyChanged', strategy)
  }

  private endRun(victory: boolean) {
    console.log(`Run ${victory ? 'complete!' : 'failed!'}`)

    // Stop timer
    this.runTimer.isComplete = true

    // Finalize telemetry
    const finalTelemetry = this.telemetry.finalizeRun(
      this.runTimer.elapsedTime,
      victory ? 'victory' : 'defeat'
    )

    console.log('Telemetry:', finalTelemetry)

    // Save to persistent storage
    this.runRecorder.saveRun(finalTelemetry)

    // Transition to SummaryScene
    this.scene.start(SCENE_KEYS.SUMMARY, { telemetry: finalTelemetry })
  }

  private spawnBarriers() {
    // Hardcoded positions for POC (avoid center area)
    // Barriers in corners, creating diagonal hazards
    const barrierConfigs = [
      { x1: 200, y1: 200, x2: 400, y2: 400 },    // Top-left diagonal
      { x1: 1720, y1: 200, x2: 1520, y2: 400 },  // Top-right diagonal
      { x1: 200, y1: 880, x2: 400, y2: 680 },    // Bottom-left diagonal
      { x1: 1720, y1: 880, x2: 1520, y2: 680 }   // Bottom-right diagonal
    ]

    barrierConfigs.forEach(config => {
      const barrier = new ElectricBarrier(
        this,
        config.x1,
        config.y1,
        config.x2,
        config.y2
      )
      this.add.existing(barrier)
      this.barriers.push(barrier)
    })

    console.log(`BattleScene: Spawned ${this.barriers.length} electric barriers`)
  }

  private loadPreviousRunTraits(): string[] {
    const recentRuns = this.runRecorder.getRecentRuns(1)

    if (recentRuns.length > 0 && recentRuns[0].grantedTraits) {
      console.log('BattleScene: Loading traits from previous run:', recentRuns[0].grantedTraits)
      return recentRuns[0].grantedTraits
    }

    console.log('BattleScene: No previous traits found')
    return []
  }

  private setupKeyboardControls() {
    // D key: Toggle debug overlay
    this.input.keyboard!.on('keydown-D', () => {
      this.debugOverlay.toggle()
    })

    // R key: Restart scene
    this.input.keyboard!.on('keydown-R', () => {
      console.log('BattleScene: Manual restart')
      this.scene.restart()
    })
  }

  private collectDebugData(): DebugData {
    // Agent state
    const agentBody = this.agent.body as Phaser.Physics.Arcade.Body
    const agentState = {
      hp: this.agent.hp,
      maxHp: this.agent.maxHp,
      x: Math.round(this.agent.x),
      y: Math.round(this.agent.y),
      velocity: {
        x: Math.round(agentBody.velocity.x),
        y: Math.round(agentBody.velocity.y)
      },
      invulnerable: this.agent.invulnerable,
      activeTraits: Array.from(this.agent.activeTraits),
      postEvadeTimer: Math.round(this.agent.postEvadeTimer)
    }

    // Strategy state
    const aiState = this.agentAI as any
    const strategyState = {
      current: this.currentStrategy,
      previous: this.previousStrategy,
      burstActive: aiState.burstActive || false,
      postEvadeWindow: this.agent.postEvadeTimer > 0
    }

    // Threat data
    const threatData = this.agentAI.threatModel
      ? this.enemies.slice(0, 3).map(enemy => ({
          id: enemy.hashCode(),
          archetype: enemy.archetype,
          threatScore: 0, // Would need to expose from ThreatModel
          distance: Math.round(Phaser.Math.Distance.Between(this.agent.x, this.agent.y, enemy.x, enemy.y)),
          hp: enemy.hp
        }))
      : []

    // Telemetry (live data)
    const telemetryData = {
      strategyTime: this.telemetry.data.strategyTime,
      evadeCount: this.telemetry.data.evadeCount,
      evadeSuccessCount: this.telemetry.data.evadeSuccessCount,
      damageDealtTotal: this.telemetry.data.damageDealtTotal,
      burstActivations: this.telemetry.data.burstActivations
    }

    // Profile (simplified - would need GrowthResolver for accurate data)
    const profileData = {
      dodge: 0, // Placeholder
      aggression: 0, // Placeholder
      defense: 0 // Placeholder
    }

    return {
      agent: agentState,
      strategy: strategyState,
      threats: threatData,
      telemetry: telemetryData,
      profile: profileData
    }
  }
}
