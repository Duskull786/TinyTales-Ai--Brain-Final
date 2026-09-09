import mongoose from 'mongoose';
import { Logger } from '../utils/Logger.js';

export class DatabaseManager {
  constructor() {
    this.logger = new Logger('DatabaseManager');
    this.connection = null;
    this.isConnected = false;
  }

  async connect() {
    try {
      const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/tinytales';

      this.logger.info(`🔌 Connecting to MongoDB: ${mongoUri.replace(/\/\/.*@/, '//***@')}`);

      this.connection = await mongoose.connect(mongoUri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });

      this.isConnected = true;
      this.logger.info('✅ MongoDB connected successfully');

      // Set up connection event handlers
      mongoose.connection.on('error', (error) => {
        this.logger.error('❌ MongoDB connection error:', error);
      });

      mongoose.connection.on('disconnected', () => {
        this.logger.warn('⚠️ MongoDB disconnected');
        this.isConnected = false;
      });

      mongoose.connection.on('reconnected', () => {
        this.logger.info('🔄 MongoDB reconnected');
        this.isConnected = true;
      });

    } catch (error) {
      this.logger.error('❌ Failed to connect to MongoDB:', error);
      throw error;
    }
  }

  async disconnect() {
    if (this.connection) {
      await mongoose.disconnect();
      this.isConnected = false;
      this.logger.info('👋 MongoDB disconnected');
    }
  }

  getConnectionStatus() {
    return {
      connected: this.isConnected,
      readyState: mongoose.connection.readyState,
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      name: mongoose.connection.name
    };
  }
}