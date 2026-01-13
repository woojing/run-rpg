import Phaser from 'phaser'
import { SCENE_KEYS } from '../constants.js'
import { TelemetryData } from '../systems/Telemetry.js'
import { Strategy } from '../ai/Strategy.js'

export default class SummaryScene extends Phaser.Scene {
  telemetry!: TelemetryData

  constructor() {
    super({ key: SCENE_KEYS.SUMMARY })
  }

  init(data: { telemetry: TelemetryData }) {
    this.telemetry = data.telemetry
  }

  create() {
    console.log('SummaryScene: Showing run results')

    // Background
    this.add.rectangle(960, 540, 1920, 1080, 0x0a0a0f)

    // Title
    const titleText = this.telemetry.runResult === 'victory' ? 'RUN COMPLETE!' : 'RUN FAILED!'
    const titleColor = this.telemetry.runResult === 'victory' ? '#33ff33' : '#ff3333'

    const title = this.add.text(960, 80, titleText, {
      fontSize: '64px',
      color: titleColor,
      fontStyle: 'bold'
    })
    title.setOrigin(0.5)

    // Subtitle with duration
    const subtitle = this.add.text(
      960,
      150,
      `Time: ${this.telemetry.runDuration.toFixed(1)}s`,
      {
        fontSize: '32px',
        color: '#ffffff'
      }
    )
    subtitle.setOrigin(0.5)

    // Stats columns
    const startY = 220
    const lineHeight = 70

    // Column 1: Strategy Usage
    this.displayStatColumn(300, startY, 'STRATEGY USAGE', {
      'Engage': this.formatTime(this.telemetry.strategyTime[Strategy.ENGAGE]),
      'Guard': this.formatTime(this.telemetry.strategyTime[Strategy.GUARD]),
      'Evade': this.formatTime(this.telemetry.strategyTime[Strategy.EVADE]),
      'Burst': this.formatTime(this.telemetry.strategyTime[Strategy.BURST]),
      'Switches': this.telemetry.strategySwitchCount.toString()
    })

    // Column 2: Survival
    this.displayStatColumn(650, startY, 'SURVIVAL', {
      'Time Below 30% HP': this.formatTime(this.telemetry.timeBelowHp30),
      'Hits Taken': this.telemetry.hitsTakenCount.toString(),
      'Damage Taken': this.telemetry.damageTakenTotal.toString()
    })

    // Column 3: Performance
    this.displayStatColumn(1000, startY, 'PERFORMANCE', {
      'Damage Dealt': this.telemetry.damageDealtTotal.toString(),
      'Rusher Kills': this.telemetry.killsByArchetype['Rusher'].toString(),
      'Sniper Kills': this.telemetry.killsByArchetype['Sniper'].toString(),
      'Elite Kills': this.telemetry.killsByArchetype['Elite'].toString()
    })

    // Column 4: Evasion
    this.displayStatColumn(1350, startY, 'EVASION', {
      'Evades': this.telemetry.evadeCount.toString(),
      'Successful': this.telemetry.evadeSuccessCount.toString(),
      'Success Rate': `${this.getEvadeSuccessRate().toFixed(1)}%`,
      'Burst Activations': this.telemetry.burstActivations.toString()
    })

    // Restart button
    const restartBtn = this.createButton(960, 900, 300, 80, 'NEXT RUN', 0x33ff33)
    restartBtn.on('pointerdown', () => {
      this.scene.start(SCENE_KEYS.BATTLE)
    })

    // Add hover effects
    restartBtn.on('pointerover', () => {
      const bg = restartBtn.getAt(0) as Phaser.GameObjects.Rectangle
      bg.setFillStyle(0xffffff)
      const label = restartBtn.getAt(1) as Phaser.GameObjects.Text
      label.setColor('#000000')
    })

    restartBtn.on('pointerout', () => {
      const bg = restartBtn.getAt(0) as Phaser.GameObjects.Rectangle
      bg.setFillStyle(0x33ff33)
      const label = restartBtn.getAt(1) as Phaser.GameObjects.Text
      label.setColor('#000000')
    })

    console.log('SummaryScene: Display complete')
  }

  private displayStatColumn(x: number, y: number, title: string, stats: { [key: string]: string }) {
    // Title
    const titleText = this.add.text(x, y, title, {
      fontSize: '28px',
      color: '#ffff00',
      fontStyle: 'bold'
    })
    titleText.setOrigin(0.5)

    // Stats
    let offsetY = 50
    for (const [key, value] of Object.entries(stats)) {
      // Label
      const labelText = this.add.text(x, y + offsetY, `${key}:`, {
        fontSize: '20px',
        color: '#aaaaaa'
      })
      labelText.setOrigin(0.5)

      // Value
      const valueText = this.add.text(x, y + offsetY + 25, value, {
        fontSize: '24px',
        color: '#ffffff',
        fontStyle: 'bold'
      })
      valueText.setOrigin(0.5)

      offsetY += 70
    }
  }

  private createButton(
    x: number,
    y: number,
    w: number,
    h: number,
    text: string,
    color: number
  ): Phaser.GameObjects.Container {
    const container = this.add.container(x, y)

    const bg = this.add.rectangle(0, 0, w, h, color)
    const label = this.add.text(0, 0, text, {
      fontSize: '32px',
      color: '#000000',
      fontStyle: 'bold'
    })
    label.setOrigin(0.5)

    container.add([bg, label])
    container.setSize(w, h)
    container.setInteractive({ useHandCursor: true })

    return container
  }

  private formatTime(ms: number): string {
    return (ms / 1000).toFixed(1) + 's'
  }

  private getEvadeSuccessRate(): number {
    if (this.telemetry.evadeCount === 0) return 0
    return (this.telemetry.evadeSuccessCount / this.telemetry.evadeCount) * 100
  }
}
