import React, { useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { ProfileSidebar, GameHistory } from '@/components/profile';
import { Loader } from '@/components/ui/Loader';
import { ROUTES } from '@/lib/router';

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

interface CurrentUserResponse extends UserInfo {
  recent_games: RecentGameSummary[];
}

const DashboardIndex = () => {
  const router = useRouter();
  const { data, isLoading, error } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const response = await api.get('/users/me');
      return response.data as {
        success: boolean;
        data: CurrentUserResponse;
      };
    },
  });

  const user = data?.data as CurrentUserResponse | undefined;

  // Redirect to user profile page when user data is loaded
  useEffect(() => {
    if (user?.id) {
      router.replace(ROUTES.USER_PROFILE(user.id));
    }
  }, [user?.id, router]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="py-8">
          <div className="flex items-center justify-center">
            <Loader variant="branded" />
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
              Failed to load user information
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const recentGames = user?.recent_games;

  return (
    <DashboardLayout>
      <Head>
        <title>My Profile - CodeRacer</title>
        <meta
          name="description"
          content="Manage your profile and account settings"
        />
      </Head>

      <div className="py-6">
        <div className="max-w-7xl">
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="lg:w-80 flex-shrink-0">
              <ProfileSidebar user={user!} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="space-y-6">
                <GameHistory currentUserId={user?.id} games={recentGames} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DashboardIndex;
