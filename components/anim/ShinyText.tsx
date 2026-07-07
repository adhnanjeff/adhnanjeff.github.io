"use client";

import { useId } from "react";
import { useReducedMotion } from "motion/react";

/**
 * ShinyText, a subtle shimmer highlight that sweeps across the text.
 *
 * Implemented with a moving linear-gradient clipped to the glyphs
 * (`background-clip: text` + transparent colour). The required @keyframes are
 * injected via a scoped <style> element, since global CSS cannot be edited.
 * Respects reduced motion (renders static, no sweep).
 */

export interface ShinyTextProps {
  text: string;
  className?: string;
  /** Sweep duration in seconds. */
  speed?: number;
  /** Disable the sweep (renders static). */
  disabled?: boolean;
}

export default function ShinyText({
  text,
  className,
  speed = 5,
  disabled = false,
}: ShinyTextProps): React.JSX.Element {
  const reduced = useReducedMotion();
  const rawId = useId();
  // useId() can contain ':' which is invalid in a CSS animation-name.
  const animationName = `shiny-sweep-${rawId.replace(/[^a-zA-Z0-9_-]/g, "")}`;

  const isStatic = disabled || reduced;

  // The gradient uses currentColor for the base so themes/props drive colour;
  // a translucent white band provides the moving highlight.
  // NOTE: we do NOT set `color: transparent`, because the gradient below uses
  // `currentColor` for its base stops, zeroing the colour would make the base
  // invisible (fatal on light backgrounds). Instead only the *fill* is made
  // transparent so the clipped gradient shows through while `currentColor`
  // still resolves to the inherited text colour.
  const baseStyle: React.CSSProperties = {
    display: "inline-block",
    backgroundImage:
      "linear-gradient(120deg, currentColor 42%, rgba(255, 255, 255, 0.9) 50%, currentColor 58%)",
    backgroundSize: "200% 100%",
    backgroundClip: "text",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  };

  const animatedStyle: React.CSSProperties = isStatic
    ? // Static: plain inherited colour, no gradient/clip trickery.
      { display: "inline-block", color: "currentColor" }
    : {
        ...baseStyle,
        animationName,
        animationDuration: `${speed}s`,
        animationTimingFunction: "linear",
        animationIterationCount: "infinite",
      };

  return (
    <>
      {!isStatic && (
        <style>{`
          @keyframes ${animationName} {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }
        `}</style>
      )}
      <span className={className} style={animatedStyle}>
        {text}
      </span>
    </>
  );
}
