import { ReactNode } from 'react';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { Loader } from '@/components/ui/Loader';
import { useSidebarState } from '@/hooks/useSidebarState';
import { DashboardSidebar, NavigationItem } from './DashboardSidebar';
import Header from './Header';
import { useFullscreen } from '@/contexts/FullscreenContext';
import { LayoutConfig } from './layoutConfig';

interface AppLayoutProps {
  children: ReactNode;
  layoutConfig: LayoutConfig;
  navigationItems?: NavigationItem[];
}

export default function AppLayout({
  children,
  layoutConfig,
  navigationItems = [],
}: AppLayoutProps) {
  const { layoutType, requireAuth, requireAdmin, showSidebar, showHeader } =
    layoutConfig;
  const { isFullscreen } = useFullscreen();

  // 인증 및 권한 체크
  const authGuard = useAuthGuard({
    requireAuth: requireAuth ?? false,
    requireAdmin: requireAdmin ?? false,
  });

  // 사이드바 상태 관리
  const { isCollapsed, toggleSidebar } = useSidebarState();

  // 레이아웃 타입이 'none'이거나 fullscreen 모드인 경우 레이아웃 없이 렌더링
  if (layoutType === 'none' || isFullscreen) {
    return <>{children}</>;
  }

  // 인증이 필요한 경우 로딩 체크
  if (requireAuth && (authGuard.isLoading || !authGuard.isLoggedIn)) {
    return <Loader variant="fullscreen" />;
  }

  // Admin 권한이 필요한 경우 체크
  if (requireAdmin && authGuard.user?.role !== 'admin') {
    return <Loader variant="fullscreen" />;
  }

  // Public 레이아웃 (Header만 표시)
  if (layoutType === 'public') {
    return (
      <div className="min-h-screen flex flex-col">
        {showHeader && !isFullscreen && <Header />}
        <main className="flex-grow">{children}</main>
      </div>
    );
  }

  // Admin 또는 Dashboard 레이아웃 (Sidebar 포함)
  if (layoutType === 'admin' || layoutType === 'dashboard') {
    return (
      <div className="min-h-screen bg-[var(--color-background)] flex">
        {showSidebar && (
          <DashboardSidebar
            navigationItems={navigationItems}
            isCollapsed={isCollapsed}
            onToggle={toggleSidebar}
          />
        )}
        <div className="flex-1 min-w-0 p-4 md:p-8">
          <div className="max-w-7xl mx-auto">{children}</div>
        </div>
      </div>
    );
  }

  // 기본 레이아웃 (fallback)
  return <>{children}</>;
}
