import styled, { css, keyframes } from 'styled-components';

// Theme toggle animations (unused but kept for future use)
// const rotateIn = keyframes`
//   from {
//     transform: rotate(-90deg) scale(0);
//     opacity: 0;
//   }
//   to {
//     transform: rotate(0deg) scale(1);
//     opacity: 1;
//   }
// `;

// const rotateOut = keyframes`
//   from {
//     transform: rotate(0deg) scale(1);
//     opacity: 1;
//   }
//   to {
//     transform: rotate(90deg) scale(0);
//     opacity: 0;
//   }
// `;

const scaleIn = keyframes`
  from {
    transform: scale(0);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
`;

const scaleOut = keyframes`
  from {
    transform: scale(1);
    opacity: 1;
  }
  to {
    transform: scale(0);
    opacity: 0;
  }
`;

// Theme toggle button
export const ThemeToggleButton = styled.button`
  position: relative;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 0.375rem;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  overflow: hidden;

  &:hover {
    background: hsl(var(--muted));
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px hsl(var(--ring));
  }

  &:active {
    transform: scale(0.95);
  }
`;

// Icon container
export const IconContainer = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
`;

// Sun icon
export const SunIcon = styled.div<{ isActive: boolean }>`
  position: absolute;
  width: 1.25rem;
  height: 1.25rem;
  color: hsl(0 84% 60%);
  transition: all 0.3s ease-in-out;

  ${(props) =>
    props.isActive
      ? css`
          animation: ${scaleIn} 0.3s ease-in-out forwards;
          transform: scale(1) rotate(0deg);
          opacity: 1;
        `
      : css`
          animation: ${scaleOut} 0.3s ease-in-out forwards;
          transform: scale(0) rotate(-90deg);
          opacity: 0;
        `}
`;

// Moon icon
export const MoonIcon = styled.div<{ isActive: boolean }>`
  position: absolute;
  width: 1.25rem;
  height: 1.25rem;
  color: hsl(48 96% 53%);
  transition: all 0.3s ease-in-out;

  ${(props) =>
    props.isActive
      ? css`
          animation: ${scaleIn} 0.3s ease-in-out forwards;
          transform: scale(1) rotate(0deg);
          opacity: 1;
        `
      : css`
          animation: ${scaleOut} 0.3s ease-in-out forwards;
          transform: scale(0) rotate(90deg);
          opacity: 0;
        `}
`;

// Theme toggle with ripple effect
export const ThemeToggleWithRipple = styled(ThemeToggleButton)`
  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 0;
    height: 0;
    border-radius: 50%;
    background: hsl(var(--primary) / 0.2);
    transform: translate(-50%, -50%);
    transition: width 0.3s ease-out, height 0.3s ease-out;
  }

  &:active::before {
    width: 100%;
    height: 100%;
  }
`;

// Theme toggle with border
export const ThemeToggleWithBorder = styled(ThemeToggleButton)`
  border: 2px solid hsl(var(--border));

  &:hover {
    border-color: hsl(var(--primary));
    background: hsl(var(--primary) / 0.1);
  }

  &:focus {
    border-color: hsl(var(--ring));
  }
`;

// Theme toggle with background
export const ThemeToggleWithBackground = styled(ThemeToggleButton)`
  background: hsl(var(--card));
  border: 1px solid hsl(var(--border));

  &:hover {
    background: hsl(var(--accent));
    border-color: hsl(var(--accent));
  }

  &:focus {
    border-color: hsl(var(--ring));
    box-shadow: 0 0 0 2px hsl(var(--ring));
  }
`;

// Theme toggle group (multiple theme options)
export const ThemeToggleGroup = styled.div`
  display: flex;
  gap: 0.25rem;
  padding: 0.25rem;
  background: hsl(var(--muted));
  border-radius: 0.5rem;
`;

export const ThemeOption = styled.button<{ isActive: boolean }>`
  width: 2rem;
  height: 2rem;
  border-radius: 0.25rem;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  display: flex;
  align-items: center;
  justify-content: center;

  ${(props) =>
    props.isActive
      ? css`
          background: hsl(var(--background));
          color: hsl(var(--foreground));
          box-shadow: 0 1px 3px rgb(0 0 0 / 0.1);
        `
      : css`
          background: transparent;
          color: hsl(var(--muted-foreground));

          &:hover {
            background: hsl(var(--accent));
            color: hsl(var(--accent-foreground));
          }
        `}

  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px hsl(var(--ring));
  }
`;
