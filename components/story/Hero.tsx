"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ByteIllustrated } from "@/components/byte/ByteIllustrated";
import { sageStoryLine } from "@/components/byte/greetings";
import VariableProximity from "@/components/anim/VariableProximity";
import { loadMemory } from "@/lib/memory";
import { profile } from "@/content/content";
import { EASE_OUT } from "@/lib/motion";

export function Hero() {
  const reduced = useReducedMotion();
  const [line, setLine] = useState("Hi. I'm Sage. Adhnan built me to show you around.");
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    setLine(sageStoryLine(loadMemory()));
  }, []);

  const item = {
    hidden: { opacity: 0, y: reduced ? 0 : 16 },
    show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE_OUT } },
  };

  return (
    <section
      ref={sectionRef}
      className="relative mx-auto flex min-h-[78vh] max-w-3xl flex-col justify-center overflow-hidden px-6 pt-20 pb-8"
    >
      {/* the sine-wave texture lives only here, where the airy intro can carry
          it, the denser sections below read cleaner without it competing with
          their divider lines. */}
      <div className="story-waves-bg" aria-hidden />
      <motion.div
        className="relative z-10"
        initial="hidden"
        animate="show"
        variants={{ show: { transition: { staggerChildren: reduced ? 0 : 0.12 } } }}
      >
        {/* the name, quiet and static; nobody hovers a name on purpose */}
        <motion.p
          variants={item}
          className="mb-1 text-sm font-medium uppercase tracking-[0.32em]"
          style={{ color: "var(--story-ink)" }}
        >
          {profile.name}
        </motion.p>

        <motion.p
          variants={item}
          className="mb-8 text-xs uppercase tracking-[0.28em]"
          style={{ color: "var(--story-accent)" }}
        >
          {profile.role}
        </motion.p>

        <motion.div variants={item} className="mb-8 flex items-center gap-4">
          <ByteIllustrated size={72} />
          <p className="max-w-xs text-sm italic" style={{ color: "var(--story-muted)" }}>
            {line}
          </p>
        </motion.div>

        {/* the tagline, cursor passes over this naturally while reading,
            so the interactive weight/optical-size effect lives here instead
            of on the name. */}
        <motion.div
          variants={item}
          className="text-[clamp(2rem,5.5vw,3.8rem)] leading-[1.06]"
          style={{ fontFamily: "var(--font-display), serif", fontWeight: 500 }}
        >
          <VariableProximity
            label={profile.taglineStory}
            containerRef={sectionRef}
            radius={200}
            fromFontVariationSettings="'wght' 500, 'opsz' 24"
            toFontVariationSettings="'wght' 800, 'opsz' 48"
          />
        </motion.div>

        <motion.p
          variants={item}
          className="mt-6 max-w-xl text-lg leading-relaxed"
          style={{ color: "var(--story-muted)" }}
        >
          {profile.bioStory}
        </motion.p>

        {/* Story Mode's own creed, never the Engineer quote */}
        <motion.p
          variants={item}
          className="mt-8 text-lg italic"
          style={{ fontFamily: "var(--font-display), serif", color: "var(--story-ink)" }}
        >
          &ldquo;{profile.quoteStory}&rdquo;
        </motion.p>

        <motion.div
          variants={item}
          className="mt-10 flex items-center gap-2 text-sm"
          style={{ color: "var(--story-muted)" }}
        >
          <span className="inline-block h-px w-8" style={{ background: "var(--story-line)" }} />
          scroll to read
        </motion.div>
      </motion.div>
    </section>
  );
}
