/**
 * Media Query Hooks for Responsive Design
 *
 * These hooks provide reactive breakpoint detection for responsive components.
 * They match Tailwind's default breakpoints.
 *
 * Usage:
 * import { useMediaQuery, useBreakpoint } from '@/hooks/use-media-query';
 *
 * // Single query
 * const isMobile = useMediaQuery('(max-width: 639px)');
 *
 * // Breakpoint helpers
 * const { isSm, isMd, isLg, isXl, is2xl } = useBreakpoint();
 */

import { useState, useEffect, useCallback } from "react";

/**
 * Tailwind CSS breakpoints (min-width)
 */
export const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

export type Breakpoint = keyof typeof breakpoints;

/**
 * Hook to check if a media query matches.
 *
 * @param query - CSS media query string
 * @returns boolean indicating if the query matches
 *
 * @example
 * const isMobile = useMediaQuery('(max-width: 639px)');
 * const prefersDark = useMediaQuery('(prefers-color-scheme: dark)');
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    // Check if window is available (SSR safety)
    if (typeof window === 'undefined') {
      return;
    }

    const media = window.matchMedia(query);

    // Set initial value
    setMatches(media.matches);

    // Define listener
    const listener = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Add listener (using addEventListener for modern browsers)
    media.addEventListener('change', listener);

    // Cleanup
    return () => {
      media.removeEventListener('change', listener);
    };
  }, [query]);

  return matches;
}

/**
 * Hook to detect if viewport is at least a specific breakpoint.
 *
 * @param breakpoint - Tailwind breakpoint name
 * @returns boolean indicating if viewport is at or above the breakpoint
 *
 * @example
 * const isDesktop = useMinBreakpoint('lg');
 */
export function useMinBreakpoint(breakpoint: Breakpoint): boolean {
  const minWidth = breakpoints[breakpoint];
  return useMediaQuery(`(min-width: ${minWidth}px)`);
}

/**
 * Hook to detect if viewport is below a specific breakpoint.
 *
 * @param breakpoint - Tailwind breakpoint name
 * @returns boolean indicating if viewport is below the breakpoint
 *
 * @example
 * const isMobile = useMaxBreakpoint('sm'); // Below 640px
 */
export function useMaxBreakpoint(breakpoint: Breakpoint): boolean {
  const minWidth = breakpoints[breakpoint];
  return useMediaQuery(`(max-width: ${minWidth - 1}px)`);
}

/**
 * Hook that returns an object with all breakpoint states.
 *
 * @returns Object with boolean states for each breakpoint
 *
 * @example
 * const { isSm, isMd, isLg, isXl, is2xl } = useBreakpoint();
 *
 * if (isLg) {
 *   // Render desktop layout
 * }
 */
export function useBreakpoint() {
  const isSm = useMinBreakpoint('sm');
  const isMd = useMinBreakpoint('md');
  const isLg = useMinBreakpoint('lg');
  const isXl = useMinBreakpoint('xl');
  const is2xl = useMinBreakpoint('2xl');

  return {
    /** At least 640px */
    isSm,
    /** At least 768px */
    isMd,
    /** At least 1024px */
    isLg,
    /** At least 1280px */
    isXl,
    /** At least 1536px */
    is2xl,
    /** Below 640px (mobile) */
    isMobile: !isSm,
    /** Below 768px */
    isTablet: isSm && !isMd,
    /** At least 1024px */
    isDesktop: isLg,
  };
}

/**
 * Hook that returns the current active breakpoint name.
 *
 * @returns The name of the current breakpoint, or 'base' if below sm
 *
 * @example
 * const current = useCurrentBreakpoint(); // 'md', 'lg', etc.
 */
export function useCurrentBreakpoint(): Breakpoint | 'base' {
  const isSm = useMinBreakpoint('sm');
  const isMd = useMinBreakpoint('md');
  const isLg = useMinBreakpoint('lg');
  const isXl = useMinBreakpoint('xl');
  const is2xl = useMinBreakpoint('2xl');

  if (is2xl) return '2xl';
  if (isXl) return 'xl';
  if (isLg) return 'lg';
  if (isMd) return 'md';
  if (isSm) return 'sm';
  return 'base';
}

/**
 * Hook for responsive value selection.
 * Returns different values based on the current breakpoint.
 *
 * @param values - Object mapping breakpoints to values
 * @param defaultValue - Default value when no breakpoint matches
 * @returns The value for the current breakpoint
 *
 * @example
 * const columns = useResponsiveValue({
 *   base: 1,
 *   sm: 2,
 *   lg: 3,
 *   xl: 4,
 * }, 1);
 */
export function useResponsiveValue<T>(
  values: Partial<Record<Breakpoint | 'base', T>>,
  defaultValue: T
): T {
  const isSm = useMinBreakpoint('sm');
  const isMd = useMinBreakpoint('md');
  const isLg = useMinBreakpoint('lg');
  const isXl = useMinBreakpoint('xl');
  const is2xl = useMinBreakpoint('2xl');

  // Check from largest to smallest
  if (is2xl && values['2xl'] !== undefined) return values['2xl'];
  if (isXl && values.xl !== undefined) return values.xl;
  if (isLg && values.lg !== undefined) return values.lg;
  if (isMd && values.md !== undefined) return values.md;
  if (isSm && values.sm !== undefined) return values.sm;
  if (values.base !== undefined) return values.base;

  return defaultValue;
}

/**
 * Hook to detect user's color scheme preference.
 *
 * @returns 'dark' | 'light' | 'no-preference'
 */
export function useColorScheme(): 'dark' | 'light' | 'no-preference' {
  const isDark = useMediaQuery('(prefers-color-scheme: dark)');
  const isLight = useMediaQuery('(prefers-color-scheme: light)');

  if (isDark) return 'dark';
  if (isLight) return 'light';
  return 'no-preference';
}

/**
 * Hook to detect if user prefers reduced motion.
 * Useful for accessibility - disable animations if true.
 *
 * @returns boolean indicating if user prefers reduced motion
 *
 * @example
 * const prefersReducedMotion = usePrefersReducedMotion();
 * const animation = prefersReducedMotion ? undefined : 'fade-in';
 */
export function usePrefersReducedMotion(): boolean {
  return useMediaQuery('(prefers-reduced-motion: reduce)');
}

/**
 * Hook to detect touch device capability.
 *
 * @returns boolean indicating if device supports touch
 */
export function useTouchDevice(): boolean {
  return useMediaQuery('(pointer: coarse)');
}

/**
 * Hook to detect if device is in portrait orientation.
 *
 * @returns boolean indicating portrait orientation
 */
export function useIsPortrait(): boolean {
  return useMediaQuery('(orientation: portrait)');
}