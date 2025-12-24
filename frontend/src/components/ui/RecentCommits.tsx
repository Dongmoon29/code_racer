import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  GitHubCommit,
  truncateCommitMessage,
  formatRelativeTime,
} from '@/lib/github-api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ExternalLink, Clock, User } from 'lucide-react';

interface RecentCommitsProps {
  className?: string;
  commits: GitHubCommit[];
}

export const RecentCommits: React.FC<RecentCommitsProps> = ({
  className = '',
  commits = [],
}) => {
  const isDarkMode = className.includes('!bg-transparent');
  
  // If no commits, return empty state
  if (commits.length === 0) {
    return null;
  }
  
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className={`flex items-center gap-2 ${isDarkMode ? 'text-white' : ''}`}>
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
            />
          </svg>
          Recent Updates
          <Badge variant="secondary" className={`ml-auto ${isDarkMode ? 'bg-gray-700/50 text-white/80 border-gray-600/50' : ''}`}>
            recent {commits.length} commits
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {commits.map((commit) => (
            <div
              key={commit.sha}
              className={`border-b ${isDarkMode ? 'border-white/10' : 'border-gray-100'} pb-3 last:border-b-0`}
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
                  <p className={`text-sm font-medium mb-1 ${isDarkMode ? 'text-white' : ''}`}>
                    {truncateCommitMessage(commit.commit.message)}
                  </p>

                  <div className={`flex items-center gap-4 text-xs ${isDarkMode ? 'text-white/70' : 'text-gray-500'}`}>
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
                    className={`transition-colors ${isDarkMode ? 'text-white/60 hover:text-white' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className={`mt-4 pt-3 border-t ${isDarkMode ? 'border-white/10' : 'border-gray-100'}`}>
          <Link
            href="https://github.com/Dongmoon29/code_racer/commits/main"
            target="_blank"
            rel="noopener noreferrer"
            className={`text-sm flex items-center gap-1 ${isDarkMode ? 'text-white hover:text-white/80' : 'text-blue-600 hover:text-blue-800'}`}
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
