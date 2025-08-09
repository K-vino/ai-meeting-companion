// Storage manager for Chrome extension

import { 
  ExtensionState, 
  MeetingSession, 
  SessionSettings,
  PrivacyMode,
  SessionStatus 
} from '@shared';

export class StorageManager {
  private readonly STORAGE_KEYS = {
    EXTENSION_STATE: 'extensionState',
    SESSIONS: 'sessions',
    SETTINGS: 'settings',
    USER_PREFERENCES: 'userPreferences'
  };

  private readonly DEFAULT_SETTINGS: SessionSettings = {
    autoTranscribe: true,
    realTimeAnalysis: true,
    saveTranscripts: true,
    detectJargon: true,
    sentimentAnalysis: true,
    participantConsent: true,
    language: 'en-US',
    privacyMode: PrivacyMode.FULL
  };

  private readonly DEFAULT_STATE: ExtensionState = {
    isActive: false,
    currentSession: undefined,
    isRecording: false,
    serverUrl: 'http://localhost:3000',
    settings: this.DEFAULT_SETTINGS
  };

  constructor() {
    this.initializeStorage();
  }

  private async initializeStorage(): Promise<void> {
    try {
      // Check if this is first run
      const existingState = await this.getStoredData(this.STORAGE_KEYS.EXTENSION_STATE);
      
      if (!existingState) {
        // First run - initialize with defaults
        await this.setStoredData(this.STORAGE_KEYS.EXTENSION_STATE, this.DEFAULT_STATE);
        await this.setStoredData(this.STORAGE_KEYS.SESSIONS, []);
        await this.setStoredData(this.STORAGE_KEYS.SETTINGS, this.DEFAULT_SETTINGS);
        
        console.log('Storage initialized with default values');
      }
    } catch (error) {
      console.error('Failed to initialize storage:', error);
    }
  }

  // Extension state management
  async getExtensionState(): Promise<ExtensionState> {
    try {
      const state = await this.getStoredData(this.STORAGE_KEYS.EXTENSION_STATE);
      return state || this.DEFAULT_STATE;
    } catch (error) {
      console.error('Failed to get extension state:', error);
      return this.DEFAULT_STATE;
    }
  }

  async updateExtensionState(updates: Partial<ExtensionState>): Promise<void> {
    try {
      const currentState = await this.getExtensionState();
      const newState = { ...currentState, ...updates };
      await this.setStoredData(this.STORAGE_KEYS.EXTENSION_STATE, newState);
    } catch (error) {
      console.error('Failed to update extension state:', error);
      throw error;
    }
  }

  async resetExtensionState(): Promise<void> {
    try {
      await this.setStoredData(this.STORAGE_KEYS.EXTENSION_STATE, this.DEFAULT_STATE);
    } catch (error) {
      console.error('Failed to reset extension state:', error);
      throw error;
    }
  }

  // Session management
  async saveSession(session: MeetingSession): Promise<void> {
    try {
      const sessions = await this.getSessions();
      sessions.push(session);
      
      // Keep only last 100 sessions to prevent storage bloat
      const trimmedSessions = sessions.slice(-100);
      
      await this.setStoredData(this.STORAGE_KEYS.SESSIONS, trimmedSessions);
    } catch (error) {
      console.error('Failed to save session:', error);
      throw error;
    }
  }

  async getSessions(): Promise<MeetingSession[]> {
    try {
      const sessions = await this.getStoredData(this.STORAGE_KEYS.SESSIONS);
      return sessions || [];
    } catch (error) {
      console.error('Failed to get sessions:', error);
      return [];
    }
  }

  async getSession(sessionId: string): Promise<MeetingSession | null> {
    try {
      const sessions = await this.getSessions();
      return sessions.find(session => session.id === sessionId) || null;
    } catch (error) {
      console.error('Failed to get session:', error);
      return null;
    }
  }

  async deleteSession(sessionId: string): Promise<void> {
    try {
      const sessions = await this.getSessions();
      const filteredSessions = sessions.filter(session => session.id !== sessionId);
      await this.setStoredData(this.STORAGE_KEYS.SESSIONS, filteredSessions);
    } catch (error) {
      console.error('Failed to delete session:', error);
      throw error;
    }
  }

  async clearSessions(): Promise<void> {
    try {
      await this.setStoredData(this.STORAGE_KEYS.SESSIONS, []);
    } catch (error) {
      console.error('Failed to clear sessions:', error);
      throw error;
    }
  }

  // Settings management
  async getSettings(): Promise<SessionSettings> {
    try {
      const settings = await this.getStoredData(this.STORAGE_KEYS.SETTINGS);
      return { ...this.DEFAULT_SETTINGS, ...settings };
    } catch (error) {
      console.error('Failed to get settings:', error);
      return this.DEFAULT_SETTINGS;
    }
  }

  async updateSettings(updates: Partial<SessionSettings>): Promise<void> {
    try {
      const currentSettings = await this.getSettings();
      const newSettings = { ...currentSettings, ...updates };
      await this.setStoredData(this.STORAGE_KEYS.SETTINGS, newSettings);
      
      // Also update extension state
      await this.updateExtensionState({ settings: newSettings });
    } catch (error) {
      console.error('Failed to update settings:', error);
      throw error;
    }
  }

  async resetSettings(): Promise<void> {
    try {
      await this.setStoredData(this.STORAGE_KEYS.SETTINGS, this.DEFAULT_SETTINGS);
      await this.updateExtensionState({ settings: this.DEFAULT_SETTINGS });
    } catch (error) {
      console.error('Failed to reset settings:', error);
      throw error;
    }
  }

  // User preferences
  async getUserPreferences(): Promise<any> {
    try {
      const preferences = await this.getStoredData(this.STORAGE_KEYS.USER_PREFERENCES);
      return preferences || {};
    } catch (error) {
      console.error('Failed to get user preferences:', error);
      return {};
    }
  }

  async updateUserPreferences(updates: any): Promise<void> {
    try {
      const currentPreferences = await this.getUserPreferences();
      const newPreferences = { ...currentPreferences, ...updates };
      await this.setStoredData(this.STORAGE_KEYS.USER_PREFERENCES, newPreferences);
    } catch (error) {
      console.error('Failed to update user preferences:', error);
      throw error;
    }
  }

  // Storage statistics
  async getStorageStats(): Promise<any> {
    try {
      const usage = await chrome.storage.local.getBytesInUse();
      const sessions = await this.getSessions();
      
      return {
        totalBytes: usage,
        sessionCount: sessions.length,
        activeSessions: sessions.filter(s => s.status === SessionStatus.ACTIVE).length,
        oldestSession: sessions.length > 0 ? sessions[0].startTime : null,
        newestSession: sessions.length > 0 ? sessions[sessions.length - 1].startTime : null
      };
    } catch (error) {
      console.error('Failed to get storage stats:', error);
      return null;
    }
  }

  // Data export/import
  async exportData(): Promise<any> {
    try {
      const state = await this.getExtensionState();
      const sessions = await this.getSessions();
      const settings = await this.getSettings();
      const preferences = await this.getUserPreferences();

      return {
        version: '1.0.0',
        exportDate: new Date().toISOString(),
        data: {
          state,
          sessions,
          settings,
          preferences
        }
      };
    } catch (error) {
      console.error('Failed to export data:', error);
      throw error;
    }
  }

  async importData(data: any): Promise<void> {
    try {
      if (!data || !data.data) {
        throw new Error('Invalid import data format');
      }

      const { state, sessions, settings, preferences } = data.data;

      if (state) {
        await this.setStoredData(this.STORAGE_KEYS.EXTENSION_STATE, state);
      }

      if (sessions) {
        await this.setStoredData(this.STORAGE_KEYS.SESSIONS, sessions);
      }

      if (settings) {
        await this.setStoredData(this.STORAGE_KEYS.SETTINGS, settings);
      }

      if (preferences) {
        await this.setStoredData(this.STORAGE_KEYS.USER_PREFERENCES, preferences);
      }

      console.log('Data import completed successfully');
    } catch (error) {
      console.error('Failed to import data:', error);
      throw error;
    }
  }

  // Privacy and cleanup
  async clearAllData(): Promise<void> {
    try {
      await chrome.storage.local.clear();
      await this.initializeStorage();
      console.log('All data cleared and storage reinitialized');
    } catch (error) {
      console.error('Failed to clear all data:', error);
      throw error;
    }
  }

  async cleanupOldSessions(daysOld: number = 30): Promise<void> {
    try {
      const sessions = await this.getSessions();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const recentSessions = sessions.filter(session => 
        new Date(session.startTime) > cutoffDate
      );

      await this.setStoredData(this.STORAGE_KEYS.SESSIONS, recentSessions);
      
      console.log(`Cleaned up ${sessions.length - recentSessions.length} old sessions`);
    } catch (error) {
      console.error('Failed to cleanup old sessions:', error);
      throw error;
    }
  }

  // Low-level storage operations
  private async getStoredData(key: string): Promise<any> {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get([key], (result) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(result[key]);
        }
      });
    });
  }

  private async setStoredData(key: string, value: any): Promise<void> {
    return new Promise((resolve, reject) => {
      chrome.storage.local.set({ [key]: value }, () => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve();
        }
      });
    });
  }

  private async removeStoredData(key: string): Promise<void> {
    return new Promise((resolve, reject) => {
      chrome.storage.local.remove([key], () => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve();
        }
      });
    });
  }
}
