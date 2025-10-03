import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  GitHubCommit,
  getRecentCommits,
  truncateCommitMessage,
  formatRelativeTime,
} from '@/lib/github-api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ExternalLink, GitCommit, Clock, User } from 'lucide-react';
import CodeRacerLoader from '@/components/ui/CodeRacerLoader';

interface RecentCommitsProps {
  className?: string;
  maxCommits?: number;
}

export const RecentCommits: React.FC<RecentCommitsProps> = ({
  className = '',
  maxCommits = 5,
}) => {
  const [commits, setCommits] = useState<GitHubCommit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCommits = async () => {
      try {
        setLoading(true);
        const recentCommits = await getRecentCommits(
          'Dongmoon29',
          'code_racer',
          maxCommits
        );
        setCommits(recentCommits);
        setError(null);
      } catch (err) {
        setError('Failed to load recent commits.');
        console.error('Error fetching commits:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCommits();
  }, [maxCommits]);

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitCommit className="w-5 h-5" />
            Recent Updates
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CodeRacerLoader size="sm" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitCommit className="w-5 h-5" />
            Recent Updates
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p>{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="text-blue-600 hover:text-blue-800 mt-2"
            >
              Try Again
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GitCommit className="w-5 h-5" />
          Recent Updates
          <Badge variant="secondary" className="ml-auto">
            recent {commits.length} commits
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {commits.map((commit) => (
            <div
              key={commit.sha}
              className="border-b border-gray-100 pb-3 last:border-b-0"
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  {commit.author?.avatar_url ? (
                    <Image
                      src={commit.author.avatar_url}
                      alt={commit.author.login}
                      width={32}
                      height={32}
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium mb-1">
                    {truncateCommitMessage(commit.commit.message)}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatRelativeTime(commit.commit.author.date)}
                    </div>

                    {commit.author && (
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        <span>{commit.author.login}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex-shrink-0">
                  <Link
                    href={commit.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-3 border-t border-gray-100">
          <Link
            href="https://github.com/Dongmoon29/code_racer/commits/main"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            View All Commits
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};

export default RecentCommits;
