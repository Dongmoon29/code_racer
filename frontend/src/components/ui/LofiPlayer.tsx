import { useState, useEffect, useRef } from 'react';
import { Play, Pause, Volume2, VolumeX, X, Music2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AudioVisualizer } from './AudioVisualizer';

interface LofiPlayerProps {
  isCollapsed?: boolean;
  onPlayingChange?: (isPlaying: boolean) => void;
  onClose?: () => void;
}

// YouTube Player API Types
interface YTPlayer {
  playVideo: () => void;
  pauseVideo: () => void;
  loadVideoById: (videoId: string) => void;
  setVolume: (volume: number) => void;
  mute: () => void;
  unMute: () => void;
  destroy: () => void;
}

interface YTPlayerEvent {
  target: YTPlayer;
  data: number;
}

interface YTPlayerOptions {
  height: string;
  width: string;
  videoId: string;
  playerVars: {
    autoplay: number;
    controls: number;
    disablekb: number;
    fs: number;
    modestbranding: number;
    playsinline: number;
  };
  events: {
    onReady: (event: YTPlayerEvent) => void;
    onStateChange: (event: YTPlayerEvent) => void;
  };
}

declare global {
  interface Window {
    YT: {
      Player: new (elementId: string, options: YTPlayerOptions) => YTPlayer;
      PlayerState: {
        PLAYING: number;
        PAUSED: number;
      };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

// Popular lofi streams
const LOFI_STREAMS = [
  {
    id: 'jfKfPfyJRdk',
    title: 'Lofi Girl - beats to relax/study to',
    thumbnail: 'https://i.ytimg.com/vi/jfKfPfyJRdk/default.jpg',
  },
  {
    id: '4xDzrJKXOOY',
    title: 'Synthwave Radio',
    thumbnail: 'https://i.ytimg.com/vi/4xDzrJKXOOY/default.jpg',
  },
  {
    id: 'lTRiuFIWV54',
    title: 'Chillhop Radio',
    thumbnail: 'https://i.ytimg.com/vi/lTRiuFIWV54/default.jpg',
  },
];

export function LofiPlayer({
  isCollapsed = false,
  onPlayingChange,
  onClose,
}: LofiPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('lofi-player-volume');
      return saved ? Number(saved) : 30;
    }
    return 30;
  });
  const [isMuted, setIsMuted] = useState(false);
  const [currentStreamIndex, setCurrentStreamIndex] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('lofi-player-stream');
      return saved ? Number(saved) : 0;
    }
    return 0;
  });
  const playerRef = useRef<YTPlayer | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const playerIdRef = useRef<string>(
    `lofi-player-${Math.random().toString(36).substring(2, 11)}`
  );

  const currentStream = LOFI_STREAMS[currentStreamIndex];

  // Save volume to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('lofi-player-volume', volume.toString());
    }
  }, [volume]);

  // Save stream selection to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('lofi-player-stream', currentStreamIndex.toString());
    }
  }, [currentStreamIndex]);

  // Notify parent component of playing state changes
  useEffect(() => {
    if (onPlayingChange) {
      onPlayingChange(isPlaying);
    }
  }, [isPlaying, onPlayingChange]);

  const initPlayer = () => {
    if (!containerRef.current || playerRef.current) return;

    // Check if YouTube API is fully loaded
    if (
      !window.YT ||
      !window.YT.Player ||
      typeof window.YT.Player !== 'function'
    ) {
      return;
    }

    // Create a unique div for the player
    const playerDiv = document.createElement('div');
    playerDiv.id = playerIdRef.current;
    containerRef.current.appendChild(playerDiv);

    try {
      playerRef.current = new window.YT.Player(playerIdRef.current, {
        height: '0',
        width: '0',
        videoId: currentStream.id,
        playerVars: {
          autoplay: 0,
          controls: 0,
          disablekb: 1,
          fs: 0,
          modestbranding: 1,
          playsinline: 1,
        },
        events: {
          onReady: (event: YTPlayerEvent) => {
            event.target.setVolume(volume);
          },
          onStateChange: (event: YTPlayerEvent) => {
            if (event.data === window.YT.PlayerState.PLAYING) {
              setIsPlaying(true);
            } else if (event.data === window.YT.PlayerState.PAUSED) {
              setIsPlaying(false);
            }
          },
        },
      });
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to initialize YouTube player:', error);
      }
    }
  };

  // Load YouTube IFrame API
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if API is already loaded and Player is available
    if (
      window.YT &&
      window.YT.Player &&
      typeof window.YT.Player === 'function'
    ) {
      initPlayer();
      return;
    }

    // Check if script is already being loaded
    const existingScript = document.querySelector(
      'script[src="https://www.youtube.com/iframe_api"]'
    );
    if (existingScript) {
      // Wait for API to load
      const checkYT = setInterval(() => {
        if (
          window.YT &&
          window.YT.Player &&
          typeof window.YT.Player === 'function'
        ) {
          clearInterval(checkYT);
          initPlayer();
        }
      }, 100);

      // Timeout after 10 seconds
      const timeout = setTimeout(() => {
        clearInterval(checkYT);
        if (process.env.NODE_ENV === 'development') {
          console.error('YouTube IFrame API failed to load within timeout');
        }
      }, 10000);

      return () => {
        clearInterval(checkYT);
        clearTimeout(timeout);
      };
    }

    // Load YouTube IFrame API
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    tag.async = true;
    document.head.appendChild(tag);

    window.onYouTubeIframeAPIReady = () => {
      initPlayer();
    };

    return () => {
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch {
          // Ignore errors on cleanup
        }
        playerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reinitialize player when stream changes
  useEffect(() => {
    if (
      playerRef.current &&
      typeof playerRef.current.loadVideoById === 'function'
    ) {
      try {
        playerRef.current.loadVideoById(currentStream.id);
        if (isPlaying) {
          playerRef.current.playVideo();
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Failed to load video:', error);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStreamIndex]);

  const togglePlay = () => {
    if (!playerRef.current || typeof playerRef.current.playVideo !== 'function')
      return;

    try {
      if (isPlaying) {
        playerRef.current.pauseVideo();
      } else {
        playerRef.current.playVideo();
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to toggle playback:', error);
      }
    }
  };

  const toggleMute = () => {
    if (!playerRef.current || typeof playerRef.current.mute !== 'function')
      return;

    try {
      if (isMuted) {
        playerRef.current.unMute();
        setIsMuted(false);
      } else {
        playerRef.current.mute();
        setIsMuted(true);
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to toggle mute:', error);
      }
    }
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    if (
      playerRef.current &&
      typeof playerRef.current.setVolume === 'function'
    ) {
      try {
        playerRef.current.setVolume(newVolume);
        if (newVolume === 0) {
          setIsMuted(true);
        } else {
          setIsMuted(false);
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Failed to set volume:', error);
        }
      }
    }
  };

  const changeStream = (index: number) => {
    setCurrentStreamIndex(index);
  };

  return (
    <>
      {/* Hidden YouTube Player Container - Always rendered */}
      <div ref={containerRef} style={{ display: 'none' }} />

      {isCollapsed ? (
        <div className="p-2 border-t border-border/60">
          <button
            onClick={togglePlay}
            className="w-full p-2 rounded-md hover:bg-accent/40 transition-colors flex items-center justify-center"
            title={isPlaying ? 'Pause music' : 'Play music'}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 text-primary" />
            ) : (
              <Play className="w-5 h-5 text-muted-foreground" />
            )}
          </button>
        </div>
      ) : (
        <div className="border-t border-border/60 bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-sm shadow-lg overflow-hidden">
          {/* Header */}
          <div className="w-full px-4 py-3 flex items-center justify-between gap-2 border-b border-border/50">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Music2
                  className={cn(
                    'w-4 h-4 transition-colors',
                    isPlaying
                      ? 'text-primary animate-pulse'
                      : 'text-muted-foreground'
                  )}
                />
                {isPlaying && (
                  <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
                )}
              </div>
              <span className="text-sm font-semibold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Lofi Radio
              </span>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-accent/40 rounded-md transition-colors group"
                title="Close"
              >
                <X className="w-4 h-4 group-hover:rotate-90 transition-transform" />
              </button>
            )}
          </div>

          {/* Audio Visualizer */}
          <div className="px-4 py-3 bg-gradient-to-r from-primary/5 via-transparent to-primary/5">
            <AudioVisualizer isPlaying={isPlaying} barCount={24} />
          </div>

          {/* Controls */}
          <div className="px-4 pb-4 space-y-4">
            {/* Stream Selection */}
            <div className="space-y-1.5">
              <div className="text-xs font-medium text-muted-foreground mb-2 px-1">
                Stations
              </div>
              {LOFI_STREAMS.map((stream, index) => (
                <button
                  key={stream.id}
                  onClick={() => changeStream(index)}
                  className={cn(
                    'w-full text-left px-3 py-2 rounded-lg text-xs transition-all duration-200 cursor-pointer',
                    'border',
                    currentStreamIndex === index
                      ? 'bg-gradient-to-r from-primary/20 to-primary/10 border-primary/30 text-primary shadow-sm'
                      : 'border-border/30 hover:bg-accent/30 hover:border-accent text-muted-foreground'
                  )}
                >
                  <div className="flex items-center gap-2">
                    {currentStreamIndex === index && (
                      <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    )}
                    <span className="truncate">{stream.title}</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Playback Controls */}
            <div className="space-y-3">
              {/* Play/Pause Button */}
              <div className="flex items-center justify-center">
                <button
                  onClick={togglePlay}
                  className={cn(
                    'p-3 rounded-full transition-all duration-200',
                    'bg-gradient-to-br from-primary/20 to-primary/10',
                    'hover:from-primary/30 hover:to-primary/20',
                    'border border-primary/20',
                    'shadow-lg hover:shadow-xl',
                    isPlaying && 'animate-pulse'
                  )}
                  title={isPlaying ? 'Pause' : 'Play'}
                >
                  {isPlaying ? (
                    <Pause className="w-6 h-6 text-primary" />
                  ) : (
                    <Play className="w-6 h-6 text-primary ml-0.5" />
                  )}
                </button>
              </div>

              {/* Volume Control */}
              <div className="space-y-2 min-w-0">
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    onClick={toggleMute}
                    className={cn(
                      'p-2 rounded-lg transition-all duration-200 cursor-pointer',
                      'hover:bg-accent/40',
                      isMuted || volume === 0
                        ? 'text-muted-foreground'
                        : 'text-primary'
                    )}
                    title={isMuted ? 'Unmute' : 'Mute'}
                  >
                    {isMuted || volume === 0 ? (
                      <VolumeX className="w-4 h-4" />
                    ) : (
                      <Volume2 className="w-4 h-4" />
                    )}
                  </button>

                  <div className="flex-1 relative min-w-0">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={volume}
                      onChange={(e) =>
                        handleVolumeChange(Number(e.target.value))
                      }
                      className="w-full h-2 bg-gradient-to-r from-accent via-accent/80 to-accent rounded-full appearance-none cursor-pointer
                        [&::-webkit-slider-thumb]:appearance-none 
                        [&::-webkit-slider-thumb]:w-4 
                        [&::-webkit-slider-thumb]:h-4 
                        [&::-webkit-slider-thumb]:rounded-full 
                        [&::-webkit-slider-thumb]:bg-gradient-to-br 
                        [&::-webkit-slider-thumb]:from-primary 
                        [&::-webkit-slider-thumb]:to-primary/80
                        [&::-webkit-slider-thumb]:shadow-md
                        [&::-webkit-slider-thumb]:border-2
                        [&::-webkit-slider-thumb]:border-background
                        [&::-webkit-slider-thumb]:transition-all
                        [&::-webkit-slider-thumb]:hover:scale-110
                        [&::-moz-range-thumb]:w-4
                        [&::-moz-range-thumb]:h-4
                        [&::-moz-range-thumb]:rounded-full
                        [&::-moz-range-thumb]:bg-gradient-to-br
                        [&::-moz-range-thumb]:from-primary
                        [&::-moz-range-thumb]:to-primary/80
                        [&::-moz-range-thumb]:border-2
                        [&::-moz-range-thumb]:border-background
                        [&::-moz-range-thumb]:cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, hsl(var(--primary)) 0%, hsl(var(--primary)) ${volume}%, hsl(var(--accent)) ${volume}%, hsl(var(--accent)) 100%)`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
