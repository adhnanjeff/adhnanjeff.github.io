"use client";

import { useEffect, useRef, useState } from "react";
import { animate, useReducedMotion } from "motion/react";

/**
 * CountUp, animates a number from `from` to `to` when scrolled into view.
 *
 * Uses motion's `animate()` for the tween and an IntersectionObserver to
 * trigger once. Respects reduced motion by rendering the final value
 * immediately.
 */

export interface CountUpProps {
  to: number;
  from?: number;
  /** Duration in seconds. */
  duration?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
  /** Thousands separator, e.g. "," or " ". Empty string = none. */
  separator?: string;
  /** Number of decimal places. */
  decimals?: number;
}

function formatNumber(
  value: number,
  decimals: number,
  separator: string,
): string {
  const fixed = value.toFixed(decimals);
  if (!separator) return fixed;

  const [intPart, fracPart] = fixed.split(".");
  const sign = intPart.startsWith("-") ? "-" : "";
  const digits = sign ? intPart.slice(1) : intPart;
  const grouped = digits.replace(/\B(?=(\d{3})+(?!\d))/g, separator);
  return fracPart ? `${sign}${grouped}.${fracPart}` : `${sign}${grouped}`;
}

export default function CountUp({
  to,
  from = 0,
  duration = 1.6,
  className,
  prefix = "",
  suffix = "",
  separator = "",
  decimals = 0,
}: CountUpProps): React.JSX.Element {
  const reduced = useReducedMotion();

  const ref = useRef<HTMLSpanElement | null>(null);
  const startedRef = useRef(false);
  const [value, setValue] = useState<number>(reduced ? to : from);

  useEffect(() => {
    if (reduced) {
      setValue(to);
      return;
    }

    const el = ref.current;
    if (!el) return;

    let controls: ReturnType<typeof animate> | null = null;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !startedRef.current) {
            startedRef.current = true;
            controls = animate(from, to, {
              duration,
              ease: "easeOut",
              onUpdate: (latest) => setValue(latest),
            });
            observer.disconnect();
            break;
          }
        }
      },
      { threshold: 0.3 },
    );
    observer.observe(el);

    return () => {
      observer.disconnect();
      controls?.stop();
    };
  }, [reduced, from, to, duration]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {formatNumber(value, decimals, separator)}
      {suffix}
    </span>
  );
}
