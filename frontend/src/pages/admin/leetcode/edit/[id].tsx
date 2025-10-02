import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../../../hooks/useAuth';
import { getLeetCodeProblem } from '../../../../lib/leetcode-api';
import { LeetCodeFormData } from '../../../../lib/leetcode-types';
import LeetCodeForm from '../../../../components/admin/LeetCodeForm';

export default function EditLeetCodePage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { id } = router.query;

  const [problem, setProblem] = useState<LeetCodeFormData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (id && typeof id === 'string') {
      loadProblem(id);
    }
  }, [id]);

  const loadProblem = async (problemId: string) => {
    try {
      setIsLoading(true);
      const data = await getLeetCodeProblem(problemId);

      // API 응답을 폼 데이터 형식으로 변환
      const formData: LeetCodeFormData = {
        id: data.id,
        title: data.title,
        description: data.description,
        examples: data.examples,
        constraints: data.constraints,
        test_cases: data.test_cases,
        expected_outputs: data.expected_outputs,
        difficulty: data.difficulty,
        input_format: data.input_format,
        output_format: data.output_format,
        function_name: data.function_name,
        io_schema: data.io_schema,
        javascript_template: data.javascript_template,
        python_template: data.python_template,
        go_template: data.go_template,
        java_template: data.java_template,
        cpp_template: data.cpp_template,
        time_limit: data.time_limit,
        memory_limit: data.memory_limit,
        created_at: data.created_at,
        updated_at: data.updated_at,
      };

      setProblem(formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load problem.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuccess = () => {
    router.push('/admin/leetcode');
  };

  const handleCancel = () => {
    router.push('/admin/leetcode');
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return null;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">{error}</div>
          <button
            onClick={() => router.push('/admin/leetcode')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Back to List
          </button>
        </div>
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg text-gray-600">Problem not found.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <LeetCodeForm
        initialData={problem}
        mode="edit"
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    </div>
  );
}
