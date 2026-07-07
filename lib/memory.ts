import type { Mode } from "./mode";

/**
 * Visitor memory, client-side only, via localStorage. No backend, no AI.
 * Powers Byte's greetings, crossover timing and the mission system.
 * Absent / cleared / corrupt storage falls back to the first-visit state.
 */
export type Memory = {
  visitCount: number;
  modeChosen?: Mode;
  sectionsViewed: string[];
  lastProjectId?: string;
  completion: number; // 0–100
  resumeUnlocked: boolean;
};

/** The sections the mission tracks toward 100%. */
export const CORE_SECTIONS = ["whoami", "builds", "arsenal", "timeline"] as const;
export type CoreSection = (typeof CORE_SECTIONS)[number];

const KEY = "myfolio-memory-v1";

const EMPTY: Memory = {
  visitCount: 0,
  sectionsViewed: [],
  completion: 0,
  resumeUnlocked: false,
};

export function loadMemory(): Memory {
  if (typeof window === "undefined") return { ...EMPTY };
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return { ...EMPTY };
    const parsed = JSON.parse(raw) as Partial<Memory>;
    return {
      ...EMPTY,
      ...parsed,
      sectionsViewed: Array.isArray(parsed.sectionsViewed)
        ? parsed.sectionsViewed
        : [],
    };
  } catch {
    return { ...EMPTY };
  }
}

export function saveMemory(mem: Memory): Memory {
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(mem));
    } catch {
      /* storage may be full or blocked, degrade gracefully */
    }
  }
  return mem;
}

function computeCompletion(sectionsViewed: string[]): number {
  const seen = CORE_SECTIONS.filter((s) => sectionsViewed.includes(s)).length;
  return Math.round((seen / CORE_SECTIONS.length) * 100);
}

/** Count this visit exactly once per browser session. */
export function registerVisit(): Memory {
  const mem = loadMemory();
  const sessionFlag = "myfolio-session";
  const isNewSession =
    typeof window !== "undefined" &&
    !window.sessionStorage.getItem(sessionFlag);
  if (isNewSession) {
    mem.visitCount += 1;
    try {
      window.sessionStorage.setItem(sessionFlag, "1");
    } catch {
      /* ignore */
    }
  }
  return saveMemory(mem);
}

export function recordMode(mode: Mode): Memory {
  const mem = loadMemory();
  mem.modeChosen = mode;
  return saveMemory(mem);
}

/** Mark a section explored; recomputes completion + resume unlock. */
export function markSectionViewed(section: string): Memory {
  const mem = loadMemory();
  if (!mem.sectionsViewed.includes(section)) {
    mem.sectionsViewed = [...mem.sectionsViewed, section];
  }
  mem.completion = computeCompletion(mem.sectionsViewed);
  if (mem.completion >= 100) mem.resumeUnlocked = true;
  return saveMemory(mem);
}

export function recordLastProject(projectId: string): Memory {
  const mem = loadMemory();
  mem.lastProjectId = projectId;
  return saveMemory(mem);
}

export function isComplete(mem: Memory): boolean {
  return CORE_SECTIONS.every((s) => mem.sectionsViewed.includes(s));
}

export function coreSectionsSeen(mem: Memory): number {
  return CORE_SECTIONS.filter((s) => mem.sectionsViewed.includes(s)).length;
}
