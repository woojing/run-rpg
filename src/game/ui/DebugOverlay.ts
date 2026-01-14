import Phaser from 'phaser'
import { Strategy } from '../ai/Strategy.js'
import { TelemetryData } from '../systems/Telemetry.js'

/**
 * Debug data structure
 */
export interface DebugData {
  agent: {
    hp: number
    maxHp: number
    x: number
    y: number
    velocity: { x: number; y: number }
    invulnerable: boolean
    activeTraits: string[]
    postEvadeTimer: number
  }
  strategy: {
    current: Strategy
    previous: Strategy
    burstActive: boolean
    postEvadeWindow: boolean
  }
  threats: Array<{
    id: number
    archetype: string
    threatScore: number
    distance: number
    hp: number
  }>
  telemetry: Partial<TelemetryData>
  profile: {
    dodge: number
    aggression: number
    defense: number
  }
}

/**
 * Debug Overlay - Real-time game state visualization
 */
export class DebugOverlay extends Phaser.GameObjects.Container {
  isVisible: boolean = false

  // Text elements for each section
  private sections: {
    agent: Phaser.GameObjects.Text
    strategy: Phaser.GameObjects.Text
    threats: Phaser.GameObjects.Text
    telemetry: Phaser.GameObjects.Text
    profile: Phaser.GameObjects.Text
    traits: Phaser.GameObjects.Text
  }

  // Background
  private bg!: Phaser.GameObjects.Rectangle

  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0)
    this.create()
  }

  private create() {
    // Semi-transparent background
    this.bg = this.scene.add.rectangle(200, 350, 400, 700, 0x000000, 0.8)
    this.bg.setOrigin(0, 0)
    this.add(this.bg)

    // Section headers and content
    this.sections = {
      agent: this.createSection('AGENT STATE', 20),
      strategy: this.createSection('STRATEGY', 140),
      threats: this.createSection('THREATS (Top 3)', 240),
      telemetry: this.createSection('TELEMETRY', 340),
      profile: this.createSection('PROFILE (Live)', 460),
      traits: this.createSection('ACTIVE TRAITS', 540)
    }

    // Initially hidden
    this.setVisible(false)
  }

  private createSection(title: string, y: number): Phaser.GameObjects.Text {
    // Title
    const titleText = this.scene.add.text(20, y, title, {
      fontSize: '18px',
      color: '#ffff00',
      fontStyle: 'bold',
      fontFamily: 'monospace'
    })
    this.add(titleText)

    // Content (multi-line)
    const content = this.scene.add.text(20, y + 25, '', {
      fontSize: '14px',
      color: '#ffffff',
      fontFamily: 'monospace'
    })
    this.add(content)

    return content
  }

  /**
   * Update debug overlay with current game state
   */
  update(data: DebugData) {
    if (!this.isVisible) return

    this.sections.agent.setText(this.formatAgentState(data.agent))
    this.sections.strategy.setText(this.formatStrategy(data.strategy))
    this.sections.threats.setText(this.formatThreats(data.threats))
    this.sections.telemetry.setText(this.formatTelemetry(data.telemetry))
    this.sections.profile.setText(this.formatProfile(data.profile))
    this.sections.traits.setText(this.formatTraits(data.agent.activeTraits))
  }

  /**
   * Toggle debug overlay visibility
   */
  toggle() {
    this.isVisible = !this.isVisible
    this.setVisible(this.isVisible)
    console.log(`DebugOverlay: ${this.isVisible ? 'Visible' : 'Hidden'}`)
  }

  // ========== Formatting Methods ==========

  private formatAgentState(agent: DebugData['agent']): string {
    return `HP: ${agent.hp}/${agent.maxHp} (${Math.round((agent.hp / agent.maxHp) * 100)}%)
Pos: (${agent.x}, ${agent.y})
Vel: (${agent.velocity.x}, ${agent.velocity.y})
Invulnerable: ${agent.invulnerable ? 'YES' : 'NO'}
Post-Evade: ${Math.round(agent.postEvadeTimer)}ms`
  }

  private formatStrategy(strategy: DebugData['strategy']): string {
    return `Current: ${strategy.current}
Previous: ${strategy.previous}
Burst Active: ${strategy.burstActive ? 'YES' : 'NO'}
Post-Evade: ${strategy.postEvadeWindow ? 'YES' : 'NO'}`
  }

  private formatThreats(threats: DebugData['threats']): string {
    if (threats.length === 0) {
      return 'No threats detected'
    }

    return threats.map((t, i) => {
      return `#${i + 1} ${t.archetype}
    Score: ${t.threatScore}
    Dist: ${t.distance}
    HP: ${t.hp}`
    }).join('\n\n')
  }

  private formatTelemetry(telemetry: Partial<TelemetryData>): string {
    if (!telemetry.strategyTime) return 'No telemetry data'

    const total = Object.values(telemetry.strategyTime).reduce((a, b) => a + b, 0) / 1000

    return `Run Time: ${total.toFixed(1)}s
Evades: ${telemetry.evadeCount || 0}
Success: ${telemetry.evadeSuccessCount || 0}
Dmg Dealt: ${telemetry.damageDealtTotal || 0}
Bursts: ${telemetry.burstActivations || 0}`
  }

  private formatProfile(profile: DebugData['profile']): string {
    return `Dodge: ${profile.dodge}
Aggro: ${profile.aggression}
Defense: ${profile.defense}`
  }

  private formatTraits(traits: string[]): string {
    if (traits.length === 0) {
      return 'No active traits'
    }

    return traits.join('\n')
  }
}
