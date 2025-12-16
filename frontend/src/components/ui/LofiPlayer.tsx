import { useState, useEffect, useRef } from 'react';
import { Play, Pause, Volume2, VolumeX, X } from 'lucide-react';
import { cn } from '@/lib/utils';

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

export function LofiPlayer({ isCollapsed = false, onPlayingChange, onClose }: LofiPlayerProps) {
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
  const playerIdRef = useRef<string>(`lofi-player-${Math.random().toString(36).substring(2, 11)}`);

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
    if (!containerRef.current || playerRef.current || !window.YT) return;

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
      console.error('Failed to initialize YouTube player:', error);
    }
  };

  // Load YouTube IFrame API
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if API is already loaded
    if (window.YT) {
      initPlayer();
      return;
    }

    // Check if script is already being loaded
    const existingScript = document.querySelector('script[src="https://www.youtube.com/iframe_api"]');
    if (existingScript) {
      // Wait for API to load
      const checkYT = setInterval(() => {
        if (window.YT) {
          clearInterval(checkYT);
          initPlayer();
        }
      }, 100);
      return () => clearInterval(checkYT);
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
    if (playerRef.current && typeof playerRef.current.loadVideoById === 'function') {
      try {
        playerRef.current.loadVideoById(currentStream.id);
        if (isPlaying) {
          playerRef.current.playVideo();
        }
      } catch (error) {
        console.error('Failed to load video:', error);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStreamIndex]);

  const togglePlay = () => {
    if (!playerRef.current || typeof playerRef.current.playVideo !== 'function') return;

    try {
      if (isPlaying) {
        playerRef.current.pauseVideo();
      } else {
        playerRef.current.playVideo();
      }
    } catch (error) {
      console.error('Failed to toggle playback:', error);
    }
  };

  const toggleMute = () => {
    if (!playerRef.current || typeof playerRef.current.mute !== 'function') return;

    try {
      if (isMuted) {
        playerRef.current.unMute();
        setIsMuted(false);
      } else {
        playerRef.current.mute();
        setIsMuted(true);
      }
    } catch (error) {
      console.error('Failed to toggle mute:', error);
    }
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    if (playerRef.current && typeof playerRef.current.setVolume === 'function') {
      try {
        playerRef.current.setVolume(newVolume);
        if (newVolume === 0) {
          setIsMuted(true);
        } else {
          setIsMuted(false);
        }
      } catch (error) {
        console.error('Failed to set volume:', error);
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
        <div className="border-t border-border/60 bg-card/40">
          {/* Header */}
          <div className="w-full px-3 py-2 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  'w-2 h-2 rounded-full',
                  isPlaying ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
                )}
              />
              <span className="text-xs font-medium text-muted-foreground">Lofi Radio</span>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="p-1 hover:bg-accent/40 rounded transition-colors"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Controls */}
          <div className="px-3 pb-3 space-y-3">
            {/* Stream Selection */}
            <div className="space-y-1">
              {LOFI_STREAMS.map((stream, index) => (
                <button
                  key={stream.id}
                  onClick={() => changeStream(index)}
                  className={cn(
                    'w-full text-left px-2 py-1.5 rounded text-xs transition-colors',
                    currentStreamIndex === index
                      ? 'bg-primary/10 text-primary'
                      : 'hover:bg-accent/40 text-muted-foreground'
                  )}
                >
                  {stream.title}
                </button>
              ))}
            </div>

            {/* Playback Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={togglePlay}
                className="p-2 rounded-md hover:bg-accent/40 transition-colors"
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5 text-primary" />
                ) : (
                  <Play className="w-5 h-5 text-muted-foreground" />
                )}
              </button>

              <button
                onClick={toggleMute}
                className="p-2 rounded-md hover:bg-accent/40 transition-colors"
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <Volume2 className="w-4 h-4 text-muted-foreground" />
                )}
              </button>

              <input
                type="range"
                min="0"
                max="100"
                value={volume}
                onChange={(e) => handleVolumeChange(Number(e.target.value))}
                className="flex-1 h-1 bg-accent rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
