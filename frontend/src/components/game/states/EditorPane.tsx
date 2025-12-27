import { FC, memo, useState, useRef, useEffect } from 'react';
import { Expand, Minimize, Play, Music, Settings, Loader2 } from 'lucide-react';
import CodeEditor from '../CodeEditor';
import LanguageSelector from '../LanguageSelector';
import { useFullscreen } from '@/contexts/FullscreenContext';
import { useLofiPlayer } from '@/contexts/LofiPlayerContext';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

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
  showLanguageSelector?: boolean;
  onLanguageChange?: (language: 'python' | 'javascript' | 'go') => void;
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
    showMusicButton = false,
    showLanguageSelector = false,
    onLanguageChange,
    onChange,
    onFullscreenToggle,
    onRun,
    runDisabled = false,
  }) => {
    const { isFullscreen } = useFullscreen();
    const { isMusicPlaying, setShowMusicPlayer } = useLofiPlayer();
    const [showSettings, setShowSettings] = useState(false);
    const settingsRef = useRef<HTMLDivElement>(null);

    const headerClass = `bg-[var(--gray-3)] px-4 py-2 flex items-center border-b border-[var(--gray-6)] rounded-t-md ${
      isMinimized ? 'justify-center' : 'justify-between'
    }`;

    // 외부 클릭 시 설정 메뉴 닫기
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          settingsRef.current &&
          !settingsRef.current.contains(event.target as Node)
        ) {
          setShowSettings(false);
        }
      };

      if (showSettings) {
        document.addEventListener('mousedown', handleClickOutside);
      }

      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, [showSettings]);

    // Keep the editor mounted even when minimized to allow live updates.
    // Use height collapse instead of display:none to avoid breaking editor updates.
    // The outer container handles border radius and clipping so the inner editor
    // visuals match the rounded corners.
    const contentClass = `${
      isMinimized ? 'h-0' : 'flex-1 min-h-0'
    } rounded-b-md overflow-hidden`;

    return (
      <div className="border rounded-md min-w-0 h-full flex flex-col relative">
        <div className={`${headerClass} shrink-0`}>
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
                className={`cursor-pointer p-1 rounded-sm transition-colors shrink-0 ${
                  runDisabled
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:text-[var(--color-text)]'
                }`}
                title="Run Submission"
              >
                {runDisabled ? (
                  <Loader2 className="w-4 h-4 animate-spin text-[var(--accent-9)]" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
              </button>
            )}
            {showMusicButton && (
              <button
                onClick={() => setShowMusicPlayer(true)}
                className="cursor-pointer p-1 hover:text-[var(--color-text)] rounded-sm transition-colors shrink-0"
                title="Toggle Music Player"
              >
                <Music
                  className={`w-4 h-4 ${
                    isMusicPlaying ? 'animate-pulse text-[var(--accent-9)]' : ''
                  }`}
                />
              </button>
            )}
            {showFullscreenButton && onFullscreenToggle && (
              <button
                onClick={onFullscreenToggle}
                className="cursor-pointer p-1 hover:text-[var(--color-text)] rounded-sm transition-colors shrink-0"
                title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
              >
                {isFullscreen ? (
                  <Minimize className="w-4 h-4" />
                ) : (
                  <Expand className="w-4 h-4" />
                )}
              </button>
            )}
            {/* Settings Button */}
            <div className="relative" ref={settingsRef}>
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="cursor-pointer p-1 hover:text-[var(--color-text)] rounded-sm transition-colors shrink-0"
                title="Settings"
              >
                <Settings className="w-4 h-4" />
              </button>
              {showSettings && (
                <div className="absolute right-0 top-full mt-2 bg-[var(--color-panel)] border border-[var(--gray-6)] rounded-md shadow-lg px-2 py-0.5 z-50 min-w-[160px]">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-medium">Theme</span>
                    <ThemeToggle />
                  </div>
                </div>
              )}
            </div>
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
