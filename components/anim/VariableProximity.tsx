"use client";

import { useEffect, useMemo, useRef } from "react";
import { useReducedMotion } from "motion/react";

/**
 * VariableProximity, adapted from reactbits.dev "Variable Proximity".
 *
 * Renders `label` as per-character spans whose `font-variation-settings`
 * interpolate between two axis presets based on how close the pointer is to
 * each character. A container ref defines the hoverable region that drives the
 * effect (so small text inside a large section still reacts), falling back to
 * the window when the container is null.
 *
 * A requestAnimationFrame loop reads the last pointer position and updates the
 * spans; listeners and the RAF are cleaned up on unmount. Reduced motion
 * renders plain text pinned to the "from" settings with no tracking.
 */

export interface VariableProximityProps {
  label: string;
  className?: string;
  /** The (possibly large) area that drives proximity. Text may be small within it. */
  containerRef: React.RefObject<HTMLElement | null>;
  /** Px radius of cursor influence. */
  radius?: number;
  /** Falloff curve within the radius. */
  falloff?: "linear" | "gaussian";
  /** Axis settings when the cursor is far / outside the radius. */
  fromFontVariationSettings?: string;
  /** Axis settings when the cursor is directly on the character. */
  toFontVariationSettings?: string;
  fontFamily?: string;
}

type Axis = { name: string; from: number; to: number };

/** Parse a `font-variation-settings` string into ordered axis name→value pairs. */
function parseSettings(value: string): Map<string, number> {
  const map = new Map<string, number>();
  // Matches entries like `'wght' 380` (single or double quotes around the tag).
  const re = /['"]([a-zA-Z0-9]{1,4})['"]\s+(-?\d*\.?\d+)/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(value)) !== null) {
    map.set(match[1], parseFloat(match[2]));
  }
  return map;
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(Math.max(v, min), max);
}

export default function VariableProximity({
  label,
  className,
  containerRef,
  radius = 160,
  falloff = "gaussian",
  fromFontVariationSettings = "'wght' 380, 'opsz' 12",
  toFontVariationSettings = "'wght' 900, 'opsz' 96",
  fontFamily = "inherit",
}: VariableProximityProps): React.JSX.Element {
  const reduced = useReducedMotion();

  const spansRef = useRef<Array<HTMLSpanElement | null>>([]);
  const rafId = useRef<number | null>(null);
  const pointer = useRef({ x: 0, y: 0, active: false });

  const chars = useMemo(() => Array.from(label), [label]);

  // Group characters by word so line-wrapping only happens at real spaces,
  // each word is an atomic nowrap unit; only the whitespace runs between
  // words are ordinary breakable text. Each per-character span still needs
  // `display: inline-block` (so its own font-variation-settings/transform
  // apply per-glyph), but if every letter in a word were its own
  // inline-block, the browser could wrap between ANY two letters, not just
  // at spaces, hence the word-grouping wrapper below.
  const groups = useMemo(() => {
    const parts = label.split(/(\s+)/);
    let cursor = 0;
    return parts
      .filter((p) => p.length > 0)
      .map((text, gi) => {
        const isSpace = /^\s+$/.test(text);
        const start = cursor;
        cursor += text.length;
        return { key: `g-${gi}`, text, isSpace, start };
      });
  }, [label]);

  // Build the per-axis interpolation table from the two settings strings.
  const axes = useMemo<Axis[]>(() => {
    const from = parseSettings(fromFontVariationSettings);
    const to = parseSettings(toFontVariationSettings);
    // Union of axis names, preserving the order they appear in `from` first.
    const names = new Set<string>([...from.keys(), ...to.keys()]);
    const result: Axis[] = [];
    for (const name of names) {
      result.push({
        name,
        from: from.get(name) ?? to.get(name) ?? 0,
        to: to.get(name) ?? from.get(name) ?? 0,
      });
    }
    return result;
  }, [fromFontVariationSettings, toFontVariationSettings]);

  const serialize = useMemo(
    () =>
      (t: number): string =>
        axes
          .map((a) => `'${a.name}' ${a.from + (a.to - a.from) * t}`)
          .join(", "),
    [axes],
  );

  spansRef.current = useMemo<Array<HTMLSpanElement | null>>(
    () => new Array(chars.length).fill(null),
    [chars.length],
  );

  useEffect(() => {
    if (reduced) return;

    // The container drives proximity; fall back to the window when absent.
    const container = containerRef.current;
    const target: HTMLElement | Window = container ?? window;

    const onMove = (e: PointerEvent) => {
      pointer.current = { x: e.clientX, y: e.clientY, active: true };
    };
    const onLeave = () => {
      pointer.current.active = false;
    };

    target.addEventListener("pointermove", onMove as EventListener, {
      passive: true,
    });
    target.addEventListener("pointerleave", onLeave as EventListener);

    const tick = () => {
      const { x, y, active } = pointer.current;

      for (let i = 0; i < spansRef.current.length; i += 1) {
        const span = spansRef.current[i];
        if (!span) continue;

        let t = 0;
        if (active) {
          const rect = span.getBoundingClientRect();
          const cx = rect.left + rect.width / 2;
          const cy = rect.top + rect.height / 2;
          const dist = Math.hypot(x - cx, y - cy);

          if (dist < radius) {
            const n = 1 - dist / radius; // 0 at edge, 1 at centre.
            t =
              falloff === "gaussian"
                ? // Smooth bell-ish curve peaking at the pointer.
                  Math.exp(-((1 - n) * (1 - n)) * 4)
                : n;
            t = clamp(t, 0, 1);
          }
        }

        span.style.fontVariationSettings = serialize(t);
      }

      rafId.current = requestAnimationFrame(tick);
    };

    rafId.current = requestAnimationFrame(tick);

    return () => {
      target.removeEventListener("pointermove", onMove as EventListener);
      target.removeEventListener("pointerleave", onLeave as EventListener);
      if (rafId.current !== null) {
        cancelAnimationFrame(rafId.current);
        rafId.current = null;
      }
    };
  }, [reduced, containerRef, radius, falloff, serialize]);

  // Base per-span style; reduced motion just pins everything to the "from" end.
  const restSettings = serialize(0);
  // The widest the word can ever render (every letter at the "to" end). A
  // hidden sizer at these settings fixes each word's box width, so animating
  // individual letters can never change where a line wraps.
  const maxSettings = serialize(1);

  return (
    <span
      className={className}
      style={{ fontFamily, display: "inline" }}
      aria-label={label}
    >
      {groups.map((g) => {
        if (g.isSpace) {
          // Plain whitespace, a normal, breakable text node.
          return (
            <span key={g.key} style={{ whiteSpace: "pre" }}>
              {g.text}
            </span>
          );
        }
        if (reduced) {
          // No tracking: render the word as-is, no reserved box needed.
          return (
            <span key={g.key} style={{ display: "inline-block", whiteSpace: "nowrap" }}>
              {g.text}
            </span>
          );
        }
        return (
          // One word = one atomic box whose width is reserved at the widest
          // (fully-weighted) state by a hidden sizer. The animated letters ride
          // in an absolutely-positioned overlay, so their changing advance
          // widths never affect layout, the line count stays fixed no matter
          // where the cursor is.
          <span
            key={g.key}
            style={{ position: "relative", display: "inline-block", whiteSpace: "nowrap" }}
          >
            <span aria-hidden="true" style={{ visibility: "hidden", fontVariationSettings: maxSettings }}>
              {g.text}
            </span>
            <span
              aria-hidden="true"
              style={{ position: "absolute", left: 0, top: 0, whiteSpace: "nowrap" }}
            >
              {Array.from(g.text).map((ch, ci) => {
                const i = g.start + ci;
                return (
                  <span
                    key={`${g.key}-${ci}`}
                    ref={(el) => {
                      spansRef.current[i] = el;
                    }}
                    style={{
                      display: "inline-block",
                      willChange: "font-variation-settings",
                      fontVariationSettings: restSettings,
                    }}
                  >
                    {ch}
                  </span>
                );
              })}
            </span>
          </span>
        );
      })}
    </span>
  );
}
