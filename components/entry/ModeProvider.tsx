"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Mode } from "@/lib/mode";
import { applyModeClass, readModeCookie, writeModeCookie } from "@/lib/mode";
import { recordMode, registerVisit } from "@/lib/memory";

type ModeContextValue = {
  mode: Mode;
  /** Whether the visitor has passed the entry gate this render. */
  entered: boolean;
  /** True until we've read the cookie on the client (avoids gate flash). */
  hydrated: boolean;
  /** Number of prior visits (from memory), read once on mount. */
  returning: boolean;
  setMode: (mode: Mode) => void;
  enter: (mode: Mode) => void;
};

const ModeContext = createContext<ModeContextValue | null>(null);

export function ModeProvider({
  initialMode,
  children,
}: {
  initialMode: Mode;
  children: React.ReactNode;
}) {
  const [mode, setModeState] = useState<Mode>(initialMode);
  const [entered, setEntered] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [returning, setReturning] = useState(false);

  // On mount: count the visit. The entry gate ("two ways of knowing me") ALWAYS
  // shows on load, it's the signature moment. A persisted cookie only pre-seeds
  // the default mode (so the theme/switcher match), it no longer skips the gate.
  useEffect(() => {
    const mem = registerVisit();
    const cookieMode = readModeCookie();
    if (cookieMode) {
      setModeState(cookieMode);
      applyModeClass(cookieMode); // keep <html> mode class in sync (no server)
    }
    setReturning(mem.visitCount > 1);
    setHydrated(true);
  }, []);

  const setMode = useCallback((next: Mode) => {
    setModeState(next);
    writeModeCookie(next);
    recordMode(next);
  }, []);

  const enter = useCallback((next: Mode) => {
    setModeState(next);
    writeModeCookie(next);
    recordMode(next);
    setEntered(true);
  }, []);

  const value = useMemo(
    () => ({ mode, entered, hydrated, returning, setMode, enter }),
    [mode, entered, hydrated, returning, setMode, enter],
  );

  return <ModeContext.Provider value={value}>{children}</ModeContext.Provider>;
}

export function useMode() {
  const ctx = useContext(ModeContext);
  if (!ctx) throw new Error("useMode must be used within ModeProvider");
  return ctx;
}
