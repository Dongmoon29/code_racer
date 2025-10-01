'use client';

import React, { useState, useEffect } from 'react';
import { LeetCodeFormData, TestCase } from '../../lib/leetcode-types';
import {
  createLeetCodeProblem,
  updateLeetCodeProblem,
} from '../../lib/leetcode-api';

interface LeetCodeFormProps {
  initialData?: LeetCodeFormData;
  mode: 'create' | 'edit';
  onSuccess?: () => void;
  onCancel?: () => void;
}

const defaultFormData: LeetCodeFormData = {
  title: '',
  description: '',
  examples: '',
  constraints: '',
  test_cases: [{ input: [], output: '' }],
  expected_outputs: '',
  difficulty: 'Easy',
  input_format: '',
  output_format: '',
  function_name: '',
  javascript_template: '',
  python_template: '',
  go_template: '',
  java_template: '',
  cpp_template: '',
  time_limit: 1000,
  memory_limit: 128,
};

const difficultyOptions = ['Easy', 'Medium', 'Hard'];

export default function LeetCodeForm({
  initialData,
  mode,
  onSuccess,
  onCancel,
}: LeetCodeFormProps) {
  const [formData, setFormData] = useState<LeetCodeFormData>(
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
    field: keyof LeetCodeFormData,
    value: string | number
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleTestCaseChange = (
    index: number,
    field: keyof TestCase,
    value: (string | number | boolean)[] | (string | number | boolean)
  ) => {
    const newTestCases = [...formData.test_cases];
    if (field === 'input') {
      newTestCases[index] = {
        ...newTestCases[index],
        input: value as (string | number | boolean)[],
      };
    } else {
      newTestCases[index] = {
        ...newTestCases[index],
        output: value as string | number | boolean,
      };
    }
    setFormData((prev) => ({ ...prev, testCases: newTestCases }));
  };

  const addTestCase = () => {
    setFormData((prev) => ({
      ...prev,
      test_cases: [...prev.test_cases, { input: [], output: '' }],
    }));
  };

  const removeTestCase = (index: number) => {
    if (formData.test_cases.length > 1) {
      setFormData((prev) => ({
        ...prev,
        testCases: prev.test_cases.filter((_, i) => i !== index),
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      if (mode === 'create') {
        await createLeetCodeProblem(formData);
      } else if (initialData && initialData.id) {
        await updateLeetCodeProblem(initialData.id, {
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
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        {mode === 'create'
          ? 'Add New LeetCode Problem'
          : 'Edit LeetCode Problem'}
      </h2>
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
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
          <label className="block text-sm font-medium text-gray-700 mb-2">
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
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Examples *
          </label>
          <textarea
            value={formData.examples}
            onChange={(e) => handleInputChange('examples', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Example 1: Input: nums = [2,7,11,15], target = 9 Output: [0,1]"
            required
          />
        </div>

        {/* Constraints */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
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

        {/* Function Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
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
            <label className="block text-sm font-medium text-gray-700">
              Test Cases *
            </label>
            <button
              type="button"
              onClick={addTestCase}
              className="px-3 py-1 bg-green-500 text-white rounded-md hover:bg-green-600 text-sm"
            >
              + Add Test Case
            </button>
          </div>

          <div className="space-y-3">
            {formData.test_cases.map((testCase, index) => (
              <div
                key={index}
                className="flex gap-3 items-center p-3 border border-gray-200 rounded-md"
              >
                <div className="flex-1">
                  <label className="block text-xs text-gray-600 mb-1">
                    Input
                  </label>
                  <input
                    type="text"
                    value={testCase.input.join(', ')}
                    onChange={(e) =>
                      handleTestCaseChange(
                        index,
                        'input',
                        e.target.value.split(',').map((s) => s.trim())
                      )
                    }
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="1, 2, 3"
                    required
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-gray-600 mb-1">
                    Output
                  </label>
                  <input
                    type="text"
                    value={String(testCase.output)}
                    onChange={(e) =>
                      handleTestCaseChange(index, 'output', e.target.value)
                    }
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="6"
                    required
                  />
                </div>
                {formData.test_cases.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeTestCase(index)}
                    className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
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
          <label className="block text-sm font-medium text-gray-700 mb-2">
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
              <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">
                {lang} Template *
              </label>
              <textarea
                value={
                  formData[
                    `${lang}_template` as keyof LeetCodeFormData
                  ] as string
                }
                onChange={(e) =>
                  handleInputChange(
                    `${lang}_template` as keyof LeetCodeFormData,
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
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
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
