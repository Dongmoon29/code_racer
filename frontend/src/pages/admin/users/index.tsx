import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../../../hooks/useAuth';
import { userApi } from '@/lib/api';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export default function AdminUsersPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const PAGE_SIZE = 20;

  const [page, setPage] = useState<number>(1);
  const [sort, setSort] = useState<string>('created_at:desc');
  const queryClient = useQueryClient();

  // Simple client-side guard (SSR layout handles sidebar)
  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'admin')) {
      router.replace('/');
    }
  }, [user, isLoading, router]);

  const { data, isFetching, isError, error } = useQuery({
    queryKey: ['admin-users', { page, limit: PAGE_SIZE, sort }],
    queryFn: () => userApi.adminList(page, PAGE_SIZE, sort),
    enabled: !!user && user.role === 'admin',
    keepPreviousData: true,
  });

  // Prefetch next page when available
  useEffect(() => {
    if (!data?.has_next) return;
    queryClient.prefetchQuery({
      queryKey: ['admin-users', { page: page + 1, limit: PAGE_SIZE, sort }],
      queryFn: () => userApi.adminList(page + 1, PAGE_SIZE, sort),
    });
  }, [data, page, sort, queryClient]);

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
        <h1 className="text-2xl font-bold ">User Management</h1>
      </div>

      <div className="overflow-hidden rounded-lg shadow ">
        {isError && (
          <div className="px-4 py-2 text-sm text-red-600 border-b border-red-200 bg-red-50">
            {error instanceof Error ? error.message : 'Failed to load users'}
          </div>
        )}
        <table className="min-w-full divide-y">
          <thead>
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium  uppercase tracking-wider">
                ID
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium  uppercase tracking-wider">
                Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium  uppercase tracking-wider">
                Email
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium  uppercase tracking-wider">
                Role
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium  uppercase tracking-wider">
                <button
                  className="inline-flex items-center gap-1 "
                  onClick={() => {
                    setPage(1);
                    const [, dir = 'desc'] = sort.startsWith('created_at')
                      ? sort.split(':')
                      : ['created_at', 'desc'];
                    setSort(`created_at:${dir === 'desc' ? 'asc' : 'desc'}`);
                  }}
                  title="Sort by created date"
                >
                  Created
                  <span>
                    {sort === 'created_at:desc'
                      ? '▼'
                      : sort === 'created_at:asc'
                      ? '▲'
                      : '↕'}
                  </span>
                </button>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium  uppercase tracking-wider">
                Updated
              </th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className=" divide-y ">
            {(data?.items || []).map(
              (u: {
                id: string;
                name: string;
                email: string;
                role: string;
                created_at?: string;
                updated_at?: string;
              }) => (
                <tr key={u.id}>
                  <td className="px-4 py-3 text-xs font-mono">{u.id}</td>
                  <td className="px-4 py-3 text-sm">
                    <Link
                      href={`/users/${u.id}`}
                      className="underline underline-offset-2 hover:opacity-80"
                    >
                      {u.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm">{u.email}</td>
                  <td className="px-4 py-3 text-sm">
                    <span
                      className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {u.created_at
                      ? new Date(u.created_at).toLocaleDateString()
                      : '-'}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {u.updated_at
                      ? new Date(u.updated_at).toLocaleDateString()
                      : '-'}
                  </td>
                  <td className="px-4 py-3 text-right text-sm">
                    <div className="flex items-center gap-2">
                      <button className="mr-2 ">Edit</button>
                      <button>Delete</button>
                    </div>
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>
      {/* Pagination - pill style */}
      <div className="mt-6 flex items-center justify-center">
        <div className="flex items-center gap-4 rounded-full  px-5 py-3">
          <button
            className="inline-flex items-center gap-2"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={isFetching || page === 1}
            aria-label="Previous page"
          >
            <span className="text-lg">‹</span>
            <span className="hidden sm:inline text-sm">Previous</span>
          </button>

          <div className="flex items-center gap-2">
            {paginationRange.map((item, idx) =>
              item === '…' ? (
                <span key={`dots-${idx}`} className="px-2">
                  …
                </span>
              ) : (
                <button
                  key={item}
                  onClick={() => setPage(item as number)}
                  disabled={isFetching}
                  className={`relative inline-flex items-center justify-center w-8 h-8 rounded-full text-sm transition-colors ${
                    item === page
                      ? 'bg-indigo-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  aria-current={item === page ? 'page' : undefined}
                >
                  {item}
                </button>
              )
            )}
          </div>

          <button
            className="inline-flex items-center gap-2"
            onClick={() => setPage((p) => p + 1)}
            disabled={isFetching || !data?.has_next}
            aria-label="Next page"
          >
            <span className="hidden sm:inline text-sm">Next</span>
            <span className="text-lg">›</span>
          </button>
        </div>
      </div>
    </div>
  );
}
