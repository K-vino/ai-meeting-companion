// Status card component

import React from 'react';
import styled from 'styled-components';

const Card = styled.div<{ variant: StatusVariant }>`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  border: 1px solid ${({ theme, variant }) => getVariantColor(theme, variant, 'border')};
  background: ${({ theme, variant }) => getVariantColor(theme, variant, 'background')};
  transition: all ${({ theme }) => theme.transitions.fast};
`;

const IconContainer = styled.div<{ variant: StatusVariant }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  background: ${({ theme, variant }) => getVariantColor(theme, variant, 'iconBackground')};
  color: ${({ theme, variant }) => getVariantColor(theme, variant, 'icon')};
`;

const Content = styled.div`
  flex: 1;
`;

const Title = styled.h3`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-bottom: ${({ theme }) => theme.spacing.xs};
`;

const Value = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.textPrimary};
  line-height: ${({ theme }) => theme.typography.lineHeight.tight};
`;

type StatusVariant = 'success' | 'error' | 'warning' | 'info' | 'neutral';

interface StatusCardProps {
  icon: React.ReactNode;
  title: string;
  value: string;
  variant?: StatusVariant;
  className?: string;
  style?: React.CSSProperties;
}

export const StatusCard: React.FC<StatusCardProps> = ({
  icon,
  title,
  value,
  variant = 'neutral',
  className,
  style
}) => {
  return (
    <Card variant={variant} className={className} style={style}>
      <IconContainer variant={variant}>
        {icon}
      </IconContainer>
      <Content>
        <Title>{title}</Title>
        <Value>{value}</Value>
      </Content>
    </Card>
  );
};

function getVariantColor(theme: any, variant: StatusVariant, type: string): string {
  const colors = {
    success: {
      border: theme.colors.success + '20',
      background: theme.colors.success + '08',
      iconBackground: theme.colors.success + '15',
      icon: theme.colors.success
    },
    error: {
      border: theme.colors.error + '20',
      background: theme.colors.error + '08',
      iconBackground: theme.colors.error + '15',
      icon: theme.colors.error
    },
    warning: {
      border: theme.colors.warning + '20',
      background: theme.colors.warning + '08',
      iconBackground: theme.colors.warning + '15',
      icon: theme.colors.warning
    },
    info: {
      border: theme.colors.info + '20',
      background: theme.colors.info + '08',
      iconBackground: theme.colors.info + '15',
      icon: theme.colors.info
    },
    neutral: {
      border: theme.colors.border,
      background: theme.colors.surface,
      iconBackground: theme.colors.gray100,
      icon: theme.colors.textSecondary
    }
  };

  return colors[variant][type as keyof typeof colors.success] || colors.neutral[type as keyof typeof colors.neutral];
}
