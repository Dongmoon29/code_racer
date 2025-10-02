import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';

const LeaderboardPage = () => {
  return (
    <DashboardLayout>
      <div className="py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Leaderboard
          </h1>
          <p className="text-muted-foreground">
            Compete for the top spot in coding challenges
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <div className="bg-card rounded-lg border border-border p-6 text-center">
            <div className="text-4xl mb-2">🥇</div>
            <h3 className="text-lg font-semibold mb-2 text-foreground">
              Gold League
            </h3>
            <p className="text-sm text-muted-foreground">Top 1% performers</p>
          </div>
          <div className="bg-card rounded-lg border border-border p-6 text-center">
            <div className="text-4xl mb-2">🥈</div>
            <h3 className="text-lg font-semibold mb-2 text-foreground">
              Silver League
            </h3>
            <p className="text-sm text-muted-foreground">Top 10% performers</p>
          </div>
          <div className="bg-card rounded-lg border border-border p-6 text-center">
            <div className="text-4xl mb-2">🥉</div>
            <h3 className="text-lg font-semibold mb-2 text-foreground">
              Bronze League
            </h3>
            <p className="text-sm text-muted-foreground">Top 25% performers</p>
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border p-6">
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🏆</div>
            <h3 className="text-xl font-semibold mb-2 text-foreground">
              Leaderboard Coming Soon
            </h3>
            <p className="text-muted-foreground mb-6">
              Global rankings will be available when more players join the
              platform
            </p>
            <div className="text-sm text-muted-foreground">
              Play more games to improve your ranking
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default LeaderboardPage;
