"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ByteFaceIcon } from "@/components/byte/ByteFaceIcon";
import PixelField from "@/components/anim/PixelField";
import type { PanelSpec } from "./commands";
import type { Memory } from "@/lib/memory";
import { CORE_SECTIONS } from "@/lib/memory";
import {
  profile,
  projects,
  skills,
  experience,
  education,
  certifications,
  achievements,
  responsibilities,
} from "@/content/content";

export type ByteState = {
  coffee: number; // 0–100
  mood: string;
  lastCmd: string;
};

const BORDER = "1px solid #2a2723";

export function Workspace({
  panel,
  byte,
  mem,
  onRun,
  commandCount,
}: {
  panel: PanelSpec;
  byte: ByteState;
  mem: Memory;
  onRun: (cmd: string) => void;
  commandCount: number;
}) {
  const key = panel.kind === "project" ? `project-${panel.id}` : panel.kind;
  return (
    <div
      className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl"
      style={{ border: BORDER, background: "color-mix(in oklab, var(--term-surface) 55%, transparent)" }}
    >
      <div
        className="flex shrink-0 items-center justify-between px-4 py-2 text-[11px] uppercase tracking-widest"
        style={{ borderBottom: BORDER, color: "var(--term-dim)" }}
      >
        <span>
          byte<span style={{ color: "var(--term-accent)" }}>OS</span> · workspace
        </span>
        <span>{panel.kind}</span>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={key}
            className={panel.kind === "dashboard" ? "h-full" : undefined}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
          >
            {panel.kind === "dashboard" && <Dashboard byte={byte} mem={mem} />}
            {panel.kind === "projects" && <Projects onRun={onRun} />}
            {panel.kind === "project" && <ProjectDetail id={panel.id} onRun={onRun} />}
            {panel.kind === "skills" && <Skills onRun={onRun} />}
            {panel.kind === "timeline" && <Timeline />}
            {panel.kind === "certs" && <Certs />}
            {panel.kind === "contact" && <Contact onRun={onRun} />}
          </motion.div>
        </AnimatePresence>
      </div>
      {/* anchors the panel, real session telemetry, not fabricated stats,
          so the card never trails off into empty space */}
      <SessionFooter commandCount={commandCount} />
    </div>
  );
}

function SessionFooter({ commandCount }: { commandCount: number }) {
  const startRef = useRef<number>(Date.now());
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const t = window.setInterval(() => {
      setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
    }, 1000);
    return () => window.clearInterval(t);
  }, []);

  const mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const ss = String(elapsed % 60).padStart(2, "0");

  return (
    <div
      className="flex shrink-0 items-center gap-3 px-4 py-2 text-[10.5px] uppercase tracking-wider"
      style={{ borderTop: BORDER, color: "var(--term-dim)", fontFamily: "var(--font-mono), monospace" }}
    >
      <span>
        session <span style={{ color: "var(--term-text)" }}>{mm}:{ss}</span>
      </span>
      <span aria-hidden>·</span>
      <span>
        queries <span style={{ color: "var(--term-text)" }}>{commandCount}</span>
      </span>
      <span className="ml-auto inline-flex items-center gap-1.5">
        <span
          className="inline-block h-1.5 w-1.5 animate-pulse rounded-full"
          style={{ background: "var(--term-ok)" }}
        />
        listening
      </span>
    </div>
  );
}

/* ---------------------------- pieces ------------------------------ */

function Bar({ value, color = "var(--term-accent)" }: { value: number; color?: string }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ background: "#2a2723" }}>
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{ width: `${value}%`, background: color }}
      />
    </div>
  );
}

function Card({ children, accent = false }: { children: React.ReactNode; accent?: boolean }) {
  return (
    <div
      className="rounded-lg p-3"
      style={{
        border: accent ? "1px solid color-mix(in oklab, var(--term-accent) 55%, transparent)" : BORDER,
        background: "color-mix(in oklab, var(--term-bg) 55%, transparent)",
      }}
    >
      {children}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-1 text-[10px] uppercase tracking-widest" style={{ color: "var(--term-dim)" }}>
      {children}
    </div>
  );
}

function Dashboard({ byte, mem }: { byte: ByteState; mem: Memory }) {
  const battery = Math.max(35, 100 - new Date().getHours() * 2);
  const seen = CORE_SECTIONS.filter((s) => mem.sectionsViewed.includes(s));
  return (
    <div className="flex h-full min-h-0 flex-col gap-2.5 text-sm">
      <div className="flex items-center gap-3">
        <ByteFaceIcon size={52} />
        <div className="flex-1 space-y-1.5">
          <div>
            <span style={{ color: "var(--term-accent)" }}>Byte</span>{" "}
            <span style={{ color: "var(--term-dim)" }}>v1.3, your guide</span>
          </div>
          <div>
            <Label>battery</Label>
            <Bar value={battery} color="var(--term-ok)" />
          </div>
          <div>
            <Label>coffee</Label>
            <Bar value={byte.coffee} />
          </div>
          <div className="flex gap-4 text-xs" style={{ color: "var(--term-dim)" }}>
            <span>
              mood <span style={{ color: "var(--term-text)" }}>{byte.mood}</span>
            </span>
            <span>
              last <span style={{ color: "var(--term-text)" }}>{byte.lastCmd || "·"}</span>
            </span>
          </div>
        </div>
      </div>

      <Card accent>
        <Label>mission progress</Label>
        <div className="flex items-center gap-3">
          <Bar value={mem.completion} />
          <span className="text-xs tabular-nums" style={{ color: "var(--term-dim)" }}>
            {mem.completion}%
          </span>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-1 text-xs">
          {CORE_SECTIONS.map((s) => {
            const done = seen.includes(s);
            return (
              <span key={s} style={{ color: done ? "var(--term-ok)" : "var(--term-dim)" }}>
                {done ? "✓" : "○"} {s}
              </span>
            );
          })}
        </div>
        {mem.resumeUnlocked && (
          <div className="mt-2 text-xs" style={{ color: "var(--term-ok)" }}>
            ✓ Resume.pdf unlocked
          </div>
        )}
      </Card>

      <div className="grid grid-cols-3 gap-2 text-center">
        <Card>
          <div className="text-lg" style={{ color: "var(--term-accent)" }}>
            {projects.length}
          </div>
          <div className="text-[10px] uppercase tracking-wider" style={{ color: "var(--term-dim)" }}>
            projects
          </div>
        </Card>
        <Card>
          <div className="text-lg" style={{ color: "var(--term-accent)" }}>
            {experience.length}
          </div>
          <div className="text-[10px] uppercase tracking-wider" style={{ color: "var(--term-dim)" }}>
            roles
          </div>
        </Card>
        <Card>
          <div className="text-lg" style={{ color: "var(--term-accent)" }}>
            {certifications.length}
          </div>
          <div className="text-[10px] uppercase tracking-wider" style={{ color: "var(--term-dim)" }}>
            certs
          </div>
        </Card>
      </div>

      <p className="text-xs italic leading-relaxed" style={{ color: "var(--term-dim)" }}>
        &ldquo;{profile.quote}&rdquo;
      </p>

      {/* Ambient field grows to fill the quiet space down to the footer: a
          living grid that breathes on its own and blooms under the cursor,
          so the dashboard never trails off into a dead gap. */}
      <div
        className="relative min-h-40 flex-1 overflow-hidden rounded-lg"
        style={{
          border: BORDER,
          background:
            "radial-gradient(120% 120% at 50% 0%, color-mix(in oklab, var(--term-accent) 6%, transparent), transparent 60%)",
        }}
      >
        <PixelField
          cell={16}
          color="var(--term-accent)"
          maxOpacity={0.55}
          radius={120}
          ambient={0.14}
          message="jeff"
        />
        <div
          className="pointer-events-none absolute left-3 top-2.5 text-[10px] uppercase tracking-widest"
          style={{ color: "var(--term-dim)" }}
        >
          ~/byte/ambient
        </div>
        <div
          className="pointer-events-none absolute bottom-2.5 right-3 flex items-center gap-1.5 text-[10px] uppercase tracking-widest"
          style={{ color: "var(--term-dim)" }}
        >
          <span
            className="inline-block h-1.5 w-1.5 animate-pulse rounded-full"
            style={{ background: "var(--term-accent)" }}
          />
          cursor-reactive
        </div>
      </div>
    </div>
  );
}

function Projects({ onRun }: { onRun: (cmd: string) => void }) {
  return (
    <div className="grid gap-2">
      {projects.map((p, i) => (
        <button
          key={p.id}
          type="button"
          onClick={() => onRun(`open ${i + 1}`)}
          className="hover-card rounded-lg p-3 text-left"
          style={{ border: BORDER, background: "color-mix(in oklab, var(--term-bg) 55%, transparent)" }}
        >
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-sm" style={{ color: "var(--term-text)" }}>
              <span style={{ color: "var(--term-accent)" }}>{String(i + 1).padStart(2, "0")}</span>{" "}
              {p.name}
            </span>
            <span className="shrink-0 text-[10px]" style={{ color: "var(--term-dim)" }}>
              {p.year}
            </span>
          </div>
          <div className="mt-1 text-xs" style={{ color: "var(--term-dim)" }}>
            {p.stack.slice(0, 4).join(" · ")}
            {p.hasArchitecture && (
              <span style={{ color: "var(--term-ok)" }}> · ▸ architecture</span>
            )}
            {p.note && <span style={{ color: "var(--term-accent)" }}> · {p.note}</span>}
          </div>
        </button>
      ))}
    </div>
  );
}

function ProjectDetail({ id, onRun }: { id: string; onRun: (cmd: string) => void }) {
  const p = projects.find((x) => x.id === id);
  if (!p) return null;
  return (
    <div className="space-y-3 text-sm">
      <div>
        <div className="text-base" style={{ color: "var(--term-accent)" }}>
          {p.name}
        </div>
        <div className="text-xs" style={{ color: "var(--term-dim)" }}>
          {p.tag} · {p.year}
          {p.note ? ` · ${p.note}` : ""}
        </div>
      </div>
      <p className="leading-relaxed" style={{ color: "var(--term-text)" }}>
        {p.descEngineer}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {p.stack.map((s) => (
          <span
            key={s}
            className="rounded px-2 py-0.5 text-[11px]"
            style={{ border: BORDER, color: "var(--term-dim)" }}
          >
            {s}
          </span>
        ))}
      </div>
      <div className="flex flex-wrap gap-2 pt-1">
        {p.hasArchitecture && (
          <button
            type="button"
            onClick={() => onRun(`architecture ${p.id}`)}
            className="press rounded-md px-3 py-1.5 text-xs font-semibold"
            style={{ background: "var(--term-accent)", color: "var(--term-bg)" }}
          >
            ▸ live architecture
          </button>
        )}
        {p.links?.repo && (
          <a
            href={p.links.repo}
            target="_blank"
            rel="noopener noreferrer"
            className="press rounded-md px-3 py-1.5 text-xs"
            style={{ border: BORDER, color: "var(--term-text)" }}
          >
            github ↗
          </a>
        )}
        {p.links?.paper && (
          <a
            href={p.links.paper}
            target="_blank"
            rel="noopener noreferrer"
            className="press rounded-md px-3 py-1.5 text-xs"
            style={{ border: BORDER, color: "var(--term-text)" }}
          >
            paper ↗
          </a>
        )}
      </div>
    </div>
  );
}

function Skills({ onRun }: { onRun: (cmd: string) => void }) {
  return (
    <div className="space-y-3">
      {skills.map((g) => (
        <div key={g.label}>
          <Label>{g.label}</Label>
          <div className="flex flex-wrap gap-1.5">
            {g.items.map((it) => (
              <span
                key={it}
                className="rounded px-2 py-0.5 text-[11px]"
                style={{ border: BORDER, color: "var(--term-text)" }}
              >
                {it}
              </span>
            ))}
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onRun("graph")}
        className="press mt-1 rounded-md px-3 py-1.5 text-xs font-semibold"
        style={{ background: "var(--term-accent)", color: "var(--term-bg)" }}
      >
        ◆ open the knowledge graph
      </button>
    </div>
  );
}

function Timeline() {
  const entries = [
    ...experience.map((e) => ({
      period: e.period,
      title: `${e.role}, ${e.company}`,
      sub: e.place,
      body: e.descEngineer,
    })),
    {
      period: education.period,
      title: education.degree,
      sub: `${education.school}, ${education.place}`,
      body: "",
    },
  ];
  return (
    <div className="space-y-4 text-sm">
      {/* git-style timeline */}
      <div className="relative pl-5">
        <div
          className="absolute bottom-1 left-[5px] top-1 w-px"
          style={{ background: "#2a2723" }}
        />
        {entries.map((e) => (
          <div key={e.title} className="relative pb-4">
            <span
              className="absolute -left-5 top-1 inline-block h-[11px] w-[11px] rounded-full"
              style={{ background: "var(--term-accent)", border: "2px solid var(--term-bg)" }}
            />
            <div className="text-xs" style={{ color: "var(--term-accent)" }}>
              {e.period}
            </div>
            <div style={{ color: "var(--term-text)" }}>{e.title}</div>
            <div className="text-xs" style={{ color: "var(--term-dim)" }}>
              {e.sub}
            </div>
            {e.body && (
              <p className="mt-1 text-xs leading-relaxed" style={{ color: "var(--term-dim)" }}>
                {e.body}
              </p>
            )}
          </div>
        ))}
      </div>
      <div>
        <Label>positions of responsibility</Label>
        {responsibilities.map((r) => (
          <div key={r.org} className="text-xs" style={{ color: "var(--term-dim)" }}>
            <span style={{ color: "var(--term-text)" }}>{r.org}</span>,{" "}
            {r.roles.map((x) => `${x.role} (${x.period})`).join(" · ")}
          </div>
        ))}
      </div>
      <div>
        <Label>highlights</Label>
        <div className="flex flex-wrap gap-1.5">
          {achievements.map((a) => (
            <span
              key={a}
              className="rounded px-2 py-0.5 text-[11px]"
              style={{ border: BORDER, color: "var(--term-dim)" }}
            >
              {a}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function Certs() {
  const anthropic = certifications.filter((c) => c.group === "anthropic");
  const other = certifications.filter((c) => c.group === "other");
  return (
    <div className="space-y-3">
      <Label>anthropic · claude code</Label>
      <div className="grid grid-cols-2 gap-2">
        {anthropic.map((c) => (
          <div
            key={c.name}
            className="hover-card rounded-lg p-2.5 text-xs"
            style={{
              border: "1px solid color-mix(in oklab, var(--term-ok) 45%, transparent)",
              background: "color-mix(in oklab, var(--term-bg) 55%, transparent)",
              color: "var(--term-text)",
            }}
          >
            <span style={{ color: "var(--term-ok)" }}>✓</span> {c.name}
          </div>
        ))}
      </div>
      <Label>more</Label>
      <div className="space-y-1 text-xs" style={{ color: "var(--term-dim)" }}>
        {other.map((c) => (
          <div key={c.name}>
            · {c.name}
            {c.detail ? ` (${c.detail})` : ""}, {c.issuer}
          </div>
        ))}
      </div>
    </div>
  );
}

function Contact({ onRun }: { onRun: (cmd: string) => void }) {
  return (
    <div className="space-y-3 text-sm">
      <p style={{ color: "var(--term-text)" }}>
        Byte says: <span style={{ color: "var(--term-dim)" }}>he actually replies.</span>
      </p>
      <div className="grid gap-2">
        <a
          href={profile.links.github}
          target="_blank"
          rel="noopener noreferrer"
          className="hover-card rounded-lg p-3"
          style={{ border: BORDER, color: "var(--term-text)" }}
        >
          github <span style={{ color: "var(--term-dim)" }}>↗ @adhnanjeff</span>
        </a>
        <a
          href={profile.links.linkedin}
          target="_blank"
          rel="noopener noreferrer"
          className="hover-card rounded-lg p-3"
          style={{ border: BORDER, color: "var(--term-text)" }}
        >
          linkedin <span style={{ color: "var(--term-dim)" }}>↗ adhnan-jeff</span>
        </a>
        <button
          type="button"
          onClick={() => onRun("ping --email")}
          className="hover-card rounded-lg p-3 text-left"
          style={{ border: BORDER, color: "var(--term-text)" }}
        >
          email <span style={{ color: "var(--term-dim)" }}>· run ping --email to reveal</span>
        </button>
      </div>
    </div>
  );
}
