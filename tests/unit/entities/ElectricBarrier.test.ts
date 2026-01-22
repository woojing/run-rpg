import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock Phaser before importing ElectricBarrier
vi.mock('phaser', () => ({
  default: {
    GameObjects: {
      Container: class MockContainer {
        constructor(scene: any, x: number, y: number) {
          this.scene = scene
          this.x = x
          this.y = y
          this.children = []
        }
        add(child: any) {
          this.children.push(child)
          return this
        }
        setRotation(angle: number) {
          this.rotation = angle
          return this
        }
        setVisible(visible: boolean) {
          this.visible = visible
          return this
        }
        destroy() {}
      },
      Graphics: class MockGraphics {},
      Zone: class MockZone {},
      Particles: {
        ParticleEmitter: class MockParticleEmitter {
          start() { return this }
          stop() {}
          destroy() {}
          emitParticleAt(x: number, y: number) {}
        }
      }
    },
    Math: {
      Angle: {
        Between: vi.fn(() => 0)
      },
      Distance: {
        Between: vi.fn(() => 100)
      }
    }
  }
}))

import { ElectricBarrier } from '@/game/entities/ElectricBarrier'

// Mock scene with physics
class MockScene {
  physics = {
    overlap: vi.fn(() => false),
    add: {
      existing: vi.fn()
    }
  }
  add = {
    graphics: vi.fn(() => ({
      lineStyle: vi.fn(() => ({})),
      lineBetween: vi.fn(() => ({})),
      generateTexture: vi.fn(),
      destroy: vi.fn()
    })),
    zone: vi.fn(() => ({})),
    particles: vi.fn(() => ({
      start: vi.fn(),
      stop: vi.fn(),
      destroy: vi.fn()
    }))
  }
  make = {
    graphics: vi.fn(() => ({
      fillStyle: vi.fn(() => ({})),
      fillCircle: vi.fn(() => ({})),
      generateTexture: vi.fn(),
      destroy: vi.fn()
    }))
  }
  tweens = {
    add: vi.fn()
  }
  time = {
    addEvent: vi.fn()
  }
  textures = {
    exists: vi.fn(() => false),
    remove: vi.fn()
  }
}

// Mock Agent
class MockAgent {
  body = {
    enable: true
  }
  invulnerable = false
  takeDamage = vi.fn()
}

describe('ElectricBarrier', () => {
  let mockScene: MockScene
  let mockAgent: MockAgent
  let barrier: ElectricBarrier

  beforeEach(() => {
    mockScene = new MockScene() as any
    mockAgent = new MockAgent() as any

    // Cast mockScene to Phaser.Scene for ElectricBarrier constructor
    // Note: This is a simplified mock - in real scenario, would need full Phaser Scene
    vi.clearAllMocks()
  })

  describe('constructor', () => {
    it('should create barrier with correct properties', () => {
      // Since ElectricBarrier extends Phaser.GameObjects.Container,
      // we need to properly mock the scene
      const scene = {
        ...mockScene,
        add: {
          ...mockScene.add,
          zone: vi.fn(() => ({ body: { enable: true } }))
        }
      } as any

      // Barrier creation will fail without proper Phaser setup,
      // but we can test that the constructor accepts the parameters
      expect(() => {
        new ElectricBarrier(scene, 0, 0, 100, 100)
      }).not.toThrow()
    })
  })

  describe('update', () => {
    beforeEach(() => {
      const scene = {
        ...mockScene,
        add: {
          ...mockScene.add,
          zone: vi.fn(() => ({ body: { enable: true } }))
        }
      } as any

      // Create barrier for update tests
      barrier = new ElectricBarrier(scene, 0, 0, 100, 100) as any
      barrier.scene = scene
      barrier.damageZone = { body: { enable: true } } as any
    })

    it('should return early when isActive is false', () => {
      barrier.isActive = false

      expect(() => {
        barrier.update(16, mockAgent as any)
      }).not.toThrow()

      expect(mockScene.physics.overlap).not.toHaveBeenCalled()
      expect(mockAgent.takeDamage).not.toHaveBeenCalled()
    })

    it('should return early when scene.physics is undefined', () => {
      barrier.scene = {} as any
      barrier.isActive = true

      expect(() => {
        barrier.update(16, mockAgent as any)
      }).not.toThrow()

      expect(mockAgent.takeDamage).not.toHaveBeenCalled()
    })

    it('should return early when damageZone.body is undefined', () => {
      barrier.damageZone = {} as any
      barrier.isActive = true

      expect(() => {
        barrier.update(16, mockAgent as any)
      }).not.toThrow()

      expect(mockScene.physics.overlap).not.toHaveBeenCalled()
      expect(mockAgent.takeDamage).not.toHaveBeenCalled()
    })

    it('should return early when agent.body is undefined', () => {
      const agentWithoutBody = { ...mockAgent, body: undefined } as any
      barrier.isActive = true

      expect(() => {
        barrier.update(16, agentWithoutBody)
      }).not.toThrow()

      expect(mockScene.physics.overlap).not.toHaveBeenCalled()
    })

    it('should check overlap when all conditions are met', () => {
      barrier.isActive = true
      barrier.scene = mockScene as any
      barrier.damageZone = { body: { enable: true } } as any

      mockScene.physics.overlap.mockReturnValue(true)

      barrier.update(16, mockAgent as any)

      expect(mockScene.physics.overlap).toHaveBeenCalledTimes(1)
    })

    it('should deal damage when overlapping and agent not invulnerable', () => {
      barrier.isActive = true
      barrier.scene = mockScene as any
      barrier.damageZone = { body: { enable: true } } as any
      barrier.damagePerSecond = 20

      mockScene.physics.overlap.mockReturnValue(true)
      mockAgent.invulnerable = false

      barrier.update(1000, mockAgent as any) // 1 second = 20 damage

      expect(mockAgent.takeDamage).toHaveBeenCalledWith(20)
    })

    it('should not deal damage when agent is invulnerable', () => {
      barrier.isActive = true
      barrier.scene = mockScene as any
      barrier.damageZone = { body: { enable: true } } as any

      mockScene.physics.overlap.mockReturnValue(true)
      mockAgent.invulnerable = true

      barrier.update(1000, mockAgent as any)

      expect(mockAgent.takeDamage).not.toHaveBeenCalled()
    })

    it('should calculate damage proportionally to delta time', () => {
      barrier.isActive = true
      barrier.scene = mockScene as any
      barrier.damageZone = { body: { enable: true } } as any
      barrier.damagePerSecond = 20

      mockScene.physics.overlap.mockReturnValue(true)
      mockAgent.invulnerable = false

      barrier.update(500, mockAgent as any) // 0.5 second = 10 damage

      expect(mockAgent.takeDamage).toHaveBeenCalledWith(10)
    })

    it('should not deal damage when not overlapping', () => {
      barrier.isActive = true
      barrier.scene = mockScene as any
      barrier.damageZone = { body: { enable: true } } as any

      mockScene.physics.overlap.mockReturnValue(false)

      barrier.update(1000, mockAgent as any)

      expect(mockAgent.takeDamage).not.toHaveBeenCalled()
    })
  })

  describe('setActive', () => {
    it('should update isActive state', () => {
      const scene = mockScene as any
      const barrier = new ElectricBarrier(scene, 0, 0, 100, 100) as any

      barrier.setActive(false)
      expect(barrier.isActive).toBe(false)

      barrier.setActive(true)
      expect(barrier.isActive).toBe(true)
    })
  })
})
