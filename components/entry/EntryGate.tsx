"use client";

import { motion, useReducedMotion } from "motion/react";
import { useMode } from "./ModeProvider";
import DecryptedText from "@/components/anim/DecryptedText";
import { CursorDrivenParticleTypography } from "@/components/ui/cursor-driven-particle-typography";
import type { Mode } from "@/lib/mode";
import { EASE_OUT } from "@/lib/motion";
import { profile } from "@/content/content";

/**
 * The signature entry moment, "two ways of knowing me". Newcomers pick a
 * way in; the choice persists and is switchable later. Returning visitors
 * skip this (handled in ModeProvider).
 */
export function EntryGate() {
  const { enter, returning } = useMode();
  const reduced = useReducedMotion();

  const container = {
    hidden: {},
    show: {
      transition: { staggerChildren: reduced ? 0 : 0.12, delayChildren: 0.1 },
    },
  };
  const item = {
    hidden: { opacity: 0, y: reduced ? 0 : 14 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE_OUT } },
  };

  return (
    <motion.main
      initial="hidden"
      animate="show"
      exit={{ opacity: 0, transition: { duration: 0.4 } }}
      variants={container}
      className="relative flex min-h-dvh flex-col items-center justify-center px-6"
      style={{ background: "var(--story-bg)", color: "var(--story-ink)" }}
    >
      <motion.p
        variants={item}
        className="mb-4 text-xs uppercase tracking-[0.25em]"
        style={{ color: "var(--story-muted)" }}
      >
        {returning ? "Welcome back" : profile.role}
      </motion.p>

      {/* Signature moment: the name as ink-dust particles that scatter under
          the cursor and re-settle into the letters. The one bold element here,
          everything below it stays quiet. */}
      <motion.div
        variants={item}
        className="relative h-[clamp(88px,17vw,150px)] w-full max-w-2xl"
      >
        <CursorDrivenParticleTypography text={profile.name} color="var(--story-ink)" />
      </motion.div>

      <motion.h1
        variants={item}
        className="mt-6 max-w-2xl text-center text-2xl leading-tight sm:text-3xl"
        style={{ fontFamily: "var(--font-display), serif", fontWeight: 500 }}
      >
        Two ways of knowing me.
      </motion.h1>

      <motion.p
        variants={item}
        className="mt-4 max-w-md text-center text-base"
        style={{ color: "var(--story-muted)" }}
      >
        Same person, two front doors. Pick the one that fits how you think,
        you can switch anytime.
      </motion.p>

      <motion.div
        variants={item}
        className="mt-12 grid w-full max-w-2xl gap-4 sm:grid-cols-2"
      >
        <GateCard
          onClick={() => enter("engineer")}
          kicker="for engineers"
          title="Engineer Mode"
          body="A real terminal. Stack, architecture, trade-offs, and a system diagram that comes alive."
          cta="$ boot"
          dark
          decrypt
        />
        <GateCard
          onClick={() => enter("story")}
          kicker="for humans"
          title="Story Mode"
          body="A calmer read. Why the work matters, in plain language, with Sage to walk you through."
          cta="Read →"
        />
      </motion.div>

      <motion.button
        variants={item}
        type="button"
        onClick={() => enter("story")}
        className="mt-8 text-sm underline-offset-4 hover:underline"
        style={{ color: "var(--story-muted)" }}
      >
        Not sure? Just take me in →
      </motion.button>
    </motion.main>
  );
}

function GateCard({
  onClick,
  kicker,
  title,
  body,
  cta,
  dark = false,
  decrypt = false,
}: {
  onClick: () => void;
  kicker: string;
  title: string;
  body: string;
  cta: string;
  dark?: boolean;
  decrypt?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative flex flex-col items-start rounded-2xl p-6 text-left transition-transform duration-300 hover:-translate-y-1"
      style={
        dark
          ? {
              background: "var(--term-bg)",
              color: "var(--term-text)",
              border: "1px solid #2a2723",
            }
          : {
              background: "#fff",
              color: "var(--story-ink)",
              border: "1px solid var(--story-line)",
            }
      }
    >
      <span
        className="text-[11px] uppercase tracking-[0.2em]"
        style={{
          color: dark ? "var(--term-accent)" : "var(--story-accent)",
          fontFamily: dark ? "var(--font-mono), monospace" : undefined,
        }}
      >
        {kicker}
      </span>
      <span
        className="mt-2 text-2xl"
        style={{
          fontFamily: dark
            ? "var(--font-mono), monospace"
            : "var(--font-display), serif",
          fontWeight: 500,
        }}
      >
        {decrypt ? (
          <DecryptedText text={title} animateOn="view" sequential speed={45} />
        ) : (
          title
        )}
      </span>
      <span
        className="mt-3 text-sm leading-relaxed"
        style={{ color: dark ? "var(--term-dim)" : "var(--story-muted)" }}
      >
        {body}
      </span>
      <span
        className="mt-5 inline-flex items-center gap-1 text-sm font-medium transition-transform duration-300 group-hover:translate-x-0.5"
        style={{
          color: dark ? "var(--term-accent)" : "var(--story-accent)",
          fontFamily: dark ? "var(--font-mono), monospace" : undefined,
        }}
      >
        {cta}
      </span>
    </button>
  );
}
