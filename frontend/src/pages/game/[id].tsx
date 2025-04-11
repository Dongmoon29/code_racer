import React from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/layout/Layout';
import GameRoom from '../../components/game/GameRoom';
import { Spinner } from '../../components/ui';
import { Button } from '@/components/ui/Button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

const GamePage: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;

  // 게임 ID가 로드되지 않은 경우
  if (!id) {
    return (
      <Layout
        title="Loading... | Code Racer"
        description="Loading game..."
        requireAuth={true}
      >
        <div className="flex justify-center items-center h-64 text-[hsl(var(--foreground))]">
          <Spinner size="lg" />
        </div>
      </Layout>
    );
  }

  // 게임 ID가 올바른 UUID 형식이 아닌 경우
  if (
    typeof id !== 'string' ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  ) {
    return (
      <Layout
        title="Invalid Game | Code Racer"
        description="Invalid game ID"
        requireAuth={true}
      >
        <div className="max-w-2xl mx-auto p-6">
          <Alert variant="error">
            <AlertTitle className="text-lg font-semibold text-[hsl(var(--foreground))]">
              Invalid Game ID
            </AlertTitle>
            <AlertDescription className="mt-2 text-[hsl(var(--muted-foreground))]">
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
      </Layout>
    );
  }

  return (
    <Layout
      title="Game Room | Code Racer"
      description="Compete in real-time coding challenge"
      requireAuth={true}
    >
      <div className="w-full min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
        <div className="container mx-auto px-4 py-6">
          <GameRoom gameId={id} />
        </div>
      </div>
    </Layout>
  );
};

export default GamePage;
