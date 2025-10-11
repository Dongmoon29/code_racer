'use client';

import React, { useState, useEffect } from 'react';
import { ProblemFormData, TestCase } from '@/types';
import { createProblem, updateProblem } from '../../lib/problem-api';

interface ProblemFormProps {
  initialData?: ProblemFormData;
  mode: 'create' | 'edit';
  onSuccess?: () => void;
  onCancel?: () => void;
}

const defaultFormData: ProblemFormData = {
  title: '',
  description: '',
  examples: [],
  constraints: '',
  test_cases: [{ input: '', expected_output: '' }],
  expected_outputs: [],
  difficulty: 'Easy',
  input_format: '',
  output_format: '',
  function_name: '',
  io_templates: [],
  time_limit: 1000,
  memory_limit: 128,
  io_schema: { param_types: [], return_type: '' },
};

const difficultyOptions = ['Easy', 'Medium', 'Hard'];

export default function ProblemForm({
  initialData,
  mode,
  onSuccess,
  onCancel,
}: ProblemFormProps) {
  const [formData, setFormData] = useState<ProblemFormData>(
    initialData || defaultFormData
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const handleInputChange = (
    field: keyof ProblemFormData,
    value: string | number
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleTestCaseChange = (
    index: number,
    field: keyof TestCase,
    value: string
  ) => {
    const newTestCases = [...formData.test_cases];
    if (field === 'input') {
      newTestCases[index] = {
        ...newTestCases[index],
        input: value,
      };
    } else {
      newTestCases[index] = {
        ...newTestCases[index],
        expected_output: value,
      };
    }
    setFormData((prev) => ({ ...prev, test_cases: newTestCases }));
  };

  const addTestCase = () => {
    setFormData((prev) => ({
      ...prev,
      test_cases: [...prev.test_cases, { input: '', expected_output: '' }],
    }));
  };

  const removeTestCase = (index: number) => {
    if (formData.test_cases.length > 1) {
      setFormData((prev) => ({
        ...prev,
        test_cases: prev.test_cases.filter((_, i) => i !== index),
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      if (mode === 'create') {
        await createProblem(formData);
      } else if (initialData && initialData.id) {
        await updateProblem(initialData.id, {
          ...formData,
          id: initialData.id,
        });
      }

      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 ">
        {mode === 'create' ? 'Add New Problem' : 'Edit Problem'}
      </h2>
      {error && (
        <div className="mb-4 p-4 border border-red-200 rounded-md">
          <p className="text-red-600">{error}</p>
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2">Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium  mb-2">
              Difficulty *
            </label>
            <select
              value={formData.difficulty}
              onChange={(e) => handleInputChange('difficulty', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              {difficultyOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium  mb-2">
            Problem Description *
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* Examples */}
        <div>
          <label className="block text-sm font-medium  mb-2">Examples *</label>
          <textarea
            value={JSON.stringify(formData.examples, null, 2)}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value);
                handleInputChange('examples', parsed);
              } catch {
                // Invalid JSON, ignore
              }
            }}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Example 1: Input: nums = [2,7,11,15], target = 9 Output: [0,1]"
            required
          />
        </div>

        {/* Constraints */}
        <div>
          <label className="block text-sm font-medium  mb-2">
            Constraints *
          </label>
          <textarea
            value={formData.constraints}
            onChange={(e) => handleInputChange('constraints', e.target.value)}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="1 <= nums.length <= 10^4"
            required
          />
        </div>

        {/* Input/Output Format */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium  mb-2">
              Input Format *
            </label>
            <input
              type="text"
              value={formData.input_format}
              onChange={(e) =>
                handleInputChange('input_format', e.target.value)
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="array"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium  mb-2">
              Output Format *
            </label>
            <input
              type="text"
              value={formData.output_format}
              onChange={(e) =>
                handleInputChange('output_format', e.target.value)
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="number"
              required
            />
          </div>
        </div>

        {/* IO Schema */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium  mb-2">
              Param Types (comma-separated) *
            </label>
            <input
              type="text"
              value={
                Array.isArray(formData.io_schema.param_types)
                  ? formData.io_schema.param_types.join(', ')
                  : formData.io_schema.param_types
              }
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  io_schema: {
                    ...prev.io_schema,
                    param_types: e.target.value
                      .split(',')
                      .map((s) => s.trim())
                      .filter((s) => s.length > 0),
                  },
                }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="number, number"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium  mb-2">
              Return Type *
            </label>
            <input
              type="text"
              value={formData.io_schema.return_type}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  io_schema: { ...prev.io_schema, return_type: e.target.value },
                }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="number"
              required
            />
          </div>
        </div>

        {/* Function Name */}
        <div>
          <label className="block text-sm font-medium  mb-2">
            Function Name *
          </label>
          <input
            type="text"
            value={formData.function_name}
            onChange={(e) => handleInputChange('function_name', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="twoSum"
            required
          />
        </div>

        {/* Test Cases */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <label className="block text-sm font-medium ">Test Cases *</label>
            <button
              type="button"
              onClick={addTestCase}
              className="px-3 py-1 bg-green-500 rounded-md hover:bg-green-600 text-sm"
            >
              + Add Test Case
            </button>
          </div>

          <div className="space-y-3">
            {formData.test_cases.map((testCase, index) => (
              <div
                key={index}
                className="flex gap-3 items-center p-3 border rounded-md"
              >
                <div className="flex-1">
                  <label className="block text-xs  mb-1">Input</label>
                  <input
                    type="text"
                    value={testCase.input}
                    onChange={(e) =>
                      handleTestCaseChange(index, 'input', e.target.value)
                    }
                    className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="1, 2, 3"
                    required
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs  mb-1">Expected Output</label>
                  <input
                    type="text"
                    value={String(testCase.expected_output)}
                    onChange={(e) =>
                      handleTestCaseChange(
                        index,
                        'expected_output',
                        e.target.value
                      )
                    }
                    className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="6"
                    required
                  />
                </div>
                {formData.test_cases.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeTestCase(index)}
                    className="px-2 py-1 bg-red-500  rounded hover:bg-red-600 text-sm"
                  >
                    Delete
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Expected Output */}
        <div>
          <label className="block text-sm font-medium  mb-2">
            Expected Output *
          </label>
          <input
            type="text"
            value={formData.expected_outputs}
            onChange={(e) =>
              handleInputChange('expected_outputs', e.target.value)
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="6"
            required
          />
        </div>

        {/* Code Templates */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-800">Code Templates</h3>

          {['javascript', 'python', 'go', 'java', 'cpp'].map((lang) => (
            <div key={lang}>
              <label className="block text-sm font-medium  mb-2 capitalize">
                {lang} Template *
              </label>
              <textarea
                value={
                  formData[
                    `${lang}_template` as keyof ProblemFormData
                  ] as string
                }
                onChange={(e) =>
                  handleInputChange(
                    `${lang}_template` as keyof ProblemFormData,
                    e.target.value
                  )
                }
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                placeholder={`Enter ${lang} code template`}
                required
              />
            </div>
          ))}
        </div>

        {/* Limits */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium  mb-2">
              Time Limit (ms)
            </label>
            <input
              type="number"
              value={formData.time_limit}
              onChange={(e) =>
                handleInputChange('time_limit', parseInt(e.target.value))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="100"
              step="100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium  mb-2">
              Memory Limit (MB)
            </label>
            <input
              type="number"
              value={formData.memory_limit}
              onChange={(e) =>
                handleInputChange('memory_limit', parseInt(e.target.value))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="16"
              step="16"
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-end space-x-4 pt-6 border-t">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300  rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 bg-blue-600rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting
              ? 'Processing...'
              : mode === 'create'
              ? 'Add Problem'
              : 'Update Problem'}
          </button>
        </div>
      </form>
    </div>
  );
}
