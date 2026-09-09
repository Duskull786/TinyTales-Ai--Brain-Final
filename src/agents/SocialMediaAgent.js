import { Anthropic } from '@anthropic-ai/sdk';
import { google } from 'googleapis';
import { Logger } from '../utils/Logger.js';
import { SocialDatabase } from '../database/SocialDatabase.js';

export class SocialMediaAgent {
  constructor() {
    this.logger = new Logger('SocialAgent');
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
    this.youtube = null;
    this.socialDb = new SocialDatabase();
    this.isInitialized = false;

    // Response templates for common scenarios
    this.responseTemplates = {
      positive: [
        "Thank you so much! We're thrilled you enjoyed the story! 🌟",
        "Aww, that makes us so happy! Thanks for watching TinyTales! ❤️",
        "We're so glad you loved it! More magical stories coming soon! ✨"
      ],
      request: [
        "What a wonderful idea! We'll definitely consider that for future stories! 🎨",
        "Thanks for the suggestion! Our story creators love hearing your ideas! 💡",
        "That sounds like an amazing adventure! We'll add it to our story wishlist! 📚"
      ],
      question: [
        "Great question! {specific_answer}",
        "We love curious minds! {specific_answer}",
        "Thanks for asking! {specific_answer}"
      ],
      parent: [
        "Thank you for choosing TinyTales for your little one! We create all our content with love and care for young minds. 👨‍👩‍👧‍👦",
        "We appreciate parents like you who value quality children's content! All our stories are designed to be both fun and educational. 📖",
        "Thank you for trusting us with your child's screen time! We work hard to make every story meaningful and age-appropriate. 🏠"
      ]
    };
  }

  async initialize() {
    this.logger.info('💬 Initializing Social Media Agent...');

    try {
      // Initialize YouTube API
      const auth = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET
      );

      auth.setCredentials({
        refresh_token: process.env.GOOGLE_REFRESH_TOKEN
      });

      this.youtube = google.youtube({
        version: 'v3',
        auth: auth
      });

      await this.socialDb.connect();
      this.isInitialized = true;

      this.logger.info('✅ Social Media Agent ready for 24/7 engagement');
    } catch (error) {
      this.logger.error('❌ Failed to initialize Social Media Agent:', error);
      throw error;
    }
  }

  async getNewComments() {
    if (!this.isInitialized) {
      throw new Error('Social Media Agent not initialized');
    }

    try {
      // Get recent videos
      const channelResponse = await this.youtube.channels.list({
        part: 'contentDetails',
        id: process.env.YOUTUBE_CHANNEL_ID
      });

      const uploadsPlaylistId = channelResponse.data.items[0].contentDetails.relatedPlaylists.uploads;

      // Get recent videos from uploads playlist
      const videosResponse = await this.youtube.playlistItems.list({
        part: 'snippet',
        playlistId: uploadsPlaylistId,
        maxResults: 10
      });

      const newComments = [];

      // Get comments for each recent video
      for (const video of videosResponse.data.items) {
        try {
          const commentsResponse = await this.youtube.commentThreads.list({
            part: 'snippet,replies',
            videoId: video.snippet.resourceId.videoId,
            maxResults: 50,
            order: 'time'
          });

          for (const commentThread of commentsResponse.data.items || []) {
            const comment = commentThread.snippet.topLevelComment.snippet;

            // Check if we've already processed this comment
            const alreadyProcessed = await this.socialDb.isCommentProcessed(comment.authorChannelId?.value, comment.publishedAt);

            if (!alreadyProcessed) {
              newComments.push({
                id: commentThread.id,
                videoId: video.snippet.resourceId.videoId,
                videoTitle: video.snippet.title,
                authorName: comment.authorDisplayName,
                authorId: comment.authorChannelId?.value,
                text: comment.textDisplay,
                publishedAt: comment.publishedAt,
                likeCount: comment.likeCount,
                replyCount: commentThread.snippet.totalReplyCount
              });
            }
          }
        } catch (error) {
          // Some videos might have comments disabled
          this.logger.debug(`No comments available for video: ${video.snippet.title}`);
        }
      }

      this.logger.info(`📬 Found ${newComments.length} new comments to process`);
      return newComments;

    } catch (error) {
      this.logger.error('❌ Failed to get new comments:', error);
      return [];
    }
  }

  async generateResponse(comment) {
    try {
      this.logger.info(`🤖 Generating response for comment by ${comment.authorName}`);

      // Analyze comment sentiment and type
      const analysisPrompt = `Analyze this YouTube comment on a kids' channel and categorize it:

Comment: "${comment.text}"
Video: "${comment.videoTitle}"

Respond with JSON:
{
  "sentiment": "positive|neutral|negative|spam",
  "type": "praise|question|request|parent_inquiry|spam|inappropriate",
  "requiresPersonalizedResponse": true|false,
  "suggestedTone": "enthusiastic|helpful|gentle|professional",
  "keyPoints": ["main", "points", "to", "address"]
}

Consider this is a family-friendly kids channel. Be very cautious about inappropriate content.`;

      const analysisResponse = await this.anthropic.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 300,
        messages: [{
          role: 'user',
          content: analysisPrompt
        }]
      });

      const analysis = JSON.parse(analysisResponse.content[0].text);

      // Don't respond to spam or inappropriate content
      if (analysis.sentiment === 'spam' || analysis.type === 'inappropriate') {
        this.logger.warn(`🚫 Skipping inappropriate/spam comment from ${comment.authorName}`);
        return null;
      }

      // Generate personalized response
      if (analysis.requiresPersonalizedResponse) {
        const responsePrompt = `Generate a warm, friendly response to this comment on TinyTales kids channel:

Comment: "${comment.text}"
Video: "${comment.videoTitle}"
Analysis: ${JSON.stringify(analysis)}

Guidelines:
- Keep it under 280 characters
- Be warm and encouraging
- Use kid-friendly language and emojis
- Thank them for watching
- Maintain TinyTales brand voice (magical, educational, caring)
- If it's a question, provide a helpful answer
- If it's a request, acknowledge it positively
- Include relevant emojis but don't overuse them

Response:`;

        const responseMessage = await this.anthropic.messages.create({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 150,
          messages: [{
            role: 'user',
            content: responsePrompt
          }]
        });

        const response = responseMessage.content[0].text.trim();

        // Log the interaction
        await this.socialDb.logInteraction({
          type: 'comment_response',
          commentId: comment.id,
          authorId: comment.authorId,
          originalComment: comment.text,
          response: response,
          analysis: analysis,
          timestamp: new Date()
        });

        return response;

      } else {
        // Use template response for common scenarios
        const templates = this.responseTemplates[analysis.type] || this.responseTemplates.positive;
        const template = templates[Math.floor(Math.random() * templates.length)];

        return template;
      }

    } catch (error) {
      this.logger.error('❌ Failed to generate comment response:', error);
      return "Thank you for watching TinyTales! We love hearing from our viewers! 🌟";
    }
  }

  async replyToComment(commentId, responseText) {
    try {
      await this.youtube.comments.insert({
        part: 'snippet',
        requestBody: {
          snippet: {
            parentId: commentId,
            textOriginal: responseText
          }
        }
      });

      this.logger.info(`✅ Replied to comment: "${responseText}"`);

      // Mark as processed
      await this.socialDb.markCommentProcessed(commentId);

    } catch (error) {
      this.logger.error('❌ Failed to reply to comment:', error);
    }
  }

  async getNewDirectMessages() {
    // Note: YouTube doesn't have DMs, but we can implement this for other platforms
    // For now, return empty array - can be extended for Instagram, Twitter, etc.
    return [];
  }

  async generateDMResponse(dm) {
    try {
      const responsePrompt = `Generate a professional, helpful response to this direct message for TinyTales kids channel:

Message: "${dm.text}"
Sender: ${dm.senderName}

Guidelines:
- Professional but warm tone
- Family-friendly and appropriate for parents/caregivers
- Under 500 characters
- Include relevant information about TinyTales
- Be helpful and informative
- Use appropriate emojis sparingly

Response:`;

      const response = await this.anthropic.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 200,
        messages: [{
          role: 'user',
          content: responsePrompt
        }]
      });

      return response.content[0].text.trim();

    } catch (error) {
      this.logger.error('❌ Failed to generate DM response:', error);
      return "Thank you for reaching out to TinyTales! We appreciate your message and will get back to you soon. 📚✨";
    }
  }

  async sendDirectMessage(recipientId, message) {
    // Implementation depends on platform (Instagram, Twitter, etc.)
    this.logger.info(`📩 Would send DM to ${recipientId}: "${message}"`);
  }

  async moderateContent() {
    this.logger.info('🛡️ Running content moderation check...');

    try {
      // Get recent comments that need moderation review
      const suspiciousComments = await this.socialDb.getSuspiciousComments();

      for (const comment of suspiciousComments) {
        const moderationPrompt = `Review this comment for a kids YouTube channel and determine if it should be hidden/reported:

Comment: "${comment.text}"
Author: ${comment.authorName}

Check for:
- Inappropriate language
- Adult content references
- Spam/promotional content
- Potential safety concerns for children
- Bullying or negative behavior

Respond with JSON:
{
  "action": "approve|hide|report",
  "reason": "explanation",
  "severity": "low|medium|high"
}`;

        const moderationResponse = await this.anthropic.messages.create({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 200,
          messages: [{
            role: 'user',
            content: moderationPrompt
          }]
        });

        const moderation = JSON.parse(moderationResponse.content[0].text);

        if (moderation.action === 'hide' || moderation.action === 'report') {
          this.logger.warn(`🚫 Flagged comment from ${comment.authorName}: ${moderation.reason}`);

          // Log moderation action
          await this.socialDb.logModerationAction({
            commentId: comment.id,
            action: moderation.action,
            reason: moderation.reason,
            severity: moderation.severity,
            timestamp: new Date()
          });
        }
      }

    } catch (error) {
      this.logger.error('❌ Content moderation failed:', error);
    }
  }

  async getEngagementMetrics() {
    return await this.socialDb.getEngagementStats();
  }

  async getHealthStatus() {
    return {
      status: this.isInitialized ? 'healthy' : 'not_initialized',
      lastCommentProcessed: await this.socialDb.getLastProcessedTime(),
      totalInteractions: await this.socialDb.getTotalInteractions(),
      avgResponseTime: await this.socialDb.getAverageResponseTime()
    };
  }

  async shutdown() {
    this.logger.info('⏹️ Shutting down Social Media Agent...');

    if (this.socialDb) {
      await this.socialDb.disconnect();
    }

    this.isInitialized = false;
    this.logger.info('✅ Social Media Agent shutdown complete');
  }
}