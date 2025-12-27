import { useState, useEffect, useMemo } from 'react';
import { AppProps } from 'next/app';
import {
  ThemeProvider as NextThemeProvider,
  useTheme as useNextTheme,
} from 'next-themes';
import { Theme } from '@radix-ui/themes';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { Analytics } from '@vercel/analytics/react';
import AppLayout from '../components/layout/AppLayout';
import {
  getLayoutConfig,
  getAdminNavigationItems,
  getDashboardNavigationItems,
} from '../components/layout/layoutConfig';
import '@radix-ui/themes/styles.css';
import '../styles/globals.css';
import { useAuthStore } from '../stores/authStore';
import { FullscreenProvider } from '../contexts/FullscreenContext';
import { LofiPlayerProvider } from '../contexts/LofiPlayerContext';
import { ToastProvider } from '../components/ui/Toast';

// Wrapper component to sync Radix Theme with next-themes
function RadixThemeWrapper({ children }: { children: React.ReactNode }) {
  const { theme, systemTheme } = useNextTheme();
  const radixTheme =
    theme === 'system' ? systemTheme || 'dark' : theme || 'dark';

  return (
    <Theme
      appearance={radixTheme as 'light' | 'dark'}
      accentColor="green"
      grayColor="slate"
      radius="medium"
    >
      {children}
    </Theme>
  );
}

function MyApp({ Component, pageProps }: AppProps) {
  const { initializeAuth, user } = useAuthStore();
  const router = useRouter();
  const [queryClient] = useState(() => new QueryClient());

  useEffect(() => {
    initializeAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 라우트 기반 레이아웃 설정
  const layoutConfig = useMemo(
    () => getLayoutConfig(router.pathname),
    [router.pathname]
  );

  // 네비게이션 아이템 생성
  const navigationItems = useMemo(() => {
    if (layoutConfig.layoutType === 'admin') {
      return getAdminNavigationItems();
    }
    if (layoutConfig.layoutType === 'dashboard') {
      return getDashboardNavigationItems(user?.id, user?.role);
    }
    return [];
  }, [layoutConfig.layoutType, user?.id, user?.role]);

  // Admin 페이지 제목 생성
  const adminTitle = useMemo(() => {
    const path = router.pathname;
    if (!path.startsWith('/admin')) return 'CRAdmin';
    if (path === '/admin') return 'CRAdmin | Overview';
    if (path.startsWith('/admin/users')) return 'CRAdmin | Users';
    if (path.startsWith('/admin/problems')) return 'CRAdmin | Problems';
    return 'CRAdmin';
  }, [router.pathname]);

  return (
    <NextThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <RadixThemeWrapper>
        <QueryClientProvider client={queryClient}>
          <FullscreenProvider>
            <LofiPlayerProvider>
              <ToastProvider>
                {layoutConfig.layoutType === 'admin' && (
                  <Head>
                    <title>{adminTitle}</title>
                  </Head>
                )}
                <AppLayout
                  layoutConfig={layoutConfig}
                  navigationItems={navigationItems}
                >
                  <Component {...pageProps} />
                </AppLayout>
              </ToastProvider>
            </LofiPlayerProvider>
          </FullscreenProvider>
        </QueryClientProvider>
        <Analytics />
      </RadixThemeWrapper>
    </NextThemeProvider>
  );
}

export default MyApp;
