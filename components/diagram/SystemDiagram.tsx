"use client";

import { useId, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  NODE_W,
  NODE_H,
  GROUP_LABEL,
  type SystemGraph,
  type DiagNode,
  type DiagEdge,
  type DiagGroup,
} from "@/content/systems";
import { DiagramShell, DIAGRAM_THEME, type DiagramVariant } from "./DiagramShell";

const GROUP_STROKE: Record<DiagramVariant, Record<DiagGroup, string>> = {
  engineer: {
    source: "#8a8478",
    security: "var(--term-accent)",
    transport: "var(--term-ok)",
    analysis: "#7aa2f7",
    ml: "#7ee7d0",
    decision: "#c3a6ff",
    output: "#e0af68",
    client: "#8a8478",
    gateway: "#8a8478",
    service: "#7aa2f7",
    broker: "var(--term-accent)",
    store: "#e0af68",
  },
  story: {
    source: "#8a8778",
    security: "#b45309",
    transport: "#2f9e6f",
    analysis: "#4b48c6",
    ml: "#0e7490",
    decision: "#7c3aed",
    output: "#be185d",
    client: "#8a8778",
    gateway: "#8a8778",
    service: "#4b48c6",
    broker: "#2f9e6f",
    store: "#c98a2b",
  },
};

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const sign = (v: number) => (v < 0 ? -1 : 1);

type Routed = { d: string; lx: number; ly: number };

/** Orthogonal (Manhattan) edge routing between node borders. */
function routeEdge(a: DiagNode, b: DiagNode, e: DiagEdge): Routed {
  if (e.points && e.points.length >= 2) {
    const pts = e.points;
    const d = `M ${pts.map((p) => p.join(" ")).join(" L ")}`;
    // label on the longest segment
    let best = 0;
    let bi = 0;
    for (let i = 0; i < pts.length - 1; i++) {
      const len = Math.abs(pts[i + 1][0] - pts[i][0]) + Math.abs(pts[i + 1][1] - pts[i][1]);
      if (len > best) {
        best = len;
        bi = i;
      }
    }
    return {
      d,
      lx: (pts[bi][0] + pts[bi + 1][0]) / 2,
      ly: (pts[bi][1] + pts[bi + 1][1]) / 2 - 7,
    };
  }

  const aw = (a.w ?? NODE_W) / 2;
  const ah = (a.h ?? NODE_H) / 2;
  const bw = (b.w ?? NODE_W) / 2;
  const bh = (b.h ?? NODE_H) / 2;
  const dx = b.x - a.x;
  const dy = b.y - a.y;

  // straight lines when aligned
  if (Math.abs(dy) < 2) {
    const sx = a.x + sign(dx) * aw;
    const tx = b.x - sign(dx) * bw;
    return { d: `M ${sx} ${a.y} L ${tx} ${b.y}`, lx: (sx + tx) / 2, ly: a.y - 8 };
  }
  if (Math.abs(dx) < 2) {
    const sy = a.y + sign(dy) * ah;
    const ty = b.y - sign(dy) * bh;
    return { d: `M ${a.x} ${sy} L ${b.x} ${ty}`, lx: a.x + 8, ly: (sy + ty) / 2 };
  }

  const mode = e.route ?? (Math.abs(dx) >= Math.abs(dy) ? "h" : "v");
  if (mode === "h") {
    const sx = a.x + sign(dx) * aw;
    const tx = b.x - sign(dx) * bw;
    const mx = e.mid ?? (sx + tx) / 2;
    return {
      d: `M ${sx} ${a.y} L ${mx} ${a.y} L ${mx} ${b.y} L ${tx} ${b.y}`,
      lx: mx,
      ly: (a.y + b.y) / 2,
    };
  }
  const sy = a.y + sign(dy) * ah;
  const ty = b.y - sign(dy) * bh;
  const my = e.mid ?? (sy + ty) / 2;
  return {
    d: `M ${a.x} ${sy} L ${a.x} ${my} L ${b.x} ${my} L ${b.x} ${ty}`,
    lx: (a.x + b.x) / 2,
    ly: my - 7,
  };
}

export function SystemDiagram({
  graph,
  variant,
  onClose,
}: {
  graph: SystemGraph;
  variant: DiagramVariant;
  onClose: () => void;
}) {
  const reduced = useReducedMotion();
  const [hover, setHover] = useState<DiagNode | null>(null);
  const t = DIAGRAM_THEME[variant];
  const stroke = GROUP_STROKE[variant];
  const uid = useId().replace(/[:]/g, "");
  const byId = (id: string) => graph.nodes.find((n) => n.id === id)!;

  const routed = graph.edges.map((e) => ({
    e,
    r: routeEdge(byId(e.from), byId(e.to), e),
  }));

  // pan + zoom, open slightly zoomed out so dense diagrams always have margin
  const svgRef = useRef<SVGSVGElement>(null);
  const fitView = { k: 0.92, x: graph.viewW * 0.04, y: graph.viewH * 0.04 };
  const [view, setView] = useState(fitView);
  const panning = useRef(false);
  const last = useRef({ x: 0, y: 0 });

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

  const onPointerDown = (e: React.PointerEvent) => {
    panning.current = true;
    last.current = toView(e.clientX, e.clientY);
    (e.target as Element).setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!panning.current) return;
    const p = toView(e.clientX, e.clientY);
    setView((v) => ({ ...v, x: v.x + (p.x - last.current.x), y: v.y + (p.y - last.current.y) }));
    last.current = p;
  };
  const stopPan = () => {
    panning.current = false;
  };
  const onWheel = (e: React.WheelEvent) => {
    const p = toView(e.clientX, e.clientY);
    setView((v) => {
      const k = clamp(v.k * (e.deltaY < 0 ? 1.12 : 0.89), 0.5, 3);
      return { k, x: p.x - (k / v.k) * (p.x - v.x), y: p.y - (k / v.k) * (p.y - v.y) };
    });
  };

  return (
    <DiagramShell
      variant={variant}
      onClose={onClose}
      title={
        <span>
          <span style={{ color: t.accent }}>system.</span>
          <span>{graph.title}</span>
        </span>
      }
      subtitle={graph.caption}
      footer={
        <>
          <div className="text-sm">
            {hover ? (
              <>
                <span style={{ color: t.accent }}>{hover.label}</span>
                <span style={{ color: t.dim }}>, {hover.detail ?? hover.sub}</span>
              </>
            ) : (
              <span style={{ color: t.dim }}>
                solid = live message flow · dashed = supporting link · drag to pan, scroll to
                zoom, double-click to reset
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-3 text-[11px]" style={{ color: t.dim }}>
            {graph.legend.map((g) => (
              <span key={g} className="inline-flex items-center gap-1.5">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-sm"
                  style={{ background: t.panel, border: `1.5px solid ${stroke[g]}` }}
                />
                {GROUP_LABEL[g]}
              </span>
            ))}
          </div>
        </>
      }
    >
      <svg
        ref={svgRef}
        viewBox={`0 0 ${graph.viewW} ${graph.viewH}`}
        className="h-full w-full touch-none select-none"
        preserveAspectRatio="xMidYMid meet"
        style={{ cursor: panning.current ? "grabbing" : "grab" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={stopPan}
        onPointerLeave={stopPan}
        onWheel={onWheel}
        onDoubleClick={() => setView(fitView)}
      >
        <defs>
          <marker
            id={`arr-flow-${uid}`}
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill={t.accent} />
          </marker>
          <marker
            id={`arr-norm-${uid}`}
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="6.5"
            markerHeight="6.5"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill={t.line} />
          </marker>
        </defs>

        <g transform={`translate(${view.x} ${view.y}) scale(${view.k})`}>
          {/* edges */}
          {routed.map(({ e, r }, i) => {
            const isFlow = e.kind === "flow";
            const lit = hover && (hover.id === e.from || hover.id === e.to);
            return (
              <motion.path
                key={`e-${i}`}
                d={r.d}
                stroke={isFlow ? t.accent : t.line}
                strokeWidth={lit ? 2.6 : isFlow ? 1.7 : 1.2}
                strokeDasharray={isFlow ? "0" : "5 5"}
                fill="none"
                markerEnd={`url(#${isFlow ? `arr-flow-${uid}` : `arr-norm-${uid}`})`}
                opacity={hover && !lit ? 0.2 : 1}
                initial={reduced ? undefined : { pathLength: 0, opacity: 0 }}
                animate={reduced ? undefined : { pathLength: 1, opacity: hover && !lit ? 0.2 : 1 }}
                transition={
                  reduced ? undefined : { duration: 0.45, delay: 0.3 + i * 0.025, ease: "easeOut" }
                }
              />
            );
          })}

          {/* traveling packets follow the routed (elbow) paths exactly */}
          {!reduced &&
            routed
              .filter(({ e }) => e.kind === "flow")
              .map(({ r }, i) => (
                // opacity gates on the same begin so packets never flash at the path start
                <circle key={`p-${i}`} r={4} fill={t.ok} opacity={0}>
                  <set attributeName="opacity" to="0.95" begin={`${0.8 + i * 0.3}s`} fill="freeze" />
                  <animateMotion
                    dur="2.6s"
                    begin={`${0.8 + i * 0.3}s`}
                    repeatCount="indefinite"
                    keyPoints="0;1"
                    keyTimes="0;1"
                    calcMode="linear"
                    path={r.d}
                  />
                </circle>
              ))}

          {/* edge labels with a halo so they stay readable over lines */}
          {routed.map(({ e, r }, i) =>
            e.label ? (
              <motion.text
                key={`el-${i}`}
                x={r.lx}
                y={r.ly}
                textAnchor="middle"
                fontFamily={t.font}
                fontSize="11"
                fill={e.kind === "flow" ? t.accent : t.dim}
                paintOrder="stroke"
                stroke={t.halo}
                strokeWidth={4}
                initial={reduced ? undefined : { opacity: 0 }}
                animate={reduced ? undefined : { opacity: 0.95 }}
                transition={reduced ? undefined : { delay: 0.7 + i * 0.03 }}
              >
                {e.label}
              </motion.text>
            ) : null,
          )}

          {/* nodes */}
          {graph.nodes.map((n, i) => {
            const w = n.w ?? NODE_W;
            const h = n.h ?? NODE_H;
            const dim = hover && hover.id !== n.id;
            const small = !!n.w;
            return (
              <motion.g
                key={n.id}
                onMouseEnter={() => setHover(n)}
                onMouseLeave={() => setHover(null)}
                style={{ cursor: "pointer", transformBox: "fill-box", transformOrigin: "center" }}
                initial={reduced ? undefined : { opacity: 0, scale: 0.92 }}
                animate={reduced ? undefined : { opacity: dim ? 0.35 : 1, scale: 1 }}
                whileHover={reduced ? undefined : { scale: 1.05 }}
                transition={reduced ? undefined : { duration: 0.3, delay: i * 0.035 }}
              >
                <rect
                  x={n.x - w / 2}
                  y={n.y - h / 2}
                  width={w}
                  height={h}
                  rx={small ? 8 : 10}
                  fill={t.panel}
                  stroke={stroke[n.group]}
                  strokeWidth={hover?.id === n.id ? 2.6 : 1.4}
                />
                <text
                  x={n.x}
                  y={n.y - (n.sub ? 4 : -5)}
                  textAnchor="middle"
                  fontFamily={t.font}
                  fontSize={small ? 12 : 14.5}
                  fill={t.text}
                >
                  {n.label}
                </text>
                {n.sub && (
                  <text
                    x={n.x}
                    y={n.y + (small ? 12 : 14)}
                    textAnchor="middle"
                    fontFamily={t.font}
                    fontSize={small ? 9.5 : 10.5}
                    fill={t.dim}
                  >
                    {n.sub}
                  </text>
                )}
              </motion.g>
            );
          })}
        </g>
      </svg>
    </DiagramShell>
  );
}
