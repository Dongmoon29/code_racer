// Custom hook for sessionStorage management with cleanup
import { useEffect, useRef, useCallback } from 'react';

interface SessionStorageManager {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
  cleanup: () => void;
}

export const useSessionStorageManager = (
  matchId: string
): SessionStorageManager => {
  const storageKeys = useRef<Set<string>>(new Set());

  const getItem = useCallback((key: string) => {
    if (typeof window === 'undefined') return null;
    return sessionStorage.getItem(key);
  }, []);

  const setItem = useCallback((key: string, value: string) => {
    if (typeof window === 'undefined') return;
    storageKeys.current.add(key);
    sessionStorage.setItem(key, value);
  }, []);

  const removeItem = useCallback((key: string) => {
    if (typeof window === 'undefined') return;
    storageKeys.current.delete(key);
    sessionStorage.removeItem(key);
  }, []);

  const cleanup = useCallback(() => {
    if (typeof window === 'undefined') return;
    storageKeys.current.forEach((key) => {
      sessionStorage.removeItem(key);
    });
    storageKeys.current.clear();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    getItem,
    setItem,
    removeItem,
    cleanup,
  };
};

// Debounced sessionStorage setter to prevent excessive writes
export const useDebouncedSessionStorage = (
  key: string,
  value: string,
  delay: number = 300
) => {
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      sessionStorage.setItem(key, value);
    }, delay);

    // Cleanup timeout on unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [key, value, delay]);
};
