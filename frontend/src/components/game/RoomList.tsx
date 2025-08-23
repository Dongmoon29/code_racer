'use client';

import type React from 'react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { gameApi, leetcodeApi } from '../../lib/api';
import { Spinner } from '../ui';
import { Button } from '../../components/ui/Button';
import axios, { type AxiosError } from 'axios';
import type { ApiErrorResponse } from '@/lib/types';
import { Users, Clock, Code, Trophy, Search, X, Filter } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { Select } from '@/components/ui/Select';
import { Alert } from '../ui/alert';
import { useTheme } from 'next-themes';

// 게임 방 타입
interface Game {
  id: string;
  creator: {
    id: string;
    name: string;
  };
  leetcode: {
    id: string;
    title: string;
    difficulty: string;
  };
  status: 'waiting' | 'playing' | 'finished' | 'closed';
  player_count: number;
  is_full: boolean;
  created_at: string;
}

// LeetCode 문제 타입
interface LeetCode {
  id: string;
  title: string;
  difficulty: string;
}

const RoomList: React.FC = () => {
  const { user } = useAuthStore(); // 현재 로그인한 사용자 정보 가져오기
  const router = useRouter();
  const [games, setGames] = useState<Game[]>([]);
  const [leetcodes, setLeetcodes] = useState<LeetCode[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [creating, setCreating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedLeetCode, setSelectedLeetCode] = useState<string>('');
  const [showCreateForm, setShowCreateForm] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');
  const { theme } = useTheme();

  const difficultyOptions = [
    { value: 'all', label: 'All Difficulties' },
    { value: 'easy', label: 'Easy' },
    { value: 'medium', label: 'Medium' },
    { value: 'hard', label: 'Hard' },
  ];

  // 게임 방 목록 및 LeetCode 문제 목록 로드
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // 병렬로 요청 처리
        const [gamesResponse, leetcodesResponse] = await Promise.all([
          gameApi.listGames(),
          leetcodeApi.listLeetCodes(),
        ]);

        setGames(gamesResponse.games || []);
        setLeetcodes(leetcodesResponse.data || []);

        // 첫 번째 LeetCode 문제를 기본 선택
        if (
          leetcodesResponse.leetcodes &&
          leetcodesResponse.leetcodes.length > 0
        ) {
          setSelectedLeetCode(leetcodesResponse.leetcodes[0].id);
        }
      } catch (err: unknown) {
        if (axios.isAxiosError(err)) {
          const axiosError = err as AxiosError<ApiErrorResponse>;
          setError(axiosError.response?.data?.message || 'Failed to load data');
        } else {
          setError('An unexpected error occurred while loading data');
        }
        console.error('Failed to load games:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // 주기적으로 게임 방 목록 갱신
    const interval = setInterval(async () => {
      try {
        const response = await gameApi.listGames();
        setGames(response.games || []);
      } catch (err) {
        console.error('Failed to refresh games:', err);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  // 게임 방 생성 처리
  const handleCreateGame = async () => {
    if (!selectedLeetCode) {
      setError('Please select a problem');
      return;
    }

    try {
      setCreating(true);
      const response = await gameApi.createGame(selectedLeetCode);

      router.replace(`/game/${response.game.id}`);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const axiosError = err as AxiosError<ApiErrorResponse>;
        setError(axiosError.response?.data?.message || 'Failed to create game');
      } else {
        setError('An unexpected error occurred while creating the game');
      }
      console.error('Failed to create game:', err);
      setCreating(false);
    }
  };

  // 게임 방 참가 처리
  const handleJoinGame = (gameId: string) => {
    router.push(`/game/${gameId}`);
  };

  // 게임 방 목록 필터링
  const filteredGames = games.filter((game) => {
    // closed 상태의 게임은 목록에서 제외
    if (game.status === 'closed') return false;

    const matchesSearch =
      game.leetcode.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      game.creator.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDifficulty =
      difficultyFilter === 'all' ||
      game.leetcode.difficulty.toLowerCase() === difficultyFilter.toLowerCase();

    return matchesSearch && matchesDifficulty;
  });

  // Get difficulty badge color
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'Medium':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'Hard':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      default:
        return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
    }
  };

  // Get status color classes
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'waiting':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'playing':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'finished':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'closed':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  // Format status text
  const formatStatus = (status: string) => {
    switch (status) {
      case 'waiting':
        return 'Waiting';
      case 'playing':
        return 'In Progress';
      case 'finished':
        return 'Finished';
      case 'closed':
        return 'Closed';
      default:
        return status;
    }
  };

  // 로딩 중 표시
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Spinner size="sm" color={theme === 'dark' ? 'white' : 'black'} />
      </div>
    );
  }

  // 게임 방 생성 폼
  const renderCreateForm = () => (
    <div className="bg-[hsl(var(--card))] rounded-xl shadow-lg border border-input p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-[hsl(var(--foreground))]">
          Create New Game
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowCreateForm(false)}
            className="p-1.5 cursor-pointer rounded-md hover:bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {error && (
        <Alert variant="error" className="mb-6">
          {error}
        </Alert>
      )}

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-[hsl(var(--muted-foreground))] mb-2">
            Select Problem
          </label>
          <select
            value={selectedLeetCode}
            onChange={(e) => setSelectedLeetCode(e.target.value)}
            className="w-full px-4 p-2 rounded-lg border bg-[hsl(var(--background))] text-[hsl(var(--foreground))] border-border focus:border-transparent"
            disabled={creating}
          >
            <option value="">Select a problem</option>
            {leetcodes.map((leetcode) => (
              <option key={leetcode.id} value={leetcode.id}>
                {leetcode.title} ({leetcode.difficulty})
              </option>
            ))}
          </select>
        </div>

        <div className="flex justify-end space-x-4">
          <Button
            onClick={handleCreateGame}
            disabled={creating || !selectedLeetCode}
            className="px-6 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
          >
            {creating ? (
              <div className="flex items-center">
                <Spinner size="sm" />
              </div>
            ) : (
              <div className="flex items-center">Create Game</div>
            )}
          </Button>
        </div>
      </div>
    </div>
  );

  // 게임 방 목록 렌더링
  return (
    <div className="w-full min-h-[calc(100vh-12rem)] px-20 sm:px-6 lg:px-70 py-10 ">
      <div className="max-w-7xl mx-auto h-full">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[hsl(var(--foreground))]">
              Game Rooms
            </h1>
            <p className="mt-2 text-[hsl(var(--muted-foreground))]">
              Join an existing game or create your own challenge
            </p>
          </div>

          {!showCreateForm && (
            <Button
              onClick={() => setShowCreateForm(true)}
              className="flex items-center px-6 py-2.5"
            >
              Create New Game
            </Button>
          )}
        </div>

        {/* Search and Filter */}
        {!showCreateForm && (
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search
                className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[hsl(var(--muted-foreground))]"
                size={20}
              />
              <input
                type="text"
                placeholder="Search by game name or creator..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-2 rounded-lg bg-[hsl(var(--card))] border border-input text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:bg-[hsl(var(--background))] focus:border-[hsl(var(--ring))] focus:outline-none focus:ring-1 focus:ring-[hsl(var(--ring))]"
              />
            </div>
            <div className="relative w-full md:w-48">
              <Select
                value={difficultyFilter}
                onChange={setDifficultyFilter}
                options={difficultyOptions}
                icon={Filter}
              />
            </div>
          </div>
        )}

        {/* Content Container */}
        {showCreateForm ? (
          renderCreateForm()
        ) : (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 rounded-xl">
              {filteredGames.length === 0 ? (
                <div className="col-span-1 md:col-span-2 lg:col-span-3 flex flex-col items-center justify-center py-12">
                  <div className="text-center">
                    <h3 className="text-xl font-semibold text-[hsl(var(--foreground))] mb-2">
                      No game rooms found
                    </h3>
                    <p className="text-[hsl(var(--muted-foreground))] mb-6">
                      Try adjusting your search or create a new game
                    </p>
                    <Button
                      onClick={() => setShowCreateForm(true)}
                      className="px-6"
                    >
                      Create New Game
                    </Button>
                  </div>
                </div>
              ) : (
                filteredGames.map((game) => (
                  <div
                    key={game.id}
                    className="bg-[hsl(var(--background))] hover:bg-[hsl(var(--muted))] rounded-xl border border-border overflow-hidden hover:shadow-lg transition-shadow duration-300"
                  >
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${getDifficultyColor(
                              game.leetcode.difficulty
                            )}`}
                          >
                            {game.leetcode.difficulty}
                          </span>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                            game.status
                          )}`}
                        >
                          {formatStatus(game.status)}
                        </span>
                      </div>

                      <h3 className="text-xl font-bold text-[hsl(var(--muted-foreground))] mb-4 line-clamp-1">
                        {game.leetcode.title}
                      </h3>

                      <div className="space-y-3 mb-6">
                        <div className="flex items-center text-[hsl(var(--muted-foreground))]">
                          <Code size={16} className="mr-2" />
                          <span className="text-sm">
                            Created by:{' '}
                            {game.creator.id === user?.id
                              ? 'You'
                              : game.creator.name}
                          </span>
                        </div>
                        <div className="flex justify-between text-[hsl(var(--muted-foreground))]">
                          <div className="flex items-center">
                            <Users size={16} className="mr-2" />
                            <span className="text-sm">
                              {game.player_count}/2 Players
                            </span>
                          </div>
                          <div className="flex items-center">
                            <Clock size={16} className="mr-2" />
                            <span className="text-sm">
                              {new Date(game.created_at).toLocaleTimeString(
                                [],
                                {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                }
                              )}
                            </span>
                          </div>
                        </div>
                      </div>

                      <Button
                        onClick={() => handleJoinGame(game.id)}
                        disabled={game.is_full && game.status === 'waiting'}
                        className="w-full flex items-center justify-center"
                      >
                        <Trophy size={18} className="mr-2" />
                        {game.creator.id === user?.id
                          ? 'Enter My Room'
                          : game.status === 'waiting'
                          ? 'Join Game'
                          : 'View Game'}
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RoomList;
