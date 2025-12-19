import { ReactNode, useMemo } from 'react';
import { Users, FileText, LayoutDashboard } from 'lucide-react';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { Loader } from '@/components/ui/Loader';
import { ROUTES } from '@/lib/router';
import { useSidebarState } from '@/hooks/useSidebarState';
import { DashboardSidebar, NavigationItem } from './DashboardSidebar';

type AdminLayoutProps = {
  children: ReactNode;
};

function useAdminNavigationItems(): NavigationItem[] {
  return useMemo(
    () => [
      {
        href: ROUTES.ADMIN,
        label: 'Dashboard',
        icon: <LayoutDashboard className="w-5 h-5 shrink-0" />,
      },
      {
        href: '/admin/problems',
        label: 'Problems',
        icon: <FileText className="w-5 h-5 shrink-0" />,
        pattern: '/admin/problems',
      },
      {
        href: '/admin/users',
        label: 'Users',
        icon: <Users className="w-5 h-5 shrink-0" />,
        pattern: '/admin/users',
      },
    ],
    []
  );
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { isLoggedIn, isLoading, user } = useAuthGuard({
    requireAuth: true,
    requireAdmin: true,
  });
  const { isCollapsed, toggleSidebar } = useSidebarState();
  const navigationItems = useAdminNavigationItems();

  if (isLoading || !isLoggedIn || user?.role !== 'admin') {
    return <Loader variant="fullscreen" />;
  }

  return (
    <div className="min-h-screen bg-background flex">
      <DashboardSidebar
        navigationItems={navigationItems}
        isCollapsed={isCollapsed}
        onToggle={toggleSidebar}
      />
      <div className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">{children}</div>
      </div>
    </div>
  );
}
