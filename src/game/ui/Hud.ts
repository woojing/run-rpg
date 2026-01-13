import Phaser from 'phaser'
import { Strategy, STRATEGY_CONFIG } from '../ai/Strategy.js'

export class Hud {
  scene: Phaser.Scene
  timerText!: Phaser.GameObjects.Text
  hpText!: Phaser.GameObjects.Text
  strategyLabel!: Phaser.GameObjects.Text
  strategyText!: Phaser.GameObjects.Text

  constructor(scene: Phaser.Scene) {
    this.scene = scene
  }

  create() {
    // Top background bar
    const topBar = this.scene.add.rectangle(960, 40, 1920, 80, 0x1a1a2e, 0.8)
    topBar.setDepth(100)

    // Timer (left)
    this.timerText = this.scene.add.text(100, 40, '120', {
      fontSize: '36px',
      color: '#ffffff',
      fontStyle: 'bold'
    })
    this.timerText.setOrigin(0.5)
    this.timerText.setDepth(101)

    // Timer label
    const timerLabel = this.scene.add.text(100, 20, 'TIME', {
      fontSize: '16px',
      color: '#aaaaaa'
    })
    timerLabel.setOrigin(0.5)
    timerLabel.setDepth(101)

    // HP (center-left)
    this.hpText = this.scene.add.text(400, 40, 'HP: 100/100', {
      fontSize: '28px',
      color: '#33ff33',
      fontStyle: 'bold'
    })
    this.hpText.setOrigin(0.5)
    this.hpText.setDepth(101)

    // Current Strategy (center-right)
    this.strategyLabel = this.scene.add.text(1400, 20, 'CURRENT STRATEGY', {
      fontSize: '16px',
      color: '#aaaaaa'
    })
    this.strategyLabel.setOrigin(0.5)
    this.strategyLabel.setDepth(101)

    this.strategyText = this.scene.add.text(1400, 45, 'ENGAGE', {
      fontSize: '32px',
      color: '#ff3333',
      fontStyle: 'bold'
    })
    this.strategyText.setOrigin(0.5)
    this.strategyText.setDepth(101)

    console.log('Hud: Created HUD elements')
  }

  updateTimer(seconds: number) {
    this.timerText.setText(Math.ceil(seconds).toString())
  }

  updateHp(current: number, max: number) {
    this.hpText.setText(`HP: ${Math.ceil(current)}/${max}`)

    // Change color based on HP percentage
    const hpPercent = current / max
    if (hpPercent > 0.6) {
      this.hpText.setColor('#33ff33') // Green
    } else if (hpPercent > 0.3) {
      this.hpText.setColor('#ffff33') // Yellow
    } else {
      this.hpText.setColor('#ff3333') // Red
    }
  }

  updateStrategy(strategy: Strategy) {
    const config = STRATEGY_CONFIG[strategy]
    this.strategyText.setText(config.name)
    this.strategyText.setColor(`#${config.color.toString(16).padStart(6, '0')}`)
  }
}
