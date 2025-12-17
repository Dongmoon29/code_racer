import { useState, useEffect } from 'react';
import { AppProps } from 'next/app';
import { ThemeProvider as NextThemeProvider, useTheme as useNextTheme } from 'next-themes';
import { Theme } from '@radix-ui/themes';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { Analytics } from '@vercel/analytics/react';
import AdminLayout from '../components/layout/AdminLayout';
import '@radix-ui/themes/styles.css';
import '../styles/globals.css';
import { useAuthStore } from '../stores/authStore';
import { FullscreenProvider } from '../contexts/FullscreenContext';
import { LofiPlayerProvider } from '../contexts/LofiPlayerContext';

// Wrapper component to sync Radix Theme with next-themes
function RadixThemeWrapper({ children }: { children: React.ReactNode }) {
  const { theme, systemTheme } = useNextTheme();
  const radixTheme = theme === 'system' ? (systemTheme || 'dark') : theme || 'dark';

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
    <NextThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <RadixThemeWrapper>
        <QueryClientProvider client={queryClient}>
          <FullscreenProvider>
            <LofiPlayerProvider>
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
            </LofiPlayerProvider>
          </FullscreenProvider>
        </QueryClientProvider>
        <Analytics />
      </RadixThemeWrapper>
    </NextThemeProvider>
  );
}

export default MyApp;
