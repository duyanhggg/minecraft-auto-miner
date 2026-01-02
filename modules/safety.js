/**
 * Safety Module - Handles environment hazard detection and avoidance
 * Provides checks for lava, water, and hostile mobs
 */

const Vec3 = require('vec3');

class SafetyChecker {
  constructor(bot) {
    this.bot = bot;
    this.dangerousBlocks = ['lava', 'flowing_lava'];
    this.waterBlocks = ['water', 'flowing_water'];
    this.safeDistance = 5; // Minimum safe distance from hazards
  }

  /**
   * Check if a position contains lava
   * @param {Vec3} position - Block position to check
   * @returns {boolean} True if lava is present
   */
  isLavaPresent(position) {
    if (!position) return false;
    
    const block = this.bot.world.getBlock(position);
    if (!block) return false;
    
    return this.dangerousBlocks.includes(block.name);
  }

  /**
   * Check if a position contains water
   * @param {Vec3} position - Block position to check
   * @returns {boolean} True if water is present
   */
  isWaterPresent(position) {
    if (!position) return false;
    
    const block = this.bot.world.getBlock(position);
    if (!block) return false;
    
    return this.waterBlocks.includes(block.name);
  }

  /**
   * Check if a position is safe from liquids
   * @param {Vec3} position - Block position to check
   * @returns {boolean} True if position is liquid-free
   */
  isLiquidFree(position) {
    return !this.isLavaPresent(position) && !this.isWaterPresent(position);
  }

  /**
   * Detect nearby mobs and classify as hostile or peaceful
   * @returns {Object} Object containing hostile and peaceful mob lists
   */
  detectNearbyMobs() {
    const hostileMobs = [];
    const peacefulMobs = [];
    const hostileTypes = [
      'zombie',
      'skeleton',
      'creeper',
      'spider',
      'cave_spider',
      'enderman',
      'witch',
      'slime',
      'magma_cube',
      'ghast',
      'blazeghast',
      'wither_skeleton',
      'stray',
      'husk',
      'drowned',
      'phantom',
      'pillager',
      'ravager'
    ];

    for (const entity of Object.values(this.bot.entities)) {
      if (!entity || entity.type !== 'mob') continue;
      
      const distance = this.bot.player.entity.position.distanceTo(entity.position);
      
      if (hostileTypes.includes(entity.name)) {
        hostileMobs.push({
          name: entity.name,
          position: entity.position,
          distance: distance
        });
      } else {
        peacefulMobs.push({
          name: entity.name,
          position: entity.position,
          distance: distance
        });
      }
    }

    return {
      hostile: hostileMobs,
      peaceful: peacefulMobs,
      threatLevel: hostileMobs.length > 0 ? 'high' : 'low'
    };
  }

  /**
   * Check if there are hostile mobs nearby
   * @param {number} maxDistance - Maximum distance to check (blocks)
   * @returns {boolean} True if hostile mobs are detected
   */
  hasHostileMobs(maxDistance = this.safeDistance) {
    const mobs = this.detectNearbyMobs();
    return mobs.hostile.some(mob => mob.distance <= maxDistance);
  }

  /**
   * Get the closest hostile mob
   * @returns {Object|null} Closest hostile mob or null if none found
   */
  getClosestHostileMob() {
    const mobs = this.detectNearbyMobs();
    
    if (mobs.hostile.length === 0) return null;
    
    return mobs.hostile.reduce((closest, current) => 
      current.distance < closest.distance ? current : closest
    );
  }

  /**
   * Scan area around position for hazards
   * @param {Vec3} position - Center position to scan
   * @param {number} radius - Radius to scan (blocks)
   * @returns {Object} Hazard analysis results
   */
  scanAreaForHazards(position, radius = 3) {
    const hazards = {
      lava: [],
      water: [],
      mobs: [],
      isSafe: true
    };

    if (!position) return hazards;

    // Scan cubic area
    for (let x = -radius; x <= radius; x++) {
      for (let y = -radius; y <= radius; y++) {
        for (let z = -radius; z <= radius; z++) {
          const checkPos = position.offset(x, y, z);
          const block = this.bot.world.getBlock(checkPos);
          
          if (!block) continue;

          if (this.isLavaPresent(checkPos)) {
            hazards.lava.push(checkPos.clone());
            hazards.isSafe = false;
          } else if (this.isWaterPresent(checkPos)) {
            hazards.water.push(checkPos.clone());
          }
        }
      }
    }

    // Check for nearby mobs
    const mobData = this.detectNearbyMobs();
    hazards.mobs = mobData.hostile;
    
    if (mobData.hostile.length > 0) {
      hazards.isSafe = false;
    }

    return hazards;
  }

  /**
   * Check if a mining location is safe
   * @param {Vec3} position - Position to mine
   * @returns {Object} Safety assessment with recommendations
   */
  assessMiningSafety(position) {
    const assessment = {
      position: position,
      isSafe: true,
      hazards: [],
      recommendations: []
    };

    // Check for lava
    if (this.isLavaPresent(position)) {
      assessment.isSafe = false;
      assessment.hazards.push('lava');
      assessment.recommendations.push('Use fire resistance potion or avoid');
    }

    // Check for water
    if (this.isWaterPresent(position)) {
      assessment.hazards.push('water');
      assessment.recommendations.push('Be cautious, mining underwater is slower');
    }

    // Check for mobs
    if (this.hasHostileMobs(this.safeDistance)) {
      assessment.isSafe = false;
      assessment.hazards.push('hostile mobs');
      const closestMob = this.getClosestHostileMob();
      assessment.recommendations.push(
        `Hostile mob nearby: ${closestMob.name} at ${closestMob.distance.toFixed(1)} blocks`
      );
    }

    // Scan surrounding area
    const areaScan = this.scanAreaForHazards(position, 2);
    if (areaScan.lava.length > 0) {
      assessment.hazards.push('nearby lava');
      assessment.isSafe = false;
    }

    return assessment;
  }

  /**
   * Emergency escape: move away from dangerous position
   * @param {Vec3} dangerousPosition - Position to escape from
   * @returns {Promise<boolean>} True if escape was successful
   */
  async emergencyEscape(dangerousPosition) {
    try {
      // Move up and away
      const escapeVector = this.bot.player.entity.position.offset(0, 2, 0);
      await this.bot.pathfinder.goto(new (require('vec3'))(
        escapeVector.x + 5,
        escapeVector.y,
        escapeVector.z + 5
      ));
      return true;
    } catch (error) {
      console.error('Emergency escape failed:', error);
      return false;
    }
  }

  /**
   * Set safe distance threshold
   * @param {number} distance - Distance in blocks
   */
  setSafeDistance(distance) {
    this.safeDistance = Math.max(2, distance);
  }
}

module.exports = SafetyChecker;
