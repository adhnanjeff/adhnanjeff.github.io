"use client";

import { useEffect, useId, useState } from "react";
import { useReducedMotion } from "motion/react";

export type ByteMood = "idle" | "dragging" | "falling" | "dropping";

/**
 * Byte's engineer-mode face, a clean vector rebuild (not ASCII art):
 * rounded head, glowing amber eyes, thin neck to a small "0101" body,
 * soft screen-glow. Purely presentational; blinks on its own.
 */
export function ByteFaceIcon({
  size = 92,
  mood = "idle",
  className = "",
}: {
  size?: number;
  mood?: ByteMood;
  className?: string;
}) {
  const reduced = useReducedMotion();
  const uid = useId().replace(/[:]/g, "");
  const [blink, setBlink] = useState(false);

  useEffect(() => {
    if (reduced) return;
    let alive = true;
    const loop = () => {
      const next = 2400 + Math.random() * 2600;
      window.setTimeout(() => {
        if (!alive) return;
        setBlink(true);
        window.setTimeout(() => alive && setBlink(false), 130);
        loop();
      }, next);
    };
    loop();
    return () => {
      alive = false;
    };
  }, [reduced]);

  const scared = mood === "falling";
  const eyeR = scared ? 5 : 4.2;

  return (
    <svg width={size} height={size * 0.86} viewBox="0 0 92 79" fill="none" className={className} aria-hidden>
      <defs>
        <filter id={`bf-glow-${uid}`} x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="2.6" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <linearGradient id={`bf-head-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#221f1b" />
          <stop offset="100%" stopColor="#151310" />
        </linearGradient>
      </defs>

      {/* neck */}
      <line x1="46" y1="52" x2="46" y2="60" stroke="var(--term-accent)" strokeWidth="2" />
      {/* body */}
      <rect x="24" y="60" width="44" height="18" rx="5" fill={`url(#bf-head-${uid})`} stroke="var(--term-accent)" strokeWidth="1.6" />
      <text x="46" y="72.5" textAnchor="middle" fontFamily="var(--font-mono), monospace" fontSize="9" letterSpacing="1" fill="var(--term-accent)">
        0101
      </text>

      {/* head */}
      <rect x="6" y="4" width="80" height="50" rx="18" fill={`url(#bf-head-${uid})`} stroke="var(--term-accent)" strokeWidth="1.8" />
      <path d="M18 14 Q34 5 54 8" stroke="rgba(229,165,75,0.16)" strokeWidth="5" strokeLinecap="round" fill="none" />

      {/* eyes (squash on blink) */}
      <g style={{ transformBox: "fill-box", transformOrigin: "center" }} transform={blink ? "scale(1,0.12)" : undefined}>
        <circle cx="30" cy="29" r={eyeR} fill="var(--term-accent)" filter={`url(#bf-glow-${uid})`} />
        <circle cx="62" cy="29" r={eyeR} fill="var(--term-accent)" filter={`url(#bf-glow-${uid})`} />
      </g>

      {/* mouth reacts subtly to mood */}
      <path
        d={scared ? "M36 40 Q46 37 56 40" : "M36 39 Q46 45 56 39"}
        stroke="rgba(231,227,220,0.7)"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
