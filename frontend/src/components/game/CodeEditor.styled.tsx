import styled, { css } from 'styled-components';

// Code editor container
export const CodeEditorContainer = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
`;

// Editor content area
export const EditorContent = styled.div`
  flex: 1;
  overflow: auto;
  position: relative;
  
  /* CodeMirror editor styles */
  .cm-editor {
    height: 100%;
    font-family: 'JetBrains Mono', 'Fira Code', 'Monaco', 'Consolas', monospace;
    font-size: 14px;
    line-height: 1.5;
  }
  
  .cm-editor .cm-scroller {
    font-family: inherit;
  }
  
  /* Custom scrollbar */
  .cm-editor .cm-scroller::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  
  .cm-editor .cm-scroller::-webkit-scrollbar-track {
    background: hsl(var(--muted));
    border-radius: 4px;
  }
  
  .cm-editor .cm-scroller::-webkit-scrollbar-thumb {
    background: hsl(var(--muted-foreground));
    border-radius: 4px;
    
    &:hover {
      background: hsl(var(--muted-foreground) / 0.8);
    }
  }
  
  /* Editor focus styles */
  .cm-editor.cm-focused {
    outline: none;
  }
  
  /* Line numbers */
  .cm-gutters {
    background: hsl(var(--muted));
    border-right: 1px solid hsl(var(--border));
    color: hsl(var(--muted-foreground));
  }
  
  .cm-lineNumbers .cm-gutterElement {
    padding: 0 8px;
    min-width: 20px;
    text-align: right;
  }
  
  /* Active line highlighting */
  .cm-activeLine {
    background: hsl(var(--accent) / 0.1);
  }
  
  .cm-activeLineGutter {
    background: hsl(var(--accent) / 0.2);
    color: hsl(var(--accent-foreground));
  }
  
  /* Selection */
  .cm-selectionBackground {
    background: hsl(var(--primary) / 0.2);
  }
  
  /* Cursor */
  .cm-cursor {
    border-left: 2px solid hsl(var(--primary));
    border-right: none;
    margin-left: -1px;
  }
  
  /* Matching brackets */
  .cm-matchingBracket {
    border-bottom: 1px solid hsl(var(--primary));
    color: hsl(var(--primary));
  }
  
  .cm-nonmatchingBracket {
    border-bottom: 1px solid hsl(var(--destructive));
    color: hsl(var(--destructive));
  }
  
  /* Autocomplete */
  .cm-tooltip.cm-tooltip-autocomplete {
    background: hsl(var(--popover));
    border: 1px solid hsl(var(--border));
    border-radius: 0.5rem;
    box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
    max-height: 200px;
    overflow-y: auto;
  }
  
  .cm-tooltip.cm-tooltip-autocomplete ul {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  
  .cm-tooltip.cm-tooltip-autocomplete li {
    padding: 0.5rem 1rem;
    cursor: pointer;
    border-radius: 0.25rem;
    margin: 0.125rem;
    
    &:hover {
      background: hsl(var(--accent));
    }
    
    &.cm-selected {
      background: hsl(var(--primary));
      color: hsl(var(--primary-foreground));
    }
  }
  
  /* Vim mode indicator */
  .cm-vim-panel {
    background: hsl(var(--muted));
    border-top: 1px solid hsl(var(--border));
    color: hsl(var(--foreground));
    padding: 0.25rem 0.5rem;
    font-size: 0.875rem;
    font-family: 'JetBrains Mono', monospace;
  }
  
  /* Read-only styles */
  .cm-editor.cm-readonly {
    opacity: 0.8;
    cursor: not-allowed;
    
    .cm-content {
      user-select: none;
    }
  }
  
  /* Error highlighting */
  .cm-error {
    background: hsl(var(--destructive) / 0.1);
    border-bottom: 1px solid hsl(var(--destructive));
  }
  
  /* Warning highlighting */
  .cm-warning {
    background: hsl(48 96% 53% / 0.1);
    border-bottom: 1px solid hsl(48 96% 53%);
  }
  
  /* Info highlighting */
  .cm-info {
    background: hsl(217 91% 60% / 0.1);
    border-bottom: 1px solid hsl(217 91% 60%);
  }
`;

// Editor toolbar
export const EditorToolbar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem;
  background: hsl(var(--muted));
  border-bottom: 1px solid hsl(var(--border));
  border-radius: 0.5rem 0.5rem 0 0;
`;

export const ToolbarLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

export const ToolbarRight = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

export const ToolbarButton = styled.button<{ isActive?: boolean }>`
  padding: 0.25rem 0.5rem;
  border: none;
  background: transparent;
  border-radius: 0.25rem;
  cursor: pointer;
  font-size: 0.75rem;
  font-weight: 500;
  transition: all 0.2s ease-in-out;
  
  ${props => props.isActive
    ? css`
        background: hsl(var(--primary));
        color: hsl(var(--primary-foreground));
      `
    : css`
        color: hsl(var(--muted-foreground));
        
        &:hover {
          background: hsl(var(--accent));
          color: hsl(var(--accent-foreground));
        }
      `
  }
`;

export const LanguageIndicator = styled.span`
  font-size: 0.75rem;
  font-weight: 500;
  color: hsl(var(--muted-foreground));
  padding: 0.25rem 0.5rem;
  background: hsl(var(--background));
  border-radius: 0.25rem;
  border: 1px solid hsl(var(--border));
`;

export const StatusBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.25rem 0.5rem;
  background: hsl(var(--muted));
  border-top: 1px solid hsl(var(--border));
  border-radius: 0 0 0.5rem 0.5rem;
  font-size: 0.75rem;
  color: hsl(var(--muted-foreground));
`;

export const StatusLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

export const StatusRight = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

export const StatusItem = styled.span`
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

// Editor with line numbers
export const EditorWithLineNumbers = styled(EditorContent)`
  .cm-gutters {
    display: flex;
  }
`;

// Editor without line numbers
export const EditorWithoutLineNumbers = styled(EditorContent)`
  .cm-gutters {
    display: none;
  }
`;

// Compact editor
export const CompactEditor = styled(CodeEditorContainer)`
  ${EditorContent} {
    .cm-editor {
      font-size: 12px;
      line-height: 1.4;
    }
    
    .cm-gutters {
      font-size: 11px;
    }
  }
`;

// Large editor
export const LargeEditor = styled(CodeEditorContainer)`
  ${EditorContent} {
    .cm-editor {
      font-size: 16px;
      line-height: 1.6;
    }
    
    .cm-gutters {
      font-size: 14px;
    }
  }
`;
