import React, { useMemo, useState } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { communityApi } from '@/lib/api';
import { ROUTES } from '@/lib/router';
import {
  Bug,
  CheckCircle2,
  Clock,
  FileText,
  Lightbulb,
  Loader2,
  MessageSquare,
  Send,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  XCircle,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

type PostType = 'bug' | 'feature' | 'improvement' | 'other';
type PostStatus = 'pending' | 'in_progress' | 'resolved' | 'closed';
type PostSort = 'hot' | 'new' | 'top';

interface Post {
  id: string;
  user_id: string;
  type: PostType;
  title: string;
  content: string;
  status: PostStatus;
  score: number;
  comment_count: number;
  my_vote: number;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    name: string;
    email: string;
    profile_image?: string;
  };
}

const CommunityIndexPage = () => {
  const [showForm, setShowForm] = useState(false);
  const [sort, setSort] = useState<PostSort>('hot');
  const [formData, setFormData] = useState({
    type: 'bug' as PostType,
    title: '',
    content: '',
  });
  const [error, setError] = useState<string>('');

  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: postsData, isLoading: postsLoading } = useQuery({
    queryKey: ['communityPosts', sort],
    queryFn: () => communityApi.listPosts(50, 0, undefined, undefined, sort),
  });

  const posts: Post[] = postsData?.data?.items || [];

  const createPostMutation = useMutation({
    mutationFn: (payload: { type: PostType; title: string; content: string }) =>
      communityApi.create(payload.type, payload.title, payload.content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communityPosts'] });
      setShowForm(false);
      setFormData({ type: 'bug', title: '', content: '' });
      setError('');
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : 'Failed to create post';
      setError(msg);
    },
  });

  const voteMutation = useMutation({
    mutationFn: (payload: { postId: string; value: -1 | 0 | 1 }) =>
      communityApi.vote(payload.postId, payload.value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communityPosts'] });
    },
  });

  const getTypeIcon = (type: PostType) => {
    switch (type) {
      case 'bug':
        return <Bug className="w-4 h-4 text-red-500" />;
      case 'feature':
        return <Sparkles className="w-4 h-4 text-purple-500" />;
      case 'improvement':
        return <Lightbulb className="w-4 h-4 text-yellow-500" />;
      default:
        return <FileText className="w-4 h-4 text-blue-500" />;
    }
  };

  const getTypeLabel = (type: PostType) => {
    switch (type) {
      case 'bug':
        return 'Bug Report';
      case 'feature':
        return 'Feature Request';
      case 'improvement':
        return 'Improvement';
      default:
        return 'Other';
    }
  };

  const getStatusIcon = (status: PostStatus) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-gray-500" />;
      case 'in_progress':
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'resolved':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'closed':
        return <XCircle className="w-4 h-4 text-gray-400" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const sortTabs = useMemo(
    () =>
      [
        { key: 'hot' as const, label: 'Hot' },
        { key: 'new' as const, label: 'New' },
        { key: 'top' as const, label: 'Top' },
      ] satisfies Array<{ key: PostSort; label: string }>,
    []
  );

  return (
    <>
      <Head>
        <title>Community - CodeRacer</title>
      </Head>

      <div className="max-w-7xl mx-auto py-8">
        <div className="flex items-start justify-between gap-6 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-[var(--color-text)] mb-2">
              Community
            </h1>
          </div>

          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-[var(--accent-9)] text-white rounded-lg hover:bg-[var(--accent-10)] transition-colors flex items-center gap-2 shrink-0"
          >
            <MessageSquare className="w-4 h-4" />
            New Post
          </button>
        </div>

        {/* Sort Tabs */}
        <div className="flex items-center gap-2 mb-4">
          {sortTabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setSort(t.key)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                sort === t.key
                  ? 'bg-[var(--gray-3)] text-[var(--color-text)]'
                  : 'text-[var(--gray-11)] hover:bg-[var(--gray-2)]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Create Post Form */}
        {showForm && (
          <div className="bg-[var(--color-panel)] border border-[var(--gray-6)] rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 text-[var(--color-text)]">
              Create New Post
            </h2>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
                {error}
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                createPostMutation.mutate(formData);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium mb-2 text-[var(--color-text)]">
                  Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      type: e.target.value as PostType,
                    })
                  }
                  className="w-full px-3 py-2 border border-[var(--gray-6)] rounded-md bg-[var(--color-panel)] text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-9)]"
                >
                  <option value="bug">Bug Report</option>
                  <option value="feature">Feature Request</option>
                  <option value="improvement">Improvement</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-[var(--color-text)]">
                  Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="A short, descriptive title"
                  className="w-full px-3 py-2 border border-[var(--gray-6)] rounded-md bg-[var(--color-panel)] text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-9)]"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-[var(--color-text)]">
                  Content
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) =>
                    setFormData({ ...formData, content: e.target.value })
                  }
                  placeholder="Describe the details..."
                  rows={5}
                  className="w-full px-3 py-2 border border-[var(--gray-6)] rounded-md bg-[var(--color-panel)] text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-9)] resize-none"
                  required
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 border border-[var(--gray-6)] rounded-md text-[var(--color-text)] hover:bg-[var(--gray-2)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createPostMutation.isPending}
                  className="px-4 py-2 bg-[var(--accent-9)] text-white rounded-md hover:bg-[var(--accent-10)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  {createPostMutation.isPending ? 'Posting...' : 'Post'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Posts List */}
        <div className="space-y-3">
          {postsLoading ? (
            <div className="text-center py-8 text-[var(--gray-11)]">
              Loading...
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-8 text-[var(--gray-11)]">
              No posts yet.
            </div>
          ) : (
            posts.map((post) => {
              const myVote = post.my_vote ?? 0;
              const score = post.score ?? 0;
              const commentCount = post.comment_count ?? 0;
              const canVote = !!user?.id;

              return (
                <div
                  key={post.id}
                  className="bg-[var(--color-panel)] border border-[var(--gray-6)] rounded-lg p-4 hover:border-[var(--accent-7)] transition-colors"
                >
                  <div className="flex gap-3">
                    {/* Profile Image */}
                    <div className="flex-shrink-0">
                      <Link
                        href={
                          post.user?.id
                            ? ROUTES.USER_PROFILE(post.user.id)
                            : '#'
                        }
                        className="block"
                      >
                        {post.user?.profile_image ? (
                          <Image
                            src={post.user.profile_image}
                            alt={post.user.name}
                            width={32}
                            height={32}
                            className="rounded-full"
                            unoptimized
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-[var(--accent-9)] flex items-center justify-center text-white text-sm">
                            {post.user?.name?.[0] || 'U'}
                          </div>
                        )}
                      </Link>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Link
                          href={
                            post.user?.id
                              ? ROUTES.USER_PROFILE(post.user.id)
                              : '#'
                          }
                          className="text-sm font-semibold text-[var(--color-text)] hover:text-[var(--accent-9)] transition-colors"
                        >
                          {post.user?.name || 'Anonymous'}
                        </Link>
                        <span className="text-sm text-[var(--gray-11)]">
                          {new Date(post.created_at).toLocaleDateString(
                            'en-US',
                            {
                              month: 'short',
                              day: 'numeric',
                              year:
                                new Date(post.created_at).getFullYear() !==
                                new Date().getFullYear()
                                  ? 'numeric'
                                  : undefined,
                            }
                          )}
                        </span>
                      </div>

                      <Link href={`/community/${post.id}`} className="block">
                        <h3 className="text-base font-semibold text-[var(--color-text)] hover:text-[var(--accent-9)] transition-colors line-clamp-2 mb-1">
                          {post.title}
                        </h3>
                      </Link>

                      <p className="text-sm text-[var(--gray-11)] line-clamp-2 whitespace-pre-wrap mb-2">
                        {post.content}
                      </p>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-6">
                        {/* Vote Group */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              const next: -1 | 0 | 1 = myVote === 1 ? 0 : 1;
                              voteMutation.mutate({
                                postId: post.id,
                                value: next,
                              });
                            }}
                            className={`flex items-center gap-1 transition-colors text-sm ${
                              myVote === 1
                                ? 'text-[var(--accent-9)]'
                                : 'text-[var(--gray-11)] hover:text-[var(--accent-9)]'
                            }`}
                            title={canVote ? 'Like' : 'Login to like'}
                            disabled={!canVote || voteMutation.isPending}
                          >
                            <ThumbsUp className="w-4 h-4" />
                            <span className="font-medium">
                              {score > 0 ? score : ''}
                            </span>
                          </button>
                          <button
                            onClick={() => {
                              const next: -1 | 0 | 1 = myVote === -1 ? 0 : -1;
                              voteMutation.mutate({
                                postId: post.id,
                                value: next,
                              });
                            }}
                            className={`flex items-center gap-1 transition-colors text-sm ${
                              myVote === -1
                                ? 'text-red-500'
                                : 'text-[var(--gray-11)] hover:text-red-500'
                            }`}
                            title={canVote ? 'Dislike' : 'Login to dislike'}
                            disabled={!canVote || voteMutation.isPending}
                          >
                            <ThumbsDown className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Comment Count */}
                        <Link
                          href={`/community/${post.id}`}
                          className="flex items-center gap-1 text-sm text-[var(--gray-11)] hover:text-[var(--accent-9)] transition-colors"
                        >
                          <MessageSquare className="w-4 h-4" />
                          <span>{commentCount}</span>
                        </Link>

                        {/* Type Badge */}
                        <div className="flex items-center gap-1.5 text-sm">
                          {getTypeIcon(post.type)}
                          <span className="text-[var(--gray-11)]">
                            {getTypeLabel(post.type)}
                          </span>
                        </div>

                        {/* Status Badge */}
                        <div className="flex items-center gap-1">
                          {getStatusIcon(post.status)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
};

export default CommunityIndexPage;
