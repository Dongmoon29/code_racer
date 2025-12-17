import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { ArrowRightToLine, ArrowLeftToLine } from 'lucide-react';
import { cn } from '@/lib/utils';
import Logo from './Logo';
import { NavigationLink } from './NavigationLink';

export interface NavigationItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  pattern?: string;
}

interface DashboardSidebarProps {
  navigationItems: NavigationItem[];
  isCollapsed: boolean;
  onToggle: () => void;
}

export function DashboardSidebar({
  navigationItems,
  isCollapsed,
  onToggle,
}: DashboardSidebarProps) {
  const router = useRouter();

  return (
    <div
      className={cn(
        'bg-[var(--color-panel)] border-r border-[var(--gray-6)] h-screen sticky top-0 overflow-y-auto transition-all duration-300 flex flex-col',
        isCollapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Header */}
      <div className="px-3 pt-3 pb-2 border-b border-[var(--gray-6)] flex items-center justify-between gap-2">
        {!isCollapsed && (
          <Link
            href="/"
            aria-label="Go to home"
            className="group flex items-center gap-2 cursor-pointer rounded-md transition-all duration-150 hover:bg-[var(--gray-4)] hover:translate-x-0.5 hover:shadow-sm"
          >
            <div className="h-10 w-10 rounded-lg flex items-center justify-center transition-transform duration-150 group-hover:scale-105">
              <Logo />
            </div>
          </Link>
        )}
        <button
          onClick={onToggle}
          className="p-1.5 rounded-md text-[var(--gray-11)] shrink-0 cursor-pointer transition-all duration-150 hover:bg-[var(--gray-4)] hover:text-[var(--color-text)] hover:shadow-sm hover:scale-105"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          type="button"
        >
          {isCollapsed ? (
            <ArrowRightToLine className="w-6 h-6" />
          ) : (
            <ArrowLeftToLine className="w-6 h-6" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-3 space-y-1 w-full">
        {navigationItems.map((item) => {
          const isActive = item.pattern
            ? router.pathname.startsWith(item.pattern)
            : router.pathname === item.href;

          return (
            <NavigationLink
              key={item.href}
              item={item}
              isActive={isActive}
              isCollapsed={isCollapsed}
            />
          );
        })}
      </nav>
    </div>
  );
}
