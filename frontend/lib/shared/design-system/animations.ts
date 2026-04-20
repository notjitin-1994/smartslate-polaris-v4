/**
 * Advanced Animation System
 * Orchestrated animations with physics-based spring effects
 */

import { Variants, Transition } from 'framer-motion';

// Spring configurations for different animation feels
export const springPresets = {
  gentle: { stiffness: 150, damping: 20, mass: 0.8 },
  snappy: { stiffness: 400, damping: 30, mass: 0.5 },
  bouncy: { stiffness: 300, damping: 15, mass: 0.7 },
  smooth: { stiffness: 200, damping: 25, mass: 1 },
  elastic: { stiffness: 100, damping: 10, mass: 1.2 },
} as const;

// Timing functions for orchestrated reveals
export const timingFunctions = {
  easeOutExpo: [0.16, 1, 0.3, 1],
  easeInOutCubic: [0.645, 0.045, 0.355, 1],
  easeOutBack: [0.175, 0.885, 0.32, 1.275],
  smoothSpring: [0.25, 0.46, 0.45, 0.94],
} as const;

// Orchestrated entrance animations
export const orchestratedEntrance: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05,
      when: 'beforeChildren',
    },
  },
};

// Individual item animations
export const itemAnimations = {
  fadeInUp: {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring', ...springPresets.gentle },
    },
  },

  fadeInScale: {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { type: 'spring', ...springPresets.snappy },
    },
  },

  slideInLeft: {
    hidden: { opacity: 0, x: -40 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { type: 'spring', ...springPresets.smooth },
    },
  },

  slideInRight: {
    hidden: { opacity: 0, x: 40 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { type: 'spring', ...springPresets.smooth },
    },
  },

  rotateIn: {
    hidden: { opacity: 0, rotate: -10, scale: 0.9 },
    visible: {
      opacity: 1,
      rotate: 0,
      scale: 1,
      transition: { type: 'spring', ...springPresets.elastic },
    },
  },

  morphIn: {
    hidden: {
      opacity: 0,
      scale: 0.8,
      filter: 'blur(10px)',
    },
    visible: {
      opacity: 1,
      scale: 1,
      filter: 'blur(0px)',
      transition: {
        opacity: { duration: 0.4 },
        scale: { type: 'spring', ...springPresets.bouncy },
        filter: { duration: 0.6 },
      },
    },
  },
} as const;

// Section transition animations
export const sectionTransitions = {
  crossfade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.3 },
  },

  slideUp: {
    initial: { opacity: 0, y: 40 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -40 },
    transition: { type: 'spring', ...springPresets.smooth },
  },

  slideHorizontal: {
    initial: (direction: number) => ({ opacity: 0, x: direction * 100 }),
    animate: { opacity: 1, x: 0 },
    exit: (direction: number) => ({ opacity: 0, x: direction * -100 }),
    transition: { type: 'spring', ...springPresets.snappy },
  },

  zoom: {
    initial: { opacity: 0, scale: 0.8 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 1.2 },
    transition: { type: 'spring', ...springPresets.gentle },
  },

  morph: {
    initial: {
      opacity: 0,
      scale: 0.9,
      filter: 'blur(20px) brightness(0.8)',
    },
    animate: {
      opacity: 1,
      scale: 1,
      filter: 'blur(0px) brightness(1)',
    },
    exit: {
      opacity: 0,
      scale: 1.1,
      filter: 'blur(20px) brightness(1.2)',
    },
    transition: {
      duration: 0.6,
      ease: timingFunctions.smoothSpring,
    },
  },
} as const;

// Micro-interactions
export const microInteractions = {
  buttonPress: {
    whileTap: { scale: 0.95 },
    transition: { type: 'spring', ...springPresets.snappy },
  },

  buttonHover: {
    whileHover: { scale: 1.05, y: -2 },
    transition: { type: 'spring', ...springPresets.gentle },
  },

  cardHover: {
    whileHover: {
      y: -8,
      scale: 1.02,
      transition: { type: 'spring', ...springPresets.smooth },
    },
  },

  iconPulse: {
    animate: {
      scale: [1, 1.1, 1],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  },

  shimmer: {
    animate: {
      backgroundPosition: ['200% 0', '-200% 0'],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: 'linear',
      },
    },
  },
} as const;

// Parallax configurations
export const parallaxPresets = {
  subtle: { offset: 20, speed: 0.5 },
  moderate: { offset: 40, speed: 0.7 },
  dramatic: { offset: 80, speed: 0.9 },
} as const;

// Gesture animations
export const gestureAnimations = {
  swipeLeft: {
    x: -300,
    opacity: 0,
    transition: { type: 'spring', ...springPresets.snappy },
  },

  swipeRight: {
    x: 300,
    opacity: 0,
    transition: { type: 'spring', ...springPresets.snappy },
  },

  pinchZoom: {
    scale: [1, 1.2, 1],
    transition: { type: 'spring', ...springPresets.elastic },
  },
} as const;

// Utility function to create custom animation variants
export function createAnimationVariant(
  from: Record<string, any>,
  to: Record<string, any>,
  options?: {
    type?: 'spring' | 'tween';
    preset?: keyof typeof springPresets;
    duration?: number;
    delay?: number;
    stagger?: number;
  }
): Variants {
  const {
    type = 'spring',
    preset = 'smooth',
    duration = 0.6,
    delay = 0,
    stagger = 0,
  } = options || {};

  return {
    hidden: from,
    visible: {
      ...to,
      transition:
        type === 'spring'
          ? { type, ...springPresets[preset], delay, staggerChildren: stagger }
          : { type, duration, delay, ease: timingFunctions.smoothSpring, staggerChildren: stagger },
    },
  };
}

// Page transition presets
export const pageTransitions = {
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.4 },
  },

  slideUp: {
    initial: { opacity: 0, y: 100 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -100 },
    transition: { type: 'spring', ...springPresets.smooth },
  },

  scale: {
    initial: { opacity: 0, scale: 0.8 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 1.2 },
    transition: { type: 'spring', ...springPresets.gentle },
  },
} as const;
