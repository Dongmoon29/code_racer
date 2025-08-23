import styled, { css } from 'styled-components';

// Alert variants
const alertVariants = {
  default: css`
    background: hsl(var(--background));
    color: hsl(var(--foreground));
    border: 1px solid hsl(var(--border));
  `,
  
  destructive: css`
    background: hsl(0 84% 60%);
    border: 1px solid hsl(var(--destructive) / 0.5);
    color: white;
    
    svg {
      color: hsl(var(--destructive));
    }
  `,
  
  info: css`
    border: 1px solid hsl(217 91% 60% / 0.2);
    background: hsl(217 91% 60% / 0.1);
    color: hsl(217 91% 40%);
    
    @media (prefers-color-scheme: dark) {
      border: 1px solid hsl(217 91% 60% / 0.3);
      background: hsl(217 91% 60% / 0.1);
      color: hsl(217 91% 80%);
    }
  `,
  
  success: css`
    border: 1px solid hsl(142 76% 36% / 0.2);
    background: hsl(142 76% 36% / 0.1);
    color: hsl(142 76% 20%);
    
    @media (prefers-color-scheme: dark) {
      border: 1px solid hsl(142 76% 36% / 0.3);
      background: hsl(142 76% 36% / 0.1);
      color: hsl(142 76% 80%);
    }
  `,
  
  warning: css`
    border: 1px solid hsl(48 96% 53% / 0.2);
    background: hsl(48 96% 53% / 0.1);
    color: hsl(48 96% 20%);
    
    @media (prefers-color-scheme: dark) {
      border: 1px solid hsl(48 96% 53% / 0.3);
      background: hsl(48 96% 53% / 0.1);
      color: hsl(48 96% 80%);
    }
  `,
  
  error: css`
    border: 1px solid hsl(0 84% 60% / 0.2);
    background: hsl(0 84% 60% / 0.1);
    color: hsl(0 84% 20%);
    
    @media (prefers-color-scheme: dark) {
      border: 1px solid hsl(0 84% 60% / 0.3);
      background: hsl(0 84% 60% / 0.1);
      color: hsl(0 84% 80%);
    }
  `,
};

// Base alert styles
const baseAlertStyles = css`
  position: relative;
  width: 100%;
  border-radius: 0.5rem;
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  
  svg {
    width: 1rem;
    height: 1rem;
    transform: translateY(0.125rem);
    color: currentColor;
  }
`;

// Styled alert components
export const StyledAlert = styled.div<{
  variant?: keyof typeof alertVariants;
  clickable?: boolean;
}>`
  ${baseAlertStyles}
  
  ${props => props.variant && alertVariants[props.variant]}
  
  ${props => props.clickable && css`
    cursor: pointer;
    transition: all 0.2s ease-in-out;
    
    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
    }
  `}
`;

export const AlertTitle = styled.div`
  font-weight: 500;
  line-height: 1;
  letter-spacing: -0.025em;
  margin-bottom: 0.25rem;
`;

export const AlertDescription = styled.div`
  font-size: 0.875rem;
  
  p {
    line-height: 1.625;
    margin: 0;
  }
`;

// Icon wrapper for alerts
export const AlertIcon = styled.div`
  display: inline-flex;
  align-items: center;
  margin-right: 0.5rem;
  vertical-align: middle;
`;

// Alert with icon
export const AlertWithIcon = styled(StyledAlert)`
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
`;

// Dismissible alert
export const DismissibleAlert = styled(StyledAlert)`
  display: flex;
  align-items: center;
  justify-content: space-between;
  
  .alert-content {
    flex: 1;
  }
  
  .dismiss-button {
    background: transparent;
    border: none;
    cursor: pointer;
    padding: 0.25rem;
    border-radius: 0.25rem;
    color: currentColor;
    opacity: 0.7;
    transition: opacity 0.2s ease-in-out;
    
    &:hover {
      opacity: 1;
    }
  }
`;
