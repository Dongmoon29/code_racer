import React, { FC } from 'react';
import { Badge } from '@/components/ui/Badge';
import type { Difficulty } from '@/types';
import { cn } from '@/lib/utils';

interface DifficultyBadgeProps {
  difficulty: Difficulty;
  className?: string;
}

const difficultyClasses: Record<Difficulty, string> = {
  easy: 'bg-green-500/20 text-green-600 border-green-500 dark:bg-green-500/30 dark:text-green-400 dark:border-green-500',
  medium:
    'bg-yellow-500/20 text-yellow-600 border-yellow-500 dark:bg-yellow-500/30 dark:text-yellow-400 dark:border-yellow-500',
  hard: 'bg-red-500/20 text-red-600 border-red-500 dark:bg-red-500/30 dark:text-red-400 dark:border-red-500',
};

export const DifficultyBadge: FC<DifficultyBadgeProps> = ({
  difficulty,
  className,
}) => {
  const cls = difficultyClasses[difficulty] || difficultyClasses.easy;
  return (
    <Badge className={cn(cls, className)} variant="outline">
      {difficulty}
    </Badge>
  );
};

export default DifficultyBadge;
