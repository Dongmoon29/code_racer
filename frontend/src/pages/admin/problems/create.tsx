import React from 'react';
import ProblemForm from '../../../components/admin/ProblemForm';
import { useAuth } from '../../../hooks/useAuth';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import CodeRacerLoader from '@/components/ui/CodeRacerLoader';

export default function CreateProblemPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'admin')) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  const handleSuccess = () => {
    router.push('/admin/problems');
  };

  const handleCancel = () => {
    router.push('/admin/problems');
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <CodeRacerLoader size="lg" />
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen py-8">
      <ProblemForm
        mode="create"
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    </div>
  );
}
