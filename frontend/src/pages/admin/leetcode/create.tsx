import React from 'react';
import LeetCodeForm from '../../../components/admin/LeetCodeForm';
import { useAuth } from '../../../hooks/useAuth';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

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
        <div className="text-lg">로딩 중...</div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <LeetCodeForm
        mode="create"
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    </div>
  );
}
