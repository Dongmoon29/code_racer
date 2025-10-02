export const MATCHING_STATE = {
  IDLE: 'idle',
  CONNECTING: 'connecting',
  SEARCHING: 'searching',
  FOUND: 'found',
  ERROR: 'error',
} as const;

export type MatchingState =
  (typeof MATCHING_STATE)[keyof typeof MATCHING_STATE];
