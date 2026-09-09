import dotenv from 'dotenv';
import { AIBrain } from './core/AIBrain.js';
import { Logger } from './utils/Logger.js';
import { DatabaseManager } from './core/DatabaseManager.js';

dotenv.config();

class TinyTalesSystem {
  constructor() {
    this.logger = new Logger('TinyTales-Main');
    this.brain = null;
    this.db = null;
  }

  async initialize() {
    try {
      this.logger.info('🧠 Initializing TinyTales AI Brain System...');

      // Initialize database
      this.db = new DatabaseManager();
      await this.db.connect();

      // Initialize AI Brain with all agents
      this.brain = new AIBrain({
        contentAgent: true,
        socialAgent: true,
        videoAgent: true,
        analyticsAgent: true,
        safetyAgent: true,
        schedulerAgent: true
      });

      await this.brain.initialize();

      this.logger.info('✅ TinyTales AI Brain is now ONLINE and operational!');
      this.logger.info('🎬 Content creation pipeline: ACTIVE');
      this.logger.info('💬 Social media monitoring: ACTIVE');
      this.logger.info('📊 Analytics tracking: ACTIVE');
      this.logger.info('🛡️ Safety monitoring: ACTIVE');

      // Start the brain's autonomous operations
      await this.brain.startAutonomousMode();

    } catch (error) {
      this.logger.error('❌ Failed to initialize TinyTales system:', error);
      process.exit(1);
    }
  }

  async shutdown() {
    this.logger.info('🛑 Shutting down TinyTales AI Brain...');

    if (this.brain) {
      await this.brain.shutdown();
    }

    if (this.db) {
      await this.db.disconnect();
    }

    this.logger.info('👋 TinyTales AI Brain shutdown complete');
    process.exit(0);
  }
}

// Global error handling
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('📡 Received SIGTERM, shutting down gracefully...');
  if (global.tinyTalesSystem) {
    await global.tinyTalesSystem.shutdown();
  }
});

process.on('SIGINT', async () => {
  console.log('📡 Received SIGINT, shutting down gracefully...');
  if (global.tinyTalesSystem) {
    await global.tinyTalesSystem.shutdown();
  }
});

// Start the system
async function main() {
  const system = new TinyTalesSystem();
  global.tinyTalesSystem = system;

  console.log(`
  ████████╗██╗███╗   ██╗██╗   ██╗████████╗ █████╗ ██╗     ███████╗███████╗
  ╚══██╔══╝██║████╗  ██║╚██╗ ██╔╝╚══██╔══╝██╔══██╗██║     ██╔════╝██╔════╝
     ██║   ██║██╔██╗ ██║ ╚████╔╝    ██║   ███████║██║     █████╗  ███████╗
     ██║   ██║██║╚██╗██║  ╚██╔╝     ██║   ██╔══██║██║     ██╔══╝  ╚════██║
     ██║   ██║██║ ╚████║   ██║      ██║   ██║  ██║███████╗███████╗███████║
     ╚═╝   ╚═╝╚═╝  ╚═══╝   ╚═╝      ╚═╝   ╚═╝  ╚═╝╚══════╝╚══════╝╚══════╝

  🧠 AI Brain System v1.0.0
  🎬 Autonomous YouTube Kids Channel Management
  ⚡ Starting at ${new Date().toISOString()}
  `);

  await system.initialize();
}

main().catch(console.error);