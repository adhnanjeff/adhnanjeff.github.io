"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useMode } from "@/components/entry/ModeProvider";
import { BootSequence } from "./BootSequence";
import { MissionComplete } from "./MissionComplete";
import { Workspace, type ByteState } from "./Workspace";
import { SystemDiagram } from "@/components/diagram/SystemDiagram";
import { KnowledgeGraph } from "@/components/diagram/KnowledgeGraph";
import ShinyText from "@/components/anim/ShinyText";
import { systems, type SystemGraph } from "@/content/systems";
import { profile } from "@/content/content";
import {
  runCommand,
  CHIP_META,
  type OutLine,
  type Tone,
  type PanelSpec,
} from "./commands";
import {
  loadMemory,
  markSectionViewed,
  recordLastProject,
  isComplete,
  type Memory,
} from "@/lib/memory";
import { byteGreeting } from "@/components/byte/greetings";

type Item =
  | { id: number; kind: "input"; text: string }
  | { id: number; kind: "output"; lines: OutLine[] }
  | { id: number; kind: "mission" };

const toneColor: Record<Tone, string> = {
  default: "var(--term-text)",
  dim: "var(--term-dim)",
  accent: "var(--term-accent)",
  ok: "var(--term-ok)",
  err: "var(--term-err)",
};

let uid = 0;
const nextId = () => ++uid;

// Cycled in the empty prompt as a ghost hint, right where visitors are
// already looking, so the "what do I even type" moment resolves itself.
const PROMPT_HINTS = [
  "try 'help'",
  "try 'graph', it's draggable",
  "hover the panel → it reacts",
  "type anything, go on",
  "try 'coffee'",
];

export default function Terminal() {
  const { setMode } = useMode();
  const [booted, setBooted] = useState(false);
  const [history, setHistory] = useState<Item[]>([]);
  const [input, setInput] = useState("");
  const [hintIndex, setHintIndex] = useState(0);
  const [lastListing, setLastListing] = useState<"builds" | "help" | null>(null);
  const [activeSystem, setActiveSystem] = useState<SystemGraph | null>(null);
  const [showKnowledge, setShowKnowledge] = useState(false);
  const [mem, setMem] = useState<Memory>(() => loadMemory());
  const [missionShown, setMissionShown] = useState(false);
  const [panel, setPanel] = useState<PanelSpec>({ kind: "dashboard" });
  const [byte, setByte] = useState<ByteState>({ coffee: 98, mood: "happy", lastCmd: "" });
  const [clock, setClock] = useState("--:--:--");
  const [commandCount, setCommandCount] = useState(0);

  const cmdHistory = useRef<string[]>([]);
  const histIndex = useRef<number>(-1);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // ambient clock
  useEffect(() => {
    const tick = () =>
      setClock(
        new Date().toLocaleTimeString("en-GB", { hour12: false }),
      );
    tick();
    const t = window.setInterval(tick, 1000);
    return () => window.clearInterval(t);
  }, []);

  // Cycle the ghost hint while the prompt sits empty.
  useEffect(() => {
    if (!booted) return;
    const t = window.setInterval(
      () => setHintIndex((i) => (i + 1) % PROMPT_HINTS.length),
      3600,
    );
    return () => window.clearInterval(t);
  }, [booted]);

  const pushOutput = useCallback((lines: OutLine[]) => {
    setHistory((h) => [...h, { id: nextId(), kind: "output", lines }]);
  }, []);

  // Byte greets the visitor once the boot finishes.
  const onBooted = useCallback(() => {
    setBooted(true);
    const m = loadMemory();
    const greet = byteGreeting(m).map((t, i): OutLine => ({
      text: t,
      tone: i === 0 ? "accent" : "dim",
    }));
    setHistory([{ id: nextId(), kind: "output", lines: greet }]);
    if (isComplete(m)) setMissionShown(true); // already earned previously
  }, []);

  const focusInput = useCallback(() => {
    if (window.getSelection()?.toString()) return; // don't steal text selection
    inputRef.current?.focus();
  }, []);

  // Autoscroll + keep focus as history grows.
  useEffect(() => {
    if (!booted) return;
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
    inputRef.current?.focus();
  }, [history, booted]);

  const submit = useCallback(
    (raw: string) => {
      const text = raw.trim();
      setHistory((h) => [...h, { id: nextId(), kind: "input", text }]);
      if (text) {
        cmdHistory.current.push(text);
        histIndex.current = cmdHistory.current.length;
        setCommandCount((n) => n + 1);
      }

      const result = runCommand(text, { memory: mem, lastListing });

      // Byte reacts
      if (text) {
        const cmd = text.split(/\s+/)[0].toLowerCase();
        setByte((b) => ({
          coffee: cmd === "coffee" ? 100 : Math.max(22, b.coffee - 2),
          mood:
            cmd === "coffee"
              ? "caffeinated"
              : cmd === "byte" || cmd === "pet"
                ? "delighted"
                : cmd === "architecture"
                  ? "curious"
                  : result.lines?.[0]?.tone === "err"
                    ? "puzzled"
                    : "happy",
          lastCmd: cmd,
        }));
      }

      if (result.clear) {
        setHistory([]);
        return;
      }
      if (result.lines) pushOutput(result.lines);
      if (result.listing !== undefined) setLastListing(result.listing);
      if (result.panel) setPanel(result.panel);

      // memory side-effects
      let updated = mem;
      if (result.markSection) updated = markSectionViewed(result.markSection);
      if (result.markProject) updated = recordLastProject(result.markProject);
      if (updated !== mem) setMem(updated);

      // mission complete → append the panel once
      if (!missionShown && isComplete(updated)) {
        setMissionShown(true);
        setHistory((h) => [...h, { id: nextId(), kind: "mission" }]);
      }

      if (result.openSystem) setActiveSystem(systems[result.openSystem] ?? null);
      if (result.openKnowledge) setShowKnowledge(true);
      if (result.switchMode) {
        window.setTimeout(() => setMode(result.switchMode!), 500);
      }
    },
    [mem, lastListing, missionShown, pushOutput, setMode],
  );

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      submit(input);
      setInput("");
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (cmdHistory.current.length === 0) return;
      histIndex.current = Math.max(0, histIndex.current - 1);
      setInput(cmdHistory.current[histIndex.current] ?? "");
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      histIndex.current = Math.min(cmdHistory.current.length, histIndex.current + 1);
      setInput(cmdHistory.current[histIndex.current] ?? "");
    } else if (e.key === "l" && e.ctrlKey) {
      e.preventDefault();
      setHistory([]);
    }
  };

  const runChip = useCallback(
    (cmd: string) => {
      submit(cmd);
      setInput("");
      inputRef.current?.focus();
    },
    [submit],
  );

  return (
    <div
      className="relative flex min-h-dvh w-full justify-center overflow-hidden"
      style={{ background: "var(--term-bg)", color: "var(--term-text)" }}
      onClick={focusInput}
    >
      {/* ambient background, subtle dot grid + a warm glow, barely there */}
      <div aria-hidden className="term-bg-grid pointer-events-none absolute inset-0" />
      <div aria-hidden className="term-bg-glow pointer-events-none absolute inset-0" />

      {/* Full-width workspace (edge-to-edge, capped only for ultra-wide
          monitors) so the header, panel and mode switcher all share the
          same right boundary instead of drifting apart on wide screens. */}
      <div className="relative mx-auto flex h-dvh w-full max-w-[1800px] flex-col px-4 py-5 sm:px-6">
        {/* ambient header, no fake window chrome. pr- clears the fixed
            mode switcher, which now sits flush with this same edge. */}
        <header
          className="mb-4 flex shrink-0 flex-wrap items-center gap-x-4 gap-y-1 pr-32 text-xs sm:pr-40"
          style={{ color: "var(--term-dim)", fontFamily: "var(--font-mono), monospace" }}
        >
          <span>
            adhnan@byte<span style={{ color: "var(--term-accent)" }}>OS</span> ~ engineer
          </span>
          <span aria-hidden>·</span>
          <span className="tabular-nums">{clock}</span>
          <span aria-hidden>·</span>
          <span>{profile.location}</span>
          <span className="ml-auto inline-flex items-center gap-1.5">
            <span
              className="inline-block h-1.5 w-1.5 animate-pulse rounded-full"
              style={{ background: profile.openToWork ? "var(--term-ok)" : "var(--term-accent)" }}
            />
            {profile.status}
          </span>
        </header>

        {/* split workspace: terminal left · dynamic panel right */}
        <div className="flex min-h-0 flex-1 gap-4">
          <section className="flex min-h-0 min-w-0 flex-1 flex-col lg:max-w-[52%]">
            <div
              ref={scrollRef}
              className="min-h-0 flex-1 overflow-y-auto pr-2 text-sm leading-relaxed sm:text-[15px]"
              style={{ fontFamily: "var(--font-mono), monospace" }}
            >
              {!booted ? (
                <BootSequence onDone={onBooted} />
              ) : (
                <>
                  {history.map((item) => {
                    if (item.kind === "input") {
                      return (
                        <div key={item.id} className="mt-2">
                          <span style={{ color: "var(--term-accent)" }}>›</span>{" "}
                          <span>{item.text}</span>
                        </div>
                      );
                    }
                    if (item.kind === "mission") {
                      return (
                        <MissionComplete
                          key={item.id}
                          onCrossover={() => window.setTimeout(() => setMode("story"), 200)}
                        />
                      );
                    }
                    return (
                      <div key={item.id} className="mt-1">
                        {item.lines.map((line, i) =>
                          line.action ? (
                            <button
                              key={i}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                runChip(line.action!);
                              }}
                              className="block text-left underline-offset-2 hover:underline"
                              style={{ color: toneColor[line.tone ?? "accent"] }}
                            >
                              {line.action === "arsenal --graph" ? (
                                <ShinyText text={line.text} speed={4} />
                              ) : (
                                line.text
                              )}
                            </button>
                          ) : line.href ? (
                            <a
                              key={i}
                              href={line.href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block underline-offset-2 hover:underline"
                              style={{ color: toneColor[line.tone ?? "accent"] }}
                            >
                              {line.text}
                            </a>
                          ) : (
                            <div
                              key={i}
                              className="whitespace-pre-wrap"
                              style={{ color: toneColor[line.tone ?? "default"] }}
                            >
                              {line.text || " "}
                            </div>
                          ),
                        )}
                      </div>
                    );
                  })}

                  {/* live prompt */}
                  <div className="relative mt-2 flex items-center">
                    <span style={{ color: "var(--term-accent)" }}>›</span>
                    <span className="ml-2 whitespace-pre">{input}</span>
                    <span className="term-cursor ml-0.5" />
                    <AnimatePresence mode="wait">
                      {input === "" && (
                        <motion.span
                          key={hintIndex}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="ml-2 select-none whitespace-pre"
                          style={{ color: "var(--term-dim)" }}
                        >
                          {PROMPT_HINTS[hintIndex]}
                        </motion.span>
                      )}
                    </AnimatePresence>
                    <input
                      ref={inputRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={onKeyDown}
                      autoFocus
                      spellCheck={false}
                      autoComplete="off"
                      aria-label="Terminal input, type a command"
                      className="absolute inset-0 w-full bg-transparent"
                      style={{ color: "transparent", caretColor: "transparent", outline: "none" }}
                    />
                  </div>
                </>
              )}
            </div>
          </section>

          {/* dynamic workspace, context follows your commands */}
          {booted && (
            <aside className="hidden min-h-0 w-[48%] lg:block">
              <Workspace panel={panel} byte={byte} mem={mem} onRun={runChip} commandCount={commandCount} />
            </aside>
          )}
        </div>

        {/* command chips, numbered like Byte's menu */}
        {booted && (
          <div className="mt-4 flex shrink-0 flex-wrap gap-2">
            {CHIP_META.map(({ cmd, badge }) => {
              const isGraph = cmd === "graph";
              return (
                <button
                  key={cmd}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    runChip(cmd);
                  }}
                  className="term-chip inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs"
                  style={
                    isGraph
                      ? {
                          color: "var(--term-accent)",
                          border: "1px solid color-mix(in oklab, var(--term-accent) 50%, transparent)",
                          background: "color-mix(in oklab, var(--term-accent) 10%, var(--term-surface))",
                          fontFamily: "var(--font-mono), monospace",
                        }
                      : {
                          color: "var(--term-dim)",
                          border: "1px solid #2a2723",
                          fontFamily: "var(--font-mono), monospace",
                        }
                  }
                >
                  {badge && (
                    <span
                      className="inline-flex h-4 w-4 items-center justify-center rounded-sm text-[10px]"
                      style={{
                        background: "color-mix(in oklab, var(--term-accent) 18%, transparent)",
                        color: "var(--term-accent)",
                      }}
                    >
                      {badge}
                    </span>
                  )}
                  {isGraph ? <ShinyText text={`◆ ${cmd}`} speed={4} /> : cmd}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <AnimatePresence>
        {activeSystem && (
          <SystemDiagram
            key="sys"
            graph={activeSystem}
            variant="engineer"
            onClose={() => setActiveSystem(null)}
          />
        )}
        {showKnowledge && (
          <KnowledgeGraph key="kg" variant="engineer" onClose={() => setShowKnowledge(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
