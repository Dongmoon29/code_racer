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
        className="py-1 px-2 border border-[var(--gray-6)] rounded-sm text-sm bg-[var(--color-panel)] text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-9)] focus:border-[var(--accent-9)] disabled:opacity-50 transition-colors"
      >
        <option value="light">Light</option>
        <option value="dark">Dark</option>
        <option value="system">System</option>
      </select>
    </div>
  );
};

export default ThemeSelector;
