// Audio capture manager for Chrome extension

import { EventEmitter } from 'events';

export class AudioCaptureManager extends EventEmitter {
  private mediaRecorder: MediaRecorder | null = null;
  private stream: MediaStream | null = null;
  private isCapturing = false;
  private chunkInterval: NodeJS.Timeout | null = null;
  private audioChunks: Blob[] = [];

  private readonly CHUNK_DURATION = 5000; // 5 seconds
  private readonly AUDIO_CONSTRAINTS = {
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
      sampleRate: 16000,
      channelCount: 1
    },
    video: false
  };

  constructor() {
    super();
  }

  async startCapture(tabId: number): Promise<void> {
    if (this.isCapturing) {
      throw new Error('Audio capture already in progress');
    }

    try {
      // Try tab capture first (most reliable for meeting audio)
      await this.startTabCapture(tabId);
    } catch (tabError) {
      console.warn('Tab capture failed, trying alternative methods:', tabError);
      
      try {
        // Fallback to display media capture
        await this.startDisplayCapture();
      } catch (displayError) {
        console.warn('Display capture failed:', displayError);
        throw new Error('All audio capture methods failed');
      }
    }
  }

  async stopCapture(): Promise<void> {
    if (!this.isCapturing) {
      return;
    }

    this.isCapturing = false;

    // Clear chunk interval
    if (this.chunkInterval) {
      clearInterval(this.chunkInterval);
      this.chunkInterval = null;
    }

    // Stop media recorder
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }

    // Stop all tracks
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }

    this.mediaRecorder = null;
    this.audioChunks = [];

    console.log('Audio capture stopped');
  }

  private async startTabCapture(tabId: number): Promise<void> {
    return new Promise((resolve, reject) => {
      chrome.tabCapture.capture(
        {
          audio: true,
          video: false
        },
        (stream) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }

          if (!stream) {
            reject(new Error('Failed to capture tab audio'));
            return;
          }

          this.setupMediaRecorder(stream);
          resolve();
        }
      );
    });
  }

  private async startDisplayCapture(): Promise<void> {
    // This method requires user interaction, so it's used as a fallback
    // In practice, this would need to be triggered from content script
    throw new Error('Display capture requires user interaction');
  }

  private setupMediaRecorder(stream: MediaStream): void {
    this.stream = stream;

    // Check if the stream has audio tracks
    const audioTracks = stream.getAudioTracks();
    if (audioTracks.length === 0) {
      throw new Error('No audio tracks available in stream');
    }

    // Create MediaRecorder
    const options: MediaRecorderOptions = {
      mimeType: this.getSupportedMimeType(),
      audioBitsPerSecond: 128000
    };

    this.mediaRecorder = new MediaRecorder(stream, options);
    this.setupMediaRecorderEvents();

    // Start recording
    this.mediaRecorder.start();
    this.isCapturing = true;

    // Setup chunking interval
    this.setupChunkInterval();

    console.log('Audio capture started with MediaRecorder');
  }

  private getSupportedMimeType(): string {
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
      'audio/ogg;codecs=opus'
    ];

    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }

    return ''; // Let browser choose
  }

  private setupMediaRecorderEvents(): void {
    if (!this.mediaRecorder) return;

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        this.audioChunks.push(event.data);
      }
    };

    this.mediaRecorder.onstop = () => {
      this.processAudioChunks();
    };

    this.mediaRecorder.onerror = (event) => {
      console.error('MediaRecorder error:', event);
      this.emit('error', new Error('MediaRecorder error'));
    };

    // Handle stream ending
    if (this.stream) {
      this.stream.addEventListener('ended', () => {
        console.log('Audio stream ended');
        this.stopCapture();
      });

      // Monitor audio tracks
      const audioTracks = this.stream.getAudioTracks();
      audioTracks.forEach(track => {
        track.addEventListener('ended', () => {
          console.log('Audio track ended');
          this.stopCapture();
        });
      });
    }
  }

  private setupChunkInterval(): void {
    this.chunkInterval = setInterval(() => {
      if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
        // Stop and restart to create chunks
        this.mediaRecorder.stop();
        
        // Small delay before restarting
        setTimeout(() => {
          if (this.mediaRecorder && this.isCapturing) {
            this.mediaRecorder.start();
          }
        }, 100);
      }
    }, this.CHUNK_DURATION);
  }

  private async processAudioChunks(): Promise<void> {
    if (this.audioChunks.length === 0) {
      return;
    }

    try {
      // Combine chunks into a single blob
      const audioBlob = new Blob(this.audioChunks, { 
        type: this.mediaRecorder?.mimeType || 'audio/webm' 
      });

      // Convert to ArrayBuffer
      const arrayBuffer = await audioBlob.arrayBuffer();

      // Emit audio data
      this.emit('audioData', arrayBuffer);

      // Clear chunks
      this.audioChunks = [];

    } catch (error) {
      console.error('Error processing audio chunks:', error);
      this.emit('error', error);
    }
  }

  // Utility methods
  isRecording(): boolean {
    return this.isCapturing;
  }

  getStreamInfo(): any {
    if (!this.stream) return null;

    const audioTracks = this.stream.getAudioTracks();
    return {
      hasAudio: audioTracks.length > 0,
      audioTracks: audioTracks.map(track => ({
        id: track.id,
        label: track.label,
        enabled: track.enabled,
        muted: track.muted,
        readyState: track.readyState,
        settings: track.getSettings()
      }))
    };
  }

  // Alternative capture methods for different scenarios
  async startMicrophoneCapture(): Promise<void> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia(this.AUDIO_CONSTRAINTS);
      this.setupMediaRecorder(stream);
    } catch (error) {
      throw new Error(`Microphone capture failed: ${(error as Error).message}`);
    }
  }

  async startScreenCapture(): Promise<void> {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        audio: true,
        video: false
      });
      this.setupMediaRecorder(stream);
    } catch (error) {
      throw new Error(`Screen capture failed: ${(error as Error).message}`);
    }
  }

  // Audio processing utilities
  private async convertToWav(audioBuffer: ArrayBuffer): Promise<ArrayBuffer> {
    // This would implement WAV conversion if needed
    // For now, return the original buffer
    return audioBuffer;
  }

  private async resampleAudio(audioBuffer: ArrayBuffer, targetSampleRate: number): Promise<ArrayBuffer> {
    // This would implement audio resampling if needed
    // For now, return the original buffer
    return audioBuffer;
  }
}
