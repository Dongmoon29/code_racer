'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
  FC,
} from 'react';

interface FullscreenContextType {
  isFullscreen: boolean;
  targetElement: HTMLElement | null;
  enterFullscreen: (element: HTMLElement) => Promise<void>;
  exitFullscreen: () => Promise<void>;
  toggleFullscreen: (element: HTMLElement) => Promise<void>;
}

const FullscreenContext = createContext<FullscreenContextType | undefined>(
  undefined
);

export const FullscreenProvider: FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);

  // 전체 화면 상태 변경 감지
  useEffect(() => {
    const handleFullscreenChange = () => {
      const fullscreenElement =
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement;

      setIsFullscreen(!!fullscreenElement);

      if (!fullscreenElement) {
        setTargetElement(null);
      }
    };

    // 모든 브라우저 이벤트 리스너 등록
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener(
        'webkitfullscreenchange',
        handleFullscreenChange
      );
      document.removeEventListener(
        'mozfullscreenchange',
        handleFullscreenChange
      );
      document.removeEventListener(
        'MSFullscreenChange',
        handleFullscreenChange
      );
    };
  }, []);

  // 전체 화면 진입
  const enterFullscreen = useCallback(async (element: HTMLElement) => {
    try {
      if (element.requestFullscreen) {
        await element.requestFullscreen();
      } else if ((element as any).webkitRequestFullscreen) {
        // Safari
        await (element as any).webkitRequestFullscreen();
      } else if ((element as any).mozRequestFullScreen) {
        // Firefox
        await (element as any).mozRequestFullScreen();
      } else if ((element as any).msRequestFullscreen) {
        // IE11
        await (element as any).msRequestFullscreen();
      }
      setTargetElement(element);
    } catch (err) {
      console.error('전체 화면 진입 실패:', err);
      throw err;
    }
  }, []);

  // 전체 화면 종료
  const exitFullscreen = useCallback(async () => {
    try {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        await (document as any).webkitExitFullscreen();
      } else if ((document as any).mozCancelFullScreen) {
        await (document as any).mozCancelFullScreen();
      } else if ((document as any).msExitFullscreen) {
        await (document as any).msExitFullscreen();
      }
    } catch (err) {
      console.error('전체 화면 종료 실패:', err);
      throw err;
    }
  }, []);

  // 전체 화면 토글
  const toggleFullscreen = useCallback(
    async (element: HTMLElement) => {
      if (isFullscreen) {
        await exitFullscreen();
      } else {
        await enterFullscreen(element);
      }
    },
    [isFullscreen, enterFullscreen, exitFullscreen]
  );

  return (
    <FullscreenContext.Provider
      value={{
        isFullscreen,
        targetElement,
        enterFullscreen,
        exitFullscreen,
        toggleFullscreen,
      }}
    >
      {children}
    </FullscreenContext.Provider>
  );
};

export const useFullscreen = () => {
  const context = useContext(FullscreenContext);
  if (!context) {
    throw new Error('useFullscreen must be used within FullscreenProvider');
  }
  return context;
};
