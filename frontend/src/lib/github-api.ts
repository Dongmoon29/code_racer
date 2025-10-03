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

// 캐시 인터페이스
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

// 메모리 캐시
class MemoryCache {
  private cache = new Map<string, CacheEntry<unknown>>();

  set<T>(key: string, data: T, ttl: number = 5 * 60 * 1000): void {
    // 기본 5분 TTL
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

  // 만료된 항목들 정리
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

// 전역 캐시 인스턴스
const cache = new MemoryCache();

// 주기적으로 캐시 정리 (5분마다)
if (typeof window !== 'undefined') {
  setInterval(() => {
    cache.cleanup();
  }, 5 * 60 * 1000);
}

/**
 * GitHub API에서 최근 커밋 목록을 가져옵니다 (캐싱 포함)
 */
export async function getRecentCommits(
  owner: string = 'Dongmoon29',
  repo: string = 'code_racer',
  perPage: number = 5
): Promise<GitHubCommit[]> {
  const cacheKey = `commits:${owner}:${repo}:${perPage}`;

  // 캐시에서 먼저 확인
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
          // GitHub API는 인증 없이도 사용할 수 있지만, rate limit이 낮습니다
          // 필요시 GitHub token을 환경변수로 추가할 수 있습니다
        },
      }
    );

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const commits = await response.json();

    // 캐시에 저장 (10분 TTL)
    cache.set(cacheKey, commits, 10 * 60 * 1000);

    return commits;
  } catch (error) {
    console.error('Failed to fetch recent commits:', error);
    return [];
  }
}

/**
 * GitHub API에서 레포지토리 정보를 가져옵니다 (캐싱 포함)
 */
export async function getRepositoryInfo(
  owner: string = 'Dongmoon29',
  repo: string = 'code_racer'
): Promise<GitHubRepository | null> {
  const cacheKey = `repo:${owner}:${repo}`;

  // 캐시에서 먼저 확인
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

    // 캐시에 저장 (30분 TTL - 레포지토리 정보는 자주 변경되지 않음)
    cache.set(cacheKey, repoInfo, 30 * 60 * 1000);

    return repoInfo;
  } catch (error) {
    console.error('Failed to fetch repository info:', error);
    return null;
  }
}

/**
 * 백엔드 API를 통해 최근 커밋 목록을 가져옵니다 (캐싱 포함)
 */
export async function getRecentCommitsFromBackend(
  perPage: number = 5
): Promise<GitHubCommit[]> {
  const cacheKey = `backend-commits:${perPage}`;

  // 캐시에서 먼저 확인
  const cachedData = cache.get<GitHubCommit[]>(cacheKey);
  if (cachedData) {
    return cachedData;
  }

  try {
    const response = await fetch(
      `${
        process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'
      }/api/github/commits?per_page=${perPage}`,
      {
        headers: {
          Accept: 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Backend API error: ${response.status}`);
    }

    const commits = await response.json();

    // 캐시에 저장 (10분 TTL)
    cache.set(cacheKey, commits, 10 * 60 * 1000);

    return commits;
  } catch (error) {
    console.error('Failed to fetch recent commits from backend:', error);
    return [];
  }
}

/**
 * 백엔드 API를 통해 레포지토리 정보를 가져옵니다 (캐싱 포함)
 */
export async function getRepositoryInfoFromBackend(): Promise<GitHubRepository | null> {
  const cacheKey = 'backend-repo';

  // 캐시에서 먼저 확인
  const cachedData = cache.get<GitHubRepository>(cacheKey);
  if (cachedData) {
    return cachedData;
  }

  try {
    const response = await fetch(
      `${
        process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'
      }/api/github/repo`,
      {
        headers: {
          Accept: 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Backend API error: ${response.status}`);
    }

    const repoInfo = await response.json();

    // 캐시에 저장 (30분 TTL)
    cache.set(cacheKey, repoInfo, 30 * 60 * 1000);

    return repoInfo;
  } catch (error) {
    console.error('Failed to fetch repository info from backend:', error);
    return null;
  }
}

/**
 * 커밋 메시지를 요약합니다 (너무 긴 경우)
 */
export function truncateCommitMessage(
  message: string,
  maxLength: number = 80
): string {
  if (message.length <= maxLength) {
    return message;
  }

  // 첫 번째 줄만 가져오고, 필요시 잘라냅니다
  const firstLine = message.split('\n')[0];
  if (firstLine.length <= maxLength) {
    return firstLine;
  }

  return firstLine.substring(0, maxLength - 3) + '...';
}

/**
 * 커밋 날짜를 상대적 시간으로 포맷합니다
 */
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return '방금 전';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}분 전`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}시간 전`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays}일 전`;
  }

  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return `${diffInWeeks}주 전`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  return `${diffInMonths}개월 전`;
}
