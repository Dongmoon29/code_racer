// Domain types
import type { MatchMode, MatchStatus, Difficulty } from '@/types';

export type GameHistoryItem = {
  id: string;
  mode: MatchMode;
  status: MatchStatus;
  playerA: { id: string; name: string };
  playerB?: { id: string; name: string };
  leetcode: {
    id: string;
    title: string;
    difficulty: Difficulty;
  };
  winner?: { id: string; name: string };
  startedAt?: string;
  endedAt?: string;
  createdAt: string;
};

type ApiUserRef = { id?: string; name?: string } | undefined;
type ApiLeet = { id?: string; title?: string; difficulty?: string } | undefined;
type ApiGame = {
  id?: string;
  mode?: string;
  status?: string;
  playerA?: ApiUserRef;
  player_a?: ApiUserRef;
  playerB?: ApiUserRef;
  player_b?: ApiUserRef;
  leetcode?: ApiLeet;
  leetCode?: ApiLeet;
  winner?: ApiUserRef;
  winner_id?: string;
  startedAt?: string;
  started_at?: string;
  endedAt?: string;
  ended_at?: string;
  createdAt?: string;
  created_at?: string;
};

// Normalize API data (handles snake_case keys and optional fields)
export function normalizeRecentGames(games: unknown[]): GameHistoryItem[] {
  if (!Array.isArray(games)) return [];
  return (games as ApiGame[]).filter(Boolean).map((g) => {
    const playerA = g.playerA || g.player_a;
    const playerB = g.playerB || g.player_b;
    const leet = g.leetcode || g.leetCode;
    const winnerObj = g.winner;
    const winnerId = winnerObj?.id || g.winner_id;

    const winner: { id: string; name: string } | undefined =
      (winnerObj && winnerObj.id && winnerObj.name
        ? { id: String(winnerObj.id), name: String(winnerObj.name) }
        : undefined) ||
      (winnerId
        ? playerA && playerA.id === winnerId
          ? {
              id: String(playerA.id || ''),
              name: String(playerA.name || 'Unknown'),
            }
          : playerB
          ? {
              id: String(playerB.id || ''),
              name: String(playerB.name || 'Unknown'),
            }
          : undefined
        : undefined);

    const difficulty = String(leet?.difficulty || '').toLowerCase();
    const difficultyMap: Record<string, Difficulty> = {
      easy: 'easy',
      medium: 'medium',
      hard: 'hard',
    };
    const diffNorm: Difficulty = difficultyMap[difficulty] ?? 'easy';

    return {
      id: String(g.id || ''),
      mode: String(g.mode || '') as MatchMode,
      status: String(g.status || '') as MatchStatus,
      playerA: playerA
        ? { id: playerA.id, name: playerA.name }
        : { id: '', name: 'Unknown' },
      playerB: playerB ? { id: playerB.id, name: playerB.name } : undefined,
      leetcode: {
        id: leet?.id || '',
        title: leet?.title || 'Unknown problem',
        difficulty: diffNorm,
      },
      winner,
      startedAt: g.startedAt || g.started_at,
      endedAt: g.endedAt || g.ended_at,
      createdAt: g.createdAt || g.created_at,
    } as GameHistoryItem;
  });
}
