import React, { memo, useState } from 'react';
import { useRouter } from 'next/router';
import { ArrowRight, Users, Trophy, User } from 'lucide-react';
import MatchingLoader from './MatchingLoader';
import { ConnectingCard, ErrorCard, FoundCard } from './MatchingCards';
import { MATCHING_STATE } from '@/constants';
import { useMatchmaking } from '@/hooks/useMatchmaking';
import { type Difficulty } from './DifficultySelector';

const modes = [
  { value: 'casual_pvp', title: 'Casual race', description: 'Compete without affecting your rating.', icon: Users },
  { value: 'ranked_pvp', title: 'Ranked race', description: 'Challenge a rival and climb the ladder.', icon: Trophy },
  { value: 'single', title: 'Solo practice', description: 'Build confidence at your own pace.', icon: User },
] as const;
const difficulties: Difficulty[] = ['Easy', 'Medium', 'Hard'];

interface MatchingScreenProps {
  onMatchFound?: (gameId: string) => void;
}

export const MatchingScreen: React.FC<MatchingScreenProps> = memo(({ onMatchFound }) => {
  const router = useRouter();
  const { matchingState, selectedDifficulty, waitTimeSeconds, error, startMatching, cancelMatching, retryMatching } =
    useMatchmaking({ onMatchFound });
  const [mode, setMode] = useState<(typeof modes)[number]['value']>('casual_pvp');
  const [difficulty, setDifficulty] = useState<Difficulty>('Easy');

  if (matchingState === MATCHING_STATE.CONNECTING) return <ConnectingCard />;
  if (matchingState === MATCHING_STATE.ERROR) {
    return <ErrorCard message={error || undefined} onRetry={retryMatching} onBack={() => router.push('/dashboard')} />;
  }
  if (matchingState === MATCHING_STATE.FOUND) return <FoundCard />;
  if (matchingState === MATCHING_STATE.SEARCHING && selectedDifficulty) {
    return <MatchingLoader difficulty={selectedDifficulty} waitTimeSeconds={waitTimeSeconds} onCancel={cancelMatching} />;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent-11)]">Play your way</p>
        <h2 className="mt-2 text-2xl font-bold tracking-tight">Ready for your next challenge?</h2>
        <p className="mt-2 text-sm font-normal text-[var(--gray-11)]">Choose a mode and difficulty to get started.</p>
      </div>
      <fieldset>
        <legend className="mb-3 text-sm font-semibold">Game mode</legend>
        <div className="grid gap-3">
          {modes.map(({ value, title, description, icon: Icon }) => (
            <label key={value} className="relative cursor-pointer">
              <input type="radio" name="game-mode" value={value} checked={mode === value} onChange={() => setMode(value)} className="peer sr-only" />
              <span className="flex h-full items-center gap-3 rounded-xl border border-[var(--gray-6)] p-4 transition-colors hover:bg-[var(--gray-3)] peer-checked:border-[var(--accent-8)] peer-checked:bg-[var(--accent-3)] peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--accent-9)]">
                <Icon className="h-5 w-5 shrink-0 text-[var(--accent-11)]" />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold">{title}</span>
                  <span className="mt-1 block text-xs font-normal leading-5 text-[var(--gray-11)]">{description}</span>
                </span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      <div className="mt-auto flex flex-col gap-5 border-t border-[var(--gray-6)] pt-5">
        <fieldset>
          <legend className="mb-3 text-sm font-semibold">Difficulty</legend>
          <div className="flex gap-2">
            {difficulties.map((value) => (
              <label key={value} className="flex-1 cursor-pointer">
                <input type="radio" name="game-difficulty" value={value} checked={difficulty === value} onChange={() => setDifficulty(value)} className="peer sr-only" />
                <span className="block rounded-lg border border-[var(--gray-6)] px-4 py-2.5 text-center text-sm transition-colors hover:bg-[var(--gray-3)] peer-checked:border-[var(--accent-8)] peer-checked:bg-[var(--accent-3)] peer-checked:text-[var(--accent-11)] peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--accent-9)]">{value}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <button type="button" onClick={() => startMatching(difficulty, mode)} disabled={matchingState !== MATCHING_STATE.IDLE} className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-3 rounded-xl bg-[var(--accent-9)] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--accent-10)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-9)] disabled:cursor-not-allowed disabled:opacity-60">
          {mode === 'single' ? 'Start practice' : 'Find a match'} <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
});

MatchingScreen.displayName = 'MatchingScreen';
export default MatchingScreen;
