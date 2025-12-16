import { useState, useEffect } from 'react';

const STORAGE_KEY = 'dashboard-sidebar-collapsed';

export function useSidebarState() {
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'true') {
        setIsCollapsed(true);
      }
    }
  }, []);

  const toggleSidebar = () => {
    setIsCollapsed((prev) => {
      const newState = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, newState.toString());
      }
      return newState;
    });
  };

  return { isCollapsed, toggleSidebar };
}
