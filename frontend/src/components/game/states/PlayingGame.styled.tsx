import styled, { css } from 'styled-components';

// Game container
export const GameContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
`;

// Game header
export const GameHeader = styled.div`
  padding: 1rem;
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 1rem;
  margin-bottom: 1rem;
`;

export const GameTitleSection = styled.div`
  grid-column: span 12;

  @media (min-width: 768px) {
    grid-column: span 8;
  }
`;

export const GameTitle = styled.h1`
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
  margin-bottom: 0.5rem;
`;

export const GameControls = styled.div`
  grid-column: span 12;

  @media (min-width: 768px) {
    grid-column: span 4;
  }

  display: flex;
  justify-content: flex-end;
  align-items: flex-start;
`;

// Main content area
export const MainContent = styled.div`
  flex: 1;
  padding: 0 1rem;
  display: flex;
  min-height: 0;
`;

// Problem description section
export const ProblemDescription = styled.div<{ isExpanded: boolean }>`
  transition: all 0.3s ease-in-out;
  overflow: auto;

  ${(props) =>
    props.isExpanded
      ? css`
          flex: 0 0 33.333%;
          max-width: 33.333%;
        `
      : css`
          flex: 0 0 40px;
          max-width: 40px;
        `}
`;

export const ProblemCard = styled.div`
  background: hsl(var(--muted));
  border-radius: 0.5rem;
  height: 100%;
`;

export const ProblemHeader = styled.div`
  padding: 0.5rem 1rem;
  border-bottom: 1px solid hsl(var(--border));
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

export const ProblemTitle = styled.span`
  font-weight: 500;
`;

export const MinimizeButton = styled.button`
  padding: 0.25rem;
  border: none;
  background: transparent;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.2s ease-in-out;

  &:hover {
    background: hsl(var(--accent));
  }

  svg {
    width: 1rem;
    height: 1rem;
  }
`;

export const ProblemContent = styled.div`
  padding: 1rem;
  height: calc(100% - 3rem);
  overflow-y: auto;
`;

export const ProblemSection = styled.div`
  margin-bottom: 1rem;

  &:last-child {
    margin-bottom: 0;
  }
`;

export const ProblemSectionTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
`;

export const ProblemSectionSubtitle = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
`;

export const ProblemText = styled.p`
  white-space: pre-line;
  margin: 0;
  line-height: 1.6;
`;

export const ProblemCode = styled.pre`
  padding: 0.75rem;
  border-radius: 0.375rem;
  background: hsl(var(--muted));
  white-space: pre-wrap;
  margin: 0;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 0.875rem;
  line-height: 1.5;
`;

// Code editors container - flex로 남은 공간 모두 차지
export const CodeEditorsContainer = styled.div`
  display: flex;
  gap: 1rem;
  margin-left: 1rem;
  flex: 1;
  transition: all 0.3s ease-in-out;
`;

// Individual code editor - 기존 resize 로직 복원
export const CodeEditorWrapper = styled.div<{
  maximized: boolean;
  isOpponent: boolean;
  maximizedEditor: 'my' | 'opponent' | null;
}>`
  transition: all 0.3s ease-in-out;
  border: 1px solid hsl(var(--border));
  border-radius: 0.5rem;
  overflow: hidden;

  ${(props) => {
    if (props.maximizedEditor === 'opponent') {
      return css`
        width: 40px;
      `;
    }

    if (props.maximizedEditor === 'my') {
      return css`
        width: 100%;
      `;
    }

    return css`
      width: calc(50% - 0.5rem);
    `;
  }}
`;

export const CodeEditorHeader = styled.div<{ maximized: boolean }>`
  background: hsl(var(--muted));
  padding: 0.5rem 1rem;
  border-bottom: 1px solid hsl(var(--border));
  display: flex;
  align-items: center;

  ${(props) =>
    props.maximized &&
    css`
      justify-content: center;
    `}

  ${(props) =>
    !props.maximized &&
    css`
      justify-content: space-between;
    `}
`;

export const CodeEditorTitle = styled.span<{ maximized: boolean }>`
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  ${(props) =>
    props.maximized &&
    css`
      display: none;
    `}
`;

export const CodeEditorControls = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

export const VimModeToggle = styled.button<{ isActive: boolean }>`
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  font-weight: 500;
  border-radius: 0.25rem;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease-in-out;

  ${(props) =>
    props.isActive
      ? css`
          background: hsl(142 88% 22% / 0.1);
          color: hsl(142 88% 22%);
        `
      : css`
          background: hsl(195 60% 36% / 0.1);
          color: hsl(195 60% 36%);
        `}

  &:hover {
    opacity: 0.8;
  }
`;

export const MaximizeButton = styled.button`
  padding: 0.25rem;
  border: none;
  background: transparent;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  flex-shrink: 0;

  &:hover {
    background: hsl(var(--accent));
  }

  svg {
    width: 1rem;
    height: 1rem;
  }
`;

export const CodeEditorContent = styled.div<{ maximized: boolean }>`
  height: calc(100% - 40px);
  overflow: auto;

  ${(props) =>
    props.maximized &&
    css`
      display: none;
    `}
`;

// Minimized problem button
export const MinimizedProblemButton = styled.button`
  width: 100%;
  height: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: hsl(var(--muted-foreground));
  border-radius: 0.5rem;
  border: none;
  background: transparent;
  cursor: pointer;
  transition: all 0.2s ease-in-out;

  &:hover {
    color: white;
    transform: scale(1.1);
  }

  svg {
    width: 1.5rem;
    height: 1.5rem;
  }
`;
