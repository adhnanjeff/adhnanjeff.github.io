"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";

/**
 * "Dust off the blueprint", the résumé hides under a layer of blueprint
 * dust. Moving the cursor gently wipes it away; once ~55% is clear the
 * whole layer dissolves. Revealed state persists (one-time moment).
 * Fallbacks: double-click, or Enter when focused; reduced-motion reveals
 * on first pointer move.
 */
export function DustReveal({
  storageKey = "myfolio-dust-resume",
  children,
}: {
  storageKey?: string;
  children: React.ReactNode;
}) {
  const reduced = useReducedMotion();
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cells = useRef<Uint8Array | null>(null);
  const clearedRef = useRef(0);
  const [revealed, setRevealed] = useState(false);
  const [fading, setFading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      if (window.localStorage.getItem(storageKey) === "1") setRevealed(true);
    } catch {
      /* ignore */
    }
  }, [storageKey]);

  // paint the dust layer
  useEffect(() => {
    if (!mounted || revealed) return;
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const rect = wrap.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);

    // base dust
    ctx.fillStyle = "#161311";
    ctx.fillRect(0, 0, rect.width, rect.height);
    // speckle grain
    for (let i = 0; i < rect.width * rect.height * 0.06; i++) {
      const x = Math.random() * rect.width;
      const y = Math.random() * rect.height;
      ctx.fillStyle =
        Math.random() < 0.12
          ? `rgba(229,165,75,${0.06 + Math.random() * 0.1})`
          : `rgba(231,227,220,${0.02 + Math.random() * 0.07})`;
      ctx.fillRect(x, y, 1.4, 1.4);
    }
    // tiled CONFIDENTIAL watermark, slightly rotated like a stamp
    ctx.save();
    ctx.translate(rect.width / 2, rect.height / 2);
    ctx.rotate((-7 * Math.PI) / 180);
    ctx.font = "10px var(--font-mono), monospace";
    ctx.fillStyle = "rgba(229,165,75,0.18)";
    for (let row = -3; row <= 3; row++) {
      for (let col = -3; col <= 3; col++) {
        ctx.fillText("CONFIDENTIAL", col * 130 - 40, row * 34);
      }
    }
    ctx.restore();

    cells.current = new Uint8Array(24 * 8);
    clearedRef.current = 0;
  }, [mounted, revealed]);

  const reveal = () => {
    if (revealed || fading) return;
    setFading(true);
    try {
      window.localStorage.setItem(storageKey, "1");
    } catch {
      /* ignore */
    }
    window.setTimeout(() => setRevealed(true), 650);
  };

  const brush = (clientX: number, clientY: number) => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas || revealed || fading) return;
    if (reduced) return reveal();
    const rect = wrap.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.globalCompositeOperation = "destination-out";
    const r = 30;
    const g = ctx.createRadialGradient(x, y, 4, x, y, r);
    g.addColorStop(0, "rgba(0,0,0,0.95)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();

    // progress accounting on a coarse grid
    const grid = cells.current;
    if (!grid) return;
    const cw = rect.width / 24;
    const ch = rect.height / 8;
    const ci = Math.floor(x / cw);
    const cj = Math.floor(y / ch);
    for (let dj = -1; dj <= 1; dj++) {
      for (let di = -1; di <= 1; di++) {
        const ii = ci + di;
        const jj = cj + dj;
        if (ii < 0 || jj < 0 || ii >= 24 || jj >= 8) continue;
        const idx = jj * 24 + ii;
        if (!grid[idx]) {
          grid[idx] = 1;
          clearedRef.current++;
        }
      }
    }
    if (clearedRef.current / grid.length > 0.55) reveal();
  };

  return (
    <div ref={wrapRef} className="relative overflow-hidden rounded-lg">
      <div aria-hidden={!revealed && mounted ? true : undefined}>{children}</div>
      {mounted && !revealed && (
        <canvas
          ref={canvasRef}
          role="button"
          tabIndex={0}
          aria-label="Dust-covered resume, move your cursor across it (or press Enter) to dust it off"
          className="absolute inset-0 h-full w-full rounded-lg outline-none"
          style={{
            opacity: fading ? 0 : 1,
            transition: "opacity 600ms ease",
            cursor: "crosshair",
            touchAction: "none",
          }}
          onPointerMove={(e) => brush(e.clientX, e.clientY)}
          onPointerDown={(e) => {
            e.stopPropagation();
            brush(e.clientX, e.clientY);
          }}
          onDoubleClick={reveal}
          onKeyDown={(e) => e.key === "Enter" && reveal()}
        />
      )}
      {mounted && !revealed && (
        <div
          className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-1"
          style={{ opacity: fading ? 0 : 1, transition: "opacity 400ms ease" }}
        >
          <span
            className="text-[11px] uppercase tracking-[0.3em]"
            style={{ color: "var(--term-accent)", fontFamily: "var(--font-mono), monospace" }}
          >
            confidential · resume.pdf
          </span>
          <span className="text-[11px]" style={{ color: "var(--term-dim)" }}>
            move your cursor to dust it off
          </span>
        </div>
      )}
    </div>
  );
}
