import React, { FC, memo, useState } from 'react';
import Split from 'react-split';
import { EditorPane } from './EditorPane';
import { useSplitConfig } from './hooks/useSplitConfig';
import { LofiPlayer } from '@/components/ui/LofiPlayer';

interface EditorSplitProps {
  myCode: string;
  opponentCode: string;
  opponentName?: string;
  selectedLanguage: 'python' | 'javascript' | 'go';
  theme?: string;
  maximizedEditor: 'my' | 'opponent' | null;
  isResizing: boolean;
  sizesNormal: number[];
  showFullscreenButton?: boolean;
  gutterSize?: number;
  onCodeChange: (code: string) => void;
  onMaximizeToggle: (editor: 'my' | 'opponent') => void;
  onFullscreenToggle?: () => void;
  onDragStart: () => void;
  onDragEnd: (sizes: number[]) => void;
  isSinglePlayerMode?: boolean;
}

export const EditorSplit: FC<EditorSplitProps> = memo(
  ({
    myCode,
    opponentCode,
    opponentName,
    selectedLanguage,
    theme,
    maximizedEditor,
    isResizing,
    sizesNormal,
    showFullscreenButton = false,
    gutterSize = 6,
    onCodeChange,
    onFullscreenToggle,
    onDragStart,
    onDragEnd,
    isSinglePlayerMode = false,
  }) => {
    const [showMusicPlayer, setShowMusicPlayer] = useState(false);
    const [isMusicPlaying, setIsMusicPlaying] = useState(false);

    const splitConfig = useSplitConfig(
      maximizedEditor,
      sizesNormal,
      gutterSize
    );

    return (
      <>
        {isSinglePlayerMode ? (
          // Single player mode - only show one editor
          <EditorPane
            title="Me"
            code={myCode}
            language={selectedLanguage}
            theme={theme}
            isMinimized={false}
            isResizing={false}
            showFullscreenButton={showFullscreenButton}
            showMusicButton={true}
            isMusicPlaying={isMusicPlaying}
            onChange={onCodeChange}
            onFullscreenToggle={onFullscreenToggle}
            onMusicToggle={() => setShowMusicPlayer(!showMusicPlayer)}
          />
        ) : (
          // Multiplayer mode - show split editors
          <Split
            className="flex w-full h-full"
            direction="horizontal"
            {...splitConfig}
            onDragStart={onDragStart}
            onDragEnd={(sizes) => onDragEnd(sizes as number[])}
          >
            <EditorPane
              title="Me"
              code={myCode}
              language={selectedLanguage}
              theme={theme}
              isMinimized={maximizedEditor === 'opponent'}
              isResizing={isResizing}
              showFullscreenButton={showFullscreenButton}
              showMusicButton={true}
              isMusicPlaying={isMusicPlaying}
              onChange={onCodeChange}
              onFullscreenToggle={onFullscreenToggle}
              onMusicToggle={() => setShowMusicPlayer(!showMusicPlayer)}
            />
            <EditorPane
              title={opponentName ?? ''}
              code={opponentCode}
              language={selectedLanguage}
              theme={theme}
              readOnly={true}
              isMinimized={maximizedEditor === 'my'}
              isResizing={isResizing}
            />
          </Split>
        )}

        {/* Music Player - rendered outside editors to prevent unmounting */}
        {showMusicPlayer && (
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowMusicPlayer(false)}
          />
        )}
        <div
          className={`fixed top-16 right-4 z-50 bg-[hsl(var(--card))] border rounded-lg shadow-lg w-64 transition-opacity ${
            showMusicPlayer ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <LofiPlayer
            onPlayingChange={setIsMusicPlaying}
            onClose={() => setShowMusicPlayer(false)}
          />
        </div>
      </>
    );
  }
);

EditorSplit.displayName = 'EditorSplit';
