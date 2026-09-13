import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface NavigationItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  pattern?: string;
}

interface NavigationLinkProps {
  item: NavigationItem;
  isActive: boolean;
  isCollapsed: boolean;
}

export function NavigationLink({ item, isActive, isCollapsed }: NavigationLinkProps) {
  const linkClasses = cn(
    'group relative flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-md px-0.5 py-1 text-[clamp(8px,2.5vw,10px)] font-medium leading-none transition-colors md:w-full md:flex-none md:text-[13px] md:leading-normal',
    isCollapsed
      ? 'md:h-9 md:flex-row md:px-2'
      : 'md:h-9 md:flex-row md:justify-start md:gap-2 md:px-2',
    isActive
      ? 'bg-[var(--gray-3)] text-[var(--color-text)] before:absolute before:inset-x-2 before:top-0 before:h-0.5 before:rounded-full before:bg-[var(--accent-9)] md:before:inset-y-1.5 md:before:left-0 md:before:right-auto md:before:h-auto md:before:w-0.5'
      : 'text-[var(--gray-11)] hover:bg-[var(--gray-3)] hover:text-[var(--color-text)]'
  );

  const iconWrapperClasses = cn(
    'flex h-7 w-7 shrink-0 items-center justify-center transition-colors md:h-5 md:w-5 [&>svg]:h-4 [&>svg]:w-4',
    isActive
      ? 'text-[var(--color-text)]'
      : 'text-[var(--gray-10)] group-hover:text-[var(--color-text)]'
  );

  return (
    <Link
      href={item.href}
      className={linkClasses}
      title={isCollapsed ? item.label : undefined}
      aria-current={isActive ? 'page' : undefined}
    >
      <span className={iconWrapperClasses}>{item.icon}</span>
      <span className="whitespace-nowrap md:hidden">
        {item.label}
      </span>
      {!isCollapsed && (
        <span className="hidden truncate md:block">{item.label}</span>
      )}
    </Link>
  );
}
