// Main popup application component

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { 
  Mic, 
  MicOff, 
  Settings, 
  Activity, 
  Users, 
  FileText,
  Server,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { ExtensionState, MeetingSession, detectMeetingPlatform, isMeetingUrl } from '@shared';
import { Header } from './Header';
import { StatusCard } from './StatusCard';
import { ActionButton } from './ActionButton';
import { SettingsPanel } from './SettingsPanel';
import { SessionInfo } from './SessionInfo';
import { useExtensionState } from '../hooks/useExtensionState';

const Container = styled.div`
  width: 380px;
  min-height: 500px;
  max-height: 600px;
  display: flex;
  flex-direction: column;
  background: ${({ theme }) => theme.colors.background};
  overflow: hidden;
`;

const Content = styled.div`
  flex: 1;
  padding: ${({ theme }) => theme.spacing.lg};
  overflow-y: auto;
`;

const StatusGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${({ theme }) => theme.spacing.md};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`;

const ActionSection = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`;

const ActionGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${({ theme }) => theme.spacing.md};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const MainActionButton = styled(ActionButton)`
  grid-column: 1 / -1;
  padding: ${({ theme }) => theme.spacing.lg};
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
`;

const Footer = styled.div`
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg};
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.backgroundSecondary};
`;

const FooterText = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.textSecondary};
  text-align: center;
`;

export const PopupApp: React.FC = () => {
  const { state, isLoading, error, actions } = useExtensionState();
  const [showSettings, setShowSettings] = useState(false);
  const [currentTab, setCurrentTab] = useState<chrome.tabs.Tab | null>(null);
  const [isMeetingPage, setIsMeetingPage] = useState(false);

  useEffect(() => {
    // Get current tab information
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        setCurrentTab(tabs[0]);
        setIsMeetingPage(isMeetingUrl(tabs[0].url || ''));
      }
    });
  }, []);

  const handleStartRecording = async () => {
    if (!currentTab?.id) return;
    
    try {
      await actions.startRecording(currentTab.id);
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  };

  const handleStopRecording = async () => {
    try {
      await actions.stopRecording();
    } catch (error) {
      console.error('Failed to stop recording:', error);
    }
  };

  const handleToggleSidebar = async () => {
    if (!currentTab?.id) return;
    
    try {
      await chrome.tabs.sendMessage(currentTab.id, { type: 'TOGGLE_SIDEBAR' });
    } catch (error) {
      console.error('Failed to toggle sidebar:', error);
    }
  };

  const getConnectionStatus = () => {
    if (!state.serverUrl) return 'disconnected';
    // This would check actual connection status
    return 'connected';
  };

  const getMeetingPlatform = () => {
    if (!currentTab?.url) return 'Unknown';
    const platform = detectMeetingPlatform(currentTab.url);
    
    switch (platform) {
      case 'zoom':
        return 'Zoom';
      case 'google_meet':
        return 'Google Meet';
      case 'microsoft_teams':
        return 'Microsoft Teams';
      default:
        return 'Generic';
    }
  };

  if (isLoading) {
    return (
      <Container>
        <Header title="AI Meeting Companion" />
        <Content>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
            <div className="animate-spin">
              <Activity size={24} />
            </div>
          </div>
        </Content>
      </Container>
    );
  }

  if (showSettings) {
    return (
      <Container>
        <Header 
          title="Settings" 
          onBack={() => setShowSettings(false)}
        />
        <SettingsPanel 
          settings={state.settings}
          serverUrl={state.serverUrl}
          onSettingsChange={actions.updateSettings}
          onServerUrlChange={actions.updateServerUrl}
        />
      </Container>
    );
  }

  return (
    <Container>
      <Header 
        title="AI Meeting Companion"
        onSettingsClick={() => setShowSettings(true)}
      />
      
      <Content>
        {error && (
          <StatusCard
            icon={<AlertCircle size={20} />}
            title="Error"
            value={error}
            variant="error"
            style={{ marginBottom: '16px' }}
          />
        )}

        <StatusGrid>
          <StatusCard
            icon={<Server size={20} />}
            title="Server"
            value={getConnectionStatus() === 'connected' ? 'Connected' : 'Disconnected'}
            variant={getConnectionStatus() === 'connected' ? 'success' : 'error'}
          />
          
          <StatusCard
            icon={<Users size={20} />}
            title="Platform"
            value={isMeetingPage ? getMeetingPlatform() : 'Not in meeting'}
            variant={isMeetingPage ? 'success' : 'warning'}
          />
        </StatusGrid>

        {state.currentSession && (
          <SessionInfo session={state.currentSession} />
        )}

        <ActionSection>
          {isMeetingPage ? (
            <>
              <MainActionButton
                icon={state.isRecording ? <MicOff size={24} /> : <Mic size={24} />}
                label={state.isRecording ? 'Stop Recording' : 'Start Recording'}
                onClick={state.isRecording ? handleStopRecording : handleStartRecording}
                variant={state.isRecording ? 'error' : 'primary'}
                disabled={!isMeetingPage || getConnectionStatus() !== 'connected'}
              />
              
              <ActionGrid>
                <ActionButton
                  icon={<FileText size={20} />}
                  label="Toggle Sidebar"
                  onClick={handleToggleSidebar}
                  variant="secondary"
                />
                
                <ActionButton
                  icon={<Activity size={20} />}
                  label="Live Analysis"
                  onClick={() => {/* TODO: Implement */}}
                  variant="secondary"
                  disabled={!state.isRecording}
                />
              </ActionGrid>
            </>
          ) : (
            <StatusCard
              icon={<AlertCircle size={20} />}
              title="Not in a meeting"
              value="Navigate to a supported meeting platform to start recording"
              variant="warning"
            />
          )}
        </ActionSection>

        {state.currentSession && (
          <StatusGrid>
            <StatusCard
              icon={<Clock size={16} />}
              title="Duration"
              value={formatDuration(Date.now() - new Date(state.currentSession.startTime).getTime())}
              variant="info"
            />
            
            <StatusCard
              icon={<Users size={16} />}
              title="Participants"
              value={state.currentSession.participants.length.toString()}
              variant="info"
            />
          </StatusGrid>
        )}
      </Content>

      <Footer>
        <FooterText>
          AI Meeting Companion v1.0.0
        </FooterText>
      </Footer>
    </Container>
  );
};

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}:${(minutes % 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
  }
  
  return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`;
}
