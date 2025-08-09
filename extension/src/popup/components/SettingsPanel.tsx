// Settings panel component (placeholder)

import React from 'react';
import styled from 'styled-components';
import { SessionSettings } from '@shared';

const Container = styled.div`
  padding: ${({ theme }) => theme.spacing.lg};
`;

const Placeholder = styled.div`
  text-align: center;
  color: ${({ theme }) => theme.colors.textSecondary};
  padding: ${({ theme }) => theme.spacing.xl};
`;

interface SettingsPanelProps {
  settings: SessionSettings;
  serverUrl: string;
  onSettingsChange: (settings: Partial<SessionSettings>) => void;
  onServerUrlChange: (url: string) => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  settings,
  serverUrl,
  onSettingsChange,
  onServerUrlChange
}) => {
  return (
    <Container>
      <Placeholder>
        Settings panel will be implemented here
      </Placeholder>
    </Container>
  );
};
