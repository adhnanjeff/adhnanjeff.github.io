"use client";

import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "motion/react";
import { useMode } from "./ModeProvider";
import { EntryGate } from "./EntryGate";
import { ModeSwitcher } from "./ModeSwitcher";

// Code-splitting: a visitor downloads only the mode they're in.
const Terminal = dynamic(() => import("@/components/terminal/Terminal"), {
  ssr: false,
});
const StoryHome = dynamic(() => import("@/components/story/StoryHome"), {
  ssr: false,
});

export function AppShell() {
  const { mode, entered, hydrated } = useMode();

  // Until hydration, show a blank in the gate's own colour (the gate always
  // shows first), so there's never a flash of a dark theme behind it.
  if (!hydrated)
    return <div style={{ minHeight: "100dvh", background: "var(--story-bg)" }} />;

  if (!entered) {
    return (
      <AnimatePresence mode="wait">
        <EntryGate key="gate" />
      </AnimatePresence>
    );
  }

  return (
    <>
      <ModeSwitcher />
      <AnimatePresence mode="wait">
        <motion.div
          key={mode}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
        >
          {mode === "engineer" ? <Terminal /> : <StoryHome />}
        </motion.div>
      </AnimatePresence>
    </>
  );
}
