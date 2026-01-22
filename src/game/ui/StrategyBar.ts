import Phaser from 'phaser'
import { Strategy, STRATEGY_CONFIG } from '../ai/Strategy.js'

export class StrategyBar {
  scene: Phaser.Scene
  buttons: Phaser.GameObjects.Container[] = []
  currentStrategy: Strategy = Strategy.ENGAGE
  onStrategyChange!: (strategy: Strategy) => void

  constructor(scene: Phaser.Scene) {
    this.scene = scene
  }

  create(onStrategyChange: (strategy: Strategy) => void) {
    this.onStrategyChange = onStrategyChange

    const buttonConfigs = [
      { key: Strategy.ENGAGE, ...STRATEGY_CONFIG[Strategy.ENGAGE] },
      { key: Strategy.GUARD, ...STRATEGY_CONFIG[Strategy.GUARD] },
      { key: Strategy.EVADE, ...STRATEGY_CONFIG[Strategy.EVADE] },
      { key: Strategy.BURST, ...STRATEGY_CONFIG[Strategy.BURST] }
    ]

    const buttonWidth = 200
    const buttonHeight = 100
    const spacing = 20
    const totalWidth = (buttonWidth * 4) + (spacing * 3)
    const startX = (1920 - totalWidth) / 2
    const startY = 1080 - buttonHeight - 30 // 30px from bottom

    buttonConfigs.forEach((config, index) => {
      const x = startX + (index * (buttonWidth + spacing))
      const button = this.createButton(x, startY, buttonWidth, buttonHeight, config)
      this.buttons.push(button)
    })

    // Highlight initial strategy
    this.highlightButton(Strategy.ENGAGE)

    // Keyboard shortcuts (1-4)
    this.setupKeyboardShortcuts()

    console.log('StrategyBar: Created 4 strategy buttons')
  }

  private createButton(
    x: number,
    y: number,
    width: number,
    height: number,
    config: { key: Strategy; name: string; color: number; description: string }
  ): Phaser.GameObjects.Container {
    const container = this.scene.add.container(x, y)

    // Button background
    const bg = this.scene.add.rectangle(0, 0, width, height, config.color, 0.3)
    bg.setStrokeStyle(3, config.color)
    container.add(bg)

    // Button label
    const label = this.scene.add.text(0, 0, config.name, {
      fontSize: '32px',
      color: '#ffffff',
      fontStyle: 'bold'
    })
    label.setOrigin(0.5)
    container.add(label)

    // Key hint
    const keyHints = { engage: '1', guard: '2', evade: '3', burst: '4' }
    const keyHint = this.scene.add.text(0, 35, `[${keyHints[config.key]}]`, {
      fontSize: '20px',
      color: '#ffffff'
    })
    keyHint.setOrigin(0.5)
    container.add(keyHint)

    // Set interactive
    container.setSize(width, height)
    container.setInteractive({ useHandCursor: true })

    // Event handlers
    container.on('pointerover', () => {
      if (this.currentStrategy !== config.key) {
        bg.setFillStyle(config.color, 0.6)
      }
    })

    container.on('pointerout', () => {
      if (this.currentStrategy !== config.key) {
        bg.setFillStyle(config.color, 0.3)
      }
    })

    container.on('pointerdown', () => {
      this.setStrategy(config.key)
    })

    // Store reference for highlighting
    container.setData('strategy', config.key)
    container.setData('bg', bg)

    return container
  }

  private highlightButton(strategy: Strategy) {
    this.buttons.forEach((button) => {
      const buttonStrategy = button.getData('strategy') as Strategy
      const bg = button.getData('bg') as Phaser.GameObjects.Rectangle

      if (buttonStrategy === strategy) {
        bg.setFillStyle(STRATEGY_CONFIG[strategy].color, 0.8)
        bg.setStrokeStyle(5, 0xffffff) // Thicker white border
      } else {
        bg.setFillStyle(STRATEGY_CONFIG[buttonStrategy].color, 0.3)
        bg.setStrokeStyle(3, STRATEGY_CONFIG[buttonStrategy].color)
      }
    })
  }

  private setStrategy(strategy: Strategy) {
    if (this.currentStrategy === strategy) return

    console.log(`StrategyBar: Changing from ${this.currentStrategy} to ${strategy}`)
    this.currentStrategy = strategy
    this.highlightButton(strategy)

    // Notify listeners
    if (this.onStrategyChange) {
      this.onStrategyChange(strategy)
    }
  }

  private setupKeyboardShortcuts() {
    const keyboard = this.scene.input.keyboard!

    keyboard.on('keydown-ONE', () => this.setStrategy(Strategy.ENGAGE))
    keyboard.on('keydown-TWO', () => this.setStrategy(Strategy.GUARD))
    keyboard.on('keydown-THREE', () => this.setStrategy(Strategy.EVADE))
    keyboard.on('keydown-FOUR', () => this.setStrategy(Strategy.BURST))
  }
}
