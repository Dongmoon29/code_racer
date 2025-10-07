import React, { FC } from 'react';
import { Badge } from '@/components/ui/Badge';
import type { Difficulty } from '@/types';
import { cn } from '@/lib/utils';

interface DifficultyBadgeProps {
  difficulty: Difficulty;
  className?: string;
}

const difficultyClasses: Record<Difficulty, string> = {
  easy: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800',
  medium:
    'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800',
  hard: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800',
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
