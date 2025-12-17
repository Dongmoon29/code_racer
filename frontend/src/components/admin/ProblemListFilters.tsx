import React, { FC } from 'react';

interface ProblemListFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  difficultyFilter: string;
  onDifficultyChange: (value: string) => void;
}

export const ProblemListFilters: FC<ProblemListFiltersProps> = ({
  searchTerm,
  onSearchChange,
  difficultyFilter,
  onDifficultyChange,
}) => {
  return (
    <div className="flex flex-col md:flex-row gap-4 mb-6">
      <div className="flex-1">
        <input
          type="text"
          placeholder="Search by problem title..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2"
        />
      </div>
      <div className="w-full md:w-48">
        <select
          value={difficultyFilter}
          onChange={(e) => onDifficultyChange(e.target.value)}
          className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2"
        >
          <option value="all">All Difficulties</option>
          <option value="Easy">Easy</option>
          <option value="Medium">Medium</option>
          <option value="Hard">Hard</option>
        </select>
      </div>
    </div>
  );
};
