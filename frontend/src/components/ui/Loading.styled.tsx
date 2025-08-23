import styled, { css, keyframes } from 'styled-components';

// Spinner animation
const spin = keyframes`
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
`;

// Loading sizes
const loadingSizes = {
  sm: css`
    width: 2rem;
    height: 2rem;
    border-width: 2px;
  `,
  
  md: css`
    width: 3rem;
    height: 3rem;
    border-width: 2px;
  `,
  
  lg: css`
    width: 4rem;
    height: 4rem;
    border-width: 3px;
  `,
  
  xl: css`
    width: 6rem;
    height: 6rem;
    border-width: 4px;
  `,
};

// Base spinner styles
const baseSpinnerStyles = css`
  border-radius: 50%;
  border-style: solid;
  border-color: transparent;
  border-top-color: hsl(var(--primary));
  border-bottom-color: hsl(var(--primary));
  animation: ${spin} 1s linear infinite;
`;

// Styled loading components
export const Spinner = styled.div<{ size: keyof typeof loadingSizes }>`
  ${baseSpinnerStyles}
  ${props => loadingSizes[props.size]}
`;

export const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 1rem;
`;

export const FullScreenLoading = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: hsl(var(--background) / 0.8);
  backdrop-filter: blur(4px);
  z-index: 50;
`;

// Loading with text
export const LoadingWithText = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 2rem;
`;

export const LoadingText = styled.p`
  color: hsl(var(--muted-foreground));
  font-size: 0.875rem;
  margin: 0;
  text-align: center;
`;

// Skeleton loading
export const Skeleton = styled.div<{ width?: string; height?: string }>`
  background: linear-gradient(
    90deg,
    hsl(var(--muted)) 25%,
    hsl(var(--muted) / 0.5) 50%,
    hsl(var(--muted)) 75%
  );
  background-size: 200% 100%;
  animation: ${keyframes`
    0% {
      background-position: 200% 0;
    }
    100% {
      background-position: -200% 0;
    }
  `} 1.5s ease-in-out infinite;
  border-radius: 0.375rem;
  width: ${props => props.width || '100%'};
  height: ${props => props.height || '1rem'};
`;

// Loading dots
export const LoadingDots = styled.div`
  display: flex;
  gap: 0.25rem;
  align-items: center;
  justify-content: center;
`;

export const LoadingDot = styled.div<{ delay: number }>`
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  background: hsl(var(--primary));
  animation: ${keyframes`
    0%, 80%, 100% {
      transform: scale(0);
      opacity: 0.5;
    }
    40% {
      transform: scale(1);
      opacity: 1;
    }
  `} 1.4s ease-in-out infinite;
  animation-delay: ${props => props.delay}s;
`;

// Pulse loading
export const PulseLoading = styled.div<{ size: keyof typeof loadingSizes }>`
  ${props => loadingSizes[props.size]}
  background: hsl(var(--primary));
  border-radius: 50%;
  animation: ${keyframes`
    0% {
      transform: scale(0.8);
      opacity: 0.5;
    }
    50% {
      transform: scale(1.2);
      opacity: 1;
    }
    100% {
      transform: scale(0.8);
      opacity: 0.5;
    }
  `} 1.5s ease-in-out infinite;
`;
