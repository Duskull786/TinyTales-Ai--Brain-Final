import mongoose from 'mongoose';

const socialInteractionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['comment_response', 'dm_response', 'moderation_action'],
    required: true
  },
  commentId: String,
  authorId: String,
  authorName: String,
  originalComment: String,
  response: String,
  analysis: {
    sentiment: String,
    type: String,
    requiresPersonalizedResponse: Boolean,
    suggestedTone: String,
    keyPoints: [String]
  },
  timestamp: { type: Date, default: Date.now },
  processed: { type: Boolean, default: false }
});

const moderationActionSchema = new mongoose.Schema({
  commentId: { type: String, required: true },
  action: {
    type: String,
    enum: ['approve', 'hide', 'report'],
    required: true
  },
  reason: String,
  severity: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'low'
  },
  timestamp: { type: Date, default: Date.now }
});

export const SocialInteraction = mongoose.model('SocialInteraction', socialInteractionSchema);
export const ModerationAction = mongoose.model('ModerationAction', moderationActionSchema);

export class SocialDatabase {
  constructor() {
    this.SocialInteraction = SocialInteraction;
    this.ModerationAction = ModerationAction;
  }

  async connect() {
    return true;
  }

  async disconnect() {
    return true;
  }

  async isCommentProcessed(authorId, publishedAt) {
    const interaction = await this.SocialInteraction.findOne({
      authorId,
      'analysis.publishedAt': publishedAt
    });
    return !!interaction;
  }

  async logInteraction(interaction) {
    const social = new this.SocialInteraction(interaction);
    await social.save();
    return social;
  }

  async markCommentProcessed(commentId) {
    await this.SocialInteraction.updateOne(
      { commentId },
      { processed: true }
    );
  }

  async getSuspiciousComments() {
    return await this.SocialInteraction.find({
      processed: false,
      'analysis.sentiment': { $in: ['negative', 'spam'] }
    }).limit(10);
  }

  async logModerationAction(action) {
    const moderation = new this.ModerationAction(action);
    await moderation.save();
    return moderation;
  }

  async getEngagementStats() {
    const stats = await this.SocialInteraction.aggregate([
      {
        $group: {
          _id: null,
          totalInteractions: { $sum: 1 },
          commentResponses: {
            $sum: { $cond: [{ $eq: ['$type', 'comment_response'] }, 1, 0] }
          },
          dmResponses: {
            $sum: { $cond: [{ $eq: ['$type', 'dm_response'] }, 1, 0] }
          }
        }
      }
    ]);

    return stats[0] || { totalInteractions: 0, commentResponses: 0, dmResponses: 0 };
  }

  async getLastProcessedTime() {
    const latest = await this.SocialInteraction.findOne().sort({ timestamp: -1 });
    return latest?.timestamp;
  }

  async getTotalInteractions() {
    return await this.SocialInteraction.countDocuments();
  }

  async getAverageResponseTime() {
    // Placeholder - would calculate based on comment time vs response time
    return 300; // 5 minutes average
  }
}