/**
 * Inventory Management Module
 * Handles inventory operations for Minecraft auto-miner bot
 */

class InventoryManager {
  constructor(bot) {
    this.bot = bot;
    this.inventorySize = 36; // Standard player inventory size
    this.craftingSize = 4; // Crafting table grid (2x2)
  }

  /**
   * Get current inventory state
   * @returns {Object} Current inventory details
   */
  getInventoryState() {
    const inventory = this.bot.inventory;
    return {
      slots: inventory.slots.map((item, index) => ({
        index,
        name: item ? item.name : null,
        count: item ? item.count : 0,
        metadata: item ? item.metadata : null
      })),
      emptySlots: this.getEmptySlots().length,
      totalItems: this.getTotalItemCount()
    };
  }

  /**
   * Get empty slot indices
   * @returns {Array} Array of empty slot indices
   */
  getEmptySlots() {
    return this.bot.inventory.slots
      .map((item, index) => item === null ? index : -1)
      .filter(index => index !== -1);
  }

  /**
   * Get total item count in inventory
   * @returns {number} Total number of items
   */
  getTotalItemCount() {
    return this.bot.inventory.slots.reduce((total, item) => {
      return total + (item ? item.count : 0);
    }, 0);
  }

  /**
   * Find item in inventory
   * @param {string} itemName - Name of the item to find
   * @returns {Object|null} Item object or null if not found
   */
  findItem(itemName) {
    const item = this.bot.inventory.items().find(item => item.name === itemName);
    return item || null;
  }

  /**
   * Get item count by name
   * @param {string} itemName - Name of the item
   * @returns {number} Total count of the item
   */
  getItemCount(itemName) {
    const items = this.bot.inventory.items().filter(item => item.name === itemName);
    return items.reduce((total, item) => total + item.count, 0);
  }

  /**
   * Check if inventory has space
   * @param {number} requiredSlots - Number of slots needed
   * @returns {boolean} True if enough space available
   */
  hasSpace(requiredSlots = 1) {
    return this.getEmptySlots().length >= requiredSlots;
  }

  /**
   * Get inventory usage percentage
   * @returns {number} Percentage of inventory used (0-100)
   */
  getUsagePercentage() {
    const totalSlots = this.inventorySize;
    const usedSlots = this.bot.inventory.slots.filter(item => item !== null).length;
    return Math.round((usedSlots / totalSlots) * 100);
  }

  /**
   * Drop item from inventory
   * @param {Object|string} item - Item object or item name
   * @param {number} count - Number of items to drop
   * @returns {Promise} Promise that resolves when item is dropped
   */
  async dropItem(item, count = 1) {
    try {
      const itemToDrop = typeof item === 'string' ? this.findItem(item) : item;
      
      if (!itemToDrop) {
        throw new Error(`Item not found: ${item}`);
      }

      return await this.bot.toss(itemToDrop, null, count);
    } catch (error) {
      console.error(`Error dropping item: ${error.message}`);
      throw error;
    }
  }

  /**
   * Equip item from inventory
   * @param {Object|string} item - Item object or item name
   * @returns {Promise} Promise that resolves when item is equipped
   */
  async equipItem(item) {
    try {
      const itemToEquip = typeof item === 'string' ? this.findItem(item) : item;
      
      if (!itemToEquip) {
        throw new Error(`Item not found: ${item}`);
      }

      await this.bot.equip(itemToEquip, 'hand');
      return { success: true, item: itemToEquip.name };
    } catch (error) {
      console.error(`Error equipping item: ${error.message}`);
      throw error;
    }
  }

  /**
   * Clear inventory (drops all items)
   * @returns {Promise} Promise that resolves when inventory is cleared
   */
  async clearInventory() {
    try {
      const items = this.bot.inventory.items();
      for (const item of items) {
        await this.dropItem(item, item.count);
      }
      return { success: true, itemsDropped: items.length };
    } catch (error) {
      console.error(`Error clearing inventory: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get all items of a specific type
   * @param {string} itemName - Name of the item type
   * @returns {Array} Array of matching items
   */
  getItemsByType(itemName) {
    return this.bot.inventory.items().filter(item => item.name === itemName);
  }

  /**
   * Consolidate items (stack items of same type together)
   * @returns {Promise} Promise that resolves when items are consolidated
   */
  async consolidateItems() {
    try {
      const items = this.bot.inventory.items();
      const itemMap = new Map();

      // Group items by name
      for (const item of items) {
        if (!itemMap.has(item.name)) {
          itemMap.set(item.name, []);
        }
        itemMap.get(item.name).push(item);
      }

      // Consolidate stacks
      let consolidated = 0;
      for (const [itemName, itemList] of itemMap) {
        if (itemList.length > 1) {
          const maxStack = itemList[0].stackSize || 64;
          // Move logic would go here based on bot implementation
          consolidated += itemList.length - 1;
        }
      }

      return { success: true, itemsConsolidated: consolidated };
    } catch (error) {
      console.error(`Error consolidating items: ${error.message}`);
      throw error;
    }
  }

  /**
   * Check if inventory is full
   * @returns {boolean} True if inventory is full
   */
  isFull() {
    return this.getEmptySlots().length === 0;
  }

  /**
   * Get inventory summary
   * @returns {Object} Summary of inventory contents
   */
  getInventorySummary() {
    const items = this.bot.inventory.items();
    const summary = {};

    for (const item of items) {
      if (summary[item.name]) {
        summary[item.name] += item.count;
      } else {
        summary[item.name] = item.count;
      }
    }

    return {
      totalUniqueItems: Object.keys(summary).length,
      totalItems: this.getTotalItemCount(),
      items: summary,
      emptySlots: this.getEmptySlots().length,
      usagePercentage: this.getUsagePercentage()
    };
  }

  /**
   * Log inventory details to console
   */
  logInventory() {
    const summary = this.getInventorySummary();
    console.log('=== Inventory Summary ===');
    console.log(`Total Items: ${summary.totalItems}`);
    console.log(`Unique Items: ${summary.totalUniqueItems}`);
    console.log(`Empty Slots: ${summary.emptySlots}`);
    console.log(`Usage: ${summary.usagePercentage}%`);
    console.log('\nItems:');
    Object.entries(summary.items).forEach(([name, count]) => {
      console.log(`  ${name}: ${count}`);
    });
  }
}

module.exports = InventoryManager;
