import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createBattleScene, destroyTestGame, delay } from '../../helpers/phaser-mocks'
import { SCENE_KEYS } from '@/game/constants'

/**
 * BATTLE SCENE DEATH FLOW INTEGRATION TESTS
 *
 * CURRENT STATUS: SKIPPED - Waiting for Phaser 4 RC stabilization
 *
 * These integration tests are designed to verify the complete death flow from
 * BattleScene through SummaryScene:
 * - agent.takeDamage(9999) → died event → endRun(false) → save telemetry →
 *   scene.start(SUMMARY, { telemetry })
 *
 * PROBLEM:
 * Phaser 4 RC version has WebGL module dependencies that fail in test environments:
 * - Error: "Cannot find module 'phaser3spectorjs'"
 * - jsdom/happy-dom don't provide native canvas/WebGL support
 * - Vitest Browser Mode with Playwright requires complex setup and is poorly documented
 *
 * WHEN TO ENABLE:
 * 1. Phaser 4 stable release is available, OR
 * 2. Vitest Browser Mode documentation improves for Phaser, OR
 * 3. Alternative approach: Use Playwright/Puppeteer directly without Vitest wrapper
 *
 * ALTERNATIVE: Current unit tests already cover critical death flow logic:
 * - Telemetry.test.ts: Records damage, sets runResult to 'defeat'
 * - GrowthResolver.test.ts: Profiles based on death telemetry
 *
 * To run these tests when dependencies are resolved:
 * 1. Uncomment the tests below
 * 2. Install: npm install -D @vitest/browser @vitest/browser-playwright playwright
 * 3. Run: npm test -- --browser tests/integration
 */

describe.skip('BattleScene Death Flow', () => {
  let game: any
  let scene: any

  beforeEach(async () => {
    const setup = await createBattleScene()
    game = setup.game
    scene = setup.scene
  })

  afterEach(() => {
    destroyTestGame(game)
  })

  describe('agent death triggers endRun', () => {
    it('should stop timer when agent dies', () => {
      expect(scene.runTimer.isComplete).toBe(false)

      // Deal fatal damage to agent
      scene.agent.takeDamage(9999)

      // Timer should be stopped
      expect(scene.runTimer.isComplete).toBe(true)
    })

    it('should set telemetry result to defeat on death', () => {
      // Deal fatal damage to agent
      scene.agent.takeDamage(9999)

      // Allow event propagation
      delay(50)

      // Telemetry should show defeat
      expect(scene.telemetry.data.runResult).toBe('defeat')
    })

    it('should track damage taken before death', () => {
      // Deal non-fatal damage first
      scene.agent.takeDamage(30)

      expect(scene.telemetry.data.hitsTakenCount).toBe(1)
      expect(scene.telemetry.data.damageTakenTotal).toBe(30)

      // Deal fatal damage
      scene.agent.takeDamage(70)

      // Allow event propagation
      delay(50)

      expect(scene.telemetry.data.hitsTakenCount).toBe(2)
      expect(scene.telemetry.data.damageTakenTotal).toBe(100)
    })

    it('should call runRecorder.saveRun after death', () => {
      const saveRunSpy = vi.spyOn(scene.runRecorder, 'saveRun')

      // Deal fatal damage to agent
      scene.agent.takeDamage(9999)

      // Allow event propagation
      delay(100)

      // saveRun should have been called
      expect(saveRunSpy).toHaveBeenCalledTimes(1)

      // Verify it was called with defeat result
      const callArg = saveRunSpy.mock.calls[0][0]
      expect(callArg.runResult).toBe('defeat')
    })

    it('should transition to SummaryScene with telemetry', () => {
      const sceneStartSpy = vi.spyOn(scene.scene, 'start')

      // Deal fatal damage to agent
      scene.agent.takeDamage(9999)

      // Allow event propagation and scene transition
      delay(100)

      // SummaryScene should have been started
      expect(sceneStartSpy).toHaveBeenCalledTimes(1)
      expect(sceneStartSpy).toHaveBeenCalledWith(
        SCENE_KEYS.SUMMARY,
        expect.objectContaining({
          telemetry: expect.any(Object)
        })
      )
    })

    it('should record elapsed time in telemetry', () => {
      // Wait a bit for time to pass
      delay(100)

      const elapsedTimeBeforeDeath = scene.runTimer.elapsedTime

      // Deal fatal damage to agent
      scene.agent.takeDamage(9999)

      // Allow event propagation
      delay(100)

      // Telemetry should have recorded elapsed time
      expect(scene.telemetry.data.runDuration).toBeCloseTo(elapsedTimeBeforeDeath, 1)
    })
  })

  describe('complete death flow integration', () => {
    it('should execute full death flow: damage → died → endRun → save → transition', async () => {
      const saveRunSpy = vi.spyOn(scene.runRecorder, 'saveRun')
      const sceneStartSpy = vi.spyOn(scene.scene, 'start')

      // Initial state
      expect(scene.agent.hp).toBe(100)
      expect(scene.runTimer.isComplete).toBe(false)
      expect(scene.telemetry.data.runResult).toBe('victory') // Initial state

      // Deal fatal damage
      scene.agent.takeDamage(9999)

      // Wait for async operations
      await delay(150)

      // Verify agent state
      expect(scene.agent.hp).toBe(0)

      // Verify timer stopped
      expect(scene.runTimer.isComplete).toBe(true)

      // Verify telemetry finalized
      expect(scene.telemetry.data.runResult).toBe('defeat')

      // Verify run saved
      expect(saveRunSpy).toHaveBeenCalledTimes(1)

      // Verify scene transition
      expect(sceneStartSpy).toHaveBeenCalledTimes(1)
      expect(sceneStartSpy).toHaveBeenCalledWith(
        SCENE_KEYS.SUMMARY,
        expect.objectContaining({
          telemetry: expect.objectContaining({
            runResult: 'defeat'
          })
        })
      )
    })

    it('should handle multiple damage events before death', async () => {
      const saveRunSpy = vi.spyOn(scene.runRecorder, 'saveRun')

      // Multiple non-fatal hits
      scene.agent.takeDamage(25)
      await delay(10)

      scene.agent.takeDamage(30)
      await delay(10)

      scene.agent.takeDamage(20)
      await delay(10)

      // Check telemetry before death
      expect(scene.telemetry.data.hitsTakenCount).toBe(3)
      expect(scene.telemetry.data.damageTakenTotal).toBe(75)

      // Fatal hit
      scene.agent.takeDamage(25)
      await delay(100)

      // Verify all damage was tracked
      expect(scene.telemetry.data.hitsTakenCount).toBe(4)
      expect(scene.telemetry.data.damageTakenTotal).toBe(100)

      // Verify death was processed
      expect(scene.agent.hp).toBe(0)
      expect(scene.telemetry.data.runResult).toBe('defeat')
      expect(saveRunSpy).toHaveBeenCalledTimes(1)
    })
  })
})
