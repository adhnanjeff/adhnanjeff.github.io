"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";

const BOOT_LINES = [
  "Initializing byteOS…",
  "Loading projects…",
  "Loading coffee…",
  "Coffee loaded.",
  "Click. Clack. Full-Stackkk.",
  "Ready.",
];

/** ~1.5s boot, skippable by click or any key. Reduced-motion skips it. */
export function BootSequence({ onDone }: { onDone: () => void }) {
  const reduced = useReducedMotion();
  const [visible, setVisible] = useState(0);
  const done = useRef(false);

  const finish = () => {
    if (done.current) return;
    done.current = true;
    onDone();
  };

  useEffect(() => {
    if (reduced) {
      setVisible(BOOT_LINES.length);
      finish();
      return;
    }
    const timers: number[] = [];
    BOOT_LINES.forEach((_, i) => {
      timers.push(
        window.setTimeout(() => setVisible(i + 1), 180 + i * 280),
      );
    });
    timers.push(window.setTimeout(finish, 180 + BOOT_LINES.length * 280 + 250));

    const skip = () => {
      timers.forEach(clearTimeout);
      setVisible(BOOT_LINES.length);
      finish();
    };
    window.addEventListener("keydown", skip);
    window.addEventListener("click", skip);
    return () => {
      timers.forEach(clearTimeout);
      window.removeEventListener("keydown", skip);
      window.removeEventListener("click", skip);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced]);

  return (
    <div className="select-none" style={{ color: "var(--term-dim)" }}>
      {BOOT_LINES.slice(0, visible).map((line, i) => (
        <div key={i}>
          <span style={{ color: "var(--term-accent)" }}>›</span> {line}
        </div>
      ))}
      {!reduced && visible < BOOT_LINES.length && (
        <div className="mt-2 text-xs opacity-60">(click or press any key to skip)</div>
      )}
    </div>
  );
}
