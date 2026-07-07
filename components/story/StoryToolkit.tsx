"use client";

import { motion, useReducedMotion } from "motion/react";
import { skillClusters } from "@/content/content";

/**
 * Story Mode's skills, editorial chips, not the Engineer knowledge graph.
 * Chips stagger in on scroll; hovering wipes each pill full of accent. A
 * filled dot marks a core stack; an outline dot, one I'm still growing into.
 */
export function StoryToolkit() {
  const reduced = useReducedMotion();

  return (
    <div className="grid gap-8 sm:grid-cols-2">
      {skillClusters.map((cluster) => (
        <div key={cluster.key}>
          <h4
            className="mb-3 text-sm font-semibold uppercase tracking-wide"
            style={{ color: "var(--story-ink)" }}
          >
            {cluster.label}
          </h4>
          <motion.div
            className="flex flex-wrap gap-2"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "0px 0px -8% 0px" }}
            variants={{ show: { transition: { staggerChildren: reduced ? 0 : 0.03 } } }}
          >
            {cluster.items.map((it) => (
              <motion.span
                key={it.name}
                variants={{
                  hidden: { opacity: 0, y: reduced ? 0 : 8 },
                  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
                }}
                className="tk-chip"
                data-core={it.prof === "core" ? "" : undefined}
              >
                <span className="tk-fill" aria-hidden />
                <span className="tk-dot" aria-hidden />
                <span className="tk-label">{it.name}</span>
              </motion.span>
            ))}
          </motion.div>
        </div>
      ))}
      <p className="text-xs" style={{ color: "var(--story-muted)" }}>
        <span
          className="mr-1.5 inline-block h-2 w-2 rounded-full align-middle"
          style={{ background: "var(--story-accent)" }}
        />
        core stack
        <span
          className="ml-4 mr-1.5 inline-block h-2 w-2 rounded-full align-middle"
          style={{ border: "1px solid var(--story-muted)" }}
        />
        still growing
      </p>
    </div>
  );
}
