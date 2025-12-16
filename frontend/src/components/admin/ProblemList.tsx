'use client';

import React, { useState, useMemo } from 'react';
import {
  useProblems,
  useDeleteProblem,
  useCreateProblem,
} from '@/hooks/useProblem';
import Link from 'next/link';
import { CreateProblemRequest, ProblemSummary } from '@/types';
import CodeRacerLoader from '@/components/ui/CodeRacerLoader';
import CodeEditor from '@/components/game/CodeEditor';

const DEFAULT_PROBLEM_JSON = `{
  "title": "INSERT_TITLE_HERE",
  "description": "INSERT_DESCRIPTION_HERE",
  "constraints": "INSERT_CONSTRAINTS_HERE",
  "difficulty": "INSERT_DIFFICULTY_HERE",
  "input_format": "INSERT_INPUT_FORMAT_HERE",
  "output_format": "INSERT_OUTPUT_FORMAT_HERE",
  "function_name": "INSERT_FUNCTION_NAME_HERE",
  "time_limit": 0,
  "memory_limit": 0,
  "examples": [
    { "input": "INSERT_INPUT_HERE", "output": "INSERT_OUTPUT_HERE", "explanation": "INSERT_EXPLANATION_HERE" }
  ],
  "test_cases": [
    { "input": "INSERT_INPUT_HERE", "expected_output": "INSERT_EXPECTED_OUTPUT_HERE" }
  ],
  "io_schema": { "param_types": ["INSERT_PARAM_TYPES_HERE"], "return_type": "INSERT_RETURN_TYPE_HERE" },
  "io_templates": [
    { "language": "javascript", "code": "INSERT_JAVASCRIPT_TEMPLATE_HERE" },
    { "language": "python", "code": "INSERT_PYTHON_TEMPLATE_HERE" },
    { "language": "go", "code": "INSERT_GO_TEMPLATE_HERE" }
  ]
}`;

export default function ProblemList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');
  const [isJsonModalOpen, setIsJsonModalOpen] = useState(false);
  const [jsonText, setJsonText] = useState(DEFAULT_PROBLEM_JSON);
  const [jsonError, setJsonError] = useState<string>('');

  // Use React Query hooks
  const { data: problems = [], isLoading, error } = useProblems();
  const deleteProblemMutation = useDeleteProblem();
  const createProblemMutation = useCreateProblem();

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

  const handleCreateWithJSON = async () => {
    setJsonError('');
    let payload: unknown;
    try {
      payload = JSON.parse(jsonText);
    } catch (e) {
      setJsonError(
        e instanceof Error ? `Invalid JSON: ${e.message}` : 'Invalid JSON'
      );
      return;
    }

    try {
      await createProblemMutation.mutateAsync(payload as CreateProblemRequest);
      // Reset editor to template after successful creation
      setJsonText(DEFAULT_PROBLEM_JSON);
      setJsonError('');
      setIsJsonModalOpen(false);
    } catch (e) {
      setJsonError(e instanceof Error ? e.message : 'Failed to create problem');
    }
  };

  const handleFormatJSON = () => {
    setJsonError('');
    try {
      const parsed = JSON.parse(jsonText);
      setJsonText(JSON.stringify(parsed, null, 2));
    } catch (e) {
      setJsonError(
        e instanceof Error ? `Invalid JSON: ${e.message}` : 'Invalid JSON'
      );
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
    return problems.filter((problem: ProblemSummary) => {
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
      {isJsonModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => {
              if (createProblemMutation.isPending) return;
              setIsJsonModalOpen(false);
            }}
          />
          <div className="relative w-[min(1200px,calc(100vw-2rem))] max-h-[min(92vh,1100px)] overflow-auto rounded-lg border bg-[hsl(var(--card))] p-6 shadow-lg">
            <div className="flex items-center justify-between gap-4 mb-4">
              <h2 className="text-xl font-semibold">
                Add New Problem with JSON
              </h2>
              <button
                type="button"
                onClick={() => {
                  if (createProblemMutation.isPending) return;
                  setIsJsonModalOpen(false);
                }}
                className="px-3 py-1 rounded-md border"
                disabled={createProblemMutation.isPending}
              >
                Close
              </button>
            </div>

            <p className="text-sm mb-3">
              Paste a JSON payload for the problem creation request. This will
              be sent to <code>/api/problems</code>.
            </p>

            {jsonError && (
              <div className="mb-3 p-3 rounded-md border border-red-300 text-red-700">
                {jsonError}
              </div>
            )}

            <div className="w-full h-[620px] border rounded-md overflow-hidden">
              <CodeEditor
                value={jsonText}
                onChange={setJsonText}
                language="javascript"
                theme="dark"
              />
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setJsonText(DEFAULT_PROBLEM_JSON);
                    setJsonError('');
                  }}
                  className="px-4 py-2 rounded-md border"
                >
                  Load Example
                </button>
                <button
                  type="button"
                  onClick={handleFormatJSON}
                  className="px-4 py-2 rounded-md border"
                >
                  Format JSON
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (createProblemMutation.isPending) return;
                    setIsJsonModalOpen(false);
                  }}
                  className="px-4 py-2 rounded-md border"
                  disabled={createProblemMutation.isPending}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreateWithJSON}
                  className="px-4 py-2 rounded-md bg-blue-600 text-white disabled:opacity-50"
                  disabled={createProblemMutation.isPending}
                >
                  {createProblemMutation.isPending ? 'Creating...' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Problem Management</h1>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setJsonError('');
              setIsJsonModalOpen(true);
            }}
            className="px-6 py-2 rounded-md border"
          >
            + Add New Problem with JSON
          </button>
          <Link href="/admin/problems/create" className="px-6 py-2 rounded-md">
            + Add New Problem
          </Link>
        </div>
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
                filteredProblems.map((problem: ProblemSummary) => (
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
                        <Link href={`/admin/problems/edit/${problem.id}`}>
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
              problems.filter((p: ProblemSummary) => p.difficulty === 'Easy')
                .length
            }
          </div>
        </div>

        <div className=" p-4 rounded-lg shadow bg-[hsl(var(--card))]">
          <div className="text-sm font-medium ">Medium</div>
          <div className="text-2xl font-bold text-yellow-600">
            {
              problems.filter((p: ProblemSummary) => p.difficulty === 'Medium')
                .length
            }
          </div>
        </div>

        <div className=" p-4 rounded-lg shadow bg-[hsl(var(--card))]">
          <div className="text-sm font-medium ">Hard</div>
          <div className="text-2xl font-bold text-red-600">
            {
              problems.filter((p: ProblemSummary) => p.difficulty === 'Hard')
                .length
            }
          </div>
        </div>
      </div>
    </div>
  );
}
