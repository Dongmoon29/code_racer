/**
 * WebSocket helper utilities to reduce boilerplate code
 */

/**
 * Type-safe message handler factory
 * Creates a handler function with type guards and error handling
 */
export function createMessageHandler<TMessage, TData = unknown>(
  typeGuard: (msg: unknown) => msg is TMessage,
  handler: (message: TMessage) => void,
  options?: {
    userId?: string;
    filterByUserId?: boolean;
    onError?: (error: Error) => void;
  }
) {
  return (message: unknown) => {
    try {
      if (!typeGuard(message)) {
        return;
      }

      // Filter by user ID if specified
      if (options?.filterByUserId && options?.userId) {
        const msg = message as TMessage & { user_id?: string };
        if (msg.user_id !== options.userId) {
          return;
        }
      }

      handler(message);
    } catch (error) {
      if (options?.onError) {
        options.onError(error as Error);
      } else if (process.env.NODE_ENV === 'development') {
        console.error('Message handler error:', error);
      }
    }
  };
}

/**
 * Creates a message router that dispatches to different handlers based on message type
 */
export function createMessageRouter<TMessage extends { type: string }>(
  handlers: Record<string, (message: TMessage) => void>,
  options?: {
    onUnhandledMessage?: (message: TMessage) => void;
    onError?: (error: Error, message: TMessage) => void;
  }
) {
  return (message: TMessage) => {
    try {
      const handler = handlers[message.type];

      if (handler) {
        handler(message);
      } else if (options?.onUnhandledMessage) {
        options.onUnhandledMessage(message);
      }
    } catch (error) {
      if (options?.onError) {
        options.onError(error as Error, message);
      } else if (process.env.NODE_ENV === 'development') {
        console.error('Message router error:', error, message);
      }
    }
  };
}

/**
 * Debounced state updater for WebSocket data
 * Useful for high-frequency updates like code changes
 */
export function createDebouncedUpdater<T>(
  callback: (value: T) => void,
  delay: number = 300
): (value: T) => void {
  let timeoutId: NodeJS.Timeout | null = null;

  return (value: T) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      callback(value);
      timeoutId = null;
    }, delay);
  };
}

/**
 * Safe message field extractor with fallbacks
 * Handles inconsistent backend message formats
 */
export function extractMessageField<T>(
  message: unknown,
  ...fieldPaths: string[]
): T | undefined {
  for (const path of fieldPaths) {
    const value = getNestedValue(message, path);
    if (value !== undefined) {
      return value as T;
    }
  }
  return undefined;
}

function getNestedValue(obj: unknown, path: string): unknown {
  if (!obj || typeof obj !== 'object') {
    return undefined;
  }

  const parts = path.split('.');
  let current: unknown = obj;

  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }

  return current;
}

/**
 * Creates a WebSocket state manager with proper cleanup
 */
export class WebSocketStateManager<TState> {
  private subscribers: Set<(state: TState) => void> = new Set();
  private state: TState;

  constructor(initialState: TState) {
    this.state = initialState;
  }

  getState(): TState {
    return this.state;
  }

  setState(updater: TState | ((prev: TState) => TState)): void {
    this.state = typeof updater === 'function'
      ? (updater as (prev: TState) => TState)(this.state)
      : updater;

    this.notify();
  }

  subscribe(callback: (state: TState) => void): () => void {
    this.subscribers.add(callback);

    // Return unsubscribe function
    return () => {
      this.subscribers.delete(callback);
    };
  }

  private notify(): void {
    this.subscribers.forEach(callback => callback(this.state));
  }

  cleanup(): void {
    this.subscribers.clear();
  }
}
