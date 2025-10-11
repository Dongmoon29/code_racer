import React from 'react';
import LeetCodeForm from '../../../components/admin/LeetCodeForm';
import { useAuth } from '../../../hooks/useAuth';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import CodeRacerLoader from '@/components/ui/CodeRacerLoader';

export default function CreateLeetCodePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'admin')) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  const handleSuccess = () => {
    router.push('/admin/leetcode');
  };

  const handleCancel = () => {
    router.push('/admin/leetcode');
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
      <LeetCodeForm
        mode="create"
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    </div>
  );
}
