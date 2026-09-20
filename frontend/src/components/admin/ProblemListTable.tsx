import React, { FC, useState } from 'react';
import Link from 'next/link';
import { ProblemSummary } from '@/types';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import {
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableEmpty,
  DataTableHead,
  DataTableHeaderCell,
  DataTableRow,
  DataTableShell,
  MobileDisclosureCard,
} from '@/components/ui/DataTable';

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
    <DataTableShell>
      {/* Mobile: touch-friendly disclosure cards */}
      <div className="space-y-2 bg-[var(--gray-1)] p-3 md:hidden">
        {isEmpty ? (
          <div className="rounded-xl border border-dashed border-[var(--gray-6)] px-5 py-12 text-center">
            <p className="text-sm font-semibold text-[var(--gray-12)]">
              {hasFilters ? 'No matching problems' : 'No problems yet'}
            </p>
            <p className="mt-1 text-xs text-[var(--gray-10)]">
              {hasFilters
                ? 'Try adjusting your search or filters.'
                : 'Create a problem to see it here.'}
            </p>
          </div>
        ) : (
          problems.map((problem: ProblemSummary) => {
            const isExpanded = expandedProblemId === problem.id;
            return (
              <MobileDisclosureCard
                key={problem.id}
                title={problem.title}
                description={`Updated ${new Date(problem.updated_at).toLocaleDateString('en-US')}`}
                badge={
                  <span
                    className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getDifficultyColor(
                      problem.difficulty
                    )}`}
                  >
                    {problem.difficulty}
                  </span>
                }
                expanded={isExpanded}
                onToggle={() =>
                  setExpandedProblemId(isExpanded ? null : problem.id)
                }
              >
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--gray-10)]">
                      Created
                    </p>
                    <p className="text-sm text-[var(--gray-12)]">
                      {new Date(problem.created_at).toLocaleDateString('en-US')}
                    </p>
                  </div>
                  <div>
                    <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--gray-10)]">
                      Last updated
                    </p>
                    <p className="text-sm text-[var(--gray-12)]">
                      {new Date(problem.updated_at).toLocaleDateString('en-US')}
                    </p>
                  </div>
                  <div className="col-span-2 grid grid-cols-[1fr_auto_auto] gap-2 border-t border-[var(--gray-6)] pt-4">
                    <button
                      type="button"
                      className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[var(--accent-9)] px-3 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-[var(--accent-10)]"
                      onClick={() => onViewProblem(problem.id)}
                    >
                      <Eye className="h-3.5 w-3.5" />
                      View
                    </button>
                    <Link
                      href={`/admin/problems/edit/${problem.id}`}
                      className="inline-flex items-center justify-center rounded-lg border border-[var(--gray-6)] px-3 py-2.5 transition-colors hover:bg-[var(--gray-4)]"
                      aria-label={`Edit ${problem.title}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </Link>
                    <button
                      type="button"
                      className="inline-flex items-center justify-center rounded-lg border border-red-500/20 px-3 py-2.5 text-red-400 transition-colors hover:bg-red-500/10"
                      onClick={() =>
                        onDeleteProblem(problem.id, problem.title)
                      }
                      aria-label={`Delete ${problem.title}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </MobileDisclosureCard>
            );
          })
        )}
      </div>

      {/* Desktop: Full Table Layout */}
      <div className="hidden overflow-x-auto md:block">
        <DataTable>
          <caption className="sr-only">Problem list</caption>
          <DataTableHead>
            <tr>
              <DataTableHeaderCell className="min-w-64">
                Title
              </DataTableHeaderCell>
              <DataTableHeaderCell>
                Difficulty
              </DataTableHeaderCell>
              <DataTableHeaderCell>
                Created
              </DataTableHeaderCell>
              <DataTableHeaderCell>
                Updated
              </DataTableHeaderCell>
              <DataTableHeaderCell className="text-right">
                Actions
              </DataTableHeaderCell>
            </tr>
          </DataTableHead>
          <DataTableBody>
            {isEmpty ? (
              <DataTableEmpty
                colSpan={5}
                title={hasFilters ? 'No matching problems' : 'No problems yet'}
                description={
                  hasFilters
                    ? 'Try adjusting your search or filters.'
                    : 'Create a problem to see it here.'
                }
              />
            ) : (
              problems.map((problem: ProblemSummary) => (
                <DataTableRow key={problem.id}>
                  <DataTableCell className="whitespace-nowrap">
                    <button
                      type="button"
                      className="group inline-flex items-center gap-2 text-left text-sm font-semibold transition-colors hover:text-[var(--accent-11)]"
                      onClick={() => onViewProblem(problem.id)}
                    >
                      {problem.title}
                      <Eye className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-60" />
                    </button>
                  </DataTableCell>
                  <DataTableCell className="whitespace-nowrap">
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getDifficultyColor(
                        problem.difficulty
                      )}`}
                    >
                      {problem.difficulty}
                    </span>
                  </DataTableCell>
                  <DataTableCell className="whitespace-nowrap text-sm text-[var(--gray-11)]">
                    {new Date(problem.created_at).toLocaleDateString('en-US')}
                  </DataTableCell>
                  <DataTableCell className="whitespace-nowrap text-sm text-[var(--gray-11)]">
                    {new Date(problem.updated_at).toLocaleDateString('en-US')}
                  </DataTableCell>
                  <DataTableCell className="whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/admin/problems/edit/${problem.id}`}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-[var(--gray-11)] transition-colors hover:bg-[var(--gray-4)] hover:text-[var(--gray-12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-8)]"
                        aria-label={`Edit ${problem.title}`}
                        title="Edit problem"
                      >
                        <Pencil className="h-4 w-4" />
                      </Link>
                      <button
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-[var(--gray-10)] transition-colors hover:bg-red-500/10 hover:text-red-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40"
                        onClick={() =>
                          onDeleteProblem(problem.id, problem.title)
                        }
                        aria-label={`Delete ${problem.title}`}
                        title="Delete problem"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </DataTableCell>
                </DataTableRow>
              ))
            )}
          </DataTableBody>
        </DataTable>
      </div>
    </DataTableShell>
  );
};
