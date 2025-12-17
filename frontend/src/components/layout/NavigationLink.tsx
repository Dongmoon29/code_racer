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
    'group flex items-center rounded-md text-sm font-medium w-full overflow-hidden transition-all duration-150',
    isCollapsed ? 'justify-center px-2 py-2' : 'px-3 py-2',
    isActive
      ? 'bg-[var(--accent-3)] text-[var(--accent-11)] shadow-sm'
      : 'text-[var(--gray-11)] hover:bg-[var(--gray-4)] hover:text-[var(--color-text)] hover:translate-x-1 hover:shadow-sm'
  );

  const iconWrapperClasses = cn(
    'flex h-8 w-8 items-center justify-center rounded-md border border-transparent',
    isActive
      ? 'bg-[var(--accent-4)] border-[var(--accent-7)] text-[var(--accent-11)]'
      : 'bg-transparent group-hover:bg-[var(--gray-4)] group-hover:border-[var(--gray-6)]'
  );

  return (
    <Link
      href={item.href}
      className={linkClasses}
      title={isCollapsed ? item.label : undefined}
    >
      <span className={cn('flex items-center justify-center', !isCollapsed && 'mr-3')}>
        <span className={iconWrapperClasses}>{item.icon}</span>
      </span>
      {!isCollapsed && <span className="truncate">{item.label}</span>}
    </Link>
  );
}
