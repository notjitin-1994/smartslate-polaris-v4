/**
 * Mobile detection hook for optimizing performance on touch devices
 */

'use client';

import { useState, useEffect } from 'react';

interface MobileDetectResult {
  isMobile: boolean;
  isTablet: boolean;
  isIOS: boolean;
  isIPad: boolean;
  isTouchDevice: boolean;
  shouldReduceAnimations: boolean;
}

export function useMobileDetect(): MobileDetectResult {
  const [result, setResult] = useState<MobileDetectResult>({
    isMobile: false,
    isTablet: false,
    isIOS: false,
    isIPad: false,
    isTouchDevice: false,
    shouldReduceAnimations: false,
  });

  useEffect(() => {
    const checkDevice = () => {
      const ua = navigator.userAgent;
      const isIOS = /iPad|iPhone|iPod/.test(ua);
      const isIPad =
        /iPad/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      const isMobile = /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
      const isTablet = /iPad|Android(?!.*Mobile)/i.test(ua) || isIPad;
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

      // Reduce animations on mobile, tablets, iOS devices, or when user prefers reduced motion
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const shouldReduceAnimations =
        isMobile || isTablet || isIOS || isIPad || isTouchDevice || prefersReducedMotion;

      setResult({
        isMobile,
        isTablet,
        isIOS,
        isIPad,
        isTouchDevice,
        shouldReduceAnimations,
      });
    };

    checkDevice();

    // Re-check on resize (for orientation changes)
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  return result;
}
