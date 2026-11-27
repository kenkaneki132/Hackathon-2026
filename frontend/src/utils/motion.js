// Charts skip their entrance animation for people who ask the OS for reduced motion.
export const ANIMATE = typeof window === 'undefined' || !window.matchMedia
  ? true
  : !window.matchMedia('(prefers-reduced-motion: reduce)').matches
