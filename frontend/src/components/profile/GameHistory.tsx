import React, { FC } from 'react';
import Link from 'next/link';
import {
  Trophy,
  Clock,
  Users,
  Code,
  Calendar,
  Medal,
  User,
} from 'lucide-react';
import {
  normalizeRecentGames,
  GameHistoryItem,
} from '@/lib/mappers/recentGames';
import { DifficultyBadge } from '@/components/ui/DifficultyBadge';
import { formatTimeAgo } from '@/lib/utils';
import { ROUTES } from '@/lib/router';

interface GameHistoryProps {
  games?: unknown[];
  currentUserId?: string;
}

const GameHistory: FC<GameHistoryProps> = ({ games = [], currentUserId }) => {
  const items: GameHistoryItem[] = normalizeRecentGames(games as unknown[]);

  const getModeIcon = (mode: string) => {
    switch (mode) {
      case 'ranked_pvp':
        return <Trophy className="w-4 h-4 text-amber-900" />;
      case 'casual_pvp':
        return <Users className="w-4 h-4 text-blue-600" />;
      case 'single':
        return <User className="w-4 h-4 text-gray-600" />;
      default:
        return <Code className="w-4 h-4 text-gray-600" />;
    }
  };

  const getOpponent = (
    game: GameHistoryItem
  ): { name: string; id?: string } => {
    if (!currentUserId) {
      return {
        name: game.playerB?.name || game.playerA?.name || 'Unknown',
        id: game.playerB?.id || game.playerA?.id,
      };
    }
    return game.playerA?.id === currentUserId
      ? { name: game.playerB?.name || 'Unknown', id: game.playerB?.id }
      : { name: game.playerA?.name || 'Unknown', id: game.playerA?.id };
  };

  const getWinner = (game: GameHistoryItem): { name: string; id?: string } => {
    return {
      name: game.winner?.name || 'Unknown',
      id: game.winner?.id,
    };
  };

  const formatEndedAgo = (endedAt?: string, fallback?: string) =>
    formatTimeAgo(endedAt, fallback);

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
              <div className="flex items-center space-x-2 font-bold">
                {getModeIcon(game.mode)}
                <span className="text-sm">
                  {game.mode.replace('_', ' ').toUpperCase()}
                </span>
                <DifficultyBadge difficulty={game.problem.difficulty} />
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                {game.endedAt ? ` · ${formatEndedAgo(game.endedAt)}` : ''}
              </div>
            </div>

            <div className="mb-2 flex gap-2 items-center ">
              <Clock className="w-4 h-4" />
              <h4 className="font-medium text-sm">{game.problem.title}</h4>
            </div>

            {game.mode !== 'single' && (
              <>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-muted-foreground">vs</span>
                      {getOpponent(game).id ? (
                        <Link
                          href={ROUTES.USER_PROFILE(getOpponent(game).id!)}
                          className="text-orange-500 hover:text-orange-400 hover:underline transition-colors"
                        >
                          {getOpponent(game).name}
                        </Link>
                      ) : (
                        <span>{getOpponent(game).name}</span>
                      )}
                    </div>
                  </div>
                </div>

                {game.winner && (
                  <div className="mt-2 flex items-center space-x-2">
                    <Medal className="w-4 h-4 text-yellow-600" />
                    <span className="text-sm font-medium">
                      Winner:{' '}
                      {getWinner(game).id ? (
                        <Link
                          href={ROUTES.USER_PROFILE(getWinner(game).id!)}
                          className="text-orange-500 hover:text-orange-400 hover:underline transition-colors"
                        >
                          {getWinner(game).name}
                        </Link>
                      ) : (
                        getWinner(game).name
                      )}
                    </span>
                  </div>
                )}
              </>
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
