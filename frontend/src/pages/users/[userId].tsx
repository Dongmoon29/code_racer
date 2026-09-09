import React, { useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import {
  GameHistory,
  ProfileSidebar,
  PublicProfileSidebar,
} from "@/components/profile";
import { MatchingScreen } from "@/components/game/MatchingScreen";
import { Loader } from "@/components/ui/Loader";
import { useAuthStore } from "@/stores/authStore";
import { FollowersList, FollowingList } from "@/components/profile/FollowLists";
import { LAYOUT_PADDING } from "@/lib/styles";

interface UserInfo {
  id: string;
  email: string;
  name: string;
  profile_image?: string;
  role: string;
  homepage?: string;
  linkedin?: string;
  github?: string;
  company?: string;
  job_title?: string;
  fav_language?: string;
  created_at: string;
  rating?: number;
}

interface RecentGameSummary {
  id: string;
  mode: "ranked_pvp" | "casual_pvp" | "single";
  status: "waiting" | "playing" | "finished" | "closed";
  problem: { id: string; title: string; difficulty: string };
  player_a: { id: string; name: string; profile_image?: string };
  player_b?: { id: string; name: string; profile_image?: string };
  winner_id?: string;
  started_at?: string;
  ended_at?: string;
  created_at: string;
}

interface UserProfileResponse extends UserInfo {
  recent_games: RecentGameSummary[];
}

type ProfileTab = "games" | "followers" | "following";

const UserProfilePage = () => {
  const router = useRouter();
  const { userId } = router.query;
  const currentUser = useAuthStore((state) => state.user);
  const [activeTab, setActiveTab] = useState<ProfileTab>("games");

  const { data, isLoading, error } = useQuery({
    queryKey: ["userProfile", userId],
    queryFn: async () => {
      const response = await api.get(`/users/${userId}/profile`);
      return response.data as {
        success: boolean;
        profile: UserProfileResponse;
      };
    },
    enabled: !!userId && router.isReady,
  });

  // Wait for router to be ready
  if (!router.isReady || !userId) {
    return (
      <div className={LAYOUT_PADDING.SECTION}>
        <div className="flex items-center justify-center">
          <Loader variant="spinner" size="lg" />
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={LAYOUT_PADDING.SECTION}>
        <div className="flex items-center justify-center">
          <Loader variant="spinner" size="lg" />
        </div>
      </div>
    );
  }

  if (error || !data?.profile) {
    return (
      <div className={LAYOUT_PADDING.SECTION}>
        <div className="flex items-center justify-center">
          <div className="text-lg text-[var(--red-9)]">
            Failed to load user profile
          </div>
        </div>
      </div>
    );
  }

  const user = data?.profile;
  const recentGames = user?.recent_games;
  const isOwnProfile = currentUser?.id === userId;

  const handleMatchFound = (gameId: string) => {
    router.push(`/game/${gameId}`);
  };

  return (
    <>
      <Head>
        <title>{user?.name}&apos;s Profile - CodeRacer</title>
        <meta
          name="description"
          content={`View ${user?.name}'s profile on CodeRacer`}
        />
      </Head>

      <div className="py-3 sm:py-6">
        <div className="mx-auto w-full max-w-4xl">
          <div className="mb-8">
            {!isOwnProfile && (
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent-11)]">Racer profile</p>
            )}
            <h1 className="mt-2 break-words text-3xl font-bold tracking-tight">{isOwnProfile ? `Welcome back, ${user.name}.` : user.name}</h1>
            <p className="mt-2 text-sm font-normal text-[var(--gray-11)]">{isOwnProfile ? 'Pick your next challenge and revisit your recent races.' : 'Explore recent races and connect with this developer.'}</p>
          </div>
          <div className="grid gap-6 xl:grid-cols-2 xl:items-stretch">
            <div className="min-w-0">
              {isOwnProfile ? (
                <ProfileSidebar
                  user={user!}
                  onShowFollowers={() => setActiveTab("followers")}
                  onShowFollowing={() => setActiveTab("following")}
                />
              ) : (
                <PublicProfileSidebar
                  user={user!}
                  onShowFollowers={() => setActiveTab("followers")}
                  onShowFollowing={() => setActiveTab("following")}
                />
              )}
            </div>

            {isOwnProfile && (
                  <section className="min-w-0 rounded-2xl border border-[var(--gray-6)] bg-[var(--color-panel)] p-5 sm:p-6 [&>div]:h-full">
                    <MatchingScreen onMatchFound={handleMatchFound} />
                  </section>
                )}
            <div className={`min-w-0 ${isOwnProfile ? "xl:col-start-2" : ""}`}>
              <div className="space-y-6">
                <nav aria-label="Profile sections" className="flex gap-1 overflow-x-auto border-b border-[var(--gray-6)]">
                  {(["games", "followers", "following"] as const).map((tab) => (
                    <button key={tab} type="button" aria-current={activeTab === tab ? "page" : undefined} onClick={() => setActiveTab(tab)} className={`shrink-0 cursor-pointer border-b-2 px-4 py-3 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent-9)] ${activeTab === tab ? "border-[var(--accent-9)] text-[var(--accent-11)]" : "border-transparent text-[var(--gray-11)] hover:text-[var(--gray-12)]"}`}>
                      {tab === "games" ? "Recent games" : tab === "followers" ? "Followers" : "Following"}
                    </button>
                  ))}
                </nav>
                {activeTab === "games" && (
                  <GameHistory currentUserId={user?.id} games={recentGames} />
                )}
                {activeTab === "followers" && (
                  <FollowersList userId={user?.id || ""} />
                )}
                {activeTab === "following" && (
                  <FollowingList userId={user?.id || ""} />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default UserProfilePage;
