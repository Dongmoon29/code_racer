import React, { FC } from 'react';
import { Trophy, Clock, Users, Code, Calendar } from 'lucide-react';
import {
  normalizeRecentGames,
  GameHistoryItem,
} from '@/lib/mappers/recentGames';

interface GameHistoryProps {
  games?: unknown[];
  currentUserId?: string;
}

const GameHistory: FC<GameHistoryProps> = ({ games = [], currentUserId }) => {
  const items: GameHistoryItem[] = normalizeRecentGames(games as unknown[]);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'text-green-600 bg-green-100';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100';
      case 'hard':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getModeIcon = (mode: string) => {
    switch (mode) {
      case 'ranked_pvp':
        return <Trophy className="w-4 h-4 text-yellow-600" />;
      case 'casual_pvp':
        return <Users className="w-4 h-4 text-blue-600" />;
      case 'single':
        return <Code className="w-4 h-4 text-gray-600" />;
      default:
        return <Code className="w-4 h-4 text-gray-600" />;
    }
  };

  const formatDuration = (startedAt?: string, endedAt?: string) => {
    if (!startedAt || !endedAt) return 'N/A';
    const start = new Date(startedAt);
    const end = new Date(endedAt);
    const diffMs = end.getTime() - start.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    return `${diffMins}m`;
  };

  return (
    <div className="bg-card rounded-lg border p-6">
      <h3 className="text-lg font-semibold mb-4">Recent Games</h3>

      {items.length === 0 && (
        <div className="text-sm text-muted-foreground">
          No recent games yet.
        </div>
      )}

      <div className="space-y-3">
        {items.slice(0, 5).map((game) => (
          <div
            key={game.id}
            className={`p-4 rounded-lg border transition-colors}`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                {getModeIcon(game.mode)}
                <span className="text-sm font-medium">
                  {game.mode.replace('_', ' ').toUpperCase()}
                </span>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(
                    game.leetcode.difficulty
                  )}`}
                >
                  {game.leetcode.difficulty}
                </span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>{formatDuration(game.startedAt, game.endedAt)}</span>
              </div>
            </div>

            <div className="mb-2">
              <h4 className="font-medium text-sm">{game.leetcode.title}</h4>
            </div>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <span className="text-muted-foreground">vs</span>
                  <span
                    className={
                      game.playerA?.id === currentUserId ? 'font-semibold' : ''
                    }
                  >
                    {game.playerA?.name}
                  </span>
                  {game.playerB && (
                    <>
                      <span className="text-muted-foreground">vs</span>
                      <span
                        className={
                          game.playerB?.id === currentUserId
                            ? 'font-semibold'
                            : ''
                        }
                      >
                        {game.playerB?.name}
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  {new Date(game.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            {game.winner && (
              <div className="mt-2 flex items-center space-x-2">
                <Trophy className="w-4 h-4 text-yellow-600" />
                <span className="text-sm font-medium">
                  Winner: {game.winner.name}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {items.length > 5 && (
        <div className="mt-4 text-center">
          <button className="text-sm text-blue-600 hover:underline">
            View all games
          </button>
        </div>
      )}
    </div>
  );
};

export default GameHistory;
