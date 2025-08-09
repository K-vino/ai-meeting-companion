// Transcription service using OpenAI Whisper

import OpenAI from 'openai';
import { config } from '../config';
import { logger } from '../utils/logger';
import { TranscriptSegment, AudioFormat, generateId } from '@ai-meeting-companion/shared';
import { AudioProcessor } from './audioProcessor';

export class TranscriptionService {
  private openai: OpenAI;
  private audioProcessor: AudioProcessor;

  constructor() {
    this.openai = new OpenAI({
      apiKey: config.openai.apiKey
    });
    this.audioProcessor = new AudioProcessor();
  }

  /**
   * Transcribe audio buffer to text
   */
  async transcribeAudio(
    audioBuffer: Buffer,
    sessionId: string,
    options: {
      language?: string;
      format?: AudioFormat;
      speakerId?: string;
      timestamp?: Date;
    } = {}
  ): Promise<TranscriptSegment> {
    try {
      const startTime = Date.now();
      
      // Process audio if needed
      const processedAudio = await this.audioProcessor.processAudio(
        audioBuffer,
        options.format || AudioFormat.WEBM
      );

      // Create form data for OpenAI Whisper
      const formData = new FormData();
      const audioBlob = new Blob([processedAudio], { 
        type: this.getMimeType(options.format || AudioFormat.WEBM) 
      });
      
      formData.append('file', audioBlob, `audio.${options.format || 'webm'}`);
      formData.append('model', config.openai.whisperModel);
      
      if (options.language) {
        formData.append('language', options.language);
      }

      // Add response format for timestamps
      formData.append('response_format', 'verbose_json');
      formData.append('timestamp_granularities[]', 'word');

      // Call OpenAI Whisper API
      const response = await this.openai.audio.transcriptions.create({
        file: audioBlob as any,
        model: config.openai.whisperModel,
        language: options.language,
        response_format: 'verbose_json',
        timestamp_granularities: ['word']
      });

      const processingTime = Date.now() - startTime;

      // Create transcript segment
      const segment: TranscriptSegment = {
        id: generateId(),
        sessionId,
        speakerId: options.speakerId,
        speakerName: options.speakerId ? `Speaker ${options.speakerId}` : undefined,
        text: response.text,
        timestamp: options.timestamp || new Date(),
        confidence: this.calculateConfidence(response),
        language: response.language || options.language || 'en',
        duration: response.duration
      };

      logger.info(`Transcription completed in ${processingTime}ms`, {
        sessionId,
        textLength: response.text.length,
        confidence: segment.confidence,
        language: segment.language,
        duration: segment.duration
      });

      return segment;

    } catch (error) {
      logger.error('Transcription failed:', error);
      throw new Error(`Transcription failed: ${(error as Error).message}`);
    }
  }

  /**
   * Transcribe audio stream in real-time
   */
  async transcribeStream(
    audioStream: AsyncIterable<Buffer>,
    sessionId: string,
    onTranscript: (segment: TranscriptSegment) => void,
    options: {
      language?: string;
      format?: AudioFormat;
      chunkDuration?: number;
    } = {}
  ): Promise<void> {
    try {
      const chunkDuration = options.chunkDuration || 5000; // 5 seconds
      let audioBuffer = Buffer.alloc(0);
      let lastTranscription = Date.now();

      for await (const chunk of audioStream) {
        audioBuffer = Buffer.concat([audioBuffer, chunk]);

        // Check if we have enough audio for transcription
        const now = Date.now();
        if (now - lastTranscription >= chunkDuration) {
          try {
            const segment = await this.transcribeAudio(
              audioBuffer,
              sessionId,
              {
                ...options,
                timestamp: new Date()
              }
            );

            onTranscript(segment);
            
            // Reset buffer and timer
            audioBuffer = Buffer.alloc(0);
            lastTranscription = now;

          } catch (error) {
            logger.warn('Stream transcription chunk failed:', error);
            // Continue with next chunk
          }
        }
      }

      // Process remaining audio
      if (audioBuffer.length > 0) {
        try {
          const segment = await this.transcribeAudio(
            audioBuffer,
            sessionId,
            {
              ...options,
              timestamp: new Date()
            }
          );

          onTranscript(segment);
        } catch (error) {
          logger.warn('Final stream transcription chunk failed:', error);
        }
      }

    } catch (error) {
      logger.error('Stream transcription failed:', error);
      throw new Error(`Stream transcription failed: ${(error as Error).message}`);
    }
  }

  /**
   * Get supported languages
   */
  getSupportedLanguages(): string[] {
    return [
      'en', 'zh', 'de', 'es', 'ru', 'ko', 'fr', 'ja', 'pt', 'tr', 'pl', 'ca', 'nl',
      'ar', 'sv', 'it', 'id', 'hi', 'fi', 'vi', 'he', 'uk', 'el', 'ms', 'cs', 'ro',
      'da', 'hu', 'ta', 'no', 'th', 'ur', 'hr', 'bg', 'lt', 'la', 'mi', 'ml', 'cy',
      'sk', 'te', 'fa', 'lv', 'bn', 'sr', 'az', 'sl', 'kn', 'et', 'mk', 'br', 'eu',
      'is', 'hy', 'ne', 'mn', 'bs', 'kk', 'sq', 'sw', 'gl', 'mr', 'pa', 'si', 'km',
      'sn', 'yo', 'so', 'af', 'oc', 'ka', 'be', 'tg', 'sd', 'gu', 'am', 'yi', 'lo',
      'uz', 'fo', 'ht', 'ps', 'tk', 'nn', 'mt', 'sa', 'lb', 'my', 'bo', 'tl', 'mg',
      'as', 'tt', 'haw', 'ln', 'ha', 'ba', 'jw', 'su'
    ];
  }

  /**
   * Validate audio format
   */
  isValidAudioFormat(format: string): boolean {
    const validFormats = Object.values(AudioFormat);
    return validFormats.includes(format as AudioFormat);
  }

  /**
   * Get MIME type for audio format
   */
  private getMimeType(format: AudioFormat): string {
    const mimeTypes = {
      [AudioFormat.WEBM]: 'audio/webm',
      [AudioFormat.MP3]: 'audio/mpeg',
      [AudioFormat.WAV]: 'audio/wav',
      [AudioFormat.OGG]: 'audio/ogg'
    };

    return mimeTypes[format] || 'audio/webm';
  }

  /**
   * Calculate confidence score from Whisper response
   */
  private calculateConfidence(response: any): number {
    // Whisper doesn't provide confidence scores directly
    // We can estimate based on response characteristics
    if (!response.text || response.text.trim().length === 0) {
      return 0;
    }

    // Basic heuristics for confidence estimation
    let confidence = 0.8; // Base confidence

    // Adjust based on text length (longer text usually more reliable)
    const textLength = response.text.trim().length;
    if (textLength < 10) {
      confidence -= 0.2;
    } else if (textLength > 100) {
      confidence += 0.1;
    }

    // Adjust based on language detection
    if (response.language && response.language !== 'en') {
      confidence -= 0.1; // Slightly lower confidence for non-English
    }

    // Ensure confidence is between 0 and 1
    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * Estimate transcription cost
   */
  estimateCost(audioBuffer: Buffer): number {
    // OpenAI Whisper pricing: $0.006 per minute
    const durationMinutes = this.estimateAudioDuration(audioBuffer);
    return durationMinutes * 0.006;
  }

  /**
   * Estimate audio duration from buffer size
   */
  private estimateAudioDuration(audioBuffer: Buffer): number {
    // Rough estimation based on buffer size
    // This is approximate and depends on audio quality/compression
    const bytesPerSecond = config.audio.sampleRate * config.audio.channels * 2; // 16-bit audio
    return audioBuffer.length / bytesPerSecond / 60; // Convert to minutes
  }
}
