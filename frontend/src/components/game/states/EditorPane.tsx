import React, { FC, memo } from 'react';
import { Expand, Minimize, Play } from 'lucide-react';
import CodeEditor from '../CodeEditor';
import { useFullscreen } from '@/contexts/FullscreenContext';

interface EditorPaneProps {
  title: string;
  code: string;
  language: 'python' | 'javascript' | 'go';
  theme?: string;
  readOnly?: boolean;
  isMinimized: boolean;
  isResizing: boolean;
  showFullscreenButton?: boolean;
  onChange?: (code: string) => void;
  onFullscreenToggle?: () => void;
  onRun?: () => void;
  runDisabled?: boolean;
}

export const EditorPane: FC<EditorPaneProps> = memo(
  ({
    title,
    code,
    language,
    theme,
    readOnly = false,
    isMinimized,
    isResizing,
    showFullscreenButton = false,
    onChange,
    onFullscreenToggle,
    onRun,
    runDisabled = false,
  }) => {
    const { isFullscreen } = useFullscreen();
    const headerClass = `bg-[hsl(var(--muted))] px-4 py-2 flex items-center ${
      isMinimized ? 'justify-center' : 'justify-between'
    }`;

    // Keep the editor mounted even when minimized to allow live updates.
    // Use height collapse instead of display:none to avoid breaking editor updates.
    const contentClass = isMinimized
      ? 'h-0 overflow-hidden'
      : 'h-[calc(100%-40px)] overflow-auto';

    return (
      <div className="border rounded-lg min-w-0 h-full flex flex-col">
        <div className={headerClass}>
          <span
            className={`font-medium truncate ${isMinimized ? 'hidden' : ''}`}
          >
            {title}
          </span>
          <div className="flex items-center space-x-2">
            {onRun && (
              <button
                onClick={onRun}
                disabled={runDisabled}
                className={`cursor-pointer p-1 rounded-md transition-colors shrink-0 ${
                  runDisabled
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:text-[hsl(var(--muted-foreground))]'
                }`}
                title="Run Submission"
              >
                <Play className="w-4 h-4" />
              </button>
            )}
            {showFullscreenButton && onFullscreenToggle && (
              <button
                onClick={onFullscreenToggle}
                className="cursor-pointer p-1 hover:text-[hsl(var(--muted-foreground))] rounded-md transition-colors shrink-0"
                title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
              >
                {isFullscreen ? (
                  <Minimize className="w-4 h-4" />
                ) : (
                  <Expand className="w-4 h-4" />
                )}
              </button>
            )}
          </div>
        </div>
        <div className={contentClass}>
          <CodeEditor
            value={code}
            onChange={onChange}
            language={language}
            theme={theme}
            readOnly={readOnly}
            isResizing={isResizing}
          />
        </div>
      </div>
    );
  }
);

EditorPane.displayName = 'EditorPane';
