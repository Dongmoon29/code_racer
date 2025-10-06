'use client';

import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  FC,
} from 'react';

interface FullscreenContextType {
  isFullscreen: boolean;
  setIsFullscreen: (value: boolean) => void;
}

const FullscreenContext = createContext<FullscreenContextType | undefined>(
  undefined
);

export const FullscreenProvider: FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  return (
    <FullscreenContext.Provider value={{ isFullscreen, setIsFullscreen }}>
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
