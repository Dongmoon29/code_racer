import React, { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Header from './Header';

interface LayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
  requireAuth?: boolean;
}

const Layout: React.FC<LayoutProps> = ({
  children,
  title = 'Code Racer',
  description = 'Real-time coding competitions',
  requireAuth = false,
}) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  // 인증 상태 확인
  useEffect(() => {
    if (requireAuth) {
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token');
        if (!token) {
          router.push(`/login?redirect=${encodeURIComponent(router.asPath)}`);
        } else {
          setIsLoading(false);
        }
      }
    } else {
      setIsLoading(false);
    }
  }, [requireAuth, router]);

  if (isLoading && requireAuth) {
    return (
      <>
        <Head>
          <title>{title}</title>
          <meta name="description" content={description} />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link rel="icon" href="/favicon.ico" />
        </Head>
        <div className="min-h-screen flex justify-center items-center bg-gray-100">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* ✅ flex-col을 사용하여 Footer를 하단 고정 */}
      <div className="flex flex-col min-h-screen bg-[color:hsl(var(--background))]">
        <Header />

        {/* ✅ flex-grow 추가: 이 영역이 남는 공간을 차지하게 함 */}
        <main className="flex w-full mx-auto py-4 justify-center">
          {children}
        </main>

        {/* ✅ Footer는 항상 하단에 위치 */}
        <footer className="bg-white dark:bg-[color:hsl(var(--background))] py-6">
          <div className="max-w-7xl mx-auto px-4 text-center text-gray-500">
            <p>© {new Date().getFullYear()} Code Racer</p>
          </div>
        </footer>
      </div>
    </>
  );
};

export default Layout;
