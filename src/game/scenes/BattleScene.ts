import Phaser from 'phaser'
import { SCENE_KEYS } from '../constants.js'
import { StrategyBar } from '../ui/StrategyBar.js'
import { Hud } from '../ui/Hud.js'
import { Strategy } from '../ai/Strategy.js'
import { AgentAI } from '../ai/AgentAI.js'
import { Agent } from '../entities/Agent.js'
import { Enemy } from '../entities/Enemy.js'
import { EnemyFactory } from '../entities/EnemyFactory.js'
import { CombatSystem } from '../systems/CombatSystem.js'
import { RunTimer } from '../systems/RunTimer.js'
import { Telemetry } from '../systems/Telemetry.js'
import { RunRecorder } from '../systems/RunRecorder.js'

export default class BattleScene extends Phaser.Scene {
  // UI
  private strategyBar!: StrategyBar
  private hud!: Hud
  private currentStrategy: Strategy = Strategy.ENGAGE
  private previousStrategy: Strategy = Strategy.ENGAGE

  // Entities
  private agent!: Agent
  private enemies: Enemy[] = []

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

    // Create agent at center
    this.agent = new Agent(this, 960, 540)
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
}
