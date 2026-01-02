/**
 * Mining Module - Auto-mining logic for rectangular area excavation
 * Provides functionality for automated mining operations in Minecraft
 */

class MiningModule {
  constructor(bot) {
    this.bot = bot;
    this.isMining = false;
    this.miningQueue = [];
    this.blocksPerSecond = 1;
    this.ignoredBlocks = ['bedrock', 'obsidian'];
  }

  /**
   * Initialize mining module
   */
  async init() {
    console.log('[Mining] Module initialized');
  }

  /**
   * Calculate rectangular area blocks to mine
   * @param {Object} startPos - Starting position {x, y, z}
   * @param {Object} endPos - Ending position {x, y, z}
   * @returns {Array} Array of block positions to mine
   */
  calculateMiningArea(startPos, endPos) {
    const blocks = [];
    
    const minX = Math.min(startPos.x, endPos.x);
    const maxX = Math.max(startPos.x, endPos.x);
    const minY = Math.min(startPos.y, endPos.y);
    const maxY = Math.max(startPos.y, endPos.y);
    const minZ = Math.min(startPos.z, endPos.z);
    const maxZ = Math.max(startPos.z, endPos.z);

    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        for (let z = minZ; z <= maxZ; z++) {
          blocks.push({
            x: x,
            y: y,
            z: z
          });
        }
      }
    }

    return blocks;
  }

  /**
   * Filter mineable blocks from a list of positions
   * @param {Array} positions - Array of block positions
   * @returns {Array} Filtered array of mineable blocks
   */
  filterMineableBlocks(positions) {
    return positions.filter(pos => {
      const block = this.bot.blockAt(pos);
      if (!block) return false;
      
      // Skip air blocks and ignored materials
      if (block.name === 'air' || this.ignoredBlocks.includes(block.name)) {
        return false;
      }
      
      return true;
    });
  }

  /**
   * Sort blocks by distance from bot's current position
   * @param {Array} blocks - Array of block positions
   * @returns {Array} Sorted array of block positions
   */
  sortBlocksByDistance(blocks) {
    const botPos = this.bot.entity.position;
    
    return blocks.sort((a, b) => {
      const distA = Math.sqrt(
        Math.pow(a.x - botPos.x, 2) +
        Math.pow(a.y - botPos.y, 2) +
        Math.pow(a.z - botPos.z, 2)
      );
      
      const distB = Math.sqrt(
        Math.pow(b.x - botPos.x, 2) +
        Math.pow(b.y - botPos.y, 2) +
        Math.pow(b.z - botPos.z, 2)
      );
      
      return distA - distB;
    });
  }

  /**
   * Mine a single block
   * @param {Object} blockPos - Block position {x, y, z}
   * @returns {Promise} Resolves when block is mined
   */
  async mineBlock(blockPos) {
    try {
      const block = this.bot.blockAt(blockPos);
      
      if (!block || block.name === 'air') {
        return Promise.resolve();
      }

      if (this.ignoredBlocks.includes(block.name)) {
        console.log(`[Mining] Skipped ${block.name} at ${blockPos.x}, ${blockPos.y}, ${blockPos.z}`);
        return Promise.resolve();
      }

      // Equip appropriate tool if needed
      await this.equipBestTool(block);
      
      // Dig the block
      await this.bot.dig(block);
      console.log(`[Mining] Mined ${block.name} at ${blockPos.x}, ${blockPos.y}, ${blockPos.z}`);
      
    } catch (error) {
      console.error(`[Mining] Error mining block at ${blockPos.x}, ${blockPos.y}, ${blockPos.z}:`, error.message);
    }
  }

  /**
   * Equip the best tool for mining a block
   * @param {Object} block - Block to be mined
   */
  async equipBestTool(block) {
    try {
      // Get the best tool for this block type
      const toolType = this.getToolForBlock(block);
      
      if (!toolType) return;

      // Find tool in inventory
      const tool = this.bot.inventory.items().find(item => 
        item.name.includes(toolType)
      );

      if (tool) {
        await this.bot.equip(tool, 'hand');
      }
    } catch (error) {
      // Tool equipping is optional, continue anyway
    }
  }

  /**
   * Get appropriate tool type for a block
   * @param {Object} block - Block to determine tool for
   * @returns {string} Tool type name
   */
  getToolForBlock(block) {
    const stoneBlocks = ['stone', 'granite', 'diorite', 'andesite', 'slate'];
    const ironBlocks = ['iron_ore', 'deepslate_iron_ore', 'gold_ore', 'deepslate_gold_ore'];
    const diamondBlocks = ['diamond_ore', 'deepslate_diamond_ore', 'emerald_ore'];
    const woodBlocks = ['oak_wood', 'spruce_wood', 'birch_wood', 'jungle_wood'];

    if (diamondBlocks.some(b => block.name.includes(b))) return 'diamond_pickaxe';
    if (ironBlocks.some(b => block.name.includes(b))) return 'iron_pickaxe';
    if (stoneBlocks.some(b => block.name.includes(b))) return 'stone_pickaxe';
    if (woodBlocks.some(b => block.name.includes(b))) return 'axe';
    
    return null;
  }

  /**
   * Start mining a rectangular area
   * @param {Object} startPos - Starting position {x, y, z}
   * @param {Object} endPos - Ending position {x, y, z}
   * @returns {Promise} Resolves when mining is complete
   */
  async mineRectangularArea(startPos, endPos) {
    if (this.isMining) {
      console.log('[Mining] Mining is already in progress');
      return;
    }

    try {
      this.isMining = true;
      console.log(`[Mining] Starting rectangular area excavation from (${startPos.x}, ${startPos.y}, ${startPos.z}) to (${endPos.x}, ${endPos.y}, ${endPos.z})`);

      // Calculate all blocks in the rectangular area
      const allBlocks = this.calculateMiningArea(startPos, endPos);
      console.log(`[Mining] Calculated ${allBlocks.length} blocks in mining area`);

      // Filter for mineable blocks only
      const mineableBlocks = this.filterMineableBlocks(allBlocks);
      console.log(`[Mining] Found ${mineableBlocks.length} mineable blocks`);

      // Sort blocks by distance from bot
      this.miningQueue = this.sortBlocksByDistance(mineableBlocks);

      // Mine each block sequentially
      for (let i = 0; i < this.miningQueue.length; i++) {
        if (!this.isMining) {
          console.log('[Mining] Mining operation cancelled');
          break;
        }

        const blockPos = this.miningQueue[i];
        await this.mineBlock(blockPos);

        // Progress update every 10 blocks
        if ((i + 1) % 10 === 0) {
          console.log(`[Mining] Progress: ${i + 1}/${this.miningQueue.length} blocks mined`);
        }

        // Delay between blocks based on blocksPerSecond setting
        await this.delay(1000 / this.blocksPerSecond);
      }

      console.log(`[Mining] Rectangular area excavation completed. Total blocks mined: ${this.miningQueue.length}`);
      this.isMining = false;

    } catch (error) {
      console.error('[Mining] Error during mining operation:', error.message);
      this.isMining = false;
      throw error;
    }
  }

  /**
   * Stop the current mining operation
   */
  stop() {
    if (this.isMining) {
      this.isMining = false;
      this.miningQueue = [];
      console.log('[Mining] Mining operation stopped');
    }
  }

  /**
   * Pause the current mining operation
   */
  pause() {
    if (this.isMining) {
      this.isMining = false;
      console.log('[Mining] Mining operation paused');
    }
  }

  /**
   * Resume the paused mining operation
   */
  async resume() {
    if (this.miningQueue.length > 0 && !this.isMining) {
      this.isMining = true;
      console.log('[Mining] Mining operation resumed');
    }
  }

  /**
   * Set mining speed (blocks per second)
   * @param {number} speed - Blocks per second (0.1 to 10)
   */
  setMiningSpeed(speed) {
    if (speed < 0.1 || speed > 10) {
      console.error('[Mining] Speed must be between 0.1 and 10 blocks per second');
      return;
    }
    this.blocksPerSecond = speed;
    console.log(`[Mining] Mining speed set to ${speed} blocks/second`);
  }

  /**
   * Add blocks to ignore list
   * @param {Array} blockNames - Array of block names to ignore
   */
  addIgnoredBlocks(blockNames) {
    this.ignoredBlocks = [...new Set([...this.ignoredBlocks, ...blockNames])];
    console.log(`[Mining] Ignored blocks updated: ${this.ignoredBlocks.join(', ')}`);
  }

  /**
   * Get mining status
   * @returns {Object} Current mining status
   */
  getStatus() {
    return {
      isMining: this.isMining,
      queuedBlocks: this.miningQueue.length,
      blocksPerSecond: this.blocksPerSecond,
      ignoredBlocks: this.ignoredBlocks
    };
  }

  /**
   * Utility function to create a delay
   * @param {number} ms - Milliseconds to delay
   * @returns {Promise}
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = MiningModule;
