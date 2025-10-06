import { useMemo } from 'react';

interface SplitConfig {
  sizes: number[];
  minSize: number;
  gutterSize: number;
  snapOffset: number;
  dragInterval: number;
  cursor: string;
  gutter: (index: number, direction: string) => HTMLElement;
}

export const useSplitConfig = (
  maximizedEditor: 'my' | 'opponent' | null,
  currentSizes: number[],
  gutterSize: number = 6
): SplitConfig => {
  const sizes = useMemo(() => {
    if (maximizedEditor === 'my') return [100, 0];
    if (maximizedEditor === 'opponent') return [0, 100];
    return currentSizes;
  }, [maximizedEditor, currentSizes]);

  const gutter = useMemo(
    () => (index: number, dir: string) => {
      const g = document.createElement('div');
      g.className = `gutter gutter-${dir}`;
      g.style.cursor = dir === 'horizontal' ? 'col-resize' : 'row-resize';
      if (dir === 'horizontal') {
        g.style.width = `${gutterSize}px`;
      }
      g.style.background = 'transparent';
      g.style.zIndex = '10';
      return g;
    },
    [gutterSize]
  );

  return {
    sizes,
    minSize: 0,
    gutterSize,
    snapOffset: 0,
    dragInterval: 1,
    cursor: 'col-resize',
    gutter,
  };
};
