"use client";

import { useEffect, useReducer, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { skillClusters, profile } from "@/content/content";
import { DiagramShell, DIAGRAM_THEME, type DiagramVariant } from "./DiagramShell";

type Sim = {
  id: string;
  label: string;
  kind: "root" | "hub" | "item";
  prof?: "core" | "familiar";
  hue: string;
  r: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  fx: number | null;
  fy: number | null;
};

const VIEW_W = 1200;
const VIEW_H = 900;
const CX = VIEW_W / 2;
const CY = VIEW_H / 2;

/* One accent per mode, clusters read through structure, not rainbow hues. */
const ACCENT: Record<DiagramVariant, string> = {
  engineer: "var(--term-accent)",
  story: "var(--story-accent)",
};

function buildGraph(variant: DiagramVariant) {
  const accent = ACCENT[variant];
  const nodes: Sim[] = [];
  const links: { s: string; t: string }[] = [];
  const N = skillClusters.length;

  nodes.push({
    id: "root",
    label: profile.name,
    kind: "root",
    hue: "",
    r: 24,
    x: CX,
    y: CY,
    vx: 0,
    vy: 0,
    fx: CX,
    fy: CY,
  });

  skillClusters.forEach((cluster, i) => {
    const angle = (-90 + (360 / N) * i) * (Math.PI / 180);
    const hue = accent;
    const hubId = `hub-${cluster.key}`;
    nodes.push({
      id: hubId,
      label: cluster.label,
      kind: "hub",
      hue,
      r: 14,
      x: CX + 190 * Math.cos(angle),
      y: CY + 190 * Math.sin(angle),
      vx: 0,
      vy: 0,
      fx: null,
      fy: null,
    });
    links.push({ s: "root", t: hubId });

    cluster.items.forEach((item, j) => {
      const id = `${cluster.key}-${j}`;
      const spread = ((j - (cluster.items.length - 1) / 2) * 12 * Math.PI) / 180;
      nodes.push({
        id,
        label: item.name,
        kind: "item",
        prof: item.prof,
        hue,
        r: item.prof === "core" ? 9 : 6.5,
        x: CX + 300 * Math.cos(angle + spread),
        y: CY + 300 * Math.sin(angle + spread),
        vx: 0,
        vy: 0,
        fx: null,
        fy: null,
      });
      links.push({ s: hubId, t: id });
    });
  });

  return { nodes, links };
}

// ---- force simulation -------------------------------------------------
function tick(nodes: Sim[], links: { s: string; t: string }[], byId: Map<string, Sim>, alpha: number) {
  // many-body repulsion (O(n²), n≈45), clean 1/d² falloff
  for (let i = 0; i < nodes.length; i++) {
    for (let k = i + 1; k < nodes.length; k++) {
      const a = nodes[i];
      const b = nodes[k];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      let d2 = dx * dx + dy * dy;
      if (d2 < 1) d2 = 1;
      const d = Math.sqrt(d2);
      const force = (2600 * alpha) / d2;
      const ux = dx / d;
      const uy = dy / d;
      a.vx -= ux * force;
      a.vy -= uy * force;
      b.vx += ux * force;
      b.vy += uy * force;
    }
  }
  // link springs
  for (const l of links) {
    const s = byId.get(l.s)!;
    const t = byId.get(l.t)!;
    const rest = s.kind === "root" || t.kind === "root" ? 235 : 96;
    const dx = t.x - s.x;
    const dy = t.y - s.y;
    const d = Math.sqrt(dx * dx + dy * dy) || 0.01;
    const f = ((d - rest) / d) * 0.09 * alpha;
    s.vx += dx * f;
    s.vy += dy * f;
    t.vx -= dx * f;
    t.vy -= dy * f;
  }
  // gentle centering (weak, so the graph can breathe outward)
  for (const n of nodes) {
    n.vx += (CX - n.x) * 0.006 * alpha;
    n.vy += (CY - n.y) * 0.006 * alpha;
  }
  // integrate
  for (const n of nodes) {
    if (n.fx != null) {
      n.x = n.fx;
      n.vx = 0;
    } else {
      n.vx *= 0.62;
      n.x += n.vx;
    }
    if (n.fy != null) {
      n.y = n.fy;
      n.vy = 0;
    } else {
      n.vy *= 0.62;
      n.y += n.vy;
    }
    n.x = Math.max(30, Math.min(VIEW_W - 30, n.x));
    n.y = Math.max(30, Math.min(VIEW_H - 30, n.y));
  }
  // collision, hard separation so nothing overlaps (labels get room too)
  for (let pass = 0; pass < 2; pass++) {
    for (let i = 0; i < nodes.length; i++) {
      for (let k = i + 1; k < nodes.length; k++) {
        const a = nodes[i];
        const b = nodes[k];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const d = Math.sqrt(dx * dx + dy * dy) || 0.01;
        const min = a.r + b.r + 16;
        if (d < min) {
          const push = (min - d) / 2;
          const ux = dx / d;
          const uy = dy / d;
          if (a.fx == null) {
            a.x -= ux * push;
            a.y -= uy * push;
          }
          if (b.fx == null) {
            b.x += ux * push;
            b.y += uy * push;
          }
        }
      }
    }
  }
}

export function KnowledgeGraph({
  variant,
  onClose,
}: {
  variant: DiagramVariant;
  onClose: () => void;
}) {
  const reduced = useReducedMotion();
  const t = DIAGRAM_THEME[variant];
  const familiarCol = variant === "engineer" ? "#8a8478" : "#9a968f";

  const graphRef = useRef(buildGraph(variant));
  const byId = useRef(new Map(graphRef.current.nodes.map((n) => [n.id, n])));
  const alphaRef = useRef(1);
  const dragId = useRef<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const runningRef = useRef(false);
  const mountedRef = useRef(true);
  const rafRef = useRef(0);
  const [, render] = useReducer((x) => x + 1, 0);
  const [hover, setHover] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false); // drives the pop-in
  const [interacted, setInteracted] = useState(false); // hides the "try me" hint for good
  const moved = useRef(false);

  // Single RAF controller, never spawns a second loop.
  const startLoop = () => {
    if (runningRef.current || !mountedRef.current) return;
    runningRef.current = true;
    const { nodes, links } = graphRef.current;
    const map = byId.current;
    const step = () => {
      if (!mountedRef.current) return;
      const a = alphaRef.current;
      if (a > 0.004 || dragId.current) {
        tick(nodes, links, map, Math.max(a, 0.02));
        alphaRef.current = dragId.current ? Math.max(a, 0.2) : a * 0.985;
        render();
        rafRef.current = requestAnimationFrame(step);
      } else {
        runningRef.current = false;
      }
    };
    rafRef.current = requestAnimationFrame(step);
  };

  // warm-up so it opens already laid out, then run a live (or minimal) loop
  useEffect(() => {
    mountedRef.current = true;
    const { nodes, links } = graphRef.current;
    const map = byId.current;
    for (let i = 0; i < 160; i++) tick(nodes, links, map, 1 - i / 220);
    alphaRef.current = reduced ? 0.02 : 0.16;
    render();
    startLoop();
    // trigger the staggered pop-in on next frame
    const popRaf = requestAnimationFrame(() => setMounted(true));
    return () => {
      cancelAnimationFrame(popRaf);
      mountedRef.current = false;
      runningRef.current = false;
      cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const kick = () => {
    alphaRef.current = 0.3;
    startLoop();
  };

  const toView = (clientX: number, clientY: number) => {
    const svg = svgRef.current!;
    const ctm = svg.getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const p = pt.matrixTransform(ctm.inverse());
    return { x: p.x, y: p.y };
  };

  const onDown = (e: React.PointerEvent, id: string) => {
    e.stopPropagation();
    const n = byId.current.get(id)!;
    dragId.current = id;
    moved.current = false;
    setInteracted(true);
    const p = toView(e.clientX, e.clientY);
    n.fx = p.x;
    n.fy = p.y;
    (e.target as Element).setPointerCapture?.(e.pointerId);
    kick();
  };
  const onMove = (e: React.PointerEvent) => {
    if (!dragId.current) return;
    const n = byId.current.get(dragId.current)!;
    const p = toView(e.clientX, e.clientY);
    if (Math.abs(p.x - n.x) > 4 || Math.abs(p.y - n.y) > 4) moved.current = true;
    n.fx = p.x;
    n.fy = p.y;
  };
  const onUp = () => {
    const id = dragId.current;
    if (id && id !== "root") {
      const n = byId.current.get(id)!;
      n.fx = null;
      n.fy = null;
    }
    // a tap (no drag) toggles the focus on that node
    if (id && !moved.current) setSelected((s) => (s === id ? null : id));
    dragId.current = null;
    alphaRef.current = Math.max(alphaRef.current, 0.15);
  };

  const nodes = graphRef.current.nodes;
  const links = graphRef.current.links;
  const neighbors = (id: string) =>
    new Set([id, ...links.filter((l) => l.s === id || l.t === id).flatMap((l) => [l.s, l.t])]);
  // selection (a click) is sticky and wins; hover is the light, transient cue
  const focusId = selected ?? hover;
  const lit = focusId ? neighbors(focusId) : null;
  const selNode = selected ? byId.current.get(selected) : null;

  return (
    <DiagramShell
      variant={variant}
      onClose={onClose}
      title={
        <span>
          <span style={{ color: t.accent }}>arsenal.</span>
          <span>graph</span>
        </span>
      }
      subtitle="An interactive constellation of the stack, drag any node to move it, click one to focus its branch (click again to release). Nodes repel and never overlap."
      footer={
        <div className="flex flex-wrap items-center gap-5 text-[12px]" style={{ color: t.dim }}>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded-full" style={{ background: t.accent }} />
            core stack
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span
              className="inline-block h-3 w-3 rounded-full"
              style={{ background: "transparent", border: `1.5px solid ${familiarCol}` }}
            />
            familiar / growing
          </span>
          <span style={{ color: t.dim }}>· hubs are coloured per cluster</span>
        </div>
      }
    >
      <div className="relative h-full w-full">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="h-full w-full touch-none select-none"
        preserveAspectRatio="xMidYMid meet"
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerLeave={onUp}
      >
        {/* links */}
        {links.map((l, i) => {
          const s = byId.current.get(l.s)!;
          const d = byId.current.get(l.t)!;
          const dim = lit && !(lit.has(l.s) && lit.has(l.t));
          return (
            <line
              key={i}
              x1={s.x}
              y1={s.y}
              x2={d.x}
              y2={d.y}
              stroke={t.line}
              strokeWidth={1}
              opacity={dim ? 0.08 : 0.5}
              style={{ transition: "opacity 0.4s ease" }}
            />
          );
        })}

        {/* nodes */}
        {nodes.map((n, i) => {
          const dim = lit && !lit.has(n.id);
          const isRoot = n.kind === "root";
          const isHub = n.kind === "hub";
          const isSel = selected === n.id;
          const core = n.prof === "core";
          // root = solid accent · hubs = quiet ring · core = filled · familiar = outline
          const fill = isRoot ? t.accent : isHub ? t.panel : core ? t.accent : "transparent";
          const strokeCol = isRoot ? t.accent : isHub ? n.hue : core ? t.accent : familiarCol;
          // ripple: dimmed nodes fade one-by-one, swept by angle around the clicked node
          let rippleDelay = 0;
          if (selNode && dim) {
            const ang = Math.atan2(n.y - selNode.y, n.x - selNode.x);
            rippleDelay = Math.round(((ang + Math.PI) / (2 * Math.PI)) * 460);
          }
          const popDelay = Math.min(i * 13, 520); // staggered pop-in
          const opacityDelay = selNode ? rippleDelay : popDelay;
          return (
            <g
              key={n.id}
              onPointerDown={(e) => onDown(e, n.id)}
              onPointerEnter={() => setHover(n.id)}
              onPointerLeave={() => setHover((h) => (h === n.id ? null : h))}
              style={{
                cursor: "grab",
                transformBox: "fill-box",
                transformOrigin: "center",
                transform: mounted ? "scale(1)" : "scale(0.1)",
                opacity: mounted ? (dim ? 0.14 : 1) : 0,
                transition: `transform 0.55s cubic-bezier(0.34,1.4,0.64,1) ${popDelay}ms, opacity 0.45s ease ${opacityDelay}ms`,
              }}
            >
              {isSel && (
                <circle
                  cx={n.x}
                  cy={n.y}
                  r={n.r + 7}
                  fill="none"
                  stroke={t.accent}
                  strokeWidth={1.5}
                  opacity={0.5}
                />
              )}
              <circle
                cx={n.x}
                cy={n.y}
                r={hover === n.id || isSel ? n.r + 2.5 : n.r}
                fill={fill}
                stroke={strokeCol}
                strokeWidth={isHub || (!core && !isRoot) ? 2 : 0}
                style={{ transition: "r 120ms ease" }}
              />
              {(isRoot || isHub) && (
                <text
                  x={n.x}
                  y={isRoot ? n.y + n.r + 16 : n.y + n.r + 12}
                  textAnchor="middle"
                  fontFamily={t.font}
                  fontSize={isRoot ? 16 : 12.5}
                  fontWeight={600}
                  fill={t.text}
                  style={{ pointerEvents: "none" }}
                >
                  {n.label}
                </text>
              )}
              {n.kind === "item" && (
                <text
                  x={n.x + n.r + 5}
                  y={n.y + 3.5}
                  fontFamily={t.font}
                  fontSize={hover === n.id || isSel ? 12.5 : 10}
                  fill={hover === n.id || isSel ? t.text : t.dim}
                  fontWeight={hover === n.id || isSel ? 600 : 400}
                  style={{ pointerEvents: "none" }}
                >
                  {n.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* mounts already interactive, so the first thing a visitor should
          know is that it's interactive. Fades for good on first drag. */}
      <AnimatePresence>
        {!interacted && (
          <motion.div
            className="pointer-events-none absolute inset-x-0 top-3 flex justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.4 } }}
            transition={{ delay: 0.7, duration: 0.4 }}
          >
            <span
              className="wb-hover-hint inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-medium"
              style={{
                color: t.accent,
                border: `1px solid color-mix(in oklab, ${t.accent} 45%, transparent)`,
                background: `color-mix(in oklab, ${t.panel} 88%, transparent)`,
                fontFamily: t.font,
              }}
            >
              ✦ try dragging a node, go on
            </span>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </DiagramShell>
  );
}
