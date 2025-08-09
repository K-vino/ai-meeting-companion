// Main server entry point

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';

import { logger } from './utils/logger';
import { config } from './config';
import { errorHandler } from './middleware/errorHandler';
import { rateLimiter } from './middleware/rateLimiter';
import { requestLogger } from './middleware/requestLogger';
import { validateRequest } from './middleware/validation';

// Import routes
import { transcriptionRoutes } from './api/transcription';
import { analysisRoutes } from './api/analysis';
import { sessionRoutes } from './api/sessions';
import { healthRoutes } from './api/health';

// Import WebSocket handler
import { WebSocketManager } from './services/websocket';

class Server {
  private app: express.Application;
  private server: any;
  private wsManager: WebSocketManager;

  constructor() {
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  private setupMiddleware(): void {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          connectSrc: ["'self'", "https://api.openai.com"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
      crossOriginEmbedderPolicy: false
    }));

    // CORS configuration
    this.app.use(cors({
      origin: (origin, callback) => {
        // Allow Chrome extension origins and localhost
        if (!origin || 
            origin.startsWith('chrome-extension://') || 
            origin.startsWith('http://localhost:') ||
            origin.startsWith('https://localhost:')) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
    }));

    // Compression
    this.app.use(compression());

    // Body parsing
    this.app.use(express.json({ limit: config.maxFileSize }));
    this.app.use(express.urlencoded({ extended: true, limit: config.maxFileSize }));

    // Request logging
    this.app.use(requestLogger);

    // Rate limiting
    this.app.use(rateLimiter);
  }

  private setupRoutes(): void {
    // Health check (no rate limiting)
    this.app.use('/health', healthRoutes);

    // API routes
    this.app.use('/api/transcription', transcriptionRoutes);
    this.app.use('/api/analysis', analysisRoutes);
    this.app.use('/api/sessions', sessionRoutes);

    // Root endpoint
    this.app.get('/', (req, res) => {
      res.json({
        name: 'AI Meeting Companion Server',
        version: '1.0.0',
        status: 'running',
        timestamp: new Date().toISOString()
      });
    });

    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.originalUrl} not found`,
        timestamp: new Date().toISOString()
      });
    });
  }

  private setupErrorHandling(): void {
    this.app.use(errorHandler);
  }

  public async start(): Promise<void> {
    try {
      // Create HTTP server
      this.server = createServer(this.app);

      // Setup WebSocket server
      const wss = new WebSocketServer({ 
        server: this.server,
        path: '/ws'
      });

      this.wsManager = new WebSocketManager(wss);

      // Start server
      this.server.listen(config.port, config.host, () => {
        logger.info(`Server started on ${config.host}:${config.port}`);
        logger.info(`Environment: ${config.nodeEnv}`);
        logger.info(`WebSocket server running on ws://${config.host}:${config.port}/ws`);
      });

      // Graceful shutdown
      this.setupGracefulShutdown();

    } catch (error) {
      logger.error('Failed to start server:', error);
      process.exit(1);
    }
  }

  private setupGracefulShutdown(): void {
    const shutdown = async (signal: string) => {
      logger.info(`Received ${signal}, shutting down gracefully...`);

      // Close WebSocket connections
      if (this.wsManager) {
        await this.wsManager.close();
      }

      // Close HTTP server
      if (this.server) {
        this.server.close((err: any) => {
          if (err) {
            logger.error('Error during server shutdown:', err);
            process.exit(1);
          }
          logger.info('Server closed successfully');
          process.exit(0);
        });
      }

      // Force exit after 10 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      shutdown('uncaughtException');
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
      shutdown('unhandledRejection');
    });
  }
}

// Start server
const server = new Server();
server.start().catch((error) => {
  logger.error('Failed to start application:', error);
  process.exit(1);
});
