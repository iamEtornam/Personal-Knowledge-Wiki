"use client";

import { cn } from "@/lib/utils";
import { Maximize2, Minus, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

// ── Types ──────────────────────────────────────────────────────

interface Node {
  id: string;
  title: string;
  directory: string;
  wordCount: number;
  linkCount: number;
}

interface SimNode extends Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  pinned: boolean;
}

interface Link {
  source: string;
  target: string;
}

interface GraphViewProps {
  nodes: Node[];
  links: Link[];
}

// ── Colors ─────────────────────────────────────────────────────

const DIR_COLORS: Record<string, string> = {
  people:       "#60a5fa",
  projects:     "#fb923c",
  philosophies: "#a78bfa",
  patterns:     "#4ade80",
  places:       "#f87171",
  films:        "#f472b6",
  books:        "#facc15",
  music:        "#2dd4bf",
  eras:         "#94a3b8",
  decisions:    "#fbbf24",
  transitions:  "#c084fc",
  ideas:        "#22d3ee",
  tools:        "#818cf8",
  companies:    "#a3e635",
  events:       "#34d399",
  files:        "#9ca3af",
  "":           "#6b7280",
};

function color(dir: string) {
  return DIR_COLORS[dir] ?? DIR_COLORS[""];
}

function lighten(hex: string, t: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const lr = Math.min(255, Math.round(r + (255 - r) * t));
  const lg = Math.min(255, Math.round(g + (255 - g) * t));
  const lb = Math.min(255, Math.round(b + (255 - b) * t));
  return `#${lr.toString(16).padStart(2, "0")}${lg.toString(16).padStart(2, "0")}${lb.toString(16).padStart(2, "0")}`;
}

function radius(n: SimNode) {
  return 5 + Math.min(n.linkCount, 20) * 1.5;
}

// ── Component ──────────────────────────────────────────────────

export default function GraphView({ nodes, links }: GraphViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const router = useRouter();
  const drawRef = useRef<(() => void) | null>(null);

  const s = useRef({
    nodes:          [] as SimNode[],
    links:          [] as Link[],
    nodeMap:        new Map<string, SimNode>(),
    adjacency:      new Map<string, Set<string>>(),
    offsetX:        0,
    offsetY:        0,
    scale:          1,
    isPanning:      false,
    draggingId:     null as string | null,
    lastX:          0,
    lastY:          0,
    downX:          0,
    downY:          0,
    hovered:        null as string | null,
    filterDir:      null as string | null,
    animating:      true,
  });

  const [tooltip, setTooltip] = useState<{
    title: string; directory: string; wordCount: number; x: number; y: number;
  } | null>(null);
  const [filterDir, setFilterDir] = useState<string | null>(null);
  const dirs = [...new Set(nodes.map(n => n.directory).filter(Boolean))].sort();

  // ── Simulation + draw ───────────────────────────────────────

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const st = s.current;
    const dpr = window.devicePixelRatio || 1;
    const W = canvas.offsetWidth * dpr;
    const H = canvas.offsetHeight * dpr;
    canvas.width = W;
    canvas.height = H;

    st.offsetX = W / 2;
    st.offsetY = H / 2;
    st.scale = dpr;
    st.animating = true;

    const spread = Math.min(W, H) * 0.35;
    st.nodes = nodes.map(n => ({
      ...n,
      x: (Math.random() - 0.5) * spread,
      y: (Math.random() - 0.5) * spread,
      vx: 0, vy: 0, pinned: false,
    }));
    st.links = links;

    const nodeMap = new Map(st.nodes.map(n => [n.id, n]));
    st.nodeMap = nodeMap;

    // Build adjacency for O(1) neighbor lookup
    const adj = new Map<string, Set<string>>();
    for (const l of links) {
      if (!adj.has(l.source)) adj.set(l.source, new Set());
      if (!adj.has(l.target)) adj.set(l.target, new Set());
      adj.get(l.source)!.add(l.target);
      adj.get(l.target)!.add(l.source);
    }
    st.adjacency = adj;

    function draw() {
      const ctx = canvas!.getContext("2d");
      if (!ctx) return;

      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = "#0d1117";
      ctx.fillRect(0, 0, W, H);

      ctx.save();
      ctx.translate(st.offsetX, st.offsetY);
      ctx.scale(st.scale, st.scale);

      const hov = st.hovered;
      const fdir = st.filterDir;
      const neighbors = hov ? st.adjacency.get(hov) : null;

      // ── Edges ──
      for (const lk of st.links) {
        const a = nodeMap.get(lk.source);
        const b = nodeMap.get(lk.target);
        if (!a || !b) continue;

        const connected = hov
          ? (lk.source === hov || lk.target === hov)
          : true;
        const relevant = fdir
          ? (a.directory === fdir || b.directory === fdir)
          : true;

        let alpha = 0.1;
        let lw = 0.8;
        let stroke = "#6b7280";

        if (hov) {
          if (connected) { alpha = 0.65; lw = 1.8; stroke = color(a.directory); }
          else alpha = 0.03;
        } else if (fdir) {
          if (relevant) { alpha = 0.55; lw = 1.4; }
          else alpha = 0.03;
        }

        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = stroke;
        ctx.lineWidth = lw / st.scale;
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      // ── Nodes ──
      for (const n of st.nodes) {
        const r = radius(n);
        const isHov = n.id === hov;
        const isNeigh = !!(neighbors?.has(n.id));
        const inFilter = fdir ? n.directory === fdir : true;

        let alpha = 1;
        if (hov && !isHov && !isNeigh) alpha = 0.18;
        if (fdir && !inFilter) alpha = 0.12;

        const c = color(n.directory);
        ctx.globalAlpha = alpha;

        // Glow ring
        if (isHov || isNeigh) {
          ctx.shadowColor = c;
          ctx.shadowBlur = (isHov ? 24 : 12) / st.scale;
        }

        // Radial gradient fill
        const gr = ctx.createRadialGradient(
          n.x - r * 0.3, n.y - r * 0.3, 0,
          n.x, n.y, r,
        );
        gr.addColorStop(0, lighten(c, 0.35));
        gr.addColorStop(1, c);

        ctx.beginPath();
        ctx.arc(n.x, n.y, isHov ? r + 2.5 : r, 0, Math.PI * 2);
        ctx.fillStyle = gr;
        ctx.fill();
        ctx.shadowBlur = 0;

        if (isHov) {
          ctx.strokeStyle = "#ffffff";
          ctx.lineWidth = 1.8 / st.scale;
          ctx.globalAlpha = 0.8;
          ctx.stroke();
        }

        ctx.globalAlpha = alpha;

        // Label
        const showLabel = r > 7 || isHov || isNeigh;
        if (showLabel) {
          const fs = Math.max(9, Math.min(13, r + 2)) / st.scale;
          ctx.font = `${isHov ? "600 " : ""}${fs}px -apple-system, ui-sans-serif, sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "top";
          const label = n.title.length > 24
            ? n.title.slice(0, 22) + "…"
            : n.title;
          ctx.shadowColor = "#0d1117";
          ctx.shadowBlur = 8 / st.scale;
          ctx.fillStyle = isHov ? "#ffffff" : isNeigh ? "#e5e7eb" : "#9ca3af";
          ctx.fillText(label, n.x, n.y + r + 5 / st.scale);
          ctx.shadowBlur = 0;
        }

        ctx.globalAlpha = 1;
      }

      ctx.restore();
    }

    drawRef.current = draw;

    function tick() {
      if (!st.animating) return;

      // Repulsion
      for (let i = 0; i < st.nodes.length; i++) {
        for (let j = i + 1; j < st.nodes.length; j++) {
          const a = st.nodes[i];
          const b = st.nodes[j];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const dist = Math.hypot(dx, dy) || 1;
          const f = 2600 / (dist * dist);
          const fx = (dx / dist) * f;
          const fy = (dy / dist) * f;
          if (!a.pinned) { a.vx -= fx; a.vy -= fy; }
          if (!b.pinned) { b.vx += fx; b.vy += fy; }
        }
      }

      // Attraction along edges
      for (const lk of st.links) {
        const a = nodeMap.get(lk.source);
        const b = nodeMap.get(lk.target);
        if (!a || !b) continue;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.hypot(dx, dy) || 1;
        const f = (dist - 140) * 0.04;
        const fx = (dx / dist) * f;
        const fy = (dy / dist) * f;
        if (!a.pinned) { a.vx += fx; a.vy += fy; }
        if (!b.pinned) { b.vx -= fx; b.vy -= fy; }
      }

      // Center gravity + integrate
      for (const n of st.nodes) {
        if (n.pinned) continue;
        n.vx = (n.vx - n.x * 0.006) * 0.82;
        n.vy = (n.vy - n.y * 0.006) * 0.82;
        n.x += n.vx;
        n.y += n.vy;
      }

      draw();
      requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
    const t = setTimeout(() => { st.animating = false; draw(); }, 8000);
    return () => { st.animating = false; clearTimeout(t); };
  }, [nodes, links]);

  // Sync filterDir state → ref and redraw
  useEffect(() => {
    s.current.filterDir = filterDir;
    if (!s.current.animating) drawRef.current?.();
  }, [filterDir]);

  // ── Helpers ────────────────────────────────────────────────

  function worldPos(e: React.MouseEvent) {
    const canvas = canvasRef.current!;
    const st = s.current;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * dpr;
    const my = (e.clientY - rect.top) * dpr;
    return {
      wx: (mx - st.offsetX) / st.scale,
      wy: (my - st.offsetY) / st.scale,
    };
  }

  function hitTest(e: React.MouseEvent): SimNode | null {
    const { wx, wy } = worldPos(e);
    const st = s.current;
    for (const n of st.nodes) {
      const r = radius(n);
      if (Math.hypot(wx - n.x, wy - n.y) < r + 6 / st.scale) return n;
    }
    return null;
  }

  function triggerRedraw() {
    if (!s.current.animating) drawRef.current?.();
  }

  // ── Events ─────────────────────────────────────────────────

  function onMouseDown(e: React.MouseEvent) {
    const st = s.current;
    const hit = hitTest(e);
    st.downX = st.lastX = e.clientX;
    st.downY = st.lastY = e.clientY;
    if (hit) { st.draggingId = hit.id; }
    else { st.isPanning = true; }
  }

  function onMouseMove(e: React.MouseEvent) {
    const st = s.current;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;

    if (st.draggingId) {
      const node = st.nodeMap.get(st.draggingId);
      if (node) {
        node.x += (e.clientX - st.lastX) * dpr / st.scale;
        node.y += (e.clientY - st.lastY) * dpr / st.scale;
        node.vx = node.vy = 0;
        node.pinned = true;
      }
      st.lastX = e.clientX;
      st.lastY = e.clientY;
      triggerRedraw();
      return;
    }

    if (st.isPanning) {
      st.offsetX += (e.clientX - st.lastX) * dpr;
      st.offsetY += (e.clientY - st.lastY) * dpr;
      st.lastX = e.clientX;
      st.lastY = e.clientY;
      triggerRedraw();
      return;
    }

    const hit = hitTest(e);
    const prev = st.hovered;
    st.hovered = hit?.id ?? null;
    if (st.hovered !== prev) triggerRedraw();

    if (hit) {
      setTooltip({ title: hit.title, directory: hit.directory, wordCount: hit.wordCount, x: e.clientX, y: e.clientY });
      canvas.style.cursor = "pointer";
    } else {
      setTooltip(null);
      canvas.style.cursor = "grab";
    }
  }

  function onMouseUp(e: React.MouseEvent) {
    const st = s.current;
    const moved = Math.abs(e.clientX - st.downX) > 4 || Math.abs(e.clientY - st.downY) > 4;

    if (!moved && st.draggingId) {
      router.push(`/wiki/${st.draggingId}`);
    }
    if (st.draggingId) {
      const node = st.nodeMap.get(st.draggingId);
      if (node && !moved) node.pinned = false;
    }
    st.draggingId = null;
    st.isPanning = false;
  }

  function onWheel(e: React.WheelEvent) {
    e.preventDefault();
    const st = s.current;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * dpr;
    const my = (e.clientY - rect.top) * dpr;
    const delta = e.deltaY > 0 ? 0.88 : 1.14;
    st.offsetX = mx + (st.offsetX - mx) * delta;
    st.offsetY = my + (st.offsetY - my) * delta;
    st.scale = Math.min(Math.max(st.scale * delta, 0.15 * dpr), 10 * dpr);
    triggerRedraw();
  }

  function zoom(factor: number) {
    const st = s.current;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    st.offsetX = cx + (st.offsetX - cx) * factor;
    st.offsetY = cy + (st.offsetY - cy) * factor;
    st.scale = Math.min(Math.max(st.scale * factor, 0.15), 10);
    triggerRedraw();
  }

  function fitView() {
    const st = s.current;
    const canvas = canvasRef.current;
    if (!canvas || st.nodes.length === 0) return;
    const dpr = window.devicePixelRatio || 1;
    const W = canvas.width;
    const H = canvas.height;
    const pad = 80 * dpr;
    const xs = st.nodes.map(n => n.x);
    const ys = st.nodes.map(n => n.y);
    const minX = Math.min(...xs) - 30;
    const maxX = Math.max(...xs) + 30;
    const minY = Math.min(...ys) - 30;
    const maxY = Math.max(...ys) + 30;
    const newScale = Math.min((W - pad * 2) / (maxX - minX), (H - pad * 2) / (maxY - minY), 2 * dpr);
    st.scale = newScale;
    st.offsetX = W / 2 - ((minX + maxX) / 2) * newScale;
    st.offsetY = H / 2 - ((minY + maxY) / 2) * newScale;
    triggerRedraw();
  }

  return (
    <div className="relative flex-1 overflow-hidden bg-[#0d1117]">
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
        style={{ cursor: "grab" }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={() => {
          s.current.isPanning = false;
          s.current.draggingId = null;
          s.current.hovered = null;
          setTooltip(null);
          triggerRedraw();
        }}
        onWheel={onWheel}
      />

      {/* ── Tooltip ── */}
      {tooltip && (
        <div
          className="fixed z-50 pointer-events-none"
          style={{ left: tooltip.x + 16, top: tooltip.y - 16 }}
        >
          <div className="bg-gray-900/95 border border-gray-700 rounded-xl px-3.5 py-2.5 shadow-2xl max-w-[220px] backdrop-blur-sm">
            <p className="text-white text-[13px] font-semibold leading-snug break-words">
              {tooltip.title}
            </p>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              {tooltip.directory && (
                <span
                  className="text-[10px] px-2 py-0.5 rounded-full font-medium capitalize"
                  style={{
                    background: color(tooltip.directory) + "28",
                    color: color(tooltip.directory),
                    border: `1px solid ${color(tooltip.directory)}44`,
                  }}
                >
                  {tooltip.directory}
                </span>
              )}
              <span className="text-[11px] text-gray-400">
                {tooltip.wordCount.toLocaleString()} words
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── Zoom controls ── */}
      <div className="absolute bottom-5 left-5 flex flex-col gap-1.5">
        {[
          { label: "+", icon: <Plus className="w-3.5 h-3.5" />, onClick: () => zoom(1.25) },
          { label: "−", icon: <Minus className="w-3.5 h-3.5" />, onClick: () => zoom(0.8) },
          { label: "fit", icon: <Maximize2 className="w-3.5 h-3.5" />, onClick: fitView },
        ].map(btn => (
          <button
            key={btn.label}
            onClick={btn.onClick}
            title={btn.label}
            className="w-8 h-8 rounded-lg bg-gray-800/90 border border-gray-700 text-gray-400 hover:text-white hover:bg-gray-700 flex items-center justify-center transition-all shadow-lg backdrop-blur-sm"
          >
            {btn.icon}
          </button>
        ))}
      </div>

      {/* ── Category legend + filter ── */}
      {dirs.length > 0 && (
        <div className="absolute bottom-5 right-5 bg-gray-900/90 border border-gray-700/60 rounded-xl p-3 max-h-64 overflow-y-auto backdrop-blur-sm shadow-2xl min-w-[120px]">
          <p className="text-[9px] font-bold uppercase tracking-widest text-gray-500 mb-2.5 px-0.5">
            Categories
          </p>

          <button
            onClick={() => setFilterDir(null)}
            className={cn(
              "flex items-center gap-2 w-full text-left py-0.5 px-0.5 rounded text-[11.5px] transition-colors",
              filterDir === null ? "text-gray-200" : "text-gray-500 hover:text-gray-300",
            )}
          >
            <span className="w-2 h-2 rounded-full bg-gray-600 shrink-0" />
            All
          </button>

          {dirs.map(d => (
            <button
              key={d}
              onClick={() => setFilterDir(prev => prev === d ? null : d)}
              className={cn(
                "flex items-center gap-2 w-full text-left py-0.5 px-0.5 rounded text-[11.5px] capitalize transition-colors",
                filterDir === d ? "text-gray-100" : "text-gray-500 hover:text-gray-300",
              )}
            >
              <span
                className="w-2 h-2 rounded-full shrink-0 transition-all"
                style={{
                  background: color(d),
                  boxShadow: filterDir === d ? `0 0 6px ${color(d)}` : "none",
                }}
              />
              {d}
            </button>
          ))}
        </div>
      )}

      {/* ── Instructions ── */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 pointer-events-none">
        <p className="text-[11px] text-gray-600 bg-gray-900/60 px-3 py-1 rounded-full backdrop-blur-sm border border-gray-800">
          Drag to pan · Scroll to zoom · Click a node to open · Drag a node to pin it
        </p>
      </div>
    </div>
  );
}
