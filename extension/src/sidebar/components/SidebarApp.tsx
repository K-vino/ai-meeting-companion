// Main sidebar application component

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { 
  X, 
  Minimize2, 
  FileText, 
  CheckSquare, 
  Heart, 
  BookOpen,
  Mic,
  MicOff
} from 'lucide-react';
import { 
  ContentScriptMessage, 
  ContentMessageType, 
  TranscriptSegment, 
  MeetingAnalysis,
  MeetingSession 
} from '@shared';

const Container = styled.div`
  width: 100%;
  height: 100%;
  background: ${({ theme }) => theme.colors.background};
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: ${({ theme }) => theme.shadows.xl};
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.textInverse};
`;

const Title = styled.h2`
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
`;

const HeaderActions = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.xs};
`;

const HeaderButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  background: rgba(255, 255, 255, 0.2);
  color: ${({ theme }) => theme.colors.textInverse};
  transition: background ${({ theme }) => theme.transitions.fast};
  
  &:hover {
    background: rgba(255, 255, 255, 0.3);
  }
`;

const Content = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: ${({ theme }) => theme.spacing.md};
`;

const Section = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const SectionTitle = styled.h3`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.textPrimary};
`;

const SectionContent = styled.div`
  background: ${({ theme }) => theme.colors.backgroundSecondary};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  padding: ${({ theme }) => theme.spacing.md};
  min-height: 80px;
`;

const TranscriptText = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  line-height: ${({ theme }) => theme.typography.lineHeight.relaxed};
  color: ${({ theme }) => theme.colors.textPrimary};
  white-space: pre-wrap;
`;

const ActionItem = styled.div`
  display: flex;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.sm};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  background: ${({ theme }) => theme.colors.surface};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const ActionText = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.textPrimary};
  flex: 1;
`;

const SentimentIndicator = styled.div<{ sentiment: string }>`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.sm};
  border-radius: ${({ theme }) => theme.borderRadius.full};
  background: ${({ sentiment, theme }) => getSentimentColor(sentiment, theme)};
  color: ${({ theme }) => theme.colors.textInverse};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
`;

const JargonTerm = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.md};
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const JargonWord = styled.span`
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.primary};
`;

const JargonDefinition = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-top: ${({ theme }) => theme.spacing.xs};
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 80px;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  text-align: center;
`;

export const SidebarApp: React.FC = () => {
  const [session, setSession] = useState<MeetingSession | null>(null);
  const [transcript, setTranscript] = useState<TranscriptSegment[]>([]);
  const [analysis, setAnalysis] = useState<Partial<MeetingAnalysis> | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  useEffect(() => {
    // Listen for messages from content script
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      
      const message: ContentScriptMessage = event.data;
      
      switch (message.type) {
        case ContentMessageType.INIT_SIDEBAR:
          setSession(message.payload.session);
          setIsRecording(!!message.payload.session);
          break;
          
        case ContentMessageType.UPDATE_TRANSCRIPT:
          setTranscript(prev => [...prev, message.payload]);
          break;
          
        case ContentMessageType.UPDATE_ANALYSIS:
          setAnalysis(prev => ({ ...prev, ...message.payload }));
          break;
          
        case ContentMessageType.TOGGLE_RECORDING:
          setIsRecording(message.payload.isRecording);
          break;
      }
    };

    window.addEventListener('message', handleMessage);
    
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  const handleClose = () => {
    window.parent.postMessage({ type: 'CLOSE_SIDEBAR' }, '*');
  };

  const handleMinimize = () => {
    window.parent.postMessage({ type: 'MINIMIZE_SIDEBAR' }, '*');
  };

  const getTranscriptText = () => {
    return transcript.map(segment => segment.text).join(' ');
  };

  return (
    <Container>
      <Header>
        <Title>
          {isRecording ? <Mic size={16} /> : <MicOff size={16} />}
          AI Meeting Companion
        </Title>
        <HeaderActions>
          <HeaderButton onClick={handleMinimize}>
            <Minimize2 size={14} />
          </HeaderButton>
          <HeaderButton onClick={handleClose}>
            <X size={14} />
          </HeaderButton>
        </HeaderActions>
      </Header>

      <Content>
        <Section>
          <SectionHeader>
            <FileText size={16} />
            <SectionTitle>Live Notes</SectionTitle>
          </SectionHeader>
          <SectionContent>
            {analysis?.summary ? (
              <TranscriptText>{analysis.summary}</TranscriptText>
            ) : transcript.length > 0 ? (
              <TranscriptText>{getTranscriptText()}</TranscriptText>
            ) : (
              <EmptyState>
                {isRecording ? 'Listening for audio...' : 'Start recording to see live notes'}
              </EmptyState>
            )}
          </SectionContent>
        </Section>

        <Section>
          <SectionHeader>
            <CheckSquare size={16} />
            <SectionTitle>Action Items</SectionTitle>
          </SectionHeader>
          <SectionContent>
            {analysis?.actionItems && analysis.actionItems.length > 0 ? (
              analysis.actionItems.map((item, index) => (
                <ActionItem key={index}>
                  <CheckSquare size={16} />
                  <ActionText>{item.text}</ActionText>
                </ActionItem>
              ))
            ) : (
              <EmptyState>No action items detected yet</EmptyState>
            )}
          </SectionContent>
        </Section>

        <Section>
          <SectionHeader>
            <Heart size={16} />
            <SectionTitle>Sentiment</SectionTitle>
          </SectionHeader>
          <SectionContent>
            {analysis?.sentiment ? (
              <SentimentIndicator sentiment={getSentimentLabel(analysis.sentiment.overall)}>
                <Heart size={12} />
                {getSentimentLabel(analysis.sentiment.overall)}
              </SentimentIndicator>
            ) : (
              <EmptyState>Analyzing sentiment...</EmptyState>
            )}
          </SectionContent>
        </Section>

        <Section>
          <SectionHeader>
            <BookOpen size={16} />
            <SectionTitle>Jargon Explanations</SectionTitle>
          </SectionHeader>
          <SectionContent>
            {analysis?.jargonTerms && analysis.jargonTerms.length > 0 ? (
              analysis.jargonTerms.map((term, index) => (
                <JargonTerm key={index}>
                  <JargonWord>{term.term}</JargonWord>
                  <JargonDefinition>{term.definition}</JargonDefinition>
                </JargonTerm>
              ))
            ) : (
              <EmptyState>No jargon detected yet</EmptyState>
            )}
          </SectionContent>
        </Section>
      </Content>
    </Container>
  );
};

function getSentimentLabel(sentiment: any): string {
  if (!sentiment) return 'Neutral';
  
  const { positive, negative, neutral } = sentiment;
  const max = Math.max(positive, negative, neutral);
  
  if (max === positive) return 'Positive';
  if (max === negative) return 'Negative';
  return 'Neutral';
}

function getSentimentColor(sentiment: string, theme: any): string {
  switch (sentiment.toLowerCase()) {
    case 'positive':
      return theme.colors.success;
    case 'negative':
      return theme.colors.error;
    default:
      return theme.colors.info;
  }
}
