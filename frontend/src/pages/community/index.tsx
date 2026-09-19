import { useMemo, useState } from "react";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm, useWatch } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { communityApi } from "@/lib/api";
import { ROUTES } from "@/lib/router";
import {
  Bug,
  CheckCircle2,
  Clock,
  FileText,
  Lightbulb,
  Loader2,
  MessageSquare,
  Plus,
  Send,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  XCircle,
} from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { useVoting } from "@/hooks/useVoting";
import { ListSkeleton } from "@/components/ui/Skeleton";
import {
  formControlClass,
  formErrorClass,
  formHintClass,
  formLabelClass,
  primaryFormButtonClass,
  secondaryFormButtonClass,
} from "@/components/ui/FormPrimitives";
import { cn } from "@/lib/utils";

type PostType = "bug" | "feature" | "improvement" | "other";
type PostStatus = "pending" | "in_progress" | "resolved" | "closed";
type PostSort = "hot" | "new" | "top";

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

const postSchema = yup.object({
  type: yup
    .mixed<PostType>()
    .oneOf(["bug", "feature", "improvement", "other"])
    .required(),
  title: yup
    .string()
    .trim()
    .min(3, "Title must be at least 3 characters")
    .max(120, "Title must be at most 120 characters")
    .required("Title is required"),
  content: yup
    .string()
    .trim()
    .min(10, "Content must be at least 10 characters")
    .max(5000, "Content must be at most 5,000 characters")
    .required("Content is required"),
});

type CommunityPostFormData = yup.InferType<typeof postSchema>;

const postDefaultValues: CommunityPostFormData = {
  type: "bug",
  title: "",
  content: "",
};

const CommunityIndexPage = () => {
  const [showForm, setShowForm] = useState(false);
  const [sort, setSort] = useState<PostSort>("hot");
  const [error, setError] = useState<string>("");
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CommunityPostFormData>({
    resolver: yupResolver(postSchema),
    defaultValues: postDefaultValues,
    mode: "onBlur",
  });
  const [postTitle = "", postContent = ""] = useWatch({
    control,
    name: ["title", "content"],
  });

  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();

  const { data: postsData, isLoading: postsLoading } = useQuery({
    queryKey: ["communityPosts", sort],
    queryFn: () => communityApi.listPosts(50, 0, undefined, undefined, sort),
  });

  const posts: Post[] = postsData?.data?.items || [];

  const createPostMutation = useMutation({
    mutationFn: (payload: { type: PostType; title: string; content: string }) =>
      communityApi.create(payload.type, payload.title, payload.content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["communityPosts"] });
      setShowForm(false);
      reset(postDefaultValues);
      setError("");
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Failed to create post";
      setError(msg);
    },
  });

  const { handleUpvote, handleDownvote, isVoting } = useVoting({
    entityType: "post",
    voteFn: (postId, value) => communityApi.vote(postId, value),
    invalidateKeys: [["communityPosts"]],
    errorContext: { component: "CommunityIndex" },
  });

  const getTypeIcon = (type: PostType) => {
    switch (type) {
      case "bug":
        return <Bug className="w-4 h-4 text-red-500" />;
      case "feature":
        return <Sparkles className="w-4 h-4 text-purple-500" />;
      case "improvement":
        return <Lightbulb className="w-4 h-4 text-yellow-500" />;
      default:
        return <FileText className="w-4 h-4 text-blue-500" />;
    }
  };

  const getTypeLabel = (type: PostType) => {
    switch (type) {
      case "bug":
        return "Bug Report";
      case "feature":
        return "Feature Request";
      case "improvement":
        return "Improvement";
      default:
        return "Other";
    }
  };

  const getStatusIcon = (status: PostStatus) => {
    switch (status) {
      case "pending":
        return <Clock className="w-4 h-4 text-gray-500" />;
      case "in_progress":
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      case "resolved":
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case "closed":
        return <XCircle className="w-4 h-4 text-gray-400" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const sortTabs = useMemo(
    () =>
      [
        { key: "hot" as const, label: "Hot" },
        { key: "new" as const, label: "New" },
        { key: "top" as const, label: "Top" },
      ] satisfies Array<{ key: PostSort; label: string }>,
    [],
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
            className="px-4 py-2 border cursor-pointer text-white rounded-lg hover:bg-[var(--accent-10)] transition-colors flex items-center gap-2 shrink-0"
          >
            <Plus className="w-4 h-4" />
            Create a post
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
                  ? "bg-[var(--gray-3)] text-[var(--color-text)]"
                  : "text-[var(--gray-11)] hover:bg-[var(--gray-2)]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Create Post Form */}
        {showForm && (
          <div className="mb-6 overflow-hidden rounded-2xl border border-[var(--gray-6)] bg-[var(--color-panel)] shadow-lg shadow-black/5">
            <div className="border-b border-[var(--gray-6)] px-5 py-4 sm:px-6">
              <h2 className="text-lg font-semibold text-[var(--color-text)]">
                Create a post
              </h2>
              <p className={formHintClass}>
                Share enough context so other racers can understand and respond
                quickly.
              </p>
            </div>

            {error && (
              <div
                role="alert"
                className="mx-5 mt-5 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-500 sm:mx-6"
              >
                {error}
              </div>
            )}

            <form
              onSubmit={handleSubmit((values) =>
                createPostMutation.mutate(values),
              )}
              className="space-y-5 p-5 sm:p-6"
              noValidate
            >
              <div>
                <label htmlFor="post-type" className={formLabelClass}>
                  What kind of post is this?
                </label>
                <select
                  id="post-type"
                  {...register("type")}
                  className={formControlClass}
                >
                  <option value="bug">Bug Report</option>
                  <option value="feature">Feature Request</option>
                  <option value="improvement">Improvement</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between gap-4">
                  <label htmlFor="post-title" className={formLabelClass}>
                    Title
                  </label>
                  <span className="text-xs font-normal text-[var(--gray-9)]">
                    {postTitle.length}/120
                  </span>
                </div>
                <input
                  type="text"
                  id="post-title"
                  {...register("title")}
                  aria-invalid={errors.title ? true : undefined}
                  aria-describedby={
                    errors.title ? "post-title-error" : undefined
                  }
                  placeholder="A short, descriptive title"
                  maxLength={120}
                  className={formControlClass}
                />
                {errors.title && (
                  <p
                    id="post-title-error"
                    role="alert"
                    className={formErrorClass}
                  >
                    {errors.title.message}
                  </p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between gap-4">
                  <label htmlFor="post-content" className={formLabelClass}>
                    Content
                  </label>
                  <span className="text-xs font-normal text-[var(--gray-9)]">
                    {postContent.length}/5,000
                  </span>
                </div>
                <textarea
                  id="post-content"
                  {...register("content")}
                  aria-invalid={errors.content ? true : undefined}
                  aria-describedby={
                    errors.content ? "post-content-error" : undefined
                  }
                  placeholder="What happened, what did you expect, and how can someone reproduce it?"
                  rows={7}
                  maxLength={5000}
                  className={cn(formControlClass, "resize-y leading-6")}
                />
                {errors.content && (
                  <p
                    id="post-content-error"
                    role="alert"
                    className={formErrorClass}
                  >
                    {errors.content.message}
                  </p>
                )}
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-[var(--gray-6)] pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setError("");
                    reset(postDefaultValues);
                  }}
                  className={secondaryFormButtonClass}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createPostMutation.isPending}
                  className={cn(primaryFormButtonClass, "gap-2")}
                >
                  <Send className="w-4 h-4" />
                  {createPostMutation.isPending ? "Posting..." : "Post"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Posts List */}
        <div className="space-y-3">
          {postsLoading ? (
            <ListSkeleton rows={5} />
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
                            : "#"
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
                            {post.user?.name?.[0] || "U"}
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
                              : "#"
                          }
                          className="text-sm font-semibold text-[var(--color-text)] hover:text-[var(--accent-9)] transition-colors"
                        >
                          {post.user?.name || "Anonymous"}
                        </Link>
                        <span className="text-sm text-[var(--gray-11)]">
                          {new Date(post.created_at).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              year:
                                new Date(post.created_at).getFullYear() !==
                                new Date().getFullYear()
                                  ? "numeric"
                                  : undefined,
                            },
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
                            onClick={() =>
                              handleUpvote(post.id, myVote as -1 | 0 | 1)
                            }
                            className={`flex items-center gap-1 transition-colors text-sm ${
                              myVote === 1
                                ? "text-[var(--accent-9)]"
                                : "text-[var(--gray-11)] hover:text-[var(--accent-9)]"
                            }`}
                            title={canVote ? "Like" : "Login to like"}
                            disabled={!canVote || isVoting}
                          >
                            <ThumbsUp className="w-4 h-4" />
                            <span className="font-medium">
                              {score > 0 ? score : ""}
                            </span>
                          </button>
                          <button
                            onClick={() =>
                              handleDownvote(post.id, myVote as -1 | 0 | 1)
                            }
                            className={`flex items-center gap-1 transition-colors text-sm ${
                              myVote === -1
                                ? "text-red-500"
                                : "text-[var(--gray-11)] hover:text-red-500"
                            }`}
                            title={canVote ? "Dislike" : "Login to dislike"}
                            disabled={!canVote || isVoting}
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
