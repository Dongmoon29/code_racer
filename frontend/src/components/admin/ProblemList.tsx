'use client';

import React, { useEffect, useState, useMemo } from 'react';
import {
  useProblems,
  useProblem,
  useDeleteProblem,
  useCreateProblem,
  useUpdateProblem,
} from '@/hooks/useProblem';
import Link from 'next/link';
import { CreateProblemRequest, ProblemDetail, ProblemSummary } from '@/types';
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

  const [isViewJsonModalOpen, setIsViewJsonModalOpen] = useState(false);
  const [viewProblemId, setViewProblemId] = useState<string | null>(null);
  const [viewJsonNotice, setViewJsonNotice] = useState<string>('');
  const [viewJsonError, setViewJsonError] = useState<string>('');
  const [isViewJsonEditing, setIsViewJsonEditing] = useState(false);
  const [viewJsonText, setViewJsonText] = useState<string>('');
  const [viewJsonBaselineText, setViewJsonBaselineText] = useState<string>('');

  // Use React Query hooks
  const { data: problems = [], isLoading, error } = useProblems();
  const deleteProblemMutation = useDeleteProblem();
  const createProblemMutation = useCreateProblem();
  const updateProblemMutation = useUpdateProblem();
  const {
    data: selectedProblem,
    isLoading: isProblemLoading,
    isError: isProblemError,
    error: problemError,
  } = useProblem(viewProblemId || '');

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

  const selectedProblemCreatePayload =
    useMemo((): CreateProblemRequest | null => {
      if (!selectedProblem) return null;

      const normalizeParamTypes = (value: unknown): string[] => {
        if (Array.isArray(value)) return value.map(String);
        if (typeof value === 'string') {
          try {
            const parsed = JSON.parse(value);
            if (Array.isArray(parsed)) return parsed.map(String);
          } catch {
            // ignore
          }
        }
        return [];
      };

      const p = selectedProblem as ProblemDetail;
      return {
        title: p.title,
        description: p.description,
        constraints: p.constraints,
        expected_outputs:
          Array.isArray(p.expected_outputs) && p.expected_outputs.length > 0
            ? p.expected_outputs.map(String)
            : (p.test_cases || []).map((tc) =>
                String(tc.expected_output ?? '')
              ),
        difficulty: p.difficulty,
        input_format: p.input_format,
        output_format: p.output_format,
        function_name: p.function_name,
        time_limit: p.time_limit,
        memory_limit: p.memory_limit,
        examples: (p.examples || []).map((ex) => ({
          input: ex.input ?? '',
          output: ex.output ?? '',
          explanation: ex.explanation ?? '',
        })),
        test_cases: (p.test_cases || []).map((tc) => ({
          input: tc.input ?? '',
          expected_output: tc.expected_output ?? '',
        })),
        io_schema: {
          param_types: normalizeParamTypes(p.io_schema.param_types),
          return_type: p.io_schema.return_type ?? '',
        },
        io_templates: (p.io_templates || []).map((t) => ({
          language: t.language ?? '',
          code: t.code ?? '',
        })),
      };
    }, [selectedProblem]);

  const selectedProblemCreatePayloadJSON = useMemo(() => {
    if (!selectedProblemCreatePayload) return '';
    return JSON.stringify(selectedProblemCreatePayload, null, 2);
  }, [selectedProblemCreatePayload]);

  useEffect(() => {
    if (!isViewJsonModalOpen) return;
    if (isProblemLoading) return;
    if (!selectedProblemCreatePayloadJSON) return;
    // When opening (or switching problem), initialize editor content unless user is actively editing.
    if (!isViewJsonEditing) {
      setViewJsonText(selectedProblemCreatePayloadJSON);
      setViewJsonBaselineText(selectedProblemCreatePayloadJSON);
    }
  }, [
    isViewJsonModalOpen,
    isProblemLoading,
    selectedProblemCreatePayloadJSON,
    isViewJsonEditing,
  ]);

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
      {isViewJsonModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => {
              if (updateProblemMutation.isPending) return;
              setIsViewJsonModalOpen(false);
              setViewProblemId(null);
              setViewJsonNotice('');
              setViewJsonError('');
              setIsViewJsonEditing(false);
              setViewJsonText('');
              setViewJsonBaselineText('');
            }}
          />
          <div className="relative w-[min(1200px,calc(100vw-2rem))] max-h-[min(92vh,1100px)] overflow-auto rounded-lg border bg-[hsl(var(--card))] p-6 shadow-lg">
            <div className="flex items-center justify-between gap-4 mb-4">
              <h2 className="text-xl font-semibold">Problem JSON</h2>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="px-3 py-1 rounded-md border"
                  disabled={isProblemLoading || updateProblemMutation.isPending}
                  onClick={() => {
                    if (isProblemLoading) return;
                    if (updateProblemMutation.isPending) return;
                    setViewJsonError('');
                    setViewJsonNotice('');
                    setIsViewJsonEditing((prev) => !prev);
                    // Ensure editor has latest JSON when entering edit mode.
                    if (
                      !isViewJsonEditing &&
                      selectedProblemCreatePayloadJSON
                    ) {
                      setViewJsonBaselineText(selectedProblemCreatePayloadJSON);
                      setViewJsonText(selectedProblemCreatePayloadJSON);
                    }
                  }}
                >
                  {isViewJsonEditing ? 'View' : 'Edit'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (updateProblemMutation.isPending) return;
                    setIsViewJsonModalOpen(false);
                    setViewProblemId(null);
                    setViewJsonNotice('');
                    setViewJsonError('');
                    setIsViewJsonEditing(false);
                    setViewJsonText('');
                    setViewJsonBaselineText('');
                  }}
                  className="px-3 py-1 rounded-md border"
                  disabled={updateProblemMutation.isPending}
                >
                  Close
                </button>
              </div>
            </div>

            <p className="text-sm mb-3">
              This JSON is formatted as a create payload so you can copy/paste
              it into <b>Add New Problem with JSON</b>.
            </p>

            {viewJsonNotice && (
              <div className="mb-3 p-3 rounded-md border border-green-300 text-green-700">
                {viewJsonNotice}
              </div>
            )}

            {viewJsonError && (
              <div className="mb-3 p-3 rounded-md border border-red-300 text-red-700">
                {viewJsonError}
              </div>
            )}

            {isProblemError && (
              <div className="mb-3 p-3 rounded-md border border-red-300 text-red-700">
                {problemError instanceof Error
                  ? problemError.message
                  : 'Failed to load problem'}
              </div>
            )}

            {isProblemLoading ? (
              <div className="flex justify-center items-center h-64">
                <CodeRacerLoader />
              </div>
            ) : (
              <div className="w-full h-[620px] border rounded-md overflow-hidden">
                <CodeEditor
                  value={viewJsonText || selectedProblemCreatePayloadJSON}
                  onChange={isViewJsonEditing ? setViewJsonText : undefined}
                  language="javascript"
                  theme="dark"
                  readOnly={!isViewJsonEditing}
                />
              </div>
            )}

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {isViewJsonEditing && (
                  <button
                    type="button"
                    className="px-4 py-2 rounded-md border"
                    disabled={updateProblemMutation.isPending}
                    onClick={() => {
                      setViewJsonError('');
                      try {
                        const parsed = JSON.parse(viewJsonText);
                        setViewJsonText(JSON.stringify(parsed, null, 2));
                      } catch (e) {
                        setViewJsonError(
                          e instanceof Error
                            ? `Invalid JSON: ${e.message}`
                            : 'Invalid JSON'
                        );
                      }
                    }}
                  >
                    Format JSON
                  </button>
                )}
                {isViewJsonEditing && (
                  <button
                    type="button"
                    className="px-4 py-2 rounded-md border"
                    disabled={
                      updateProblemMutation.isPending || !viewJsonBaselineText
                    }
                    onClick={() => {
                      setViewJsonError('');
                      setViewJsonNotice('');
                      setViewJsonText(viewJsonBaselineText);
                    }}
                  >
                    Reset
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                {isViewJsonEditing && (
                  <button
                    type="button"
                    className="px-4 py-2 rounded-md border"
                    disabled={
                      updateProblemMutation.isPending ||
                      !viewProblemId ||
                      !viewJsonText
                    }
                    onClick={async () => {
                      if (!viewProblemId) return;
                      setViewJsonError('');
                      setViewJsonNotice('');

                      let payload: unknown;
                      try {
                        payload = JSON.parse(viewJsonText);
                      } catch (e) {
                        setViewJsonError(
                          e instanceof Error
                            ? `Invalid JSON: ${e.message}`
                            : 'Invalid JSON'
                        );
                        return;
                      }

                      if (typeof payload !== 'object' || payload === null) {
                        setViewJsonError('JSON payload must be an object');
                        return;
                      }

                      try {
                        const updated = await updateProblemMutation.mutateAsync(
                          {
                            id: viewProblemId,
                            data: { ...(payload as object), id: viewProblemId },
                          }
                        );
                        setViewJsonNotice('Saved');
                        setIsViewJsonEditing(false);
                        // Refresh editor with normalized JSON from server response (and update reset-baseline)
                        const normalized = JSON.stringify(
                          {
                            title: updated.title,
                            description: updated.description,
                            constraints: updated.constraints,
                            expected_outputs:
                              Array.isArray(updated.expected_outputs) &&
                              updated.expected_outputs.length > 0
                                ? updated.expected_outputs.map(String)
                                : (updated.test_cases || []).map(
                                    (tc: { expected_output: string }) =>
                                      String(tc.expected_output ?? '')
                                  ),
                            difficulty: updated.difficulty,
                            input_format: updated.input_format,
                            output_format: updated.output_format,
                            function_name: updated.function_name,
                            time_limit: updated.time_limit,
                            memory_limit: updated.memory_limit,
                            examples: (updated.examples || []).map(
                              (ex: {
                                input: string;
                                output: string;
                                explanation: string;
                              }) => ({
                                input: ex.input ?? '',
                                output: ex.output ?? '',
                                explanation: ex.explanation ?? '',
                              })
                            ),
                            test_cases: (updated.test_cases || []).map(
                              (tc: {
                                input: string;
                                expected_output: string;
                              }) => ({
                                input: tc.input ?? '',
                                expected_output: tc.expected_output ?? '',
                              })
                            ),
                            io_schema: {
                              param_types: Array.isArray(
                                updated.io_schema?.param_types
                              )
                                ? updated.io_schema.param_types.map(String)
                                : typeof updated.io_schema?.param_types ===
                                  'string'
                                ? (() => {
                                    try {
                                      const parsed = JSON.parse(
                                        updated.io_schema.param_types
                                      );
                                      return Array.isArray(parsed)
                                        ? parsed.map(String)
                                        : [];
                                    } catch {
                                      return [];
                                    }
                                  })()
                                : [],
                              return_type: updated.io_schema?.return_type ?? '',
                            },
                            io_templates: (updated.io_templates || []).map(
                              (t: { language: string; code: string }) => ({
                                language: t.language ?? '',
                                code: t.code ?? '',
                              })
                            ),
                          },
                          null,
                          2
                        );
                        setViewJsonText(normalized);
                        setViewJsonBaselineText(normalized);
                        setTimeout(() => setViewJsonNotice(''), 1500);
                      } catch (e) {
                        setViewJsonError(
                          e instanceof Error ? e.message : 'Save failed'
                        );
                      }
                    }}
                  >
                    {updateProblemMutation.isPending ? 'Saving...' : 'Save'}
                  </button>
                )}
                <button
                  type="button"
                  className="px-4 py-2 rounded-md border"
                  disabled={!(viewJsonText || selectedProblemCreatePayloadJSON)}
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(
                        viewJsonText || selectedProblemCreatePayloadJSON
                      );
                      setViewJsonNotice('Copied to clipboard');
                      setTimeout(() => setViewJsonNotice(''), 1500);
                    } catch {
                      setViewJsonNotice('Copy failed');
                      setTimeout(() => setViewJsonNotice(''), 1500);
                    }
                  }}
                >
                  Copy JSON
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
                      <button
                        type="button"
                        className="text-sm font-medium underline underline-offset-2 hover:opacity-80 text-left"
                        onClick={() => {
                          setViewProblemId(problem.id);
                          setIsViewJsonModalOpen(true);
                          setViewJsonNotice('');
                        }}
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
