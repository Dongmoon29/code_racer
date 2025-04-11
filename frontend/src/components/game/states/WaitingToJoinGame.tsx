import React from 'react';
import { Spinner } from '../../ui';
import { Game } from '../types';
import { Button } from '@/components/ui/Button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

interface Props {
  game: Game;
  loading: boolean;
  onJoinGame: () => void;
}

export const WaitingToJoinGame: React.FC<Props> = ({
  game,
  loading,
  onJoinGame,
}) => {
  return (
    <div className="p-6 max-w-4xl mx-auto bg-[hsl(var(--card))] rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-4 text-[hsl(var(--foreground))]">
        {game.leetcode.title}
      </h1>

      <Alert className="mb-6">
        <AlertTitle className="text-[hsl(var(--muted-foreground))] font-semibold">
          Game Details
        </AlertTitle>
        <AlertDescription>
          <div className="space-y-2 text-[hsl(var(--muted-foreground))]">
            <p>Creator: {game.creator.name}</p>
            <p>Difficulty: {game.leetcode.difficulty}</p>
            <p>Status: Waiting for opponent</p>
          </div>
        </AlertDescription>
      </Alert>

      {/* Problem Description */}
      <div className="my-6">
        <h2 className="text-xl font-semibold mb-2 text-[hsl(var(--foreground))]">
          Problem Description
        </h2>
        <p className="whitespace-pre-line text-[hsl(var(--foreground))]">
          {game.leetcode.description}
        </p>

        <h3 className="text-lg font-semibold mt-4 mb-2 text-[hsl(var(--foreground))]">
          Examples
        </h3>
        <pre className="bg-[hsl(var(--muted))] p-4 rounded text-[hsl(var(--foreground))] whitespace-pre-wrap">
          {game.leetcode.examples}
        </pre>

        <h3 className="text-lg font-semibold mt-4 mb-2 text-[hsl(var(--foreground))]">
          Constraints
        </h3>
        <pre className="bg-[hsl(var(--muted))] p-4 rounded text-[hsl(var(--foreground))]">
          {game.leetcode.constraints}
        </pre>
      </div>

      <Button onClick={onJoinGame} disabled={loading} className="w-full">
        {loading ? <Spinner size="sm" /> : 'Join Game'}
      </Button>
    </div>
  );
};
