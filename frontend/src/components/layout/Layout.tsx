'use client';

import React from 'react';
import Head from 'next/head';
import Header from './Header';
import { Contributor } from './Contributors';
import { useFullscreen } from '@/contexts/FullscreenContext';

interface LayoutProps {
  children: React.ReactNode;
  title: string;
  description: string;
  contributors?: Contributor[];
}

const Layout: React.FC<LayoutProps> = ({ children, title, description }) => {
  const { isFullscreen } = useFullscreen();

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="min-h-screen flex flex-col">
        {!isFullscreen && <Header />}
        <main className="flex-grow">{children}</main>
      </div>
    </>
  );
};

export default Layout;
