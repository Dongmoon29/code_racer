import React, { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { GameHistory, ProfileSidebar, PublicProfileSidebar } from '@/components/profile';
import { MatchingScreen } from '@/components/game/MatchingScreen';
import { Loader } from '@/components/ui/Loader';
import { useAuthStore } from '@/stores/authStore';
import { FollowersList, FollowingList } from '@/components/profile/FollowLists';

interface UserInfo {
  id: string;
  email: string;
  name: string;
  profile_image?: string;
  role: string;
  homepage?: string;
  linkedin?: string;
  github?: string;
  company?: string;
  job_title?: string;
  fav_language?: string;
  created_at: string;
  rating?: number;
}

interface RecentGameSummary {
  id: string;
  mode: 'ranked_pvp' | 'casual_pvp' | 'single';
  status: 'waiting' | 'playing' | 'finished' | 'closed';
  problem: { id: string; title: string; difficulty: string };
  player_a: { id: string; name: string };
  player_b?: { id: string; name: string };
  winner_id?: string;
  started_at?: string;
  ended_at?: string;
  created_at: string;
}

interface UserProfileResponse extends UserInfo {
  recent_games: RecentGameSummary[];
}

type ProfileTab = 'games' | 'followers' | 'following';

const UserProfilePage = () => {
  const router = useRouter();
  const { userId } = router.query;
  const { user: currentUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState<ProfileTab>('games');

  const { data, isLoading, error } = useQuery({
    queryKey: ['userProfile', userId],
    queryFn: async () => {
      const response = await api.get(`/users/${userId}/profile`);
      return response.data as {
        success: boolean;
        profile: UserProfileResponse;
      };
    },
    enabled: !!userId && router.isReady,
  });

  // Wait for router to be ready
  if (!router.isReady || !userId) {
    return (
      <DashboardLayout>
        <div className="py-8">
          <div className="flex items-center justify-center">
            <Loader variant="spinner" size="lg" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="py-8">
          <div className="flex items-center justify-center">
            <Loader variant="spinner" size="lg" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="py-8">
          <div className="flex items-center justify-center">
            <div className="text-lg text-red-600">
              Failed to load user profile
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const user = data?.profile;
  const recentGames = user?.recent_games;
  const isOwnProfile = currentUser?.id === userId;

  const handleMatchFound = (gameId: string) => {
    router.push(`/game/${gameId}`);
  };

  return (
    <DashboardLayout>
      <Head>
        <title>{user?.name}&apos;s Profile - CodeRacer</title>
        <meta
          name="description"
          content={`View ${user?.name}'s profile on CodeRacer`}
        />
      </Head>

      <div className="py-6">
        <div className="max-w-7xl">
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="lg:w-80 flex-shrink-0">
              {isOwnProfile ? (
                <ProfileSidebar
                  user={user!}
                  onShowFollowers={() => setActiveTab('followers')}
                  onShowFollowing={() => setActiveTab('following')}
                />
              ) : (
                <PublicProfileSidebar
                  user={user!}
                  onShowFollowers={() => setActiveTab('followers')}
                  onShowFollowing={() => setActiveTab('following')}
                />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="space-y-6">
                {isOwnProfile && activeTab === 'games' && (
                  <div className="bg-card rounded-lg border p-6">
                    <MatchingScreen onMatchFound={handleMatchFound} />
                  </div>
                )}
                {activeTab === 'games' && (
                  <GameHistory currentUserId={user?.id} games={recentGames} />
                )}
                {activeTab === 'followers' && (
                  <FollowersList userId={user?.id || ''} />
                )}
                {activeTab === 'following' && (
                  <FollowingList userId={user?.id || ''} />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default UserProfilePage;
