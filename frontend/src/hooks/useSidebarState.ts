import { useState } from 'react';

const STORAGE_KEY = 'dashboard-sidebar-collapsed';

// 초기 상태를 localStorage에서 읽어오는 함수
function getInitialState(): boolean {
  if (typeof window === 'undefined') {
    return false; // SSR에서는 기본값 false
  }
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === 'true';
}

export function useSidebarState() {
  const [isCollapsed, setIsCollapsed] = useState(getInitialState);

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
