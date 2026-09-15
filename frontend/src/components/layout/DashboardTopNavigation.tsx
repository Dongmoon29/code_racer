import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { cn } from '@/lib/utils';
import Logo from './Logo';

export interface NavigationItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  pattern?: string;
}

interface DashboardTopNavigationProps {
  navigationItems: NavigationItem[];
}

export function DashboardTopNavigation({
  navigationItems,
}: DashboardTopNavigationProps) {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--gray-6)] bg-[color:var(--color-panel)]/95 backdrop-blur-xl">
      <div className="flex h-14 items-center px-4 sm:px-6">
        <Link
          href="/"
          aria-label="Go to home"
          className="flex min-w-0 items-center gap-2 rounded-md px-1 py-1 outline-none transition-colors hover:bg-[var(--gray-3)] focus-visible:ring-2 focus-visible:ring-[var(--accent-8)]"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center">
            <Logo />
          </span>
          <span className="truncate text-sm font-semibold text-[var(--color-text)]">
            codeRacer
          </span>
        </Link>
      </div>

      <nav
        aria-label="Main navigation"
        className="flex h-11 items-stretch gap-1 overflow-x-auto px-3 [scrollbar-width:none] sm:px-5 [&::-webkit-scrollbar]:hidden"
      >
        {navigationItems.map((item) => {
          const isActive = item.pattern
            ? router.pathname.startsWith(item.pattern)
            : router.pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'group relative flex shrink-0 items-center gap-2 rounded-t-md border-b-2 px-3 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--accent-8)]',
                isActive
                  ? 'border-[var(--accent-9)] text-[var(--color-text)]'
                  : 'border-transparent text-[var(--gray-11)] hover:bg-[var(--gray-3)] hover:text-[var(--color-text)]',
              )}
            >
              <span
                className={cn(
                  'flex h-5 w-5 items-center justify-center [&>svg]:h-4 [&>svg]:w-4',
                  isActive
                    ? 'text-[var(--color-text)]'
                    : 'text-[var(--gray-10)] group-hover:text-[var(--color-text)]',
                )}
              >
                {item.icon}
              </span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
