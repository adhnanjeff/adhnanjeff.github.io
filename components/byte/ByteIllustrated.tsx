"use client";

import { motion, useReducedMotion } from "motion/react";

/**
 * Sage, Story Mode's illustrated companion, warm and restrained (not
 * cute). Gentle idle float; still when reduced-motion is set.
 */
export function ByteIllustrated({
  size = 120,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  const reduced = useReducedMotion();

  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      role="img"
      aria-label="Sage, Adhnan's mascot"
      className={className}
      animate={reduced ? undefined : { y: [0, -5, 0] }}
      transition={
        reduced
          ? undefined
          : { duration: 4.5, repeat: Infinity, ease: "easeInOut" }
      }
    >
      {/* soft shadow */}
      <ellipse cx="60" cy="110" rx="26" ry="5" fill="var(--story-line)" />
      {/* antenna */}
      <line
        x1="60"
        y1="20"
        x2="60"
        y2="34"
        stroke="var(--story-accent)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <circle cx="60" cy="16" r="4.5" fill="var(--story-accent)" />
      {/* head */}
      <rect
        x="24"
        y="34"
        width="72"
        height="60"
        rx="18"
        fill="#fff"
        stroke="var(--story-ink)"
        strokeWidth="2.5"
      />
      {/* eyes */}
      <circle cx="47" cy="60" r="5.5" fill="var(--story-ink)" />
      <circle cx="73" cy="60" r="5.5" fill="var(--story-ink)" />
      <circle cx="45.5" cy="58.5" r="1.6" fill="#fff" />
      <circle cx="71.5" cy="58.5" r="1.6" fill="#fff" />
      {/* smile */}
      <path
        d="M50 74 Q60 82 70 74"
        stroke="var(--story-ink)"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
      <text
        x="60"
        y="90"
        textAnchor="middle"
        fontFamily="var(--font-mono), monospace"
        fontSize="7"
        letterSpacing="1"
        fill="var(--story-accent)"
      >
        0101
      </text>
    </motion.svg>
  );
}
