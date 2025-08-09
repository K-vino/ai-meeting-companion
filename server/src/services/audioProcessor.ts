// Audio processing service

import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import { Readable, PassThrough } from 'stream';
import { config } from '../config';
import { logger } from '../utils/logger';
import { AudioFormat } from '@ai-meeting-companion/shared';

// Set ffmpeg path
if (ffmpegStatic) {
  ffmpeg.setFfmpegPath(ffmpegStatic);
}

export class AudioProcessor {
  /**
   * Process audio buffer to optimal format for transcription
   */
  async processAudio(
    audioBuffer: Buffer,
    inputFormat: AudioFormat = AudioFormat.WEBM
  ): Promise<Buffer> {
    try {
      // If already in WAV format with correct settings, return as-is
      if (inputFormat === AudioFormat.WAV && await this.isOptimalFormat(audioBuffer)) {
        return audioBuffer;
      }

      // Convert to optimal format
      return await this.convertToOptimalFormat(audioBuffer, inputFormat);

    } catch (error) {
      logger.error('Audio processing failed:', error);
      // Return original buffer if processing fails
      return audioBuffer;
    }
  }

  /**
   * Convert audio to optimal format for transcription
   */
  private async convertToOptimalFormat(
    audioBuffer: Buffer,
    inputFormat: AudioFormat
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const inputStream = new Readable();
      inputStream.push(audioBuffer);
      inputStream.push(null);

      const outputChunks: Buffer[] = [];
      const outputStream = new PassThrough();

      outputStream.on('data', (chunk) => {
        outputChunks.push(chunk);
      });

      outputStream.on('end', () => {
        resolve(Buffer.concat(outputChunks));
      });

      outputStream.on('error', (error) => {
        reject(error);
      });

      // Configure ffmpeg conversion
      const command = ffmpeg(inputStream)
        .inputFormat(this.getFFmpegFormat(inputFormat))
        .audioFrequency(config.audio.sampleRate)
        .audioChannels(config.audio.channels)
        .audioBitrate('128k')
        .format('wav')
        .on('error', (error) => {
          logger.error('FFmpeg conversion error:', error);
          reject(error);
        })
        .on('end', () => {
          logger.debug('Audio conversion completed');
        });

      // Pipe to output stream
      command.pipe(outputStream);
    });
  }

  /**
   * Check if audio is already in optimal format
   */
  private async isOptimalFormat(audioBuffer: Buffer): Promise<boolean> {
    try {
      const info = await this.getAudioInfo(audioBuffer);
      
      return (
        info.sampleRate === config.audio.sampleRate &&
        info.channels === config.audio.channels &&
        info.format === 'wav'
      );
    } catch (error) {
      return false;
    }
  }

  /**
   * Get audio file information
   */
  private async getAudioInfo(audioBuffer: Buffer): Promise<{
    duration: number;
    sampleRate: number;
    channels: number;
    format: string;
    bitrate: number;
  }> {
    return new Promise((resolve, reject) => {
      const inputStream = new Readable();
      inputStream.push(audioBuffer);
      inputStream.push(null);

      ffmpeg.ffprobe(inputStream, (error, metadata) => {
        if (error) {
          reject(error);
          return;
        }

        const audioStream = metadata.streams.find(stream => stream.codec_type === 'audio');
        
        if (!audioStream) {
          reject(new Error('No audio stream found'));
          return;
        }

        resolve({
          duration: metadata.format.duration || 0,
          sampleRate: audioStream.sample_rate || 0,
          channels: audioStream.channels || 0,
          format: audioStream.codec_name || 'unknown',
          bitrate: audioStream.bit_rate ? parseInt(audioStream.bit_rate) : 0
        });
      });
    });
  }

  /**
   * Split audio into chunks
   */
  async splitAudioIntoChunks(
    audioBuffer: Buffer,
    chunkDurationSeconds: number = 30
  ): Promise<Buffer[]> {
    try {
      const info = await this.getAudioInfo(audioBuffer);
      const totalDuration = info.duration;
      const numChunks = Math.ceil(totalDuration / chunkDurationSeconds);
      const chunks: Buffer[] = [];

      for (let i = 0; i < numChunks; i++) {
        const startTime = i * chunkDurationSeconds;
        const chunk = await this.extractAudioSegment(
          audioBuffer,
          startTime,
          chunkDurationSeconds
        );
        chunks.push(chunk);
      }

      return chunks;

    } catch (error) {
      logger.error('Audio splitting failed:', error);
      throw error;
    }
  }

  /**
   * Extract audio segment
   */
  private async extractAudioSegment(
    audioBuffer: Buffer,
    startTime: number,
    duration: number
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const inputStream = new Readable();
      inputStream.push(audioBuffer);
      inputStream.push(null);

      const outputChunks: Buffer[] = [];
      const outputStream = new PassThrough();

      outputStream.on('data', (chunk) => {
        outputChunks.push(chunk);
      });

      outputStream.on('end', () => {
        resolve(Buffer.concat(outputChunks));
      });

      outputStream.on('error', reject);

      ffmpeg(inputStream)
        .seekInput(startTime)
        .duration(duration)
        .format('wav')
        .on('error', reject)
        .pipe(outputStream);
    });
  }

  /**
   * Normalize audio volume
   */
  async normalizeAudio(audioBuffer: Buffer): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const inputStream = new Readable();
      inputStream.push(audioBuffer);
      inputStream.push(null);

      const outputChunks: Buffer[] = [];
      const outputStream = new PassThrough();

      outputStream.on('data', (chunk) => {
        outputChunks.push(chunk);
      });

      outputStream.on('end', () => {
        resolve(Buffer.concat(outputChunks));
      });

      outputStream.on('error', reject);

      ffmpeg(inputStream)
        .audioFilters('loudnorm')
        .format('wav')
        .on('error', reject)
        .pipe(outputStream);
    });
  }

  /**
   * Remove silence from audio
   */
  async removeSilence(audioBuffer: Buffer): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const inputStream = new Readable();
      inputStream.push(audioBuffer);
      inputStream.push(null);

      const outputChunks: Buffer[] = [];
      const outputStream = new PassThrough();

      outputStream.on('data', (chunk) => {
        outputChunks.push(chunk);
      });

      outputStream.on('end', () => {
        resolve(Buffer.concat(outputChunks));
      });

      outputStream.on('error', reject);

      ffmpeg(inputStream)
        .audioFilters('silenceremove=1:0:-50dB')
        .format('wav')
        .on('error', reject)
        .pipe(outputStream);
    });
  }

  /**
   * Get FFmpeg format string for audio format
   */
  private getFFmpegFormat(format: AudioFormat): string {
    const formatMap = {
      [AudioFormat.WEBM]: 'webm',
      [AudioFormat.MP3]: 'mp3',
      [AudioFormat.WAV]: 'wav',
      [AudioFormat.OGG]: 'ogg'
    };

    return formatMap[format] || 'webm';
  }

  /**
   * Validate audio buffer
   */
  isValidAudio(audioBuffer: Buffer): boolean {
    // Basic validation - check if buffer has content and starts with valid audio headers
    if (!audioBuffer || audioBuffer.length < 100) {
      return false;
    }

    // Check for common audio file signatures
    const header = audioBuffer.slice(0, 12);
    
    // WAV file signature
    if (header.slice(0, 4).toString() === 'RIFF' && 
        header.slice(8, 12).toString() === 'WAVE') {
      return true;
    }

    // WebM signature
    if (header.slice(0, 4).toString('hex') === '1a45dfa3') {
      return true;
    }

    // MP3 signature
    if (header.slice(0, 3).toString('hex') === 'fff3' || 
        header.slice(0, 3).toString('hex') === 'fffb') {
      return true;
    }

    // OGG signature
    if (header.slice(0, 4).toString() === 'OggS') {
      return true;
    }

    return false;
  }

  /**
   * Get audio duration estimate
   */
  async getAudioDuration(audioBuffer: Buffer): Promise<number> {
    try {
      const info = await this.getAudioInfo(audioBuffer);
      return info.duration;
    } catch (error) {
      logger.warn('Could not determine audio duration:', error);
      return 0;
    }
  }
}
