'use client';

import React, { useState, useMemo } from 'react';
import {
  useLeetCodeProblems,
  useDeleteLeetCodeProblem,
} from '@/hooks/useLeetCode';
import Link from 'next/link';
import { LeetCodeSummary } from '@/types';
import CodeRacerLoader from '@/components/ui/CodeRacerLoader';

export default function LeetCodeList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');

  // Use React Query hooks
  const { data: problems = [], isLoading, error } = useLeetCodeProblems();
  const deleteProblemMutation = useDeleteLeetCodeProblem();

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}" problem?`)) {
      return;
    }

    try {
      await deleteProblemMutation.mutateAsync(id);
    } catch (err) {
      console.error('Failed to delete problem:', err);
      // Error is already handled by the mutation
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy':
        return 'bg-green-100 text-green-800';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'Hard':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredProblems = useMemo(() => {
    return problems.filter((problem: LeetCodeSummary) => {
      const matchesSearch = problem.title
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesDifficulty =
        difficultyFilter === 'all' || problem.difficulty === difficultyFilter;
      return matchesSearch && matchesDifficulty;
    });
  }, [problems, searchTerm, difficultyFilter]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <CodeRacerLoader />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-6">
        <div className="text-red-600 mb-4">
          {error instanceof Error
            ? error.message
            : 'Failed to load problem list.'}
        </div>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">LeetCode Problem Management</h1>
        <Link href="/admin/leetcode/create" className="px-6 py-2 rounded-md">
          + Add New Problem
        </Link>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search by problem title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2"
          />
        </div>
        <div className="w-full md:w-48">
          <select
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(e.target.value)}
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2"
          >
            <option value="all">All Difficulties</option>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>
        </div>
      </div>

      {/* Problem List */}
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
              {filteredProblems.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center">
                    {searchTerm || difficultyFilter !== 'all'
                      ? 'No problems match the search criteria.'
                      : 'No problems registered.'}
                  </td>
                </tr>
              ) : (
                filteredProblems.map((problem: LeetCodeSummary) => (
                  <tr key={problem.id} className="">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium">{problem.title}</div>
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
                        <Link href={`/admin/leetcode/edit/${problem.id}`}>
                          Edit
                        </Link>
                        <button
                          onClick={() =>
                            handleDelete(problem.id, problem.title)
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

      {/* Statistics */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className=" p-4 rounded-lg shadow bg-[hsl(var(--card))]">
          <div className="text-sm font-medium ">Total Problems</div>
          <div className="text-2xl font-bold ">{problems.length}</div>
        </div>

        <div className=" p-4 rounded-lg shadow bg-[hsl(var(--card))]">
          <div className="text-sm font-medium ">Easy</div>
          <div className="text-2xl font-bold text-green-600">
            {
              problems.filter((p: LeetCodeSummary) => p.difficulty === 'Easy')
                .length
            }
          </div>
        </div>

        <div className=" p-4 rounded-lg shadow bg-[hsl(var(--card))]">
          <div className="text-sm font-medium ">Medium</div>
          <div className="text-2xl font-bold text-yellow-600">
            {
              problems.filter((p: LeetCodeSummary) => p.difficulty === 'Medium')
                .length
            }
          </div>
        </div>

        <div className=" p-4 rounded-lg shadow bg-[hsl(var(--card))]">
          <div className="text-sm font-medium ">Hard</div>
          <div className="text-2xl font-bold text-red-600">
            {
              problems.filter((p: LeetCodeSummary) => p.difficulty === 'Hard')
                .length
            }
          </div>
        </div>
      </div>
    </div>
  );
}
