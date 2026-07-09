"use client";

import { Reveal } from "./Reveal";
import { changelogByDate, latestUpdate } from "@/lib/changelog";

/** Latest few changes, straight from git, so the story never reads finished. */
export function StillWriting() {
  const recent = changelogByDate()
    .flatMap((g) => g.entries)
    .slice(0, 3);
  const updated = latestUpdate();
  if (recent.length === 0) return null;

  return (
    <section className="border-t py-16" style={{ borderColor: "var(--story-line)" }}>
      <Reveal>
        <p
          className="mb-4 text-xs uppercase tracking-[0.25em]"
          style={{ color: "var(--story-accent)" }}
        >
          Still being written
        </p>
        <h2
          className="mb-6 text-2xl sm:text-3xl"
          style={{ fontFamily: "var(--font-display), serif", fontWeight: 500 }}
        >
          This site rewrites itself.
        </h2>
        <p className="mb-6 max-w-xl text-lg" style={{ color: "var(--story-muted)" }}>
          Every change here ships straight from git history, no hand-edited news
          section. The latest:
        </p>
        <div className="space-y-3">
          {recent.map((e) => (
            <div key={e.hash} className="flex items-baseline gap-3">
              <span
                className="shrink-0 text-xs tabular-nums"
                style={{ color: "var(--story-accent)" }}
              >
                {e.date}
              </span>
              <span className="text-sm sm:text-base" style={{ color: "var(--story-ink)" }}>
                {e.subject}
              </span>
            </div>
          ))}
        </div>
        {updated && (
          <p className="mt-6 text-sm" style={{ color: "var(--story-muted)" }}>
            Last updated {updated}. The full log lives in Engineer Mode, type
            &lsquo;log&rsquo; in the terminal.
          </p>
        )}
      </Reveal>
    </section>
  );
}
