import React, { useState } from 'react';
import { AppProps } from 'next/app';
import { ThemeProvider as NextThemeProvider } from 'next-themes';
import { ThemeProvider as StyledThemeProvider } from 'styled-components';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useRouter } from 'next/router';
import Head from 'next/head';
import AdminLayout from '../components/admin/AdminLayout';
import '../styles/globals.css';
import { useAuthStore } from '../stores/authStore';
import { useEffect } from 'react';
import { theme } from '../lib/theme';

function MyApp({ Component, pageProps }: AppProps) {
  const { initializeAuth } = useAuthStore();
  const router = useRouter();
  const [queryClient] = useState(() => new QueryClient());

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  // SSR-safe route check to avoid hydration mismatch
  const isAdminRoute = router.pathname.startsWith('/admin');

  // Derive admin page title
  const adminTitle = (() => {
    const path = router.pathname;
    if (!path.startsWith('/admin')) return 'CRAdmin';
    if (path === '/admin') return 'CRAdmin | Overview';
    if (path.startsWith('/admin/users')) return 'CRAdmin | Users';
    if (path.startsWith('/admin/leetcode')) return 'CRAdmin | LeetCode';
    return 'CRAdmin';
  })();

  return (
    <NextThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <StyledThemeProvider theme={theme}>
        <QueryClientProvider client={queryClient}>
          {isAdminRoute ? (
            <>
              <Head>
                <title>{adminTitle}</title>
              </Head>
              <AdminLayout>
                <Component {...pageProps} />
              </AdminLayout>
            </>
          ) : (
            <Component {...pageProps} />
          )}
        </QueryClientProvider>
      </StyledThemeProvider>
    </NextThemeProvider>
  );
}

export default MyApp;
