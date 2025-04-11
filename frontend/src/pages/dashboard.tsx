import React from 'react';
import Layout from '../components/layout/Layout';
import RoomList from '@/components/game/RoomList';

const DashboardPage: React.FC = () => {
  return (
    <Layout
      title="Dashboard | Code Racer"
      description="Find or create coding challenge rooms"
      requireAuth={true}
    >
      <RoomList />
    </Layout>
  );
};

export default DashboardPage;
