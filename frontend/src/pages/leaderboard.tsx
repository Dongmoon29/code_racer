import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { Crown } from 'lucide-react';
import { userApi } from '@/lib/api';
import { LAYOUT_PADDING } from '@/lib/styles';
import { useQuery } from '@tanstack/react-query';
import { ROUTES } from '@/lib/router';

interface LeaderboardUser {
  id: string;
  name: string;
  profile_image?: string;
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

  const topThree = finalRankedUsers.slice(0, 3);
  const rest = finalRankedUsers.slice(3);

  const getCardStyles = (position: number) => {
    // 0: center (1st), 1: left (2nd), 2: right (3rd)
    switch (position) {
      case 0:
        return {
          wrapper:
            'bg-gradient-to-b from-amber-500/30 via-amber-500/15 to-amber-500/5 dark:from-amber-500/20 dark:via-amber-500/10 dark:to-transparent border-amber-500 dark:border-amber-500/60 shadow-[0_0_40px_rgba(245,158,11,0.3)] dark:shadow-[0_0_40px_rgba(245,158,11,0.5)] bg-[var(--color-panel)]',
          badge: 'bg-amber-500 text-white dark:text-black',
          name: 'text-amber-700 dark:text-amber-50 font-bold',
          rating: 'text-amber-600 dark:text-amber-200',
        };
      case 1:
        return {
          wrapper:
            'bg-gradient-to-b from-violet-500/30 via-violet-500/15 to-violet-500/5 dark:from-violet-500/20 dark:via-violet-500/10 dark:to-transparent border-violet-500 dark:border-violet-500/60 shadow-[0_0_30px_rgba(139,92,246,0.3)] dark:shadow-[0_0_30px_rgba(139,92,246,0.4)] bg-[var(--color-panel)]',
          badge: 'bg-violet-500 text-white',
          name: 'text-violet-700 dark:text-violet-50 font-bold',
          rating: 'text-violet-600 dark:text-violet-200',
        };
      default:
        return {
          wrapper:
            'bg-gradient-to-b from-fuchsia-500/30 via-fuchsia-500/15 to-fuchsia-500/5 dark:from-fuchsia-500/20 dark:via-fuchsia-500/10 dark:to-transparent border-fuchsia-500 dark:border-fuchsia-500/60 shadow-[0_0_30px_rgba(217,70,239,0.3)] dark:shadow-[0_0_30px_rgba(217,70,239,0.4)] bg-[var(--color-panel)]',
          badge: 'bg-fuchsia-500 text-white',
          name: 'text-fuchsia-700 dark:text-fuchsia-50 font-bold',
          rating: 'text-fuchsia-600 dark:text-fuchsia-200',
        };
    }
  };

  return (
    <>
      <Head>
        <title>Leaderboard - CodeRacer</title>
        <meta
          name="description"
          content="Compete for the top spot in coding challenges"
        />
      </Head>
      <div className={LAYOUT_PADDING.SECTION}>
        {/* Header */}
        <div className="flex flex-col items-center mb-10 text-center">
          <div className="w-12 h-12 rounded-full bg-[var(--accent-9)] flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(129,140,248,0.6)]">
            <Crown className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground mb-2">
            LEADERBOARD
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Top players this season
          </p>
        </div>

        {/* Top 3 cards - Vertical on mobile, Pyramid on desktop */}
        {topThree.length > 0 && (
          <div className="flex flex-col md:flex-col items-center mb-10 gap-4 sm:gap-6">
            {/* Mobile: All 3 cards in vertical stack */}
            <div className="flex flex-col md:hidden gap-4 w-full max-w-md">
              {topThree.map((user, index) => {
                const styles = getCardStyles(index);
                const positionLabel =
                  index === 0 ? '1st' : index === 1 ? '2nd' : '3rd';

                return (
                  <div
                    key={user.id}
                    className={`relative rounded-3xl border px-6 py-8 flex flex-col items-center justify-between w-full ${styles.wrapper}`}
                  >
                    {/* Rank badge */}
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <div className="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold shadow-lg bg-[var(--color-panel)] border border-[var(--gray-7)]">
                        <Crown className="w-3 h-3 text-amber-400" />
                        <span>#{positionLabel}</span>
                      </div>
                    </div>

                    {/* Avatar circle */}
                    <div className="w-20 h-20 rounded-full overflow-hidden mb-4 border-2 border-[var(--gray-7)] dark:border-white/10 shadow-inner flex items-center justify-center bg-[var(--gray-9)] dark:bg-black/60">
                      {user.profile_image ? (
                        <Image
                          src={user.profile_image}
                          alt={user.name}
                          width={80}
                          height={80}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-3xl font-bold text-white">
                          {user.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>

                    {/* Name */}
                    <Link
                      href={ROUTES.USER_PROFILE(user.id)}
                      className={`text-base font-semibold mb-1 hover:underline ${styles.name}`}
                    >
                      {user.name}
                    </Link>

                    {/* Rating */}
                    <div
                      className={`text-2xl font-extrabold mb-1 ${styles.rating}`}
                    >
                      {user.rating.toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground mb-4">
                      rating
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop: Pyramid layout */}
            <div className="hidden md:flex flex-col items-center gap-4 sm:gap-6 w-full">
              {/* 1st Place - Top Center */}
              {topThree[0] &&
                (() => {
                  const user = topThree[0];
                  const styles = getCardStyles(0);
                  return (
                    <div
                      key={user.id}
                      className={`relative rounded-3xl border px-8 py-10 flex flex-col items-center justify-between w-full max-w-md ${styles.wrapper}`}
                    >
                      {/* Rank badge */}
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                        <div className="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold shadow-lg bg-[var(--color-panel)] border border-[var(--gray-7)]">
                          <Crown className="w-3 h-3 text-amber-400" />
                          <span>#1st</span>
                        </div>
                      </div>

                      {/* Avatar circle */}
                      <div className="w-24 h-24 rounded-full overflow-hidden mb-4 border-2 border-[var(--gray-7)] dark:border-white/10 shadow-inner flex items-center justify-center bg-[var(--gray-9)] dark:bg-black/60">
                        {user.profile_image ? (
                          <Image
                            src={user.profile_image}
                            alt={user.name}
                            width={96}
                            height={96}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-4xl font-bold text-white">
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>

                      {/* Name */}
                      <Link
                        href={ROUTES.USER_PROFILE(user.id)}
                        className={`text-lg font-semibold mb-1 hover:underline ${styles.name}`}
                      >
                        {user.name}
                      </Link>

                      {/* Rating */}
                      <div
                        className={`text-3xl font-extrabold mb-1 ${styles.rating}`}
                      >
                        {user.rating.toLocaleString()}
                      </div>
                      <div className="text-xs text-muted-foreground mb-4">
                        rating
                      </div>
                    </div>
                  );
                })()}

              {/* 2nd and 3rd Place - Bottom Left and Right */}
              <div className="grid grid-cols-2 gap-6 w-full max-w-2xl">
                {topThree.slice(1).map((user, index) => {
                  const styles = getCardStyles(index === 0 ? 1 : 2);
                  const positionLabel = user.rank === 2 ? '2nd' : '3rd';

                  return (
                    <div
                      key={user.id}
                      className={`relative rounded-3xl border px-6 py-8 flex flex-col items-center justify-between ${styles.wrapper}`}
                    >
                      {/* Rank badge */}
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                        <div className="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold shadow-lg bg-[var(--color-panel)] border border-[var(--gray-7)]">
                          <Crown className="w-3 h-3 text-amber-400" />
                          <span>#{positionLabel}</span>
                        </div>
                      </div>

                      {/* Avatar circle */}
                      <div className="w-20 h-20 rounded-full overflow-hidden mb-3 border-2 border-[var(--gray-7)] dark:border-white/10 shadow-inner flex items-center justify-center bg-[var(--gray-9)] dark:bg-black/60">
                        {user.profile_image ? (
                          <Image
                            src={user.profile_image}
                            alt={user.name}
                            width={80}
                            height={80}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-3xl font-bold text-white">
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>

                      {/* Name */}
                      <Link
                        href={ROUTES.USER_PROFILE(user.id)}
                        className={`text-base font-semibold mb-1 hover:underline ${styles.name}`}
                      >
                        {user.name}
                      </Link>

                      {/* Rating */}
                      <div
                        className={`text-2xl font-extrabold mb-1 ${styles.rating}`}
                      >
                        {user.rating.toLocaleString()}
                      </div>
                      <div className="text-xs text-muted-foreground mb-2">
                        rating
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Rest of leaderboard as list */}
        <div className="mt-6">
          <div className="overflow-hidden rounded-2xl border border-[var(--gray-6)] bg-[var(--color-panel)]">
            {rest.length === 0 && topThree.length === 0 && (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                {isFetching ? 'Loading…' : 'No users'}
              </div>
            )}

            {rest.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between px-4 sm:px-6 py-4 border-t border-[var(--gray-6)] hover:bg-[var(--gray-4)] transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-8 text-sm font-semibold text-muted-foreground">
                    #{user.rank}
                  </div>
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-[var(--gray-9)] dark:bg-black/60 flex items-center justify-center text-sm font-semibold text-white">
                    {user.profile_image ? (
                      <Image
                        src={user.profile_image}
                        alt={user.name}
                        width={40}
                        height={40}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      user.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="flex flex-col">
                    <Link
                      href={ROUTES.USER_PROFILE(user.id)}
                      className="text-sm font-medium text-foreground hover:text-[var(--accent-10)] hover:underline transition-colors"
                    >
                      {user.name}
                    </Link>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-sm font-semibold text-foreground">
                    {user.rating.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    points
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default LeaderboardPage;
