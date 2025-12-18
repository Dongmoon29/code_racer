import React, { useMemo, useState } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { communityApi, communityCommentApi } from '@/lib/api';
import {
  ArrowDown,
  ArrowUp,
  Edit2,
  MessageSquare,
  MoreVertical,
  Send,
  Trash2,
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

interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  parent_id?: string;
  content: string;
  score?: number;
  my_vote?: number;
  created_at: string;
  updated_at: string;
  replies?: Comment[];
  user?: {
    id: string;
    name: string;
    email: string;
    profile_image?: string;
  };
}

interface CommentItemProps {
  comment: Comment;
  postId: string;
  currentUserId?: string;
  replyingTo: string | null;
  setReplyingTo: (id: string | null) => void;
  replyInputs: Record<string, string>;
  setReplyInputs: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  editingComment: string | null;
  editCommentContent: string;
  setEditCommentContent: (content: string) => void;
  setEditingComment: (id: string | null) => void;
  onCommentEdit: (commentId: string, content: string) => void;
  voteCommentMutation: ReturnType<typeof useMutation>;
  updateCommentMutation: ReturnType<typeof useMutation>;
  deleteCommentMutation: ReturnType<typeof useMutation>;
  createCommentMutation: ReturnType<typeof useMutation>;
  depth: number;
}

const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  postId,
  currentUserId,
  replyingTo,
  setReplyingTo,
  replyInputs,
  setReplyInputs,
  editingComment,
  editCommentContent,
  setEditCommentContent,
  setEditingComment,
  onCommentEdit,
  voteCommentMutation,
  updateCommentMutation,
  deleteCommentMutation,
  createCommentMutation,
  depth,
}) => {
  const isNested = depth > 0;
  const textSize = isNested ? 'text-xs' : 'text-sm';
  const iconSize = isNested ? 'w-3 h-3' : 'w-3.5 h-3.5';
  const avatarSize = isNested ? 18 : 20;
  const score = comment.score ?? 0;
  const myVote = comment.my_vote ?? 0;
  const canVote = !!currentUserId;

  return (
    <div className="flex gap-2 hover:bg-[var(--gray-2)] rounded-md p-1 -ml-1">
      {/* Vote Column */}
      <div className="flex flex-col items-center gap-1 pt-1">
        <button
          className={`p-1 rounded transition-colors ${
            myVote === 1
              ? 'text-[var(--accent-9)]'
              : 'text-[var(--gray-11)] hover:text-[var(--accent-9)] hover:bg-[var(--gray-4)]'
          }`}
          title={canVote ? 'Upvote' : 'Login to vote'}
          disabled={!canVote || voteCommentMutation.isPending}
          onClick={() => {
            const next: -1 | 0 | 1 = myVote === 1 ? 0 : 1;
            voteCommentMutation.mutate({ commentId: comment.id, value: next });
          }}
        >
          <ArrowUp className={iconSize} />
        </button>
        <span className="text-xs font-medium text-[var(--color-text)] min-w-[16px] text-center">
          {score}
        </span>
        <button
          className={`p-1 rounded transition-colors ${
            myVote === -1
              ? 'text-red-500'
              : 'text-[var(--gray-11)] hover:text-red-500 hover:bg-[var(--gray-4)]'
          }`}
          title={canVote ? 'Downvote' : 'Login to vote'}
          disabled={!canVote || voteCommentMutation.isPending}
          onClick={() => {
            const next: -1 | 0 | 1 = myVote === -1 ? 0 : -1;
            voteCommentMutation.mutate({ commentId: comment.id, value: next });
          }}
        >
          <ArrowDown className={iconSize} />
        </button>
      </div>

      <div className="flex-1 min-w-0">
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
                  const content = editCommentContent.trim();
                  if (content) {
                    updateCommentMutation.mutate({
                      commentId: comment.id,
                      content,
                    });
                  }
                }}
                disabled={!editCommentContent.trim() || updateCommentMutation.isPending}
                className="px-3 py-1 text-sm bg-[var(--accent-9)] text-white rounded-md hover:bg-[var(--accent-10)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {updateCommentMutation.isPending ? 'Updating...' : 'Update'}
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-1">
              {comment.user?.profile_image ? (
                <Image
                  src={comment.user.profile_image}
                  alt={comment.user.name}
                  width={avatarSize}
                  height={avatarSize}
                  className="rounded-full"
                  unoptimized
                />
              ) : (
                <div
                  className="rounded-full bg-[var(--accent-9)] flex items-center justify-center text-white text-xs"
                  style={{ width: avatarSize, height: avatarSize }}
                >
                  {comment.user?.name?.[0] || 'U'}
                </div>
              )}
              <span className={`font-medium ${isNested ? 'text-xs' : 'text-sm'} text-[var(--color-text)]`}>
                {comment.user?.name || 'Anonymous'}
              </span>
              <span className="text-xs text-[var(--gray-11)]">
                {new Date(comment.created_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            </div>

            <p className={`${textSize} text-[var(--color-text)] whitespace-pre-wrap mb-2`}>
              {comment.content}
            </p>

            <div className="flex items-center gap-4 text-xs text-[var(--gray-11)]">
              <button
                onClick={() =>
                  setReplyingTo(replyingTo === comment.id ? null : comment.id)
                }
                className="flex items-center gap-1 hover:text-[var(--accent-9)] transition-colors font-medium"
              >
                <MessageSquare className={iconSize} />
                Reply
              </button>

              {currentUserId === comment.user_id && (
                <>
                  <button
                    onClick={() => onCommentEdit(comment.id, comment.content)}
                    className="flex items-center gap-1 hover:text-[var(--accent-9)] transition-colors"
                    title="Edit"
                  >
                    <Edit2 className={iconSize} />
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Are you sure you want to delete this comment?')) {
                        deleteCommentMutation.mutate(comment.id);
                      }
                    }}
                    className="flex items-center gap-1 hover:text-red-500 transition-colors"
                    title="Delete"
                    disabled={deleteCommentMutation.isPending}
                  >
                    <Trash2 className={iconSize} />
                    Delete
                  </button>
                </>
              )}

              <button
                className="ml-auto p-1 hover:bg-[var(--gray-4)] rounded transition-colors"
                title="More options"
              >
                <MoreVertical className={iconSize} />
              </button>
            </div>

            {replyingTo === comment.id && (
              <div className="mt-3">
                <textarea
                  value={replyInputs[comment.id] || ''}
                  onChange={(e) =>
                    setReplyInputs((prev) => ({
                      ...prev,
                      [comment.id]: e.target.value,
                    }))
                  }
                  placeholder="Write a reply..."
                  rows={2}
                  className="w-full px-3 py-2 border border-[var(--gray-6)] rounded-md bg-[var(--color-panel)] text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-9)] resize-none mb-2 text-sm"
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => {
                      setReplyingTo(null);
                      setReplyInputs((prev) => ({ ...prev, [comment.id]: '' }));
                    }}
                    className="px-3 py-1 text-sm border border-[var(--gray-6)] rounded-md text-[var(--color-text)] hover:bg-[var(--gray-4)] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      const content = replyInputs[comment.id]?.trim();
                      if (content) {
                        createCommentMutation.mutate({
                          postId,
                          content,
                          parentId: comment.id,
                        });
                      }
                    }}
                    disabled={!replyInputs[comment.id]?.trim() || createCommentMutation.isPending}
                    className="px-3 py-1 text-sm bg-[var(--accent-9)] text-white rounded-md hover:bg-[var(--accent-10)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {createCommentMutation.isPending ? 'Replying...' : 'Reply'}
                  </button>
                </div>
              </div>
            )}

            {comment.replies && comment.replies.length > 0 && (
              <div className="ml-4 mt-2 border-l border-[var(--gray-6)] pl-3 space-y-1">
                {comment.replies.map((r) => (
                  <CommentItem
                    key={r.id}
                    comment={r}
                    postId={postId}
                    currentUserId={currentUserId}
                    replyingTo={replyingTo}
                    setReplyingTo={setReplyingTo}
                    replyInputs={replyInputs}
                    setReplyInputs={setReplyInputs}
                    editingComment={editingComment}
                    editCommentContent={editCommentContent}
                    setEditCommentContent={setEditCommentContent}
                    setEditingComment={setEditingComment}
                    onCommentEdit={onCommentEdit}
                    voteCommentMutation={voteCommentMutation}
                    updateCommentMutation={updateCommentMutation}
                    deleteCommentMutation={deleteCommentMutation}
                    createCommentMutation={createCommentMutation}
                    depth={depth + 1}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

const CommunityPostPage = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const postId = typeof router.query.id === 'string' ? router.query.id : '';

  const { data: postData, isLoading: postLoading } = useQuery({
    queryKey: ['communityPost', postId],
    queryFn: () => communityApi.getPost(postId),
    enabled: !!postId,
  });

  const post: Post | null = postData?.data || null;

  const voteMutation = useMutation({
    mutationFn: (payload: { value: -1 | 0 | 1 }) =>
      communityApi.vote(postId, payload.value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communityPost', postId] });
      queryClient.invalidateQueries({ queryKey: ['communityPosts'] });
    },
  });

  const { data: commentsData, isLoading: commentsLoading } = useQuery({
    queryKey: ['communityComments', postId],
    queryFn: () => communityCommentApi.getComments(postId, 200, 0, true),
    enabled: !!postId,
  });

  const comments: Comment[] = commentsData?.data?.items || [];

  const [commentInput, setCommentInput] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({});
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editCommentContent, setEditCommentContent] = useState('');

  const createCommentMutation = useMutation({
    mutationFn: (payload: { postId: string; content: string; parentId?: string }) =>
      communityCommentApi.create(payload.postId, payload.content, payload.parentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communityComments', postId] });
      queryClient.invalidateQueries({ queryKey: ['communityPost', postId] });
      setCommentInput('');
      setReplyingTo(null);
    },
  });

  const voteCommentMutation = useMutation({
    mutationFn: (payload: { commentId: string; value: -1 | 0 | 1 }) =>
      communityCommentApi.vote(payload.commentId, payload.value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communityComments', postId] });
    },
  });

  const updateCommentMutation = useMutation({
    mutationFn: (payload: { commentId: string; content: string }) =>
      communityCommentApi.update(payload.commentId, payload.content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communityComments', postId] });
      setEditingComment(null);
      setEditCommentContent('');
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: (commentId: string) => communityCommentApi.delete(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communityComments', postId] });
      queryClient.invalidateQueries({ queryKey: ['communityPost', postId] });
    },
  });

  const breadcrumbs = useMemo(
    () => (
      <div className="text-sm text-[var(--gray-11)] mb-4">
        <Link href="/community" className="hover:text-[var(--accent-9)]">
          Community
        </Link>
        <span className="mx-2">/</span>
        <span>Post</span>
      </div>
    ),
    []
  );

  const canVote = !!user?.id;
  const myVote = post?.my_vote ?? 0;
  const score = post?.score ?? 0;

  return (
    <DashboardLayout>
      <Head>
        <title>{post?.title ? `${post.title} - Community` : 'Community Post'}</title>
      </Head>

      <div className="max-w-4xl mx-auto py-8">
        {breadcrumbs}

        {postLoading ? (
          <div className="text-center py-10 text-[var(--gray-11)]">Loading...</div>
        ) : !post ? (
          <div className="text-center py-10 text-[var(--gray-11)]">Post not found.</div>
        ) : (
          <>
            <div className="bg-[var(--color-panel)] border border-[var(--gray-6)] rounded-lg p-5">
              <div className="flex gap-4">
                {/* Vote Column */}
                <div className="flex flex-col items-center gap-1 pt-1">
                  <button
                    className={`p-1 rounded transition-colors ${
                      myVote === 1
                        ? 'text-[var(--accent-9)]'
                        : 'text-[var(--gray-11)] hover:text-[var(--accent-9)] hover:bg-[var(--gray-2)]'
                    }`}
                    title={canVote ? 'Upvote' : 'Login to vote'}
                    disabled={!canVote || voteMutation.isPending}
                    onClick={() => {
                      const next: -1 | 0 | 1 = myVote === 1 ? 0 : 1;
                      voteMutation.mutate({ value: next });
                    }}
                  >
                    <ArrowUp className="w-5 h-5" />
                  </button>
                  <div className="text-base font-semibold text-[var(--color-text)]">
                    {score}
                  </div>
                  <button
                    className={`p-1 rounded transition-colors ${
                      myVote === -1
                        ? 'text-red-500'
                        : 'text-[var(--gray-11)] hover:text-red-500 hover:bg-[var(--gray-2)]'
                    }`}
                    title={canVote ? 'Downvote' : 'Login to vote'}
                    disabled={!canVote || voteMutation.isPending}
                    onClick={() => {
                      const next: -1 | 0 | 1 = myVote === -1 ? 0 : -1;
                      voteMutation.mutate({ value: next });
                    }}
                  >
                    <ArrowDown className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex-1 min-w-0">
                  <h1 className="text-2xl font-bold text-[var(--color-text)] mb-2">
                    {post.title}
                  </h1>
                  <div className="flex items-center gap-2 text-sm text-[var(--gray-11)] mb-4">
                    {post.user?.profile_image ? (
                      <Image
                        src={post.user.profile_image}
                        alt={post.user.name}
                        width={20}
                        height={20}
                        className="w-5 h-5 rounded-full"
                        unoptimized
                      />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-[var(--accent-9)] flex items-center justify-center text-white text-xs">
                        {post.user?.name?.[0] || 'U'}
                      </div>
                    )}
                    <span className="font-medium text-[var(--color-text)]">
                      {post.user?.name || 'Anonymous'}
                    </span>
                    <span>•</span>
                    <span>
                      {new Date(post.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                    <span>•</span>
                    <span>{post.comment_count} comments</span>
                  </div>

                  <p className="text-[var(--color-text)] whitespace-pre-wrap">
                    {post.content}
                  </p>
                </div>
              </div>
            </div>

            {/* Comment Composer */}
            <div className="bg-[var(--color-panel)] border border-[var(--gray-6)] rounded-lg p-5 mt-4">
              <h2 className="text-lg font-semibold text-[var(--color-text)] mb-3">
                Comment
              </h2>
              <textarea
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                placeholder="Write a comment..."
                rows={3}
                className="w-full px-3 py-2 border border-[var(--gray-6)] rounded-md bg-[var(--color-panel)] text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-9)] resize-none mb-3"
              />
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    const content = commentInput.trim();
                    if (content) {
                      createCommentMutation.mutate({ postId, content });
                    }
                  }}
                  disabled={!commentInput.trim() || createCommentMutation.isPending}
                  className="px-4 py-2 bg-[var(--accent-9)] text-white rounded-md hover:bg-[var(--accent-10)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  {createCommentMutation.isPending ? 'Posting...' : 'Post Comment'}
                </button>
              </div>
            </div>

            {/* Comments */}
            <div className="mt-4 bg-[var(--color-panel)] border border-[var(--gray-6)] rounded-lg p-5">
              <h2 className="text-lg font-semibold text-[var(--color-text)] mb-3">
                Thread
              </h2>
              {commentsLoading ? (
                <div className="text-center py-6 text-[var(--gray-11)]">Loading...</div>
              ) : comments.length === 0 ? (
                <div className="text-center py-6 text-[var(--gray-11)]">No comments yet.</div>
              ) : (
                <div className="space-y-2">
                  {comments.map((comment) => (
                    <CommentItem
                      key={comment.id}
                      comment={comment}
                      postId={postId}
                      currentUserId={user?.id}
                      replyingTo={replyingTo}
                      setReplyingTo={setReplyingTo}
                      replyInputs={replyInputs}
                      setReplyInputs={setReplyInputs}
                      editingComment={editingComment}
                      editCommentContent={editCommentContent}
                      setEditCommentContent={setEditCommentContent}
                      setEditingComment={setEditingComment}
                      onCommentEdit={(commentId, content) => {
                        setEditingComment(commentId);
                        setEditCommentContent(content);
                      }}
                      voteCommentMutation={voteCommentMutation}
                      updateCommentMutation={updateCommentMutation}
                      deleteCommentMutation={deleteCommentMutation}
                      createCommentMutation={createCommentMutation}
                      depth={0}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default CommunityPostPage;


