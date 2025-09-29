import React from 'react';
import Layout from '../components/layout/Layout';
// REMOVED: RoomList - replaced by automatic matching system
import { GetServerSideProps } from 'next';
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/hooks/useAuth';

const DashboardPage: React.FC = () => {
  const router = useRouter();
  const { isLoggedIn, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      router.push('/login');
    }
  }, [isLoading, isLoggedIn, router]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isLoggedIn) {
    return null;
  }

  return (
    <Layout
      title="Dashboard | Code Racer"
      description="Find opponents and start coding challenges"
    >
      <div className="min-h-screen bg-[hsl(var(--background))] flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-[hsl(var(--foreground))] mb-4">
            Welcome to Code Racer
          </h1>
          <p className="text-[hsl(var(--muted-foreground))] mb-8">
            Automatic matching system coming soon!
          </p>
          <div className="text-sm text-[hsl(var(--muted-foreground))]">
            The new matching system will automatically pair you with opponents
            based on difficulty.
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default DashboardPage;

// 클라이언트 사이드에서 인증 체크 (토큰 기반)
export const getServerSideProps: GetServerSideProps = async () => {
  return { props: {} };
};
