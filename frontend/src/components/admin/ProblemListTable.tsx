import React, { FC, useState } from 'react';
import Link from 'next/link';
import { ProblemSummary } from '@/types';
import { ChevronDown, ChevronUp } from 'lucide-react';

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
  const [expandedProblemId, setExpandedProblemId] = useState<string | null>(null);
  const isEmpty = problems.length === 0;

  return (
    <div className="rounded-lg shadow overflow-hidden">
      {/* Mobile: Table with Title and Difficulty only, expandable details */}
      <div className="md:hidden overflow-x-auto">
        <table className="min-w-full divide-y">
          <thead>
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider">
                Title
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider">
                Difficulty
              </th>
              <th className="px-3 py-2 w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isEmpty ? (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-sm text-muted-foreground">
                  {hasFilters
                    ? 'No problems match the search criteria.'
                    : 'No problems registered.'}
                </td>
              </tr>
            ) : (
              problems.map((problem: ProblemSummary) => {
                const isExpanded = expandedProblemId === problem.id;
                return (
                  <React.Fragment key={problem.id}>
                    <tr
                      onClick={() => setExpandedProblemId(isExpanded ? null : problem.id)}
                      className="cursor-pointer hover:bg-[var(--gray-4)] transition-colors"
                    >
                      <td className="px-3 py-3 text-sm">
                        <button
                          type="button"
                          className="text-sm font-medium underline underline-offset-2 hover:opacity-80 text-left"
                          onClick={(e) => {
                            e.stopPropagation();
                            onViewProblem(problem.id);
                          }}
                        >
                          {problem.title}
                        </button>
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getDifficultyColor(
                            problem.difficulty
                          )}`}
                        >
                          {problem.difficulty}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center">
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        )}
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr>
                        <td colSpan={3} className="px-3 py-4">
                          <div className="space-y-3">
                            <div>
                              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1">
                                Created
                              </label>
                              <p className="text-sm">
                                {new Date(problem.created_at).toLocaleDateString('en-US')}
                              </p>
                            </div>

                            <div>
                              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1">
                                Updated
                              </label>
                              <p className="text-sm">
                                {new Date(problem.updated_at).toLocaleDateString('en-US')}
                              </p>
                            </div>

                            <div className="flex items-center gap-2 pt-2 border-t border-[var(--gray-6)]">
                              <Link
                                href={`/admin/problems/edit/${problem.id}`}
                                className="text-xs text-[var(--accent-9)] hover:underline"
                                onClick={(e) => e.stopPropagation()}
                              >
                                Edit
                              </Link>
                              <button
                                className="text-xs text-red-600 hover:underline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeleteProblem(problem.id, problem.title);
                                }}
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Desktop: Full Table Layout */}
      <div className="hidden md:block overflow-x-auto">
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
