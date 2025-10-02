import React from 'react';
import { useRouter } from 'next/router';
import CodeEditor from '../CodeEditor';
import { Game } from '@/types';
import { Button } from '../../ui/Button';
import { Alert } from '@/components/ui/alert';

interface Props {
  game: Game;
  currentUserId: string;
  myCode: string;
  opponentCode: string;
  selectedLanguage: 'python' | 'javascript' | 'go';
}

export const FinishedGame: React.FC<Props> = ({
  game,
  currentUserId,
  myCode,
  opponentCode,
  selectedLanguage,
}) => {
  const router = useRouter();
  const isCreator = currentUserId === game.creator.id;

  return (
    <div className="p-6 max-w-4xl mx-auto rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-4">{game.leetcode.title}</h1>
      <Alert
        variant={game.winner?.id === currentUserId ? 'success' : 'warning'}
      >
        <h3>Game Finished</h3>
        <p>
          Winner: <strong>{game.winner?.name}</strong>
        </p>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
        <div>
          <h2 className="text-xl font-semibold mb-2">
            {isCreator ? 'Your Code' : game.creator.name + "'s Code"}
          </h2>
          <div className="h-[400px] border border-gray-200 rounded overflow-hidden">
            <CodeEditor
              value={isCreator ? myCode : opponentCode}
              readOnly={true}
              language={selectedLanguage}
            />
          </div>
        </div>
        <div>
          <h2 className="text-xl font-semibold mb-2">
            {!isCreator ? 'Your Code' : game.opponent?.name + "'s Code"}
          </h2>
          <div className="h-[400px] border border-gray-200 rounded overflow-hidden">
            <CodeEditor
              value={!isCreator ? myCode : opponentCode}
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
};
