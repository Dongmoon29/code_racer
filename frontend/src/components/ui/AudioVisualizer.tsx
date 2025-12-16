import { useEffect, useRef, useState } from 'react';

interface AudioVisualizerProps {
  isPlaying: boolean;
  barCount?: number;
  color?: string;
}

// Helper function to normalize HSL color format for Canvas API
// Converts hsl(142 88% 22%) to hsl(142, 88%, 22%)
const normalizeHSLColor = (color: string): string => {
  // Match hsl/hsla with or without commas
  const hslMatch = color.match(/^(hsla?)\(([^)]+)\)$/i);
  if (hslMatch) {
    const [, type, values] = hslMatch;
    // Split by space or comma, filter empty strings
    const parts = values.split(/[\s,]+/).filter((p) => p.trim().length > 0);

    // If already has commas, return as-is
    if (values.includes(',')) {
      return color;
    }

    // Convert space-separated to comma-separated
    return `${type}(${parts.join(', ')})`;
  }
  return color;
};

// Helper function to resolve CSS variables to actual color values
const resolveCSSVariable = (cssVar: string): string => {
  if (typeof window === 'undefined') return '#6366f1'; // Default fallback

  // Check if it's a CSS variable
  if (cssVar.includes('var(')) {
    // Extract variable name
    const match = cssVar.match(/var\((--[^)]+)\)/);
    if (match) {
      const varName = match[1];
      // Get computed style from document root
      const root = document.documentElement;
      const computedValue = getComputedStyle(root)
        .getPropertyValue(varName)
        .trim();

      // Normalize HSL format if needed
      if (computedValue.startsWith('hsl')) {
        return normalizeHSLColor(computedValue);
      }
      // If it's just numbers (HSL without hsl()), wrap it
      if (/^\d+\s+\d+%\s+\d+%$/.test(computedValue)) {
        return normalizeHSLColor(`hsl(${computedValue})`);
      }
      return computedValue || '#6366f1';
    }
  }

  // Normalize HSL format if it's already an HSL color
  if (cssVar.startsWith('hsl')) {
    return normalizeHSLColor(cssVar);
  }

  // Return as-is if not a CSS variable
  return cssVar;
};

export function AudioVisualizer({
  isPlaying,
  barCount = 20,
  color = 'hsl(var(--primary))',
}: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const barHeightsRef = useRef<number[]>(Array(barCount).fill(0.3));
  const targetHeightsRef = useRef<number[]>(Array(barCount).fill(0.3));
  const lastUpdateTimeRef = useRef<number>(0);
  const [resolvedColor, setResolvedColor] = useState<string>('#6366f1');

  // Resolve CSS variable to actual color value
  useEffect(() => {
    const resolved = resolveCSSVariable(color);
    setResolvedColor(resolved);
  }, [color]);

  useEffect(() => {
    if (!isPlaying) {
      // Clear canvas when paused
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const barWidth = width / barCount;
    const gap = barWidth * 0.2;

    const animate = (currentTime: number) => {
      if (!isPlaying) return;

      // Update target heights less frequently (every ~150ms)
      if (currentTime - lastUpdateTimeRef.current > 150) {
        targetHeightsRef.current = Array.from({ length: barCount }, () => {
          return Math.random() * 0.8 + 0.2;
        });
        lastUpdateTimeRef.current = currentTime;
      }

      // Smooth interpolation between current and target heights
      const smoothingFactor = 0.15; // Lower = slower animation
      barHeightsRef.current = barHeightsRef.current.map((current, index) => {
        const target = targetHeightsRef.current[index];
        return current + (target - current) * smoothingFactor;
      });

      ctx.clearRect(0, 0, width, height);

      // Draw bars with animated heights
      barHeightsRef.current.forEach((heightRatio, index) => {
        const barHeight = heightRatio * height * 0.9;
        const x = index * barWidth + gap / 2;
        const y = (height - barHeight) / 2;

        // Create gradient for each bar
        const gradient = ctx.createLinearGradient(x, y, x, y + barHeight);
        gradient.addColorStop(0, resolvedColor);
        gradient.addColorStop(0.5, resolvedColor);
        // Add opacity for bottom stop
        let colorWithOpacity = resolvedColor;
        if (
          resolvedColor.startsWith('hsl(') &&
          !resolvedColor.includes('hsla')
        ) {
          // Convert hsl to hsla for opacity - ensure comma format
          const normalized = normalizeHSLColor(resolvedColor);
          colorWithOpacity = normalized
            .replace('hsl(', 'hsla(')
            .replace(')', ', 0.5)');
        } else if (
          resolvedColor.startsWith('rgb(') &&
          !resolvedColor.includes('rgba')
        ) {
          // Convert rgb to rgba for opacity
          colorWithOpacity = resolvedColor
            .replace('rgb(', 'rgba(')
            .replace(')', ', 0.5)');
        } else if (resolvedColor.startsWith('#')) {
          // For hex colors, convert to rgba
          const hex = resolvedColor.replace('#', '');
          const r = parseInt(hex.substring(0, 2), 16);
          const g = parseInt(hex.substring(2, 4), 16);
          const b = parseInt(hex.substring(4, 6), 16);
          colorWithOpacity = `rgba(${r}, ${g}, ${b}, 0.5)`;
        } else if (resolvedColor.startsWith('hsla(')) {
          // Already hsla, just ensure it's normalized
          colorWithOpacity = normalizeHSLColor(resolvedColor);
        }
        gradient.addColorStop(1, colorWithOpacity);

        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, barWidth - gap, barHeight);
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    // Initialize with current time
    lastUpdateTimeRef.current = performance.now();
    animate(performance.now());

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, barCount, resolvedColor]);

  return (
    <canvas
      ref={canvasRef}
      width={200}
      height={40}
      className="w-full h-10 rounded-md"
      style={{ background: 'transparent' }}
    />
  );
}
