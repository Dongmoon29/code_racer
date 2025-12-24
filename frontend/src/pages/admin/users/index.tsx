import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { userApi } from '@/lib/api';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { IconButton, TextField } from '@radix-ui/themes';
import { Search, X, ChevronDown, ChevronUp } from 'lucide-react';

type UserItem = {
  id: string;
  name: string;
  email: string;
  role: string;
  oauth_provider?: string;
  created_at?: string;
  updated_at?: string;
  last_login_at?: string;
};

export default function AdminUsersPage() {
  const PAGE_SIZE = 20;
  const [page, setPage] = useState<number>(1);
  const [sort, setSort] = useState<string>('created_at:desc');
  const [search, setSearch] = useState<string>('');
  const [searchInput, setSearchInput] = useState<string>('');
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Helper function to handle sort toggle
  const handleSortToggle = (
    field: 'created_at' | 'updated_at' | 'last_login_at'
  ) => {
    setPage(1); // Reset to first page when sorting changes
    const currentField = sort.split(':')[0];
    const currentDir = sort.split(':')[1] || 'desc';

    if (currentField === field) {
      // Toggle direction if same field
      setSort(`${field}:${currentDir === 'desc' ? 'asc' : 'desc'}`);
    } else {
      // Switch to new field with default desc
      setSort(`${field}:desc`);
    }
  };

  // Handle search submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput.trim());
    setPage(1); // Reset to first page when searching
  };

  // Handle search input clear
  const handleClearSearch = () => {
    setSearchInput('');
    setSearch('');
    setPage(1);
  };

  // Helper function to get sort icon
  const getSortIcon = (
    field: 'created_at' | 'updated_at' | 'last_login_at'
  ) => {
    const currentField = sort.split(':')[0];
    const currentDir = sort.split(':')[1] || 'desc';

    if (currentField !== field) {
      return '↕';
    }
    return currentDir === 'desc' ? '▼' : '▲';
  };

  const { data, isFetching, isError, error } = useQuery({
    queryKey: ['admin-users', { page, limit: PAGE_SIZE, sort, search }],
    queryFn: () =>
      userApi.adminList(page, PAGE_SIZE, sort, search || undefined),
    keepPreviousData: true,
  });

  // Prefetch next page when available
  useEffect(() => {
    if (!data?.has_next) return;
    queryClient.prefetchQuery({
      queryKey: [
        'admin-users',
        { page: page + 1, limit: PAGE_SIZE, sort, search },
      ],
      queryFn: () =>
        userApi.adminList(page + 1, PAGE_SIZE, sort, search || undefined),
    });
  }, [data, page, sort, search, queryClient]);

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

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">User Management</h1>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <div className="flex-1 max-w-md">
            <TextField.Root
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by Name, Email, or ID..."
              size="2"
              radius="large"
              className="w-full"
            />
          </div>
          <IconButton
            type="submit"
            disabled={isFetching}
            size="2"
            variant="solid"
            aria-label="Search"
            title="Search"
          >
            <Search size={16} />
          </IconButton>
          {search && (
            <IconButton
              type="button"
              onClick={handleClearSearch}
              size="2"
              variant="soft"
              color="gray"
              aria-label="Clear search"
              title="Clear search"
            >
              <X size={16} />
            </IconButton>
          )}
        </form>
        {search && (
          <p className="mt-2 text-sm text-gray-600">
            Searching for: <span className="font-semibold">{search}</span> (
            {data?.total ?? 0} results)
          </p>
        )}
      </div>

      <div className="overflow-hidden rounded-lg shadow">
        {isError && (
          <div className="px-4 py-2 text-sm text-red-600 border-b border-red-200 bg-red-50">
            {error instanceof Error ? error.message : 'Failed to load users'}
          </div>
        )}

        {/* Mobile: Table with ID and Email only, expandable details */}
        <div className="md:hidden overflow-x-auto">
          <table className="min-w-full divide-y">
            <thead>
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider">
                  ID
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider">
                  Email
                </th>
                <th className="px-3 py-2 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {(!data?.items || data.items.length === 0) && !isFetching && (
                <tr>
                  <td
                    colSpan={2}
                    className="px-4 py-8 text-center text-sm text-muted-foreground"
                  >
                    {isError
                      ? 'Failed to load users'
                      : search
                      ? 'No users found'
                      : 'No users'}
                  </td>
                </tr>
              )}
              {(data?.items || []).map((u: UserItem) => {
                const isExpanded = expandedUserId === u.id;
                return (
                  <React.Fragment key={u.id}>
                    <tr
                      onClick={() =>
                        setExpandedUserId(isExpanded ? null : u.id)
                      }
                      className="cursor-pointer hover:bg-[var(--gray-4)] transition-colors"
                    >
                      <td className="px-3 py-3 text-xs font-mono truncate max-w-[120px]">
                        {u.id}
                      </td>
                      <td className="px-3 py-3 text-sm truncate">{u.email}</td>
                      <td className="px-3 py-3 text-center">
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        )}
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr>
                        <td colSpan={3} className="px-3 py-4">
                          <div className="space-y-3">
                            <div>
                              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1">
                                Name
                              </label>
                              <p className="text-sm">
                                <Link
                                  href={`/users/${u.id}`}
                                  className="text-[var(--accent-9)] hover:underline"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {u.name}
                                </Link>
                              </p>
                            </div>

                            <div>
                              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1">
                                Role
                              </label>
                              <p>
                                <span className="inline-flex px-2 py-1 rounded-full text-xs font-semibold bg-[var(--gray-3)]">
                                  {u.role}
                                </span>
                              </p>
                            </div>

                            <div>
                              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1">
                                OAuth Provider
                              </label>
                              <p className="text-sm">
                                {u.oauth_provider ? u.oauth_provider : '-'}
                              </p>
                            </div>

                            <div>
                              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1">
                                Created
                              </label>
                              <p className="text-sm">
                                {u.created_at
                                  ? new Date(u.created_at).toLocaleDateString()
                                  : '-'}
                              </p>
                            </div>

                            <div>
                              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1">
                                Updated
                              </label>
                              <p className="text-sm">
                                {u.updated_at
                                  ? new Date(u.updated_at).toLocaleDateString()
                                  : '-'}
                              </p>
                            </div>

                            <div>
                              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1">
                                Last Login
                              </label>
                              <p className="text-sm">
                                {u.last_login_at
                                  ? new Date(
                                      u.last_login_at
                                    ).toLocaleDateString()
                                  : '-'}
                              </p>
                            </div>

                            <div className="flex items-center gap-2 pt-2 border-t border-[var(--gray-6)]">
                              <button
                                className="text-xs text-[var(--accent-9)] hover:underline"
                                onClick={(e) => e.stopPropagation()}
                              >
                                Edit
                              </button>
                              <button
                                className="text-xs text-red-600 hover:underline"
                                onClick={(e) => e.stopPropagation()}
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Desktop: Table Layout */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full divide-y">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  ID
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Role
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  OAuth
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  <button
                    className="inline-flex items-center gap-1 hover:opacity-80 transition-opacity"
                    onClick={() => handleSortToggle('created_at')}
                    title="Sort by created date"
                  >
                    Created
                    <span>{getSortIcon('created_at')}</span>
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  <button
                    className="inline-flex items-center gap-1 hover:opacity-80 transition-opacity"
                    onClick={() => handleSortToggle('updated_at')}
                    title="Sort by updated date"
                  >
                    Updated
                    <span>{getSortIcon('updated_at')}</span>
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  <button
                    className="inline-flex items-center gap-1 hover:opacity-80 transition-opacity"
                    onClick={() => handleSortToggle('last_login_at')}
                    title="Sort by last login date"
                  >
                    Last Login
                    <span>{getSortIcon('last_login_at')}</span>
                  </button>
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {(data?.items || []).map((u: UserItem) => (
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
                    <span className="inline-flex px-2 py-1 rounded-full text-xs font-semibold">
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {u.oauth_provider ? u.oauth_provider : '-'}
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
                  <td className="px-4 py-3 text-sm">
                    {u.last_login_at
                      ? new Date(u.last_login_at).toLocaleDateString()
                      : '-'}
                  </td>
                  <td className="px-4 py-3 text-right text-sm">
                    <div className="flex items-center gap-2">
                      <button className="mr-2">Edit</button>
                      <button>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-center">
        <div className="flex items-center gap-4 rounded-full px-5 py-3">
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
    </>
  );
}
