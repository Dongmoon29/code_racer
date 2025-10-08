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
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Start a Race
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Challenge yourself or compete with other developers
            </p>
          </div>

          <MatchingScreen onMatchFound={handleMatchFound} />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default RacePage;
