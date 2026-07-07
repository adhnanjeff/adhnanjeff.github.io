"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "motion/react";

/**
 * CursorDrivenParticleTypography, a word rendered as a field of particles.
 *
 * The text is rasterised to an offscreen canvas; each lit pixel becomes a
 * particle that springs toward its home position. Moving the cursor near the
 * word shoves the particles aside, and they settle back into the letters when
 * it leaves. On first paint the particles fly in from scattered positions.
 *
 * Native to this project (no shadcn / external registry): canvas-only, themed
 * through CSS variables, and it honours reduced-motion by drawing the word at
 * rest with no loop or tracking.
 */
export interface CursorDrivenParticleTypographyProps {
  text: string;
  className?: string;
  /** Particle colour, hex, a CSS variable, or "currentColor". */
  color?: string;
  /** Spacing (px) between sampled particles; smaller is denser/heavier. */
  gap?: number;
  /** Radius (px) of the cursor's push. */
  radius?: number;
  /** Particle dot size (px). */
  particleSize?: number;
  fontWeight?: number;
  fontFamily?: string;
}

type Particle = { x: number; y: number; hx: number; hy: number; vx: number; vy: number };

export function CursorDrivenParticleTypography({
  text,
  className,
  color = "currentColor",
  gap = 5,
  radius = 90,
  particleSize = 1.5,
  fontWeight = 800,
  fontFamily = "var(--font-flex), system-ui, sans-serif",
}: CursorDrivenParticleTypographyProps): React.JSX.Element {
  const reduced = useReducedMotion();
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Canvas can't parse `var(...)` / "currentColor", resolve both to
    // concrete values via computed style once.
    if (color !== "currentColor") canvas.style.color = color;
    const resolvedColor = getComputedStyle(canvas).color || "rgb(20,20,20)";
    canvas.style.fontFamily = fontFamily;
    const resolvedFamily = getComputedStyle(canvas).fontFamily || "sans-serif";

    let w = 0;
    let h = 0;
    let particles: Particle[] = [];
    const pointer = { x: -9999, y: -9999, active: false };
    const rand = (a: number, b: number) => a + Math.random() * (b - a);

    const build = () => {
      const rect = wrap.getBoundingClientRect();
      w = Math.max(1, rect.width);
      h = Math.max(1, rect.height);
      const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Rasterise the word at CSS resolution and read back its lit pixels.
      const off = document.createElement("canvas");
      off.width = Math.round(w);
      off.height = Math.round(h);
      const octx = off.getContext("2d");
      if (!octx) return;
      octx.textAlign = "center";
      octx.textBaseline = "middle";
      octx.fillStyle = "#fff";
      let fontPx = Math.floor(h * 0.72);
      const setFont = () => (octx.font = `${fontWeight} ${fontPx}px ${resolvedFamily}`);
      setFont();
      while (fontPx > 6 && octx.measureText(text).width > w * 0.92) {
        fontPx -= 2;
        setFont();
      }
      octx.fillText(text, w / 2, h / 2);

      const data = octx.getImageData(0, 0, off.width, off.height).data;
      const targets: { x: number; y: number }[] = [];
      for (let y = 0; y < off.height; y += gap) {
        for (let x = 0; x < off.width; x += gap) {
          if (data[(y * off.width + x) * 4 + 3] > 128) targets.push({ x, y });
        }
      }

      // Reconcile with existing particles so a resize doesn't reset the scene;
      // brand-new particles fly in from a random start.
      particles = targets.map((t, i) => {
        const prev = particles[i];
        return prev
          ? { ...prev, hx: t.x, hy: t.y }
          : { x: rand(0, w), y: rand(0, h), hx: t.x, hy: t.y, vx: 0, vy: 0 };
      });
    };

    const draw = (p: Particle) => {
      const s = particleSize;
      ctx.fillRect(p.x - s / 2, p.y - s / 2, s * 1.6, s * 1.6);
    };

    build();

    // Reduced motion: paint the word at rest and re-paint on resize. No loop.
    if (reduced) {
      const paint = () => {
        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = resolvedColor;
        for (const p of particles) {
          p.x = p.hx;
          p.y = p.hy;
          draw(p);
        }
      };
      paint();
      const roStatic = new ResizeObserver(() => {
        build();
        paint();
      });
      roStatic.observe(wrap);
      return () => roStatic.disconnect();
    }

    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = e.clientX - rect.left;
      pointer.y = e.clientY - rect.top;
      pointer.active = true;
    };
    const onLeave = () => {
      pointer.active = false;
    };
    wrap.addEventListener("pointermove", onMove, { passive: true });
    wrap.addEventListener("pointerleave", onLeave);

    let raf = 0;
    const tick = () => {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = resolvedColor;
      for (const p of particles) {
        p.vx += (p.hx - p.x) * 0.055;
        p.vy += (p.hy - p.y) * 0.055;
        if (pointer.active) {
          const dx = p.x - pointer.x;
          const dy = p.y - pointer.y;
          const d = Math.hypot(dx, dy);
          if (d < radius && d > 0.01) {
            const f = (1 - d / radius) * 4.2;
            p.vx += (dx / d) * f;
            p.vy += (dy / d) * f;
          }
        }
        p.vx *= 0.86;
        p.vy *= 0.86;
        p.x += p.vx;
        p.y += p.vy;
        draw(p);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const ro = new ResizeObserver(() => build());
    ro.observe(wrap);

    return () => {
      cancelAnimationFrame(raf);
      wrap.removeEventListener("pointermove", onMove);
      wrap.removeEventListener("pointerleave", onLeave);
      ro.disconnect();
    };
  }, [text, color, gap, radius, particleSize, fontWeight, fontFamily, reduced]);

  return (
    <div
      ref={wrapRef}
      className={className}
      role="img"
      aria-label={text}
      style={{ position: "absolute", inset: 0 }}
    >
      <canvas ref={canvasRef} aria-hidden="true" style={{ display: "block", width: "100%", height: "100%" }} />
    </div>
  );
}
