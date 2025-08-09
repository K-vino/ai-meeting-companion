// WebSocket manager for real-time communication with server

import { EventEmitter } from 'events';
import { WebSocketMessage, MessageType } from '@shared';

export class WebSocketManager extends EventEmitter {
  private ws: WebSocket | null = null;
  private serverUrl: string = '';
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private connectionTimeout: NodeJS.Timeout | null = null;

  constructor() {
    super();
  }

  async connect(serverUrl: string): Promise<void> {
    if (this.isConnected) {
      await this.disconnect();
    }

    this.serverUrl = serverUrl;
    const wsUrl = serverUrl.replace(/^https?:\/\//, 'ws://').replace(/^http:\/\//, 'ws://');

    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(`${wsUrl}/ws`);
        
        // Connection timeout
        this.connectionTimeout = setTimeout(() => {
          if (this.ws && this.ws.readyState === WebSocket.CONNECTING) {
            this.ws.close();
            reject(new Error('Connection timeout'));
          }
        }, 10000);

        this.ws.onopen = () => {
          if (this.connectionTimeout) {
            clearTimeout(this.connectionTimeout);
            this.connectionTimeout = null;
          }

          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.startHeartbeat();
          this.emit('connected');
          resolve();
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event.data);
        };

        this.ws.onclose = (event) => {
          this.handleDisconnection(event);
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.emit('error', error);
          
          if (!this.isConnected) {
            reject(new Error('WebSocket connection failed'));
          }
        };

      } catch (error) {
        reject(error);
      }
    });
  }

  async disconnect(): Promise<void> {
    this.isConnected = false;
    
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  private handleMessage(data: string): void {
    try {
      const message: WebSocketMessage = JSON.parse(data);
      
      switch (message.type) {
        case MessageType.HEARTBEAT:
          // Respond to heartbeat
          this.sendMessage({
            type: MessageType.HEARTBEAT,
            payload: { timestamp: new Date() },
            timestamp: new Date()
          });
          break;

        default:
          this.emit('message', message);
      }
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
    }
  }

  private handleDisconnection(event: CloseEvent): void {
    this.isConnected = false;
    
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    this.emit('disconnected', event);

    // Attempt reconnection if not intentionally closed
    if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
      this.attemptReconnection();
    }
  }

  private async attemptReconnection(): Promise<void> {
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    console.log(`Attempting reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`);

    setTimeout(async () => {
      try {
        await this.connect(this.serverUrl);
        console.log('Reconnection successful');
      } catch (error) {
        console.error('Reconnection failed:', error);
        
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          console.error('Max reconnection attempts reached');
          this.emit('reconnectionFailed');
        }
      }
    }, delay);
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.isConnected) {
        this.sendMessage({
          type: MessageType.HEARTBEAT,
          payload: { timestamp: new Date() },
          timestamp: new Date()
        });
      }
    }, 30000); // 30 seconds
  }

  private sendMessage(message: WebSocketMessage): void {
    if (!this.isConnected || !this.ws) {
      throw new Error('WebSocket not connected');
    }

    try {
      this.ws.send(JSON.stringify(message));
    } catch (error) {
      console.error('Failed to send WebSocket message:', error);
      throw error;
    }
  }

  // Public methods for sending specific message types
  async joinSession(sessionId: string): Promise<void> {
    this.sendMessage({
      type: MessageType.JOIN_SESSION,
      payload: { sessionId },
      timestamp: new Date(),
      sessionId
    });
  }

  async leaveSession(sessionId: string): Promise<void> {
    this.sendMessage({
      type: MessageType.LEAVE_SESSION,
      payload: { sessionId },
      timestamp: new Date(),
      sessionId
    });
  }

  async sendAudioData(sessionId: string, audioData: ArrayBuffer): Promise<void> {
    // Convert ArrayBuffer to Base64 for JSON transmission
    const base64Data = this.arrayBufferToBase64(audioData);
    
    this.sendMessage({
      type: MessageType.AUDIO_CHUNK,
      payload: {
        sessionId,
        audioData: base64Data,
        timestamp: new Date()
      },
      timestamp: new Date(),
      sessionId
    });
  }

  async requestAnalysis(sessionId: string, analysisTypes: string[]): Promise<void> {
    this.sendMessage({
      type: MessageType.REQUEST_ANALYSIS,
      payload: {
        sessionId,
        analysisTypes
      },
      timestamp: new Date(),
      sessionId
    });
  }

  // Utility methods
  isConnectedToServer(): boolean {
    return this.isConnected;
  }

  getConnectionState(): string {
    if (!this.ws) return 'disconnected';
    
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING:
        return 'connecting';
      case WebSocket.OPEN:
        return 'connected';
      case WebSocket.CLOSING:
        return 'closing';
      case WebSocket.CLOSED:
        return 'closed';
      default:
        return 'unknown';
    }
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  // Event handler helpers
  onConnected(callback: () => void): void {
    this.on('connected', callback);
  }

  onDisconnected(callback: (event: CloseEvent) => void): void {
    this.on('disconnected', callback);
  }

  onMessage(callback: (message: WebSocketMessage) => void): void {
    this.on('message', callback);
  }

  onError(callback: (error: Event) => void): void {
    this.on('error', callback);
  }

  onReconnectionFailed(callback: () => void): void {
    this.on('reconnectionFailed', callback);
  }
}
