// Transcription API routes

import { Router, Request, Response } from 'express';

// Extend Request interface to include startTime
declare global {
  namespace Express {
    interface Request {
      startTime?: number;
    }
  }
}
import multer from 'multer';
import { asyncHandler } from '../middleware/errorHandler';
import { validateRequest, schemas } from '../middleware/validation';
import { TranscriptionService } from '../services/transcription';
import { logger } from '../utils/logger';
import { config } from '../config';

const router = Router();
const transcriptionService = new TranscriptionService();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: (config as any).maxFileSize,
    files: 1
  },
  fileFilter: (_req, file, cb) => {
    if (config.upload.allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}`));
    }
  }
});

/**
 * POST /api/transcription/upload
 * Upload audio file for transcription
 */
router.post('/upload',
  upload.single('audio'),
  validateRequest({
    body: schemas.transcriptionRequest
  }),
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: { message: 'No audio file provided' },
        timestamp: new Date().toISOString()
      });
    }

    const { sessionId, language, format } = req.body;
    
    logger.info('Transcription request received', {
      sessionId,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      language
    });

    const segment = await transcriptionService.transcribeAudio(
      req.file.buffer,
      sessionId,
      {
        language,
        format,
        timestamp: new Date()
      }
    );

    res.json({
      success: true,
      data: {
        transcript: segment,
        processingTime: Date.now() - (req.startTime || Date.now())
      },
      timestamp: new Date().toISOString()
    });
  })
);

/**
 * GET /api/transcription/languages
 * Get supported languages
 */
router.get('/languages',
  asyncHandler(async (req, res) => {
    const languages = transcriptionService.getSupportedLanguages();
    
    res.json({
      success: true,
      data: { languages },
      timestamp: new Date().toISOString()
    });
  })
);

/**
 * POST /api/transcription/validate
 * Validate audio format
 */
router.post('/validate',
  validateRequest({
    body: {
      format: schemas.transcriptionRequest.extract('format')
    }
  }),
  asyncHandler(async (req, res) => {
    const { format } = req.body;
    const isValid = transcriptionService.isValidAudioFormat(format);
    
    res.json({
      success: true,
      data: { 
        isValid,
        supportedFormats: Object.values(config.upload.allowedMimeTypes)
      },
      timestamp: new Date().toISOString()
    });
  })
);

/**
 * POST /api/transcription/estimate-cost
 * Estimate transcription cost
 */
router.post('/estimate-cost',
  upload.single('audio'),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: { message: 'No audio file provided' },
        timestamp: new Date().toISOString()
      });
    }

    const estimatedCost = transcriptionService.estimateCost(req.file.buffer);
    
    res.json({
      success: true,
      data: { 
        estimatedCost,
        currency: 'USD',
        fileSize: req.file.size
      },
      timestamp: new Date().toISOString()
    });
  })
);

export { router as transcriptionRoutes };
