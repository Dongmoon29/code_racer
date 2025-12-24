'use client';

import React, { useState, FC } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuthStore } from '@/stores/authStore';
import Logo from './Logo';
import UserDropdown from '../ui/UserDropdown';
import MobileMenu from './MobileMenu';
import { useDropdown } from '@/hooks/useDropdown';
import { ROUTES } from '@/lib/router';

const Header: FC = () => {
  const { user, isLoggedIn, logout } = useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const dropdown = useDropdown();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    dropdown.close();
  };

  const handleNavigateToProfile = () => {
    if (user?.id) {
      router.push(`/users/${user.id}`);
    } else {
      router.push('/dashboard');
    }
  };

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const closeMenu = () => {
    setMenuOpen(false);
  };

  return (
    <header className="bg-transparent border-none relative z-50">
      <div className="px-4 md:px-8">
        <div className="flex justify-between items-stretch h-16">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-3 transition-colors text-[var(--color-text)] hover:text-[var(--accent-9)]"
            >
              <Logo />
              <span className="font-semibold text-lg">codeRacer</span>
            </Link>
          </div>

          <div className="md:hidden flex items-center space-x-2">
            <button
              onClick={toggleMenu}
              className="focus:outline-none transition-colors text-[var(--color-text)] hover:text-[var(--accent-9)]"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>

          <nav className="hidden md:flex items-center">
            <div className="flex items-center gap-6">
              <Link
                href="/"
                className="text-sm font-medium transition-colors text-[var(--gray-11)] hover:text-[var(--accent-9)]"
              >
                Home
              </Link>

              {isLoggedIn && user ? (
                <Link
                  href={ROUTES.USER_PROFILE(user.id)}
                  className="text-sm font-medium transition-colors text-[var(--gray-11)] hover:text-[var(--accent-9)]"
                >
                  Dashboard
                </Link>
              ) : (
                <Link
                  href={ROUTES.LOGIN}
                  className="text-sm font-medium transition-colors text-[var(--gray-11)] hover:text-[var(--accent-9)]"
                >
                  Dashboard
                </Link>
              )}

              {isLoggedIn && user ? (
                <UserDropdown
                  user={user}
                  isOpen={dropdown.isOpen}
                  onToggle={dropdown.toggle}
                  onClose={dropdown.close}
                  dropdownRef={dropdown.dropdownRef}
                  onLogout={handleLogout}
                  onNavigateToProfile={handleNavigateToProfile}
                />
              ) : (
                <Link
                  href="/register"
                  className="text-sm font-medium transition-colors text-[var(--gray-11)] hover:text-[var(--accent-9)]"
                >
                  Login
                </Link>
              )}
            </div>
          </nav>
        </div>
      </div>

      <MobileMenu
        isOpen={menuOpen}
        isLoggedIn={isLoggedIn}
        user={user}
        onLogout={handleLogout}
        onClose={closeMenu}
      />
    </header>
  );
};

export default Header;
