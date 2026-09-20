import { X } from 'lucide-react';
import { useEffect } from 'react';

export type AdminUserRole = 'user' | 'admin';

type DialogUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  oauth_provider?: string;
  account_status: 'active' | 'deactivated' | 'suspended';
  created_at?: string;
};

type UserRoleDialogProps = {
  user: DialogUser;
  role: AdminUserRole;
  isOwnAccount: boolean;
  isSaving: boolean;
  onRoleChange: (role: AdminUserRole) => void;
  onClose: () => void;
  onSave: () => void;
};

export function UserRoleDialog({
  user,
  role,
  isOwnAccount,
  isSaving,
  onRoleChange,
  onClose,
  onSave,
}: UserRoleDialogProps) {
  const isInactive = user.account_status !== 'active';
  const hasChanged = role !== user.role;
  const cannotEdit = isOwnAccount || isInactive;

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isSaving) onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isSaving, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 cursor-default bg-black/65 backdrop-blur-sm"
        onClick={isSaving ? undefined : onClose}
        aria-label="Close edit user dialog"
      />

      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-user-title"
        aria-describedby="edit-user-description"
        className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-[var(--gray-6)] bg-[var(--color-panel)] shadow-2xl"
      >
        <header className="flex items-start justify-between gap-4 border-b border-[var(--gray-6)] px-5 py-4 sm:px-6">
          <div>
            <h2 id="edit-user-title" className="text-lg font-bold text-[var(--gray-12)]">
              Edit user
            </h2>
            <p id="edit-user-description" className="mt-1 text-sm text-[var(--gray-10)]">
              Review account information and update the access role.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg text-[var(--gray-10)] transition-colors hover:bg-[var(--gray-4)] hover:text-[var(--gray-12)] disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="space-y-6 px-5 py-5 sm:px-6">
          <div className="rounded-xl border border-[var(--gray-6)] bg-[var(--gray-a2)] p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="truncate font-semibold text-[var(--gray-12)]">{user.name}</p>
                <p className="mt-0.5 truncate text-sm text-[var(--gray-10)]">{user.email}</p>
              </div>
              <span className="rounded-full border border-[var(--gray-6)] px-2.5 py-1 text-xs font-semibold capitalize text-[var(--gray-11)]">
                {user.account_status}
              </span>
            </div>

            <dl className="mt-4 grid gap-3 border-t border-[var(--gray-6)] pt-4 text-sm sm:grid-cols-2">
              <div className="min-w-0">
                <dt className="text-xs font-medium uppercase tracking-wide text-[var(--gray-9)]">User ID</dt>
                <dd className="mt-1 truncate font-mono text-xs text-[var(--gray-11)]" title={user.id}>
                  {user.id}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-[var(--gray-9)]">OAuth provider</dt>
                <dd className="mt-1 capitalize text-[var(--gray-11)]">{user.oauth_provider || 'Password'}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-[var(--gray-9)]">Created</dt>
                <dd className="mt-1 text-[var(--gray-11)]">
                  {user.created_at ? new Date(user.created_at).toLocaleDateString() : '-'}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-[var(--gray-9)]">Current role</dt>
                <dd className="mt-1 capitalize text-[var(--gray-11)]">{user.role}</dd>
              </div>
            </dl>
          </div>

          <div>
            <label htmlFor="user-role" className="mb-2 block text-sm font-semibold text-[var(--gray-12)]">
              Access role
            </label>
            <select
              id="user-role"
              value={role}
              onChange={(event) => onRoleChange(event.target.value as AdminUserRole)}
              disabled={cannotEdit || isSaving}
              autoFocus
              className="h-11 w-full cursor-pointer rounded-xl border border-[var(--gray-7)] bg-[var(--gray-2)] px-3 text-sm text-[var(--gray-12)] outline-none transition focus:border-[var(--accent-8)] focus:ring-2 focus:ring-[var(--accent-a5)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
            <p className="mt-2 text-xs text-[var(--gray-10)]">
              {isOwnAccount
                ? 'You cannot change your own role.'
                : isInactive
                  ? 'Inactive accounts cannot be edited.'
                  : 'Admins can manage users and problems. Assign this role only to trusted users.'}
            </p>
          </div>
        </div>

        <footer className="flex justify-end gap-2 border-t border-[var(--gray-6)] bg-[var(--gray-a2)] px-5 py-4 sm:px-6">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="inline-flex h-10 cursor-pointer items-center justify-center rounded-lg border border-[var(--gray-7)] px-4 text-sm font-semibold text-[var(--gray-11)] transition-colors hover:bg-[var(--gray-4)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={cannotEdit || !hasChanged || isSaving}
            className="inline-flex h-10 cursor-pointer items-center justify-center rounded-lg bg-[var(--accent-9)] px-4 text-sm font-semibold text-white transition-colors hover:bg-[var(--accent-10)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSaving ? 'Saving…' : 'Save changes'}
          </button>
        </footer>
      </section>
    </div>
  );
}
