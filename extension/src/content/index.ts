// Content script for AI Meeting Companion

import { 
  ContentScriptMessage, 
  ContentMessageType, 
  MeetingSession,
  TranscriptSegment,
  MeetingAnalysis,
  detectMeetingPlatform,
  isMeetingUrl
} from '@shared';

class ContentScript {
  private sidebarIframe: HTMLIFrameElement | null = null;
  private isInitialized = false;
  private currentSession: MeetingSession | null = null;
  private platformAdapter: PlatformAdapter | null = null;

  constructor() {
    this.initialize();
  }

  private async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Check if this is a meeting page
      if (!isMeetingUrl(window.location.href)) {
        console.log('Not a meeting page, content script inactive');
        return;
      }

      // Detect platform and create adapter
      const platform = detectMeetingPlatform(window.location.href);
      this.platformAdapter = PlatformAdapterFactory.create(platform);

      // Setup message listener
      chrome.runtime.onMessage.addListener(this.handleMessage.bind(this));

      // Wait for page to be fully loaded
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
          this.setupContentScript();
        });
      } else {
        this.setupContentScript();
      }

      this.isInitialized = true;
      console.log('AI Meeting Companion content script initialized');

    } catch (error) {
      console.error('Failed to initialize content script:', error);
    }
  }

  private setupContentScript(): void {
    // Inject styles
    this.injectStyles();

    // Setup platform-specific integrations
    if (this.platformAdapter) {
      this.platformAdapter.setup();
    }

    // Monitor for meeting state changes
    this.monitorMeetingState();
  }

  private handleMessage(
    message: any,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: any) => void
  ): void {
    try {
      switch (message.type) {
        case 'RECORDING_STARTED':
          this.handleRecordingStarted(message.session);
          break;

        case 'RECORDING_STOPPED':
          this.handleRecordingStopped(message.session);
          break;

        case 'TRANSCRIPT_UPDATE':
          this.handleTranscriptUpdate(message.data);
          break;

        case 'ANALYSIS_UPDATE':
          this.handleAnalysisUpdate(message.data);
          break;

        case 'INIT_SIDEBAR':
          this.initializeSidebar();
          break;

        case 'TOGGLE_SIDEBAR':
          this.toggleSidebar();
          break;

        default:
          console.log('Unknown message type:', message.type);
      }

      sendResponse({ success: true });
    } catch (error) {
      console.error('Message handling error:', error);
      sendResponse({ success: false, error: (error as Error).message });
    }
  }

  private handleRecordingStarted(session: MeetingSession): void {
    this.currentSession = session;
    this.initializeSidebar();
    this.showNotification('Recording started', 'AI Meeting Companion is now capturing audio');
  }

  private handleRecordingStopped(session: MeetingSession): void {
    this.currentSession = null;
    this.sendMessageToSidebar({
      type: ContentMessageType.TOGGLE_RECORDING,
      payload: { isRecording: false }
    });
    this.showNotification('Recording stopped', 'Meeting session has ended');
  }

  private handleTranscriptUpdate(transcript: TranscriptSegment): void {
    this.sendMessageToSidebar({
      type: ContentMessageType.UPDATE_TRANSCRIPT,
      payload: transcript
    });
  }

  private handleAnalysisUpdate(analysis: Partial<MeetingAnalysis>): void {
    this.sendMessageToSidebar({
      type: ContentMessageType.UPDATE_ANALYSIS,
      payload: analysis
    });
  }

  private initializeSidebar(): void {
    if (this.sidebarIframe) {
      // Sidebar already exists
      this.sidebarIframe.style.display = 'block';
      return;
    }

    // Create sidebar iframe
    this.sidebarIframe = document.createElement('iframe');
    this.sidebarIframe.id = 'ai-meeting-companion-sidebar';
    this.sidebarIframe.src = chrome.runtime.getURL('sidebar.html');
    this.sidebarIframe.style.cssText = `
      position: fixed !important;
      top: 20px !important;
      right: 20px !important;
      width: 380px !important;
      height: 600px !important;
      border: none !important;
      border-radius: 12px !important;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3) !important;
      z-index: 2147483647 !important;
      background: white !important;
      resize: both !important;
      overflow: hidden !important;
      transition: all 0.3s ease !important;
    `;

    // Add to page
    document.body.appendChild(this.sidebarIframe);

    // Setup iframe communication
    this.setupSidebarCommunication();

    console.log('Sidebar initialized');
  }

  private setupSidebarCommunication(): void {
    if (!this.sidebarIframe) return;

    // Listen for messages from sidebar
    window.addEventListener('message', (event) => {
      if (event.source !== this.sidebarIframe?.contentWindow) return;

      try {
        const message = event.data;
        this.handleSidebarMessage(message);
      } catch (error) {
        console.error('Sidebar message handling error:', error);
      }
    });

    // Send initial data when sidebar loads
    this.sidebarIframe.onload = () => {
      this.sendMessageToSidebar({
        type: ContentMessageType.INIT_SIDEBAR,
        payload: {
          session: this.currentSession,
          platform: detectMeetingPlatform(window.location.href)
        }
      });
    };
  }

  private handleSidebarMessage(message: any): void {
    switch (message.type) {
      case 'CLOSE_SIDEBAR':
        this.closeSidebar();
        break;

      case 'MINIMIZE_SIDEBAR':
        this.minimizeSidebar();
        break;

      case 'REQUEST_RECORDING_TOGGLE':
        this.requestRecordingToggle();
        break;

      default:
        console.log('Unknown sidebar message:', message);
    }
  }

  private sendMessageToSidebar(message: ContentScriptMessage): void {
    if (!this.sidebarIframe?.contentWindow) return;

    try {
      this.sidebarIframe.contentWindow.postMessage(message, '*');
    } catch (error) {
      console.error('Failed to send message to sidebar:', error);
    }
  }

  private toggleSidebar(): void {
    if (!this.sidebarIframe) {
      this.initializeSidebar();
    } else {
      const isVisible = this.sidebarIframe.style.display !== 'none';
      this.sidebarIframe.style.display = isVisible ? 'none' : 'block';
    }
  }

  private closeSidebar(): void {
    if (this.sidebarIframe) {
      this.sidebarIframe.style.display = 'none';
    }
  }

  private minimizeSidebar(): void {
    if (this.sidebarIframe) {
      const isMinimized = this.sidebarIframe.style.height === '40px';
      this.sidebarIframe.style.height = isMinimized ? '600px' : '40px';
      this.sidebarIframe.style.overflow = isMinimized ? 'hidden' : 'visible';
    }
  }

  private requestRecordingToggle(): void {
    chrome.runtime.sendMessage({
      type: 'TOGGLE_RECORDING'
    });
  }

  private monitorMeetingState(): void {
    // Monitor for meeting-specific events
    if (this.platformAdapter) {
      this.platformAdapter.onMeetingJoined(() => {
        console.log('Meeting joined');
      });

      this.platformAdapter.onMeetingLeft(() => {
        console.log('Meeting left');
        this.closeSidebar();
      });

      this.platformAdapter.onParticipantChanged((participants) => {
        console.log('Participants changed:', participants);
      });
    }
  }

  private injectStyles(): void {
    const style = document.createElement('style');
    style.textContent = `
      /* AI Meeting Companion Styles */
      #ai-meeting-companion-sidebar {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
      }
      
      /* Notification styles */
      .amc-notification {
        position: fixed !important;
        top: 20px !important;
        right: 20px !important;
        background: #4CAF50 !important;
        color: white !important;
        padding: 12px 16px !important;
        border-radius: 8px !important;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2) !important;
        z-index: 2147483646 !important;
        font-size: 14px !important;
        max-width: 300px !important;
        animation: amcSlideIn 0.3s ease !important;
      }
      
      @keyframes amcSlideIn {
        from {
          transform: translateX(100%) !important;
          opacity: 0 !important;
        }
        to {
          transform: translateX(0) !important;
          opacity: 1 !important;
        }
      }
      
      .amc-notification.error {
        background: #F44336 !important;
      }
      
      .amc-notification.warning {
        background: #FF9800 !important;
      }
    `;
    
    document.head.appendChild(style);
  }

  private showNotification(title: string, message: string, type: 'success' | 'error' | 'warning' = 'success'): void {
    const notification = document.createElement('div');
    notification.className = `amc-notification ${type}`;
    notification.innerHTML = `
      <div style="font-weight: 600; margin-bottom: 4px;">${title}</div>
      <div style="font-size: 12px; opacity: 0.9;">${message}</div>
    `;

    document.body.appendChild(notification);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 5000);
  }
}

// Platform-specific adapters
abstract class PlatformAdapter {
  abstract setup(): void;
  abstract onMeetingJoined(callback: () => void): void;
  abstract onMeetingLeft(callback: () => void): void;
  abstract onParticipantChanged(callback: (participants: any[]) => void): void;
}

class ZoomAdapter extends PlatformAdapter {
  setup(): void {
    console.log('Zoom adapter setup');
  }

  onMeetingJoined(callback: () => void): void {
    // Zoom-specific meeting join detection
  }

  onMeetingLeft(callback: () => void): void {
    // Zoom-specific meeting leave detection
  }

  onParticipantChanged(callback: (participants: any[]) => void): void {
    // Zoom-specific participant monitoring
  }
}

class GoogleMeetAdapter extends PlatformAdapter {
  setup(): void {
    console.log('Google Meet adapter setup');
  }

  onMeetingJoined(callback: () => void): void {
    // Google Meet-specific meeting join detection
  }

  onMeetingLeft(callback: () => void): void {
    // Google Meet-specific meeting leave detection
  }

  onParticipantChanged(callback: (participants: any[]) => void): void {
    // Google Meet-specific participant monitoring
  }
}

class TeamsAdapter extends PlatformAdapter {
  setup(): void {
    console.log('Teams adapter setup');
  }

  onMeetingJoined(callback: () => void): void {
    // Teams-specific meeting join detection
  }

  onMeetingLeft(callback: () => void): void {
    // Teams-specific meeting leave detection
  }

  onParticipantChanged(callback: (participants: any[]) => void): void {
    // Teams-specific participant monitoring
  }
}

class GenericAdapter extends PlatformAdapter {
  setup(): void {
    console.log('Generic adapter setup');
  }

  onMeetingJoined(callback: () => void): void {
    // Generic meeting detection
  }

  onMeetingLeft(callback: () => void): void {
    // Generic meeting leave detection
  }

  onParticipantChanged(callback: (participants: any[]) => void): void {
    // Generic participant monitoring
  }
}

class PlatformAdapterFactory {
  static create(platform: any): PlatformAdapter {
    switch (platform) {
      case 'zoom':
        return new ZoomAdapter();
      case 'google_meet':
        return new GoogleMeetAdapter();
      case 'microsoft_teams':
        return new TeamsAdapter();
      default:
        return new GenericAdapter();
    }
  }
}

// Initialize content script
new ContentScript();
