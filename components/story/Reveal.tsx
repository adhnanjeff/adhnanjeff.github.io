"use client";

import { motion, useReducedMotion } from "motion/react";
import { EASE_OUT } from "@/lib/motion";

/** Gentle rise + fade on scroll; a plain fade when reduced-motion is set. */
export function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduced ? { opacity: 0 } : { opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -12% 0px" }}
      transition={{ duration: 0.6, ease: EASE_OUT, delay: reduced ? 0 : delay }}
    >
      {children}
    </motion.div>
  );
}
