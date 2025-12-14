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

    return (
      <div className="p-6 max-w-4xl mx-auto rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-4">{game.problem.title}</h1>
        <Alert
          variant={
            game.winner?.id && me?.id && game.winner.id === me.id
              ? 'success'
              : 'warning'
          }
        >
          <h3>Game Finished</h3>
          <p>
            Winner: <strong>{game.winner?.name}</strong>
          </p>
          {(execLabel || memLabel) && (
            <p className="mt-2 text-sm opacity-90">
              {execLabel && (
                <>
                  Time: <strong>{execLabel}</strong>
                </>
              )}
              {execLabel && memLabel ? ' · ' : null}
              {memLabel && (
                <>
                  Memory: <strong>{memLabel}</strong>
                </>
              )}
            </p>
          )}
        </Alert>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
          <div>
            <h2 className="text-xl font-semibold mb-2">
              {me?.id ? 'Your Code' : (me?.name || '') + "'s Code"}
            </h2>
            <div className="h-[400px] border border-gray-200 rounded overflow-hidden">
              <CodeEditor
                value={me?.id ? myCode : opponentCode}
                readOnly={true}
                language={selectedLanguage}
              />
            </div>
          </div>
          <div>
            <h2 className="text-xl font-semibold mb-2">
              {!me?.id ? 'Your Code' : (opponent?.name || '') + "'s Code"}
            </h2>
            <div className="h-[400px] border border-gray-200 rounded overflow-hidden">
              <CodeEditor
                value={!me?.id ? myCode : opponentCode}
                readOnly={true}
                language={selectedLanguage}
              />
            </div>
          </div>
        </div>

        <Button onClick={() => router.push('/dashboard')}>
          Back to Dashboard
        </Button>
      </div>
    );
  }
);

FinishedGame.displayName = 'FinishedGame';
