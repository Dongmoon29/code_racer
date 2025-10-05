import React, { FC } from 'react';
import Head from 'next/head';
import MatchingScreen from '@/components/game/MatchingScreen';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/hooks/useAuth';
import CodeRacerLoader from '@/components/ui/CodeRacerLoader';
import { useRouterHelper } from '@/lib/router';

const DashboardPage: FC = () => {
  const router = useRouter();
  const routerHelper = useRouterHelper(router);
  const { isLoggedIn, isLoading } = useAuth();

  useEffect(() => {
    // Only redirect if we're sure the user is not logged in
    // and we're not still loading
    if (!isLoading && !isLoggedIn) {
      routerHelper.replaceToLogin();
    }
  }, [isLoading, isLoggedIn, routerHelper]);

  // Show loading while checking auth status
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <CodeRacerLoader size="lg" />
      </div>
    );
  }

  // Show loading if not logged in (will redirect)
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <CodeRacerLoader size="lg" />
      </div>
    );
  }

  return (
    <DashboardLayout>
      <Head>
        <title>Dashboard - CodeRacer</title>
        <meta
          name="description"
          content="Find coding matches and compete in real-time"
        />
      </Head>
      <div className="py-8">
        <div className="py-8">
          <MatchingScreen
            onMatchFound={(gameId) => {
              routerHelper.goToGameRoom(gameId);
            }}
          />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DashboardPage;
