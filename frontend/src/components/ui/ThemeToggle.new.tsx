'use client';

import React, { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';
import {
  ThemeToggleButton,
  IconContainer,
  SunIcon,
  MoonIcon,
  ThemeToggleWithRipple,
  ThemeToggleWithBorder,
  ThemeToggleWithBackground,
  ThemeToggleGroup,
  ThemeOption,
} from './ThemeToggle.styled';

export interface ThemeToggleProps {
  variant?: 'default' | 'ripple' | 'border' | 'background';
  size?: 'sm' | 'md' | 'lg';
  showLabels?: boolean;
  className?: string;
}

export interface ThemeToggleGroupProps {
  themes?: ('light' | 'dark' | 'system')[];
  showLabels?: boolean;
  className?: string;
}

// Basic theme toggle
export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  variant = 'default',
  // size = 'md', // Not implemented yet
  showLabels = false,
  className,
}) => {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const isDark = theme === 'dark';

  const renderToggleButton = () => {
    const baseProps = {
      onClick: toggleTheme,
      'aria-label': 'Toggle theme',
      className,
    };

    switch (variant) {
      case 'ripple':
        return (
          <ThemeToggleWithRipple {...baseProps}>
            <IconContainer>
              <SunIcon isActive={!isDark}>
                <Sun size={20} />
              </SunIcon>
              <MoonIcon isActive={isDark}>
                <Moon size={20} />
              </MoonIcon>
            </IconContainer>
          </ThemeToggleWithRipple>
        );

      case 'border':
        return (
          <ThemeToggleWithBorder {...baseProps}>
            <IconContainer>
              <SunIcon isActive={!isDark}>
                <Sun size={20} />
              </SunIcon>
              <MoonIcon isActive={isDark}>
                <Moon size={20} />
              </MoonIcon>
            </IconContainer>
          </ThemeToggleWithBorder>
        );

      case 'background':
        return (
          <ThemeToggleWithBackground {...baseProps}>
            <IconContainer>
              <SunIcon isActive={!isDark}>
                <Sun size={20} />
              </SunIcon>
              <MoonIcon isActive={isDark}>
                <Moon size={20} />
              </MoonIcon>
            </IconContainer>
          </ThemeToggleWithBackground>
        );

      default:
        return (
          <ThemeToggleButton {...baseProps}>
            <IconContainer>
              <SunIcon isActive={!isDark}>
                <Sun size={20} />
              </SunIcon>
              <MoonIcon isActive={isDark}>
                <Moon size={20} />
              </MoonIcon>
            </IconContainer>
          </ThemeToggleButton>
        );
    }
  };

  return (
    <div>
      {renderToggleButton()}
      {showLabels && (
        <div
          style={{
            fontSize: '0.75rem',
            textAlign: 'center',
            marginTop: '0.25rem',
          }}
        >
          {isDark ? 'Dark' : 'Light'}
        </div>
      )}
    </div>
  );
};

// Theme toggle group with multiple options
export const ThemeToggleGroupComponent: React.FC<ThemeToggleGroupProps> = ({
  themes = ['light', 'dark', 'system'],
  showLabels = true,
  className,
}) => {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const getThemeIcon = (themeName: string) => {
    switch (themeName) {
      case 'light':
        return <Sun size={16} />;
      case 'dark':
        return <Moon size={16} />;
      case 'system':
        return <span style={{ fontSize: '14px' }}>💻</span>;
      default:
        return null;
    }
  };

  return (
    <ThemeToggleGroup className={className}>
      {themes.map((themeName) => (
        <ThemeOption
          key={themeName}
          isActive={theme === themeName}
          onClick={() => setTheme(themeName)}
          aria-label={`Switch to ${themeName} theme`}
        >
          {getThemeIcon(themeName)}
          {showLabels && (
            <span style={{ fontSize: '0.75rem', marginLeft: '0.25rem' }}>
              {themeName.charAt(0).toUpperCase() + themeName.slice(1)}
            </span>
          )}
        </ThemeOption>
      ))}
    </ThemeToggleGroup>
  );
};

// Named exports
export {
  ThemeToggleButton,
  IconContainer,
  SunIcon,
  MoonIcon,
  ThemeToggleWithRipple,
  ThemeToggleWithBorder,
  ThemeToggleWithBackground,
  ThemeToggleGroup,
  ThemeOption,
};

// Default export
export default ThemeToggle;
