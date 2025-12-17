import React, { memo, useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/router';
import MatchingLoader from './MatchingLoader';
import { ConnectingCard, ErrorCard, FoundCard } from './MatchingCards';
import { MATCHING_STATE } from '@/constants';
import { useMatchmaking } from '@/hooks/useMatchmaking';
import { type Difficulty } from './DifficultySelector';
import { Users, Trophy, User, ChevronDown, ChevronUp } from 'lucide-react';

interface MatchingScreenProps {
  onMatchFound?: (gameId: string) => void;
}

export const MatchingScreen: React.FC<MatchingScreenProps> = memo(
  ({ onMatchFound }) => {
    const router = useRouter();
    const {
      matchingState,
      selectedDifficulty,
      waitTimeSeconds,
      error,
      startMatching,
      cancelMatching,
      retryMatching,
    } = useMatchmaking({ onMatchFound });

    // New controls: game mode and difficulty dropdowns
    const [mode, setMode] = useState<'casual_pvp' | 'ranked_pvp' | 'single'>(
      'casual_pvp'
    );
    const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>(
      'Easy'
    );
    const [isModeDropdownOpen, setIsModeDropdownOpen] = useState(false);
    const [isDifficultyDropdownOpen, setIsDifficultyDropdownOpen] =
      useState(false);
    const modeDropdownRef = useRef<HTMLDivElement>(null);
    const difficultyDropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdowns when clicking outside
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          modeDropdownRef.current &&
          !modeDropdownRef.current.contains(event.target as Node)
        ) {
          setIsModeDropdownOpen(false);
        }
        if (
          difficultyDropdownRef.current &&
          !difficultyDropdownRef.current.contains(event.target as Node)
        ) {
          setIsDifficultyDropdownOpen(false);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, []);

    // Connecting state
    if (matchingState === MATCHING_STATE.CONNECTING) {
      return <ConnectingCard />;
    }

    // Error state
    if (matchingState === MATCHING_STATE.ERROR) {
      return (
        <ErrorCard
          message={error || undefined}
          onRetry={retryMatching}
          onBack={() => router.push('/dashboard')}
        />
      );
    }

    // Found state (briefly show confirmation)
    if (matchingState === MATCHING_STATE.FOUND) {
      return <FoundCard />;
    }

    // Searching state
    if (matchingState === MATCHING_STATE.SEARCHING && selectedDifficulty) {
      return (
        <MatchingLoader
          difficulty={selectedDifficulty}
          waitTimeSeconds={waitTimeSeconds}
          onCancel={cancelMatching}
        />
      );
    }

    // Mode options with icons
    const modeOptions: Array<{
      value: typeof mode;
      title: string;
      subtitle: string;
      icon: React.ReactNode;
      color: string;
    }> = [
      {
        value: 'casual_pvp',
        title: 'Casual PvP',
        subtitle: 'Friendly race, no rating',
        icon: <Users className="w-5 h-5" />,
        color: 'text-[var(--green-11)]',
      },
      {
        value: 'ranked_pvp',
        title: 'Ranked PvP',
        subtitle: 'Climb the leaderboard',
        icon: <Trophy className="w-5 h-5" />,
        color: 'text-[var(--accent-11)]',
      },
      {
        value: 'single',
        title: 'Single',
        subtitle: 'Solo time attack',
        icon: <User className="w-5 h-5" />,
        color: 'text-[var(--amber-11)]',
      },
    ];

    // Difficulty options
    const difficultyOptions: Array<{
      value: Difficulty;
      label: string;
      color: string;
    }> = [
      {
        value: 'Easy',
        label: 'Easy',
        color: 'text-[var(--green-11)]',
      },
      {
        value: 'Medium',
        label: 'Medium',
        color: 'text-[var(--amber-11)]',
      },
      {
        value: 'Hard',
        label: 'Hard',
        color: 'text-[var(--red-11)]',
      },
    ];

    const selectedMode = modeOptions.find((m) => m.value === mode)!;
    const selectedDifficultyOption = difficultyOptions.find(
      (d) => d.value === difficulty
    )!;

    // Button styles (chess.com style)
    const buttonBaseClass =
      'cursor-pointer w-full rounded-lg border bg-[var(--color-panel)] border-[var(--gray-6)] px-4 py-3 flex items-center justify-between text-[var(--color-text)] hover:bg-[var(--gray-4)] transition-colors';
    const dropdownButtonClass =
      'cursor-pointer w-full rounded-lg border bg-[var(--color-panel)] border-[var(--gray-6)] px-3 py-2 text-sm text-[var(--color-text)] hover:bg-[var(--gray-4)] transition-colors text-left';
    const selectedButtonClass = `${buttonBaseClass} border-[var(--green-6)]`;
    const startGameButtonClass =
      'cursor-pointer w-full rounded-lg bg-[var(--green-9)] hover:bg-[var(--green-10)] text-white font-semibold py-3 px-4 transition-colors disabled:opacity-60 disabled:cursor-not-allowed';

    return (
      <div className="max-w-md mx-auto space-y-3">
        {/* Mode Dropdown */}
        <div ref={modeDropdownRef}>
          <button
            type="button"
            onClick={() => setIsModeDropdownOpen(!isModeDropdownOpen)}
            className={
              isModeDropdownOpen ? selectedButtonClass : buttonBaseClass
            }
            disabled={matchingState !== MATCHING_STATE.IDLE}
          >
            <div className="flex items-center gap-3">
              <div className={selectedMode.color}>{selectedMode.icon}</div>
              <div className="text-left">
                <div className="font-medium">{selectedMode.title}</div>
                <div className="text-xs text-[var(--gray-11)]">
                  {selectedMode.subtitle}
                </div>
              </div>
            </div>
            {isModeDropdownOpen ? (
              <ChevronUp className="w-5 h-5 text-[var(--gray-11)]" />
            ) : (
              <ChevronDown className="w-5 h-5 text-[var(--gray-11)]" />
            )}
          </button>

          {isModeDropdownOpen && (
            <div className="mt-1 bg-[var(--color-panel)] rounded-lg overflow-hidden space-y-2">
              {modeOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    setMode(option.value);
                    setIsModeDropdownOpen(false);
                  }}
                  className={`${dropdownButtonClass} ${
                    mode === option.value
                      ? 'bg-[var(--gray-4)] border-[var(--green-6)]'
                      : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={option.color}>{option.icon}</div>
                    <div className="text-left flex-1">
                      <div className="font-medium">{option.title}</div>
                      <div className="text-xs text-[var(--gray-11)]">
                        {option.subtitle}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Difficulty Dropdown */}
        <div ref={difficultyDropdownRef}>
          <button
            type="button"
            onClick={() =>
              setIsDifficultyDropdownOpen(!isDifficultyDropdownOpen)
            }
            className={
              isDifficultyDropdownOpen ? selectedButtonClass : buttonBaseClass
            }
            disabled={matchingState !== MATCHING_STATE.IDLE}
          >
            <div className="flex items-center gap-3">
              <div className={selectedDifficultyOption.color}>
                <div className="w-2 h-2 rounded-full bg-current"></div>
              </div>
              <div className="font-medium">
                {selectedDifficultyOption.label}
              </div>
            </div>
            {isDifficultyDropdownOpen ? (
              <ChevronUp className="w-5 h-5 text-[var(--gray-11)]" />
            ) : (
              <ChevronDown className="w-5 h-5 text-[var(--gray-11)]" />
            )}
          </button>

          {isDifficultyDropdownOpen && (
            <div className="mt-1 bg-[var(--color-panel)] rounded-lg overflow-hidden space-y-2">
              {difficultyOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    setDifficulty(option.value);
                    setIsDifficultyDropdownOpen(false);
                  }}
                  className={`${dropdownButtonClass} ${
                    difficulty === option.value
                      ? 'bg-[var(--gray-4)] border-[var(--green-6)]'
                      : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={option.color}>
                      <div className="w-2 h-2 rounded-full bg-current"></div>
                    </div>
                    <div className="font-medium">{option.label}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Start Game Button */}
        <button
          type="button"
          className={startGameButtonClass}
          disabled={matchingState !== MATCHING_STATE.IDLE}
          onClick={() => startMatching(difficulty, mode)}
        >
          Start Game
        </button>
      </div>
    );
  }
);

MatchingScreen.displayName = 'MatchingScreen';

export default MatchingScreen;
