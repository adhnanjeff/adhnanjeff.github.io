"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useMode } from "@/components/entry/ModeProvider";
import { ByteFaceIcon } from "@/components/byte/ByteFaceIcon";
import type { ProjectStory as Story } from "@/content/content";

/**
 * Story Mode's project experience, the counterpart to Engineer Mode's
 * inspectable architecture. The visitor first *feels* the problem by making
 * a decision (the playable incident), then watches it resolve scene by scene,
 * and finally is handed off to Engineer Mode to see how it's really built.
 *
 * Deliberately hides implementation (Kafka, HMAC, Isolation Forest…). Those
 * belong to the terminal.
 */
export function ProjectStory({
  story,
  hasArchitecture,
}: {
  story: Story;
  hasArchitecture?: boolean;
}) {
  const reduced = useReducedMotion();
  const { setMode } = useMode();
  const [picked, setPicked] = useState<number | null>(null);

  return (
    <div className="space-y-10">
      {/* the hook */}
      <p className="ps-hook max-w-2xl">{story.hook}</p>

      {/* the playable incident */}
      {story.incident && (
        <div className="ps-incident">
          <pre className="ps-frame">{story.incident.frame.join("\n")}</pre>

          <p className="mt-4 text-base font-medium" style={{ color: "var(--story-ink)" }}>
            {story.incident.prompt}
          </p>

          <div className="mt-3 flex flex-wrap gap-3">
            {story.incident.choices.map((c, i) => (
              <button
                key={c.label}
                type="button"
                onClick={() => setPicked(i)}
                className="ps-choice"
                data-picked={picked === i ? "" : undefined}
                data-faded={picked !== null && picked !== i ? "" : undefined}
              >
                {c.label}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {picked !== null && (
              <motion.div
                key={picked}
                initial={reduced ? undefined : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduced ? undefined : { opacity: 0, y: -6 }}
                transition={{ duration: 0.3 }}
                className="mt-5"
              >
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 shrink-0">
                    <ByteFaceIcon size={34} />
                  </span>
                  <div>
                    <p className="ps-byte">{story.incident.choices[picked].byte}</p>
                    <div className="mt-2 space-y-0.5">
                      {story.incident.choices[picked].result.map((line) => (
                        <div key={line} className="ps-result-line">
                          {line}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <p className="ps-insight mt-5 max-w-xl">{story.incident.insight}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {picked === null && (
            <p className="mt-3 text-xs" style={{ color: "var(--story-muted)" }}>
              Make a call, Byte will tell you what happens.
            </p>
          )}
        </div>
      )}

      {/* the storyboard */}
      <div>
        <p className="mb-5 text-xs uppercase tracking-[0.22em]" style={{ color: "var(--story-accent)" }}>
          How it unfolds
        </p>
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "0px 0px -12% 0px" }}
          variants={{ show: { transition: { staggerChildren: reduced ? 0 : 0.12 } } }}
        >
          {story.scenes.map((s, i) => (
            <motion.div
              key={s.title}
              className="ps-scene"
              variants={{
                hidden: { opacity: 0, y: reduced ? 0 : 14 },
                show: { opacity: 1, y: 0, transition: { duration: 0.45 } },
              }}
            >
              <span className="ps-scene-num" aria-hidden>
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="ps-scene-title">{s.title}</div>
              <p className="ps-scene-caption">{s.caption}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* the outcome */}
      <div className="grid grid-cols-3 gap-4 border-y py-6" style={{ borderColor: "var(--story-line)" }}>
        {story.outcome.map((o) => (
          <div key={o.label}>
            <div
              className="text-[clamp(1.4rem,4vw,2.4rem)] leading-none"
              style={{ fontFamily: "var(--font-display), serif", fontWeight: 500, color: "var(--story-ink)" }}
            >
              {o.value}
            </div>
            <div className="mt-1.5 text-xs sm:text-sm" style={{ color: "var(--story-muted)" }}>
              {o.label}
            </div>
          </div>
        ))}
      </div>

      {/* cross-mode bridge */}
      {hasArchitecture && (
        <button type="button" onClick={() => setMode("engineer")} className="ps-bridge">
          Curious how it actually works? Open it in Engineer Mode →
        </button>
      )}
    </div>
  );
}
