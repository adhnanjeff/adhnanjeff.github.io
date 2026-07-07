import type { Mode } from "@/lib/mode";
import type { Memory } from "@/lib/memory";
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
import { resolveSystemId, systems } from "@/content/systems";

export type Tone = "default" | "dim" | "accent" | "ok" | "err";
export type OutLine = {
  text: string;
  tone?: Tone;
  href?: string;
  action?: string; // clicking runs this command
};

/** What the right-hand workspace panel should show after a command. */
export type PanelSpec =
  | { kind: "dashboard" }
  | { kind: "projects" }
  | { kind: "project"; id: string }
  | { kind: "skills" }
  | { kind: "timeline" }
  | { kind: "certs" }
  | { kind: "contact" };

export type CommandResult = {
  lines?: OutLine[];
  clear?: boolean;
  switchMode?: Mode;
  openSystem?: string; // system-graph id
  openKnowledge?: boolean;
  markSection?: string;
  markProject?: string;
  listing?: "builds" | "help" | null;
  panel?: PanelSpec;
};

export type CommandCtx = {
  memory: Memory;
  lastListing: "builds" | "help" | null;
};

const L = (text: string, tone?: Tone, href?: string): OutLine => ({ text, tone, href });
const A = (text: string, action: string, tone: Tone = "accent"): OutLine => ({ text, tone, action });
const BLANK = L("");

export const COMMAND_META: { name: string; alias?: string; desc: string }[] = [
  { name: "help", desc: "Byte's menu" },
  { name: "whoami", alias: "about", desc: "who Adhnan is" },
  { name: "builds", alias: "projects", desc: "what he's built" },
  { name: "arsenal", alias: "skills", desc: "the tools" },
  { name: "timeline", alias: "experience", desc: "where he's been" },
  { name: "certs", desc: "Claude Code & more" },
  { name: "ping", alias: "contact", desc: "how to reach him" },
];

/** Chips with number badges matching Byte's help menu. */
export const CHIP_META: { cmd: string; badge?: string }[] = [
  { cmd: "help", badge: "?" },
  { cmd: "builds", badge: "1" },
  { cmd: "arsenal", badge: "2" },
  { cmd: "timeline", badge: "3" },
  { cmd: "ping", badge: "4" },
  { cmd: "graph" },
  { cmd: "architecture" },
  { cmd: "certs" },
];

const ALIASES: Record<string, string> = {
  "?": "help",
  about: "whoami",
  projects: "builds",
  ls: "builds",
  skills: "arsenal",
  stack: "arsenal",
  experience: "timeline",
  contact: "ping",
  theme: "story",
  arch: "architecture",
};

function helpMenu(): OutLine[] {
  return [
    L("Hi, I'm Byte. I've worked with Adhnan for years.", "accent"),
    L("Here's what I can show you:", "dim"),
    BLANK,
    L("  1  builds     what he's built"),
    L("  2  arsenal    the tools he works with"),
    L("  3  timeline   where he's been"),
    L("  4  ping       how to reach him"),
    BLANK,
    L("Also: 'certs', 'graph' (his stack as a knowledge graph),", "dim"),
    L("and 'architecture' to explore a system he designed.", "dim"),
    BLANK,
    L("Type a number, a command, or tap a chip below.", "dim"),
  ];
}

function whoami(): OutLine[] {
  return [
    L(profile.name, "accent"),
    L(`${profile.role} · ${profile.location}`, "dim"),
    BLANK,
    L(profile.taglineEngineer),
    BLANK,
    L("Currently: Associate Software Engineer @ eProductivity Software,"),
    L("converted from intern in Jul 2026. Still on enterprise integrations"),
    L("where a wrong number is someone's money."),
    BLANK,
    L(`"${profile.quote}"`, "dim"),
  ];
}

function buildsList(): OutLine[] {
  const out: OutLine[] = [
    L(`${projects.length} projects, flagships first.`, "dim"),
    BLANK,
  ];
  projects.forEach((p, i) => {
    const badge = p.hasArchitecture ? "  ▸ architecture" : p.note ? `  · ${p.note}` : "";
    out.push(L(`  ${String(i + 1).padStart(2, " ")}  ${p.name}${badge}`, "default"));
    out.push(L(`      ${p.stack.join(" · ")}  (${p.year})`, "dim"));
  });
  out.push(BLANK);
  out.push(L("→ type a number or 'open <n>' to inspect one.", "dim"));
  return out;
}

function openProject(index: number): CommandResult {
  const p = projects[index];
  if (!p) return { lines: [L(`no project #${index + 1}. try 'builds'.`, "err")] };
  const lines: OutLine[] = [
    L(p.name, "accent"),
    L(`${p.tag} · ${p.year}${p.note ? " · " + p.note : ""}`, "dim"),
    BLANK,
    L(p.descEngineer),
    BLANK,
    L(`stack: ${p.stack.join(", ")}`, "dim"),
  ];
  if (p.links?.repo) lines.push(L(`repo:  ${p.links.repo}`, "accent", p.links.repo));
  if (p.links?.live) lines.push(L(`live:  ${p.links.live}`, "accent", p.links.live));
  if (p.links?.paper) lines.push(L(`paper: ${p.links.paper}`, "accent", p.links.paper));
  if (p.hasArchitecture) {
    lines.push(BLANK);
    lines.push(A("▸ view the live architecture diagram", `architecture ${p.id}`));
  }
  return { lines, markProject: p.id, panel: { kind: "project", id: p.id } };
}

function arsenal(): OutLine[] {
  const out: OutLine[] = [L("The tools he actually reaches for:", "dim"), BLANK];
  skills.forEach((g) => {
    out.push(L(`  ${g.label}`, "accent"));
    out.push(L(`    ${g.items.join(" · ")}`));
    out.push(BLANK);
  });
  out.push(A("▸ view the stack as a knowledge graph", "arsenal --graph"));
  return out;
}

function timeline(): OutLine[] {
  const out: OutLine[] = [];
  experience.forEach((e) => {
    out.push(L(`${e.period}`, "accent"));
    out.push(L(`  ${e.role}, ${e.company}`));
    out.push(L(`  ${e.place}`, "dim"));
    out.push(L(`  ${e.descEngineer}`, "dim"));
    out.push(BLANK);
  });
  out.push(L(`${education.period}`, "accent"));
  out.push(L(`  ${education.degree}`));
  out.push(L(`  ${education.school}, ${education.place}`, "dim"));
  out.push(BLANK);
  out.push(L("Positions of responsibility:", "dim"));
  responsibilities.forEach((r) => {
    out.push(L(`  ${r.org}`, "default"));
    r.roles.forEach((role) => out.push(L(`    · ${role.role} (${role.period})`, "dim")));
  });
  out.push(BLANK);
  out.push(L("Highlights:", "dim"));
  achievements.forEach((a) => out.push(L(`  · ${a}`, "dim")));
  return out;
}

function certs(): OutLine[] {
  const anthropic = certifications.filter((c) => c.group === "anthropic");
  const other = certifications.filter((c) => c.group === "other");
  const out: OutLine[] = [L("Claude Code, recently completed:", "accent")];
  anthropic.forEach((c) => out.push(L(`  ✓ ${c.name}`, "ok")));
  out.push(BLANK);
  out.push(L("Also:", "dim"));
  other.forEach((c) =>
    out.push(L(`  · ${c.name}${c.detail ? "  (" + c.detail + ")" : ""}, ${c.issuer}`, "dim")),
  );
  return out;
}

function ping(revealEmail: boolean): OutLine[] {
  const out: OutLine[] = [
    L("Reach Adhnan:", "dim"),
    BLANK,
    L(`  github    ${profile.links.github}`, "accent", profile.links.github),
    L(`  linkedin  ${profile.links.linkedin}`, "accent", profile.links.linkedin),
  ];
  if (revealEmail)
    out.push(L(`  email     ${profile.links.email}`, "accent", `mailto:${profile.links.email}`));
  else out.push(L("  email     run 'ping --email' to reveal", "dim"));
  return out;
}

const EGGS: Record<string, OutLine[]> = {
  coffee: [
    L("      ( (", "dim"),
    L("       ) )", "dim"),
    L("    ........", "accent"),
    L("    |      |]", "accent"),
    L("    \\      /", "accent"),
    L("     `----'", "accent"),
    L("brewed. running on this stuff.", "dim"),
  ],
  sudo: [L("nice try. you don't have root here. 🙂", "err")],
  "rm -rf /": [
    L("deleting everything...", "err"),
    L("...", "dim"),
    L("kidding. nothing was harmed.", "ok"),
  ],
  exit: [L("there's no escape. (try 'story' though.)", "dim")],
  date: [L(new Date().toString(), "dim")],
};

export function runCommand(raw: string, ctx: CommandCtx): CommandResult {
  const input = raw.trim();
  if (!input) return {};
  const lower = input.toLowerCase();

  if (/^\d+$/.test(lower)) {
    const n = parseInt(lower, 10);
    if (ctx.lastListing === "builds") return openProject(n - 1);
    const menu: Record<number, string> = { 1: "builds", 2: "arsenal", 3: "timeline", 4: "ping" };
    if (menu[n]) return runCommand(menu[n], ctx);
    return { lines: [L(`nothing at ${n}. try 'help'.`, "err")] };
  }

  if (EGGS[lower]) return { lines: EGGS[lower] };

  const [cmdRaw, ...args] = lower.split(/\s+/);
  const cmd = ALIASES[cmdRaw] ?? cmdRaw;
  const wantsGraph = args.includes("--graph") || args.includes("graph");

  switch (cmd) {
    case "help":
      return { lines: helpMenu(), listing: "help", panel: { kind: "dashboard" } };
    case "whoami":
      return { lines: whoami(), markSection: "whoami", listing: null, panel: { kind: "dashboard" } };
    case "builds":
      return { lines: buildsList(), markSection: "builds", listing: "builds", panel: { kind: "projects" } };
    case "open": {
      const id = args[0];
      if (!id) return { lines: [L("usage: open <number|id>", "dim")] };
      const idx = /^\d+$/.test(id)
        ? parseInt(id, 10) - 1
        : projects.findIndex((p) => p.id === id || p.id.startsWith(id));
      return { ...openProject(idx), markSection: "builds" };
    }
    case "arsenal":
      if (wantsGraph)
        return { lines: [L("opening knowledge graph…", "dim")], openKnowledge: true, markSection: "arsenal" };
      return { lines: arsenal(), markSection: "arsenal", listing: null, panel: { kind: "skills" } };
    case "graph":
      return { lines: [L("opening knowledge graph…", "dim")], openKnowledge: true, markSection: "arsenal" };
    case "timeline":
      return { lines: timeline(), markSection: "timeline", listing: null, panel: { kind: "timeline" } };
    case "certs":
    case "certificates":
      return { lines: certs(), listing: null, panel: { kind: "certs" } };
    case "ping":
      return { lines: ping(args.includes("--email")), listing: null, panel: { kind: "contact" } };
    case "quote":
      return {
        lines: [
          L(`"${profile.quote}"`, "accent"),
          L("the line he actually lives by", "dim"),
        ],
      };
    case "architecture": {
      const sysId = resolveSystemId(args[0]);
      if (!sysId) {
        return {
          lines: [
            L(`no diagram for "${args[0]}". available:`, "err"),
            ...Object.keys(systems).map((k) => A(`  ▸ ${k}`, `architecture ${k}`)),
          ],
        };
      }
      const hint =
        args.length === 0
          ? [BLANK, L("try 'architecture vehicle-security' or 'architecture notification-system'.", "dim")]
          : [];
      return { lines: [L(`opening ${sysId} diagram…`, "dim"), ...hint], openSystem: sysId };
    }
    case "story":
      return { lines: [L("switching to Story Mode…", "dim")], switchMode: "story" };
    case "byte":
    case "pet":
      return { lines: [L("*Byte blinks and does a little spin*, hi.", "accent")] };
    case "clear":
      return { clear: true };
    default:
      return { lines: [L(`command not found: ${cmdRaw}, try 'help'`, "err")] };
  }
}
