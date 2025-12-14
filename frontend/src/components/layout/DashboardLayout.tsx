import React, { ReactNode, useState, useMemo } from 'react';
import { Car, Trophy, User, ChevronLeft, ChevronRight } from 'lucide-react';
import Header from './Header';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { ROUTES } from '@/lib/router';

type DashboardLayoutProps = {
  children: ReactNode;
};

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const { isLoggedIn, isLoading, user } = useAuthGuard({ requireAuth: true });

  const navigationItems = useMemo(() => [
    {
      href: user?.id ? ROUTES.USER_PROFILE(user.id) : '/dashboard',
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
      href: '/race',
      label: 'Race',
      icon: <Car className="w-5 h-5 shrink-0" />,
    },
  ], [user?.id]);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('dashboard-sidebar-collapsed') === 'true';
    }
    return false;
  });

  const toggleSidebar = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    if (typeof window !== 'undefined') {
      localStorage.setItem('dashboard-sidebar-collapsed', newState.toString());
    }
  };

  // Show loading screen while loading or not logged in
  if (isLoading || !isLoggedIn) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        {/* Sidebar */}
        <div
          className={`${
            isCollapsed ? 'w-16' : 'w-45'
          } bg-card border-r border-border h-full min-h-dvh sticky top-0 overflow-y-auto transition-all duration-300`}
        >
          <div>
            {/* Toggle Button */}
            <div className="flex justify-end mb-4">
              <button
                onClick={toggleSidebar}
                className="p-2 rounded-md hover:bg-accent transition-colors"
              >
                {isCollapsed ? (
                  <ChevronRight className="w-4 h-4" />
                ) : (
                  <ChevronLeft className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* Navigation */}
            <nav className="space-y-2 w-full">
              {navigationItems.map((item) => {
                const isActive = item.pattern
                  ? router.pathname.startsWith(item.pattern)
                  : router.pathname === item.href;

                return (
                  <div
                    key={item.href}
                    className={`flex items-center h-12 w-full ${
                      isActive
                        ? 'border-l-4 border-orange-300 text-orange-300'
                        : ''
                    }`}
                  >
                    <Link
                      href={item.href}
                      className={`flex items-center h-full hover:text-orange-500 transition-colors w-full ${
                        isCollapsed
                          ? 'justify-center px-2'
                          : 'gap-3 px-3 py-2 text-sm font-medium'
                      }`}
                      title={isCollapsed ? item.label : undefined}
                    >
                      {item.icon}
                      {!isCollapsed && <span>{item.label}</span>}
                    </Link>
                  </div>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">{children}</div>
        </div>
      </div>
    </div>
  );
}
