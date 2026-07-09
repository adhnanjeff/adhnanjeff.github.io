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
