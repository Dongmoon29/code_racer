import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userApi } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { ROUTES } from '@/lib/router';

interface FollowListsProps {
  userId: string;
}

type FollowerUser = {
  id: string;
  name: string;
  email: string;
  profile_image?: string;
};

export const FollowersList: React.FC<FollowListsProps> = ({ userId }) => {
  const { data, isLoading } = useQuery({
    queryKey: ['followers', userId],
    queryFn: () => userApi.getFollowers(userId, 1, 50),
  });

  const followers: FollowerUser[] = data?.items || [];

  return (
    <div className="bg-card rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-4">Followers</h3>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Loading...</div>
      ) : followers.length === 0 ? (
        <div className="text-sm text-muted-foreground">No followers yet.</div>
      ) : (
        <div className="space-y-3">
          {followers.map((follower) => (
            <FollowerItem key={follower.id} user={follower} />
          ))}
        </div>
      )}
    </div>
  );
};

export const FollowingList: React.FC<FollowListsProps> = ({ userId }) => {
  const { data, isLoading } = useQuery({
    queryKey: ['following', userId],
    queryFn: () => userApi.getFollowing(userId, 1, 50),
  });

  const following: FollowerUser[] = data?.items || [];

  return (
    <div className="bg-card rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-4">Following</h3>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Loading...</div>
      ) : following.length === 0 ? (
        <div className="text-sm text-muted-foreground">
          Not following anyone yet.
        </div>
      ) : (
        <div className="space-y-3">
          {following.map((user) => (
            <FollowerItem key={user.id} user={user} />
          ))}
        </div>
      )}
    </div>
  );
};

interface FollowerItemProps {
  user: FollowerUser;
}

const FollowerItem: React.FC<FollowerItemProps> = ({ user }) => {
  const { user: currentUser } = useAuthStore();
  const queryClient = useQueryClient();

  // Get follow stats for this user
  const { data: followStats } = useQuery({
    queryKey: ['followStats', user.id],
    queryFn: () => userApi.getFollowStats(user.id),
    enabled: !!currentUser && currentUser.id !== user.id,
  });

  const followMutation = useMutation({
    mutationFn: () => userApi.follow(user.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['followStats', user.id] });
    },
  });

  const unfollowMutation = useMutation({
    mutationFn: () => userApi.unfollow(user.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['followStats', user.id] });
    },
  });

  const isFollowing = followStats?.stats.is_following ?? false;
  const isLoading = followMutation.isPending || unfollowMutation.isPending;
  const isOwnProfile = currentUser?.id === user.id;

  const handleFollow = () => {
    if (isFollowing) {
      unfollowMutation.mutate();
    } else {
      followMutation.mutate();
    }
  };

  return (
    <div className="flex items-center justify-between p-4 rounded-lg border transition-all duration-200 hover:bg-muted/50 hover:-translate-y-1">
      <Link
        href={ROUTES.USER_PROFILE(user.id)}
        className="flex items-center gap-3 flex-1 min-w-0"
        onClick={(e) => {
          // Don't navigate if clicking on follow button
          if ((e.target as HTMLElement).closest('button')) {
            e.preventDefault();
          }
        }}
      >
        <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-[var(--gray-9)] dark:bg-black/60 flex items-center justify-center">
          {user.profile_image ? (
            <Image
              src={user.profile_image}
              alt={user.name}
              width={40}
              height={40}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-sm font-semibold text-white">
              {user.name.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-foreground truncate">{user.name}</div>
          <div className="text-sm text-muted-foreground truncate">
            {user.email}
          </div>
        </div>
      </Link>
      {currentUser && !isOwnProfile && (
        <button
          type="button"
          onClick={handleFollow}
          disabled={isLoading}
          className={`ml-4 px-3 py-1.5 rounded-md font-medium text-xs transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
            isFollowing
              ? 'bg-red-600 hover:bg-red-700 text-white dark:bg-red-600 dark:hover:bg-red-700'
              : 'bg-[var(--green-9)] hover:bg-[var(--green-10)] text-white'
          }`}
        >
          {isFollowing ? 'Unfollow' : 'Follow'}
        </button>
      )}
    </div>
  );
};

