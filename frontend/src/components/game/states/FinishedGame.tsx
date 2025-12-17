import React, { memo } from 'react';
import { useRouter } from 'next/router';
import CodeEditor from '../CodeEditor';
import { Game } from '@/types';
import { Button } from '../../ui/Button';
import { Alert } from '@/components/ui/alert';

function formatMode(mode: Game['mode']): string {
  switch (mode) {
    case 'ranked_pvp':
      return 'Ranked';
    case 'casual_pvp':
      return 'Casual';
    case 'single':
      return 'Single';
    default:
      return String(mode);
  }
}

function formatRatingDelta(delta?: number): string | null {
  if (typeof delta !== 'number') return null;
  return `${delta >= 0 ? '+' : ''}${delta}`;
}

interface Props {
  game: Game;
  me?: { id: string; name: string };
  opponent?: { id: string; name: string };
  myCode: string;
  opponentCode: string;
  selectedLanguage: 'python' | 'javascript' | 'go';
}

export const FinishedGame: React.FC<Props> = memo(
  ({ game, me, myCode, opponentCode, selectedLanguage }) => {
    const router = useRouter();
    // perspective is provided by parent

    const winnerIsMe = !!(
      game.winner?.id &&
      me?.id &&
      game.winner.id === me.id
    );
    const winnerCode = winnerIsMe ? myCode : opponentCode || myCode;

    const execSeconds = game.winner_execution_time_seconds;
    const memKB = game.winner_memory_usage_kb;

    const execLabel =
      typeof execSeconds === 'number'
        ? `${execSeconds.toFixed(3)}s (${Math.round(execSeconds * 1000)}ms)`
        : null;

    const memLabel =
      typeof memKB === 'number'
        ? memKB >= 1024
          ? `${(memKB / 1024).toFixed(2)}MB (${Math.round(memKB)}KB)`
          : `${Math.round(memKB)}KB`
        : null;

    const isRanked = game.mode === 'ranked_pvp';
    const winnerName = game.winner?.name ?? 'Unknown';

    const winnerId = game.winner?.id;
    const playerAIsWinner = !!(winnerId && game.playerA?.id === winnerId);
    const playerBIsWinner = !!(winnerId && game.playerB?.id === winnerId);

    const playerALabel = game.playerA
      ? {
          name: game.playerA.name,
          rating: game.playerA.rating,
          delta: playerAIsWinner
            ? game.winner_rating_delta
            : game.loser_rating_delta,
          isWinner: playerAIsWinner,
        }
      : null;
    const playerBLabel = game.playerB
      ? {
          name: game.playerB.name,
          rating: game.playerB.rating,
          delta: playerBIsWinner
            ? game.winner_rating_delta
            : game.loser_rating_delta,
          isWinner: playerBIsWinner,
        }
      : null;

    const winnerBadge = winnerIsMe ? 'Victory' : 'Defeat';

    return (
      <div className="p-6 max-w-5xl mx-auto rounded-lg shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          <div>
            <h1 className="text-2xl font-bold">{game.problem.title}</h1>
            <div className="mt-1 text-sm text-[var(--gray-11)]">
              Mode: {formatMode(game.mode)}
              {game.problem?.difficulty
                ? ` · Difficulty: ${game.problem.difficulty}`
                : ''}
            </div>
          </div>

          <div className="flex items-start justify-between md:justify-end gap-3">
            <h2 className="text-2xl font-bold md:text-right">
              Winner&apos;s Code
            </h2>
            <span
              className={`px-3 py-1 rounded-full text-sm font-semibold border ${
                winnerIsMe
                  ? 'bg-[var(--green-3)] text-[var(--green-11)] border-[var(--green-6)]'
                  : 'bg-[var(--amber-3)] text-[var(--amber-11)] border-[var(--amber-6)]'
              }`}
            >
              {winnerBadge}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-6">
          {/* Left: match result details */}
          <div>
            <Alert variant={winnerIsMe ? 'success' : 'warning'}>
              <h3>Game Finished</h3>
              <p>
                Winner: <strong>{winnerName}</strong>
              </p>
            </Alert>

            {/* Stats grid */}
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-[var(--gray-6)] bg-[var(--gray-3)] p-3">
                <div className="text-xs text-[var(--gray-11)]">Execution time</div>
                <div className="mt-1 font-semibold text-[var(--color-text)]">{execLabel ?? '-'}</div>
              </div>
              <div className="rounded-lg border border-[var(--gray-6)] bg-[var(--gray-3)] p-3">
                <div className="text-xs text-[var(--gray-11)]">Memory</div>
                <div className="mt-1 font-semibold text-[var(--color-text)]">{memLabel ?? '-'}</div>
              </div>
            </div>

            {/* Player comparison */}
            <div className="mt-4 rounded-lg border border-[var(--gray-6)] bg-[var(--gray-3)] p-3">
              <div className="text-xs text-[var(--gray-11)] mb-2">Players</div>
              <div className="space-y-2">
                {playerALabel && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-[var(--color-text)]">
                        {playerALabel.name}
                        {playerALabel.isWinner ? ' (W)' : ''}
                        {me?.name && playerALabel.name === me.name
                          ? ' · You'
                          : ''}
                      </span>
                    </div>
                    <div className="text-sm text-[var(--gray-11)]">
                      {typeof playerALabel.rating === 'number'
                        ? `Rating: ${playerALabel.rating}`
                        : 'Rating: -'}
                      {isRanked && typeof playerALabel.delta === 'number'
                        ? ` (${formatRatingDelta(playerALabel.delta)})`
                        : ''}
                    </div>
                  </div>
                )}
                {playerBLabel && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-[var(--color-text)]">
                        {playerBLabel.name}
                        {playerBLabel.isWinner ? ' (W)' : ''}
                        {me?.name && playerBLabel.name === me.name
                          ? ' · You'
                          : ''}
                      </span>
                    </div>
                    <div className="text-sm text-[var(--gray-11)]">
                      {typeof playerBLabel.rating === 'number'
                        ? `Rating: ${playerBLabel.rating}`
                        : 'Rating: -'}
                      {isRanked && typeof playerBLabel.delta === 'number'
                        ? ` (${formatRatingDelta(playerBLabel.delta)})`
                        : ''}
                    </div>
                  </div>
                )}
                {!playerALabel && !playerBLabel ? (
                  <div className="text-sm text-[var(--gray-11)]">No player data</div>
                ) : null}
              </div>
            </div>

            <div className="mt-6">
              <div className="flex gap-2">
                <Button onClick={() => router.push('/dashboard')}>
                  Back to Dashboard
                </Button>
                <Button
                  variant="outline"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(winnerCode);
                    } catch {
                      // ignore
                    }
                  }}
                >
                  Copy Winner Code
                </Button>
              </div>
            </div>
          </div>

          {/* Right: winner code */}
          <div>
            <div className="h-[520px] border border-[var(--gray-6)] rounded overflow-hidden">
              <CodeEditor
                value={winnerCode}
                readOnly={true}
                language={selectedLanguage}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }
);

FinishedGame.displayName = 'FinishedGame';
