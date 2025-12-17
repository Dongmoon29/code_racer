import React, { useState } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { communityApi, communityCommentApi } from '@/lib/api';
import {
  MessageSquare,
  Bug,
  Sparkles,
  Lightbulb,
  FileText,
  CheckCircle2,
  Clock,
  XCircle,
  Loader2,
  Send,
  Trash2,
  Edit2,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

type PostType = 'bug' | 'feature' | 'improvement' | 'other';
type PostStatus = 'pending' | 'in_progress' | 'resolved' | 'closed';

interface Post {
  id: string;
  user_id: string;
  type: PostType;
  title: string;
  content: string;
  status: PostStatus;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    name: string;
    email: string;
    profile_image?: string;
  };
}

interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    name: string;
    email: string;
    profile_image?: string;
  };
}

const CommunityPage = () => {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    type: 'bug' as PostType,
    title: '',
    content: '',
  });
  const [error, setError] = useState<string>('');
  const [expandedPost, setExpandedPost] = useState<string | null>(null);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>(
    {}
  );
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editCommentContent, setEditCommentContent] = useState<string>('');

  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: postsData, isLoading } = useQuery({
    queryKey: ['communityPosts'],
    queryFn: () => communityApi.listPosts(50, 0),
  });

  const createMutation = useMutation({
    mutationFn: (data: { type: PostType; title: string; content: string }) =>
      communityApi.create(data.type, data.title, data.content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communityPosts'] });
      setFormData({ type: 'bug', title: '', content: '' });
      setShowForm(false);
      setError('');
    },
    onError: (err: unknown) => {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Failed to create post.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.title.trim()) {
      setError('Please enter a title.');
      return;
    }

    if (!formData.content.trim()) {
      setError('Please enter content.');
      return;
    }

    createMutation.mutate(formData);
  };

  const getTypeIcon = (type: PostType) => {
    switch (type) {
      case 'bug':
        return <Bug className="w-4 h-4" />;
      case 'feature':
        return <Sparkles className="w-4 h-4" />;
      case 'improvement':
        return <Lightbulb className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
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
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'in_progress':
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'resolved':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'closed':
        return <XCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusLabel = (status: PostStatus) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'in_progress':
        return 'In Progress';
      case 'resolved':
        return 'Resolved';
      case 'closed':
        return 'Closed';
    }
  };

  const posts: Post[] = postsData?.data?.items || [];

  return (
    <DashboardLayout>
      <Head>
        <title>Community - CodeRacer</title>
        <meta
          name="description"
          content="Share opinions and communicate with users"
        />
      </Head>
      <div className="py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-3xl font-bold text-[var(--color-text)]">
                Community
              </h1>
              <p className="text-[var(--gray-11)] mt-1">
                Share opinions and communicate with users
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-[var(--accent-9)] text-white rounded-md hover:bg-[var(--accent-10)] transition-colors"
          >
            {showForm ? 'Close' : 'Write Post'}
          </button>
        </div>

        {/* Form */}
        {showForm && (
          <div className="mb-8 p-6 bg-[var(--color-panel)] border border-[var(--gray-6)] rounded-lg">
            <h2 className="text-xl font-semibold mb-4 text-[var(--color-text)]">
              Create New Post
            </h2>
            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md text-red-700 dark:text-red-400 text-sm">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
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
                <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="Enter title"
                  className="w-full px-3 py-2 border border-[var(--gray-6)] rounded-md bg-[var(--color-panel)] text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-9)]"
                  maxLength={255}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
                  Content
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) =>
                    setFormData({ ...formData, content: e.target.value })
                  }
                  placeholder="Enter content"
                  rows={6}
                  className="w-full px-3 py-2 border border-[var(--gray-6)] rounded-md bg-[var(--color-panel)] text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-9)] resize-none"
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setFormData({ type: 'bug', title: '', content: '' });
                    setError('');
                  }}
                  className="px-4 py-2 border border-[var(--gray-6)] rounded-md text-[var(--color-text)] hover:bg-[var(--gray-4)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="px-4 py-2 bg-[var(--accent-9)] text-white rounded-md hover:bg-[var(--accent-10)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {createMutation.isPending ? 'Submitting...' : 'Submit'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Community Board */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-[var(--color-text)]">
            All Posts
          </h2>
          {isLoading ? (
            <div className="text-center py-12 text-[var(--gray-11)]">
              Loading...
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-12 text-[var(--gray-11)]">
              No posts have been written yet.
            </div>
          ) : (
            <div className="space-y-3">
              {posts.map((post) => (
                <PostItem
                  key={post.id}
                  post={post}
                  expandedPost={expandedPost}
                  setExpandedPost={setExpandedPost}
                  commentInputs={commentInputs}
                  setCommentInputs={setCommentInputs}
                  editingComment={editingComment}
                  editCommentContent={editCommentContent}
                  setEditCommentContent={setEditCommentContent}
                  setEditingComment={setEditingComment}
                  onCommentEdit={(commentId: string, content: string) => {
                    setEditingComment(commentId);
                    setEditCommentContent(content);
                  }}
                  getTypeIcon={getTypeIcon}
                  getTypeLabel={getTypeLabel}
                  getStatusIcon={getStatusIcon}
                  getStatusLabel={getStatusLabel}
                  currentUserId={user?.id}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

interface PostItemProps {
  post: Post;
  expandedPost: string | null;
  setExpandedPost: (id: string | null) => void;
  commentInputs: Record<string, string>;
  setCommentInputs: React.Dispatch<
    React.SetStateAction<Record<string, string>>
  >;
  editingComment: string | null;
  editCommentContent: string;
  setEditCommentContent: (content: string) => void;
  setEditingComment: (id: string | null) => void;
  onCommentEdit: (commentId: string, content: string) => void;
  getTypeIcon: (type: PostType) => React.ReactNode;
  getTypeLabel: (type: PostType) => string;
  getStatusIcon: (status: PostStatus) => React.ReactNode;
  getStatusLabel: (status: PostStatus) => string;
  currentUserId?: string;
}

const PostItem: React.FC<PostItemProps> = ({
  post,
  expandedPost,
  setExpandedPost,
  commentInputs,
  setCommentInputs,
  editingComment,
  editCommentContent,
  setEditCommentContent,
  setEditingComment,
  onCommentEdit,
  getTypeIcon,
  getTypeLabel,
  getStatusIcon,
  getStatusLabel,
  currentUserId,
}) => {
  const isExpanded = expandedPost === post.id;

  const { data: commentsData, isLoading: commentsLoading } = useQuery({
    queryKey: ['communityComments', post.id],
    queryFn: () => communityCommentApi.getComments(post.id),
    enabled: isExpanded,
  });

  const comments: Comment[] = commentsData?.data?.items || [];
  const queryClient = useQueryClient();

  const createCommentMutation = useMutation({
    mutationFn: ({ postId, content }: { postId: string; content: string }) =>
      communityCommentApi.create(postId, content),
    onSuccess: (
      _data: unknown,
      variables: { postId: string; content: string }
    ) => {
      queryClient.invalidateQueries({
        queryKey: ['communityComments', variables.postId],
      });
      setCommentInputs((prev) => ({ ...prev, [variables.postId]: '' }));
    },
  });

  const updateCommentMutation = useMutation({
    mutationFn: ({
      commentId,
      content,
    }: {
      commentId: string;
      content: string;
    }) => communityCommentApi.update(commentId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communityComments'] });
      setEditingComment(null);
      setEditCommentContent('');
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: (commentId: string) => communityCommentApi.delete(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communityComments'] });
    },
  });

  return (
    <div className="p-4 bg-[var(--color-panel)] border border-[var(--gray-6)] rounded-lg hover:border-[var(--accent-7)] transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="flex items-center gap-1 text-sm text-[var(--gray-11)]">
              {getTypeIcon(post.type)}
              {getTypeLabel(post.type)}
            </span>
            <span className="flex items-center gap-1 text-sm text-[var(--gray-11)]">
              {getStatusIcon(post.status)}
              {getStatusLabel(post.status)}
            </span>
          </div>
          <h3 className="text-lg font-semibold text-[var(--color-text)] mb-2">
            {post.title}
          </h3>
          <p className="text-[var(--gray-11)] text-sm whitespace-pre-wrap mb-3">
            {post.content}
          </p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {post.user?.profile_image ? (
                <Image
                  src={post.user.profile_image}
                  alt={post.user.name}
                  width={24}
                  height={24}
                  className="w-6 h-6 rounded-full"
                  unoptimized
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-[var(--accent-9)] flex items-center justify-center text-white text-xs">
                  {post.user?.name?.[0] || 'U'}
                </div>
              )}
              <span className="text-xs text-[var(--gray-11)] font-medium">
                {post.user?.name || 'Anonymous'}
              </span>
              <span className="text-xs text-[var(--gray-11)]">
                · {new Date(post.created_at).toLocaleString('en-US')}
              </span>
            </div>
            <button
              onClick={() => setExpandedPost(isExpanded ? null : post.id)}
              className="text-sm text-[var(--accent-9)] hover:text-[var(--accent-10)] flex items-center gap-1"
            >
              <MessageSquare className="w-4 h-4" />
              Comments {comments.length > 0 && `(${comments.length})`}
            </button>
          </div>
        </div>
      </div>

      {/* Comments Section */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-[var(--gray-6)]">
          {/* Comment Input */}
          <div className="mb-4">
            <textarea
              value={commentInputs[post.id] || ''}
              onChange={(e) =>
                setCommentInputs((prev) => ({
                  ...prev,
                  [post.id]: e.target.value,
                }))
              }
              placeholder="Enter a comment..."
              rows={3}
              className="w-full px-3 py-2 border border-[var(--gray-6)] rounded-md bg-[var(--color-panel)] text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-9)] resize-none mb-2"
            />
            <div className="flex justify-end">
              <button
                onClick={() => {
                  const content = commentInputs[post.id]?.trim();
                  if (content) {
                    createCommentMutation.mutate({ postId: post.id, content });
                  }
                }}
                disabled={
                  !commentInputs[post.id]?.trim() ||
                  createCommentMutation.isPending
                }
                className="px-4 py-2 bg-[var(--accent-9)] text-white rounded-md hover:bg-[var(--accent-10)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                {createCommentMutation.isPending
                  ? 'Posting...'
                  : 'Post Comment'}
              </button>
            </div>
          </div>

          {/* Comments List */}
          {commentsLoading ? (
            <div className="text-center py-4 text-[var(--gray-11)]">
              Loading...
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-4 text-[var(--gray-11)]">
              No comments yet.
            </div>
          ) : (
            <div className="space-y-3">
              {comments.map((comment) => (
                <div
                  key={comment.id}
                  className="p-3 bg-[var(--gray-2)] rounded-md border border-[var(--gray-6)]"
                >
                  {editingComment === comment.id ? (
                    <div>
                      <textarea
                        value={editCommentContent}
                        onChange={(e) => setEditCommentContent(e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-[var(--gray-6)] rounded-md bg-[var(--color-panel)] text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-9)] resize-none mb-2"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => {
                            setEditingComment(null);
                            setEditCommentContent('');
                          }}
                          className="px-3 py-1 text-sm border border-[var(--gray-6)] rounded-md text-[var(--color-text)] hover:bg-[var(--gray-4)] transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => {
                            if (editCommentContent.trim()) {
                              updateCommentMutation.mutate({
                                commentId: comment.id,
                                content: editCommentContent.trim(),
                              });
                            }
                          }}
                          disabled={
                            !editCommentContent.trim() ||
                            updateCommentMutation.isPending
                          }
                          className="px-3 py-1 text-sm bg-[var(--accent-9)] text-white rounded-md hover:bg-[var(--accent-10)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {updateCommentMutation.isPending
                            ? 'Updating...'
                            : 'Update'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          {comment.user?.profile_image ? (
                            <Image
                              src={comment.user.profile_image}
                              alt={comment.user.name}
                              width={24}
                              height={24}
                              className="w-6 h-6 rounded-full"
                              unoptimized
                            />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-[var(--accent-9)] flex items-center justify-center text-white text-xs">
                              {comment.user?.name?.[0] || 'U'}
                            </div>
                          )}
                          <span className="font-medium text-sm text-[var(--color-text)]">
                            {comment.user?.name || 'Anonymous'}
                          </span>
                          <span className="text-xs text-[var(--gray-11)]">
                            {new Date(comment.created_at).toLocaleString(
                              'en-US'
                            )}
                          </span>
                        </div>
                        {currentUserId === comment.user_id && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() =>
                                onCommentEdit(comment.id, comment.content)
                              }
                              className="p-1 text-[var(--gray-11)] hover:text-[var(--accent-9)] transition-colors"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                if (
                                  confirm(
                                    'Are you sure you want to delete this comment?'
                                  )
                                ) {
                                  deleteCommentMutation.mutate(comment.id);
                                }
                              }}
                              className="p-1 text-[var(--gray-11)] hover:text-red-500 transition-colors"
                              title="Delete"
                              disabled={deleteCommentMutation.isPending}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-[var(--color-text)] whitespace-pre-wrap">
                        {comment.content}
                      </p>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CommunityPage;
