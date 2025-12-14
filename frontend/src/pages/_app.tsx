import React, { useState, useEffect } from 'react';
import { AppProps } from 'next/app';
import { ThemeProvider as NextThemeProvider } from 'next-themes';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { Analytics } from '@vercel/analytics/react';
import AdminLayout from '../components/admin/AdminLayout';
import '../styles/globals.css';
import { useAuthStore } from '../stores/authStore';
import { FullscreenProvider } from '../contexts/FullscreenContext';

function MyApp({ Component, pageProps }: AppProps) {
  const { initializeAuth } = useAuthStore();
  const router = useRouter();
  const [queryClient] = useState(() => new QueryClient());

  useEffect(() => {
    initializeAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // SSR-safe route check to avoid hydration mismatch
  const isAdminRoute = router.pathname.startsWith('/admin');

  // Derive admin page title
  const adminTitle = (() => {
    const path = router.pathname;
    if (!path.startsWith('/admin')) return 'CRAdmin';
    if (path === '/admin') return 'CRAdmin | Overview';
    if (path.startsWith('/admin/users')) return 'CRAdmin | Users';
    if (path.startsWith('/admin/problems')) return 'CRAdmin | Problems';
    return 'CRAdmin';
  })();

  return (
    <NextThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <QueryClientProvider client={queryClient}>
        <FullscreenProvider>
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
        </FullscreenProvider>
      </QueryClientProvider>
      <Analytics />
    </NextThemeProvider>
  );
}

export default MyApp;
