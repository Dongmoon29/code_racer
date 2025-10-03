import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { userApi } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';

interface LeaderboardUser {
  id: string;
  name: string;
  rating: number;
}

interface RankedUser extends LeaderboardUser {
  rank: number;
}

const LeaderboardPage = () => {
  const { data, isFetching } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: () => userApi.getLeaderboard(),
    keepPreviousData: true,
  });

  const leaderboardUsers: LeaderboardUser[] = data?.users || [];

  const usersWithInitialRank: RankedUser[] = leaderboardUsers.map(
    (user, index) => ({
      ...user,
      rank: index + 1,
    })
  );

  // Post-process to handle same rating ranks
  const finalRankedUsers: RankedUser[] = usersWithInitialRank.map(
    (user, index) => {
      // Find the first user with the same rating
      const firstSameRatingIndex = usersWithInitialRank.findIndex(
        (u) => u.rating === user.rating
      );
      if (firstSameRatingIndex !== -1 && firstSameRatingIndex < index) {
        return {
          ...user,
          rank: usersWithInitialRank[firstSameRatingIndex].rank,
        };
      }
      return user;
    }
  );

  return (
    <DashboardLayout>
      <div className="py-2">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Leaderboard
          </h1>
          <p className="text-muted-foreground">
            Compete for the top spot in coding challenges
          </p>
        </div>

        <div className="overflow-hidden rounded-lg shadow">
          <table className="min-w-full divide-y">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Rank
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Rating
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {finalRankedUsers.map((user) => (
                <tr key={user.id}>
                  <td className="px-4 py-3 text-sm w-24">{user.rank}</td>
                  <td className="px-4 py-3 text-sm">{user.name}</td>
                  <td className="px-4 py-3 text-sm">{user.rating ?? '-'}</td>
                </tr>
              ))}
              {finalRankedUsers.length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-center text-sm" colSpan={3}>
                    {isFetching ? 'Loading…' : 'No users'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default LeaderboardPage;
