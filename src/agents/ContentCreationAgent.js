import { Anthropic } from '@anthropic-ai/sdk';
import { OpenAI } from 'openai';
import { Logger } from '../utils/Logger.js';
import { ContentDatabase } from '../database/ContentDatabase.js';

export class ContentCreationAgent {
  constructor() {
    this.logger = new Logger('ContentAgent');
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.contentDb = new ContentDatabase();
    this.isInitialized = false;

    // Content themes and categories for kids
    this.themes = [
      'friendship', 'kindness', 'adventure', 'learning', 'animals',
      'colors', 'numbers', 'shapes', 'seasons', 'family', 'helping others',
      'courage', 'honesty', 'sharing', 'imagination', 'nature', 'music'
    ];

    this.storyTypes = [
      'fairy tale', 'animal adventure', 'learning journey', 'friendship story',
      'magical adventure', 'everyday hero', 'problem solving', 'discovery tale'
    ];
  }

  async initialize() {
    this.logger.info('🎭 Initializing Content Creation Agent...');

    try {
      await this.contentDb.connect();
      this.isInitialized = true;
      this.logger.info('✅ Content Creation Agent ready');
    } catch (error) {
      this.logger.error('❌ Failed to initialize Content Creation Agent:', error);
      throw error;
    }
  }

  async generateDailyScript() {
    if (!this.isInitialized) {
      throw new Error('Content Creation Agent not initialized');
    }

    this.logger.info('📝 Generating daily animated story script...');

    try {
      // Check what content we've created recently to avoid repetition
      const recentContent = await this.contentDb.getRecentScripts(7);
      const usedThemes = recentContent.map(content => content.theme);

      // Select a fresh theme
      const availableThemes = this.themes.filter(theme => !usedThemes.includes(theme));
      const selectedTheme = availableThemes.length > 0
        ? availableThemes[Math.floor(Math.random() * availableThemes.length)]
        : this.themes[Math.floor(Math.random() * this.themes.length)];

      const selectedStoryType = this.storyTypes[Math.floor(Math.random() * this.storyTypes.length)];

      // Generate script using Claude
      const scriptPrompt = this.buildScriptPrompt(selectedTheme, selectedStoryType);
      const scriptResponse = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2000,
        messages: [{
          role: 'user',
          content: scriptPrompt
        }]
      });

      const scriptContent = scriptResponse.content[0].text;

      // Generate title and description
      const metadataPrompt = this.buildMetadataPrompt(scriptContent, selectedTheme);
      const metadataResponse = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 500,
        messages: [{
          role: 'user',
          content: metadataPrompt
        }]
      });

      const metadata = JSON.parse(metadataResponse.content[0].text);

      const script = {
        id: `script_${Date.now()}`,
        title: metadata.title,
        description: metadata.description,
        theme: selectedTheme,
        storyType: selectedStoryType,
        content: scriptContent,
        duration: metadata.estimatedDuration,
        targetAge: metadata.targetAge,
        keywords: metadata.keywords,
        createdAt: new Date(),
        status: 'generated'
      };

      // Save to database
      await this.contentDb.saveScript(script);

      this.logger.info(`✅ Generated script: "${script.title}" (${script.theme})`);
      return script;

    } catch (error) {
      this.logger.error('❌ Failed to generate script:', error);
      throw error;
    }
  }

  buildScriptPrompt(theme, storyType) {
    return `Create an engaging animated story script for kids aged 3-8 about ${theme}.

Story Type: ${storyType}

Requirements:
- Duration: 3-5 minutes when narrated
- Educational value while being entertaining
- Positive messages and wholesome content
- Clear, simple language appropriate for young children
- Vivid descriptions for animation scenes
- Interactive moments (questions for audience)
- Satisfying conclusion with moral lesson

Format the script with:
- Scene descriptions for animators
- Character dialogue and narration
- Animation notes (movements, expressions, effects)
- Timing cues for pacing

Make it magical, heartwarming, and memorable. Include moments that will make children smile and learn something valuable.

Begin the script now:`;
  }

  buildMetadataPrompt(scriptContent, theme) {
    return `Analyze this children's story script and generate metadata in JSON format:

Script: ${scriptContent}

Generate JSON with these fields:
{
  "title": "Catchy, kid-friendly title (under 60 characters)",
  "description": "YouTube description with keywords (150-200 characters)",
  "estimatedDuration": "duration in minutes",
  "targetAge": "age range like '3-8 years'",
  "keywords": ["relevant", "youtube", "tags", "for", "kids"]
}

Make the title engaging and clickable for parents, and ensure the description is SEO-optimized for YouTube discovery.`;
  }

  async updateStrategyFromInsights(insights) {
    this.logger.info('📊 Updating content strategy based on analytics...');

    try {
      // Analyze what themes/types are performing well
      const topPerforming = insights.topPerformingContent || [];
      const underPerforming = insights.underPerformingContent || [];

      // Adjust theme weights based on performance
      if (topPerforming.length > 0) {
        const successfulThemes = topPerforming.map(content => content.theme);
        this.logger.info(`🎯 Successful themes: ${successfulThemes.join(', ')}`);

        // Store successful patterns for future use
        await this.contentDb.updateThemePerformance(successfulThemes, 'increase');
      }

      if (underPerforming.length > 0) {
        const strugglingThemes = underPerforming.map(content => content.theme);
        this.logger.info(`📉 Themes needing improvement: ${strugglingThemes.join(', ')}`);

        await this.contentDb.updateThemePerformance(strugglingThemes, 'decrease');
      }

    } catch (error) {
      this.logger.error('❌ Failed to update strategy:', error);
    }
  }

  async generateContentIdeas(count = 7) {
    this.logger.info(`💡 Generating ${count} content ideas for the week...`);

    try {
      const ideas = [];

      for (let i = 0; i < count; i++) {
        const theme = this.themes[Math.floor(Math.random() * this.themes.length)];
        const storyType = this.storyTypes[Math.floor(Math.random() * this.storyTypes.length)];

        const ideaPrompt = `Generate a brief, exciting content idea for a kids' animated video.

Theme: ${theme}
Story Type: ${storyType}

Provide:
- A catchy title
- One sentence plot summary
- Key character(s)
- Main lesson/value

Keep it fresh, engaging, and perfect for 3-8 year olds.`;

        const response = await this.anthropic.messages.create({
          model: 'claude-3-haiku-20240307',
          max_tokens: 200,
          messages: [{
            role: 'user',
            content: ideaPrompt
          }]
        });

        ideas.push({
          theme,
          storyType,
          idea: response.content[0].text,
          createdAt: new Date()
        });
      }

      await this.contentDb.saveContentIdeas(ideas);
      this.logger.info(`💡 Generated ${count} fresh content ideas`);

      return ideas;

    } catch (error) {
      this.logger.error('❌ Failed to generate content ideas:', error);
      throw error;
    }
  }

  async getHealthStatus() {
    return {
      status: this.isInitialized ? 'healthy' : 'not_initialized',
      lastScriptGenerated: await this.contentDb.getLastScriptTime(),
      totalScripts: await this.contentDb.getScriptCount(),
      avgPerformance: await this.contentDb.getAveragePerformance()
    };
  }

  async shutdown() {
    this.logger.info('⏹️ Shutting down Content Creation Agent...');

    if (this.contentDb) {
      await this.contentDb.disconnect();
    }

    this.isInitialized = false;
    this.logger.info('✅ Content Creation Agent shutdown complete');
  }
}