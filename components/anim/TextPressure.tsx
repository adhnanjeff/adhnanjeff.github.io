"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useReducedMotion } from "motion/react";

/**
 * TextPressure, adapted from reactbits.dev "Text Pressure".
 *
 * Interactive variable-font text: each character's `font-variation-settings`
 * responds to cursor proximity. Characters near the cursor become heavier and
 * wider; distant ones grow lighter and narrower. The effect is driven by a
 * requestAnimationFrame loop that lerps a tracked cursor position toward the
 * raw pointer for smoothness.
 *
 * This relies on a variable font wired to `fontFamily` (default the CSS var
 * `--font-flex`, expected to be Roboto Flex with 'wght' and 'wdth' axes). It
 * does NOT load a font itself.
 */

export interface TextPressureProps {
  text: string;
  className?: string;
  /** Variable-font family. Should expose 'wght'/'wdth' (and optionally slant). */
  fontFamily?: string;
  /** Minimum font size in px; letters never render smaller than this. */
  minFontSize?: number;
  /** Animate the 'wght' (weight) axis. */
  weight?: boolean;
  /** Animate the 'wdth' (width) axis. */
  width?: boolean;
  /** Animate slant ('slnt') / italic ('ital') if the font supports it. */
  italic?: boolean;
  /** Letters spread with flex to fill the container width. */
  flex?: boolean;
  /** Text colour. Defaults to the inherited colour. */
  textColor?: string;
  /** Fade characters by distance (opacity falloff) in addition to the axes. */
  alpha?: boolean;
  /** 'wght' at rest (far from cursor) and at the peak (on top). */
  minWeight?: number;
  maxWeight?: number;
  /** 'wdth' at rest and at the peak. */
  minWidth?: number;
  maxWidth?: number;
  /** Peak per-letter scale near the cursor, letters grow (1 = no growth). */
  maxScale?: number;
  /** Tracking applied to the whole line. */
  letterSpacing?: string;
  /** Stagger the characters in (opacity + de-blur) the first time it scrolls
   *  into view, mirroring the Story-Mode ScrollReveal treatment. */
  reveal?: boolean;
  /** Seconds between each character's entrance. */
  revealStagger?: number;
}

// Axis ranges tuned for Roboto Flex.
const WGHT_MIN = 100;
const WGHT_MAX = 900;
const WDTH_MIN = 25;
const WDTH_MAX = 151;
const SLNT_MIN = 0;
const SLNT_MAX = -10;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Map a distance to a 0..1 proximity factor (1 = on top, 0 = far / beyond radius). */
function proximity(dist: number, radius: number): number {
  if (dist >= radius) return 0;
  return 1 - dist / radius;
}

export default function TextPressure({
  text,
  className,
  fontFamily = "var(--font-flex)",
  minFontSize = 24,
  weight = true,
  width = true,
  italic = false,
  flex = true,
  textColor = "currentColor",
  alpha = false,
  minWeight = WGHT_MIN,
  maxWeight = WGHT_MAX,
  minWidth = WDTH_MIN,
  maxWidth = WDTH_MAX,
  maxScale = 1,
  letterSpacing,
  reveal = false,
  revealStagger = 0.05,
}: TextPressureProps): React.JSX.Element {
  const reduced = useReducedMotion();

  // Entrance: characters start blurred/transparent and settle in on first view.
  const [revealed, setRevealed] = useState(!reveal);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const spansRef = useRef<Array<HTMLSpanElement | null>>([]);

  // Raw pointer position (updated by events) and the smoothed position we
  // actually render from (lerped toward the raw one each frame).
  const rawCursor = useRef({ x: 0, y: 0 });
  const cursor = useRef({ x: 0, y: 0 });
  const hasPointer = useRef(false);
  const rafId = useRef<number | null>(null);

  const chars = useMemo(() => Array.from(text), [text]);

  // Reset the span registry whenever the character count changes.
  spansRef.current = useMemo<Array<HTMLSpanElement | null>>(
    () => new Array(chars.length).fill(null),
    [chars.length],
  );

  const setPointerFromEvent = useCallback(
    (clientX: number, clientY: number) => {
      rawCursor.current = { x: clientX, y: clientY };
      hasPointer.current = true;
    },
    [],
  );

  useLayoutEffect(() => {
    if (reduced) return;

    const container = containerRef.current;
    if (!container) return;

    // Seed both cursors to the container centre so the first frame is stable.
    const rect = container.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    rawCursor.current = { x: cx, y: cy };
    cursor.current = { x: cx, y: cy };
  }, [reduced]);

  useEffect(() => {
    if (reduced) return;

    const container = containerRef.current;
    if (!container) return;

    const onPointerMove = (e: PointerEvent) => {
      setPointerFromEvent(e.clientX, e.clientY);
    };
    const onTouchMove = (e: TouchEvent) => {
      const t = e.touches[0];
      if (t) setPointerFromEvent(t.clientX, t.clientY);
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });

    const tick = () => {
      // Lerp the smoothed cursor toward the raw pointer.
      cursor.current.x += (rawCursor.current.x - cursor.current.x) * 0.18;
      cursor.current.y += (rawCursor.current.y - cursor.current.y) * 0.18;

      // A radius derived from the container width gives a proximity falloff
      // that scales with the text block.
      const rect = container.getBoundingClientRect();
      const radius = Math.max(rect.width * 0.6, 120);

      for (let i = 0; i < spansRef.current.length; i += 1) {
        const span = spansRef.current[i];
        if (!span) continue;

        const sRect = span.getBoundingClientRect();
        const sx = sRect.left + sRect.width / 2;
        const sy = sRect.top + sRect.height / 2;

        const dx = cursor.current.x - sx;
        const dy = cursor.current.y - sy;
        const dist = Math.hypot(dx, dy);
        const p = proximity(dist, radius);

        const settings: string[] = [];
        if (weight) {
          const wght = Math.round(minWeight + (maxWeight - minWeight) * p);
          settings.push(`'wght' ${clamp(wght, WGHT_MIN, WGHT_MAX)}`);
        }
        if (width) {
          const wdth = Math.round(minWidth + (maxWidth - minWidth) * p);
          settings.push(`'wdth' ${clamp(wdth, WDTH_MIN, WDTH_MAX)}`);
        }
        if (italic) {
          const slnt = Math.round(SLNT_MIN + (SLNT_MAX - SLNT_MIN) * p);
          settings.push(`'slnt' ${clamp(slnt, SLNT_MAX, SLNT_MIN)}`);
        }

        span.style.fontVariationSettings = settings.join(", ");
        if (maxScale !== 1) {
          // Grow from the baseline so letters rise rather than drift sideways;
          // a transform never reflows, so this stays layout-stable.
          span.style.transform = `scale(${1 + (maxScale - 1) * p})`;
        }
        if (alpha) {
          span.style.opacity = String(clamp(0.35 + 0.65 * p, 0, 1));
        }
      }

      rafId.current = requestAnimationFrame(tick);
    };

    rafId.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("touchmove", onTouchMove);
      if (rafId.current !== null) {
        cancelAnimationFrame(rafId.current);
        rafId.current = null;
      }
    };
  }, [
    reduced,
    weight,
    width,
    italic,
    alpha,
    minWeight,
    maxWeight,
    minWidth,
    maxWidth,
    maxScale,
    setPointerFromEvent,
  ]);

  // Fire the entrance once the block scrolls into view.
  useEffect(() => {
    if (!reveal || revealed) return;
    const container = containerRef.current;
    if (!container) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setRevealed(true);
          io.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    io.observe(container);
    return () => io.disconnect();
  }, [reveal, revealed]);

  // Reduced motion: static text pinned at the rest weight, no tracking.
  if (reduced) {
    return (
      <span
        className={className}
        style={{
          fontFamily,
          color: textColor,
          letterSpacing,
          fontVariationSettings: `'wght' ${clamp(minWeight, WGHT_MIN, WGHT_MAX)}`,
        }}
      >
        {text}
      </span>
    );
  }

  return (
    <div
      ref={containerRef}
      className={className}
      aria-label={text}
      style={{
        display: "flex",
        flexWrap: "nowrap",
        justifyContent: flex ? "space-between" : "flex-start",
        alignItems: "baseline",
        width: flex ? "100%" : "auto",
        fontFamily,
        color: textColor,
        letterSpacing,
        fontSize: `max(${minFontSize}px, 1em)`,
        lineHeight: 1,
      }}
    >
      {chars.map((ch, i) => (
        <span
          // Character position is stable for a given `text`, so index keys are safe.
          key={`${ch}-${i}`}
          ref={(el) => {
            spansRef.current[i] = el;
          }}
          aria-hidden="true"
          style={{
            display: "inline-block",
            flex: flex ? "0 0 auto" : undefined,
            transformOrigin: "center bottom",
            willChange: "font-variation-settings, transform, opacity, filter",
            // Preserve spaces so words don't collapse.
            whiteSpace: "pre",
            // Scroll-in entrance (opacity + de-blur, staggered per character).
            // The RAF loop owns `transform`/`fontVariationSettings`, so the
            // reveal only touches opacity and filter, no property fights.
            ...(reveal
              ? {
                  opacity: revealed ? 1 : 0,
                  filter: revealed ? "blur(0px)" : "blur(12px)",
                  transition: `opacity 0.5s ease, filter 0.5s ease`,
                  transitionDelay: `${i * revealStagger}s`,
                }
              : null),
          }}
        >
          {ch === " " ? " " : ch}
        </span>
      ))}
    </div>
  );
}
