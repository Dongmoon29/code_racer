import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { ArrowRightToLine, ArrowLeftToLine } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BUTTON_STYLES, SIDEBAR_STYLES } from '@/lib/styles';
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
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const primaryItems = navigationItems.filter((item) => item.label !== 'Admin');
  const bottomItems = navigationItems.filter((item) => item.label === 'Admin');

  return (
    <div
      className={cn(
        'bg-[var(--color-panel)] border-r border-[var(--gray-6)] h-screen sticky top-0 overflow-y-auto transition-all duration-300 flex flex-col shrink-0 z-10',
        isCollapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Header */}
      <div
        className={cn(
          'pt-3 pb-2 border-b border-[var(--gray-6)] flex items-center gap-2',
          isCollapsed ? 'px-3 justify-center' : 'px-3 justify-between'
        )}
      >
        {(isMobile || !isCollapsed) && (
          <Link
            href="/"
            aria-label="Go to home"
            className="flex items-center gap-2 cursor-pointer rounded-md"
          >
            <div className="h-10 w-10 rounded-lg flex items-center justify-center">
              <Logo />
            </div>
          </Link>
        )}
        {!isMobile && (
          <button
            onClick={onToggle}
            className={cn(
              BUTTON_STYLES.ICON_BUTTON.BASE,
              BUTTON_STYLES.ICON_BUTTON.TEXT,
              BUTTON_STYLES.ICON_BUTTON.HOVER
            )}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            type="button"
          >
            {isCollapsed ? (
              <ArrowRightToLine className="w-6 h-6" />
            ) : (
              <ArrowLeftToLine className="w-6 h-6" />
            )}
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className={cn('flex-1 w-full', SIDEBAR_STYLES.NAV_PADDING, SIDEBAR_STYLES.NAV_GAP)}>
        {primaryItems.map((item) => {
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

      {bottomItems.length > 0 && (
        <nav className={cn('w-full border-t border-[var(--gray-6)]', SIDEBAR_STYLES.NAV_PADDING, SIDEBAR_STYLES.NAV_GAP)}>
          {bottomItems.map((item) => {
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
      )}
    </div>
  );
}
