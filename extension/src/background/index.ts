// Background service worker for AI Meeting Companion

import { 
  ExtensionState, 
  MeetingSession, 
  SessionStatus, 
  MeetingPlatform,
  generateSessionId,
  detectMeetingPlatform,
  isMeetingUrl
} from '@shared';
import { AudioCaptureManager } from './audio-capture';
import { WebSocketManager } from './websocket';
import { StorageManager } from './storage';

class BackgroundService {
  private audioCapture: AudioCaptureManager;
  private websocket: WebSocketManager;
  private storage: StorageManager;
  private currentSession: MeetingSession | null = null;
  private isRecording = false;

  constructor() {
    this.audioCapture = new AudioCaptureManager();
    this.websocket = new WebSocketManager();
    this.storage = new StorageManager();
    
    this.setupEventListeners();
    this.initializeExtension();
  }

  private setupEventListeners(): void {
    // Extension installation/startup
    chrome.runtime.onInstalled.addListener(this.handleInstalled.bind(this));
    chrome.runtime.onStartup.addListener(this.handleStartup.bind(this));

    // Message handling
    chrome.runtime.onMessage.addListener(this.handleMessage.bind(this));

    // Tab events
    chrome.tabs.onActivated.addListener(this.handleTabActivated.bind(this));
    chrome.tabs.onUpdated.addListener(this.handleTabUpdated.bind(this));
    chrome.tabs.onRemoved.addListener(this.handleTabRemoved.bind(this));

    // Audio capture events
    this.audioCapture.on('audioData', this.handleAudioData.bind(this));
    this.audioCapture.on('error', this.handleAudioError.bind(this));

    // WebSocket events
    this.websocket.on('connected', this.handleWebSocketConnected.bind(this));
    this.websocket.on('disconnected', this.handleWebSocketDisconnected.bind(this));
    this.websocket.on('message', this.handleWebSocketMessage.bind(this));
  }

  private async initializeExtension(): Promise<void> {
    try {
      // Load saved state
      const state = await this.storage.getExtensionState();
      
      // Initialize WebSocket connection if server URL is configured
      if (state.serverUrl) {
        await this.websocket.connect(state.serverUrl);
      }

      console.log('AI Meeting Companion initialized');
    } catch (error) {
      console.error('Failed to initialize extension:', error);
    }
  }

  private handleInstalled(details: chrome.runtime.InstalledDetails): void {
    console.log('Extension installed:', details.reason);
    
    if (details.reason === 'install') {
      // First time installation
      this.showWelcomeNotification();
    }
  }

  private handleStartup(): void {
    console.log('Extension started');
    this.initializeExtension();
  }

  private async handleMessage(
    message: any,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: any) => void
  ): Promise<void> {
    try {
      switch (message.type) {
        case 'START_RECORDING':
          await this.startRecording(message.tabId);
          sendResponse({ success: true });
          break;

        case 'STOP_RECORDING':
          await this.stopRecording();
          sendResponse({ success: true });
          break;

        case 'GET_STATE':
          const state = await this.getExtensionState();
          sendResponse({ success: true, data: state });
          break;

        case 'UPDATE_SETTINGS':
          await this.updateSettings(message.settings);
          sendResponse({ success: true });
          break;

        case 'CONNECT_SERVER':
          await this.connectToServer(message.serverUrl);
          sendResponse({ success: true });
          break;

        default:
          sendResponse({ success: false, error: 'Unknown message type' });
      }
    } catch (error) {
      console.error('Message handling error:', error);
      sendResponse({ success: false, error: (error as Error).message });
    }
  }

  private async handleTabActivated(activeInfo: chrome.tabs.TabActiveInfo): Promise<void> {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    await this.checkMeetingTab(tab);
  }

  private async handleTabUpdated(
    tabId: number,
    changeInfo: chrome.tabs.TabChangeInfo,
    tab: chrome.tabs.Tab
  ): Promise<void> {
    if (changeInfo.status === 'complete' && tab.url) {
      await this.checkMeetingTab(tab);
    }
  }

  private async handleTabRemoved(tabId: number): Promise<void> {
    if (this.currentSession && this.isRecording) {
      // Check if the removed tab was the meeting tab
      const state = await this.storage.getExtensionState();
      if (state.currentSession?.id === this.currentSession.id) {
        await this.stopRecording();
      }
    }
  }

  private async checkMeetingTab(tab: chrome.tabs.Tab): Promise<void> {
    if (!tab.url) return;

    const isMeeting = isMeetingUrl(tab.url);
    const platform = detectMeetingPlatform(tab.url);

    if (isMeeting) {
      // Inject content script if not already injected
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id! },
          files: ['content.js']
        });
      } catch (error) {
        // Content script might already be injected
        console.log('Content script injection skipped:', error);
      }

      // Update badge to indicate meeting detected
      await chrome.action.setBadgeText({
        text: '●',
        tabId: tab.id
      });
      
      await chrome.action.setBadgeBackgroundColor({
        color: '#4CAF50',
        tabId: tab.id
      });
    } else {
      // Clear badge for non-meeting tabs
      await chrome.action.setBadgeText({
        text: '',
        tabId: tab.id
      });
    }
  }

  private async startRecording(tabId: number): Promise<void> {
    if (this.isRecording) {
      throw new Error('Recording already in progress');
    }

    const tab = await chrome.tabs.get(tabId);
    if (!tab.url || !isMeetingUrl(tab.url)) {
      throw new Error('Not a meeting tab');
    }

    // Create new session
    this.currentSession = {
      id: generateSessionId(),
      platform: detectMeetingPlatform(tab.url),
      startTime: new Date(),
      participants: [],
      status: SessionStatus.ACTIVE,
      settings: (await this.storage.getExtensionState()).settings
    };

    // Start audio capture
    await this.audioCapture.startCapture(tabId);
    this.isRecording = true;

    // Update storage
    await this.storage.updateExtensionState({
      isRecording: true,
      currentSession: this.currentSession
    });

    // Notify content script
    await this.notifyContentScript(tabId, {
      type: 'RECORDING_STARTED',
      session: this.currentSession
    });

    // Update badge
    await chrome.action.setBadgeText({
      text: 'REC',
      tabId: tabId
    });
    
    await chrome.action.setBadgeBackgroundColor({
      color: '#F44336',
      tabId: tabId
    });

    console.log('Recording started for session:', this.currentSession.id);
  }

  private async stopRecording(): Promise<void> {
    if (!this.isRecording || !this.currentSession) {
      return;
    }

    // Stop audio capture
    await this.audioCapture.stopCapture();
    this.isRecording = false;

    // Update session
    this.currentSession.endTime = new Date();
    this.currentSession.status = SessionStatus.ENDED;

    // Update storage
    await this.storage.updateExtensionState({
      isRecording: false,
      currentSession: null
    });

    // Save session to history
    await this.storage.saveSession(this.currentSession);

    // Notify content script
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs[0]) {
      await this.notifyContentScript(tabs[0].id!, {
        type: 'RECORDING_STOPPED',
        session: this.currentSession
      });

      // Update badge
      await chrome.action.setBadgeText({
        text: '●',
        tabId: tabs[0].id
      });
      
      await chrome.action.setBadgeBackgroundColor({
        color: '#4CAF50',
        tabId: tabs[0].id
      });
    }

    console.log('Recording stopped for session:', this.currentSession.id);
    this.currentSession = null;
  }

  private async handleAudioData(data: ArrayBuffer): Promise<void> {
    if (!this.currentSession) return;

    try {
      // Send audio data to server via WebSocket
      await this.websocket.sendAudioData(this.currentSession.id, data);
    } catch (error) {
      console.error('Failed to send audio data:', error);
    }
  }

  private handleAudioError(error: Error): void {
    console.error('Audio capture error:', error);
    this.showErrorNotification('Audio capture failed: ' + error.message);
  }

  private handleWebSocketConnected(): void {
    console.log('Connected to server');
  }

  private handleWebSocketDisconnected(): void {
    console.log('Disconnected from server');
  }

  private async handleWebSocketMessage(message: any): Promise<void> {
    try {
      switch (message.type) {
        case 'TRANSCRIPT_UPDATE':
          await this.handleTranscriptUpdate(message);
          break;

        case 'ANALYSIS_UPDATE':
          await this.handleAnalysisUpdate(message);
          break;

        default:
          console.log('Unknown WebSocket message:', message);
      }
    } catch (error) {
      console.error('WebSocket message handling error:', error);
    }
  }

  private async handleTranscriptUpdate(message: any): Promise<void> {
    // Forward to content script
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs[0]) {
      await this.notifyContentScript(tabs[0].id!, {
        type: 'TRANSCRIPT_UPDATE',
        data: message.data
      });
    }
  }

  private async handleAnalysisUpdate(message: any): Promise<void> {
    // Forward to content script
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs[0]) {
      await this.notifyContentScript(tabs[0].id!, {
        type: 'ANALYSIS_UPDATE',
        data: message.data
      });
    }
  }

  private async notifyContentScript(tabId: number, message: any): Promise<void> {
    try {
      await chrome.tabs.sendMessage(tabId, message);
    } catch (error) {
      console.error('Failed to send message to content script:', error);
    }
  }

  private async getExtensionState(): Promise<ExtensionState> {
    return await this.storage.getExtensionState();
  }

  private async updateSettings(settings: any): Promise<void> {
    await this.storage.updateExtensionState({ settings });
  }

  private async connectToServer(serverUrl: string): Promise<void> {
    await this.websocket.connect(serverUrl);
    await this.storage.updateExtensionState({ serverUrl });
  }

  private showWelcomeNotification(): void {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'AI Meeting Companion',
      message: 'Welcome! Click the extension icon to get started.'
    });
  }

  private showErrorNotification(message: string): void {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'AI Meeting Companion Error',
      message: message
    });
  }
}

// Initialize the background service
new BackgroundService();
