"use client";

import { motion, useReducedMotion } from "motion/react";
import ScrollFloat from "@/components/anim/ScrollFloat";

/**
 * "Path so far", every line floats up into place as you scroll past it,
 * scrubbed continuously rather than firing once. A quiet dot marks each
 * entry; no rigid spine, no block rotation, just the record settling into
 * view a line at a time.
 */
export function StoryTimeline({
  entries,
}: {
  entries: { period: string; title: string; place?: string; body?: string }[];
}) {
  const reduced = useReducedMotion();

  return (
    <div className="space-y-10">
      {entries.map((e) => (
        <div key={`${e.title}-${e.period}`} className="relative grid gap-2 pl-7 sm:grid-cols-[9rem_1fr] sm:pl-0">
          <motion.span
            aria-hidden
            className="absolute left-0 top-1.5 h-[7px] w-[7px] rounded-full sm:-left-7"
            style={{ background: "var(--story-accent)" }}
            initial={reduced ? undefined : { scale: 0 }}
            whileInView={reduced ? undefined : { scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.3 }}
          />
          <div className="text-sm" style={{ color: "var(--story-muted)" }}>
            {reduced ? (
              e.period
            ) : (
              <ScrollFloat containerClassName="inline-block" y={16} stagger={0.015}>
                {e.period}
              </ScrollFloat>
            )}
          </div>
          <div>
            <div className="text-lg font-medium">
              {reduced ? (
                e.title
              ) : (
                <ScrollFloat containerClassName="inline-block" y={22} stagger={0.012}>
                  {e.title}
                </ScrollFloat>
              )}
            </div>
            {e.place && (
              <div className="mb-2 text-sm" style={{ color: "var(--story-muted)" }}>
                {reduced ? (
                  e.place
                ) : (
                  <ScrollFloat containerClassName="inline-block" y={12} stagger={0.01}>
                    {e.place}
                  </ScrollFloat>
                )}
              </div>
            )}
            {e.body && (
              <div className="max-w-2xl leading-relaxed" style={{ color: "var(--story-ink)" }}>
                {reduced ? (
                  e.body
                ) : (
                  // ScrollFloat renders an <h2> internally, a <div> wrapper
                  // (not <p>) keeps this valid HTML.
                  <ScrollFloat containerClassName="inline" y={14} stagger={0.006}>
                    {e.body}
                  </ScrollFloat>
                )}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
