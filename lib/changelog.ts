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
