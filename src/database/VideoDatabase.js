import mongoose from 'mongoose';

const videoSchema = new mongoose.Schema({
  id: { type: String, unique: true, required: true },
  script: {
    id: String,
    title: String,
    theme: String,
    description: String
  },
  videoFile: String,
  thumbnail: String,
  duration: Number,
  status: {
    type: String,
    enum: ['ready_for_upload', 'uploading', 'published', 'failed'],
    default: 'ready_for_upload'
  },
  youtubeId: String,
  publishedAt: Date,
  performance: {
    views: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    comments: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
    watchTime: { type: Number, default: 0 }
  },
  productionTime: Number, // Time in seconds to create
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export const Video = mongoose.model('Video', videoSchema);

export class VideoDatabase {
  constructor() {
    this.Video = Video;
  }

  async connect() {
    return true;
  }

  async disconnect() {
    return true;
  }

  async saveVideo(videoData) {
    const video = new this.Video(videoData);
    await video.save();
    return video;
  }

  async updateVideoStatus(videoId, status, metadata = {}) {
    await this.Video.findOneAndUpdate(
      { id: videoId },
      {
        status,
        ...metadata,
        updatedAt: new Date()
      }
    );
  }

  async getLastVideoTime() {
    const latest = await this.Video.findOne().sort({ createdAt: -1 });
    return latest?.createdAt;
  }

  async getVideoCount() {
    return await this.Video.countDocuments();
  }

  async getAverageProductionTime() {
    const result = await this.Video.aggregate([
      {
        $group: {
          _id: null,
          avgProductionTime: { $avg: '$productionTime' }
        }
      }
    ]);

    return result[0]?.avgProductionTime || 0;
  }
}