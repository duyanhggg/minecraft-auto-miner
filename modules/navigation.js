/**
 * Navigation Module - Pathfinding and Obstacle Avoidance
 * Handles autonomous navigation, pathfinding, and collision detection for mining operations
 */

const Vec3 = require('vec3');

class Navigation {
  constructor(bot) {
    this.bot = bot;
    this.goals = [];
    this.currentPath = [];
    this.pathfindingActive = false;
    this.obstacleCheckInterval = 100; // ms
    this.lastPathUpdate = 0;
    this.pathUpdateInterval = 500; // ms
  }

  /**
   * Navigate to a specific coordinate
   * @param {Vec3} target - Target position
   * @param {Object} options - Navigation options
   * @returns {Promise<boolean>} - True if reached, false if blocked/timeout
   */
  async goTo(target, options = {}) {
    const {
      timeout = 60000,
      checkObstacles = true,
      avoidLava = true,
      avoidWater = false,
      tolerance = 0.5
    } = options;

    this.goals.push({
      position: target,
      tolerance,
      timestamp: Date.now()
    });

    return this._navigatePath(target, { timeout, checkObstacles, avoidLava, avoidWater, tolerance });
  }

  /**
   * Internal pathfinding navigation
   * @private
   */
  async _navigatePath(target, options) {
    const startTime = Date.now();
    const { timeout, checkObstacles, avoidLava, avoidWater, tolerance } = options;

    while (Date.now() - startTime < timeout) {
      const currentPos = this.bot.entity.position;
      const distance = currentPos.distanceTo(target);

      // Check if reached target
      if (distance < tolerance) {
        this.pathfindingActive = false;
        return true;
      }

      // Check for obstacles
      if (checkObstacles && this._isObstacleAhead()) {
        const avoidanceDir = this._calculateAvoidance();
        if (avoidanceDir) {
          await this._moveInDirection(avoidanceDir);
        }
      }

      // Check dangerous blocks
      if (avoidLava && this._isDangerousBlock('lava')) {
        await this._avoidDanger('lava');
      }
      if (avoidWater && this._isDangerousBlock('water')) {
        await this._avoidDanger('water');
      }

      // Move towards target
      await this._moveTowards(target);

      await this._sleep(50);
    }

    return false;
  }

  /**
   * Move towards a target position
   * @private
   */
  async _moveTowards(target) {
    const pos = this.bot.entity.position;
    const direction = target.minus(pos).normalize();

    // Horizontal movement
    this.bot.setControlState('forward', true);

    // Handle vertical movement
    if (target.y > pos.y + 0.5) {
      this.bot.setControlState('jump', true);
      await this._sleep(50);
      this.bot.setControlState('jump', false);
    } else if (target.y < pos.y - 0.5) {
      // Try to move down (jump off edge if needed)
      const nextPos = pos.offset(0, -1, 0);
      if (this._canStand(nextPos)) {
        // Safe to move down
      }
    }

    // Strafe if needed
    const yaw = Math.atan2(-direction.x, -direction.z);
    this.bot.look(yaw, 0);
  }

  /**
   * Check if there's an obstacle ahead
   * @private
   */
  _isObstacleAhead() {
    const pos = this.bot.entity.position;
    const lookDir = this.bot.entity.velocity.normalize();

    // Check blocks in front
    for (let i = 1; i <= 3; i++) {
      const checkPos = pos.offset(
        lookDir.x * i,
        0,
        lookDir.z * i
      );

      const block = this.bot.blockAt(checkPos);
      if (block && this._isSolidBlock(block)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Calculate avoidance direction when obstacle is detected
   * @private
   */
  _calculateAvoidance() {
    const pos = this.bot.entity.position;
    const directions = [
      { dx: 1, dz: 0, name: 'right' },
      { dx: -1, dz: 0, name: 'left' },
      { dx: 0, dz: 1, name: 'forward' },
      { dx: 0, dz: -1, name: 'back' }
    ];

    // Try directions in order of preference
    for (const dir of directions) {
      const checkPos = pos.offset(dir.dx, 0, dir.dz);
      if (this._canMove(checkPos)) {
        return dir;
      }
    }

    return null;
  }

  /**
   * Move in a specific direction
   * @private
   */
  async _moveInDirection(direction) {
    const { dx, dz } = direction;

    if (dx > 0) this.bot.setControlState('right', true);
    if (dx < 0) this.bot.setControlState('left', true);
    if (dz > 0) this.bot.setControlState('forward', true);
    if (dz < 0) this.bot.setControlState('back', true);

    await this._sleep(100);

    this.bot.setControlState('right', false);
    this.bot.setControlState('left', false);
    this.bot.setControlState('forward', false);
    this.bot.setControlState('back', false);
  }

  /**
   * Check if a position contains dangerous liquid
   * @private
   */
  _isDangerousBlock(blockType) {
    const pos = this.bot.entity.position;

    // Check current position and surrounding blocks
    for (let x = -1; x <= 1; x++) {
      for (let y = -1; y <= 2; y++) {
        for (let z = -1; z <= 1; z++) {
          const checkPos = pos.offset(x, y, z);
          const block = this.bot.blockAt(checkPos);

          if (block && block.type) {
            const blockName = block.name || '';
            if (blockName.includes(blockType)) {
              return true;
            }
          }
        }
      }
    }

    return false;
  }

  /**
   * Avoid dangerous areas
   * @private
   */
  async _avoidDanger(dangerType) {
    const pos = this.bot.entity.position;
    const directions = [
      { dx: 1, dz: 0 },
      { dx: -1, dz: 0 },
      { dx: 0, dz: 1 },
      { dx: 0, dz: -1 }
    ];

    for (const dir of directions) {
      const checkPos = pos.offset(dir.dx, 0, dir.dz);
      const block = this.bot.blockAt(checkPos);

      if (!block || !block.name.includes(dangerType)) {
        await this._moveInDirection(dir);
        return;
      }
    }
  }

  /**
   * Check if a block is solid/walkable
   * @private
   */
  _isSolidBlock(block) {
    if (!block) return false;

    const liquidBlocks = ['water', 'lava', 'air'];
    const blockName = block.name || '';

    return !liquidBlocks.some(liquid => blockName.includes(liquid)) && block.boundingBox === 'block';
  }

  /**
   * Check if bot can stand on a position
   * @private
   */
  _canStand(pos) {
    const block = this.bot.blockAt(pos);
    const belowBlock = this.bot.blockAt(pos.offset(0, -1, 0));

    if (!block || !belowBlock) return false;

    const isPassable = ['air', 'water', 'lava'].some(b => block.name.includes(b));
    const isSolid = this._isSolidBlock(belowBlock);

    return isPassable && isSolid;
  }

  /**
   * Check if bot can move to a position
   * @private
   */
  _canMove(pos) {
    // Check all blocks the bot would occupy
    for (let y = 0; y < 2; y++) {
      const block = this.bot.blockAt(pos.offset(0, y, 0));
      if (block && this._isSolidBlock(block)) {
        return false;
      }
    }

    return this._canStand(pos);
  }

  /**
   * Stop all movement
   */
  stop() {
    this.pathfindingActive = false;
    this.goals = [];
    this.bot.setControlState('forward', false);
    this.bot.setControlState('back', false);
    this.bot.setControlState('left', false);
    this.bot.setControlState('right', false);
    this.bot.setControlState('jump', false);
  }

  /**
   * Get current navigation status
   */
  getStatus() {
    return {
      isNavigating: this.pathfindingActive,
      goalCount: this.goals.length,
      currentPosition: this.bot.entity.position,
      goals: this.goals
    };
  }

  /**
   * Utility sleep function
   * @private
   */
  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = Navigation;
