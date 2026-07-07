"use client";

import { motion, useReducedMotion } from "motion/react";
import { profile } from "@/content/content";
import { DustReveal } from "./DustReveal";

const UNLOCKS = [
  "Resume.pdf",
  "Hidden commands",
  "Story Mode crossover",
  "Direct contact",
];

export function MissionComplete({ onCrossover }: { onCrossover: () => void }) {
  const reduced = useReducedMotion();

  return (
    <motion.div
      initial={reduced ? undefined : { opacity: 0, y: 10 }}
      animate={reduced ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="my-4 rounded-lg p-4"
      style={{
        border: "1px solid var(--term-accent)",
        background: "color-mix(in oklab, var(--term-accent) 6%, transparent)",
      }}
    >
      <div style={{ color: "var(--term-accent)" }} className="text-base font-semibold">
        Mission Complete
      </div>

      <div className="mt-2 flex items-center gap-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full" style={{ background: "#2a2723" }}>
          <motion.div
            className="h-full rounded-full"
            style={{ background: "var(--term-accent)" }}
            initial={reduced ? { width: "100%" } : { width: 0 }}
            animate={{ width: "100%" }}
            transition={{ duration: reduced ? 0 : 0.8, ease: "easeOut" }}
          />
        </div>
        <span className="text-sm" style={{ color: "var(--term-dim)" }}>
          100%
        </span>
      </div>

      <div className="mt-3 text-xs uppercase tracking-widest" style={{ color: "var(--term-dim)" }}>
        Unlocked
      </div>
      <ul className="mt-1 grid grid-cols-2 gap-x-6 gap-y-1 text-sm sm:grid-cols-4">
        {UNLOCKS.map((u) => (
          <li key={u} style={{ color: "var(--term-ok)" }}>
            ✓ {u}
          </li>
        ))}
      </ul>

      {/* the résumé sleeps under blueprint dust, wipe it away */}
      <div className="mt-4">
        <DustReveal>
          <div
            className="flex h-24 items-center justify-center rounded-lg"
            style={{ border: "1px dashed #3a3630", background: "var(--term-surface)" }}
          >
            <a
              href={profile.links.resume}
              download
              className="press rounded-md px-4 py-2 text-sm font-semibold"
              style={{ background: "var(--term-accent)", color: "var(--term-bg)" }}
            >
              ↓ Download Resume.pdf
            </a>
          </div>
        </DustReveal>
      </div>

      <div className="mt-3 text-xs" style={{ color: "var(--term-dim)" }}>
        psst, the hidden commands: try &apos;coffee&apos;, &apos;quote&apos;, &apos;sudo&apos;…
      </div>

      <div className="mt-4 border-t pt-3" style={{ borderColor: "#2a2723" }}>
        <p className="text-sm" style={{ color: "var(--term-text)" }}>
          You&apos;ve seen what he builds. Want to know why?
        </p>
        <button
          type="button"
          onClick={onCrossover}
          className="mt-2 text-sm font-medium underline-offset-4 hover:underline"
          style={{ color: "var(--term-accent)" }}
        >
          → Enter Story Mode
        </button>
      </div>
    </motion.div>
  );
}
