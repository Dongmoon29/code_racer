import React from 'react';
import Layout from '../components/layout/Layout';
import MatchingScreen from '@/components/game/MatchingScreen';
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

  if (!isLoggedIn) {
    return null;
  }

  return (
    <Layout
      title="Dashboard | Code Racer"
      description="Find opponents and start coding challenges"
    >
      <div className="min-h-screen bg-[hsl(var(--background))] py-8">
        <MatchingScreen
          onMatchFound={(gameId) => {
            // 매칭 완료 시 게임 페이지로 이동
            router.push(`/game/${gameId}`);
          }}
        />
      </div>
    </Layout>
  );
};

export default DashboardPage;

// 클라이언트 사이드에서 인증 체크 (토큰 기반)
export const getServerSideProps: GetServerSideProps = async () => {
  return { props: {} };
};
