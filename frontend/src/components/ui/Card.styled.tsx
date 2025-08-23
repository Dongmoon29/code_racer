import styled, { css } from 'styled-components';

// Card variants
const cardVariants = {
  default: css`
    background: hsl(var(--card));
    color: hsl(var(--card-foreground));
    border: 1px solid hsl(var(--border));
  `,

  elevated: css`
    background: hsl(var(--card));
    color: hsl(var(--card-foreground));
    border: 1px solid hsl(var(--border));
    box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);

    &:hover {
      box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1),
        0 4px 6px -4px rgb(0 0 0 / 0.1);
      transform: translateY(-2px);
    }
  `,

  outline: css`
    background: transparent;
    color: hsl(var(--foreground));
    border: 2px solid hsl(var(--border));

    &:hover {
      border-color: hsl(var(--primary));
    }
  `,

  ghost: css`
    background: transparent;
    color: hsl(var(--foreground));
    border: none;

    &:hover {
      background: hsl(var(--accent) / 0.1);
    }
  `,
};

// Card sizes
const cardSizes = {
  sm: css`
    padding: 1rem;
    border-radius: 0.5rem;
  `,

  default: css`
    padding: 1.5rem;
    border-radius: 0.75rem;
  `,

  lg: css`
    padding: 2rem;
    border-radius: 1rem;
  `,

  xl: css`
    padding: 2.5rem;
    border-radius: 1.25rem;
  `,
};

// Base card styles
const baseCardStyles = css`
  overflow: hidden;
  transition: all 0.3s ease-in-out;
  font-family: inherit;
`;

// Styled card components
export const StyledCard = styled.div<{
  variant?: keyof typeof cardVariants;
  size?: keyof typeof cardSizes;
  fullWidth?: boolean;
  clickable?: boolean;
}>`
  ${baseCardStyles}

  ${(props) => props.variant && cardVariants[props.variant]}
  ${(props) => props.size && cardSizes[props.size]}
  
  ${(props) =>
    props.fullWidth &&
    css`
      width: 100%;
    `}
  
  ${(props) =>
    props.clickable &&
    css`
      cursor: pointer;

      &:hover {
        transform: translateY(-2px);
      }
    `}
`;

export const CardHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
`;

export const CardTitle = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  line-height: 1.5;
  margin: 0;
`;

export const CardDescription = styled.p`
  color: hsl(var(--muted-foreground));
  font-size: 0.875rem;
  line-height: 1.5;
  margin: 0;
`;

export const CardContent = styled.div`
  margin-bottom: 1rem;
`;

export const CardFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding-top: 1rem;
  border-top: 1px solid hsl(var(--border));
`;

// Card with built-in header
export const CardWithHeader = styled(StyledCard)`
  ${CardHeader} {
    margin-bottom: 1.5rem;
  }
`;

// Interactive card
export const InteractiveCard = styled(StyledCard)`
  cursor: pointer;
  transition: all 0.2s ease-in-out;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1),
      0 8px 10px -6px rgb(0 0 0 / 0.1);
  }

  &:active {
    transform: translateY(-2px);
  }
`;
