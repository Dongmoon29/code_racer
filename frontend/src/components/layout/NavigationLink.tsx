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
    'group relative flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-0.5 py-1 text-[clamp(8px,2.5vw,10px)] font-medium leading-none transition-colors duration-200 md:w-full md:flex-none md:text-sm md:leading-normal',
    isCollapsed
      ? 'md:flex-row md:px-2 md:py-2.5'
      : 'md:flex-row md:justify-start md:gap-3 md:px-3 md:py-2.5',
    isActive
      ? 'bg-[var(--accent-3)] text-[var(--accent-11)]'
      : 'text-[var(--gray-11)] hover:bg-[var(--gray-3)] hover:text-[var(--color-text)]'
  );

  const iconWrapperClasses = cn(
    'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors md:h-9 md:w-9',
    isActive
      ? 'bg-[var(--accent-4)] text-[var(--accent-11)]'
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
