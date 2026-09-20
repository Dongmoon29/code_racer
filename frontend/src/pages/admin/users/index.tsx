import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { userApi } from '@/lib/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { IconButton, TextField } from '@radix-ui/themes';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { ListSkeleton, Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { extractErrorMessage } from '@/lib/error-utils';
import { useAuthStore } from '@/stores/authStore';
import {
  AdminUserRole,
  UserRoleDialog,
} from '@/components/admin/UserRoleDialog';
import {
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableEmpty,
  DataTableHead,
  DataTableHeaderCell,
  DataTableRow,
  DataTableShell,
  MobileDisclosureCard,
} from '@/components/ui/DataTable';

type UserItem = {
  id: string;
  name: string;
  email: string;
  role: string;
  oauth_provider?: string;
  account_status: 'active' | 'deactivated' | 'suspended';
  deactivated_at?: string;
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
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [editingRole, setEditingRole] = useState<AdminUserRole>('user');
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const currentUserId = useAuthStore((state) => state.user?.id);

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
      return <ArrowUpDown className="h-3.5 w-3.5 opacity-50" aria-hidden="true" />;
    }
    return currentDir === 'desc' ? (
      <ArrowDown className="h-3.5 w-3.5 text-[var(--accent-11)]" aria-hidden="true" />
    ) : (
      <ArrowUp className="h-3.5 w-3.5 text-[var(--accent-11)]" aria-hidden="true" />
    );
  };

  const { data, isFetching, isLoading, isError, error } = useQuery({
    queryKey: ['admin-users', { page, limit: PAGE_SIZE, sort, search }],
    queryFn: () =>
      userApi.adminList(page, PAGE_SIZE, sort, search || undefined),
    keepPreviousData: true,
  });

  const deactivateUserMutation = useMutation({
    mutationFn: userApi.deactivate,
    onSuccess: async () => {
      setExpandedUserId(null);
      await queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      showToast({
        title: 'User deactivated',
        message: 'Login sessions were revoked and personal data was removed.',
        variant: 'success',
      });
    },
    onError: (mutationError: unknown) => {
      showToast({
        title: 'Unable to deactivate user',
        message: extractErrorMessage(
          mutationError,
          'The account could not be deactivated.'
        ),
        variant: 'error',
      });
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: AdminUserRole }) =>
      userApi.updateRole(userId, role),
    onSuccess: async () => {
      setEditingUser(null);
      await queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      showToast({
        title: 'Role updated',
        message: 'The user permissions now reflect the selected role.',
        variant: 'success',
      });
    },
    onError: (mutationError: unknown) => {
      showToast({
        title: 'Unable to update role',
        message: extractErrorMessage(mutationError, 'The user role could not be updated.'),
        variant: 'error',
      });
    },
  });

  const openRoleDialog = (user: UserItem) => {
    setEditingUser(user);
    setEditingRole(user.role === 'admin' ? 'admin' : 'user');
  };

  const handleDeactivateUser = (user: UserItem) => {
    if (user.account_status !== 'active') return;
    const confirmed = window.confirm(
      `Deactivate ${user.name}? This revokes every login session and permanently removes their personal information.`
    );
    if (confirmed) deactivateUserMutation.mutate(user.id);
  };

  const renderAccountBadge = (user: UserItem) => {
    if (user.account_status === 'deactivated') {
      return (
        <span className="inline-flex rounded-full border border-[var(--gray-6)] bg-[var(--gray-a3)] px-2.5 py-1 text-xs font-semibold text-[var(--gray-10)]">
          Deactivated
        </span>
      );
    }
    if (user.account_status === 'suspended') {
      return (
        <span className="inline-flex rounded-full border border-amber-500/25 bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-400">
          Suspended
        </span>
      );
    }
    return (
      <span className="inline-flex rounded-full border border-[var(--accent-6)] bg-[var(--accent-a3)] px-2.5 py-1 text-xs font-semibold capitalize text-[var(--accent-11)]">
        {user.role}
      </span>
    );
  };

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

  if (isLoading) {
    return (
      <div aria-label="Loading users" role="status">
        <Skeleton className="mb-6 h-8 w-52" />
        <Skeleton className="mb-6 h-10 w-full max-w-md" />
        <ListSkeleton rows={8} />
      </div>
    );
  }

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
          <p className="mt-2 text-sm text-[var(--gray-10)]">
            Searching for: <span className="font-semibold">{search}</span> (
            {data?.total ?? 0} results)
          </p>
        )}
      </div>

      <DataTableShell>
        {isError && (
          <div className="border-b border-red-500/20 bg-red-500/10 px-5 py-3 text-sm text-red-400">
            {error instanceof Error ? error.message : 'Failed to load users'}
          </div>
        )}

        {/* Mobile: touch-friendly disclosure cards */}
        <div className="space-y-2 bg-[var(--gray-1)] p-3 md:hidden">
          {(!data?.items || data.items.length === 0) && !isFetching ? (
            <div className="rounded-xl border border-dashed border-[var(--gray-6)] px-5 py-12 text-center">
              <p className="text-sm font-semibold text-[var(--gray-12)]">
                {isError
                  ? 'Unable to load users'
                  : search
                    ? 'No matching users'
                    : 'No users yet'}
              </p>
              {search && (
                <p className="mt-1 text-xs text-[var(--gray-10)]">
                  Try a different name, email, or ID.
                </p>
              )}
            </div>
          ) : (
            (data?.items || []).map((u: UserItem) => {
              const isExpanded = expandedUserId === u.id;
              return (
                <MobileDisclosureCard
                  key={u.id}
                  title={u.name}
                  description={u.email}
                  badge={renderAccountBadge(u)}
                  expanded={isExpanded}
                  onToggle={() =>
                    setExpandedUserId(isExpanded ? null : u.id)
                  }
                >
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-5">
                    <div className="col-span-2 min-w-0">
                      <dt className="mb-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--gray-10)]">
                        User ID
                      </dt>
                      <dd className="truncate font-mono text-xs text-[var(--gray-11)]" title={u.id}>
                        {u.id}
                      </dd>
                    </div>
                    <div>
                      <dt className="mb-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--gray-10)]">
                        OAuth
                      </dt>
                      <dd className="text-sm capitalize text-[var(--gray-11)]">
                        {u.oauth_provider || '-'}
                      </dd>
                    </div>
                    <div>
                      <dt className="mb-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--gray-10)]">
                        Last login
                      </dt>
                      <dd className="text-sm text-[var(--gray-11)]">
                        {u.last_login_at
                          ? new Date(u.last_login_at).toLocaleDateString()
                          : '-'}
                      </dd>
                    </div>
                    <div>
                      <dt className="mb-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--gray-10)]">
                        Created
                      </dt>
                      <dd className="text-sm text-[var(--gray-11)]">
                        {u.created_at
                          ? new Date(u.created_at).toLocaleDateString()
                          : '-'}
                      </dd>
                    </div>
                    <div>
                      <dt className="mb-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--gray-10)]">
                        Updated
                      </dt>
                      <dd className="text-sm text-[var(--gray-11)]">
                        {u.updated_at
                          ? new Date(u.updated_at).toLocaleDateString()
                          : '-'}
                      </dd>
                    </div>
                  </dl>
                  <div className="mt-4 grid grid-cols-[1fr_auto_auto] gap-2 border-t border-[var(--gray-6)] pt-4">
                    <Link
                      href={`/users/${u.id}`}
                      className="inline-flex items-center justify-center rounded-lg bg-[var(--accent-9)] px-3 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-[var(--accent-10)]"
                    >
                      View profile
                    </Link>
                    <button
                      type="button"
                      className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-[var(--gray-6)] px-3 py-2.5 transition-colors hover:bg-[var(--gray-4)]"
                      aria-label={`Edit ${u.name}`}
                      onClick={() => openRoleDialog(u)}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      className="inline-flex items-center justify-center rounded-lg border border-red-500/20 px-3 py-2.5 text-red-400 transition-colors hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-transparent"
                      aria-label={`Deactivate ${u.name}`}
                      title={
                        u.account_status === 'active'
                          ? 'Deactivate user'
                          : 'User is already inactive'
                      }
                      disabled={
                        u.account_status !== 'active' ||
                        deactivateUserMutation.isPending
                      }
                      onClick={() => handleDeactivateUser(u)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </MobileDisclosureCard>
              );
            })
          )}
        </div>

        {/* Desktop: Table Layout */}
        <div className="hidden overflow-x-auto md:block">
          <DataTable className="table-fixed">
            <caption className="sr-only">User list</caption>
            <DataTableHead>
              <tr>
                <DataTableHeaderCell className="hidden w-40 px-3 xl:table-cell">
                  ID
                </DataTableHeaderCell>
                <DataTableHeaderCell className="w-36 px-3">
                  Name
                </DataTableHeaderCell>
                <DataTableHeaderCell className="w-56 px-3">
                  Email
                </DataTableHeaderCell>
                <DataTableHeaderCell className="w-20 px-3">
                  Role
                </DataTableHeaderCell>
                <DataTableHeaderCell className="hidden w-24 px-3 lg:table-cell">
                  OAuth
                </DataTableHeaderCell>
                <DataTableHeaderCell className="hidden w-28 px-3 lg:table-cell">
                  <button
                    className="inline-flex items-center gap-1.5 rounded-md transition-colors hover:text-[var(--gray-12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-8)]"
                    onClick={() => handleSortToggle('created_at')}
                    title="Sort by created date"
                  >
                    Created
                    {getSortIcon('created_at')}
                  </button>
                </DataTableHeaderCell>
                <DataTableHeaderCell className="hidden w-28 px-3 xl:table-cell">
                  <button
                    className="inline-flex items-center gap-1.5 rounded-md transition-colors hover:text-[var(--gray-12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-8)]"
                    onClick={() => handleSortToggle('updated_at')}
                    title="Sort by updated date"
                  >
                    Updated
                    {getSortIcon('updated_at')}
                  </button>
                </DataTableHeaderCell>
                <DataTableHeaderCell className="w-28 px-3">
                  <button
                    className="inline-flex items-center gap-1.5 rounded-md transition-colors hover:text-[var(--gray-12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-8)]"
                    onClick={() => handleSortToggle('last_login_at')}
                    title="Sort by last login date"
                  >
                    Last Login
                    {getSortIcon('last_login_at')}
                  </button>
                </DataTableHeaderCell>
                <DataTableHeaderCell className="w-20 px-3 text-right">
                  <span className="sr-only">Actions</span>
                </DataTableHeaderCell>
              </tr>
            </DataTableHead>
            <DataTableBody>
              {(!data?.items || data.items.length === 0) && !isFetching && (
                <DataTableEmpty
                  colSpan={9}
                  title={isError ? 'Unable to load users' : search ? 'No matching users' : 'No users yet'}
                  description={search ? 'Try a different name, email, or ID.' : undefined}
                />
              )}
              {(data?.items || []).map((u: UserItem) => (
                <DataTableRow key={u.id}>
                  <DataTableCell className="hidden px-3 font-mono text-xs text-[var(--gray-9)] xl:table-cell" title={u.id}>
                    <span className="block truncate">{u.id}</span>
                  </DataTableCell>
                  <DataTableCell className="px-3 text-sm">
                    <Link
                      href={`/users/${u.id}`}
                      className="block truncate font-semibold transition-colors hover:text-[var(--accent-11)]"
                      title={u.name}
                    >
                      {u.name}
                    </Link>
                  </DataTableCell>
                  <DataTableCell className="px-3 text-sm text-[var(--gray-11)]" title={u.email}>
                    <span className="block truncate">{u.email}</span>
                  </DataTableCell>
                  <DataTableCell className="px-3 text-sm">
                    {renderAccountBadge(u)}
                  </DataTableCell>
                  <DataTableCell className="hidden px-3 text-sm capitalize text-[var(--gray-11)] lg:table-cell">
                    {u.oauth_provider ? u.oauth_provider : '-'}
                  </DataTableCell>
                  <DataTableCell className="hidden whitespace-nowrap px-3 text-sm text-[var(--gray-10)] lg:table-cell">
                    {u.created_at
                      ? new Date(u.created_at).toLocaleDateString()
                      : '-'}
                  </DataTableCell>
                  <DataTableCell className="hidden whitespace-nowrap px-3 text-sm text-[var(--gray-10)] xl:table-cell">
                    {u.updated_at
                      ? new Date(u.updated_at).toLocaleDateString()
                      : '-'}
                  </DataTableCell>
                  <DataTableCell className="whitespace-nowrap px-3 text-sm text-[var(--gray-10)]">
                    {u.last_login_at
                      ? new Date(u.last_login_at).toLocaleDateString()
                      : '-'}
                  </DataTableCell>
                  <DataTableCell className="px-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-[var(--gray-11)] transition-colors hover:bg-[var(--gray-4)] hover:text-[var(--gray-12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-8)]"
                        aria-label={`Edit ${u.name}`}
                        title="Edit user"
                        onClick={() => openRoleDialog(u)}
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-[var(--gray-10)] transition-colors hover:bg-red-500/10 hover:text-red-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-[var(--gray-10)]"
                        aria-label={`Deactivate ${u.name}`}
                        title={
                          u.account_status === 'active'
                            ? 'Deactivate user'
                            : 'User is already inactive'
                        }
                        disabled={
                          u.account_status !== 'active' ||
                          deactivateUserMutation.isPending
                        }
                        onClick={() => handleDeactivateUser(u)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </DataTableCell>
                </DataTableRow>
              ))}
            </DataTableBody>
          </DataTable>
        </div>
      </DataTableShell>

      <div className="mt-6 flex items-center justify-center">
        <nav
          className="flex items-center gap-2 rounded-xl border border-[var(--gray-6)] bg-[var(--color-panel)] p-1.5 shadow-sm"
          aria-label="User list pagination"
        >
          <button
            className="inline-flex h-9 items-center gap-1 rounded-lg px-2.5 text-sm font-medium text-[var(--gray-11)] transition-colors hover:bg-[var(--gray-4)] hover:text-[var(--gray-12)] disabled:cursor-not-allowed disabled:opacity-40"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={isFetching || page === 1}
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Previous</span>
          </button>

          <div className="flex items-center gap-1">
            {paginationRange.map((item, idx) =>
              item === '…' ? (
                <span key={`dots-${idx}`} className="px-1.5 text-sm text-[var(--gray-9)]">
                  …
                </span>
              ) : (
                <button
                  key={item}
                  onClick={() => setPage(item as number)}
                  disabled={isFetching}
                  className={`relative inline-flex h-9 w-9 items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                    item === page
                      ? 'bg-[var(--accent-9)] text-white shadow-sm'
                      : 'text-[var(--gray-11)] hover:bg-[var(--gray-4)] hover:text-[var(--gray-12)]'
                  }`}
                  aria-current={item === page ? 'page' : undefined}
                >
                  {item}
                </button>
              )
            )}
          </div>

          <button
            className="inline-flex h-9 items-center gap-1 rounded-lg px-2.5 text-sm font-medium text-[var(--gray-11)] transition-colors hover:bg-[var(--gray-4)] hover:text-[var(--gray-12)] disabled:cursor-not-allowed disabled:opacity-40"
            onClick={() => setPage((p) => p + 1)}
            disabled={isFetching || !data?.has_next}
            aria-label="Next page"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </nav>
      </div>

      {editingUser && (
        <UserRoleDialog
          user={editingUser}
          role={editingRole}
          isOwnAccount={editingUser.id === currentUserId}
          isSaving={updateRoleMutation.isPending}
          onRoleChange={setEditingRole}
          onClose={() => {
            if (!updateRoleMutation.isPending) setEditingUser(null);
          }}
          onSave={() =>
            updateRoleMutation.mutate({
              userId: editingUser.id,
              role: editingRole,
            })
          }
        />
      )}
    </>
  );
}
