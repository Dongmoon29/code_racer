'use client';

import React, { FC } from 'react';
import Link from 'next/link';
import { User } from '@/stores/authStore';

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
    <div className="md:hidden py-4 relative z-50">
      {isLoggedIn && user ? (
        <div className="space-y-3">
          <div className="px-2 text-sm text-[hsl(var(--foreground))] flex items-center space-x-2">
            <span>Signed in as</span>
            <span>{user.email}</span>
          </div>
          <Link
            href="/dashboard"
            className="block px-2 py-2 text-foreground hover:bg-muted rounded text-[hsl(var(--foreground))]"
            onClick={onClose}
          >
            Dashboard
          </Link>
          {user.role === 'admin' && (
            <Link
              href="/admin"
              className="block px-2 py-2 text-foreground hover:bg-muted rounded text-[hsl(var(--foreground))]"
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
            className="block w-full text-left px-2 py-2 text-foreground hover:bg-muted rounded text-[hsl(var(--foreground))]"
          >
            Logout
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <Link
            href="/login"
            className="block px-2 py-2 text-foreground hover:bg-muted rounded text-[hsl(var(--foreground))]"
            onClick={onClose}
          >
            Login
          </Link>
          <Link
            href="/register"
            className="block px-2 py-2 text-foreground hover:bg-muted rounded text-[hsl(var(--foreground))]"
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
