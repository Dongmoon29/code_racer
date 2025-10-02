import React from 'react';
import LeetCodeList from '../../../components/admin/LeetCodeList';
import { useAuth } from '../../../hooks/useAuth';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

export default function LeetCodeAdminPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'admin')) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen">
      <LeetCodeList />
    </div>
  );
}
