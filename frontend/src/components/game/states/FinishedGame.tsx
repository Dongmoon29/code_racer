import React, { memo } from 'react';
import { useRouter } from 'next/router';
import CodeEditor from '../CodeEditor';
import { Game } from '@/types';
import { Button } from '../../ui/Button';
import { Alert } from '@/components/ui/alert';

interface Props {
  game: Game;
  me?: { id: string; name: string };
  opponent?: { id: string; name: string };
  myCode: string;
  opponentCode: string;
  selectedLanguage: 'python' | 'javascript' | 'go';
}

export const FinishedGame: React.FC<Props> = memo(
  ({ game, me, opponent, myCode, opponentCode, selectedLanguage }) => {
    const router = useRouter();
    // perspective is provided by parent

    const winnerIsMe = !!(game.winner?.id && me?.id && game.winner.id === me.id);
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

    const ratingDelta =
      typeof game.winner_rating_delta === 'number'
        ? game.winner_rating_delta
        : null;

    const ratingDeltaLabel =
      ratingDelta === null ? null : `${ratingDelta >= 0 ? '+' : ''}${ratingDelta}`;

    return (
      <div className="p-6 max-w-4xl mx-auto rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-4">{game.problem.title}</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-6">
          {/* Left: match result details */}
          <div>
            <Alert variant={winnerIsMe ? 'success' : 'warning'}>
              <h3>Game Finished</h3>
              <p>
                Winner: <strong>{game.winner?.name}</strong>
              </p>
              {(execLabel || memLabel || ratingDeltaLabel) && (
                <div className="mt-2 text-sm opacity-90 space-y-1">
                  {ratingDeltaLabel && (
                    <p>
                      Rating: <strong>{ratingDeltaLabel}</strong>
                    </p>
                  )}
                  {execLabel && (
                    <p>
                      Time: <strong>{execLabel}</strong>
                    </p>
                  )}
                  {memLabel && (
                    <p>
                      Memory: <strong>{memLabel}</strong>
                    </p>
                  )}
                </div>
              )}
            </Alert>

            <div className="mt-4 text-sm text-gray-500">
              {opponent?.name ? `Opponent: ${opponent.name}` : null}
            </div>

            <div className="mt-6">
              <Button onClick={() => router.push('/dashboard')}>
                Back to Dashboard
              </Button>
            </div>
          </div>

          {/* Right: winner code */}
          <div>
            <h2 className="text-xl font-semibold mb-2">Winner&apos;s Code</h2>
            <div className="h-[520px] border border-gray-200 rounded overflow-hidden">
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
