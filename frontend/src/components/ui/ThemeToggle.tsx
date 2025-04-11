'use client';

import React from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';

export const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();

  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="relative w-10 h-10 rounded-md hover:bg-muted transition-colors focus:outline-none cursor-pointer"
      aria-label="Toggle theme"
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <Sun
          className={`absolute h-5 w-5 transition-all duration-300 
            ${
              theme === 'dark'
                ? 'scale-0 rotate-[-90deg] opacity-0'
                : 'scale-100 rotate-0 opacity-100'
            } text-red-400`}
        />
        <Moon
          className={` absolute h-5 w-5 transition-all duration-300
            ${
              theme === 'dark'
                ? 'scale-100 rotate-0 opacity-100'
                : 'scale-0 rotate-[90deg] opacity-0'
            } text-yellow-400`}
        />
      </div>
    </button>
  );
};
