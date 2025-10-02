import React, { FC } from 'react';
import Layout from '../components/layout/Layout';
import MatchingScreen from '@/components/game/MatchingScreen';
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/hooks/useAuth';

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
      <Layout
        title="Dashboard | Code Racer"
        description="Find opponents and start coding challenges"
      >
        <div className="min-h-screen bg-[hsl(var(--background))] flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout
      title="Dashboard | Code Racer"
      description="Find opponents and start coding challenges"
    >
      <div className="min-h-screen bg-[hsl(var(--background))] py-8">
        <MatchingScreen
          onMatchFound={(gameId) => {
            router.push(`/game/${gameId}`);
          }}
        />
      </div>
    </Layout>
  );
};

export default DashboardPage;
