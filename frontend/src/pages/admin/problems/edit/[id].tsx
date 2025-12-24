import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { getProblem } from '../../../../lib/problem-api';
import { ProblemFormData } from '@/types';
import ProblemForm from '../../../../components/admin/ProblemForm';
import { Loader } from '@/components/ui/Loader';

export default function EditProblemPage() {
  const router = useRouter();
  const { id } = router.query;

  const [problem, setProblem] = useState<ProblemFormData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (id && typeof id === 'string') {
      loadProblem(id);
    }
  }, [id]);

  const loadProblem = async (problemId: string) => {
    try {
      setIsLoading(true);
      const data = await getProblem(problemId);

      const formData: ProblemFormData = {
        id: data.id,
        title: data.title,
        description: data.description,
        examples: (data.examples || []).map((ex) => ({
          input: ex.input,
          output: ex.output,
          explanation: ex.explanation,
        })),
        constraints: data.constraints,
        test_cases: data.test_cases,
        expected_outputs: data.expected_outputs,
        difficulty: data.difficulty,
        input_format: data.input_format,
        output_format: data.output_format,
        function_name: data.function_name,
        io_schema: data.io_schema,
        io_templates: (data.io_templates || []).map((t) => ({
          language: t.language,
          code: t.code,
        })),
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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader variant="spinner" size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center">
        <div className="text-red-600 mb-4">{error}</div>
        <button
          onClick={() => router.push('/admin/problems')}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Back to List
        </button>
      </div>
    );
  }

  if (!problem) {
    return <div className="text-lg text-gray-600">Problem not found.</div>;
  }

  return (
    <ProblemForm
      initialData={problem}
      mode="edit"
      onSuccess={handleSuccess}
      onCancel={handleCancel}
    />
  );
}
