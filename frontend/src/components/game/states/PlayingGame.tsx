import { FC, memo, useCallback, useEffect, useState, useRef } from "react";
import dynamic from "next/dynamic";
import { Code2, Eye, FileText } from "lucide-react";
import { Game } from "@/types";
import { SubmissionProgress } from "@/types/websocket";
import { useTheme } from "next-themes";
import { ProblemDetailsPane } from "./ProblemDetailsPane";
import { EditorPane } from "./EditorPane";
import { FullscreenOverlay } from "./FullscreenOverlay";
import { ProblemEditorSplit } from "./CodeEditorSplitProps";
import { useFullscreen } from "@/contexts/FullscreenContext";
import { useLofiPlayer } from "@/contexts/LofiPlayerContext";
import { ResizeHandle } from "../ResizeHandle";
import { useToast } from "@/components/ui/Toast";

const LofiPlayer = dynamic(
  () =>
    import("@/components/ui/LofiPlayer").then((module) => module.LofiPlayer),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-24 items-center justify-center text-sm text-[var(--gray-11)]">
        Loading player…
      </div>
    ),
  },
);

interface PlayingGameProps {
  game: Game;
  myCode: string;
  opponentCode: string;
  opponentName?: string;
  selectedLanguage: "python" | "javascript" | "go";
  opponentLanguage: "python" | "javascript" | "go";
  isSubmitting: boolean;
  submissionProgress: SubmissionProgress;
  onCodeChange: (code: string) => void;
  onLanguageChange: (language: "python" | "javascript" | "go") => void;
  onSubmitCode: () => void;
}

export const PlayingGame: FC<PlayingGameProps> = memo(
  ({
    game,
    myCode,
    opponentCode,
    opponentName,
    selectedLanguage,
    opponentLanguage,
    isSubmitting,
    submissionProgress,
    onCodeChange,
    onLanguageChange,
    onSubmitCode,
  }) => {
    const { theme } = useTheme();
    const { isFullscreen, toggleFullscreen } = useFullscreen();
    const { showMusicPlayer, setShowMusicPlayer, setIsMusicPlaying } =
      useLofiPlayer();
    const { showToast } = useToast();
    const [maximizedEditor, setMaximizedEditor] = useState<
      "my" | "opponent" | null
    >(null);
    const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(true);
    const [sizesNormal, setSizesNormal] = useState<number[]>([50, 50]);
    const [isResizing, setIsResizing] = useState(false);
    const [problemPaneWidth, setProblemPaneWidth] = useState(25); // percentage
    const [isProblemPaneResizing, setIsProblemPaneResizing] = useState(false);
    const [isMobile, setIsMobile] = useState(
      () =>
        typeof window !== "undefined" &&
        window.matchMedia("(max-width: 767px)").matches,
    );
    const [mobileView, setMobileView] = useState<
      "problem" | "editor" | "opponent"
    >("editor");
    const hasOpenedMusicPlayer = useRef(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const fullscreenContainerRef = useRef<HTMLDivElement>(null);

    const isSinglePlayerMode = game.mode === "single";

    useEffect(() => {
      const mediaQuery = window.matchMedia("(max-width: 767px)");
      const updateMobileState = (
        event: MediaQueryList | MediaQueryListEvent,
      ) => setIsMobile(event.matches);

      updateMobileState(mediaQuery);
      mediaQuery.addEventListener("change", updateMobileState);
      return () => mediaQuery.removeEventListener("change", updateMobileState);
    }, []);

    if (showMusicPlayer) {
      hasOpenedMusicPlayer.current = true;
    }

    const handleMaximizeToggle = useCallback((editor: "my" | "opponent") => {
      setMaximizedEditor((current) => (current === editor ? null : editor));
    }, []);

    const handleToggleDescription = useCallback(() => {
      setIsDescriptionExpanded((prev) => !prev);
    }, []);

    const handleMobileRun = useCallback(() => {
      setMobileView("problem");
      onSubmitCode();
    }, [onSubmitCode]);

    const handleToggleFullscreen = useCallback(async () => {
      if (!fullscreenContainerRef.current) return;

      try {
        await toggleFullscreen(fullscreenContainerRef.current);
      } catch {
        showToast({
          title: "Fullscreen Error",
          message: "Failed to toggle fullscreen mode",
          variant: "error",
        });
      }
    }, [toggleFullscreen, showToast]);

    const handleProblemPaneResize = useCallback((deltaX: number) => {
      if (!containerRef.current) return;

      const containerWidth = containerRef.current.offsetWidth;
      const deltaPercent = (deltaX / containerWidth) * 100;

      setProblemPaneWidth((prevWidth) => {
        const newWidth = prevWidth + deltaPercent;
        // Min 15%, Max 40%
        return Math.max(15, Math.min(40, newWidth));
      });
    }, []);

    const handleProblemPaneResizeStart = useCallback(() => {
      setIsProblemPaneResizing(true);
      document.body.classList.add("resizing");
    }, []);

    const handleProblemPaneResizeEnd = useCallback(() => {
      setIsProblemPaneResizing(false);
      document.body.classList.remove("resizing");
    }, []);

    // ESC key is handled automatically by browser fullscreen API
    // No manual ESC handler needed

    return (
      <div
        ref={fullscreenContainerRef}
        className="flex flex-col h-full overflow-hidden"
      >
        {!isFullscreen && isMobile ? (
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <div
              role="tablist"
              aria-label="Game workspace"
              className={isSinglePlayerMode
                ? "grid shrink-0 grid-cols-2 gap-1 border-b border-[var(--gray-6)] bg-[var(--gray-2)] p-1.5"
                : "grid shrink-0 grid-cols-3 gap-1 border-b border-[var(--gray-6)] bg-[var(--gray-2)] p-1.5"}
            >
              <button
                type="button"
                role="tab"
                aria-selected={mobileView === "problem"}
                onClick={() => setMobileView("problem")}
                className={`flex min-h-10 items-center justify-center gap-1.5 rounded-md px-2 text-xs font-medium transition-colors ${
                  mobileView === "problem"
                    ? "bg-[var(--accent-4)] text-[var(--accent-11)]"
                    : "text-[var(--gray-11)] hover:bg-[var(--gray-4)]"
                }`}
              >
                <FileText className="h-4 w-4" />
                Problem
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mobileView === "editor"}
                onClick={() => setMobileView("editor")}
                className={`flex min-h-10 items-center justify-center gap-1.5 rounded-md px-2 text-xs font-medium transition-colors ${
                  mobileView === "editor"
                    ? "bg-[var(--accent-4)] text-[var(--accent-11)]"
                    : "text-[var(--gray-11)] hover:bg-[var(--gray-4)]"
                }`}
              >
                <Code2 className="h-4 w-4" />
                My code
              </button>
              {!isSinglePlayerMode && (
                <button
                  type="button"
                  role="tab"
                  aria-selected={mobileView === "opponent"}
                  onClick={() => setMobileView("opponent")}
                  className={`flex min-h-10 items-center justify-center gap-1.5 rounded-md px-2 text-xs font-medium transition-colors ${
                    mobileView === "opponent"
                      ? "bg-[var(--accent-4)] text-[var(--accent-11)]"
                      : "text-[var(--gray-11)] hover:bg-[var(--gray-4)]"
                  }`}
                >
                  <Eye className="h-4 w-4" />
                  Rival
                </button>
              )}
            </div>

            <div className="min-h-0 flex-1 overflow-hidden p-1.5">
              {mobileView === "problem" && (
                <ProblemDetailsPane
                  isExpanded
                  title={game.problem.title}
                  description={game.problem.description}
                  examples={game.problem.examples}
                  constraints={game.problem.constraints}
                  testCases={game.problem.test_cases}
                  ioSchema={game.problem.io_schema}
                  submissionProgress={submissionProgress}
                  onToggle={handleToggleDescription}
                  showCollapseButton={false}
                />
              )}
              {mobileView === "editor" && (
                <EditorPane
                  title="Me"
                  code={myCode}
                  language={selectedLanguage}
                  theme={theme}
                  isMinimized={false}
                  isResizing={false}
                  showMusicButton
                  showLanguageSelector
                  onLanguageChange={onLanguageChange}
                  onChange={onCodeChange}
                  onRun={handleMobileRun}
                  runDisabled={isSubmitting}
                />
              )}
              {!isSinglePlayerMode && mobileView === "opponent" && (
                <EditorPane
                  title={opponentName ?? "Opponent"}
                  code={opponentCode}
                  language={opponentLanguage}
                  theme={theme}
                  readOnly
                  isMinimized={false}
                  isResizing={false}
                />
              )}
            </div>
          </div>
        ) : !isFullscreen ? (
          <div
            ref={containerRef}
            className="flex-1 flex min-h-0 overflow-hidden game-editor-container"
            style={{ width: "100%" }}
          >
            {/* Problem Description Pane */}
            <div
              className={`h-full flex flex-col ${
                isDescriptionExpanded ? "" : "w-[40px]"
              }`}
              style={{
                width: isDescriptionExpanded
                  ? `${problemPaneWidth}%`
                  : undefined,
                transition: isDescriptionExpanded ? "none" : "all 300ms",
              }}
            >
              <div className="flex-1 min-h-0 h-full overflow-hidden">
                <ProblemDetailsPane
                  isExpanded={isDescriptionExpanded}
                  title={game.problem.title}
                  description={game.problem.description}
                  examples={game.problem.examples}
                  constraints={game.problem.constraints}
                  testCases={game.problem.test_cases}
                  ioSchema={game.problem.io_schema}
                  submissionProgress={submissionProgress}
                  onToggle={handleToggleDescription}
                />
              </div>
            </div>

            {/* Resize Handle for Problem Pane */}
            {isDescriptionExpanded && (
              <div className="flex items-center">
                <ResizeHandle
                  onResize={handleProblemPaneResize}
                  onResizeStart={handleProblemPaneResizeStart}
                  onResizeEnd={handleProblemPaneResizeEnd}
                />
              </div>
            )}

            {/* Editor Panes */}
            <div className="flex-1 relative min-h-0 overflow-hidden">
              <ProblemEditorSplit
                myCode={myCode}
                opponentCode={opponentCode}
                opponentName={opponentName}
                selectedLanguage={selectedLanguage}
                opponentLanguage={opponentLanguage}
                theme={theme}
                maximizedEditor={maximizedEditor}
                isResizing={isResizing}
                sizesNormal={sizesNormal}
                showFullscreenButton={true}
                onCodeChange={onCodeChange}
                onLanguageChange={onLanguageChange}
                onFullscreenToggle={handleToggleFullscreen}
                onRun={onSubmitCode}
                runDisabled={isSubmitting}
                onDragStart={() => {
                  setIsResizing(true);
                  document.body.classList.add("resizing");
                }}
                onDragEnd={(sizes) => {
                  setIsResizing(false);
                  setSizesNormal(sizes);
                  document.body.classList.remove("resizing");
                }}
                isSinglePlayerMode={isSinglePlayerMode}
              />
              {/* Overlay during problem pane resize to prevent editor interference */}
              {isProblemPaneResizing && (
                <div className="absolute inset-0 bg-transparent pointer-events-none z-50" />
              )}
            </div>
          </div>
        ) : (
          <FullscreenOverlay
            myCode={myCode}
            opponentCode={isSinglePlayerMode ? "" : opponentCode}
            opponentName={isSinglePlayerMode ? "" : opponentName}
            selectedLanguage={selectedLanguage}
            opponentLanguage={
              isSinglePlayerMode ? selectedLanguage : opponentLanguage
            }
            theme={theme}
            maximizedEditor={isSinglePlayerMode ? null : maximizedEditor}
            isDescriptionExpanded={isDescriptionExpanded}
            problemTitle={game.problem.title}
            problemDescription={game.problem.description}
            problemExamples={game.problem.examples}
            problemConstraints={game.problem.constraints}
            problemTestCases={game.problem.test_cases}
            problemIOSchema={game.problem.io_schema}
            onCodeChange={onCodeChange}
            onLanguageChange={onLanguageChange}
            onMaximizeToggle={
              isSinglePlayerMode ? () => {} : handleMaximizeToggle
            }
            onToggleDescription={handleToggleDescription}
            onClose={handleToggleFullscreen}
            isSinglePlayerMode={isSinglePlayerMode}
            onRun={onSubmitCode}
            submissionProgress={submissionProgress}
            isSubmitting={isSubmitting}
          />
        )}

        {/* Global LofiPlayer - always rendered to prevent unmounting */}
        {showMusicPlayer && (
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowMusicPlayer(false)}
          />
        )}
        <div
          className={`fixed top-16 right-4 z-50 bg-[var(--color-panel)] border border-[var(--gray-6)] rounded-md shadow-lg w-64 transition-opacity overflow-hidden ${
            showMusicPlayer ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {hasOpenedMusicPlayer.current && (
            <LofiPlayer
              onPlayingChange={setIsMusicPlaying}
              onClose={() => setShowMusicPlayer(false)}
            />
          )}
        </div>
      </div>
    );
  },
);

PlayingGame.displayName = "PlayingGame";
