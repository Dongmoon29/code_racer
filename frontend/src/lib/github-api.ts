import { TIMER_CONSTANTS } from '@/constants';
import { createErrorHandler } from '@/lib/error-tracking';

export interface GitHubCommit {
  sha: string;
  commit: {
    message: string;
    author: {
      name: string;
      email: string;
      date: string;
    };
  };
  author: {
    login: string;
    avatar_url: string;
    html_url: string;
  } | null;
  html_url: string;
}

export interface GitHubRepository {
  name: string;
  full_name: string;
  description: string;
  html_url: string;
  updated_at: string;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class MemoryCache {
  private cache = new Map<string, CacheEntry<unknown>>();

  set<T>(
    key: string,
    data: T,
    ttl: number = TIMER_CONSTANTS.CACHE_TTL.SHORT
  ): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) {
      return null;
    }

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  clear(): void {
    this.cache.clear();
  }

  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

const cache = new MemoryCache();

if (typeof window !== 'undefined') {
  setInterval(() => {
    cache.cleanup();
  }, TIMER_CONSTANTS.CACHE_TTL.SHORT);
}

export async function getRecentCommits(
  owner: string = 'Dongmoon29',
  repo: string = 'code_racer',
  perPage: number = 5
): Promise<GitHubCommit[]> {
  const cacheKey = `commits:${owner}:${repo}:${perPage}`;

  const cachedData = cache.get<GitHubCommit[]>(cacheKey);
  if (cachedData) {
    return cachedData;
  }

  try {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/commits?per_page=${perPage}`,
      {
        headers: {
          Accept: 'application/vnd.github.v3+json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const commits = await response.json();

    cache.set(cacheKey, commits, TIMER_CONSTANTS.CACHE_TTL.MEDIUM);

    return commits;
  } catch (error) {
    const errorHandler = createErrorHandler('github-api', 'getRecentCommits');
    errorHandler(error, {
      owner,
      repo,
      maxCommits,
      endpoint: `${API_BASE_URL}/repos/${owner}/${repo}/commits`,
    });
    return [];
  }
}

/**
 */
export async function getRepositoryInfo(
  owner: string = 'Dongmoon29',
  repo: string = 'code_racer'
): Promise<GitHubRepository | null> {
  const cacheKey = `repo:${owner}:${repo}`;

  const cachedData = cache.get<GitHubRepository>(cacheKey);
  if (cachedData) {
    return cachedData;
  }

  try {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}`,
      {
        headers: {
          Accept: 'application/vnd.github.v3+json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const repoInfo = await response.json();

    cache.set(cacheKey, repoInfo, TIMER_CONSTANTS.CACHE_TTL.LONG);

    return repoInfo;
  } catch (error) {
    const errorHandler = createErrorHandler('github-api', 'getRepositoryInfo');
    errorHandler(error, {
      owner,
      repo,
      endpoint: `${API_BASE_URL}/repos/${owner}/${repo}`,
    });
    return null;
  }
}

export function truncateCommitMessage(
  message: string,
  maxLength: number = 80
): string {
  if (message.length <= maxLength) {
    return message;
  }

  const firstLine = message.split('\n')[0];
  if (firstLine.length <= maxLength) {
    return firstLine;
  }

  return firstLine.substring(0, maxLength - 3) + '...';
}

export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor(
    (now.getTime() - date.getTime()) / TIMER_CONSTANTS.INTERVALS.SECOND
  );

  if (diffInSeconds < 60) {
    return 'just now';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minuites ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hours ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays} days ago`;
  }

  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return `${diffInWeeks} weeks ago`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  return `${diffInMonths} months ago`;
}
