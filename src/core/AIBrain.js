import { ContentCreationAgent } from '../agents/ContentCreationAgent.js';
import { SocialMediaAgent } from '../agents/SocialMediaAgent.js';
import { VideoProductionAgent } from '../agents/VideoProductionAgent.js';
import { AnalyticsAgent, SafetyAgent, SchedulerAgent } from '../agents/SupportAgents.js';
import { Logger } from '../utils/Logger.js';
import cron from 'node-cron';

export class AIBrain {
  constructor(config = {}) {
    this.logger = new Logger('AIBrain');
    this.agents = {};
    this.isRunning = false;
    this.config = config;
    this.activeJobs = new Map();
    this.metrics = {
      videosCreated: 0,
      commentsReplied: 0,
      dmsHandled: 0,
      uptime: 0,
      startTime: null
    };
  }

  async initialize() {
    this.logger.info('🧠 Initializing AI Brain with specialized agents...');

    try {
      // Initialize all agent modules
      if (this.config.contentAgent) {
        this.agents.content = new ContentCreationAgent();
        await this.agents.content.initialize();
        this.logger.info('✅ Content Creation Agent: ONLINE');
      }

      if (this.config.socialAgent) {
        this.agents.social = new SocialMediaAgent();
        await this.agents.social.initialize();
        this.logger.info('✅ Social Media Agent: ONLINE');
      }

      if (this.config.videoAgent) {
        this.agents.video = new VideoProductionAgent();
        await this.agents.video.initialize();
        this.logger.info('✅ Video Production Agent: ONLINE');
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
      this.logger.info('🎯 All AI agents initialized successfully!');

    } catch (error) {
      this.logger.error('❌ Failed to initialize AI Brain:', error);
      throw error;
    }
  }

  async startAutonomousMode() {
    if (this.isRunning) {
      this.logger.warn('⚠️ AI Brain is already running in autonomous mode');
      return;
    }

    this.isRunning = true;
    this.logger.info('🚀 Starting autonomous 24/7 operations...');

    // Schedule daily content creation (9 AM every day)
    this.scheduleJob('daily-content', '0 9 * * *', async () => {
      await this.orchestrateContentCreation();
    });

    // Monitor social media every 5 minutes
    this.scheduleJob('social-monitoring', '*/5 * * * *', async () => {
      await this.orchestrateSocialMediaManagement();
    });

    // Analytics check every hour
    this.scheduleJob('analytics-check', '0 * * * *', async () => {
      await this.orchestrateAnalytics();
    });

    // Safety monitoring every 2 minutes
    this.scheduleJob('safety-check', '*/2 * * * *', async () => {
      await this.orchestrateSafety();
    });

    // Health check every 30 minutes
    this.scheduleJob('health-check', '*/30 * * * *', async () => {
      await this.performHealthCheck();
    });

    this.logger.info('⏰ All autonomous schedules activated');
    this.logger.info('🤖 TinyTales AI Brain is now fully autonomous!');
  }

  scheduleJob(name, schedule, task) {
    const job = cron.schedule(schedule, async () => {
      try {
        this.logger.info(`🔄 Executing scheduled task: ${name}`);
        await task();
        this.logger.info(`✅ Completed scheduled task: ${name}`);
      } catch (error) {
        this.logger.error(`❌ Failed scheduled task: ${name}`, error);
      }
    }, {
      scheduled: true,
      timezone: process.env.TIMEZONE || 'America/New_York'
    });

    this.activeJobs.set(name, job);
    this.logger.info(`📅 Scheduled job '${name}' with cron: ${schedule}`);
  }

  async orchestrateContentCreation() {
    this.logger.info('🎬 Orchestrating daily content creation workflow...');

    try {
      // Step 1: Generate script with Content Agent
      const script = await this.agents.content.generateDailyScript();

      // Step 2: Safety check the script
      const safetyCheck = await this.agents.safety.validateContent(script);

      if (!safetyCheck.approved) {
        this.logger.warn('🛡️ Script failed safety check, regenerating...');
        return await this.orchestrateContentCreation(); // Retry
      }

      // Step 3: Create video with Video Agent
      const videoData = await this.agents.video.createAnimatedVideo(script);

      // Step 4: Schedule publication
      await this.agents.scheduler.scheduleVideoPublication(videoData);

      this.metrics.videosCreated++;
      this.logger.info('🎉 Daily content creation workflow completed successfully!');

    } catch (error) {
      this.logger.error('❌ Content creation workflow failed:', error);
    }
  }

  async orchestrateSocialMediaManagement() {
    this.logger.info('💬 Orchestrating social media management...');

    try {
      // Handle new comments
      const comments = await this.agents.social.getNewComments();
      for (const comment of comments) {
        const safetyCheck = await this.agents.safety.validateIncomingContent(comment);

        if (safetyCheck.requiresResponse) {
          const response = await this.agents.social.generateResponse(comment);
          const responseCheck = await this.agents.safety.validateContent(response);

          if (responseCheck.approved) {
            await this.agents.social.replyToComment(comment.id, response);
            this.metrics.commentsReplied++;
          }
        }
      }

      // Handle DMs
      const dms = await this.agents.social.getNewDirectMessages();
      for (const dm of dms) {
        const safetyCheck = await this.agents.safety.validateIncomingContent(dm);

        if (safetyCheck.requiresResponse) {
          const response = await this.agents.social.generateDMResponse(dm);
          const responseCheck = await this.agents.safety.validateContent(response);

          if (responseCheck.approved) {
            await this.agents.social.sendDirectMessage(dm.senderId, response);
            this.metrics.dmsHandled++;
          }
        }
      }

    } catch (error) {
      this.logger.error('❌ Social media management failed:', error);
    }
  }

  async orchestrateAnalytics() {
    this.logger.info('📊 Orchestrating analytics and optimization...');

    try {
      const analytics = await this.agents.analytics.gatherMetrics();
      const insights = await this.agents.analytics.generateInsights(analytics);

      // Share insights with content agent for optimization
      if (this.agents.content) {
        await this.agents.content.updateStrategyFromInsights(insights);
      }

      // Log performance
      this.logger.info(`📈 Analytics Update: Views: ${analytics.views}, Engagement: ${analytics.engagement}%`);

    } catch (error) {
      this.logger.error('❌ Analytics orchestration failed:', error);
    }
  }

  async orchestrateSafety() {
    this.logger.info('🛡️ Orchestrating safety monitoring...');

    try {
      await this.agents.safety.scanRecentContent();
      await this.agents.safety.monitorChannelHealth();

    } catch (error) {
      this.logger.error('❌ Safety monitoring failed:', error);
    }
  }

  async performHealthCheck() {
    this.logger.info('🏥 Performing system health check...');

    const health = {
      timestamp: new Date().toISOString(),
      uptime: Date.now() - this.metrics.startTime.getTime(),
      agents: {},
      metrics: this.metrics
    };

    // Check each agent's health
    for (const [name, agent] of Object.entries(this.agents)) {
      health.agents[name] = await agent.getHealthStatus();
    }

    this.logger.info('💚 Health check completed:', health);
    return health;
  }

  async getSystemStatus() {
    return {
      isRunning: this.isRunning,
      uptime: this.metrics.startTime ? Date.now() - this.metrics.startTime.getTime() : 0,
      metrics: this.metrics,
      activeJobs: Array.from(this.activeJobs.keys()),
      agents: Object.keys(this.agents)
    };
  }

  async shutdown() {
    this.logger.info('🛑 Shutting down AI Brain...');
    this.isRunning = false;

    // Stop all scheduled jobs
    for (const [name, job] of this.activeJobs) {
      job.destroy();
      this.logger.info(`⏹️ Stopped job: ${name}`);
    }

    // Shutdown all agents
    for (const [name, agent] of Object.entries(this.agents)) {
      await agent.shutdown();
      this.logger.info(`⏹️ Shutdown agent: ${name}`);
    }

    this.logger.info('✅ AI Brain shutdown complete');
  }
}