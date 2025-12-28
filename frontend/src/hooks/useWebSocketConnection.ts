import { useEffect, useRef, useCallback } from 'react';
import { useToast } from '@/components/ui/Toast';

interface UseWebSocketConnectionOptions<T> {
  /**
   * WebSocket client instance factory
   */
  createClient: () => T;

  /**
   * Dependencies that trigger reconnection
   */
  dependencies: unknown[];

  /**
   * Called when connection is established
   */
  onConnect?: (client: T) => void;

  /**
   * Called before cleanup/disconnect
   */
  onDisconnect?: (client: T) => void;

  /**
   * Enable connection (default: true)
   */
  enabled?: boolean;

  /**
   * Show toast on connection errors
   */
  showErrorToast?: boolean;

  /**
   * Custom error message for toast
   */
  errorToastMessage?: string;
}

/**
 * Reusable WebSocket connection lifecycle management hook
 * Handles connection setup, cleanup, and reconnection on dependency changes
 */
export function useWebSocketConnection<T extends { disconnect: () => void }>(
  options: UseWebSocketConnectionOptions<T>
) {
  const {
    createClient,
    dependencies,
    onConnect,
    onDisconnect,
    enabled = true,
    showErrorToast = false,
    errorToastMessage = 'Connection error occurred',
  } = options;

  const clientRef = useRef<T | null>(null);
  const { showToast } = useToast();

  const cleanup = useCallback(() => {
    if (clientRef.current) {
      if (onDisconnect) {
        onDisconnect(clientRef.current);
      }
      clientRef.current.disconnect();
      clientRef.current = null;
    }
  }, [onDisconnect]);

  useEffect(() => {
    if (!enabled) {
      cleanup();
      return;
    }

    try {
      const client = createClient();
      clientRef.current = client;

      if (onConnect) {
        onConnect(client);
      }
    } catch (error) {
      if (showErrorToast) {
        showToast({
          title: 'Connection Error',
          message: errorToastMessage,
          variant: 'error',
        });
      }

      if (process.env.NODE_ENV === 'development') {
        console.error('WebSocket connection failed:', error);
      }
    }

    return cleanup;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...dependencies, enabled]);

  return clientRef;
}
