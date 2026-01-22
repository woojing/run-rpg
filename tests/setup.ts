import { vi, beforeEach } from 'vitest'
import { createCanvas } from 'canvas'

// Setup canvas for Phaser HEADLESS mode
const canvas = createCanvas(1920, 1080)
global.HTMLCanvasElement.prototype.getContext = vi.fn((contextType: string) => {
  if (contextType === '2d') {
    return canvas.getContext('2d')
  }
  return null
}) as any

// Mock localStorage for all tests
const localStorageMock = {
  getItem: vi.fn(() => null),
  setItem: vi.fn(() => {}),
  removeItem: vi.fn(() => {}),
  clear: vi.fn(() => {}),
  length: 0,
  key: vi.fn(() => null)
}

global.localStorage = localStorageMock as Storage

// Mock Phaser for all tests
global.Phaser = {
  Math: {
    Angle: {
      Between: vi.fn((x1: number, y1: number, x2: number, y2: number) => {
        return Math.atan2(y2 - y1, x2 - x1)
      })
    },
    Distance: {
      Between: vi.fn((x1: number, y1: number, x2: number, y2: number) => {
        return Math.hypot(x2 - x1, y2 - y1)
      })
    }
  }
} as any

// Reset mocks before each test
beforeEach(() => {
  vi.clearAllMocks()
})
