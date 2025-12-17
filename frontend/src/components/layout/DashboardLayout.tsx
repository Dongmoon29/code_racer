import { ReactNode, useMemo } from 'react';
import { Trophy, User, Shield, Settings, MessageSquare } from 'lucide-react';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { ROUTES } from '@/lib/router';
import { useSidebarState } from '@/hooks/useSidebarState';
import { DashboardSidebar, NavigationItem } from './DashboardSidebar';

type DashboardLayoutProps = {
  children: ReactNode;
};

function useNavigationItems(userId?: string, userRole?: string): NavigationItem[] {
  return useMemo(() => {
    const items: NavigationItem[] = [
      {
        href: userId ? ROUTES.USER_PROFILE(userId) : '/dashboard',
        label: 'Profile',
        icon: <User className="w-5 h-5 shrink-0" />,
        pattern: '/users',
      },
      {
        href: '/leaderboard',
        label: 'Leaderboard',
        icon: <Trophy className="w-5 h-5 shrink-0" />,
      },
      {
        href: ROUTES.SETTINGS,
        label: 'Settings',
        icon: <Settings className="w-5 h-5 shrink-0" />,
        pattern: '/settings',
      },
      {
        href: ROUTES.COMMUNITY,
        label: 'Community',
        icon: <MessageSquare className="w-5 h-5 shrink-0" />,
        pattern: '/community',
      },
    ];

    if (userRole === 'admin') {
      items.push({
        href: ROUTES.ADMIN,
        label: 'Admin',
        icon: <Shield className="w-5 h-5 shrink-0" />,
        pattern: '/admin',
      });
    }

    return items;
  }, [userId, userRole]);
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { isLoggedIn, isLoading, user } = useAuthGuard({ requireAuth: true });
  const { isCollapsed, toggleSidebar } = useSidebarState();
  const navigationItems = useNavigationItems(user?.id, user?.role);

  if (isLoading || !isLoggedIn) {
    return <LoadingScreen />;
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
