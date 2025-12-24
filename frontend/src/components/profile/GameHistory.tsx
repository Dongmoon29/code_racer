import React, { FC } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import {
  normalizeRecentGames,
  GameHistoryItem,
} from '@/lib/mappers/recentGames';
import { DifficultyBadge } from '@/components/ui/DifficultyBadge';
import { Badge } from '@/components/ui/Badge';
import { ROUTES } from '@/lib/router';

interface GameHistoryProps {
  games?: unknown[];
  currentUserId?: string;
}

const GameHistory: FC<GameHistoryProps> = ({ games = [], currentUserId }) => {
  const items: GameHistoryItem[] = normalizeRecentGames(games as unknown[]);

  const getModeTag = (mode: string) => {
    switch (mode) {
      case 'ranked_pvp':
        return 'ranked';
      case 'casual_pvp':
        return 'casual';
      case 'single':
        return 'single';
      default:
        return mode;
    }
  };

  const getModeColor = (mode: string): 'red' | 'blue' => {
    switch (mode) {
      case 'ranked_pvp':
        return 'red';
      case 'casual_pvp':
      case 'single':
        return 'blue';
      default:
        return 'blue';
    }
  };

  const getOpponent = (
    game: GameHistoryItem
  ): { name: string; id?: string; profile_image?: string } => {
    if (!currentUserId) {
      return {
        name: game.playerB?.name || game.playerA?.name || 'Unknown',
        id: game.playerB?.id || game.playerA?.id,
        profile_image: game.playerB?.profile_image || game.playerA?.profile_image,
      };
    }
    return game.playerA?.id === currentUserId
      ? { 
          name: game.playerB?.name || 'Unknown', 
          id: game.playerB?.id,
          profile_image: game.playerB?.profile_image,
        }
      : { 
          name: game.playerA?.name || 'Unknown', 
          id: game.playerA?.id,
          profile_image: game.playerA?.profile_image,
        };
  };

  const isWinner = (game: GameHistoryItem): boolean => {
    if (!currentUserId || !game.winner) return false;
    return game.winner.id === currentUserId;
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
        {items.slice(0, 5).map((game) => {
          const won = game.mode !== 'single' && isWinner(game);
          const lost = game.mode !== 'single' && game.winner && !isWinner(game);
          
          return (
          <Link
            key={game.id}
            href={ROUTES.GAME_ROOM(game.id)}
            className="block p-3 sm:p-4 rounded-lg border bg-[var(--color-panel)] transition-all duration-200 hover:bg-muted/50 hover:shadow-sm cursor-pointer"
          >
            <div className="flex items-center gap-2 mb-2">
              {won && (
                <ThumbsUp className="w-4 h-4 text-green-500 flex-shrink-0" />
              )}
              {lost && (
                <ThumbsDown className="w-4 h-4 text-red-500 flex-shrink-0" />
              )}
              <h4 className="font-medium text-sm sm:text-base text-foreground line-clamp-2">
                {game.problem.title}
              </h4>
            </div>
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <Badge variant="outline" size="1" color={getModeColor(game.mode)}>
                {getModeTag(game.mode)}
              </Badge>
              <DifficultyBadge difficulty={game.problem.difficulty} />
            </div>
            {game.mode !== 'single' && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>vs</span>
                {getOpponent(game).id ? (
                  <Link
                    href={ROUTES.USER_PROFILE(getOpponent(game).id!)}
                    className="flex items-center gap-1.5 font-bold hover:underline transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="relative w-5 h-5 rounded-full overflow-hidden flex-shrink-0">
                      <Image
                        src={getOpponent(game).profile_image || '/default-avatar.svg'}
                        alt={getOpponent(game).name}
                        fill
                        className="object-cover"
                        sizes="20px"
                      />
                    </div>
                    <span>{getOpponent(game).name}</span>
                  </Link>
                ) : (
                  <div className="flex items-center gap-1.5 font-bold">
                    <div className="relative w-5 h-5 rounded-full overflow-hidden flex-shrink-0">
                      <Image
                        src={getOpponent(game).profile_image || '/default-avatar.svg'}
                        alt={getOpponent(game).name}
                        fill
                        className="object-cover"
                        sizes="20px"
                      />
                    </div>
                    <span>{getOpponent(game).name}</span>
                  </div>
                )}
              </div>
            )}
          </Link>
          );
        })}
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
