"use client";

import { useEffect } from "react";
import { motion } from "motion/react";
import ShinyText from "@/components/anim/ShinyText";

export type DiagramVariant = "engineer" | "story";

export const DIAGRAM_THEME = {
  engineer: {
    bg: "color-mix(in oklab, var(--term-bg) 94%, black)",
    panel: "var(--term-surface)",
    text: "var(--term-text)",
    dim: "var(--term-dim)",
    accent: "var(--term-accent)",
    ok: "var(--term-ok)",
    line: "#4a443c",
    border: "#2a2723",
    halo: "#12100e",
    font: "var(--font-mono), monospace",
  },
  story: {
    bg: "color-mix(in oklab, var(--story-bg) 96%, #000)",
    panel: "#ffffff",
    text: "var(--story-ink)",
    dim: "var(--story-muted)",
    accent: "var(--story-accent)",
    ok: "#2f9e6f",
    line: "#b9b3a5",
    border: "var(--story-line)",
    halo: "#edebe5",
    font: "var(--font-sans), system-ui, sans-serif",
  },
} as const;

export function DiagramShell({
  variant,
  title,
  subtitle,
  onClose,
  children,
  footer,
}: {
  variant: DiagramVariant;
  title: React.ReactNode;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const t = DIAGRAM_THEME[variant];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <motion.div
      className="fixed inset-0 z-[70] flex flex-col p-4 sm:p-8"
      style={{ background: t.bg }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      role="dialog"
      aria-modal="true"
      aria-label={`Diagram: ${typeof title === "string" ? title : "system"}`}
    >
      <div className="mb-3 flex items-start justify-between gap-4">
        <div style={{ fontFamily: t.font }}>
          <div className="text-base" style={{ color: t.text }}>
            {title}
          </div>
          {subtitle && (
            <div className="mt-0.5 max-w-3xl text-xs" style={{ color: t.dim }}>
              {subtitle}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="press shrink-0 rounded-md px-3 py-1 text-sm"
          style={{
            color: t.accent,
            border: `1px solid color-mix(in oklab, ${t.accent} 50%, transparent)`,
            background: `color-mix(in oklab, ${t.accent} 10%, ${t.panel})`,
            fontFamily: t.font,
          }}
        >
          <ShinyText text="esc ✕" speed={4} />
        </button>
      </div>

      <div className="min-h-0 flex-1">{children}</div>

      {footer && (
        <div
          className="mt-3 flex min-h-[3rem] flex-col gap-1 rounded-lg px-4 py-2 sm:flex-row sm:items-center sm:justify-between"
          style={{ border: `1px solid ${t.border}`, fontFamily: t.font }}
        >
          {footer}
        </div>
      )}
    </motion.div>
  );
}
