// Analysis API routes

import { Router, Request, Response } from 'express';
import Joi from 'joi';
import { asyncHandler } from '../middleware/errorHandler';
import { validateRequest, schemas } from '../middleware/validation';
import { AIAnalysisService } from '../services/aiAnalysis';
import { logger } from '../utils/logger';

// Extend Request interface to include startTime
declare global {
  namespace Express {
    interface Request {
      startTime?: number;
    }
  }
}

const router = Router();
const analysisService = new AIAnalysisService();

/**
 * POST /api/analysis/analyze
 * Analyze transcript text
 */
router.post('/analyze',
  validateRequest({
    body: schemas.analysisRequest
  }),
  asyncHandler(async (req: Request, res: Response) => {
    const { sessionId, text, analysisTypes } = req.body;
    
    logger.info('Analysis request received', {
      sessionId,
      textLength: text.length,
      analysisTypes
    });

    // Convert text to transcript segments for analysis
    const segments = [{
      id: `temp_${Date.now()}`,
      sessionId,
      text,
      timestamp: new Date(),
      confidence: 1.0,
      language: 'en'
    }];

    const analysis = await analysisService.analyzeTranscript(
      sessionId,
      segments,
      analysisTypes
    );

    res.json({
      success: true,
      data: {
        analysis,
        processingTime: Date.now() - (req.startTime || Date.now())
      },
      timestamp: new Date().toISOString()
    });
  })
);

/**
 * POST /api/analysis/segments
 * Analyze transcript segments
 */
router.post('/segments',
  validateRequest({
    body: {
      sessionId: schemas.analysisRequest.extract('sessionId'),
      segments: Joi.array().items(Joi.object({
        id: Joi.string().required(),
        sessionId: Joi.string().required(),
        text: Joi.string().required(),
        timestamp: Joi.date().required(),
        confidence: Joi.number().min(0).max(1).required(),
        language: Joi.string().optional()
      })).required(),
      analysisTypes: schemas.analysisRequest.extract('analysisTypes')
    }
  }),
  asyncHandler(async (req, res) => {
    const { sessionId, segments, analysisTypes } = req.body;
    
    logger.info('Segment analysis request received', {
      sessionId,
      segmentCount: segments.length,
      analysisTypes
    });

    const analysis = await analysisService.analyzeTranscript(
      sessionId,
      segments,
      analysisTypes
    );

    res.json({
      success: true,
      data: {
        analysis,
        processingTime: Date.now() - (req.startTime || Date.now())
      },
      timestamp: new Date().toISOString()
    });
  })
);

/**
 * GET /api/analysis/types
 * Get available analysis types
 */
router.get('/types',
  asyncHandler(async (req, res) => {
    const analysisTypes = [
      {
        type: 'summary',
        name: 'Meeting Summary',
        description: 'Generate a concise summary of the meeting'
      },
      {
        type: 'action_items',
        name: 'Action Items',
        description: 'Extract action items and tasks from the discussion'
      },
      {
        type: 'sentiment',
        name: 'Sentiment Analysis',
        description: 'Analyze the emotional tone of the meeting'
      },
      {
        type: 'jargon',
        name: 'Jargon Detection',
        description: 'Identify and explain technical terms and jargon'
      },
      {
        type: 'topics',
        name: 'Topic Extraction',
        description: 'Identify main topics and themes discussed'
      },
      {
        type: 'insights',
        name: 'Business Insights',
        description: 'Generate actionable business insights'
      }
    ];

    res.json({
      success: true,
      data: { analysisTypes },
      timestamp: new Date().toISOString()
    });
  })
);

export { router as analysisRoutes };
