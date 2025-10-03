import React, { FC } from 'react';
import MatchingScreen from '@/components/game/MatchingScreen';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/hooks/useAuth';
import RecentCommits from '@/components/ui/RecentCommits';

const DashboardPage: FC = () => {
  const router = useRouter();
  const { isLoggedIn, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      router.push('/login');
    }
  }, [isLoading, isLoggedIn, router]);

  if (isLoading || !isLoggedIn) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Matching Area */}
          <div className="lg:col-span-2">
            <MatchingScreen
              onMatchFound={(gameId) => {
                router.push(`/game/${gameId}`);
              }}
            />
          </div>

          {/* Recent Updates Sidebar */}
          <div className="lg:col-span-1">
            <RecentCommits maxCommits={3} />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DashboardPage;
