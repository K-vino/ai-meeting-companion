// Server configuration

import { config as dotenvConfig } from 'dotenv';

// Load environment variables
dotenvConfig();

export const config = {
  // Server
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  host: process.env.HOST || 'localhost',

  // OpenAI
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    model: process.env.OPENAI_MODEL || 'gpt-4',
    whisperModel: process.env.OPENAI_WHISPER_MODEL || 'whisper-1',
    maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || '2000', 10),
    temperature: parseFloat(process.env.OPENAI_TEMPERATURE || '0.1')
  },

  // Database
  database: {
    url: process.env.DATABASE_URL || '',
    maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '10', 10)
  },

  // Redis
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    ttl: parseInt(process.env.REDIS_TTL || '3600', 10) // 1 hour
  },

  // Security
  security: {
    jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
    corsOrigin: process.env.CORS_ORIGIN || 'chrome-extension://*,http://localhost:*'
  },

  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10)
  },

  // File Upload
  upload: {
    maxFileSize: process.env.MAX_FILE_SIZE || '50MB',
    uploadDir: process.env.UPLOAD_DIR || './uploads',
    allowedMimeTypes: [
      'audio/webm',
      'audio/mp3',
      'audio/wav',
      'audio/ogg',
      'audio/mp4',
      'audio/mpeg'
    ]
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || './logs/app.log'
  },

  // WebSocket
  websocket: {
    heartbeatInterval: parseInt(process.env.WS_HEARTBEAT_INTERVAL || '30000', 10),
    maxConnections: parseInt(process.env.WS_MAX_CONNECTIONS || '1000', 10)
  },

  // Audio Processing
  audio: {
    chunkSize: parseInt(process.env.AUDIO_CHUNK_SIZE || '1024', 10),
    sampleRate: parseInt(process.env.AUDIO_SAMPLE_RATE || '16000', 10),
    channels: parseInt(process.env.AUDIO_CHANNELS || '1', 10),
    format: process.env.AUDIO_FORMAT || 'wav'
  },

  // AI Analysis
  analysis: {
    batchSize: parseInt(process.env.ANALYSIS_BATCH_SIZE || '10', 10),
    timeout: parseInt(process.env.ANALYSIS_TIMEOUT || '30000', 10),
    enableSentiment: process.env.ENABLE_SENTIMENT_ANALYSIS === 'true',
    enableJargon: process.env.ENABLE_JARGON_DETECTION === 'true',
    enableActionItems: process.env.ENABLE_ACTION_ITEMS === 'true'
  },

  // Privacy
  privacy: {
    enableDataRetention: process.env.ENABLE_DATA_RETENTION === 'true',
    dataRetentionDays: parseInt(process.env.DATA_RETENTION_DAYS || '30', 10),
    enableAnonymization: process.env.ENABLE_ANONYMIZATION === 'true'
  }
};

// Validation
export function validateConfig(): void {
  const required = [
    'OPENAI_API_KEY'
  ];

  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  if (!config.openai.apiKey) {
    throw new Error('OpenAI API key is required');
  }
}

// Get parsed file size in bytes
export function getMaxFileSize(): number {
  const size = config.upload.maxFileSize;
  const match = size.match(/^(\d+)(MB|KB|GB)?$/i);
  
  if (!match) {
    return 50 * 1024 * 1024; // Default 50MB
  }

  const value = parseInt(match[1], 10);
  const unit = (match[2] || 'MB').toUpperCase();

  switch (unit) {
    case 'KB':
      return value * 1024;
    case 'MB':
      return value * 1024 * 1024;
    case 'GB':
      return value * 1024 * 1024 * 1024;
    default:
      return value;
  }
}

// Update config with parsed file size
(config as any).maxFileSize = getMaxFileSize();

// Validate configuration on import
if (config.nodeEnv === 'production') {
  validateConfig();
}
