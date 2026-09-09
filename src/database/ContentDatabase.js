import mongoose from 'mongoose';

const contentSchema = new mongoose.Schema({
  id: { type: String, unique: true, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  theme: { type: String, required: true },
  storyType: { type: String, required: true },
  content: { type: String, required: true },
  duration: { type: Number },
  targetAge: { type: String },
  keywords: [String],
  status: {
    type: String,
    enum: ['generated', 'reviewed', 'approved', 'published'],
    default: 'generated'
  },
  performance: {
    views: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    comments: { type: Number, default: 0 },
    engagement: { type: Number, default: 0 }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const themePerformanceSchema = new mongoose.Schema({
  theme: { type: String, unique: true, required: true },
  totalViews: { type: Number, default: 0 },
  totalVideos: { type: Number, default: 0 },
  averageEngagement: { type: Number, default: 0 },
  successWeight: { type: Number, default: 1.0 }, // Multiplier for theme selection
  lastUpdated: { type: Date, default: Date.now }
});

const contentIdeaSchema = new mongoose.Schema({
  theme: { type: String, required: true },
  storyType: { type: String, required: true },
  idea: { type: String, required: true },
  status: {
    type: String,
    enum: ['pending', 'used', 'rejected'],
    default: 'pending'
  },
  createdAt: { type: Date, default: Date.now }
});

export const Content = mongoose.model('Content', contentSchema);
export const ThemePerformance = mongoose.model('ThemePerformance', themePerformanceSchema);
export const ContentIdea = mongoose.model('ContentIdea', contentIdeaSchema);

export class ContentDatabase {
  constructor() {
    this.Content = Content;
    this.ThemePerformance = ThemePerformance;
    this.ContentIdea = ContentIdea;
  }

  async connect() {
    // Connection handled by DatabaseManager
    return true;
  }

  async disconnect() {
    // Disconnection handled by DatabaseManager
    return true;
  }

  async saveScript(script) {
    const content = new this.Content(script);
    await content.save();
    return content;
  }

  async getRecentScripts(days = 7) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    return await this.Content.find({
      createdAt: { $gte: cutoff }
    }).sort({ createdAt: -1 });
  }

  async updateThemePerformance(themes, action) {
    for (const theme of themes) {
      const update = action === 'increase'
        ? { $inc: { successWeight: 0.1 } }
        : { $inc: { successWeight: -0.05 } };

      await this.ThemePerformance.findOneAndUpdate(
        { theme },
        { ...update, lastUpdated: new Date() },
        { upsert: true }
      );
    }
  }

  async saveContentIdeas(ideas) {
    return await this.ContentIdea.insertMany(ideas);
  }

  async getLastScriptTime() {
    const latest = await this.Content.findOne().sort({ createdAt: -1 });
    return latest?.createdAt;
  }

  async getScriptCount() {
    return await this.Content.countDocuments();
  }

  async getAveragePerformance() {
    const result = await this.Content.aggregate([
      {
        $group: {
          _id: null,
          avgViews: { $avg: '$performance.views' },
          avgEngagement: { $avg: '$performance.engagement' }
        }
      }
    ]);

    return result[0] || { avgViews: 0, avgEngagement: 0 };
  }
}