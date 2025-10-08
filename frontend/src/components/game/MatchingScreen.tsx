import React, { memo, useState } from 'react';
import { useRouter } from 'next/router';
import MatchingLoader from './MatchingLoader';
import { ConnectingCard, ErrorCard, FoundCard } from './MatchingCards';
import { MATCHING_STATE } from '@/lib/constants';
import { useMatchmaking } from '@/hooks/useMatchmaking';
import DifficultySelector, { type Difficulty } from './DifficultySelector';

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

    // Default: racing-style card selectors and CTA
    const modeOptions: Array<{
      value: typeof mode;
      title: string;
      subtitle: string;
      colors: string;
      accent: string;
    }> = [
      {
        value: 'casual_pvp',
        title: 'Casual PvP',
        subtitle: 'Friendly race, no rating',
        colors: 'from-emerald-500 to-teal-500',
        accent: 'text-green-600',
      },
      {
        value: 'ranked_pvp',
        title: 'Ranked PvP',
        subtitle: 'Climb the leaderboard',
        colors: 'from-indigo-500 to-purple-500',
        accent: 'text-yellow-600',
      },
      {
        value: 'single',
        title: 'Single',
        subtitle: 'Solo time attack',
        colors: 'from-orange-500 to-rose-500',
        accent: 'text-red-600',
      },
    ];

    // Simple, reusable styles
    const cardBaseClass =
      'w-full h-36 rounded-2xl border bg-[hsl(var(--background))] border-[hsl(var(--border))] flex flex-col justify-center items-start p-4 cursor-pointer';
    const ctaClass =
      'w-14 h-14 flex items-center justify-center rounded-full text-white font-semibold shadow-lg bg-green-600';

    return (
      <div className="max-w-5xl mx-auto p-6">
        {/* Mode card selector */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4 text-[hsl(var(--foreground))]">
            Mode
          </h2>
          <div className="flex flex-col sm:flex-row gap-4">
            {modeOptions.map((m) => {
              const selected = mode === m.value;
              return (
                <button
                  key={m.value}
                  onClick={() => setMode(m.value)}
                  className={`${cardBaseClass} ${
                    selected
                      ? `ring-2 ${
                          m.value === 'casual_pvp'
                            ? 'ring-green-500'
                            : m.value === 'ranked_pvp'
                            ? 'ring-yellow-500'
                            : 'ring-red-500'
                        }`
                      : ''
                  }`}
                >
                  <div className="leading-tight text-center w-full">
                    <div className={`text-xl font-bold mb-1 ${m.accent}`}>
                      {m.title}
                    </div>
                    <div className="text-[hsl(var(--muted-foreground))] text-sm">
                      {m.subtitle}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Difficulty card selector */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-4 text-[hsl(var(--foreground))]">
            Difficulty
          </h2>
          <DifficultySelector
            value={difficulty}
            onSelect={(d: Difficulty) => setDifficulty(d)}
            disabled={matchingState !== MATCHING_STATE.IDLE}
          />
        </div>

        {/* Racing CTA */}
        <div className="flex items-center justify-end gap-3">
          <button
            className={`${ctaClass} ${
              matchingState !== MATCHING_STATE.IDLE
                ? 'opacity-60 cursor-not-allowed'
                : ''
            }`}
            disabled={matchingState !== MATCHING_STATE.IDLE}
            onClick={() => startMatching(difficulty, mode)}
          >
            GO
          </button>
        </div>
      </div>
    );
  }
);

MatchingScreen.displayName = 'MatchingScreen';

export default MatchingScreen;
