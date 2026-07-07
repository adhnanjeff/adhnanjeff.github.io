"use client";

import { useMode } from "./ModeProvider";
import { MODE_LABEL, OTHER_MODE } from "@/lib/mode";
import ShinyText from "@/components/anim/ShinyText";

/**
 * Always-present switcher, the mode is a preference, not a wall.
 * Styled per mode so it never feels bolted on. The label shimmers in the
 * mode's accent so visitors can always spot the way back to the other mode.
 */
export function ModeSwitcher() {
  const { mode, setMode } = useMode();
  const other = OTHER_MODE[mode];

  const engineer = mode === "engineer";
  const label = engineer ? "→ story mode" : `Switch to ${MODE_LABEL[other]} →`;

  return (
    <button
      type="button"
      onClick={() => setMode(other)}
      title={`Switch to ${MODE_LABEL[other]}`}
      className="press fixed right-4 top-3 z-50 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors sm:right-6 sm:top-4"
      style={
        engineer
          ? {
              fontFamily: "var(--font-mono), monospace",
              color: "var(--term-accent)",
              border: "1px solid color-mix(in oklab, var(--term-accent) 50%, transparent)",
              background: "color-mix(in oklab, var(--term-accent) 10%, var(--term-surface))",
              backdropFilter: "blur(6px)",
            }
          : {
              color: "var(--story-accent)",
              border: "1px solid color-mix(in oklab, var(--story-accent) 45%, transparent)",
              background: "color-mix(in oklab, var(--story-accent) 8%, #fff)",
              backdropFilter: "blur(6px)",
            }
      }
    >
      <ShinyText text={label} speed={4} />
    </button>
  );
}
