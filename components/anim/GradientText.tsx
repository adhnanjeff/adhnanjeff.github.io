"use client";

import { useId } from "react";
import { useReducedMotion } from "motion/react";

/**
 * GradientText, adapted from reactbits.dev "Gradient Text".
 *
 * Renders `children` with an animated multi-stop linear gradient clipped to the
 * glyphs (`background-clip: text`). The first colour is repeated at the end so
 * the loop is seamless. Colours are fully caller-controlled and may be CSS
 * `var(...)` references. The keyframes are injected via a scoped <style> keyed
 * by `useId()`, matching the ShinyText convention.
 *
 * `showBorder` wraps the text in a pill whose border is the same moving
 * gradient (an outer gradient layer with an opaque inner pill masking all but a
 * thin edge). Reduced motion renders a static gradient with no animation.
 */

export interface GradientTextProps {
  children: React.ReactNode;
  className?: string;
  /** Gradient stops; accepts arbitrary CSS colours incl. `var(--x)`. */
  colors?: string[];
  /** Seconds per loop. */
  animationSpeed?: number;
  /** Wrap in a padded pill with a border drawn from the same moving gradient. */
  showBorder?: boolean;
}

const DEFAULT_COLORS = [
  "#a5d8ff",
  "#845ef7",
  "#e64980",
  "#845ef7",
  "#a5d8ff",
];

export default function GradientText({
  children,
  className,
  colors = DEFAULT_COLORS,
  animationSpeed = 6,
  showBorder = false,
}: GradientTextProps): React.JSX.Element {
  const reduced = useReducedMotion();
  const rawId = useId();
  // useId() can contain ':' which is invalid in a CSS animation-name.
  const animationName = `gradient-move-${rawId.replace(/[^a-zA-Z0-9_-]/g, "")}`;

  // Repeat the first colour so 0% and 100% match for a seamless loop.
  const stops = [...colors, colors[0]].join(", ");
  const gradient = `linear-gradient(90deg, ${stops})`;

  const animation = reduced
    ? undefined
    : `${animationName} ${animationSpeed}s linear infinite`;

  // Wide gradient so panning background-position produces motion.
  const sharedGradient: React.CSSProperties = {
    backgroundImage: gradient,
    backgroundSize: "300% 100%",
    // Static position when reduced; animation drives it otherwise.
    backgroundPosition: reduced ? "50% 50%" : "0% 50%",
    animation,
  };

  const textStyle: React.CSSProperties = {
    ...sharedGradient,
    display: "inline-block",
    backgroundClip: "text",
    WebkitBackgroundClip: "text",
    // Only the fill is transparent, see ShinyText note; colours here are
    // explicit so we never depend on currentColor.
    WebkitTextFillColor: "transparent",
  };

  const keyframes = !reduced && (
    <style>{`
      @keyframes ${animationName} {
        0% { background-position: 0% 50%; }
        100% { background-position: 100% 50%; }
      }
    `}</style>
  );

  if (!showBorder) {
    return (
      <>
        {keyframes}
        <span className={className} style={textStyle}>
          {children}
        </span>
      </>
    );
  }

  // Bordered pill: outer element carries the moving gradient; the inner opaque
  // pill covers everything but a 1px edge, revealing a thin gradient border.
  return (
    <>
      {keyframes}
      <span
        className={className}
        style={{
          ...sharedGradient,
          display: "inline-flex",
          padding: "1px",
          borderRadius: 999,
        }}
      >
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            padding: "0.25rem 1rem",
            borderRadius: 999,
            // Opaque inner background masks the outer gradient except the edge.
            background: "var(--background, #000)",
          }}
        >
          <span style={textStyle}>{children}</span>
        </span>
      </span>
    </>
  );
}
