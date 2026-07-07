"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "motion/react";

/**
 * PixelField, adapted from reactbits.dev pixel-grid ideas.
 *
 * A canvas that fills its parent and paints a grid of small squares. Cells near
 * the pointer brighten toward `maxOpacity` with distance falloff; cells outside
 * the influence radius decay toward 0 each frame, leaving a trailing fade. The
 * canvas is DPR-scaled and resized via a ResizeObserver on the parent so it
 * always matches the container.
 *
 * `color` defaults to "currentColor", resolved once from the canvas's computed
 * colour (canvas fills can't use the CSS keyword directly). Reduced motion
 * draws a single faint static grid with no pointer tracking or RAF loop.
 */

export interface PixelFieldProps {
  /** Sizes the canvas via its parent; the canvas fills 100% of the container. */
  className?: string;
  /** Px grid cell size. */
  cell?: number;
  /** Fill colour; "currentColor" is resolved from computed style once. */
  color?: string;
  maxOpacity?: number;
  /** Px radius of mouse influence. */
  radius?: number;
  /** Idle "breathing" shimmer amplitude (0 = fully dark when the cursor is
   *  away). A diagonal wave keeps the field alive without the pointer. */
  ambient?: number;
  /** A word hidden in the grid that only lights up where the cursor sweeps
   *  over it, like uncovering ink with a flashlight. */
  message?: string;
}

export default function PixelField({
  className,
  cell = 16,
  color = "currentColor",
  maxOpacity = 0.55,
  radius = 110,
  ambient = 0,
  message,
}: PixelFieldProps): React.JSX.Element {
  const reduced = useReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Resolve "currentColor" to a concrete rgb once from computed style.
    const resolvedColor =
      color === "currentColor"
        ? getComputedStyle(canvas).color || "rgb(255,255,255)"
        : color;

    let dpr = Math.max(1, window.devicePixelRatio || 1);
    let cssWidth = 0;
    let cssHeight = 0;
    let cols = 0;
    let rows = 0;
    // Per-cell current opacity (row-major), enabling the trailing decay.
    let opacities: Float32Array = new Float32Array(0);
    // Per-cell flag (1 = part of the hidden message).
    let messageMask: Uint8Array = new Uint8Array(0);

    const gutter = cell * 0.3;
    const size = cell - gutter;

    const pointer = { x: -Infinity, y: -Infinity, active: false };

    // Rasterise the message onto the cell grid so we know which cells to reveal.
    const buildMessageMask = () => {
      messageMask = new Uint8Array(cols * rows);
      if (!message) return;
      const off = document.createElement("canvas");
      off.width = cols;
      off.height = rows;
      const octx = off.getContext("2d");
      if (!octx) return;
      octx.textAlign = "center";
      octx.textBaseline = "middle";
      octx.fillStyle = "#fff";
      let fontPx = Math.floor(rows * 0.5);
      octx.font = `700 ${fontPx}px sans-serif`;
      while (fontPx > 3 && octx.measureText(message).width > cols * 0.86) {
        fontPx -= 1;
        octx.font = `700 ${fontPx}px sans-serif`;
      }
      octx.fillText(message, cols / 2, rows / 2);
      const data = octx.getImageData(0, 0, cols, rows).data;
      for (let i = 0; i < cols * rows; i += 1) {
        if (data[i * 4 + 3] > 96) messageMask[i] = 1;
      }
    };

    const resize = () => {
      const rect = parent.getBoundingClientRect();
      cssWidth = Math.max(1, rect.width);
      cssHeight = Math.max(1, rect.height);
      dpr = Math.max(1, window.devicePixelRatio || 1);

      canvas.width = Math.round(cssWidth * dpr);
      canvas.height = Math.round(cssHeight * dpr);
      canvas.style.width = `${cssWidth}px`;
      canvas.style.height = `${cssHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      cols = Math.ceil(cssWidth / cell);
      rows = Math.ceil(cssHeight / cell);
      opacities = new Float32Array(cols * rows);
      buildMessageMask();
    };

    const drawCell = (col: number, row: number, opacity: number) => {
      if (opacity <= 0.001) return;
      ctx.globalAlpha = opacity;
      ctx.fillStyle = resolvedColor;
      ctx.fillRect(col * cell + gutter / 2, row * cell + gutter / 2, size, size);
    };

    resize();

    // Reduced motion: paint one faint static grid and stop.
    if (reduced) {
      const faint = Math.max(maxOpacity * 0.15, ambient * 0.6);
      ctx.clearRect(0, 0, cssWidth, cssHeight);
      for (let r = 0; r < rows; r += 1) {
        for (let c = 0; c < cols; c += 1) {
          drawCell(c, r, faint);
        }
      }
      ctx.globalAlpha = 1;
      const roStatic = new ResizeObserver(() => {
        resize();
        ctx.clearRect(0, 0, cssWidth, cssHeight);
        for (let r = 0; r < rows; r += 1) {
          for (let c = 0; c < cols; c += 1) {
            drawCell(c, r, faint);
          }
        }
        ctx.globalAlpha = 1;
      });
      roStatic.observe(parent);
      return () => roStatic.disconnect();
    }

    let rafId: number | null = null;
    const decay = 0.06; // Per-frame decay toward 0 for a trailing fade.
    const startedAt = performance.now();

    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = e.clientX - rect.left;
      pointer.y = e.clientY - rect.top;
      pointer.active = true;
    };
    const onLeave = () => {
      pointer.active = false;
    };

    parent.addEventListener("pointermove", onMove, { passive: true });
    parent.addEventListener("pointerleave", onLeave);

    const tick = () => {
      ctx.clearRect(0, 0, cssWidth, cssHeight);
      const t = (performance.now() - startedAt) / 1000;

      for (let r = 0; r < rows; r += 1) {
        for (let c = 0; c < cols; c += 1) {
          const idx = r * cols + c;

          // Idle shimmer: a slow diagonal wave so the field breathes even
          // when the cursor is elsewhere.
          let target =
            ambient > 0
              ? ambient * (0.35 + 0.35 * Math.sin(t * 1.1 - (c + r) * 0.45))
              : 0;

          if (pointer.active) {
            const cx = c * cell + cell / 2;
            const cy = r * cell + cell / 2;
            const dist = Math.hypot(pointer.x - cx, pointer.y - cy);
            if (dist < radius) {
              // Ease the falloff for a softer, rounder glow near the cursor.
              const n = 1 - dist / radius;
              target = Math.max(target, n * n * maxOpacity);
              // Hidden message: its cells light up brightest under the beam,
              // so the word only appears where the cursor uncovers it.
              if (messageMask[idx]) target = Math.max(target, 0.45 + 0.55 * n);
            }
          }

          const current = opacities[idx];
          // Brighten instantly toward the target; decay slowly when it drops.
          const next =
            target > current
              ? target
              : Math.max(target, current - decay * maxOpacity);
          opacities[idx] = next;
          drawCell(c, r, next);
        }
      }
      ctx.globalAlpha = 1;
      rafId = requestAnimationFrame(tick);
    };

    const ro = new ResizeObserver(() => resize());
    ro.observe(parent);
    rafId = requestAnimationFrame(tick);

    return () => {
      parent.removeEventListener("pointermove", onMove);
      parent.removeEventListener("pointerleave", onLeave);
      ro.disconnect();
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [reduced, cell, color, maxOpacity, radius, ambient, message]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
      aria-hidden="true"
    />
  );
}
