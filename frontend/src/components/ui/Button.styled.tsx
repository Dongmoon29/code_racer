import styled, { css } from 'styled-components';

// Button variants
const buttonVariants = {
  default: css`
    background: var(--neon-gradient);
    color: white;
    box-shadow: var(--neon-shadow);

    &:hover {
      background: var(--neon-hover-gradient);
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(56, 189, 248, 0.6);
    }

    &:active {
      transform: translateY(0);
    }
  `,

  destructive: css`
    background: hsl(var(--destructive));
    color: white;

    &:hover {
      background: hsl(var(--destructive) / 0.9);
    }
  `,

  outline: css`
    border: 1px solid hsl(var(--border));
    background: hsl(var(--background));
    color: hsl(var(--foreground));

    &:hover {
      background: hsl(var(--accent));
      color: hsl(var(--accent-foreground));
    }
  `,

  secondary: css`
    background: hsl(var(--secondary));
    color: hsl(var(--secondary-foreground));

    &:hover {
      background: hsl(var(--secondary) / 0.8);
    }
  `,

  ghost: css`
    background: transparent;
    color: hsl(var(--foreground));

    &:hover {
      background: hsl(var(--accent));
      color: hsl(var(--accent-foreground));
    }
  `,

  link: css`
    background: transparent;
    color: hsl(var(--primary));
    text-decoration: underline;
    text-underline-offset: 4px;

    &:hover {
      text-decoration: underline;
    }
  `,
};

// Button sizes
const buttonSizes = {
  default: css`
    height: 2.25rem;
    padding: 0.5rem 1rem;
  `,

  sm: css`
    height: 2rem;
    padding: 0.375rem 0.75rem;
    border-radius: 0.375rem;
  `,

  lg: css`
    height: 3rem;
    padding: 0.75rem 2rem;
    font-size: 1.125rem;
    border-radius: 0.5rem;
  `,

  icon: css`
    width: 2.25rem;
    height: 2.25rem;
  `,
};

// Base button styles
const baseButtonStyles = css`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  gap: 0.5rem;
  white-space: nowrap;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s ease-in-out;
  border: none;
  outline: none;
  font-family: inherit;

  &:disabled {
    pointer-events: none;
    opacity: 0.5;
    cursor: not-allowed;
  }

  svg {
    pointer-events: none;
    flex-shrink: 0;

    &:not([class*='size-']) {
      width: 1rem;
      height: 1rem;
    }
  }
`;

// Styled button component
export const StyledButton = styled.button<{
  variant?: keyof typeof buttonVariants;
  size?: keyof typeof buttonSizes;
  fullWidth?: boolean;
}>`
  ${baseButtonStyles}

  ${(props) => props.variant && buttonVariants[props.variant]}
  ${(props) => props.size && buttonSizes[props.size]}
  
  ${(props) =>
    props.fullWidth &&
    css`
      width: 100%;
    `}
`;

// Button group styles
export const ButtonGroup = styled.div`
  display: flex;
  gap: 0.5rem;

  ${StyledButton} {
    border-radius: 0;

    &:first-child {
      border-top-left-radius: 0.375rem;
      border-bottom-left-radius: 0.375rem;
    }

    &:last-child {
      border-top-right-radius: 0.375rem;
      border-bottom-right-radius: 0.375rem;
    }
  }
`;

// Icon button styles
export const IconButton = styled(StyledButton)`
  padding: 0;
  min-width: 2.25rem;

  svg {
    width: 1rem;
    height: 1rem;
  }
`;
