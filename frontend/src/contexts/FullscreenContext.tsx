"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
  FC,
} from "react";

interface FullscreenContextType {
  isFullscreen: boolean;
  targetElement: HTMLElement | null;
  enterFullscreen: (element: HTMLElement) => Promise<void>;
  exitFullscreen: () => Promise<void>;
  toggleFullscreen: (element: HTMLElement) => Promise<void>;
}

interface VendorFullscreenDocument extends Document {
  webkitFullscreenElement?: Element | null;
  mozFullScreenElement?: Element | null;
  msFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
  mozCancelFullScreen?: () => Promise<void> | void;
  msExitFullscreen?: () => Promise<void> | void;
}

interface VendorFullscreenElement extends HTMLElement {
  webkitRequestFullscreen?: () => Promise<void> | void;
  mozRequestFullScreen?: () => Promise<void> | void;
  msRequestFullscreen?: () => Promise<void> | void;
}

function getFullscreenElement(): Element | null {
  const fullscreenDocument = document as VendorFullscreenDocument;
  return (
    document.fullscreenElement ??
    fullscreenDocument.webkitFullscreenElement ??
    fullscreenDocument.mozFullScreenElement ??
    fullscreenDocument.msFullscreenElement ??
    null
  );
}

const FullscreenContext = createContext<FullscreenContextType | undefined>(
  undefined,
);

export const FullscreenProvider: FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);

  // 전체 화면 상태 변경 감지
  useEffect(() => {
    const handleFullscreenChange = () => {
      const fullscreenElement = getFullscreenElement();

      setIsFullscreen(!!fullscreenElement);

      if (!fullscreenElement) {
        setTargetElement(null);
      }
    };

    // 모든 브라우저 이벤트 리스너 등록
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("mozfullscreenchange", handleFullscreenChange);
    document.addEventListener("MSFullscreenChange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener(
        "webkitfullscreenchange",
        handleFullscreenChange,
      );
      document.removeEventListener(
        "mozfullscreenchange",
        handleFullscreenChange,
      );
      document.removeEventListener(
        "MSFullscreenChange",
        handleFullscreenChange,
      );
    };
  }, []);

  // 전체 화면 진입
  const enterFullscreen = useCallback(async (element: HTMLElement) => {
    try {
      const fullscreenElement = element as VendorFullscreenElement;
      if (element.requestFullscreen) {
        await element.requestFullscreen();
      } else if (fullscreenElement.webkitRequestFullscreen) {
        await fullscreenElement.webkitRequestFullscreen();
      } else if (fullscreenElement.mozRequestFullScreen) {
        await fullscreenElement.mozRequestFullScreen();
      } else if (fullscreenElement.msRequestFullscreen) {
        await fullscreenElement.msRequestFullscreen();
      } else {
        throw new Error("Fullscreen API is not supported by this browser");
      }
      setTargetElement(element);
    } catch (err) {
      console.error("전체 화면 진입 실패:", err);
      throw err;
    }
  }, []);

  // 전체 화면 종료
  const exitFullscreen = useCallback(async () => {
    try {
      const fullscreenDocument = document as VendorFullscreenDocument;
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if (fullscreenDocument.webkitExitFullscreen) {
        await fullscreenDocument.webkitExitFullscreen();
      } else if (fullscreenDocument.mozCancelFullScreen) {
        await fullscreenDocument.mozCancelFullScreen();
      } else if (fullscreenDocument.msExitFullscreen) {
        await fullscreenDocument.msExitFullscreen();
      }
    } catch (err) {
      console.error("전체 화면 종료 실패:", err);
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
    [isFullscreen, enterFullscreen, exitFullscreen],
  );

  const value = useMemo(
    () => ({
      isFullscreen,
      targetElement,
      enterFullscreen,
      exitFullscreen,
      toggleFullscreen,
    }),
    [
      isFullscreen,
      targetElement,
      enterFullscreen,
      exitFullscreen,
      toggleFullscreen,
    ],
  );

  return (
    <FullscreenContext.Provider value={value}>
      {children}
    </FullscreenContext.Provider>
  );
};

export const useFullscreen = () => {
  const context = useContext(FullscreenContext);
  if (!context) {
    throw new Error("useFullscreen must be used within FullscreenProvider");
  }
  return context;
};
