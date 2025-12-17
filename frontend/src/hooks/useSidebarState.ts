import { useEffect, useState } from 'react';

const STORAGE_KEY = 'dashboard-sidebar-collapsed';
const MOBILE_BREAKPOINT = 768; // px

// 초기 상태를 localStorage에서 읽어오는 함수
function getInitialState(): boolean {
  if (typeof window === 'undefined') {
    return false; // SSR에서는 기본값 false
  }

  // 모바일 뷰포트에서는 항상 접힌 상태를 기본값으로 사용
  if (window.innerWidth < MOBILE_BREAKPOINT) {
    return true;
  }

  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === 'true';
}

export function useSidebarState() {
  const [isCollapsed, setIsCollapsed] = useState(getInitialState);
  const [isMobile, setIsMobile] = useState(false);

  // 뷰포트 크기를 감지해서 모바일 여부를 업데이트
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateIsMobile = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };

    updateIsMobile();
    window.addEventListener('resize', updateIsMobile);

    return () => {
      window.removeEventListener('resize', updateIsMobile);
    };
  }, []);

  // 모바일에서는 사이드바를 항상 접힌 상태로 강제
  useEffect(() => {
    if (isMobile && !isCollapsed) {
      setIsCollapsed(true);
    }
  }, [isMobile, isCollapsed]);

  const toggleSidebar = () => {
    // 모바일에서는 항상 접힌 상태를 유지하므로 토글을 막는다
    if (isMobile) {
      return;
    }

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
