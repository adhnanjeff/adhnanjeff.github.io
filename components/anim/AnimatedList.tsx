"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";

/**
 * AnimatedList, adapted from reactbits.dev "Animated List".
 *
 * A vertical stack of rows with a single sliding highlight that springs to the
 * hovered/focused row. Rows enter with a `whileInView` stagger. The highlight
 * is positioned by measuring the active row's offsetTop/offsetHeight (kept
 * current via a ResizeObserver) and fades out when nothing is active, staying
 * mounted so it never pops. Keyboard focus is supported (rows are focusable).
 *
 * Colours are entirely caller-driven through the class-name props; nothing is
 * hardcoded. Reduced motion skips the entrance animation.
 */

export type AnimatedListItem = { id: string; content: React.ReactNode };

export interface AnimatedListProps {
  items: AnimatedListItem[];
  /** On the outer container. */
  className?: string;
  /** On each row wrapper. */
  itemClassName?: string;
  /** On the sliding highlight element, caller controls its colour/background. */
  highlightClassName?: string;
  onItemSelect?: (id: string) => void;
  /** Entrance stagger (seconds) per row. */
  stagger?: number;
}

export default function AnimatedList({
  items,
  className,
  itemClassName,
  highlightClassName,
  onItemSelect,
  stagger = 0.04,
}: AnimatedListProps): React.JSX.Element {
  const reduced = useReducedMotion();

  const containerRef = useRef<HTMLUListElement | null>(null);
  const rowRefs = useRef<Array<HTMLLIElement | null>>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [rect, setRect] = useState<{ top: number; height: number } | null>(
    null,
  );

  // Measure the active row's box relative to the container.
  const measure = useCallback(() => {
    if (activeId === null) return;
    const idx = items.findIndex((it) => it.id === activeId);
    const el = rowRefs.current[idx];
    if (!el) return;
    setRect({ top: el.offsetTop, height: el.offsetHeight });
  }, [activeId, items]);

  useEffect(() => {
    measure();
  }, [measure]);

  // Recompute the highlight box when the container reflows.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const ro = new ResizeObserver(() => measure());
    ro.observe(container);
    return () => ro.disconnect();
  }, [measure]);

  const highlightVisible = activeId !== null && rect !== null;

  return (
    <ul
      ref={containerRef}
      className={className}
      style={{
        position: "relative",
        listStyle: "none",
        margin: 0,
        padding: 0,
      }}
    >
      {/* Highlight stays mounted; opacity toggles so it never pops in/out. */}
      <motion.div
        aria-hidden="true"
        className={highlightClassName}
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 0,
          pointerEvents: "none",
          zIndex: 0,
        }}
        initial={false}
        animate={{
          top: rect?.top ?? 0,
          height: rect?.height ?? 0,
          opacity: highlightVisible ? 1 : 0,
        }}
        transition={
          reduced
            ? { duration: 0 }
            : { type: "spring", stiffness: 500, damping: 40 }
        }
      />

      {items.map((item, i) => {
        const activate = () => {
          setActiveId(item.id);
        };
        return (
          <motion.li
            key={item.id}
            ref={(el) => {
              rowRefs.current[i] = el;
            }}
            className={itemClassName}
            tabIndex={0}
            style={{ position: "relative", zIndex: 1 }}
            onMouseEnter={activate}
            onFocus={activate}
            onMouseLeave={() => setActiveId(null)}
            onBlur={() => setActiveId(null)}
            onClick={() => onItemSelect?.(item.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onItemSelect?.(item.id);
              }
            }}
            initial={reduced ? false : { opacity: 0, y: 12 }}
            whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={
              reduced ? { duration: 0 } : { delay: i * stagger, duration: 0.35 }
            }
          >
            {item.content}
          </motion.li>
        );
      })}
    </ul>
  );
}
