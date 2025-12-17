import React, { FC } from 'react';
import Link from 'next/link';
import { ProblemSummary } from '@/types';

interface ProblemListTableProps {
  problems: ProblemSummary[];
  onViewProblem: (id: string) => void;
  onDeleteProblem: (id: string, title: string) => void;
  getDifficultyColor: (difficulty: string) => string;
  hasFilters: boolean;
}

export const ProblemListTable: FC<ProblemListTableProps> = ({
  problems,
  onViewProblem,
  onDeleteProblem,
  getDifficultyColor,
  hasFilters,
}) => {
  const isEmpty = problems.length === 0;

  return (
    <div className="rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y">
          <thead className="">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                Title
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                Difficulty
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                Updated
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className=" divide-y">
            {isEmpty ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center">
                  {hasFilters
                    ? 'No problems match the search criteria.'
                    : 'No problems registered.'}
                </td>
              </tr>
            ) : (
              problems.map((problem: ProblemSummary) => (
                <tr key={problem.id} className="">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      type="button"
                      className="text-sm font-medium underline underline-offset-2 hover:opacity-80 text-left"
                      onClick={() => onViewProblem(problem.id)}
                    >
                      {problem.title}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getDifficultyColor(
                        problem.difficulty
                      )}`}
                    >
                      {problem.difficulty}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm ">
                    {new Date(problem.created_at).toLocaleDateString('en-US')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm ">
                    {new Date(problem.updated_at).toLocaleDateString('en-US')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <Link href={`/admin/problems/edit/${problem.id}`}>
                        Edit
                      </Link>
                      <button
                        onClick={() =>
                          onDeleteProblem(problem.id, problem.title)
                        }
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
