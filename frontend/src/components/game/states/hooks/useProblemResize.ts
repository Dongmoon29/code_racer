import { useState, useCallback, useRef } from 'react';

interface UseLeetCodeResizeProps {
  initialSizes: number[];
  onSizesChange: (sizes: number[]) => void;
  minSize?: number;
  maxSize?: number;
}

export const useLeetCodeResize = ({
  initialSizes,
  onSizesChange,
  minSize = 20,
  maxSize = 80,
}: UseLeetCodeResizeProps) => {
  const [sizes, setSizes] = useState<number[]>(initialSizes);
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleResize = useCallback(
    (deltaX: number) => {
      if (!containerRef.current) return;

      const containerWidth = containerRef.current.offsetWidth;
      const deltaPercent = (deltaX / containerWidth) * 100;

      setSizes((prevSizes) => {
        const newSizes = [...prevSizes];
        const leftSize = newSizes[0] + deltaPercent;

        if (leftSize < minSize || leftSize > maxSize) {
          return prevSizes;
        }

        newSizes[0] = Math.max(minSize, Math.min(maxSize, leftSize));
        newSizes[1] = 100 - newSizes[0];

        return newSizes;
      });
    },
    [minSize, maxSize]
  );

  const handleResizeStart = useCallback(() => {
    setIsResizing(true);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, []);

  const handleResizeEnd = useCallback(() => {
    setIsResizing(false);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';

    setSizes((currentSizes) => {
      onSizesChange(currentSizes);
      return currentSizes;
    });
  }, [onSizesChange]);

  const resetSizes = useCallback(() => {
    const resetSizes = [50, 50];
    setSizes(resetSizes);
    onSizesChange(resetSizes);
  }, [onSizesChange]);

  return {
    sizes,
    isResizing,
    containerRef,
    handleResize,
    handleResizeStart,
    handleResizeEnd,
    resetSizes,
  };
};
