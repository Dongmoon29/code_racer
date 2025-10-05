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
        {/* Moved header from DifficultySelector */}
        <div className="text-center mb-8">
          <div className="mb-4">
            <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-blue-600 via-purple-600 to-green-600 bg-clip-text text-transparent">
              🏁 Code Racer
            </h1>
            <h2 className="text-2xl font-semibold text-[hsl(var(--foreground))]">
              Choose Your Racing Circuit
            </h2>
          </div>
          <div className="space-y-1">
            <p className="text-[hsl(var(--muted-foreground))] font-medium">
              Compete against friends or racers worldwide!
            </p>
            <p className="text-[hsl(var(--muted-foreground))]">
              💨 Select your preferred speed circuit and let the coding race
              begin!
            </p>
          </div>
        </div>

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
