/**
 * Motion Animation Variants for Expressive UI
 */

export const fadeInUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } },
  exit: { opacity: 0, y: -12, transition: { duration: 0.2 } },
};

export const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.05,
    },
  },
};

export const scaleIn = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1, transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] } },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.15 } },
};

export const floatFabVariant = {
  closed: { scale: 1, rotate: 0 },
  open: { scale: 1.1, rotate: 45 },
};

export const speedDialVariant = {
  closed: { opacity: 0, y: 20, scale: 0.8, pointerEvents: 'none' as const },
  open: { opacity: 1, y: 0, scale: 1, pointerEvents: 'auto' as const, transition: { duration: 0.2, ease: 'easeOut' } },
};
