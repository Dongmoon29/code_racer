import React from 'react';
import Head from 'next/head';
import Header from './Header';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
}

const Layout: React.FC<LayoutProps> = ({
  children,
  title = 'Code Racer',
  description = 'Real-time coding competitions',
}) => {
  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
      </Head>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">{children}</main>
      </div>
    </>
  );
};

export default Layout;
