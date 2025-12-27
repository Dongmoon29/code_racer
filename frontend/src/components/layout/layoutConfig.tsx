import React from 'react';
import {
  Users,
  FileText,
  LayoutDashboard,
  Trophy,
  User,
  Shield,
  Settings,
  MessageSquare,
} from 'lucide-react';
import { ROUTES } from '@/lib/router';
import { NavigationItem } from './DashboardSidebar';

export type LayoutType = 'admin' | 'dashboard' | 'public' | 'none';

export interface LayoutConfig {
  layoutType: LayoutType;
  requireAuth?: boolean;
  requireAdmin?: boolean;
  showSidebar?: boolean;
  showHeader?: boolean;
}

/**
 * 라우트 경로를 기반으로 레이아웃 타입을 결정합니다.
 */
export function getLayoutType(pathname: string): LayoutType {
  // Admin routes
  if (pathname.startsWith('/admin')) {
    return 'admin';
  }

  // Game routes - fullscreen 모드 지원
  // 게임 페이지는 인증이 필요하고 Header를 표시해야 함
  if (pathname.startsWith('/game')) {
    return 'public';
  }

  // Dashboard routes
  if (
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/users/') ||
    pathname.startsWith('/settings') ||
    pathname.startsWith('/community') ||
    pathname === '/leaderboard'
  ) {
    return 'dashboard';
  }

  // Public routes
  return 'public';
}

/**
 * 레이아웃 타입에 따른 설정을 반환합니다.
 */
export function getLayoutConfig(pathname: string): LayoutConfig {
  const layoutType = getLayoutType(pathname);

  switch (layoutType) {
    case 'admin':
      return {
        layoutType: 'admin',
        requireAuth: true,
        requireAdmin: true,
        showSidebar: true,
        showHeader: false,
      };

    case 'dashboard':
      return {
        layoutType: 'dashboard',
        requireAuth: true,
        requireAdmin: false,
        showSidebar: true,
        showHeader: false,
      };

    case 'public':
      // 게임 페이지는 인증이 필요함
      const isGameRoute = pathname.startsWith('/game');
      return {
        layoutType: 'public',
        requireAuth: isGameRoute,
        requireAdmin: false,
        showSidebar: false,
        showHeader: true,
      };

    case 'none':
      return {
        layoutType: 'none',
        requireAuth: false,
        requireAdmin: false,
        showSidebar: false,
        showHeader: false,
      };

    default:
      return {
        layoutType: 'public',
        requireAuth: false,
        requireAdmin: false,
        showSidebar: false,
        showHeader: true,
      };
  }
}

/**
 * Admin 레이아웃용 네비게이션 아이템을 생성합니다.
 */
export function getAdminNavigationItems(): NavigationItem[] {
  return [
    {
      href: ROUTES.ADMIN,
      label: 'Dashboard',
      icon: <LayoutDashboard className="w-5 h-5 shrink-0" />,
    },
    {
      href: ROUTES.ADMIN_PROBLEMS,
      label: 'Problems',
      icon: <FileText className="w-5 h-5 shrink-0" />,
      pattern: '/admin/problems',
    },
    {
      href: ROUTES.ADMIN_USERS,
      label: 'Users',
      icon: <Users className="w-5 h-5 shrink-0" />,
      pattern: '/admin/users',
    },
  ];
}

/**
 * Dashboard 레이아웃용 네비게이션 아이템을 생성합니다.
 */
export function getDashboardNavigationItems(
  userId?: string,
  userRole?: string
): NavigationItem[] {
  const items: NavigationItem[] = [
    {
      href: userId ? ROUTES.USER_PROFILE(userId) : '/dashboard',
      label: 'Profile',
      icon: <User className="w-5 h-5 shrink-0" />,
      pattern: '/users',
    },
    {
      href: ROUTES.LEADERBOARD,
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

  // Admin 사용자에게는 Admin 메뉴 추가
  if (userRole === 'admin') {
    items.push({
      href: ROUTES.ADMIN,
      label: 'Admin',
      icon: <Shield className="w-5 h-5 shrink-0" />,
      pattern: '/admin',
    });
  }

  return items;
}
