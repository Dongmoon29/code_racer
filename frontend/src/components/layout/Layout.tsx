import React from 'react';
import { Footer } from './Footer';
import Header from './Header';
import { Contributor } from './Contributors';

interface LayoutProps {
  children: React.ReactNode;
  title: string;
  description: string;
  contributors: Contributor[];
}

const Layout: React.FC<LayoutProps> = ({ children, contributors }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow">{children}</main>
      <Footer contributors={contributors} />
    </div>
  );
};

export default Layout;
