"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { DiagramShell, DIAGRAM_THEME } from "@/components/diagram/DiagramShell";
import { skillClusters, projects } from "@/content/content";

/**
 * Story Mode's constellation view, the counterpart to Engineer Mode's
 * knowledge graph, opened the same way (a full-screen overlay) but told a
 * different way. Skills are *stars*; each cluster is a named *constellation*
 * traced across a celestial chart drawn in ink on paper. Projects light up
 * the stars they're made of. No dependency edges, no system diagram, a sky.
 */

const VIEW_W = 1200;
const VIEW_H = 760;

// Hand-placed constellation centres, a pleasing scatter across the chart.
const CENTERS: Record<string, { x: number; y: number }> = {
  languages: { x: 235, y: 170 },
  backend: { x: 620, y: 140 },
  frontend: { x: 985, y: 200 },
  foundations: { x: 500, y: 385 },
  data: { x: 220, y: 560 },
  cloud: { x: 625, y: 615 },
  ai: { x: 985, y: 525 },
};

/** Ring radius grows with the cluster size so stars never crowd. */
const clusterRadius = (n: number) => 40 + n * 7;

/**
 * Which skill-stars each project is built from. Curated on purpose: raw stack
 * strings (".NET 8", "Flask", "scikit-learn", "Amazon S3"…) don't line up 1:1
 * with the star names, and this also lets a project claim the skills it clearly
 * demonstrates (REST, Microservices, Distributed Systems) even when the stack
 * list names a specific library instead. Names must match skillClusters items.
 */
const PROJECT_STARS: Record<string, string[]> = {
  "vehicle-security": ["Python", "Kafka", "MongoDB", "React", "Distributed Systems", "REST APIs", "Postman"],
  "notification-system": ["C#", ".NET / ASP.NET", "Azure Service Bus", "REST APIs", "Microservices", "Distributed Systems", "Angular", "Postman"],
  "split-payment": ["Java", "Spring Boot", "PostgreSQL", "REST APIs", "Database Design", "Docker", "Postman"],
  "invoice-assistant": ["Python", "LangChain", "OpenAI SDK", "PostgreSQL"],
  "smart-traffic": ["Python", "React", "REST APIs", "Postman"],
  "brand-detection": ["Python", "React", "REST APIs", "Postman"],
  "badminton-academy": ["Java", "Spring Boot", "Angular", "MySQL", "AWS", "REST APIs", "Postman"],
  "meeting-room": ["C#", ".NET / ASP.NET", "Angular", "MySQL", "REST APIs", "Postman"],
  "accident-zone": ["Java", "DynamoDB", "AWS"],
};

type Star = {
  id: string;
  name: string;
  core: boolean;
  cluster: string;
  x: number;
  y: number;
  /** Which side of the star its label sits on (so labels fan outward). */
  side: "l" | "r";
  /** Deterministic twinkle phase so stars don't all pulse together. */
  phase: number;
};

/** Deterministic pseudo-random in [0,1) from an integer seed. */
function rand(seed: number): number {
  const s = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}

function buildStars(): Star[] {
  const stars: Star[] = [];
  skillClusters.forEach((cluster, ci) => {
    const center = CENTERS[cluster.key] ?? { x: 600, y: 360 };
    const n = cluster.items.length;
    const radius = clusterRadius(n);
    cluster.items.forEach((item, i) => {
      // Even angular spacing (no jitter), rotated a little per cluster so the
      // shapes don't all read the same — enough room that stars never touch.
      const angle = -Math.PI / 2 + (i / n) * Math.PI * 2 + ci * 0.6;
      const cos = Math.cos(angle);
      stars.push({
        id: `${cluster.key}-${i}`,
        name: item.name,
        core: item.prof === "core",
        cluster: cluster.key,
        x: center.x + cos * radius,
        y: center.y + Math.sin(angle) * radius * 0.92,
        side: cos >= 0 ? "r" : "l",
        phase: rand(ci * 5 + i * 3),
      });
    });
  });
  return stars;
}

/** Resolve a list of star names to the set of star ids in the chart. */
function starIdsForNames(names: string[], stars: Star[]): Set<string> {
  const want = new Set(names);
  return new Set(stars.filter((s) => want.has(s.name)).map((s) => s.id));
}

export function SkillConstellation({ onClose }: { onClose: () => void }) {
  const reduced = useReducedMotion();
  const t = DIAGRAM_THEME.story;
  const familiar = "#9a968f";

  const stars = useMemo(buildStars, []);
  const byId = useMemo(() => new Map(stars.map((s) => [s.id, s])), [stars]);

  // Projects that light up ≥2 stars make good constellations.
  const projConstellations = useMemo(
    () =>
      projects
        .map((p) => ({ id: p.id, name: p.name, stars: starIdsForNames(PROJECT_STARS[p.id] ?? [], stars) }))
        .filter((p) => p.stars.size >= 2),
    [stars],
  );

  // Focus is either a cluster (trace its shape) or a project (its constellation).
  const [focusCluster, setFocusCluster] = useState<string | null>(null);
  const [focusProject, setFocusProject] = useState<string | null>(null);
  const [hoverStar, setHoverStar] = useState<string | null>(null);
  // The project chips are the whole point of this view, but easy to miss
  // among the stars. A hint invites the first click, then gets out of the way.
  const [triedProject, setTriedProject] = useState(false);

  const activeProject = projConstellations.find((p) => p.id === focusProject) ?? null;
  const litIds: Set<string> | null = activeProject
    ? activeProject.stars
    : focusCluster
      ? new Set(stars.filter((s) => s.cluster === focusCluster).map((s) => s.id))
      : null;

  const clearFocus = () => {
    setFocusCluster(null);
    setFocusProject(null);
  };

  // The hovered star's home projects (for the readout caption).
  const hoverStarObj = hoverStar ? byId.get(hoverStar) : null;
  const hoverStarProjects = hoverStarObj
    ? projConstellations.filter((p) => p.stars.has(hoverStar!)).map((p) => p.name)
    : [];

  return (
    <DiagramShell
      variant="story"
      onClose={onClose}
      title={
        <span>
          <span style={{ color: t.accent, fontFamily: "var(--font-display), serif", fontStyle: "italic", fontSize: "1.15rem" }}>
            The stack,{" "}
          </span>
          <span style={{ fontFamily: "var(--font-display), serif", fontStyle: "italic", fontSize: "1.15rem" }}>
            as a sky.
          </span>
        </span>
      }
      subtitle="Every tool is a star; every cluster, a constellation. Hover a star to see what it's part of, or trace a project to watch its constellation light up."
      footer={
        <>
          <div className="flex min-w-0 flex-col gap-1.5">
            {/* impossible-to-miss invite, since the small subtitle text alone
                was easy to skim past. Fades for good on the first real click. */}
            <AnimatePresence>
              {!triedProject && (
                <motion.span
                  className="wb-hover-hint inline-flex w-fit items-center gap-1.5 text-[11px] font-medium"
                  style={{ color: t.accent }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, transition: { duration: 0.4 } }}
                  transition={{ delay: 0.6, duration: 0.4 }}
                >
                  ✦ try clicking a project below, watch its stars light up
                </motion.span>
              )}
            </AnimatePresence>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={clearFocus}
                className="tk-chip"
                data-active={!focusCluster && !focusProject ? "" : undefined}
              >
                <span className="tk-fill" aria-hidden />
                <span className="tk-label">whole sky</span>
              </button>
              {projConstellations.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setFocusCluster(null);
                    setTriedProject(true);
                    setFocusProject((cur) => (cur === p.id ? null : p.id));
                  }}
                  className="tk-chip"
                  data-active={focusProject === p.id ? "" : undefined}
                >
                  <span className="tk-fill" aria-hidden />
                  <span className="tk-label">
                    {p.name.replace(/ System| & Analysis| Settlement System/i, "")}
                  </span>
                </button>
              ))}
            </div>
          </div>
          <div className="mt-1 flex shrink-0 items-center gap-4 text-[12px] sm:mt-0" style={{ color: t.dim }}>
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: t.accent }} />
              core
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ border: `1.5px solid ${familiar}` }} />
              growing
            </span>
          </div>
        </>
      }
    >
      <div className="relative h-full w-full overflow-hidden rounded-xl" style={{ background: t.halo, border: `1px solid ${t.border}` }}>
        <svg
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          className="h-full w-full select-none"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <radialGradient id="cst-star-core" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={t.accent} stopOpacity="1" />
              <stop offset="100%" stopColor={t.accent} stopOpacity="0.65" />
            </radialGradient>
          </defs>

          {/* faint constellation lines within each cluster */}
          {skillClusters.map((cluster) => {
            const pts = stars.filter((s) => s.cluster === cluster.key);
            const dimmed = litIds && !pts.some((p) => litIds.has(p.id));
            const path = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
            return (
              <path
                key={cluster.key}
                d={path}
                fill="none"
                stroke={t.accent}
                strokeWidth={1}
                strokeLinejoin="round"
                opacity={dimmed ? 0.05 : litIds ? 0.14 : 0.12}
                style={{ transition: "opacity 0.5s ease" }}
              />
            );
          })}

          {/* a project's constellation, bright connective path through its stars */}
          {activeProject && (
            <path
              d={stars
                .filter((s) => activeProject.stars.has(s.id))
                .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
                .join(" ")}
              fill="none"
              stroke={t.accent}
              strokeWidth={1.6}
              strokeLinejoin="round"
              opacity={0.55}
              style={{ transition: "opacity 0.5s ease" }}
            />
          )}

          {/* cluster name labels */}
          {skillClusters.map((cluster) => {
            const c = CENTERS[cluster.key] ?? { x: 600, y: 360 };
            const isFocus = focusCluster === cluster.key;
            const dimmed = litIds && !stars.some((s) => s.cluster === cluster.key && litIds.has(s.id));
            return (
              <text
                key={cluster.key}
                x={c.x}
                y={c.y - clusterRadius(cluster.items.length) - 16}
                textAnchor="middle"
                onClick={() => {
                  setFocusProject(null);
                  setFocusCluster((cur) => (cur === cluster.key ? null : cluster.key));
                }}
                style={{
                  cursor: "pointer",
                  fontFamily: "var(--font-display), serif",
                  fontStyle: "italic",
                  fontSize: 15,
                  fill: isFocus ? t.accent : t.dim,
                  opacity: dimmed ? 0.3 : 1,
                  letterSpacing: "0.04em",
                  transition: "opacity 0.5s ease, fill 0.3s ease",
                }}
              >
                {cluster.label}
              </text>
            );
          })}

          {/* stars — every one is labelled so the whole stack is legible */}
          {stars.map((s) => {
            const dim = litIds ? !litIds.has(s.id) : false;
            const isHover = hoverStar === s.id;
            const r = (s.core ? 5.5 : 3.6) + (isHover ? 2.5 : 0);
            const labelX = s.side === "r" ? s.x + r + 5 : s.x - r - 5;
            const labelSize = isHover ? 13 : s.core ? 10.5 : 9.5;
            const labelFill = isHover ? t.text : s.core ? t.dim : familiar;
            return (
              <g
                key={s.id}
                onMouseEnter={() => setHoverStar(s.id)}
                onMouseLeave={() => setHoverStar((h) => (h === s.id ? null : h))}
                style={{ cursor: "pointer", opacity: dim ? 0.2 : 1, transition: "opacity 0.5s ease" }}
              >
                {/* glow halo for core / hovered stars */}
                {(s.core || isHover) && (
                  <circle cx={s.x} cy={s.y} r={r + 6} fill={t.accent} opacity={isHover ? 0.18 : 0.08} />
                )}
                <circle
                  cx={s.x}
                  cy={s.y}
                  r={r}
                  fill={s.core ? "url(#cst-star-core)" : "transparent"}
                  stroke={s.core ? t.accent : familiar}
                  strokeWidth={s.core ? 0 : 1.5}
                  className={reduced ? undefined : "cst-twinkle"}
                  style={{ ["--twk" as string]: `${2.6 + s.phase * 2.2}s`, ["--twd" as string]: `${s.phase * 2}s`, transition: "r 140ms ease" }}
                />
                <text
                  x={labelX}
                  y={s.y + 3.5}
                  textAnchor={s.side === "r" ? "start" : "end"}
                  fontFamily="var(--font-sans), system-ui, sans-serif"
                  fontSize={labelSize}
                  fontWeight={isHover ? 600 : 400}
                  fill={labelFill}
                  style={{ pointerEvents: "none", transition: "font-size 120ms ease, fill 200ms ease" }}
                >
                  {s.name}
                </text>
              </g>
            );
          })}
        </svg>

        {/* readout caption */}
        <div className="pointer-events-none absolute bottom-3 left-4 right-4 text-sm" style={{ color: t.dim }}>
          {hoverStarObj ? (
            <span>
              <span style={{ color: t.text, fontWeight: 600 }}>{hoverStarObj.name}</span>
              {", "}
              {hoverStarObj.core ? "a star I reach for daily" : "still growing into it"}
              {hoverStarProjects.length > 0 && (
                <span>. Lit up in {hoverStarProjects.slice(0, 3).join(", ")}.</span>
              )}
            </span>
          ) : activeProject ? (
            <span>
              Tracing <span style={{ color: t.text, fontWeight: 600 }}>{activeProject.name}</span>, the stars this one is
              built from.
            </span>
          ) : focusCluster ? (
            <span>
              <span style={{ color: t.text, fontWeight: 600 }}>
                {skillClusters.find((c) => c.key === focusCluster)?.label}
              </span>
              , one constellation of the stack.
            </span>
          ) : (
            <span>Hover a star, or trace a project below to light its constellation.</span>
          )}
        </div>
      </div>
    </DiagramShell>
  );
}
