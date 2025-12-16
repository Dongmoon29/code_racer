import React, { FC, memo } from 'react';
import { Expand, Minimize, Play, Music } from 'lucide-react';
import CodeEditor from '../CodeEditor';
import LanguageSelector from '../LanguageSelector';
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
  showMusicButton?: boolean;
  isMusicPlaying?: boolean;
  showLanguageSelector?: boolean;
  onLanguageChange?: (language: 'python' | 'javascript' | 'go') => void;
  onChange?: (code: string) => void;
  onFullscreenToggle?: () => void;
  onRun?: () => void;
  runDisabled?: boolean;
  onMusicToggle?: () => void;
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
    showMusicButton = false,
    isMusicPlaying = false,
    showLanguageSelector = false,
    onLanguageChange,
    onChange,
    onFullscreenToggle,
    onRun,
    runDisabled = false,
    onMusicToggle,
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
      <div className="border rounded-lg min-w-0 h-full flex flex-col relative">
        <div className={headerClass}>
          <div className="flex items-center gap-3">
            <span
              className={`font-medium truncate ${isMinimized ? 'hidden' : ''}`}
            >
              {title}
            </span>
            {showLanguageSelector && onLanguageChange && !isMinimized && (
              <LanguageSelector
                selectedLanguage={language}
                onChange={onLanguageChange}
              />
            )}
          </div>
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
            {showMusicButton && onMusicToggle && (
              <button
                onClick={onMusicToggle}
                className="cursor-pointer p-1 hover:text-[hsl(var(--muted-foreground))] rounded-md transition-colors shrink-0"
                title="Toggle Music Player"
              >
                <Music
                  className={`w-4 h-4 ${
                    isMusicPlaying ? 'animate-pulse text-[hsl(var(--primary))]' : ''
                  }`}
                />
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
