import React from 'react';
import { useRouter } from 'next/router';
import { Game } from '../types';
import { Button } from '@/components/ui/Button';
import { Check, Copy } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Props {
  game: Game;
  gameId: string;
  onCloseGame: () => void;
}

export const WaitingForOpponent: React.FC<Props> = ({
  game,
  gameId,
  onCloseGame,
}) => {
  const router = useRouter();
  const [copied, setCopied] = React.useState(false);
  const gameUrl = `${window.location.origin}/game/${gameId}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(gameUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto bg-[hsl(var(--card))] rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-4 text-[hsl(var(--foreground))]">
        {game.leetcode.title}
      </h1>
      <AlertDescription className="text-[hsl(var(--foreground))] my-3">
        Share this game link with your friend to start
      </AlertDescription>
      <Alert className="group relative cursor-pointer" onClick={handleCopy}>
        <div className="flex justify-between items-start">
          <div className="space-y-4 w-full">
            <div className="rounded">
              <code className="font-mono text-sm text-[hsl(var(--foreground))] break-all">
                {gameUrl}
              </code>
            </div>
          </div>

          <div className="ml-4">
            {copied ? (
              <Check className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
            ) : (
              <Copy className="h-4 w-4 text-[hsl(var(--muted-foreground))] opacity-0 group-hover:opacity-100 transition-opacity" />
            )}
          </div>
        </div>
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

      <div className="flex justify-between">
        <Button onClick={() => router.push('/dashboard')}>
          Back to Dashboard
        </Button>
        <Button onClick={onCloseGame}>Close Room</Button>
      </div>
    </div>
  );
};
