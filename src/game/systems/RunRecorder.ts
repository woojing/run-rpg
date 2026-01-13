import { TelemetryData } from './Telemetry.js'

export interface RunRecord {
  timestamp: number
  telemetry: TelemetryData
  playstyleProfile?: string
  grantedTraits?: string[]
}

export class RunRecorder {
  private storageKey = 'tac-auto-rpg-runs'
  private maxStoredRuns = 20

  saveRun(telemetry: TelemetryData, profile?: string, traits?: string[]) {
    const record: RunRecord = {
      timestamp: Date.now(),
      telemetry,
      playstyleProfile: profile,
      grantedTraits: traits
    }

    const runs = this.getAllRuns()
    runs.unshift(record)

    // Keep only last N runs
    if (runs.length > this.maxStoredRuns) {
      runs.splice(this.maxStoredRuns)
    }

    localStorage.setItem(this.storageKey, JSON.stringify(runs))
    console.log(`RunRecorder: Saved run. Total runs: ${runs.length}`)
  }

  getAllRuns(): RunRecord[] {
    const data = localStorage.getItem(this.storageKey)
    return data ? JSON.parse(data) : []
  }

  getRecentRuns(count: number = 5): RunRecord[] {
    const runs = this.getAllRuns()
    return runs.slice(0, Math.min(count, runs.length))
  }

  getCumulativeStats() {
    const runs = this.getAllRuns()

    if (runs.length === 0) {
      return {
        totalRuns: 0,
        victories: 0,
        avgDuration: 0,
        totalKills: 0,
        profileDistribution: {} as { [key: string]: number }
      }
    }

    const victories = runs.filter((r) => r.telemetry.runResult === 'victory').length
    const avgDuration =
      runs.reduce((sum, r) => sum + r.telemetry.runDuration, 0) / runs.length
    const totalKills = runs.reduce(
      (sum, r) =>
        sum +
        Object.values(r.telemetry.killsByArchetype).reduce((a: number, b: number) => a + b, 0),
      0
    )

    const profileDistribution: { [key: string]: number } = {}
    runs.forEach((run) => {
      if (run.playstyleProfile) {
        profileDistribution[run.playstyleProfile] =
          (profileDistribution[run.playstyleProfile] || 0) + 1
      }
    })

    return {
      totalRuns: runs.length,
      victories,
      avgDuration,
      totalKills,
      profileDistribution
    }
  }

  clearAll() {
    localStorage.removeItem(this.storageKey)
    console.log('RunRecorder: Cleared all runs')
  }
}
