import axios from 'axios';
import { Logger } from '../utils/Logger.js';
import { ContentDatabase } from '../database/ContentDatabase.js';

export class FreeContentCreationAgent {
  constructor() {
    this.logger = new Logger('FreeContentAgent');
    this.contentDb = new ContentDatabase();
    this.isInitialized = false;
    this.ollamaUrl = 'http://localhost:11434';

    // Content themes for kids
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
    this.logger.info('🎭 Initializing FREE Content Creation Agent...');

    try {
      // Check if Ollama is running
      await this.checkOllamaConnection();
      await this.contentDb.connect();

      this.isInitialized = true;
      this.logger.info('✅ FREE Content Creation Agent ready (using Ollama)');
    } catch (error) {
      this.logger.error('❌ Failed to initialize FREE Content Creation Agent:', error);
      throw error;
    }
  }

  async checkOllamaConnection() {
    try {
      const response = await axios.get(`${this.ollamaUrl}/api/tags`);
      this.logger.info('✅ Ollama connected successfully');
      return true;
    } catch (error) {
      this.logger.error('❌ Ollama not running. Please install and start Ollama first.');
      this.logger.info('📖 Install Ollama: curl -fsSL https://ollama.ai/install.sh | sh');
      this.logger.info('📖 Then run: ollama pull llama3.1');
      throw new Error('Ollama not available');
    }
  }

  async generateDailyScript() {
    if (!this.isInitialized) {
      throw new Error('FREE Content Creation Agent not initialized');
    }

    this.logger.info('📝 Generating daily story script with FREE Ollama AI...');

    try {
      // Check recent content to avoid repetition
      const recentContent = await this.contentDb.getRecentScripts(7);
      const usedThemes = recentContent.map(content => content.theme);

      // Select fresh theme
      const availableThemes = this.themes.filter(theme => !usedThemes.includes(theme));
      const selectedTheme = availableThemes.length > 0
        ? availableThemes[Math.floor(Math.random() * availableThemes.length)]
        : this.themes[Math.floor(Math.random() * this.themes.length)];

      const selectedStoryType = this.storyTypes[Math.floor(Math.random() * this.storyTypes.length)];

      // Generate script using FREE Ollama
      const scriptPrompt = this.buildScriptPrompt(selectedTheme, selectedStoryType);

      const scriptResponse = await axios.post(`${this.ollamaUrl}/api/generate`, {
        model: 'llama3.1',
        prompt: scriptPrompt,
        stream: false
      });

      const scriptContent = scriptResponse.data.response;

      // Generate metadata
      const metadataPrompt = this.buildMetadataPrompt(scriptContent, selectedTheme);

      const metadataResponse = await axios.post(`${this.ollamaUrl}/api/generate`, {
        model: 'llama3.1',
        prompt: metadataPrompt,
        stream: false
      });

      const metadataText = metadataResponse.data.response;
      const metadata = this.parseMetadata(metadataText, selectedTheme);

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
        status: 'generated',
        source: 'ollama_free'
      };

      // Save to database
      await this.contentDb.saveScript(script);

      this.logger.info(`✅ FREE script generated: "${script.title}" (${script.theme})`);
      return script;

    } catch (error) {
      this.logger.error('❌ Failed to generate FREE script:', error);
      throw error;
    }
  }

  buildScriptPrompt(theme, storyType) {
    return `You are a children's story writer. Create an engaging animated story script for kids aged 3-8 about ${theme}.

Story Type: ${storyType}

Requirements:
- Duration: 3-5 minutes when narrated
- Educational and entertaining
- Positive messages and wholesome content
- Simple language for young children
- Clear scene descriptions for animation
- Interactive moments (questions for audience)
- Happy ending with moral lesson

Format:
TITLE: [Story Title]

SCENE 1: [Description]
NARRATION: [What to say]

SCENE 2: [Description]
NARRATION: [What to say]

Continue for 4-6 scenes total.

Make it magical, heartwarming, and memorable for children.

Begin the script:`;
  }

  buildMetadataPrompt(scriptContent, theme) {
    return `Analyze this children's story script and create metadata:

Script: ${scriptContent.substring(0, 1000)}

Create:
1. Title (under 60 characters, catchy for kids)
2. Description (150 words for YouTube, include keywords)
3. Duration (estimated minutes)
4. Age range
5. Keywords (5-8 YouTube tags)

Format as:
TITLE: [title here]
DESCRIPTION: [description here]
DURATION: [X minutes]
AGE: [X-Y years]
KEYWORDS: word1, word2, word3, word4, word5

Make it engaging for parents and SEO-optimized.`;
  }

  parseMetadata(metadataText, theme) {
    // Parse the structured metadata response
    const lines = metadataText.split('\n');
    const metadata = {
      title: `TinyTales: ${theme} Adventure`,
      description: `A magical ${theme} story for kids! Join us for fun, learning, and adventure in this animated tale perfect for children.`,
      estimatedDuration: 4,
      targetAge: '3-8 years',
      keywords: ['kids', 'children', 'story', theme, 'animation', 'family']
    };

    try {
      for (const line of lines) {
        if (line.startsWith('TITLE:')) {
          metadata.title = line.replace('TITLE:', '').trim();
        } else if (line.startsWith('DESCRIPTION:')) {
          metadata.description = line.replace('DESCRIPTION:', '').trim();
        } else if (line.startsWith('DURATION:')) {
          const duration = line.replace('DURATION:', '').trim();
          metadata.estimatedDuration = parseInt(duration) || 4;
        } else if (line.startsWith('AGE:')) {
          metadata.targetAge = line.replace('AGE:', '').trim();
        } else if (line.startsWith('KEYWORDS:')) {
          const keywords = line.replace('KEYWORDS:', '').trim();
          metadata.keywords = keywords.split(',').map(k => k.trim());
        }
      }
    } catch (error) {
      this.logger.warn('⚠️ Using fallback metadata parsing');
    }

    return metadata;
  }

  async updateStrategyFromInsights(insights) {
    this.logger.info('📊 Updating FREE content strategy based on analytics...');
    // Same logic as paid version
  }

  async getHealthStatus() {
    const ollamaHealthy = await this.checkOllamaHealth();

    return {
      status: this.isInitialized && ollamaHealthy ? 'healthy' : 'not_initialized',
      ollamaConnected: ollamaHealthy,
      lastScriptGenerated: await this.contentDb.getLastScriptTime(),
      totalScripts: await this.contentDb.getScriptCount(),
      source: 'ollama_free'
    };
  }

  async checkOllamaHealth() {
    try {
      await axios.get(`${this.ollamaUrl}/api/tags`, { timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  async shutdown() {
    this.logger.info('⏹️ Shutting down FREE Content Creation Agent...');
    if (this.contentDb) {
      await this.contentDb.disconnect();
    }
    this.isInitialized = false;
    this.logger.info('✅ FREE Content Creation Agent shutdown complete');
  }
}