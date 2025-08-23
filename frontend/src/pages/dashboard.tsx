import React from 'react';
import Layout from '../components/layout/Layout';
import RoomList from '@/components/game/RoomList';
import { GetServerSideProps } from 'next';
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/hooks/useAuth';

const DashboardPage: React.FC = () => {
  const router = useRouter();
  const { isLoggedIn, isLoading, user } = useAuth();

  console.log(user);
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
      description="Find or create coding challenge rooms"
    >
      <RoomList />
    </Layout>
  );
};

export default DashboardPage;

// 클라이언트 사이드에서 인증 체크 (토큰 기반)
export const getServerSideProps: GetServerSideProps = async () => {
  return { props: {} };
};
