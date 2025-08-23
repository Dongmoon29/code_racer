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
        testCases: data.testCases,
        expectedOutputs: data.expectedOutputs,
        difficulty: data.difficulty,
        inputFormat: data.inputFormat,
        outputFormat: data.outputFormat,
        functionName: data.functionName,
        javascriptTemplate: data.javascriptTemplate,
        pythonTemplate: data.pythonTemplate,
        goTemplate: data.goTemplate,
        javaTemplate: data.javaTemplate,
        cppTemplate: data.cppTemplate,
        timeLimit: data.timeLimit,
        memoryLimit: data.memoryLimit,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      };

      setProblem(formData);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : '문제를 불러오는데 실패했습니다.'
      );
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
        <div className="text-lg">로딩 중...</div>
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
            목록으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg text-gray-600">문제를 찾을 수 없습니다.</div>
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
