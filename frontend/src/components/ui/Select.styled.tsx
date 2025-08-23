import styled, { css } from 'styled-components';

// Select variants
const selectVariants = {
  default: css`
    background: hsl(var(--card));
    color: hsl(var(--foreground));
    border: 1px solid hsl(var(--input));
    
    &:focus {
      background: hsl(var(--background));
      border-color: hsl(var(--ring));
      outline: none;
      box-shadow: 0 0 0 1px hsl(var(--ring));
    }
    
    &:hover:not(:disabled) {
      border-color: hsl(var(--ring));
    }
  `,
  
  outline: css`
    background: transparent;
    color: hsl(var(--foreground));
    border: 2px solid hsl(var(--border));
    
    &:focus {
      border-color: hsl(var(--primary));
      box-shadow: 0 0 0 1px hsl(var(--primary));
    }
    
    &:hover:not(:disabled) {
      border-color: hsl(var(--primary));
    }
  `,
  
  ghost: css`
    background: transparent;
    color: hsl(var(--foreground));
    border: 1px solid transparent;
    
    &:focus {
      background: hsl(var(--accent));
      border-color: hsl(var(--accent));
    }
    
    &:hover:not(:disabled) {
      background: hsl(var(--accent) / 0.1);
    }
  `,
};

// Select sizes
const selectSizes = {
  sm: css`
    padding: 0.375rem 0.75rem;
    font-size: 0.875rem;
    height: 2rem;
  `,
  
  default: css`
    padding: 0.5rem 1rem;
    font-size: 1rem;
    height: 2.5rem;
  `,
  
  lg: css`
    padding: 0.75rem 1.25rem;
    font-size: 1.125rem;
    height: 3rem;
  `,
};

// Base select styles
const baseSelectStyles = css`
  width: 100%;
  border-radius: 0.5rem;
  appearance: none;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.2s ease-in-out;
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  option {
    background: hsl(var(--background));
    color: hsl(var(--foreground));
    padding: 0.5rem;
  }
`;

// Styled select components
export const SelectContainer = styled.div`
  position: relative;
  width: 100%;
`;

export const SelectIcon = styled.div<{ hasIcon: boolean }>`
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: hsl(var(--muted-foreground));
  pointer-events: none;
  z-index: 1;
`;

export const StyledSelect = styled.select<{
  variant?: keyof typeof selectVariants;
  size?: keyof typeof selectSizes;
  hasIcon?: boolean;
  fullWidth?: boolean;
}>`
  ${baseSelectStyles}
  
  ${props => props.variant && selectVariants[props.variant]}
  ${props => props.size && selectSizes[props.size]}
  
  ${props => props.hasIcon && css`
    padding-left: 3rem;
  `}
  
  ${props => props.fullWidth && css`
    width: 100%;
  `}
`;

// Select with custom arrow
export const SelectWithCustomArrow = styled(SelectContainer)`
  ${StyledSelect} {
    padding-right: 2.5rem;
  }
  
  &::after {
    content: '';
    position: absolute;
    right: 0.75rem;
    top: 50%;
    transform: translateY(-50%);
    width: 0;
    height: 0;
    border-left: 0.25rem solid transparent;
    border-right: 0.25rem solid transparent;
    border-top: 0.25rem solid hsl(var(--muted-foreground));
    pointer-events: none;
  }
`;

// Select group
export const SelectGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

export const SelectLabel = styled.label`
  font-size: 0.875rem;
  font-weight: 500;
  color: hsl(var(--foreground));
  margin-bottom: 0.25rem;
`;

export const SelectError = styled.div`
  font-size: 0.75rem;
  color: hsl(var(--destructive));
  margin-top: 0.25rem;
`;

export const SelectHelp = styled.div`
  font-size: 0.75rem;
  color: hsl(var(--muted-foreground));
  margin-top: 0.25rem;
`;

// Multi-select styles
export const MultiSelectContainer = styled.div`
  border: 1px solid hsl(var(--input));
  border-radius: 0.5rem;
  background: hsl(var(--card));
  min-height: 2.5rem;
  padding: 0.25rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  
  &:focus-within {
    border-color: hsl(var(--ring));
    box-shadow: 0 0 0 1px hsl(var(--ring));
  }
`;

export const MultiSelectTag = styled.span`
  background: hsl(var(--primary));
  color: hsl(var(--primary-foreground));
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  
  .remove-tag {
    background: none;
    border: none;
    color: inherit;
    cursor: pointer;
    padding: 0;
    font-size: 0.875rem;
    line-height: 1;
    
    &:hover {
      opacity: 0.8;
    }
  }
`;

export const MultiSelectInput = styled.input`
  border: none;
  outline: none;
  background: transparent;
  color: hsl(var(--foreground));
  flex: 1;
  min-width: 120px;
  font-size: 0.875rem;
  
  &::placeholder {
    color: hsl(var(--muted-foreground));
  }
`;
