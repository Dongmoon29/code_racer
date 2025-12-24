'use client';

import React, { FC } from 'react';
import Link from 'next/link';
import { User } from '@/stores/authStore';
import { ROUTES } from '@/lib/router';

interface MobileMenuProps {
  isOpen: boolean;
  isLoggedIn: boolean;
  user: User | null;
  onLogout: () => void;
  onClose: () => void;
}

const MobileMenu: FC<MobileMenuProps> = ({
  isOpen,
  isLoggedIn,
  user,
  onLogout,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="md:hidden py-4 relative z-50 border-t border-[var(--gray-6)] bg-[var(--color-panel)]">
      {isLoggedIn && user ? (
        <div className="space-y-3 px-4">
          <div className="text-sm text-[var(--gray-11)] flex items-center space-x-2">
            <span>Signed in as</span>
            <span className="font-medium">{user.email}</span>
          </div>
          <Link
            href={ROUTES.USER_PROFILE(user.id)}
            className="block py-2 text-[var(--color-text)] hover:bg-[var(--gray-4)] rounded transition-colors"
            onClick={onClose}
          >
            Dashboard
          </Link>
          {user.role === 'admin' && (
            <Link
              href="/admin"
              className="block py-2 text-[var(--color-text)] hover:bg-[var(--gray-4)] rounded transition-colors"
              onClick={onClose}
            >
              Admin Panel
            </Link>
          )}
          <button
            onClick={() => {
              onLogout();
              onClose();
            }}
            className="block w-full text-left py-2 text-[var(--color-text)] hover:bg-[var(--gray-4)] rounded transition-colors"
          >
            Logout
          </button>
        </div>
      ) : (
        <div className="space-y-3 px-4">
          <Link
            href="/login"
            className="block py-2 text-[var(--color-text)] hover:bg-[var(--gray-4)] rounded transition-colors"
            onClick={onClose}
          >
            Login
          </Link>
          <Link
            href="/register"
            className="block py-2 text-[var(--color-text)] hover:bg-[var(--gray-4)] rounded transition-colors"
            onClick={onClose}
          >
            Register
          </Link>
        </div>
      )}
    </div>
  );
};

export default MobileMenu;
