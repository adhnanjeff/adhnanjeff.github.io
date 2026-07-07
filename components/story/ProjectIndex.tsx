"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion, useMotionValue, useSpring } from "motion/react";
import type { Project } from "@/content/content";
import { ProjectStory } from "./ProjectStory";

/**
 * "Latest work", a magnetic index. Titles sit quiet until hovered; a
 * floating preview follows the cursor within the list. Click a row to
 * expand the editorial block, then unfold a plain-language walkthrough
 * (Story Mode's counterpart to the Engineer architecture diagram).
 */
export function ProjectIndex({
  projects,
  onHoverProject,
}: {
  projects: Project[];
  onHoverProject?: (id: string) => void;
}) {
  const [hovered, setHovered] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showFlow, setShowFlow] = useState(false);

  // cursor-following preview (spring-smoothed)
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const px = useSpring(mx, { stiffness: 260, damping: 28 });
  const py = useSpring(my, { stiffness: 260, damping: 28 });
  const listRef = useRef<HTMLDivElement>(null);

  const onMove = (e: React.MouseEvent) => {
    const w = 320;
    const h = 220;
    const x = Math.min(e.clientX + 28, window.innerWidth - w - 24);
    const y = Math.min(Math.max(e.clientY - h / 2, 16), window.innerHeight - h - 16);
    mx.set(x);
    my.set(y);
  };

  const toggle = (id: string) => {
    setExpanded((cur) => (cur === id ? null : id));
    setShowFlow(false);
  };

  const previewFor = hovered && hovered !== expanded ? projects.find((p) => p.id === hovered) : null;

  return (
    <div ref={listRef} className="relative" onMouseMove={onMove} onMouseLeave={() => setHovered(null)}>
      {projects.map((p, i) => {
        const isOpen = expanded === p.id;
        const dimmed = hovered !== null && hovered !== p.id && !isOpen;
        return (
          <div key={p.id} className="border-t" style={{ borderColor: "var(--story-line)" }}>
            <button
              type="button"
              onClick={() => toggle(p.id)}
              onMouseEnter={() => {
                setHovered(p.id);
                onHoverProject?.(p.id);
              }}
              className="flex w-full items-baseline justify-between gap-4 py-6 text-left"
              aria-expanded={isOpen}
            >
              <span
                className="text-[clamp(1.7rem,4.5vw,3rem)] leading-tight transition-colors duration-300"
                style={{
                  fontFamily: "var(--font-display), serif",
                  fontWeight: 500,
                  color: dimmed
                    ? "color-mix(in oklab, var(--story-muted) 42%, var(--story-bg))"
                    : "var(--story-ink)",
                }}
              >
                {p.name}
              </span>
              <span
                className="shrink-0 text-sm tabular-nums transition-opacity duration-300"
                style={{ color: "var(--story-muted)", opacity: dimmed ? 0.35 : 1 }}
              >
                {String(i + 1).padStart(2, "0")} · {p.year}
                {p.note ? ` · ${p.note}` : ""}
              </span>
            </button>

            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  key="detail"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden"
                >
                  <div className="pb-8">
                    <p className="max-w-2xl text-lg leading-relaxed" style={{ color: "var(--story-ink)" }}>
                      {p.descStory}
                    </p>

                    <motion.div
                      className="mt-4 flex flex-wrap items-center gap-2"
                      initial="hidden"
                      animate="show"
                      variants={{ show: { transition: { staggerChildren: 0.04, delayChildren: 0.12 } } }}
                    >
                      {p.stack.map((s) => (
                        <motion.span
                          key={s}
                          variants={{ hidden: { opacity: 0, y: 6 }, show: { opacity: 1, y: 0 } }}
                          className="proj-chip rounded-full px-2.5 py-1 text-xs"
                        >
                          {s}
                        </motion.span>
                      ))}
                      {p.note && (
                        <motion.span
                          variants={{ hidden: { opacity: 0, y: 6 }, show: { opacity: 1, y: 0 } }}
                          className="proj-chip proj-chip-note rounded-full px-2.5 py-1 text-xs font-medium"
                        >
                          {p.note}
                        </motion.span>
                      )}
                    </motion.div>

                    <div className="mt-5 flex flex-wrap items-center gap-4 text-sm">
                      {p.story && (
                        <button
                          type="button"
                          onClick={() => setShowFlow((v) => !v)}
                          className="press inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 font-medium"
                          style={{ background: "var(--story-accent)", color: "#fff" }}
                          aria-expanded={showFlow}
                        >
                          {showFlow ? "Close the story" : "▷ Experience it"}
                        </button>
                      )}
                      {p.links?.repo && (
                        <a
                          href={p.links.repo}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium underline-offset-4 hover:underline"
                          style={{ color: "var(--story-accent)" }}
                        >
                          GitHub →
                        </a>
                      )}
                      {p.links?.paper && (
                        <a
                          href={p.links.paper}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium underline-offset-4 hover:underline"
                          style={{ color: "var(--story-accent)" }}
                        >
                          Read the paper →
                        </a>
                      )}
                    </div>

                    <AnimatePresence initial={false}>
                      {showFlow && p.story && (
                        <motion.div
                          key="flow"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                          className="overflow-hidden"
                        >
                          <div className="pt-8">
                            <ProjectStory story={p.story} hasArchitecture={p.hasArchitecture} />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}

      {/* floating live preview, follows the cursor, desktop only */}
      <AnimatePresence>
        {previewFor && (
          <motion.div
            key={previewFor.id}
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.22 }}
            className="pointer-events-none fixed left-0 top-0 z-40 hidden lg:block"
            style={{ x: px, y: py }}
          >
            <ProjectPreview project={previewFor} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ------------------- the floating preview card --------------------- */

function ProjectPreview({ project }: { project: Project }) {
  return (
    <div
      className="w-[320px] overflow-hidden rounded-xl shadow-2xl"
      style={{ background: "#fff", border: "1px solid var(--story-line)" }}
    >
      <div
        className="flex items-center justify-between px-3.5 py-2 text-[11px]"
        style={{ borderBottom: "1px solid var(--story-line)", color: "var(--story-muted)" }}
      >
        <span className="truncate">{project.name}</span>
        <span
          className="ml-2 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium"
          style={{
            color: "var(--story-accent)",
            background: "color-mix(in oklab, var(--story-accent) 10%, transparent)",
          }}
        >
          {project.tag}
        </span>
      </div>
      <div className="flex h-[130px] items-center justify-center" style={{ background: "#f6f5f1" }}>
        <MiniScene tag={project.tag} />
      </div>
      <div className="px-3.5 py-2.5">
        <p className="line-clamp-2 text-xs leading-relaxed" style={{ color: "var(--story-muted)" }}>
          {project.descStory}
        </p>
      </div>
    </div>
  );
}

/* Small living scenes per project family, pure CSS loops. */
function MiniScene({ tag }: { tag: string }) {
  if (tag === "distributed" || tag === "backend") {
    return (
      <div className="msc-flow">
        <span className="msc-node" />
        <span className="msc-node" />
        <span className="msc-node" />
        <span className="msc-dot" />
        <span className="msc-dot msc-dot-2" />
      </div>
    );
  }
  if (tag === "ai-agent") {
    return (
      <div className="msc-chat">
        <span className="msc-bubble" />
        <span className="msc-bubble msc-bubble-r" />
        <span className="msc-bubble" />
      </div>
    );
  }
  if (tag === "computer-vision") {
    return (
      <div className="msc-cv">
        <span className="msc-box" />
        <span className="msc-scan" />
      </div>
    );
  }
  if (tag === "mobile") {
    return (
      <div className="msc-phone">
        <span className="msc-pin" />
        <span className="msc-ring" />
      </div>
    );
  }
  // full-stack & default: a little UI grid
  return (
    <div className="msc-grid">
      {Array.from({ length: 9 }).map((_, i) => (
        <span key={i} style={{ animationDelay: `${(i % 4) * 0.35}s` }} />
      ))}
    </div>
  );
}
