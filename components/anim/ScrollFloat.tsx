"use client";

import { useMemo, useRef } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "motion/react";

/**
 * ScrollFloat, adapted from reactbits.dev "Scroll Float".
 *
 * Splits `children` into characters that float up (`y` → 0) and fade in
 * (opacity 0 → 1) as the component scrolls into view. The motion is
 * scroll-scrubbed (not time-based): every character's transform tracks the
 * scroll position continuously. A `stagger` offsets each subsequent character
 * so the reveal ripples across the word.
 *
 * Reduced motion renders static, fully-opaque text with no scroll tracking.
 */

export interface ScrollFloatProps {
  /** Plain text, split into characters. */
  children: string;
  className?: string;
  /** Wraps the whole component. */
  containerClassName?: string;
  scrollContainerRef?: React.RefObject<HTMLElement | null>;
  /** Fraction of total scroll progress each subsequent character is offset by. */
  stagger?: number;
  /** Px each character floats up from. */
  y?: number;
}

interface CharProps {
  char: string;
  start: number;
  end: number;
  progress: ReturnType<typeof useScroll>["scrollYProgress"];
  y: number;
}

function Char({ char, start, end, progress, y }: CharProps): React.JSX.Element {
  const translateY = useTransform(progress, [start, end], [y, 0], {
    clamp: true,
  });
  const opacity = useTransform(progress, [start, end], [0, 1], {
    clamp: true,
  });

  return (
    <motion.span
      style={{
        display: "inline-block",
        whiteSpace: "pre",
        y: translateY,
        opacity,
        willChange: "transform, opacity",
      }}
    >
      {char === " " ? " " : char}
    </motion.span>
  );
}

export default function ScrollFloat({
  children,
  className,
  containerClassName,
  scrollContainerRef,
  stagger = 0.03,
  y = 40,
}: ScrollFloatProps): React.JSX.Element {
  const reduced = useReducedMotion();
  const wrapperRef = useRef<HTMLHeadingElement | null>(null);

  const chars = useMemo(() => Array.from(children), [children]);

  const { scrollYProgress } = useScroll({
    target: wrapperRef,
    container: scrollContainerRef,
    offset: ["start end", "start 40%"],
  });

  // Each char gets a window [start, end]. Windows begin at i*stagger but are
  // clamped to at least 0.25 wide so late characters still travel meaningfully,
  // and never run past progress 1.
  const windows = useMemo(() => {
    const minWidth = 0.25;
    return chars.map((_, i) => {
      const start = Math.min(i * stagger, 1 - minWidth);
      const end = Math.min(start + Math.max(minWidth, 1 - chars.length * stagger + i * stagger - start), 1);
      // Guarantee a valid, ordered, at-least-minWidth window.
      const safeEnd = Math.max(end, Math.min(start + minWidth, 1));
      return { start: Math.max(0, start), end: safeEnd };
    });
  }, [chars, stagger]);

  if (reduced) {
    return (
      <h2 ref={wrapperRef} className={containerClassName}>
        <span className={className}>{children}</span>
      </h2>
    );
  }

  return (
    <h2 ref={wrapperRef} className={containerClassName}>
      <span className={className} style={{ display: "inline-block" }}>
        {chars.map((ch, i) => (
          <Char
            key={`${ch}-${i}`}
            char={ch}
            start={windows[i].start}
            end={windows[i].end}
            progress={scrollYProgress}
            y={y}
          />
        ))}
      </span>
    </h2>
  );
}
