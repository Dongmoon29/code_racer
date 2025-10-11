import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../../../hooks/useAuth';
import { getProblem } from '../../../../lib/problem-api';
import { ProblemFormData } from '@/types';
import ProblemForm from '../../../../components/admin/ProblemForm';
import CodeRacerLoader from '@/components/ui/CodeRacerLoader';

export default function EditProblemPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { id } = router.query;

  const [problem, setProblem] = useState<ProblemFormData | null>(null);
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
      const data = await getProblem(problemId);

      // API 응답을 폼 데이터 형식으로 변환
      const formData: ProblemFormData = {
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
        io_templates: data.io_templates,
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
    router.push('/admin/problems');
  };

  const handleCancel = () => {
    router.push('/admin/problems');
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <CodeRacerLoader size="lg" />
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
            onClick={() => router.push('/admin/problems')}
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
    <div className="min-h-screen py-8">
      <ProblemForm
        initialData={problem}
        mode="edit"
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    </div>
  );
}
