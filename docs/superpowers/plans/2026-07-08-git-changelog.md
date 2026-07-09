# Git-Sourced Changelog Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The portfolio updates itself from git history (baked changelog regenerated at every build) plus a live pulse of Adhnan's public GitHub activity fetched in the visitor's browser.

**Architecture:** A prebuild script bakes `git log` into `content/changelog.generated.json`, which a typed accessor (`lib/changelog.ts`) exposes to a new `log` terminal command, a workspace panel, and a Story Mode section. A client-side fetcher (`lib/githubPulse.ts`) condenses GitHub public events into friendly lines, triggered by a declarative `livePulse` flag on `CommandResult` (same pattern as `openKnowledge`).

**Tech Stack:** Next.js 16 App Router static export (`output: "export"`), React 19 client components, Motion 12 (`motion/react`), Tailwind 4 inline-style theming with CSS variables, Node ESM script (no new dependencies).

## Global Constraints

- Static export on GitHub Pages: no server, no secrets, no authenticated API calls. Anything shipped to the browser is public.
- **No em-dashes in any visible copy** (site-wide rule).
- `runCommand` in `components/terminal/commands.ts` stays synchronous; async work happens in `Terminal.tsx` behind declarative `CommandResult` flags.
- No new npm dependencies. No test framework exists in this repo: each task's verification is a script run, `npm run build`, or `npm run lint` with expected output stated (TDD adapted accordingly).
- This repo's `AGENTS.md`: this Next.js version has breaking changes vs training data. If you touch a Next-specific API you're unsure of, read the matching guide in `node_modules/next/dist/docs/` first. (The tasks below only use client components, JSON imports, and a Node script, all already proven in this repo.)
- Match existing idioms: `L()`/`A()` line builders in commands.ts, `Card`/`Label` helpers and `BORDER` in Workspace.tsx, `Reveal` in Story Mode, tone colors via CSS variables (`--term-*`, `--story-*`).
- Work directly on `main` (established repo practice; deploys go from main).

## Execution assignment

- **Tasks 1-4: Opus subagent** (data pipeline + terminal command + live pulse + discoverability).
- **Tasks 5-6: Sonnet subagent** (workspace panel + Story Mode section), starts only after Tasks 1-4 are committed.
- **Task 7: orchestrator (Fable)** runs final verification.
- Note: discoverability (chips/help/hints) is folded into Phase A because it edits the same two files as Tasks 3-4; Phase B never touches `Terminal.tsx`.

---

### Task 1: Changelog generator script + build wiring

**Files:**
- Create: `scripts/generate-changelog.mjs`
- Create (generated): `content/changelog.generated.json`
- Modify: `package.json` (scripts block, lines 5-10)
- Modify: `.github/workflows/deploy.yml` (checkout step, line 23)

**Interfaces:**
- Produces: `content/changelog.generated.json` with shape `{ generatedAt: string, commits: { hash: string, date: string, subject: string }[] }`, commits newest first, dates `YYYY-MM-DD`. Task 2 imports this file.

- [ ] **Step 1: Write the generator script**

Create `scripts/generate-changelog.mjs`:

```js
#!/usr/bin/env node
/**
 * Regenerates content/changelog.generated.json from git history.
 * Runs as `prebuild`/`predev`. If git is unavailable (building from a
 * tarball, no .git dir), the existing JSON is left untouched so the
 * build never breaks.
 */
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outFile = join(root, "content", "changelog.generated.json");

// %x1f (unit sep) / %x1e (record sep) cannot appear in commit subjects,
// so parsing is safe no matter what a subject contains.
let raw;
try {
  raw = execFileSync(
    "git",
    ["log", "--no-merges", "--date=short", "--format=%h%x1f%ad%x1f%s%x1e"],
    { cwd: root, encoding: "utf8" },
  );
} catch (err) {
  console.warn(`[changelog] git log failed, keeping existing file: ${err.message}`);
  process.exit(0);
}

const commits = raw
  .split("\x1e")
  .map((rec) => rec.trim())
  .filter(Boolean)
  .map((rec) => {
    const [hash, date, subject] = rec.split("\x1f");
    return { hash, date, subject };
  })
  .filter((c) => c.hash && c.date && c.subject);

writeFileSync(
  outFile,
  JSON.stringify({ generatedAt: new Date().toISOString(), commits }, null, 2) + "\n",
);
console.log(`[changelog] wrote ${commits.length} commits to content/changelog.generated.json`);
```

- [ ] **Step 2: Run it and verify the output**

Run: `node scripts/generate-changelog.mjs`
Expected: `[changelog] wrote N commits to content/changelog.generated.json` where N >= 6.

Run: `node -e "const d=require('./content/changelog.generated.json'); if(!d.commits.length) throw new Error('empty'); const c=d.commits[0]; if(!/^[0-9a-f]{7,}$/.test(c.hash)||!/^\d{4}-\d{2}-\d{2}$/.test(c.date)||!c.subject) throw new Error('bad shape: '+JSON.stringify(c)); console.log('shape ok, newest:', c.subject)"`
Expected: `shape ok, newest: <most recent commit subject>`

- [ ] **Step 3: Wire prebuild/predev**

In `package.json`, change the scripts block to:

```json
  "scripts": {
    "predev": "node scripts/generate-changelog.mjs",
    "dev": "next dev",
    "prebuild": "node scripts/generate-changelog.mjs",
    "build": "next build",
    "start": "next start",
    "lint": "eslint"
  },
```

- [ ] **Step 4: Un-shallow the CI checkout**

In `.github/workflows/deploy.yml`, change:

```yaml
      - uses: actions/checkout@v4
```

to:

```yaml
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0 # full history, the changelog is generated from git log
```

- [ ] **Step 5: Commit**

```bash
git add scripts/generate-changelog.mjs content/changelog.generated.json package.json .github/workflows/deploy.yml
git commit -m "Generate a changelog from git history at every build"
```

---

### Task 2: Typed changelog accessor

**Files:**
- Create: `lib/changelog.ts`

**Interfaces:**
- Consumes: `content/changelog.generated.json` from Task 1.
- Produces: `ChangelogEntry { hash: string; date: string; subject: string }`, `getChangelog(): ChangelogEntry[]`, `latestUpdate(): string | null`, `changelogByDate(): { date: string; entries: ChangelogEntry[] }[]`. Tasks 4, 5, 6 import these.

- [ ] **Step 1: Write the accessor**

Create `lib/changelog.ts`:

```ts
import changelogJson from "@/content/changelog.generated.json";

/** One commit from the baked git history. */
export type ChangelogEntry = {
  hash: string;
  /** YYYY-MM-DD */
  date: string;
  subject: string;
};

const data = changelogJson as {
  generatedAt: string;
  commits: ChangelogEntry[];
};

/** All commits, newest first (order comes straight from git log). */
export function getChangelog(): ChangelogEntry[] {
  return data.commits;
}

/** Date of the most recent commit, or null if history is empty. */
export function latestUpdate(): string | null {
  return data.commits[0]?.date ?? null;
}

/** Commits grouped by day, newest day first. */
export function changelogByDate(): { date: string; entries: ChangelogEntry[] }[] {
  const groups: { date: string; entries: ChangelogEntry[] }[] = [];
  for (const c of data.commits) {
    const last = groups[groups.length - 1];
    if (last && last.date === c.date) last.entries.push(c);
    else groups.push({ date: c.date, entries: [c] });
  }
  return groups;
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: exits 0, no output.

- [ ] **Step 3: Commit**

```bash
git add lib/changelog.ts
git commit -m "Add typed accessor over the generated changelog"
```

---

### Task 3: Live GitHub pulse fetcher

**Files:**
- Create: `lib/githubPulse.ts`

**Interfaces:**
- Consumes: `profile.links.github` from `content/content.ts` (value: `"https://github.com/adhnanjeff"`).
- Produces: `PulseLine { text: string; tone: "dim" | "default" | "accent" }`, `fetchGithubPulse(): Promise<PulseLine[]>`. Tasks 4 and 5 import these. Never rejects: all failures resolve to a single calm dim line.

- [ ] **Step 1: Write the fetcher**

Create `lib/githubPulse.ts`:

```ts
/**
 * Live GitHub pulse: condenses Adhnan's recent public GitHub events into
 * short human lines, fetched in the visitor's browser (static export, so
 * no secrets and no server). Results are cached in sessionStorage because
 * unauthenticated GitHub API calls are limited to 60/hour per IP.
 */
import { profile } from "@/content/content";

export type PulseLine = {
  text: string;
  tone: "dim" | "default" | "accent";
};

const CACHE_KEY = "gh-pulse-v1";
const TTL_MS = 10 * 60 * 1000;

const USERNAME = new URL(profile.links.github).pathname.replace(/\//g, "");

type GhEvent = {
  type: string;
  repo?: { name: string };
  created_at: string;
  payload?: {
    commits?: unknown[];
    action?: string;
    ref_type?: string;
  };
};

function timeAgo(iso: string): string {
  const s = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 3600) return `${Math.max(1, Math.floor(s / 60))}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

/** Newest-first events → at most 6 friendly lines, repeat pushes per repo collapsed. */
function condense(events: GhEvent[]): PulseLine[] {
  const lines: PulseLine[] = [];
  const pushedRepos = new Set<string>();
  for (const ev of events) {
    if (lines.length >= 6) break;
    const repo = ev.repo?.name;
    if (!repo) continue;
    const when = timeAgo(ev.created_at);
    if (ev.type === "PushEvent") {
      if (pushedRepos.has(repo)) continue;
      pushedRepos.add(repo);
      const n = ev.payload?.commits?.length ?? 0;
      const what = n === 1 ? "1 commit" : `${n} commits`;
      lines.push({ text: `  ⟳ pushed ${what} to ${repo} · ${when}`, tone: "default" });
    } else if (ev.type === "PullRequestEvent" && ev.payload?.action === "opened") {
      lines.push({ text: `  ⟳ opened a pull request in ${repo} · ${when}`, tone: "default" });
    } else if (ev.type === "CreateEvent" && ev.payload?.ref_type === "repository") {
      lines.push({ text: `  ⟳ created repository ${repo} · ${when}`, tone: "accent" });
    } else if (ev.type === "ReleaseEvent") {
      lines.push({ text: `  ⟳ published a release in ${repo} · ${when}`, tone: "accent" });
    }
  }
  return lines;
}

export async function fetchGithubPulse(): Promise<PulseLine[]> {
  try {
    const cached = sessionStorage.getItem(CACHE_KEY);
    if (cached) {
      const { at, lines } = JSON.parse(cached) as { at: number; lines: PulseLine[] };
      if (Date.now() - at < TTL_MS) return lines;
    }
  } catch {
    // storage unavailable or corrupt: fall through to a fresh fetch
  }

  try {
    const res = await fetch(
      `https://api.github.com/users/${USERNAME}/events/public?per_page=60`,
      { headers: { Accept: "application/vnd.github+json" } },
    );
    if (!res.ok) throw new Error(`GitHub API ${res.status}`);
    const events = (await res.json()) as GhEvent[];
    let lines = condense(events);
    if (lines.length === 0) {
      lines = [{ text: "  quiet on GitHub lately. the log above is the record.", tone: "dim" }];
    }
    try {
      sessionStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), lines }));
    } catch {
      // caching is best-effort
    }
    return lines;
  } catch {
    // failures are not cached, so a later retry can succeed
    return [{ text: "  GitHub isn't answering right now. the log above is still current.", tone: "dim" }];
  }
}
```

- [ ] **Step 2: Verify it compiles and lints**

Run: `npx tsc --noEmit && npm run lint`
Expected: both exit 0.

- [ ] **Step 3: Commit**

```bash
git add lib/githubPulse.ts
git commit -m "Add a live GitHub activity pulse fetcher"
```

---

### Task 4: `log` command, Terminal wiring, discoverability

**Files:**
- Modify: `components/terminal/commands.ts`
- Modify: `components/terminal/Terminal.tsx`

**Interfaces:**
- Consumes: `changelogByDate()` (Task 2), `fetchGithubPulse()`/`PulseLine` (Task 3).
- Produces: `CommandResult.livePulse?: boolean` (Task 5's panel does NOT use this; it fetches directly). `log` command with aliases `changelog`, `updates`. Task 5 adds `panel: { kind: "changelog" }` to this command's return, so keep its return object on one line for an easy later edit.

- [ ] **Step 1: Add the changelog output function to commands.ts**

In `components/terminal/commands.ts`, add after the existing `certs()` function (line ~203):

```ts
function changelog(): OutLine[] {
  const out: OutLine[] = [
    L("what's shipped, straight from git. this updates itself on every push.", "accent"),
    BLANK,
  ];
  let shown = 0;
  for (const g of changelogByDate()) {
    if (shown >= 8) break;
    out.push(L(`  ${g.date}`, "dim"));
    for (const e of g.entries) {
      if (shown >= 8) break;
      out.push(L(`    ✦ ${e.subject}`));
      shown++;
    }
  }
  out.push(BLANK);
  out.push(L("checking what he's shipping elsewhere…", "dim"));
  return out;
}
```

And add the import at the top with the other `@/` imports:

```ts
import { changelogByDate } from "@/lib/changelog";
```

- [ ] **Step 2: Wire the command, flag, aliases, chip, menu**

Still in `commands.ts`:

a. Add to `CommandResult` (after `listing`, line ~41):

```ts
  livePulse?: boolean; // Terminal fetches GitHub activity and appends it
```

b. Add to `ALIASES` (line ~76):

```ts
  changelog: "log",
  updates: "log",
```

c. Add to `COMMAND_META` after the `certs` entry:

```ts
  { name: "log", alias: "changelog", desc: "what shipped, from git" },
```

d. Add to `CHIP_META` after `{ cmd: "certs" }`:

```ts
  { cmd: "log" },
```

e. In `helpMenu()`, replace the two "Also:" lines:

```ts
    L("Also: 'certs', 'graph' (his stack as a knowledge graph),", "dim"),
    L("and 'architecture' to explore a system he designed.", "dim"),
```

with:

```ts
    L("Also: 'certs', 'graph' (his stack as a knowledge graph),", "dim"),
    L("'architecture' to explore a system he designed,", "dim"),
    L("and 'log', what's shipped lately, straight from git.", "dim"),
```

f. Add the switch case before `case "story":`:

```ts
    case "log":
      return { lines: changelog(), listing: null, livePulse: true };
```

- [ ] **Step 3: Wire the async pulse in Terminal.tsx**

a. Add import after the `byteGreeting` import:

```ts
import { fetchGithubPulse } from "@/lib/githubPulse";
```

b. In `submit()`, directly after `if (result.lines) pushOutput(result.lines);`:

```ts
      // Live pulse resolves after the baked log has printed; pushOutput is a
      // stable setState wrapper, so late resolution is safe.
      if (result.livePulse) {
        fetchGithubPulse().then((pulse) =>
          pushOutput(pulse.map((p): OutLine => ({ text: p.text, tone: p.tone }))),
        );
      }
```

c. Add one entry to `PROMPT_HINTS` (after `"try 'coffee'"`):

```ts
  "try 'log', this site updates itself",
```

- [ ] **Step 4: Verify**

Run: `npx tsc --noEmit && npm run lint && npm run build`
Expected: all exit 0; build prints the static export summary including `out/`.

Manual check (orchestrator will re-verify): dev server → type `log` → baked entries grouped by date appear instantly, then within ~2s the pulse lines (or the calm failure line) append. `help` shows the new line; the `log` chip renders; the new hint cycles in the prompt.

- [ ] **Step 5: Commit**

```bash
git add components/terminal/commands.ts components/terminal/Terminal.tsx
git commit -m "Add a 'log' command: baked git changelog plus live GitHub pulse"
```

---

### Task 5: Workspace changelog panel

**Files:**
- Modify: `components/terminal/commands.ts` (PanelSpec + log case, 2 small edits)
- Modify: `components/terminal/Workspace.tsx`

**Interfaces:**
- Consumes: `changelogByDate()` (Task 2), `fetchGithubPulse()`/`PulseLine` (Task 3), existing `Label` helper and `BORDER` const in Workspace.tsx.
- Produces: `PanelSpec` variant `{ kind: "changelog" }`; `log` command now also swaps the workspace panel.

- [ ] **Step 1: Extend PanelSpec and the log case in commands.ts**

a. In the `PanelSpec` union (line ~24), add:

```ts
  | { kind: "changelog" }
```

b. Change the `log` case to:

```ts
    case "log":
      return { lines: changelog(), listing: null, livePulse: true, panel: { kind: "changelog" } };
```

- [ ] **Step 2: Add the panel component to Workspace.tsx**

a. Add imports (top of file, with the other `@/` imports):

```ts
import { changelogByDate } from "@/lib/changelog";
import { fetchGithubPulse, type PulseLine } from "@/lib/githubPulse";
```

b. In the `AnimatePresence` block of `Workspace`, after the `contact` line:

```tsx
            {panel.kind === "changelog" && <Changelog />}
```

c. Add the component after the `Certs()` function, following the file's inline-panel pattern (git-style rail borrowed from `Timeline()`):

```tsx
function Changelog() {
  const groups = changelogByDate();
  const [pulse, setPulse] = useState<PulseLine[] | null>(null);

  useEffect(() => {
    let alive = true;
    fetchGithubPulse().then((lines) => {
      if (alive) setPulse(lines);
    });
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="space-y-4 text-sm">
      <p className="text-xs" style={{ color: "var(--term-dim)" }}>
        generated from git history at build time. every push updates this.
      </p>
      <div className="relative pl-5">
        <div
          className="absolute bottom-1 left-[5px] top-1 w-px"
          style={{ background: "#2a2723" }}
        />
        {groups.map((g) => (
          <div key={g.date} className="relative pb-4">
            <span
              className="absolute -left-5 top-1 inline-block h-[11px] w-[11px] rounded-full"
              style={{ background: "var(--term-accent)", border: "2px solid var(--term-bg)" }}
            />
            <div className="text-xs" style={{ color: "var(--term-accent)" }}>
              {g.date}
            </div>
            <div className="mt-1 space-y-1">
              {g.entries.map((e) => (
                <div key={e.hash} className="flex items-baseline gap-2">
                  <span className="shrink-0 text-[10px] tabular-nums" style={{ color: "var(--term-dim)" }}>
                    {e.hash}
                  </span>
                  <span style={{ color: "var(--term-text)" }}>{e.subject}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div>
        <Label>live from github</Label>
        {pulse === null ? (
          <div className="text-xs" style={{ color: "var(--term-dim)" }}>
            fetching…
          </div>
        ) : (
          <div className="space-y-1 text-xs">
            {pulse.map((p) => (
              <div
                key={p.text}
                style={{
                  color:
                    p.tone === "accent"
                      ? "var(--term-accent)"
                      : p.tone === "dim"
                        ? "var(--term-dim)"
                        : "var(--term-text)",
                }}
              >
                {p.text.trim()}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit && npm run lint && npm run build`
Expected: all exit 0.

Manual check (orchestrator will re-verify): typing `log` swaps the right panel to the changelog view; header shows "changelog"; pulse section fills in after fetch.

- [ ] **Step 4: Commit**

```bash
git add components/terminal/commands.ts components/terminal/Workspace.tsx
git commit -m "Add a changelog workspace panel with the live GitHub pulse"
```

---

### Task 6: Story Mode "still being written" section

**Files:**
- Create: `components/story/StillWriting.tsx`
- Modify: `components/story/StoryHome.tsx` (import + one JSX line between the certs and contact sections)

**Interfaces:**
- Consumes: `changelogByDate()`, `latestUpdate()` (Task 2), `Reveal` from `components/story/Reveal.tsx`.
- Produces: `<StillWriting />` section component. Baked data only, no API calls (Story Mode stays calm).

- [ ] **Step 1: Create the component**

Create `components/story/StillWriting.tsx`:

```tsx
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
```

- [ ] **Step 2: Mount it in StoryHome**

In `components/story/StoryHome.tsx`:

a. Add the import with the other `./` imports:

```ts
import { StillWriting } from "./StillWriting";
```

b. Between the certs section's closing `</section>` and the `{/* Contact + crossover close */}` comment, add:

```tsx
        <StillWriting />
```

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit && npm run lint && npm run build`
Expected: all exit 0.

Manual check (orchestrator will re-verify): Story Mode shows the new section between certificates and "Let's talk.", with the latest 3 commit subjects and the last-updated date.

- [ ] **Step 4: Commit**

```bash
git add components/story/StillWriting.tsx components/story/StoryHome.tsx
git commit -m "Add a 'still being written' section to Story Mode"
```

---

### Task 7: End-to-end verification (orchestrator)

**Files:** none (verification only)

- [ ] **Step 1: Full build + lint from clean state**

Run: `npm run build && npm run lint`
Expected: prebuild regenerates the JSON (log line appears), build emits `out/`, lint passes.

- [ ] **Step 2: Preview checks (dev server)**

- `log` command: baked entries grouped by date, then pulse lines appended (or the calm failure line when offline).
- Aliases `changelog` and `updates` behave identically.
- Workspace panel swaps to changelog; pulse section resolves.
- `help` menu line, `log` chip, and prompt hint all present.
- Story Mode section renders between certs and contact.
- Failure path: block api.github.com (or go offline) and confirm the single dim failure line, no console errors.

- [ ] **Step 3: Confirm with user before push**

CI (`fetch-depth: 0`) proves itself on the next push; the GitHub Actions run must succeed and the live site must show the `log` command working.
