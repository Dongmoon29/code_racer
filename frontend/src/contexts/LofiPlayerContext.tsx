'use client';

import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  FC,
} from 'react';

interface LofiPlayerContextType {
  showMusicPlayer: boolean;
  setShowMusicPlayer: (value: boolean) => void;
  isMusicPlaying: boolean;
  setIsMusicPlaying: (value: boolean) => void;
}

const LofiPlayerContext = createContext<LofiPlayerContextType | undefined>(
  undefined
);

export const LofiPlayerProvider: FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [showMusicPlayer, setShowMusicPlayer] = useState(false);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);

  return (
    <LofiPlayerContext.Provider
      value={{
        showMusicPlayer,
        setShowMusicPlayer,
        isMusicPlaying,
        setIsMusicPlaying,
      }}
    >
      {children}
    </LofiPlayerContext.Provider>
  );
};

export const useLofiPlayer = () => {
  const context = useContext(LofiPlayerContext);
  if (!context) {
    throw new Error('useLofiPlayer must be used within LofiPlayerProvider');
  }
  return context;
};

