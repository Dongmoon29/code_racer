import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { cn } from '@/lib/utils';
import Logo from './Logo';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { useTranslation } from 'next-i18next/pages';

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
  const { t } = useTranslation('common');

  return (
    <header className="sticky top-0 z-40 hidden border-b border-[var(--gray-6)] bg-[color:var(--color-panel)]/95 backdrop-blur-xl md:block">
      <div className="flex h-14 items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          aria-label={t('nav.goHome')}
          className="flex min-w-0 items-center gap-2 rounded-md px-1 py-1 outline-none transition-colors hover:bg-[var(--gray-3)] focus-visible:ring-2 focus-visible:ring-[var(--accent-8)]"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center">
            <Logo />
          </span>
          <span className="truncate text-sm font-semibold text-[var(--color-text)]">
            codeRacer
          </span>
        </Link>
        <LanguageSwitcher compact />
      </div>

      <nav
        aria-label={t('nav.mainNavigation')}
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

export function DashboardMobileNavigation({
  navigationItems,
}: DashboardTopNavigationProps) {
  const router = useRouter();
  const { t } = useTranslation('common');

  return (
    <nav
      aria-label={t('nav.mobileNavigation')}
      className="fixed inset-x-0 bottom-0 z-40 flex h-[calc(4.75rem+env(safe-area-inset-bottom))] items-stretch justify-around gap-0.5 border-t border-[var(--gray-6)] bg-[color:var(--color-panel)]/95 px-1.5 py-1.5 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_30px_rgba(0,0,0,0.16)] backdrop-blur-xl md:hidden"
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
              'group flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-0.5 py-1 text-[clamp(8px,2.5vw,10px)] font-medium leading-none transition-colors',
              isActive
                ? 'bg-[var(--accent-3)] text-[var(--accent-11)]'
                : 'text-[var(--gray-11)] hover:bg-[var(--gray-3)] hover:text-[var(--color-text)]',
            )}
          >
            <span
              className={cn(
                'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg [&>svg]:h-5 [&>svg]:w-5',
                isActive
                  ? 'bg-[var(--accent-4)] text-[var(--accent-11)]'
                  : 'text-[var(--gray-10)] group-hover:text-[var(--color-text)]',
              )}
            >
              {item.icon}
            </span>
            <span className="max-w-full truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
