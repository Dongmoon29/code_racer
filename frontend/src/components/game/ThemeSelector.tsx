import React from 'react';
import { useTheme } from 'next-themes';

interface ThemeSelectorProps {
  disabled?: boolean;
}

const ThemeSelector: React.FC<ThemeSelectorProps> = ({ disabled = false }) => {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center">
      <label htmlFor="theme-select" className="mr-2 text-sm font-medium">
        Theme:
      </label>
      <select
        id="theme-select"
        value={theme}
        onChange={(e) => setTheme(e.target.value)}
        disabled={disabled}
        className="py-1 px-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
      >
        <option value="light">Light</option>
        <option value="dark">Dark</option>
        <option value="system">System</option>
      </select>
    </div>
  );
};

export default ThemeSelector;
