# Git-Sourced Changelog — Design Spec

**Date:** 2026-07-08
**Status:** Approved by Adhnan (chat, 2026-07-08)

## Goal

The portfolio should show ongoing growth without manual content edits. Two layers:

1. **Baked changelog** — the portfolio repo's own git history, regenerated at every build. Updates automatically on every push because GitHub Actions rebuilds the static export.
2. **Live GitHub pulse** — the visitor's browser fetches Adhnan's public GitHub events, so activity on *any* public repo (new projects included) shows up with zero portfolio changes.

## Constraints (verified against source)

- Static export (`output: "export"`) on GitHub Pages — no server, no secrets. Anything shipped to the browser is public, so no authenticated GitHub API calls.
- `runCommand` in `components/terminal/commands.ts` is synchronous and returns a `CommandResult` of declarative flags that `Terminal.tsx` interprets (`openKnowledge`, `switchMode`, …). Async work belongs in Terminal, triggered by a flag.
- CI checkout (`actions/checkout@v4`) is shallow by default — build-time `git log` sees one commit unless `fetch-depth: 0` is set.
- No test framework in the repo. Verification = script run + `npm run build` + lint + preview-server checks.
- Site copy rule: no em-dashes in visible copy.

## Components

### 1. `scripts/generate-changelog.mjs` (new)

- Runs `git log --format=<hash|date|subject>` (date=short, newest first), skips merge commits.
- Writes `content/changelog.generated.json`:
  ```json
  {
    "generatedAt": "2026-07-08T12:00:00.000Z",
    "commits": [
      { "hash": "c7bbd9d", "date": "2026-07-07", "subject": "Fix mid-word line breaks in ScrollFloat, add constellation click hint" }
    ]
  }
  ```
- If `git` fails (no repo, no git binary), leave the existing file untouched and exit 0 with a warning — never break the build.
- The generated file is committed so the import never dangles; CI regenerates it fresh on every build so staleness in git is harmless.

### 2. Build wiring

- `package.json`: add `"prebuild": "node scripts/generate-changelog.mjs"` and `"predev"` likewise.
- `.github/workflows/deploy.yml`: `fetch-depth: 0` on the checkout step.

### 3. `lib/changelog.ts` (new)

Typed accessor over the generated JSON: `ChangelogEntry { hash, date, subject }`, `getChangelog()` (all entries newest first), `latestUpdate()` (most recent date). Single import point so consumers never touch the JSON shape directly.

### 4. `log` command (`components/terminal/commands.ts`)

- New case `log`, aliases `changelog` and `updates` (via `ALIASES`).
- Output: short Byte-voiced intro, latest ~8 entries grouped by date, then a dim "checking what he's shipping elsewhere…" line.
- Returns `panel: { kind: "changelog" }` and new flag `livePulse: true`.
- `CommandResult` gains `livePulse?: boolean`. `PanelSpec` gains `{ kind: "changelog" }`.

### 5. Live pulse (`lib/githubPulse.ts`, new)

- Username parsed from `profile.links.github` (single source of truth).
- Fetch `https://api.github.com/users/<user>/events/public`.
- Condense `PushEvent` / `PullRequestEvent` / `CreateEvent` (repo/tag) / `ReleaseEvent` into friendly strings: `pushed 3 commits to adhnanjeff/xyz · 2h ago`. Collapse consecutive same-repo pushes. Cap at ~6 lines.
- Cache the condensed result in `sessionStorage` (key `gh-pulse-v1`) with a 10-minute TTL.
- On any failure (network, rate limit, non-200): return a single dim line telling the visitor the baked log above is still current. Never an error tone that breaks the vibe.
- `Terminal.tsx`: when a result has `livePulse`, call the fetcher and `pushOutput` the resolved lines.

### 6. Workspace changelog panel (`components/terminal/Workspace.tsx`)

- Render `{ kind: "changelog" }`: baked entries grouped by date, styled like the existing panels (mono font, tone colors), with the live pulse section appearing under it when the fetch resolves. Reuses `lib/githubPulse.ts`.

### 7. Story Mode section (new component `components/story/StillWriting.tsx`)

- Small section near the end of `StoryHome`: "this story is still being written" register, latest 3 baked entries with dates, last-updated date. Baked data only, no API calls, matches Story Mode's animation idioms (Reveal etc.).

### 8. Discoverability

- `log` chip in `CHIP_META`.
- A line for `log` in Byte's `help` menu and `COMMAND_META`.
- One new `PROMPT_HINTS` entry ("try 'log', this site updates itself").

## Error handling summary

| Failure | Behavior |
|---|---|
| git unavailable at build | Script warns, keeps existing JSON, exits 0 |
| Shallow clone in CI | Prevented via fetch-depth: 0 |
| GitHub API down / rate-limited | One calm dim line; baked log unaffected |
| Empty events response | Pulse section shows "quiet on GitHub lately" style line |

## Verification

1. Run the script; inspect `content/changelog.generated.json`.
2. `npm run build` (static export must pass), `npm run lint`.
3. Preview server: `log` command output, panel render, Story section, pulse success path, pulse failure path (offline/blocked).
4. CI end-to-end (fetch-depth) proves itself on the next push.

## Implementation split

Sequential subagents to avoid conflicts on shared files:

- **Phase A (Opus):** script, package.json, deploy.yml, `lib/changelog.ts`, `lib/githubPulse.ts`, `log` command + `CommandResult`/`PanelSpec` changes, Terminal `livePulse` wiring, minimal panel stub so the build stays green.
- **Phase B (Sonnet):** full Workspace changelog panel, `StillWriting` Story section, chips/help/hints discoverability.
- Fable reviews and verifies after each phase.

## Out of scope

- Auto-generating project pages for new repos (projects in `builds` remain curated in `content.ts`).
- Any authenticated GitHub API usage.
- Historical archive of cross-repo activity (events API covers ~90 days; the permanent record is this repo's baked history).
