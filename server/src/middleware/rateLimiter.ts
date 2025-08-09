// Rate limiting middleware

import { Request, Response, NextFunction } from 'express';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import { config } from '../config';
import { logger } from '../utils/logger';

// Create rate limiter
const rateLimiter = new RateLimiterMemory({
  keyGenerator: (req: Request) => {
    // Use IP address as key, but could be enhanced with user ID
    return req.ip || 'unknown';
  },
  points: config.rateLimit.maxRequests, // Number of requests
  duration: Math.floor(config.rateLimit.windowMs / 1000), // Per duration in seconds
  blockDuration: 60, // Block for 60 seconds if limit exceeded
});

// Separate rate limiter for file uploads (more restrictive)
const uploadRateLimiter = new RateLimiterMemory({
  keyGenerator: (req: Request) => req.ip || 'unknown',
  points: 10, // 10 uploads
  duration: 60, // per minute
  blockDuration: 300, // Block for 5 minutes
});

export const rateLimiterMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Use upload rate limiter for file upload endpoints
    const limiter = req.path.includes('/transcription') ? uploadRateLimiter : rateLimiter;
    
    await limiter.consume(req.ip || 'unknown');
    next();
  } catch (rejRes: any) {
    const secs = Math.round(rejRes.msBeforeNext / 1000) || 1;
    
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`, {
      path: req.path,
      method: req.method,
      retryAfter: secs
    });
    
    res.set('Retry-After', String(secs));
    res.status(429).json({
      success: false,
      error: {
        message: 'Too many requests',
        retryAfter: secs
      },
      timestamp: new Date().toISOString()
    });
  }
};

export { rateLimiterMiddleware as rateLimiter };
