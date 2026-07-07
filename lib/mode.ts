export type Mode = "engineer" | "story";

export const MODE_COOKIE = "myfolio-mode";
/** Story Mode reaches the broadest audience, so it's the default for skippers. */
export const DEFAULT_MODE: Mode = "story";

export function normalizeMode(value: string | undefined | null): Mode {
  return value === "engineer" ? "engineer" : DEFAULT_MODE;
}

/** Read the mode cookie on the client (used to decide whether to show the gate). */
export function readModeCookie(): Mode | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${MODE_COOKIE}=([^;]*)`),
  );
  if (!match) return null;
  return match[1] === "engineer" ? "engineer" : "story";
}

/** Persist the mode for one year and mirror it onto <html> immediately. */
export function writeModeCookie(mode: Mode) {
  if (typeof document === "undefined") return;
  document.cookie = `${MODE_COOKIE}=${mode}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
  applyModeClass(mode);
}

export function applyModeClass(mode: Mode) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.remove("mode-engineer", "mode-story");
  root.classList.add(`mode-${mode}`);
}

export const OTHER_MODE: Record<Mode, Mode> = {
  engineer: "story",
  story: "engineer",
};

export const MODE_LABEL: Record<Mode, string> = {
  engineer: "Engineer Mode",
  story: "Story Mode",
};
