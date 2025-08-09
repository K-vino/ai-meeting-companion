// Hook for managing extension state

import { useState, useEffect, useCallback } from 'react';
import { ExtensionState, SessionSettings } from '@shared';

interface ExtensionStateHook {
  state: ExtensionState;
  isLoading: boolean;
  error: string | null;
  actions: {
    startRecording: (tabId: number) => Promise<void>;
    stopRecording: () => Promise<void>;
    updateSettings: (settings: Partial<SessionSettings>) => Promise<void>;
    updateServerUrl: (url: string) => Promise<void>;
    refreshState: () => Promise<void>;
  };
}

export const useExtensionState = (): ExtensionStateHook => {
  const [state, setState] = useState<ExtensionState>({
    isActive: false,
    isRecording: false,
    serverUrl: 'http://localhost:3000',
    settings: {
      autoTranscribe: true,
      realTimeAnalysis: true,
      saveTranscripts: true,
      detectJargon: true,
      sentimentAnalysis: true,
      participantConsent: true,
      language: 'en-US',
      privacyMode: 'full' as any
    }
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load initial state
  const loadState = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await chrome.runtime.sendMessage({
        type: 'GET_STATE'
      });
      
      if (response.success) {
        setState(response.data);
      } else {
        throw new Error(response.error || 'Failed to load state');
      }
    } catch (err) {
      console.error('Failed to load extension state:', err);
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Start recording
  const startRecording = useCallback(async (tabId: number) => {
    try {
      setError(null);
      
      const response = await chrome.runtime.sendMessage({
        type: 'START_RECORDING',
        tabId
      });
      
      if (response.success) {
        await loadState(); // Refresh state
      } else {
        throw new Error(response.error || 'Failed to start recording');
      }
    } catch (err) {
      console.error('Failed to start recording:', err);
      setError((err as Error).message);
      throw err;
    }
  }, [loadState]);

  // Stop recording
  const stopRecording = useCallback(async () => {
    try {
      setError(null);
      
      const response = await chrome.runtime.sendMessage({
        type: 'STOP_RECORDING'
      });
      
      if (response.success) {
        await loadState(); // Refresh state
      } else {
        throw new Error(response.error || 'Failed to stop recording');
      }
    } catch (err) {
      console.error('Failed to stop recording:', err);
      setError((err as Error).message);
      throw err;
    }
  }, [loadState]);

  // Update settings
  const updateSettings = useCallback(async (settings: Partial<SessionSettings>) => {
    try {
      setError(null);
      
      const response = await chrome.runtime.sendMessage({
        type: 'UPDATE_SETTINGS',
        settings
      });
      
      if (response.success) {
        setState(prev => ({
          ...prev,
          settings: { ...prev.settings, ...settings }
        }));
      } else {
        throw new Error(response.error || 'Failed to update settings');
      }
    } catch (err) {
      console.error('Failed to update settings:', err);
      setError((err as Error).message);
      throw err;
    }
  }, []);

  // Update server URL
  const updateServerUrl = useCallback(async (url: string) => {
    try {
      setError(null);
      
      const response = await chrome.runtime.sendMessage({
        type: 'CONNECT_SERVER',
        serverUrl: url
      });
      
      if (response.success) {
        setState(prev => ({ ...prev, serverUrl: url }));
      } else {
        throw new Error(response.error || 'Failed to connect to server');
      }
    } catch (err) {
      console.error('Failed to update server URL:', err);
      setError((err as Error).message);
      throw err;
    }
  }, []);

  // Refresh state
  const refreshState = useCallback(async () => {
    await loadState();
  }, [loadState]);

  // Load state on mount
  useEffect(() => {
    loadState();
  }, [loadState]);

  // Listen for state changes from background script
  useEffect(() => {
    const handleMessage = (message: any, sender: chrome.runtime.MessageSender) => {
      if (sender.id !== chrome.runtime.id) return;
      
      switch (message.type) {
        case 'STATE_UPDATED':
          setState(message.state);
          break;
        case 'RECORDING_STARTED':
          setState(prev => ({ 
            ...prev, 
            isRecording: true, 
            currentSession: message.session 
          }));
          break;
        case 'RECORDING_STOPPED':
          setState(prev => ({ 
            ...prev, 
            isRecording: false, 
            currentSession: undefined 
          }));
          break;
      }
    };

    chrome.runtime.onMessage.addListener(handleMessage);
    
    return () => {
      chrome.runtime.onMessage.removeListener(handleMessage);
    };
  }, []);

  return {
    state,
    isLoading,
    error,
    actions: {
      startRecording,
      stopRecording,
      updateSettings,
      updateServerUrl,
      refreshState
    }
  };
};
