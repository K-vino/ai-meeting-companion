// Health check API routes

import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { config } from '../config';

const router = Router();

/**
 * GET /health
 * Basic health check
 */
router.get('/',
  asyncHandler(async (_req: Request, res: Response) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: config.nodeEnv
    });
  })
);

/**
 * GET /health/detailed
 * Detailed health check with service status
 */
router.get('/detailed',
  asyncHandler(async (_req: Request, res: Response) => {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: config.nodeEnv,
      services: {
        openai: await checkOpenAIHealth(),
        memory: getMemoryUsage(),
        uptime: process.uptime()
      }
    };

    const isHealthy = Object.values(health.services).every(service => 
      typeof service === 'object' ? service.status === 'healthy' : true
    );

    res.status(isHealthy ? 200 : 503).json(health);
  })
);

async function checkOpenAIHealth(): Promise<{ status: string; message?: string }> {
  try {
    if (!config.openai.apiKey) {
      return { status: 'unhealthy', message: 'OpenAI API key not configured' };
    }
    
    // Simple check - we could make a test API call here
    return { status: 'healthy' };
  } catch (error) {
    return { status: 'unhealthy', message: (error as Error).message };
  }
}

function getMemoryUsage() {
  const usage = process.memoryUsage();
  return {
    rss: Math.round(usage.rss / 1024 / 1024) + ' MB',
    heapTotal: Math.round(usage.heapTotal / 1024 / 1024) + ' MB',
    heapUsed: Math.round(usage.heapUsed / 1024 / 1024) + ' MB',
    external: Math.round(usage.external / 1024 / 1024) + ' MB'
  };
}

export { router as healthRoutes };
