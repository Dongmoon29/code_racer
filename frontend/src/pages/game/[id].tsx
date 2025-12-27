import React from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { GameRoom } from '../../components/dynamic';
import { Loader } from '../../components/ui/Loader';
import { Button } from '@/components/ui/Button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useAuthGuard } from '@/hooks/useAuthGuard';

const GamePage: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  const { isLoading: isAuthLoading } = useAuthGuard({
    requireAuth: true,
    redirectTo: '/login',
  });

  // 인증 로딩 중이거나 게임 ID가 로드되지 않은 경우
  if (isAuthLoading || !id) {
    return (
      <>
        <Head>
          <title>Loading... | Code Racer</title>
          <meta name="description" content="Loading game..." />
        </Head>
        <div className="flex justify-center items-center h-64 text-[var(--color-text)]">
          <Loader variant="spinner" size="lg" />
        </div>
      </>
    );
  }

  // 게임 ID가 올바른 UUID 형식이 아닌 경우
  if (
    typeof id !== 'string' ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  ) {
    return (
      <>
        <Head>
          <title>Invalid Game | Code Racer</title>
          <meta name="description" content="Invalid game ID" />
        </Head>
        <div className="max-w-2xl mx-auto p-6">
          <Alert variant="error">
            <AlertTitle className="text-lg font-semibold text-[var(--color-text)]">
              Invalid Game ID
            </AlertTitle>
            <AlertDescription className="mt-2 text-[var(--gray-11)]">
              <p className="mb-4">The game ID provided is not valid.</p>
              <Button
                onClick={() => router.push('/dashboard')}
                variant="default"
                className="w-full sm:w-auto"
              >
                Back to Dashboard
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Game Room | Code Racer</title>
        <meta name="description" content="Compete in real-time coding challenge" />
      </Head>
      <div className="w-full h-full bg-[var(--color-background)] text-[var(--color-text)]">
        <GameRoom gameId={id} />
      </div>
    </>
  );
};

export default GamePage;
