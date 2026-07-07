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

  // Every letter is its own inline-block span so it can float independently,
  // but that also lets the browser wrap a line between ANY two letters, not
  // just at spaces (e.g. "workfl / ow"). Grouping letters into per-word,
  // non-wrapping units keeps line breaks at real word boundaries, same fix
  // as VariableProximity. Each group tracks its starting index into `chars`
  // so animated spans still key off the original flat character offsets.
  const groups = useMemo(() => {
    const parts = children.split(/(\s+)/);
    let cursor = 0;
    return parts
      .filter((p) => p.length > 0)
      .map((text, gi) => {
        const isSpace = /^\s+$/.test(text);
        const start = cursor;
        cursor += Array.from(text).length;
        return { key: `g-${gi}`, text, isSpace, start };
      });
  }, [children]);

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
        {groups.map((g) =>
          g.isSpace ? (
            // Plain whitespace, a normal, breakable text node. Its own
            // opacity/position never mattered visually, so no need to
            // animate it individually.
            <span key={g.key} style={{ whiteSpace: "pre" }}>
              {g.text}
            </span>
          ) : (
            // One word = one atomic, non-wrapping unit of per-character spans.
            <span key={g.key} style={{ display: "inline-block", whiteSpace: "nowrap" }}>
              {Array.from(g.text).map((ch, ci) => {
                const i = g.start + ci;
                return (
                  <Char
                    key={`${g.key}-${ci}`}
                    char={ch}
                    start={windows[i].start}
                    end={windows[i].end}
                    progress={scrollYProgress}
                    y={y}
                  />
                );
              })}
            </span>
          ),
        )}
      </span>
    </h2>
  );
}
