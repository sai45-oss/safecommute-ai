import { logger } from '../utils/logger.js';

// Mock database implementation for WebContainer environment
class MockDatabase {
  constructor() {
    this.collections = new Map();
    this.connected = false;
  }

  async connect() {
    this.connected = true;
    logger.info('Mock Database Connected (WebContainer environment)');
    return { connection: { host: 'mock-database' } };
  }

  async disconnect() {
    this.connected = false;
    logger.info('Mock Database disconnected');
  }

  getCollection(name) {
    if (!this.collections.has(name)) {
      this.collections.set(name, new Map());
    }
    return this.collections.get(name);
  }

  isConnected() {
    return this.connected;
  }
}

// Create mock database instance
const mockDb = new MockDatabase();

// Mock mongoose-like interface
const mockMongoose = {
  connection: {
    on: (event, callback) => {
      // Mock event handlers
      if (event === 'error') {
        // Don't trigger error events in mock mode
      }
    },
    close: async () => {
      await mockDb.disconnect();
    }
  },
  connect: async (uri, options) => {
    return await mockDb.connect();
  }
};

export const connectDatabase = async () => {
  try {
    // Check if we're in WebContainer environment (no real MongoDB available)
    const isWebContainer = !process.env.MONGODB_URI || process.env.MONGODB_URI.includes('localhost');
    
    if (isWebContainer) {
      // Use mock database for WebContainer
      const conn = await mockDb.connect();
      logger.info('Using mock database for WebContainer environment');
      return conn;
    } else {
      // Use real MongoDB in production
      const mongoose = await import('mongoose');
      const conn = await mongoose.connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });

      logger.info(`MongoDB Connected: ${conn.connection.host}`);

      // Handle connection events
      mongoose.connection.on('error', (err) => {
        logger.error('MongoDB connection error:', err);
      });

      mongoose.connection.on('disconnected', () => {
        logger.warn('MongoDB disconnected');
      });

      mongoose.connection.on('reconnected', () => {
        logger.info('MongoDB reconnected');
      });

      return conn;
    }
  } catch (error) {
    logger.error('Database connection failed:', error);
    // Don't exit process in WebContainer, just log the error
    if (process.env.NODE_ENV !== 'development') {
      process.exit(1);
    }
  }
};

export const disconnectDatabase = async () => {
  try {
    const isWebContainer = !process.env.MONGODB_URI || process.env.MONGODB_URI.includes('localhost');
    
    if (isWebContainer) {
      await mockDb.disconnect();
    } else {
      const mongoose = await import('mongoose');
      await mongoose.connection.close();
    }
    logger.info('Database connection closed');
  } catch (error) {
    logger.error('Error closing database connection:', error);
  }
};

// Export mock database for use in models
export { mockDb };