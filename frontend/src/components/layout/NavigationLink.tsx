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
      ? 'bg-orange-500/15 text-orange-300 shadow-sm'
      : 'text-muted-foreground hover:bg-accent/40 hover:text-foreground hover:translate-x-1 hover:shadow-sm'
  );

  const iconWrapperClasses = cn(
    'flex h-8 w-8 items-center justify-center rounded-md border border-transparent',
    isActive
      ? 'bg-orange-500/20 border-orange-400/60 text-orange-300'
      : 'bg-transparent group-hover:bg-accent/60 group-hover:border-border'
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
