import React from 'react';
import { Contributor, Contributors } from './Contributors';
import { Github } from 'lucide-react';

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
            <div className="flex justify-center items-center mt-6 space-x-2 text-sm text-gray-500 dark:text-gray-400">
              <a
                href="https://github.com/Dongmoon29/code_racer"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                <Github className="w-4 h-4 mr-2" />
                View on GitHub
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
