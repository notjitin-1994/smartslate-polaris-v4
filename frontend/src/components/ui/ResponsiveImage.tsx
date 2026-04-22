'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { useResponsiveContent } from '@/lib/hooks/useResponsiveContent';
import { useIntersectionObserver } from '@/lib/hooks/useIntersectionObserver';

export interface ResponsiveImageProps
  extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src' | 'srcSet' | 'sizes'> {
  /**
   * Base image source URL
   */
  src: string;

  /**
   * Alternative text for accessibility
   */
  alt: string;

  /**
   * Image width in pixels
   */
  width?: number;

  /**
   * Image height in pixels
   */
  height?: number;

  /**
   * Responsive sizes attribute
   */
  sizes?: string;

  /**
   * Whether to enable lazy loading
   */
  lazy?: boolean;

  /**
   * Placeholder blur data URL for instant loading feedback
   */
  placeholder?: string;

  /**
   * Priority for preloading (high, low, auto)
   */
  priority?: 'high' | 'low' | 'auto';

  /**
   * Additional CSS classes
   */
  className?: string;

  /**
   * Test ID for testing purposes
   */
  'data-testid'?: string;
}

/**
 * Responsive image component with automatic density-aware serving and lazy loading
 */
export function ResponsiveImage({
  src,
  alt,
  width,
  height,
  sizes,
  lazy = true,
  placeholder,
  priority = 'auto',
  className,
  'data-testid': testId = 'responsive-image',
  ...props
}: ResponsiveImageProps) {
  const responsive = useResponsiveContent();
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [hasError, setHasError] = React.useState(false);

  // Intersection observer for lazy loading
  const { ref: intersectionRef, inView } = useIntersectionObserver({
    threshold: 0.1,
    rootMargin: '50px',
  });

  // Type assertion for the ref to match div element type
  const divRef = intersectionRef as React.RefObject<HTMLDivElement>;

  // Generate responsive srcset based on device pixel ratio
  const srcset = React.useMemo(() => {
    if (!src) return undefined;

    const devicePixelRatio = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    const densities = [1, 2, 3];

    return densities
      .map((density) => {
        if (devicePixelRatio < density) return null;
        return `${generateImageUrl(src, { w: width ? width * density : undefined, q: 85 })} ${density}x`;
      })
      .filter(Boolean)
      .join(', ');
  }, [src, width]);

  // Generate responsive sizes
  const responsiveSizes = React.useMemo(() => {
    if (sizes) return sizes;

    // Default responsive sizes based on breakpoint
    switch (responsive.breakpoint) {
      case 'mobile-compact':
        return '100vw';
      case 'mobile-expanded':
        return '100vw';
      case 'tablet':
        return '50vw';
      case 'desktop':
      default:
        return '33vw';
    }
  }, [sizes, responsive.breakpoint]);

  // Handle image load
  const handleLoad = React.useCallback(() => {
    setIsLoaded(true);
  }, []);

  // Handle image error
  const handleError = React.useCallback(() => {
    setHasError(true);
  }, []);

  // Determine if image should be loaded (for lazy loading)
  const shouldLoad = !lazy || inView;

  // Preload priority images
  React.useEffect(() => {
    if (priority === 'high' && shouldLoad && src) {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = src;
      document.head.appendChild(link);

      return () => {
        document.head.removeChild(link);
      };
    }
    return undefined;
  }, [priority, shouldLoad, src]);

  if (hasError) {
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-lg border border-neutral-200 bg-neutral-100',
          className
        )}
        style={{ width, height }}
        data-testid={`${testId}-error`}
      >
        <svg
          className="h-8 w-8 text-neutral-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>
    );
  }

  return (
    <div ref={divRef} className={cn('relative overflow-hidden', className)} data-testid={testId}>
      {/* Placeholder */}
      {placeholder && !isLoaded && (
        <img
          src={placeholder}
          alt=""
          className="absolute inset-0 h-full w-full scale-110 object-cover blur-sm filter"
          aria-hidden="true"
        />
      )}

      {/* Main image */}
      {shouldLoad && (
        <img
          src={src}
          srcSet={srcset}
          sizes={responsiveSizes}
          alt={alt}
          width={width}
          height={height}
          loading={lazy ? 'lazy' : 'eager'}
          decoding="async"
          onLoad={handleLoad}
          onError={handleError}
          className={cn(
            'h-full w-full object-cover transition-opacity duration-300',
            isLoaded ? 'opacity-100' : 'opacity-0'
          )}
          {...props}
        />
      )}

      {/* Loading indicator */}
      {!isLoaded && shouldLoad && <div className="absolute inset-0 animate-pulse bg-neutral-100" />}
    </div>
  );
}

/**
 * Generate optimized image URL with parameters
 */
function generateImageUrl(
  baseUrl: string,
  options: { w?: number; h?: number; q?: number; f?: string }
): string {
  const params = new URLSearchParams();

  if (options.w) params.set('w', options.w.toString());
  if (options.h) params.set('h', options.h.toString());
  if (options.q) params.set('q', options.q.toString());
  if (options.f) params.set('f', options.f);

  const separator = baseUrl.includes('?') ? '&' : '?';
  return `${baseUrl}${separator}${params.toString()}`;
}
