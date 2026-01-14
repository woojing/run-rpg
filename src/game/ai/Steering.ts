/**
 * Steering behaviors for AI movement
 * Based on Craig Reynolds' steering behaviors
 */

/**
 * Calculate velocity from angle and speed
 * Phaser 4 compatibility helper
 */
function velocityFromAngle(angle: number, speed: number): { x: number; y: number } {
  return {
    x: Math.cos(angle) * speed,
    y: Math.sin(angle) * speed
  }
}

export class Steering {
  /**
   * Seek: Move toward a target position
   */
  static seek(
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    speed: number
  ): { x: number; y: number } {
    const angle = Phaser.Math.Angle.Between(fromX, fromY, toX, toY)
    return velocityFromAngle(angle, speed)
  }

  /**
   * Flee: Move away from a threat position
   */
  static flee(
    fromX: number,
    fromY: number,
    threatX: number,
    threatY: number,
    speed: number
  ): { x: number; y: number } {
    const angle = Phaser.Math.Angle.Between(threatX, threatY, fromX, fromY)
    return velocityFromAngle(angle, speed)
  }

  /**
   * Orbit: Maintain distance while circling around target
   */
  static orbit(
    fromX: number,
    fromY: number,
    targetX: number,
    targetY: number,
    desiredDistance: number,
    speed: number
  ): { x: number; y: number } {
    const dist = Phaser.Math.Distance.Between(fromX, fromY, targetX, targetY)
    const angleToTarget = Phaser.Math.Angle.Between(fromX, fromY, targetX, targetY)

    // If too close, flee. If too far, seek. If at distance, strafe.
    if (dist < desiredDistance * 0.8) {
      // Too close - back away while strafing
      const fleeAngle = angleToTarget + Math.PI
      const strafeAngle = fleeAngle + Math.PI / 2
      const velocity = velocityFromAngle(strafeAngle, speed * 0.7)
      return velocity
    } else if (dist > desiredDistance * 1.2) {
      // Too far - move closer while strafing
      const strafeAngle = angleToTarget + Math.PI / 2
      const velocity = velocityFromAngle(strafeAngle, speed * 0.7)
      return velocity
    } else {
      // At desired distance - pure strafe
      const strafeAngle = angleToTarget + Math.PI / 2
      return velocityFromAngle(strafeAngle, speed)
    }
  }

  /**
   * Stop: Zero velocity
   */
  static stop(): { x: number; y: number } {
    return { x: 0, y: 0 }
  }
}
