import React from 'react';
import ProblemList from '../../../components/admin/ProblemList';
import { useAuth } from '../../../hooks/useAuth';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import CodeRacerLoader from '@/components/ui/CodeRacerLoader';

export default function ProblemAdminPage() {
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
        <CodeRacerLoader size="lg" />
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen">
      <ProblemList />
    </div>
  );
}
