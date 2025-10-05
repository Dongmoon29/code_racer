import React, { memo, useState } from 'react';
import { useRouter } from 'next/router';
import MatchingLoader from './MatchingLoader';
import { ConnectingCard, ErrorCard, FoundCard } from './MatchingCards';
import { AnimatePresence, motion } from 'framer-motion';
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
      return (
        <AnimatePresence mode="wait">
          <motion.div
            key="connecting"
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
          >
            <ConnectingCard />
          </motion.div>
        </AnimatePresence>
      );
    }

    // Error state
    if (matchingState === MATCHING_STATE.ERROR) {
      return (
        <AnimatePresence mode="wait">
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
          >
            <ErrorCard
              message={error || undefined}
              onRetry={retryMatching}
              onBack={() => router.push('/dashboard')}
            />
          </motion.div>
        </AnimatePresence>
      );
    }

    // Found state (briefly show confirmation)
    if (matchingState === MATCHING_STATE.FOUND) {
      return (
        <AnimatePresence mode="wait">
          <motion.div
            key="found"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          >
            <FoundCard />
          </motion.div>
        </AnimatePresence>
      );
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
        accent: 'text-emerald-600',
      },
      {
        value: 'ranked_pvp',
        title: 'Ranked PvP',
        subtitle: 'Climb the leaderboard',
        colors: 'from-indigo-500 to-purple-500',
        accent: 'text-indigo-600',
      },
      {
        value: 'single',
        title: 'Single',
        subtitle: 'Solo time attack',
        colors: 'from-orange-500 to-rose-500',
        accent: 'text-orange-600',
      },
    ];

    // Simple, reusable styles
    const cardBaseClass =
      'group relative w-full h-36 rounded-2xl border bg-[hsl(var(--background))] border-[hsl(var(--border))] flex flex-col justify-center items-start p-4 transition-transform cursor-pointer';
    const ctaClass =
      'w-14 h-14 flex items-center justify-center rounded-full text-white font-semibold shadow-lg bg-green-600';

    return (
      <div className="max-w-5xl mx-auto p-6">
        {/* Mode card selector */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 items-stretch">
          {modeOptions.map((m) => {
            const selected = mode === m.value;
            return (
              <button
                key={m.value}
                onClick={() => setMode(m.value)}
                className={`${cardBaseClass} ${
                  selected
                    ? 'ring-2 ring-emerald-500 ring-offset-2 -translate-y-0.5'
                    : ''
                }`}
              >
                <div className="leading-tight">
                  <div className="text-xl font-bold mb-1">{m.title}</div>
                  <div className="text-[hsl(var(--muted-foreground))] text-sm">
                    {m.subtitle}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Difficulty card selector */}
        <div className="mb-6">
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
            onClick={() => startMatching(difficulty)}
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
