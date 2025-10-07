import React, { useEffect, useState, memo, FC } from 'react';
import { Button } from '@/components/ui/Button';
import { type Difficulty } from './DifficultySelector';
import { MATCHING_LOADER_CONSTANTS } from './constants/matching-loader-constants';

interface MatchingLoaderProps {
  difficulty: Difficulty;
  waitTimeSeconds?: number;
  onCancel: () => void;
}

const difficultyConfig = MATCHING_LOADER_CONSTANTS.DIFFICULTY_CONFIG;

export const MatchingLoader: FC<MatchingLoaderProps> = memo(
  ({ difficulty, waitTimeSeconds = 0, onCancel }) => {
    const [, setLocalWaitTime] = useState(waitTimeSeconds);
    const config = difficultyConfig[difficulty];

    useEffect(() => {
      const interval = setInterval(() => {
        setLocalWaitTime(
          (prev) => prev + MATCHING_LOADER_CONSTANTS.TIMER.INCREMENT_VALUE
        );
      }, MATCHING_LOADER_CONSTANTS.TIMER.INTERVAL_MS);

      return () => {
        clearInterval(interval);
      };
    }, []);

    useEffect(() => {
      setLocalWaitTime(waitTimeSeconds);
    }, [waitTimeSeconds]);

    useEffect(() => {
      const hasRunOnceRef = { current: false } as { current: boolean };
      return () => {
        if (hasRunOnceRef.current) {
          onCancel();
        } else {
          hasRunOnceRef.current = true;
        }
      };
    }, [onCancel]);

    return (
      <div className="max-w-2xl mx-auto p-8 text-center">
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-foreground mb-2">
            Searching for opponent
          </h2>
          <p className={`text-sm ${config.color} font-medium`}>
            Difficulty: {config.icon} {difficulty}
          </p>
        </div>

        <div className="flex items-center justify-center">
          <Button
            variant="outline"
            onClick={onCancel}
            className="min-w-[140px] border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            Cancel matching
          </Button>
        </div>
      </div>
    );
  }
);

MatchingLoader.displayName = 'MatchingLoader';

export default MatchingLoader;
