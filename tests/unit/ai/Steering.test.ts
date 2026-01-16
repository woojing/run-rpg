import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Steering } from '@/game/ai/Steering'

describe('Steering Behaviors', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('seek', () => {
    it('should calculate velocity toward target position', () => {
      const result = Steering.seek(0, 0, 100, 0, 10)

      // Should move in positive X direction
      expect(result.x).toBeCloseTo(10, 5)
      expect(result.y).toBeCloseTo(0, 5)
    })

    it('should seek diagonally', () => {
      const result = Steering.seek(0, 0, 100, 100, 10)

      // Should move in positive X and Y direction
      const magnitude = Math.hypot(result.x, result.y)
      expect(magnitude).toBeCloseTo(10, 5)
      expect(result.x).toBeGreaterThan(0)
      expect(result.y).toBeGreaterThan(0)
    })

    it('should seek from positive to negative coordinates', () => {
      const result = Steering.seek(100, 0, 0, 0, 10)

      // Should move in negative X direction
      expect(result.x).toBeCloseTo(-10, 5)
      expect(result.y).toBeCloseTo(0, 5)
    })
  })

  describe('flee', () => {
    it('should calculate velocity away from threat', () => {
      const result = Steering.flee(100, 0, 0, 0, 10)

      // Should move away from threat (positive X)
      expect(result.x).toBeCloseTo(10, 5)
      expect(result.y).toBeCloseTo(0, 5)
    })

    it('should flee from threat at origin', () => {
      const result = Steering.flee(0, 0, 50, 0, 10)

      // Should move away from threat (negative X)
      expect(result.x).toBeCloseTo(-10, 5)
      expect(result.y).toBeCloseTo(0, 5)
    })

    it('should flee diagonally', () => {
      const result = Steering.flee(0, 0, 50, 50, 10)

      const magnitude = Math.hypot(result.x, result.y)
      expect(magnitude).toBeCloseTo(10, 5)
      expect(result.x).toBeLessThan(0)
      expect(result.y).toBeLessThan(0)
    })
  })

  describe('orbit', () => {
    it('should strafe when at desired distance', () => {
      const fromX = 100, fromY = 0
      const toX = 0, toY = 0
      const distance = 100

      const result = Steering.orbit(fromX, fromY, toX, toY, distance, 10)

      // At desired distance - should strafe perpendicular
      const magnitude = Math.hypot(result.x, result.y)
      expect(magnitude).toBeCloseTo(10, 5)
      // Perpendicular to the target direction (which is left)
      // So should be mostly vertical
      expect(Math.abs(result.x)).toBeLessThan(3)
    })

    it('should back away and strafe when too close', () => {
      const fromX = 50, fromY = 0
      const toX = 0, toY = 0
      const desiredDistance = 100

      const result = Steering.orbit(fromX, fromY, toX, toY, desiredDistance, 10)

      // Should be slower when backing away (0.7x speed)
      const magnitude = Math.hypot(result.x, result.y)
      expect(magnitude).toBeCloseTo(7, 5)
    })

    it('should approach and strafe when too far', () => {
      const fromX = 200, fromY = 0
      const toX = 0, toY = 0
      const desiredDistance = 100

      const result = Steering.orbit(fromX, fromY, toX, toY, desiredDistance, 10)

      // Should be slower when approaching (0.7x speed)
      const magnitude = Math.hypot(result.x, result.y)
      expect(magnitude).toBeCloseTo(7, 5)
    })
  })

  describe('stop', () => {
    it('should return zero velocity', () => {
      const result = Steering.stop()

      expect(result.x).toBe(0)
      expect(result.y).toBe(0)
    })
  })
})
