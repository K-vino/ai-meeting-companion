// Session info component (placeholder)

import React from 'react';
import styled from 'styled-components';
import { MeetingSession } from '@shared';

const Container = styled.div`
  padding: ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const Title = styled.h3`
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

interface SessionInfoProps {
  session: MeetingSession;
}

export const SessionInfo: React.FC<SessionInfoProps> = ({ session }) => {
  return (
    <Container>
      <Title>Current Session</Title>
      <p>Session ID: {session.id}</p>
      <p>Platform: {session.platform}</p>
      <p>Started: {new Date(session.startTime).toLocaleTimeString()}</p>
    </Container>
  );
};
