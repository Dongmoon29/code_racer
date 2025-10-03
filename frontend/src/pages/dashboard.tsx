import React, { FC } from 'react';
import Head from 'next/head';
import MatchingScreen from '@/components/game/MatchingScreen';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/hooks/useAuth';
import CodeRacerLoader from '@/components/ui/CodeRacerLoader';

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
              router.push(`/game/${gameId}`);
            }}
          />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DashboardPage;
