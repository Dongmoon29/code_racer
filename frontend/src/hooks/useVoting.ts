import { useCallback } from 'react';
import { useApiMutation } from './useApiQuery';

type VoteValue = -1 | 0 | 1;

interface UseVotingOptions {
  entityType: 'post' | 'comment';
  voteFn: (entityId: string, value: VoteValue) => Promise<unknown>;
  invalidateKeys: unknown[][];
  errorContext?: { component: string; [key: string]: unknown };
}

/**
 * Reusable hook for voting functionality (upvote/downvote)
 * Eliminates duplicate voting logic across community features
 */
export function useVoting({ entityType, voteFn, invalidateKeys, errorContext }: UseVotingOptions) {
  const voteMutation = useApiMutation<unknown, { entityId: string; value: VoteValue }>({
    mutationFn: ({ entityId, value }) => voteFn(entityId, value),
    invalidateKeys,
    errorContext: {
      component: errorContext?.component || 'useVoting',
      action: `vote${entityType}`,
      ...errorContext,
    },
  });

  /**
   * Get next vote value based on current vote and action
   */
  const getNextVoteValue = useCallback((currentVote: VoteValue, action: 'upvote' | 'downvote'): VoteValue => {
    if (action === 'upvote') {
      return currentVote === 1 ? 0 : 1;
    } else {
      return currentVote === -1 ? 0 : -1;
    }
  }, []);

  /**
   * Handle upvote action
   */
  const handleUpvote = useCallback(
    (entityId: string, currentVote: VoteValue) => {
      const nextValue = getNextVoteValue(currentVote, 'upvote');
      voteMutation.mutate({ entityId, value: nextValue });
    },
    [voteMutation, getNextVoteValue]
  );

  /**
   * Handle downvote action
   */
  const handleDownvote = useCallback(
    (entityId: string, currentVote: VoteValue) => {
      const nextValue = getNextVoteValue(currentVote, 'downvote');
      voteMutation.mutate({ entityId, value: nextValue });
    },
    [voteMutation, getNextVoteValue]
  );

  return {
    handleUpvote,
    handleDownvote,
    isVoting: voteMutation.isPending,
    getNextVoteValue,
  };
}
