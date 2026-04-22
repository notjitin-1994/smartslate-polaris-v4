'use client';

import { useState, useEffect } from 'react';

/**
 * Device type constants
 */
export type DeviceType = 'mobile' | 'tablet' | 'desktop';

/**
 * Hook to detect device type based on screen size
 * Returns the current device type and whether it's a non-desktop device
 */
export function useDeviceDetection() {
  const [deviceType, setDeviceType] = useState<DeviceType>('desktop');
  const [isNonDesktop, setIsNonDesktop] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);

    // Detect device on initial mount and window resize
    const detectDevice = () => {
      const width = window.innerWidth;

      // Mobile: < 768px (Tailwind md breakpoint)
      // Tablet: 768px - 1024px (Tailwind md to lg breakpoint)
      // Desktop: >= 1024px (Tailwind lg breakpoint)
      let detected: DeviceType;

      if (width < 768) {
        detected = 'mobile';
      } else if (width < 1024) {
        detected = 'tablet';
      } else {
        detected = 'desktop';
      }

      setDeviceType(detected);
      setIsNonDesktop(detected !== 'desktop');
    };

    // Initial detection
    detectDevice();

    // Listen for window resize
    const resizeListener = () => detectDevice();
    window.addEventListener('resize', resizeListener);

    return () => {
      window.removeEventListener('resize', resizeListener);
    };
  }, []);

  return {
    deviceType,
    isNonDesktop,
    isMounted,
    isDesktop: deviceType === 'desktop',
    isMobile: deviceType === 'mobile',
    isTablet: deviceType === 'tablet',
  };
}
