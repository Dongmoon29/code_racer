'use client';

import React, { useState, FC } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuthStore } from '@/stores/authStore';
import { ThemeToggle } from '../ui/ThemeToggle';
import Logo from './Logo';
import UserDropdown from '../ui/UserDropdown';
import MobileMenu from './MobileMenu';
import { useDropdown } from '@/hooks/useDropdown';

const Header: FC = () => {
  const { user, isLoggedIn, logout } = useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const dropdown = useDropdown();
  const router = useRouter();

  const isDashboardRoute = router.pathname.startsWith('/dashboard');

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
    <header className="border-b border-border bg-[color:hsl(var(--header))] relative z-50">
      <div className="px-4">
        <div className="flex justify-between items-stretch h-12">
          <div className="flex justify-between items-center gap-4 h-full">
            <div className="flex items-center gap-3">
              <Link href="/" className="flex items-center gap-3">
                <Logo />
                codeRacer
              </Link>
            </div>
            <div
              className={`flex items-center gap-3 h-full ${
                isDashboardRoute
                  ? 'border-b-2 border-orange-300 text-orange-300'
                  : ''
              }`}
            >
              <Link
                href="/dashboard"
                className="flex font-medium text-sm items-center gap-3 h-full hover:text-orange-500 transition-colors"
                aria-current={isDashboardRoute ? 'page' : undefined}
              >
                Dashboard
              </Link>
            </div>
          </div>

          <div className="md:hidden flex items-center space-x-2">
            <ThemeToggle />
            <button
              onClick={toggleMenu}
              className="text-foreground hover:text-primary focus:outline-none"
              style={{ color: 'hsl(var(--foreground))' }}
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

          <nav className="hidden md:flex items-center gap-4">
            <ThemeToggle />
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
                href="/login"
                className="hover:text-primary text-sm"
                style={{ color: 'hsl(var(--foreground))' }}
              >
                Login
              </Link>
            )}
          </nav>
        </div>

        <MobileMenu
          isOpen={menuOpen}
          isLoggedIn={isLoggedIn}
          user={user}
          onLogout={handleLogout}
          onClose={closeMenu}
        />
      </div>
    </header>
  );
};

export default Header;
