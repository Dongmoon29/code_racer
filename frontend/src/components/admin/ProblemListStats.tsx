import React, { FC } from 'react';
import { ProblemSummary } from '@/types';

interface ProblemListStatsProps {
  problems: ProblemSummary[];
}

export const ProblemListStats: FC<ProblemListStatsProps> = ({ problems }) => {
  const easyCount = problems.filter((p) => p.difficulty === 'Easy').length;
  const mediumCount = problems.filter((p) => p.difficulty === 'Medium').length;
  const hardCount = problems.filter((p) => p.difficulty === 'Hard').length;

  return (
    <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className=" p-4 rounded-lg shadow bg-[hsl(var(--card))]">
        <div className="text-sm font-medium ">Total Problems</div>
        <div className="text-2xl font-bold ">{problems.length}</div>
      </div>

      <div className=" p-4 rounded-lg shadow bg-[hsl(var(--card))]">
        <div className="text-sm font-medium ">Easy</div>
        <div className="text-2xl font-bold text-green-600">{easyCount}</div>
      </div>

      <div className=" p-4 rounded-lg shadow bg-[hsl(var(--card))]">
        <div className="text-sm font-medium ">Medium</div>
        <div className="text-2xl font-bold text-yellow-600">{mediumCount}</div>
      </div>

      <div className=" p-4 rounded-lg shadow bg-[hsl(var(--card))]">
        <div className="text-sm font-medium ">Hard</div>
        <div className="text-2xl font-bold text-red-600">{hardCount}</div>
      </div>
    </div>
  );
};
