// Header component for popup

import React from 'react';
import styled from 'styled-components';
import { Settings, ArrowLeft } from 'lucide-react';

const HeaderContainer = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${({ theme }) => theme.spacing.lg};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.surface};
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
`;

const BackButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  background: ${({ theme }) => theme.colors.gray100};
  color: ${({ theme }) => theme.colors.textSecondary};
  transition: all ${({ theme }) => theme.transitions.fast};
  
  &:hover {
    background: ${({ theme }) => theme.colors.gray200};
    color: ${({ theme }) => theme.colors.textPrimary};
  }
`;

const Title = styled.h1`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.textPrimary};
`;

const HeaderRight = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const IconButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  background: transparent;
  color: ${({ theme }) => theme.colors.textSecondary};
  transition: all ${({ theme }) => theme.transitions.fast};
  
  &:hover {
    background: ${({ theme }) => theme.colors.gray100};
    color: ${({ theme }) => theme.colors.textPrimary};
  }
`;

interface HeaderProps {
  title: string;
  onBack?: () => void;
  onSettingsClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  title, 
  onBack, 
  onSettingsClick 
}) => {
  return (
    <HeaderContainer>
      <HeaderLeft>
        {onBack && (
          <BackButton onClick={onBack}>
            <ArrowLeft size={16} />
          </BackButton>
        )}
        <Title>{title}</Title>
      </HeaderLeft>
      
      <HeaderRight>
        {onSettingsClick && (
          <IconButton onClick={onSettingsClick}>
            <Settings size={16} />
          </IconButton>
        )}
      </HeaderRight>
    </HeaderContainer>
  );
};
