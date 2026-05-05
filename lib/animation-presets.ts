/**
 * Animation Presets for Scripture AI
 *
 * This module provides standardized animation values and presets
 * that should be used consistently across the application.
 *
 * Usage:
 * import { transitions, animations, durations, easings } from '@/lib/animation-presets';
 */

// Animation durations (matching CSS variables)
export const durations = {
  fast: 150,
  normal: 300,
  slow: 500,
} as const;

// Easing functions (matching CSS variables)
export const easings = {
  default: 'cubic-bezier(0.4, 0, 0.2, 1)',
  in: 'cubic-bezier(0.4, 0, 1, 1)',
  out: 'cubic-bezier(0, 0, 0.2, 1)',
  inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
} as const;

// Tailwind CSS class presets for transitions
export const transitions = {
  /** Fast transition for colors (150ms) */
  colorsFast: 'transition-colors duration-150 ease-default',
  /** Normal transition for colors (300ms) */
  colors: 'transition-colors duration-normal ease-default',
  /** Fast transition for all properties */
  allFast: 'transition-all duration-150 ease-default',
  /** Normal transition for all properties */
  all: 'transition-all duration-normal ease-default',
  /** Transform transition with spring easing */
  transform: 'transition-transform duration-normal ease-spring',
  /** Transform transition with spring easing (fast) */
  transformFast: 'transition-transform duration-150 ease-spring',
  /** Opacity transition */
  opacity: 'transition-opacity duration-150 ease-default',
  /** Shadow transition */
  shadow: 'transition-shadow duration-normal ease-default',
} as const;

// Tailwind CSS class presets for animations
export const animations = {
  fadeIn: 'animate-fade-in',
  fadeOut: 'animate-fade-out',
  slideUp: 'animate-slide-up',
  slideDown: 'animate-slide-down',
  slideLeft: 'animate-slide-left',
  slideRight: 'animate-slide-right',
  scaleIn: 'animate-scale-in',
  scaleOut: 'animate-scale-out',
  bounceIn: 'animate-bounce-in',
  spin: 'animate-spin',
  pulse: 'animate-pulse',
  shimmer: 'animate-shimmer',
} as const;

// Framer Motion variants for common animations
export const framerVariants = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  slideUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  },
  slideDown: {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 },
  },
  scaleIn: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
  },
  slideInFromRight: {
    initial: { opacity: 0, x: 100 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 100 },
  },
  slideInFromLeft: {
    initial: { opacity: 0, x: -100 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -100 },
  },
} as const;

// Framer Motion transition presets
export const framerTransitions = {
  fast: {
    duration: durations.fast / 1000,
    ease: easings.default,
  },
  normal: {
    duration: durations.normal / 1000,
    ease: easings.default,
  },
  slow: {
    duration: durations.slow / 1000,
    ease: easings.default,
  },
  spring: {
    type: 'spring' as const,
    stiffness: 300,
    damping: 20,
  },
  springBouncy: {
    type: 'spring' as const,
    stiffness: 400,
    damping: 15,
  },
} as const;

// Z-index layer values (matching CSS variables)
export const zIndices = {
  dropdown: 50,
  sticky: 100,
  fixed: 200,
  modalBackdrop: 300,
  modal: 400,
  popover: 500,
  tooltip: 600,
  toast: 700,
} as const;

// Stagger animation helper for Framer Motion
export function createStaggerVariants(
  staggerDelay: number = 0.05,
  variants: typeof framerVariants.fadeIn = framerVariants.fadeIn
) {
  return {
    container: {
      initial: { opacity: 0 },
      animate: {
        opacity: 1,
        transition: {
          staggerChildren: staggerDelay,
        },
      },
      exit: {
        opacity: 0,
        transition: {
          staggerChildren: staggerDelay,
          staggerDirection: -1,
        },
      },
    },
    item: variants,
  };
}

// Type exports for TypeScript users
export type Duration = keyof typeof durations;
export type Easing = keyof typeof easings;
export type Transition = keyof typeof transitions;
export type Animation = keyof typeof animations;
export type FramerVariant = keyof typeof framerVariants;
export type ZIndex = keyof typeof zIndices;