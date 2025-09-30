import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../../hooks/useAuth';
import { userApi } from '@/lib/api';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export default function AdminUsersPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const PAGE_SIZE = 20;

  const [page, setPage] = useState<number>(1);
  const queryClient = useQueryClient();

  // Simple client-side guard (SSR layout handles sidebar)
  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'admin')) {
      router.replace('/');
    }
  }, [user, isLoading, router]);

  const { data, isFetching, isError, error } = useQuery({
    queryKey: ['admin-users', { page, limit: PAGE_SIZE }],
    queryFn: () => userApi.adminList(page, PAGE_SIZE),
    enabled: !!user && user.role === 'admin',
    keepPreviousData: true,
  });

  // Prefetch next page when available
  useEffect(() => {
    if (!data?.has_next) return;
    queryClient.prefetchQuery({
      queryKey: ['admin-users', { page: page + 1, limit: PAGE_SIZE }],
      queryFn: () => userApi.adminList(page + 1, PAGE_SIZE),
    });
  }, [data, page, queryClient]);

  const rangeText = useMemo(() => {
    const total = data?.total ?? 0;
    const start = (page - 1) * PAGE_SIZE + 1;
    const end = Math.min(page * PAGE_SIZE, total);
    if (total === 0) return '0 of 0';
    return `${start}–${end} of ${total}`;
  }, [page, data]);

  // Build pagination range like: 1 … 4 5 [6] 7 8 … 24
  const paginationRange = useMemo(() => {
    const total = data?.total ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const currentPage = Math.min(Math.max(1, page), totalPages);
    const siblingCount = 2; // number of pages to show on each side

    const range: Array<number | '…'> = [];
    const addRange = (start: number, end: number) => {
      for (let i = start; i <= end; i++) range.push(i);
    };

    // Always show first and last
    const left = Math.max(2, currentPage - siblingCount);
    const right = Math.min(totalPages - 1, currentPage + siblingCount);

    range.push(1);
    if (left > 2) range.push('…');
    if (left <= right) addRange(left, right);
    if (right < totalPages - 1) range.push('…');
    if (totalPages > 1) range.push(totalPages);

    // Edge cases for small page counts
    if (totalPages <= 7) {
      const small: Array<number> = [];
      for (let i = 1; i <= totalPages; i++) small.push(i);
      return small;
    }
    return range;
  }, [data, page]);

  if (isLoading || !user || user.role !== 'admin') return null;

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
      </div>

      <div className="overflow-hidden rounded-lg shadow bg-white">
        {isError && (
          <div className="px-4 py-2 text-sm text-red-600 border-b border-red-200 bg-red-50">
            {error instanceof Error ? error.message : 'Failed to load users'}
          </div>
        )}
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {(data?.items || []).map(
              (u: {
                id: string;
                name: string;
                email: string;
                role: string;
              }) => (
                <tr key={u.id}>
                  <td className="px-4 py-3 text-sm text-gray-900">{u.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{u.email}</td>
                  <td className="px-4 py-3 text-sm">
                    <span
                      className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${
                        u.role === 'admin'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-sm">
                    <button className="mr-2 text-blue-600 hover:text-blue-700">
                      Edit
                    </button>
                    <button className="text-red-600 hover:text-red-700">
                      Delete
                    </button>
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="mt-4 flex items-center justify-between">
        <span className="text-sm text-gray-600">{rangeText}</span>
        <div className="flex items-center gap-2">
          <button
            className="px-3 py-1 rounded border text-sm disabled:opacity-50"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={isFetching || page === 1}
          >
            Prev
          </button>
          {/* Numbered pages */}
          <div className="flex items-center gap-1">
            {paginationRange.map((item, idx) =>
              item === '…' ? (
                <span key={`dots-${idx}`} className="px-2 text-gray-500">
                  …
                </span>
              ) : (
                <button
                  key={item}
                  className={`px-3 py-1 rounded border text-sm ${
                    item === page
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setPage(item as number)}
                  disabled={isFetching}
                >
                  {item}
                </button>
              )
            )}
          </div>
          <button
            className="px-3 py-1 rounded border text-sm disabled:opacity-50"
            onClick={() => setPage((p) => p + 1)}
            disabled={isFetching || !data?.has_next}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
