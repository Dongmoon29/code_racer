import React from 'react';
import { AppProps } from 'next/app';
import { ThemeProvider as NextThemeProvider } from 'next-themes';
import { ThemeProvider as StyledThemeProvider } from 'styled-components';
import '../styles/globals.css';
import { useAuthStore } from '../stores/authStore';
import { useEffect } from 'react';
import { theme } from '../lib/theme';

function MyApp({ Component, pageProps }: AppProps) {
  const { initializeAuth } = useAuthStore();

  useEffect(() => {
    initializeAuth();
  }, []);

  return (
    <NextThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <StyledThemeProvider theme={theme}>
        <Component {...pageProps} />
      </StyledThemeProvider>
    </NextThemeProvider>
  );
}

export default MyApp;
