import React from 'react';
import { useRouter } from 'next/router';
import DifficultySelector from './DifficultySelector';
import MatchingLoader from './MatchingLoader';
// import { Button } from '@/components/ui/Button';
import { ConnectingCard, ErrorCard, FoundCard } from './MatchingCards';
import { AnimatePresence, motion } from 'framer-motion';
import { MATCHING_STATE } from '@/lib/constants';
import { useMatchmaking } from '@/hooks/useMatchmaking';

interface MatchingScreenProps {
  onMatchFound?: (gameId: string) => void;
}

export const MatchingScreen: React.FC<MatchingScreenProps> = ({
  onMatchFound,
}) => {
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

  // Default: difficulty selection
  return (
    <DifficultySelector
      onSelect={startMatching}
      disabled={matchingState !== MATCHING_STATE.IDLE}
    />
  );
};

export default MatchingScreen;
