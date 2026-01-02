/**
 * Minecraft Auto Miner Bot
 * Main entry point for the bot application
 * 
 * This file handles initialization and core bot functionality
 */

const { createClient } = require('minecraft-protocol');
const { performance } = require('perf_hooks');
const chalk = require('chalk');
const config = require('./config');
const MiningBot = require('./src/bot/MiningBot');
const CommandHandler = require('./src/handlers/CommandHandler');
const EventManager = require('./src/managers/EventManager');
const Logger = require('./src/utils/Logger');

// Initialize logger
const logger = new Logger('Main');

// Global error handlers
process.on('unhandledRejection', (reason, promise) => {
  logger.error(`Unhandled Rejection at: ${promise}, reason: ${reason}`);
});

process.on('uncaughtException', (error) => {
  logger.error(`Uncaught Exception: ${error.message}`);
  logger.error(error.stack);
  process.exit(1);
});

/**
 * Initialize the bot with configuration
 */
async function initializeBot() {
  try {
    logger.info('Starting Minecraft Auto Miner Bot...');
    logger.info(`Version: ${require('./package.json').version}`);
    
    // Validate configuration
    if (!config.bot.username || !config.server.host) {
      throw new Error('Missing required configuration. Please check config.js');
    }

    logger.info(`Connecting to server: ${config.server.host}:${config.server.port}`);
    logger.info(`Bot username: ${config.bot.username}`);

    // Initialize event manager
    const eventManager = new EventManager();

    // Create bot instance
    const bot = createClient({
      host: config.server.host,
      port: config.server.port,
      username: config.bot.username,
      password: config.bot.password || undefined,
      version: config.server.version || '1.20.1',
      auth: config.server.auth || 'offline'
    });

    // Initialize mining bot wrapper
    const miningBot = new MiningBot(bot, config, eventManager);

    // Initialize command handler
    const commandHandler = new CommandHandler(miningBot, eventManager);

    // Setup event listeners
    setupBotEvents(bot, miningBot, commandHandler, eventManager);

    logger.success('Bot initialized successfully');
    return { bot, miningBot, commandHandler, eventManager };

  } catch (error) {
    logger.error(`Failed to initialize bot: ${error.message}`);
    throw error;
  }
}

/**
 * Setup all bot event listeners
 */
function setupBotEvents(bot, miningBot, commandHandler, eventManager) {
  // Connection events
  bot.on('login', () => {
    logger.success('Bot logged in successfully');
    logger.info(`Dimension: ${bot.dimension}`);
    eventManager.emit('bot:login', { bot });
  });

  bot.on('spawn', () => {
    logger.success('Bot spawned in world');
    logger.info(`Position: ${bot.entity.position.x.toFixed(2)}, ${bot.entity.position.y.toFixed(2)}, ${bot.entity.position.z.toFixed(2)}`);
    eventManager.emit('bot:spawn', { bot });

    // Start mining if configured
    if (config.bot.autoStart) {
      miningBot.startMining();
    }
  });

  bot.on('end', () => {
    logger.warn('Bot disconnected from server');
    eventManager.emit('bot:disconnect', { bot });
    
    // Attempt to reconnect if configured
    if (config.bot.autoReconnect) {
      logger.info(`Attempting to reconnect in ${config.bot.reconnectDelay}ms...`);
      setTimeout(() => {
        initializeBot().catch(error => {
          logger.error(`Reconnection failed: ${error.message}`);
        });
      }, config.bot.reconnectDelay);
    }
  });

  bot.on('error', (error) => {
    logger.error(`Bot error: ${error.message}`);
    eventManager.emit('bot:error', { error });
  });

  // Chat events
  bot.on('chat', (username, message) => {
    if (username === bot.username) return;
    
    logger.info(`[${username}] ${message}`);
    eventManager.emit('chat:message', { username, message });

    // Handle commands
    if (message.startsWith(config.bot.commandPrefix)) {
      const args = message.slice(config.bot.commandPrefix.length).split(' ');
      const command = args.shift().toLowerCase();
      commandHandler.handle(username, command, args);
    }
  });

  // Mining events
  bot.on('diggingCompleted', (block) => {
    logger.debug(`Block mined at ${block.position}`);
    eventManager.emit('mining:blockBroken', { block });
  });

  // Player events
  bot.on('playerJoined', (player) => {
    logger.info(`Player joined: ${player.username}`);
    eventManager.emit('player:joined', { player });
  });

  bot.on('playerLeft', (player) => {
    logger.info(`Player left: ${player.username}`);
    eventManager.emit('player:left', { player });
  });

  // Health and status events
  bot.on('health', () => {
    if (config.bot.debug) {
      logger.debug(`Health: ${bot.health}, Food: ${bot.food}`);
    }
    eventManager.emit('bot:healthUpdate', { health: bot.health, food: bot.food });
  });

  // Window events for inventory management
  bot.on('windowOpen', (window) => {
    logger.info(`Window opened: ${window.title}`);
    eventManager.emit('inventory:windowOpen', { window });
  });

  bot.on('windowClose', (window) => {
    logger.info(`Window closed: ${window.title}`);
    eventManager.emit('inventory:windowClose', { window });
  });

  // Goal reached event
  eventManager.on('mining:goalReached', (data) => {
    logger.success(`Mining goal reached: ${data.message}`);
    if (config.bot.stopOnGoal) {
      miningBot.stopMining();
    }
  });
}

/**
 * Start the bot application
 */
async function start() {
  const startTime = performance.now();

  try {
    const { bot, miningBot, commandHandler, eventManager } = await initializeBot();

    logger.success(`Bot startup completed in ${(performance.now() - startTime).toFixed(2)}ms`);
    logger.info('Bot is ready and running');

    // Export for REPL access if needed
    global.bot = bot;
    global.miningBot = miningBot;
    global.commandHandler = commandHandler;
    global.eventManager = eventManager;
    global.logger = logger;

    return { bot, miningBot, commandHandler, eventManager };

  } catch (error) {
    logger.error(`Bot startup failed: ${error.message}`);
    logger.error(error.stack);
    process.exit(1);
  }
}

/**
 * Graceful shutdown handler
 */
async function shutdown() {
  logger.warn('Shutting down bot...');
  
  try {
    if (global.miningBot) {
      global.miningBot.stopMining();
    }
    
    if (global.bot && global.bot.end) {
      global.bot.end();
    }
    
    logger.success('Bot shutdown complete');
    process.exit(0);
  } catch (error) {
    logger.error(`Error during shutdown: ${error.message}`);
    process.exit(1);
  }
}

// Handle shutdown signals
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Start the bot if this is the main module
if (require.main === module) {
  start().catch(error => {
    logger.error(`Fatal error: ${error.message}`);
    process.exit(1);
  });
}

// Export for testing
module.exports = {
  initializeBot,
  setupBotEvents,
  start,
  shutdown
};
