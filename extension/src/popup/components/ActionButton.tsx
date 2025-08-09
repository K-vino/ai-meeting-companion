// Action button component

import React from 'react';
import styled from 'styled-components';

const Button = styled.button<{ variant: ButtonVariant; size: ButtonSize }>`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme, size }) => getButtonPadding(theme, size)};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  font-size: ${({ theme, size }) => getButtonFontSize(theme, size)};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  transition: all ${({ theme }) => theme.transitions.fast};
  cursor: pointer;
  border: none;
  outline: none;
  
  background: ${({ theme, variant }) => getVariantColor(theme, variant, 'background')};
  color: ${({ theme, variant }) => getVariantColor(theme, variant, 'text')};
  border: 1px solid ${({ theme, variant }) => getVariantColor(theme, variant, 'border')};
  
  &:hover:not(:disabled) {
    background: ${({ theme, variant }) => getVariantColor(theme, variant, 'backgroundHover')};
    border-color: ${({ theme, variant }) => getVariantColor(theme, variant, 'borderHover')};
    transform: translateY(-1px);
    box-shadow: ${({ theme }) => theme.shadows.md};
  }
  
  &:active:not(:disabled) {
    transform: translateY(0);
    box-shadow: ${({ theme }) => theme.shadows.sm};
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
  
  &:focus-visible {
    outline: 2px solid ${({ theme, variant }) => getVariantColor(theme, variant, 'focus')};
    outline-offset: 2px;
  }
`;

const IconContainer = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Label = styled.span`
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

type ButtonVariant = 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ActionButtonProps {
  icon?: React.ReactNode;
  label: string;
  onClick: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const ActionButton: React.FC<ActionButtonProps> = ({
  icon,
  label,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  className,
  style
}) => {
  return (
    <Button
      variant={variant}
      size={size}
      onClick={onClick}
      disabled={disabled}
      className={className}
      style={style}
    >
      {icon && <IconContainer>{icon}</IconContainer>}
      <Label>{label}</Label>
    </Button>
  );
};

function getButtonPadding(theme: any, size: ButtonSize): string {
  switch (size) {
    case 'sm':
      return `${theme.spacing.sm} ${theme.spacing.md}`;
    case 'lg':
      return `${theme.spacing.lg} ${theme.spacing.xl}`;
    default:
      return `${theme.spacing.md} ${theme.spacing.lg}`;
  }
}

function getButtonFontSize(theme: any, size: ButtonSize): string {
  switch (size) {
    case 'sm':
      return theme.typography.fontSize.sm;
    case 'lg':
      return theme.typography.fontSize.lg;
    default:
      return theme.typography.fontSize.base;
  }
}

function getVariantColor(theme: any, variant: ButtonVariant, type: string): string {
  const colors = {
    primary: {
      background: theme.colors.primary,
      backgroundHover: theme.colors.primaryDark,
      text: theme.colors.textInverse,
      border: theme.colors.primary,
      borderHover: theme.colors.primaryDark,
      focus: theme.colors.primary
    },
    secondary: {
      background: theme.colors.secondary,
      backgroundHover: theme.colors.secondaryDark,
      text: theme.colors.textInverse,
      border: theme.colors.secondary,
      borderHover: theme.colors.secondaryDark,
      focus: theme.colors.secondary
    },
    success: {
      background: theme.colors.success,
      backgroundHover: '#388E3C',
      text: theme.colors.textInverse,
      border: theme.colors.success,
      borderHover: '#388E3C',
      focus: theme.colors.success
    },
    error: {
      background: theme.colors.error,
      backgroundHover: '#D32F2F',
      text: theme.colors.textInverse,
      border: theme.colors.error,
      borderHover: '#D32F2F',
      focus: theme.colors.error
    },
    warning: {
      background: theme.colors.warning,
      backgroundHover: '#F57C00',
      text: theme.colors.textInverse,
      border: theme.colors.warning,
      borderHover: '#F57C00',
      focus: theme.colors.warning
    },
    ghost: {
      background: 'transparent',
      backgroundHover: theme.colors.gray100,
      text: theme.colors.textPrimary,
      border: theme.colors.border,
      borderHover: theme.colors.borderDark,
      focus: theme.colors.primary
    }
  };

  return colors[variant][type as keyof typeof colors.primary] || colors.primary[type as keyof typeof colors.primary];
}
