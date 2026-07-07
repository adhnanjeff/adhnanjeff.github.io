import type { Memory } from "@/lib/memory";
import { isComplete } from "@/lib/memory";
import { projects } from "@/content/content";

/**
 * Byte (Engineer Mode), memory-aware greeting for the terminal narrator.
 * Greets a returning visitor differently and recalls what they explored.
 */
export function byteGreeting(mem: Memory): string[] {
  const first = mem.visitCount <= 1 && mem.sectionsViewed.length === 0;

  if (first) {
    return [
      "Hello, stranger.",
      "I'm Byte, Adhnan built me.",
      "Need a tour? Type 'help', or tap a chip below.",
      "Also: that panel → reacts to your cursor. And 'graph' is draggable. Go on, try stuff.",
    ];
  }

  if (isComplete(mem)) {
    return [
      "You're back, and you've seen everything.",
      "Mind leaving him a message? Type 'ping'.",
    ];
  }

  const last = mem.lastProjectId
    ? projects.find((p) => p.id === mem.lastProjectId)
    : undefined;

  if (last) {
    return [
      "Welcome back.",
      `Last time you looked at ${last.name}.`,
      "Want to keep going? Type 'help'.",
    ];
  }

  return [
    "Welcome back.",
    "Let's pick up where we left off, type 'help'.",
  ];
}

/** Sage (Story Mode), the warm counterpart to Byte, narrating in plain language. */
export function sageStoryLine(mem: Memory): string {
  if (isComplete(mem)) return "You've read the whole thing. Thank you, really.";
  if (mem.visitCount > 1) return "Oh, hey, you came back.";
  return "Hi. I'm Sage. Adhnan built me to show you around.";
}
