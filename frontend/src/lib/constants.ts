export const WebSocketMessageType = {
  CODE_UPDATE: 'code_update',
  GAME_START: 'game_start',
  GAME_END: 'game_end',
} as const;

export type WebSocketMessageTypeKeys = keyof typeof WebSocketMessageType;
export type WebSocketMessageTypeValues =
  (typeof WebSocketMessageType)[WebSocketMessageTypeKeys];
