'use client';

import { useState, useCallback, useEffect, useRef } from 'react';

interface UseLaserPointerOptions {
  isActive: boolean;
  color?: string;
  size?: number;
  smoothing?: number; // 0-1, higher = smoother but more lag
}

interface UseLaserPointerReturn {
  position: { x: number; y: number } | null;
  handleMouseMove: (e: React.MouseEvent) => void;
  handleTouchMove: (e: React.TouchEvent) => void;
  reset: () => void;
}

/**
 * Laser pointer functionality hook
 * Provides smooth cursor tracking for presentation laser pointer
 */
export function useLaserPointer({
  isActive,
  color = '#14b8a6',
  size = 16,
  smoothing = 0.2,
}: UseLaserPointerOptions): UseLaserPointerReturn {
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const targetPositionRef = useRef<{ x: number; y: number } | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Smooth position animation
  useEffect(() => {
    if (!isActive || !targetPositionRef.current) {
      return;
    }

    const animate = () => {
      if (!targetPositionRef.current) return;

      setPosition((prev) => {
        if (!prev) return targetPositionRef.current;

        const dx = targetPositionRef.current.x - prev.x;
        const dy = targetPositionRef.current.y - prev.y;

        // Apply smoothing
        return {
          x: prev.x + dx * smoothing,
          y: prev.y + dy * smoothing,
        };
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isActive, smoothing]);

  // Mouse move handler
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isActive) return;

      targetPositionRef.current = {
        x: e.clientX,
        y: e.clientY,
      };
    },
    [isActive]
  );

  // Touch move handler
  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isActive || e.touches.length === 0) return;

      const touch = e.touches[0];
      targetPositionRef.current = {
        x: touch.clientX,
        y: touch.clientY,
      };
    },
    [isActive]
  );

  // Reset position
  const reset = useCallback(() => {
    setPosition(null);
    targetPositionRef.current = null;
  }, []);

  // Reset when deactivated
  useEffect(() => {
    if (!isActive) {
      reset();
    }
  }, [isActive, reset]);

  return {
    position,
    handleMouseMove,
    handleTouchMove,
    reset,
  };
}
