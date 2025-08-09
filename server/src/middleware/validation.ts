// Request validation middleware

import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { CustomError } from './errorHandler';

export interface ValidationSchema {
  body?: Joi.ObjectSchema;
  query?: Joi.ObjectSchema;
  params?: Joi.ObjectSchema;
}

export const validateRequest = (schema: ValidationSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const errors: string[] = [];

    // Validate body
    if (schema.body) {
      const { error } = schema.body.validate(req.body);
      if (error) {
        errors.push(`Body: ${error.details.map(d => d.message).join(', ')}`);
      }
    }

    // Validate query
    if (schema.query) {
      const { error } = schema.query.validate(req.query);
      if (error) {
        errors.push(`Query: ${error.details.map(d => d.message).join(', ')}`);
      }
    }

    // Validate params
    if (schema.params) {
      const { error } = schema.params.validate(req.params);
      if (error) {
        errors.push(`Params: ${error.details.map(d => d.message).join(', ')}`);
      }
    }

    if (errors.length > 0) {
      throw new CustomError(`Validation failed: ${errors.join('; ')}`, 400);
    }

    next();
  };
};

// Common validation schemas
export const schemas = {
  // Session ID parameter
  sessionId: Joi.object({
    sessionId: Joi.string().required().min(1)
  }),

  // Transcription request
  transcriptionRequest: Joi.object({
    sessionId: Joi.string().required(),
    language: Joi.string().optional().default('en-US'),
    format: Joi.string().valid('webm', 'mp3', 'wav', 'ogg').optional()
  }),

  // Analysis request
  analysisRequest: Joi.object({
    sessionId: Joi.string().required(),
    text: Joi.string().required().min(1),
    analysisTypes: Joi.array().items(
      Joi.string().valid('summary', 'action_items', 'sentiment', 'jargon', 'topics', 'insights')
    ).optional().default(['summary', 'action_items', 'sentiment', 'jargon'])
  }),

  // Session creation
  createSession: Joi.object({
    title: Joi.string().optional(),
    platform: Joi.string().valid('zoom', 'google_meet', 'microsoft_teams', 'generic').required(),
    settings: Joi.object({
      autoTranscribe: Joi.boolean().optional().default(true),
      realTimeAnalysis: Joi.boolean().optional().default(true),
      saveTranscripts: Joi.boolean().optional().default(true),
      detectJargon: Joi.boolean().optional().default(true),
      sentimentAnalysis: Joi.boolean().optional().default(true),
      participantConsent: Joi.boolean().optional().default(true),
      language: Joi.string().optional().default('en-US'),
      privacyMode: Joi.string().valid('full', 'anonymous', 'local_only').optional().default('full')
    }).optional()
  }),

  // Pagination query
  pagination: Joi.object({
    page: Joi.number().integer().min(1).optional().default(1),
    limit: Joi.number().integer().min(1).max(100).optional().default(20),
    sortBy: Joi.string().optional(),
    sortOrder: Joi.string().valid('asc', 'desc').optional().default('desc')
  })
};
