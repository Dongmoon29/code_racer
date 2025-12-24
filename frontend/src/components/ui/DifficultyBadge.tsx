import React, { FC } from 'react';
import { Badge } from '@/components/ui/Badge';
import type { Difficulty } from '@/types';

interface DifficultyBadgeProps {
  difficulty: Difficulty;
  className?: string;
}

const getDifficultyColor = (difficulty: Difficulty): 'green' | 'yellow' | 'red' => {
  switch (difficulty) {
    case 'easy':
      return 'green';
    case 'medium':
      return 'yellow';
    case 'hard':
      return 'red';
    default:
      return 'green';
  }
};

export const DifficultyBadge: FC<DifficultyBadgeProps> = ({
  difficulty,
  className,
}) => {
  return (
    <Badge variant="outline" size="1" color={getDifficultyColor(difficulty)} className={className}>
      {difficulty}
    </Badge>
  );
};

export default DifficultyBadge;
