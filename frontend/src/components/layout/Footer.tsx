import React from 'react';
import { Contributor, Contributors } from './Contributors';

interface FooterProps {
  contributors: Contributor[];
}

export const Footer: React.FC<FooterProps> = ({ contributors }) => {
  return (
    <footer className="mt-auto py-8 border-t border-gray-200 dark:border-gray-800">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-4">
            <Contributors contributors={contributors} />
          </div>
        </div>
      </div>
    </footer>
  );
};
