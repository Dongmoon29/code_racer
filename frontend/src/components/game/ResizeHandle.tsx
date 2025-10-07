import React, { useState, useRef, useCallback } from 'react';

interface ResizeHandleProps {
  onResize: (deltaX: number) => void;
  onResizeStart?: () => void;
  onResizeEnd?: () => void;
  className?: string;
  disabled?: boolean;
}

export const ResizeHandle: React.FC<ResizeHandleProps> = ({
  onResize,
  onResizeStart,
  onResizeEnd,
  className = '',
  disabled = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const startXRef = useRef<number>(0);
  const lastXRef = useRef<number>(0);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (disabled) return;

      e.preventDefault();
      setIsDragging(true);
      startXRef.current = e.clientX;
      lastXRef.current = e.clientX;
      onResizeStart?.();

      const handleMouseMove = (e: MouseEvent) => {
        const deltaX = e.clientX - lastXRef.current;
        onResize(deltaX);
        lastXRef.current = e.clientX;
      };

      const handleMouseUp = () => {
        setIsDragging(false);
        onResizeEnd?.();
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [disabled, onResize, onResizeStart, onResizeEnd]
  );

  return (
    <div
      className={`
        relative flex items-center justify-center cursor-col-resize
        w-1 h-full bg-transparent hover:bg-blue-500/20
        transition-colors duration-200 group
        ${isDragging ? 'bg-blue-500/40' : ''}
        ${disabled ? 'cursor-default opacity-50' : ''}
        ${className}
      `}
      onMouseDown={handleMouseDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`
          w-0.5 h-full bg-gray-400/60
          group-hover:bg-blue-500/80
          transition-colors duration-200
          ${isDragging ? 'bg-blue-500' : ''}
          ${isHovered ? 'w-1' : ''}
        `}
      />

      {isDragging && (
        <div className="absolute inset-0 w-2 bg-blue-500/20 -mx-0.5" />
      )}

      {isHovered && !isDragging && (
        <div className="absolute inset-0 w-1 bg-blue-500/30 -mx-0.5" />
      )}
    </div>
  );
};
