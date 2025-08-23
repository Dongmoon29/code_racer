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
  testCases: [{ input: [], output: '' }],
  expectedOutputs: '',
  difficulty: 'Easy',
  inputFormat: '',
  outputFormat: '',
  functionName: '',
  javascriptTemplate: '',
  pythonTemplate: '',
  goTemplate: '',
  javaTemplate: '',
  cppTemplate: '',
  timeLimit: 1000,
  memoryLimit: 128,
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
    const newTestCases = [...formData.testCases];
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
      testCases: [...prev.testCases, { input: [], output: '' }],
    }));
  };

  const removeTestCase = (index: number) => {
    if (formData.testCases.length > 1) {
      setFormData((prev) => ({
        ...prev,
        testCases: prev.testCases.filter((_, i) => i !== index),
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
        {mode === 'create' ? '새로운 LeetCode 문제 추가' : 'LeetCode 문제 수정'}
      </h2>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 기본 정보 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              제목 *
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
              난이도 *
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

        {/* 설명 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            문제 설명 *
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* 예시 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            예시 *
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

        {/* 제약 조건 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            제약 조건 *
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

        {/* 입력/출력 형식 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              입력 형식 *
            </label>
            <input
              type="text"
              value={formData.inputFormat}
              onChange={(e) => handleInputChange('inputFormat', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="array"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              출력 형식 *
            </label>
            <input
              type="text"
              value={formData.outputFormat}
              onChange={(e) =>
                handleInputChange('outputFormat', e.target.value)
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="number"
              required
            />
          </div>
        </div>

        {/* 함수명 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            함수명 *
          </label>
          <input
            type="text"
            value={formData.functionName}
            onChange={(e) => handleInputChange('functionName', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="twoSum"
            required
          />
        </div>

        {/* 테스트 케이스 */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <label className="block text-sm font-medium text-gray-700">
              테스트 케이스 *
            </label>
            <button
              type="button"
              onClick={addTestCase}
              className="px-3 py-1 bg-green-500 text-white rounded-md hover:bg-green-600 text-sm"
            >
              + 테스트 케이스 추가
            </button>
          </div>

          <div className="space-y-3">
            {formData.testCases.map((testCase, index) => (
              <div
                key={index}
                className="flex gap-3 items-center p-3 border border-gray-200 rounded-md"
              >
                <div className="flex-1">
                  <label className="block text-xs text-gray-600 mb-1">
                    입력
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
                    출력
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
                {formData.testCases.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeTestCase(index)}
                    className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                  >
                    삭제
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 예상 출력 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            예상 출력 *
          </label>
          <input
            type="text"
            value={formData.expectedOutputs}
            onChange={(e) =>
              handleInputChange('expectedOutputs', e.target.value)
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="6"
            required
          />
        </div>

        {/* 코드 템플릿 */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-800">코드 템플릿</h3>

          {['javascript', 'python', 'go', 'java', 'cpp'].map((lang) => (
            <div key={lang}>
              <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">
                {lang} 템플릿 *
              </label>
              <textarea
                value={
                  formData[
                    `${lang}Template` as keyof LeetCodeFormData
                  ] as string
                }
                onChange={(e) =>
                  handleInputChange(
                    `${lang}Template` as keyof LeetCodeFormData,
                    e.target.value
                  )
                }
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                placeholder={`${lang} 코드 템플릿을 입력하세요`}
                required
              />
            </div>
          ))}
        </div>

        {/* 제한 사항 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              시간 제한 (ms)
            </label>
            <input
              type="number"
              value={formData.timeLimit}
              onChange={(e) =>
                handleInputChange('timeLimit', parseInt(e.target.value))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="100"
              step="100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              메모리 제한 (MB)
            </label>
            <input
              type="number"
              value={formData.memoryLimit}
              onChange={(e) =>
                handleInputChange('memoryLimit', parseInt(e.target.value))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="16"
              step="16"
            />
          </div>
        </div>

        {/* 버튼 */}
        <div className="flex justify-end space-x-4 pt-6 border-t">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting
              ? '처리 중...'
              : mode === 'create'
              ? '문제 추가'
              : '문제 수정'}
          </button>
        </div>
      </form>
    </div>
  );
}
