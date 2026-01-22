import { describe, it, expect, beforeEach, vi } from 'vitest'
import { StrategyBar } from '@/game/ui/StrategyBar'
import { Strategy } from '@/game/ai/Strategy'

// Mock Phaser before importing
vi.mock('phaser', () => ({
  default: {
    GameObjects: {
      Container: class MockContainer {
        constructor(scene: any, x: number, y: number) {
          this.scene = scene
          this.x = x
          this.y = y
          this.children = []
          this.data = new Map()
        }
        add(child: any) {
          this.children.push(child)
          return this
        }
        setSize(width: number, height: number) {
          this.width = width
          this.height = height
          return this
        }
        setInteractive(config: any) {
          this.interactive = true
          return this
        }
        setOrigin(x: number, y: number) {
          this.originX = x
          this.originY = y
          return this
        }
        on(event: string, callback: Function) {
          if (!this.eventHandlers) {
            this.eventHandlers = new Map()
          }
          if (!this.eventHandlers.has(event)) {
            this.eventHandlers.set(event, [])
          }
          this.eventHandlers.get(event).push(callback)
          return this
        }
        getData(key: string) {
          return this.data.get(key)
        }
        setData(key: string, value: any) {
          this.data.set(key, value)
          return this
        }
        destroy() {}
      },
      Rectangle: class MockRectangle {
        constructor(x: number, y: number, width: number, height: number, color: number, alpha: number) {
          this.x = x
          this.y = y
          this.width = width
          this.height = height
          this.color = color
          this.alpha = alpha
        }
        setFillStyle(color: number, alpha?: number) {
          this.color = color
          if (alpha !== undefined) this.alpha = alpha
          return this
        }
        setStrokeStyle(width: number, color: number) {
          this.strokeWidth = width
          this.strokeColor = color
          return this
        }
      },
      Text: class MockText {
        constructor(x: number, y: number, text: string, style: any) {
          this.x = x
          this.y = y
          this.text = text
          this.style = style
          this.originX = 0
          this.originY = 0
        }
        setOrigin(x: number, y?: number) {
          this.originX = x
          this.originY = y !== undefined ? y : x
          return this
        }
      }
    }
  }
}))

describe('StrategyBar', () => {
  let mockScene: any
  let strategyBar: StrategyBar
  let strategyChangeSpy: any

  beforeEach(() => {
    // Create mock with proper bg objects
    const mockBg = {
      setFillStyle: vi.fn(),
      setStrokeStyle: vi.fn()
    }

    mockScene = {
      add: {
        container: vi.fn((x: number, y: number) => {
          const container: any = {
            add: vi.fn(),
            setSize: vi.fn(),
            setInteractive: vi.fn(),
            on: vi.fn(),
            getData: vi.fn((key: string) => {
              if (key === 'bg') return mockBg
              if (key === 'strategy') return Strategy.ENGAGE
              return undefined
            }),
            setData: vi.fn(),
            data: new Map()
          }
          container.data.set('bg', mockBg)
          container.data.set('strategy', Strategy.ENGAGE)
          return container
        }),
        rectangle: vi.fn(() => mockBg),
        text: vi.fn(() => ({
          setOrigin: vi.fn()
        }))
      },
      input: {
        keyboard: {
          on: vi.fn()
        }
      },
      tweens: {
        add: vi.fn()
      }
    }

    strategyChangeSpy = vi.fn()
    strategyBar = new StrategyBar(mockScene)
  })

  describe('keyboard shortcuts', () => {
    beforeEach(() => {
      strategyBar.create(strategyChangeSpy)
    })

    it('should register keydown-ONE event for ENGAGE strategy', () => {
      expect(mockScene.input.keyboard.on).toHaveBeenCalledWith('keydown-ONE', expect.any(Function))
    })

    it('should register keydown-TWO event for GUARD strategy', () => {
      expect(mockScene.input.keyboard.on).toHaveBeenCalledWith('keydown-TWO', expect.any(Function))
    })

    it('should register keydown-THREE event for EVADE strategy', () => {
      expect(mockScene.input.keyboard.on).toHaveBeenCalledWith('keydown-THREE', expect.any(Function))
    })

    it('should register keydown-FOUR event for BURST strategy', () => {
      expect(mockScene.input.keyboard.on).toHaveBeenCalledWith('keydown-FOUR', expect.any(Function))
    })

    it('should trigger strategy change when pressing 1 key', () => {
      // Get the callback registered for keydown-ONE
      const oneKeyCallback = mockScene.input.keyboard.on.mock.calls.find(
        (call: any[]) => call[0] === 'keydown-ONE'
      )[1]

      strategyBar.currentStrategy = Strategy.GUARD // Start with different strategy
      oneKeyCallback()

      expect(strategyBar.currentStrategy).toBe(Strategy.ENGAGE)
      expect(strategyChangeSpy).toHaveBeenCalledWith(Strategy.ENGAGE)
    })

    it('should trigger strategy change when pressing 2 key', () => {
      const twoKeyCallback = mockScene.input.keyboard.on.mock.calls.find(
        (call: any[]) => call[0] === 'keydown-TWO'
      )[1]

      strategyBar.currentStrategy = Strategy.ENGAGE
      twoKeyCallback()

      expect(strategyBar.currentStrategy).toBe(Strategy.GUARD)
      expect(strategyChangeSpy).toHaveBeenCalledWith(Strategy.GUARD)
    })

    it('should trigger strategy change when pressing 3 key', () => {
      const threeKeyCallback = mockScene.input.keyboard.on.mock.calls.find(
        (call: any[]) => call[0] === 'keydown-THREE'
      )[1]

      strategyBar.currentStrategy = Strategy.ENGAGE
      threeKeyCallback()

      expect(strategyBar.currentStrategy).toBe(Strategy.EVADE)
      expect(strategyChangeSpy).toHaveBeenCalledWith(Strategy.EVADE)
    })

    it('should trigger strategy change when pressing 4 key', () => {
      const fourKeyCallback = mockScene.input.keyboard.on.mock.calls.find(
        (call: any[]) => call[0] === 'keydown-FOUR'
      )[1]

      strategyBar.currentStrategy = Strategy.ENGAGE
      fourKeyCallback()

      expect(strategyBar.currentStrategy).toBe(Strategy.BURST)
      expect(strategyChangeSpy).toHaveBeenCalledWith(Strategy.BURST)
    })

    it('should not trigger callback if already on same strategy', () => {
      const oneKeyCallback = mockScene.input.keyboard.on.mock.calls.find(
        (call: any[]) => call[0] === 'keydown-ONE'
      )[1]

      strategyBar.currentStrategy = Strategy.ENGAGE
      strategyChangeSpy.mockClear()

      oneKeyCallback()

      // Should not call onStrategyChange if already on ENGAGE
      expect(strategyChangeSpy).not.toHaveBeenCalled()
    })
  })
})
