import React from 'react';
import Image from 'next/image';
import {
  MapPin,
  Calendar,
  Star,
  Code,
  Github,
  Linkedin,
  Globe,
  Users,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userApi } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';

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

interface PublicProfileSidebarProps {
  user: UserInfo;
  onShowFollowers?: () => void;
  onShowFollowing?: () => void;
}

const PublicProfileSidebar: React.FC<PublicProfileSidebarProps> = ({
  user,
  onShowFollowers,
  onShowFollowing,
}) => {
  const { user: currentUser } = useAuthStore();
  const queryClient = useQueryClient();
  const isOwnProfile = currentUser?.id === user.id;

  // Get follow stats
  const { data: followStats, isLoading: statsLoading } = useQuery({
    queryKey: ['followStats', user.id],
    queryFn: () => userApi.getFollowStats(user.id),
    enabled: !isOwnProfile && !!currentUser, // Only fetch if not own profile and user is authenticated
  });

  // Follow mutation
  const followMutation = useMutation({
    mutationFn: () => userApi.follow(user.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['followStats', user.id] });
    },
  });

  // Unfollow mutation
  const unfollowMutation = useMutation({
    mutationFn: () => userApi.unfollow(user.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['followStats', user.id] });
    },
  });

  const handleFollow = () => {
    if (followStats?.stats.is_following) {
      unfollowMutation.mutate();
    } else {
      followMutation.mutate();
    }
  };

  const isFollowing = followStats?.stats.is_following ?? false;
  const followers = followStats?.stats.followers ?? 0;
  const following = followStats?.stats.following ?? 0;
  const isLoading = followMutation.isPending || unfollowMutation.isPending;

  return (
    <div className="w-full max-w-sm mx-auto lg:mx-0">
      <div className="flex flex-col gap-4">
        {/* Profile Image and Basic Info */}
        <div className="flex flex-col items-center">
          <div className="w-48 h-48 lg:w-64 lg:h-64 rounded-full overflow-hidden mb-4 flex items-center justify-center">
            {user?.profile_image ? (
              <Image
                src={user.profile_image}
                alt="Profile"
                width={256}
                height={256}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-4xl lg:text-6xl font-semibold ">
                {user?.name?.charAt(0)?.toUpperCase()}
              </div>
            )}
          </div>

          <h1 className="text-xl lg:text-2xl font-bold text-foreground mb-4 text-center">
            {user?.name}
          </h1>

          {/* Follow Stats */}
          {!isOwnProfile && currentUser && !statsLoading && (
            <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground mb-4">
              <button
                type="button"
                onClick={onShowFollowers}
                className="flex items-center gap-1 hover:opacity-80 transition-opacity cursor-pointer"
              >
                <Users className="w-4 h-4" />
                <span className="font-semibold text-foreground">
                  {followers}
                </span>
                <span>followers</span>
              </button>
              <span>·</span>
              <button
                type="button"
                onClick={onShowFollowing}
                className="flex items-center gap-1 hover:opacity-80 transition-opacity cursor-pointer"
              >
                <span className="font-semibold text-foreground">
                  {following}
                </span>
                <span>following</span>
              </button>
            </div>
          )}

          {/* Follow/Unfollow Button */}
          {!isOwnProfile && currentUser && (
            <button
              type="button"
              onClick={handleFollow}
              disabled={isLoading || statsLoading}
              className={`w-full rounded-lg font-semibold py-3 px-4 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
                isFollowing
                  ? 'bg-red-600 hover:bg-red-700 text-white dark:bg-red-600 dark:hover:bg-red-700'
                  : 'bg-[var(--green-9)] hover:bg-[var(--green-10)] text-white'
              }`}
            >
              {isFollowing ? 'Unfollow' : 'Follow'}
            </button>
          )}
        </div>

        {/* Location */}
        {user?.company && (
          <div className="flex align-center items-center space-x-2 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4" />
            <span>{user.company}</span>
            {/* Job Title */}
            {user?.job_title && <span>{user.job_title}</span>}
          </div>
        )}

        {/* Rating */}
        {user?.rating && (
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Star className="w-4 h-4 text-yellow-500" />
            <span className="font-semibold text-foreground">{user.rating}</span>
            <span>rating</span>
          </div>
        )}

        {/* Favorite Language */}
        {user?.fav_language && (
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Code className="w-4 h-4" />
            <span>Favorite Language</span>
            <span className="font-semibold text-foreground">
              {user.fav_language}
            </span>
          </div>
        )}

        {/* Member Since */}
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <Calendar className="w-4 h-4" />
          <span>
            Joined{' '}
            {new Date(user?.created_at || '').toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
            })}
          </span>
        </div>

        {/* Social Links */}
        {user?.github && (
          <a
            href={user.github}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-2 text-sm hover:underline break-all"
          >
            <Github className="w-4 h-4" />
            <span>{user.github}</span>
          </a>
        )}
        {user?.linkedin && (
          <a
            href={user.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-2 text-sm hover:underline break-all"
          >
            <Linkedin className="w-4 h-4" />
            <span>{user.linkedin}</span>
          </a>
        )}
        {user?.homepage && (
          <a
            href={user.homepage}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-2 text-sm hover:underline break-all"
          >
            <Globe className="w-4 h-4" />
            <span>{user.homepage}</span>
          </a>
        )}
      </div>
    </div>
  );
};

export default PublicProfileSidebar;
