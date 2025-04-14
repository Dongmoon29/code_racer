import React from 'react';
import { AppProps } from 'next/app';
import { ThemeProvider } from 'next-themes';
import '../styles/globals.css';
import { useAuthStore } from '../stores/authStore';
import { useEffect } from 'react';

function MyApp({ Component, pageProps }: AppProps) {
  const { initializeAuth } = useAuthStore();

  useEffect(() => {
    initializeAuth();
  }, []);

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <Component {...pageProps} />
    </ThemeProvider>
  );
}

export default MyApp;
