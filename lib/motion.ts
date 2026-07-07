import type { Variants, Transition } from "motion/react";

/** Refined, unhurried easing, no springy bounce anywhere. */
export const EASE_OUT: Transition["ease"] = [0.22, 1, 0.36, 1];
export const EASE_IN_OUT: Transition["ease"] = [0.65, 0, 0.35, 1];

/** Gentle rise + fade for scroll reveals (Story Mode). */
export const rise: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: EASE_OUT },
  },
};

/** Simple fade, the reduced-motion-friendly fallback. */
export const fade: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.5, ease: EASE_OUT } },
};

/** Stagger container for editorial lists. */
export const stagger = (delay = 0, gap = 0.08): Variants => ({
  hidden: {},
  show: {
    transition: { delayChildren: delay, staggerChildren: gap },
  },
});

/** Cross-fade used for the entry gate + mode switch. */
export const crossfade: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.5, ease: EASE_OUT } },
  exit: { opacity: 0, transition: { duration: 0.35, ease: EASE_IN_OUT } },
};

/** Pick the right variant given the user's motion preference. */
export function reveal(reduced: boolean | null): Variants {
  return reduced ? fade : rise;
}
