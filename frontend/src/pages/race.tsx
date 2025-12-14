import React from 'react';
import Head from 'next/head';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { MatchingScreen } from '@/components/game/MatchingScreen';
import { useRouter } from 'next/router';

const RacePage = () => {
  const router = useRouter();

  const handleMatchFound = (gameId: string) => {
    router.push(`/game/${gameId}`);
  };

  return (
    <DashboardLayout>
      <Head>
        <title>Race - CodeRacer</title>
        <meta name="description" content="Start a competitive coding race" />
      </Head>

      <div className="py-6">
        <div className="max-w-4xl mx-auto">
          <MatchingScreen onMatchFound={handleMatchFound} />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default RacePage;
