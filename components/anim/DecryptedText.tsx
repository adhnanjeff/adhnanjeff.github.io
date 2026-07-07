"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";

/**
 * DecryptedText, adapted from reactbits.dev "Decrypted Text".
 *
 * The text scrambles through random glyphs and resolves to the real string.
 * Can animate once when scrolled into view, or on hover. Respects reduced
 * motion by rendering the final text immediately.
 */

export type RevealDirection = "start" | "end" | "center";

export interface DecryptedTextProps {
  text: string;
  className?: string;
  /** Per-iteration delay in ms. */
  speed?: number;
  /** Scramble iterations before a character is allowed to reveal (sequential). */
  maxIterations?: number;
  /** Reveal characters one-by-one (true) or scramble all at once (false). */
  sequential?: boolean;
  /** Order in which characters lock into place when sequential. */
  revealDirection?: RevealDirection;
  /** Glyph pool used while scrambling. */
  characters?: string;
  /** Trigger the animation when in view (once) or on hover. */
  animateOn?: "view" | "hover";
  /** Class applied to the wrapping element. */
  parentClassName?: string;
}

const DEFAULT_CHARS =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!<>-_\\/[]{}=+*^?#________";

// Self-contained visually-hidden style (does not depend on a global .sr-only).
const VISUALLY_HIDDEN: React.CSSProperties = {
  position: "absolute",
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: "hidden",
  clip: "rect(0, 0, 0, 0)",
  whiteSpace: "nowrap",
  border: 0,
};

function nextRevealIndex(
  revealedCount: number,
  total: number,
  direction: RevealDirection,
): number {
  // Returns the index of the character to reveal for the given progress.
  switch (direction) {
    case "end":
      return total - 1 - revealedCount;
    case "center": {
      const middle = Math.floor(total / 2);
      const offset = Math.floor(revealedCount / 2);
      const index =
        revealedCount % 2 === 0 ? middle + offset : middle - offset - 1;
      if (index >= 0 && index < total) return index;
      // Fall back to the first still-hidden slot.
      return revealedCount;
    }
    case "start":
    default:
      return revealedCount;
  }
}

export default function DecryptedText({
  text,
  className,
  speed = 55,
  maxIterations = 12,
  sequential = true,
  revealDirection = "start",
  characters = DEFAULT_CHARS,
  animateOn = "view",
  parentClassName,
}: DecryptedTextProps): React.JSX.Element {
  const reduced = useReducedMotion();

  const [display, setDisplay] = useState<string>(text);
  const [revealed, setRevealed] = useState<Set<number>>(new Set());
  const [started, setStarted] = useState<boolean>(false);

  const containerRef = useRef<HTMLSpanElement | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const randomGlyph = useCallback(
    () => characters[Math.floor(Math.random() * characters.length)] ?? "",
    [characters],
  );

  const stop = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const run = useCallback(() => {
    if (reduced) {
      setDisplay(text);
      return;
    }
    stop();

    const chars = Array.from(text);
    const total = chars.length;
    const locked = new Set<number>();
    let iteration = 0;

    intervalRef.current = setInterval(() => {
      if (sequential) {
        if (locked.size >= total) {
          setDisplay(text);
          setRevealed(new Set(locked));
          stop();
          return;
        }
        const idx = nextRevealIndex(locked.size, total, revealDirection);
        locked.add(idx);

        const next = chars
          .map((c, i) => {
            if (c === " ") return " ";
            return locked.has(i) ? c : randomGlyph();
          })
          .join("");
        setDisplay(next);
        setRevealed(new Set(locked));
      } else {
        iteration += 1;
        const progress = iteration / maxIterations;
        const nextLocked = new Set<number>();
        const next = chars
          .map((c, i) => {
            if (c === " ") return " ";
            // Each character reveals at a threshold spread across iterations.
            const threshold = (i + 1) / total;
            if (progress >= threshold) {
              nextLocked.add(i);
              return c;
            }
            return randomGlyph();
          })
          .join("");
        setDisplay(next);
        setRevealed(nextLocked);

        if (iteration >= maxIterations) {
          setDisplay(text);
          setRevealed(new Set(chars.map((_, i) => i)));
          stop();
        }
      }
    }, speed);
  }, [
    reduced,
    text,
    sequential,
    revealDirection,
    randomGlyph,
    maxIterations,
    speed,
    stop,
  ]);

  // "view": trigger once via IntersectionObserver.
  useEffect(() => {
    if (animateOn !== "view") return;
    if (reduced) {
      setDisplay(text);
      return;
    }
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !started) {
            setStarted(true);
            run();
            observer.disconnect();
            break;
          }
        }
      },
      { threshold: 0.2 },
    );
    observer.observe(el);

    return () => observer.disconnect();
  }, [animateOn, reduced, text, started, run]);

  // Keep the displayed text in sync if `text` changes before any trigger.
  useEffect(() => {
    if (!started) setDisplay(text);
  }, [text, started]);

  useEffect(() => stop, [stop]);

  const hoverHandlers =
    animateOn === "hover" && !reduced
      ? {
          onMouseEnter: () => {
            setStarted(true);
            run();
          },
          onMouseLeave: () => {
            stop();
            setDisplay(text);
            setRevealed(new Set());
          },
        }
      : {};

  return (
    <span
      ref={containerRef}
      className={parentClassName}
      {...hoverHandlers}
      style={{ display: "inline-block", whiteSpace: "pre-wrap" }}
    >
      {/* Accessible, stable text for screen readers and copy. */}
      <span style={VISUALLY_HIDDEN}>{text}</span>
      <span aria-hidden="true" className={className}>
        {Array.from(display).map((ch, i) => (
          <span
            key={`${ch}-${i}`}
            data-revealed={revealed.has(i) || undefined}
          >
            {ch}
          </span>
        ))}
      </span>
    </span>
  );
}
