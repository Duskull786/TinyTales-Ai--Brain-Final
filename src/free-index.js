import dotenv from 'dotenv';
import { AIBrain } from './core/AIBrain.js';
import { Logger } from './utils/Logger.js';
import { DatabaseManager } from './core/DatabaseManager.js';

// Import FREE agents instead of paid ones
import { FreeContentCreationAgent } from './agents/FreeContentCreationAgent.js';
import { SocialMediaAgent } from './agents/SocialMediaAgent.js';
import { FreeVideoProductionAgent } from './agents/FreeVideoProductionAgent.js';
import { AnalyticsAgent, SafetyAgent, SchedulerAgent } from './agents/SupportAgents.js';

dotenv.config();

class FreeTinyTalesSystem {
  constructor() {
    this.logger = new Logger('FreeTinyTales-Main');
    this.brain = null;
    this.db = null;
  }

  async initialize() {
    try {
      this.logger.info('🆓 Initializing FREE TinyTales AI Brain System...');

      // Check free tools availability
      await this.checkFreeToolsSetup();

      // Initialize database
      this.db = new DatabaseManager();
      await this.db.connect();

      // Initialize AI Brain with FREE agents
      this.brain = new FreeBrain({
        contentAgent: true,
        socialAgent: true,
        videoAgent: true,
        analyticsAgent: true,
        safetyAgent: true,
        schedulerAgent: true
      });

      await this.brain.initialize();

      this.logger.info('✅ FREE TinyTales AI Brain is now ONLINE and operational!');
      this.logger.info('🎬 FREE content creation pipeline: ACTIVE');
      this.logger.info('💬 Social media monitoring: ACTIVE (YouTube free tier)');
      this.logger.info('📊 Analytics tracking: ACTIVE');
      this.logger.info('🛡️ Safety monitoring: ACTIVE');
      this.logger.info('💰 Monthly cost: $0.00 (100% FREE!)');

      // Start autonomous operations
      await this.brain.startAutonomousMode();

    } catch (error) {
      this.logger.error('❌ Failed to initialize FREE TinyTales system:', error);
      this.logger.info('💡 Check the setup guide: cat FREE-SETUP.md');
      process.exit(1);
    }
  }

  async checkFreeToolsSetup() {
    this.logger.info('🔍 Checking FREE tools setup...');

    const tools = [
      { name: 'Ollama', check: 'curl -s http://localhost:11434/api/tags', url: 'https://ollama.ai/install' },
      { name: 'MongoDB', check: 'mongosh --version', install: 'sudo apt install mongodb' },
      { name: 'FFmpeg', check: 'ffmpeg -version', install: 'sudo apt install ffmpeg' },
      { name: 'Edge-TTS', check: 'edge-tts --version', install: 'pip install edge-tts' }
    ];

    for (const tool of tools) {
      try {
        const { exec } = await import('child_process');
        await new Promise((resolve, reject) => {
          exec(tool.check, (error) => {
            if (error) reject(error);
            else resolve();
          });
        });
        this.logger.info(`✅ ${tool.name} available`);
      } catch {
        this.logger.warn(`⚠️ ${tool.name} not found. Install: ${tool.install || tool.url}`);
      }
    }
  }

  async shutdown() {
    this.logger.info('🛑 Shutting down FREE TinyTales AI Brain...');

    if (this.brain) {
      await this.brain.shutdown();
    }

    if (this.db) {
      await this.db.disconnect();
    }

    this.logger.info('👋 FREE TinyTales AI Brain shutdown complete');
    process.exit(0);
  }
}

// Custom FREE AI Brain class
class FreeBrain extends AIBrain {
  async initialize() {
    this.logger.info('🧠 Initializing FREE AI Brain with free agents...');

    try {
      // Initialize FREE agents
      if (this.config.contentAgent) {
        this.agents.content = new FreeContentCreationAgent();
        await this.agents.content.initialize();
        this.logger.info('✅ FREE Content Creation Agent: ONLINE (Ollama)');
      }

      if (this.config.socialAgent) {
        this.agents.social = new SocialMediaAgent();
        await this.agents.social.initialize();
        this.logger.info('✅ Social Media Agent: ONLINE (YouTube free API)');
      }

      if (this.config.videoAgent) {
        this.agents.video = new FreeVideoProductionAgent();
        await this.agents.video.initialize();
        this.logger.info('✅ FREE Video Production Agent: ONLINE (Edge TTS + FFmpeg)');
      }

      if (this.config.analyticsAgent) {
        this.agents.analytics = new AnalyticsAgent();
        await this.agents.analytics.initialize();
        this.logger.info('✅ Analytics Agent: ONLINE');
      }

      if (this.config.safetyAgent) {
        this.agents.safety = new SafetyAgent();
        await this.agents.safety.initialize();
        this.logger.info('✅ Safety Agent: ONLINE');
      }

      if (this.config.schedulerAgent) {
        this.agents.scheduler = new SchedulerAgent();
        await this.agents.scheduler.initialize();
        this.logger.info('✅ Scheduler Agent: ONLINE');
      }

      this.metrics.startTime = new Date();
      this.logger.info('🎯 All FREE AI agents initialized successfully!');
      this.logger.info('💰 Running cost: $0.00/month (100% FREE operation!)');

    } catch (error) {
      this.logger.error('❌ Failed to initialize FREE AI Brain:', error);
      throw error;
    }
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
  if (global.freeTinyTalesSystem) {
    await global.freeTinyTalesSystem.shutdown();
  }
});

process.on('SIGINT', async () => {
  console.log('📡 Received SIGINT, shutting down gracefully...');
  if (global.freeTinyTalesSystem) {
    await global.freeTinyTalesSystem.shutdown();
  }
});

// Start the FREE system
async function main() {
  const system = new FreeTinyTalesSystem();
  global.freeTinyTalesSystem = system;

  console.log(`
  🆓 FREE TINYTALES AI BRAIN 🆓

  ████████╗██╗███╗   ██╗██╗   ██╗████████╗ █████╗ ██╗     ███████╗███████╗
  ╚══██╔══╝██║████╗  ██║╚██╗ ██╔╝╚══██╔══╝██╔══██╗██║     ██╔════╝██╔════╝
     ██║   ██║██╔██╗ ██║ ╚████╔╝    ██║   ███████║██║     █████╗  ███████╗
     ██║   ██║██║╚██╗██║  ╚██╔╝     ██║   ██╔══██║██║     ██╔══╝  ╚════██║
     ██║   ██║██║ ╚████║   ██║      ██║   ██║  ██║███████╗███████╗███████║
     ╚═╝   ╚═╝╚═╝  ╚═══╝   ╚═╝      ╚═╝   ╚═╝  ╚═╝╚══════╝╚══════╝╚══════╝

  🎯 100% FREE AI Brain System v1.0.0
  🎬 Autonomous YouTube Kids Channel Management
  💰 Monthly Cost: $0.00 (COMPLETELY FREE!)
  ⚡ Starting at ${new Date().toISOString()}

  Powered by: Ollama + Edge TTS + Stable Diffusion + FFmpeg + MongoDB
  `);

  await system.initialize();
}

main().catch(console.error);