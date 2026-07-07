"use client";

import { useMemo, useRef } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "motion/react";

/**
 * ScrollReveal, adapted from reactbits.dev "Scroll Reveal".
 *
 * Splits `children` into words that sharpen and fade in (opacity + blur) while
 * the block rotates level, all scrubbed by a single `useScroll` progress. Word
 * transitions are staggered so they resolve left-to-right / top-to-bottom as
 * the section scrolls into place.
 *
 * Reduced motion renders static, fully opaque, unrotated, unblurred text.
 */

export interface ScrollRevealProps {
  /** Plain text, split into words internally. */
  children: string;
  className?: string;
  /** Scroll ancestor; omit to use the window. */
  scrollContainerRef?: React.RefObject<HTMLElement | null>;
  /** Starting opacity per word before it's revealed. */
  baseOpacity?: number;
  enableBlur?: boolean;
  /** Px of blur applied at baseOpacity. */
  blurStrength?: number;
  /** Deg the whole block starts rotated by, un-rotating to 0 as it scrolls in. */
  baseRotation?: number;
}

interface WordProps {
  text: string;
  index: number;
  total: number;
  progress: ReturnType<typeof useScroll>["scrollYProgress"];
  baseOpacity: number;
  enableBlur: boolean;
  blurStrength: number;
}

function Word({
  text,
  index,
  total,
  progress,
  baseOpacity,
  enableBlur,
  blurStrength,
}: WordProps): React.JSX.Element {
  // Word i occupies a later slice of overall progress than word i-1.
  const denom = total + 2;
  const start = index / denom;
  const end = (index + 3) / denom;

  const opacity = useTransform(
    progress,
    [start, end],
    [baseOpacity, 1],
    { clamp: true },
  );
  const blurPx = useTransform(
    progress,
    [start, end],
    [blurStrength, 0],
    { clamp: true },
  );
  const filter = useTransform(blurPx, (b) =>
    enableBlur ? `blur(${b}px)` : "none",
  );

  return (
    <motion.span
      style={{
        display: "inline-block",
        whiteSpace: "pre",
        opacity,
        filter: enableBlur ? filter : undefined,
        willChange: "opacity, filter",
      }}
    >
      {text}
    </motion.span>
  );
}

export default function ScrollReveal({
  children,
  className,
  scrollContainerRef,
  baseOpacity = 0.15,
  enableBlur = true,
  blurStrength = 6,
  baseRotation = 3,
}: ScrollRevealProps): React.JSX.Element {
  const reduced = useReducedMotion();
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  // Split into words while keeping the trailing space so words don't butt up.
  const words = useMemo(() => children.split(/(\s+)/), [children]);
  const wordCount = useMemo(
    () => words.filter((w) => w.trim().length > 0).length,
    [words],
  );

  const { scrollYProgress } = useScroll({
    target: wrapperRef,
    container: scrollContainerRef,
    // progress 0 = wrapper top 90% down the viewport; 1 = top at 25% down.
    offset: ["start 0.9", "start 0.25"],
  });

  const rotate = useTransform(
    scrollYProgress,
    [0, 1],
    [baseRotation, 0],
    { clamp: true },
  );

  if (reduced) {
    return (
      <div ref={wrapperRef} className={className}>
        {children}
      </div>
    );
  }

  // Assign each real word a monotonically increasing reveal index; whitespace
  // tokens are rendered as-is and don't consume a stagger slot.
  let wordIndex = -1;

  return (
    <motion.div
      ref={wrapperRef}
      className={className}
      style={{
        rotate,
        transformOrigin: "0% 50%",
        display: "block",
        willChange: "transform",
      }}
    >
      {words.map((token, i) => {
        if (token.trim().length === 0) {
          return (
            <span key={`s-${i}`} style={{ whiteSpace: "pre" }}>
              {token}
            </span>
          );
        }
        wordIndex += 1;
        return (
          <Word
            key={`w-${i}`}
            text={token}
            index={wordIndex}
            total={wordCount}
            progress={scrollYProgress}
            baseOpacity={baseOpacity}
            enableBlur={enableBlur}
            blurStrength={blurStrength}
          />
        );
      })}
    </motion.div>
  );
}
