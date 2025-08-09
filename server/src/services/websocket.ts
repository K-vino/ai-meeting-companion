// WebSocket service for real-time communication

import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import { logger } from '../utils/logger';
import { config } from '../config';
import { 
  WebSocketMessage, 
  MessageType,
  base64ToArrayBuffer 
} from '@ai-meeting-companion/shared';
import { TranscriptionService } from './transcription';
import { AIAnalysisService } from './aiAnalysis';

interface ExtendedWebSocket extends WebSocket {
  sessionId?: string;
  clientId: string;
  isAlive: boolean;
  lastHeartbeat: Date;
}

export class WebSocketManager {
  private wss: WebSocketServer;
  private clients: Map<string, ExtendedWebSocket> = new Map();
  private sessionClients: Map<string, Set<string>> = new Map();
  private heartbeatInterval: NodeJS.Timeout;
  private transcriptionService: TranscriptionService;
  private analysisService: AIAnalysisService;

  constructor(wss: WebSocketServer) {
    this.wss = wss;
    this.transcriptionService = new TranscriptionService();
    this.analysisService = new AIAnalysisService();
    
    this.setupWebSocketServer();
    this.startHeartbeat();
  }

  private setupWebSocketServer(): void {
    this.wss.on('connection', (ws: ExtendedWebSocket, request: IncomingMessage) => {
      this.handleConnection(ws, request);
    });

    this.wss.on('error', (error) => {
      logger.error('WebSocket server error:', error);
    });

    logger.info('WebSocket server initialized');
  }

  private handleConnection(ws: ExtendedWebSocket, request: IncomingMessage): void {
    const clientId = this.generateClientId();
    ws.clientId = clientId;
    ws.isAlive = true;
    ws.lastHeartbeat = new Date();

    this.clients.set(clientId, ws);

    logger.info('WebSocket client connected', {
      clientId,
      ip: request.socket.remoteAddress,
      userAgent: request.headers['user-agent']
    });

    // Setup message handler
    ws.on('message', (data) => {
      this.handleMessage(ws, data);
    });

    // Setup close handler
    ws.on('close', (code, reason) => {
      this.handleDisconnection(ws, code, reason);
    });

    // Setup error handler
    ws.on('error', (error) => {
      logger.error('WebSocket client error:', error);
    });

    // Setup pong handler for heartbeat
    ws.on('pong', () => {
      ws.isAlive = true;
      ws.lastHeartbeat = new Date();
    });

    // Send welcome message
    this.sendMessage(ws, {
      type: MessageType.SESSION_JOINED,
      payload: { clientId },
      timestamp: new Date()
    });
  }

  private async handleMessage(ws: ExtendedWebSocket, data: any): Promise<void> {
    try {
      const message: WebSocketMessage = JSON.parse(data.toString());
      
      logger.debug('WebSocket message received', {
        clientId: ws.clientId,
        type: message.type,
        sessionId: message.sessionId
      });

      switch (message.type) {
        case MessageType.JOIN_SESSION:
          await this.handleJoinSession(ws, message);
          break;

        case MessageType.LEAVE_SESSION:
          await this.handleLeaveSession(ws, message);
          break;

        case MessageType.AUDIO_CHUNK:
          await this.handleAudioChunk(ws, message);
          break;

        case MessageType.REQUEST_ANALYSIS:
          await this.handleAnalysisRequest(ws, message);
          break;

        case MessageType.HEARTBEAT:
          this.handleHeartbeat(ws, message);
          break;

        default:
          logger.warn('Unknown WebSocket message type:', message.type);
      }

    } catch (error) {
      logger.error('WebSocket message handling error:', error);
      this.sendError(ws, 'Invalid message format');
    }
  }

  private async handleJoinSession(ws: ExtendedWebSocket, message: WebSocketMessage): Promise<void> {
    const { sessionId } = message.payload;
    
    if (!sessionId) {
      this.sendError(ws, 'Session ID required');
      return;
    }

    // Leave previous session if any
    if (ws.sessionId) {
      await this.handleLeaveSession(ws, {
        type: MessageType.LEAVE_SESSION,
        payload: { sessionId: ws.sessionId },
        timestamp: new Date()
      });
    }

    // Join new session
    ws.sessionId = sessionId;
    
    if (!this.sessionClients.has(sessionId)) {
      this.sessionClients.set(sessionId, new Set());
    }
    
    this.sessionClients.get(sessionId)!.add(ws.clientId);

    logger.info('Client joined session', {
      clientId: ws.clientId,
      sessionId
    });

    this.sendMessage(ws, {
      type: MessageType.SESSION_JOINED,
      payload: { sessionId },
      timestamp: new Date(),
      sessionId
    });
  }

  private async handleLeaveSession(ws: ExtendedWebSocket, message: WebSocketMessage): Promise<void> {
    const sessionId = ws.sessionId || message.payload.sessionId;
    
    if (!sessionId) {
      return;
    }

    // Remove from session
    const sessionClients = this.sessionClients.get(sessionId);
    if (sessionClients) {
      sessionClients.delete(ws.clientId);
      
      if (sessionClients.size === 0) {
        this.sessionClients.delete(sessionId);
      }
    }

    ws.sessionId = undefined;

    logger.info('Client left session', {
      clientId: ws.clientId,
      sessionId
    });

    this.sendMessage(ws, {
      type: MessageType.SESSION_LEFT,
      payload: { sessionId },
      timestamp: new Date(),
      sessionId
    });
  }

  private async handleAudioChunk(ws: ExtendedWebSocket, message: WebSocketMessage): Promise<void> {
    if (!ws.sessionId) {
      this.sendError(ws, 'Not in a session');
      return;
    }

    try {
      const { audioData } = message.payload;
      
      // Convert base64 to buffer
      const audioBuffer = Buffer.from(base64ToArrayBuffer(audioData));
      
      // Transcribe audio
      const segment = await this.transcriptionService.transcribeAudio(
        audioBuffer,
        ws.sessionId,
        {
          timestamp: new Date()
        }
      );

      // Broadcast transcript to all clients in session
      this.broadcastToSession(ws.sessionId, {
        type: MessageType.TRANSCRIPT_UPDATE,
        payload: segment,
        timestamp: new Date(),
        sessionId: ws.sessionId
      });

      // Trigger analysis if enabled
      const analysis = await this.analysisService.analyzeTranscript(
        ws.sessionId,
        [segment]
      );

      // Broadcast analysis to all clients in session
      this.broadcastToSession(ws.sessionId, {
        type: MessageType.ANALYSIS_UPDATE,
        payload: analysis,
        timestamp: new Date(),
        sessionId: ws.sessionId
      });

    } catch (error) {
      logger.error('Audio chunk processing error:', error);
      this.sendError(ws, 'Audio processing failed');
    }
  }

  private async handleAnalysisRequest(ws: ExtendedWebSocket, message: WebSocketMessage): Promise<void> {
    if (!ws.sessionId) {
      this.sendError(ws, 'Not in a session');
      return;
    }

    try {
      const { analysisTypes } = message.payload;
      
      // TODO: Get transcript segments for session
      const segments: any[] = []; // Placeholder
      
      const analysis = await this.analysisService.analyzeTranscript(
        ws.sessionId,
        segments,
        analysisTypes
      );

      this.sendMessage(ws, {
        type: MessageType.ANALYSIS_UPDATE,
        payload: analysis,
        timestamp: new Date(),
        sessionId: ws.sessionId
      });

    } catch (error) {
      logger.error('Analysis request error:', error);
      this.sendError(ws, 'Analysis failed');
    }
  }

  private handleHeartbeat(ws: ExtendedWebSocket, message: WebSocketMessage): void {
    ws.isAlive = true;
    ws.lastHeartbeat = new Date();
    
    // Echo heartbeat back
    this.sendMessage(ws, {
      type: MessageType.HEARTBEAT,
      payload: { timestamp: new Date() },
      timestamp: new Date()
    });
  }

  private handleDisconnection(ws: ExtendedWebSocket, code: number, reason: Buffer): void {
    logger.info('WebSocket client disconnected', {
      clientId: ws.clientId,
      sessionId: ws.sessionId,
      code,
      reason: reason.toString()
    });

    // Remove from session
    if (ws.sessionId) {
      const sessionClients = this.sessionClients.get(ws.sessionId);
      if (sessionClients) {
        sessionClients.delete(ws.clientId);
        
        if (sessionClients.size === 0) {
          this.sessionClients.delete(ws.sessionId);
        }
      }
    }

    // Remove from clients
    this.clients.delete(ws.clientId);
  }

  private sendMessage(ws: ExtendedWebSocket, message: WebSocketMessage): void {
    if (ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify(message));
      } catch (error) {
        logger.error('Failed to send WebSocket message:', error);
      }
    }
  }

  private sendError(ws: ExtendedWebSocket, errorMessage: string): void {
    this.sendMessage(ws, {
      type: MessageType.ERROR,
      payload: { error: errorMessage },
      timestamp: new Date()
    });
  }

  private broadcastToSession(sessionId: string, message: WebSocketMessage): void {
    const sessionClients = this.sessionClients.get(sessionId);
    
    if (!sessionClients) {
      return;
    }

    sessionClients.forEach(clientId => {
      const client = this.clients.get(clientId);
      if (client) {
        this.sendMessage(client, message);
      }
    });
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      this.clients.forEach((ws) => {
        if (!ws.isAlive) {
          logger.info('Terminating inactive WebSocket client', {
            clientId: ws.clientId
          });
          ws.terminate();
          return;
        }

        ws.isAlive = false;
        ws.ping();
      });
    }, config.websocket.heartbeatInterval);
  }

  private generateClientId(): string {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  public async close(): Promise<void> {
    logger.info('Closing WebSocket server...');
    
    // Clear heartbeat interval
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    // Close all client connections
    this.clients.forEach((ws) => {
      ws.close(1000, 'Server shutting down');
    });

    // Close server
    this.wss.close();
    
    logger.info('WebSocket server closed');
  }

  // Statistics
  public getStats() {
    return {
      totalClients: this.clients.size,
      activeSessions: this.sessionClients.size,
      clientsPerSession: Array.from(this.sessionClients.entries()).map(([sessionId, clients]) => ({
        sessionId,
        clientCount: clients.size
      }))
    };
  }
}
