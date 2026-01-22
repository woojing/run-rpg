import Phaser from 'phaser'
import { SCENE_KEYS } from '../constants.js'
import { TelemetryData } from '../systems/Telemetry.js'
import { Strategy } from '../ai/Strategy.js'
import { GrowthResolver, GrowthResult } from '../systems/GrowthResolver.js'
import { RunRecorder } from '../systems/RunRecorder.js'
import { TRAITS } from '../data/growthTraits.js'

export default class SummaryScene extends Phaser.Scene {
  telemetry!: TelemetryData
  growthResult!: GrowthResult
  runRecorder!: RunRecorder

  constructor() {
    super({ key: SCENE_KEYS.SUMMARY })
  }

  init(data: { telemetry: TelemetryData }) {
    this.telemetry = data.telemetry
    this.runRecorder = new RunRecorder()

    // Resolve profile and traits
    const resolver = new GrowthResolver()
    this.growthResult = resolver.resolve(this.telemetry)

    console.log('SummaryScene: Profile', this.growthResult.profile)
    console.log('SummaryScene: Traits', this.growthResult.grantedTraits)

    // Save traits to persistent storage
    this.runRecorder.saveRun(this.telemetry, this.growthResult.profile.profileName, this.growthResult.grantedTraits)
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

    // Growth section - Profile and Traits
    this.displayGrowthSection(560)

    // Restart button
    const restartBtn = this.createButton(960, 920, 300, 80, 'NEXT RUN', 0x33ff33)
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

  /**
   * Display growth section with profile bars and granted traits
   */
  private displayGrowthSection(y: number) {
    // Section title
    const title = this.add.text(960, y, 'GROWTH ANALYSIS', {
      fontSize: '36px',
      color: '#ffff00',
      fontStyle: 'bold'
    })
    title.setOrigin(0.5)

    // Profile name
    const profileName = this.add.text(960, y + 45, this.growthResult.profile.profileName, {
      fontSize: '28px',
      color: '#33ff33',
      fontStyle: 'bold'
    })
    profileName.setOrigin(0.5)

    // Profile bars
    const barY = y + 80
    const barWidth = 200
    const barHeight = 20
    const barSpacing = 50

    // Dodge bar
    this.displayProfileBar(400, barY, 'Dodge', this.growthResult.profile.dodgeScore, 0x3333ff)
    // Aggression bar
    this.displayProfileBar(960, barY, 'Aggression', this.growthResult.profile.aggressionScore, 0xff3333)
    // Defense bar
    this.displayProfileBar(1520, barY, 'Defense', this.growthResult.profile.defenseScore, 0x33ff33)

    // Traits section
    const traitsY = barY + 80
    const traitsTitle = this.add.text(960, traitsY, `TRAITS GRANTED (${this.growthResult.grantedTraits.length})`, {
      fontSize: '28px',
      color: '#ffff00',
      fontStyle: 'bold'
    })
    traitsTitle.setOrigin(0.5)

    // Trait cards
    const traitStartY = traitsY + 50
    const traitCardWidth = 380
    const traitCardHeight = 100
    const traitSpacing = 20

    this.growthResult.grantedTraits.forEach((traitId, index) => {
      const trait = TRAITS[traitId]
      if (!trait) return

      // Calculate position (2 columns)
      const col = index % 2
      const row = Math.floor(index / 2)
      const x = 485 + col * (traitCardWidth + traitSpacing)
      const y = traitStartY + row * (traitCardHeight + traitSpacing)

      this.displayTraitCard(x, y, traitCardWidth, traitCardHeight, trait)
    })

    // Explanations
    const explanationY = traitStartY + Math.ceil(this.growthResult.grantedTraits.length / 2) * (traitCardHeight + traitSpacing) + 20

    if (this.growthResult.explanations.length > 0) {
      const explanationTitle = this.add.text(960, explanationY, 'WHY THESE TRAITS?', {
        fontSize: '24px',
        color: '#aaaaaa',
        fontStyle: 'bold'
      })
      explanationTitle.setOrigin(0.5)

      const explanationsText = this.growthResult.explanations.join('\n')
      const explanations = this.add.text(960, explanationY + 35, explanationsText, {
        fontSize: '18px',
        color: '#888888',
        align: 'center'
      })
      explanations.setOrigin(0.5)
    }
  }

  /**
   * Display a profile bar
   */
  private displayProfileBar(x: number, y: number, label: string, score: number, color: number) {
    const barWidth = 200
    const barHeight = 20

    // Label
    const labelText = this.add.text(x, y - 15, label, {
      fontSize: '20px',
      color: '#ffffff',
      fontStyle: 'bold'
    })
    labelText.setOrigin(0.5)

    // Background bar
    const bgBar = this.add.rectangle(x, y, barWidth, barHeight, 0x333333)
    bgBar.setOrigin(0.5)

    // Fill bar
    const fillWidth = (score / 100) * barWidth
    const fillBar = this.add.rectangle(x - barWidth / 2 + fillWidth / 2, y, fillWidth, barHeight, color)
    fillBar.setOrigin(0.5)

    // Score text
    const scoreText = this.add.text(x, y + barHeight / 2 + 20, `${score}`, {
      fontSize: '18px',
      color: '#ffffff'
    })
    scoreText.setOrigin(0.5)
  }

  /**
   * Display a trait card
   */
  private displayTraitCard(x: number, y: number, width: number, height: number, trait: any) {
    // Card background
    const bg = this.add.rectangle(x, y, width, height, 0x1a1a2e)
    bg.setOrigin(0.5)

    // Card border
    const border = this.add.rectangle(x, y, width, height, 0x4444ff)
    border.setOrigin(0.5)
    border.setStrokeStyle(2, 0x4444ff)

    // Trait name
    const nameText = this.add.text(x - width / 2 + 10, y - height / 2 + 10, trait.name, {
      fontSize: '20px',
      color: '#ffff00',
      fontStyle: 'bold'
    })

    // Trait description
    const descText = this.add.text(x, y + 10, trait.description, {
      fontSize: '16px',
      color: '#ffffff',
      align: 'center',
      wordWrap: { width: width - 20 }
    })
    descText.setOrigin(0.5)
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
