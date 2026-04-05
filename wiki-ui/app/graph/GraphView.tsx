"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

interface Node {
  id: string;
  title: string;
  directory: string;
  wordCount: number;
  linkCount: number;
  // layout positions (mutable)
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
}

interface Link {
  source: string;
  target: string;
}

interface GraphViewProps {
  nodes: Node[];
  links: Link[];
}

const DIRECTORY_COLORS: Record<string, string> = {
  people: "#4e79a7",
  projects: "#f28e2b",
  philosophies: "#76b7b2",
  patterns: "#59a14f",
  places: "#e15759",
  films: "#af7aa1",
  books: "#ff9da7",
  music: "#9c755f",
  eras: "#bab0ac",
  decisions: "#edc948",
  transitions: "#b07aa1",
  ideas: "#17becf",
  tools: "#aec7e8",
  companies: "#ffbb78",
  events: "#98df8a",
  "": "#a2a9b1",
};

function getColor(directory: string): string {
  return DIRECTORY_COLORS[directory] || "#a2a9b1";
}

function nodeRadius(n: Node): number {
  const base = 5;
  const fromLinks = Math.min(n.linkCount, 20);
  return base + fromLinks * 1.2;
}

export default function GraphView({ nodes, links }: GraphViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const router = useRouter();
  const stateRef = useRef({
    nodes: [] as (Node & { x: number; y: number; vx: number; vy: number })[],
    links: [] as { source: string; target: string }[],
    offsetX: 0,
    offsetY: 0,
    scale: 1,
    dragging: false,
    lastX: 0,
    lastY: 0,
    hovered: null as string | null,
    animating: true,
  });

  const [tooltip, setTooltip] = useState<{
    title: string;
    x: number;
    y: number;
  } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const s = stateRef.current;
    const w = canvas.offsetWidth;
    const h = canvas.offsetHeight;
    canvas.width = w;
    canvas.height = h;

    s.offsetX = w / 2;
    s.offsetY = h / 2;

    s.nodes = nodes.map((n) => ({
      ...n,
      x: (Math.random() - 0.5) * 400,
      y: (Math.random() - 0.5) * 400,
      vx: 0,
      vy: 0,
    }));
    s.links = links;
    s.animating = true;

    const nodeMap = new Map(s.nodes.map((n) => [n.id, n]));

    function tick() {
      if (!s.animating) return;

      // Repulsion
      for (let i = 0; i < s.nodes.length; i++) {
        for (let j = i + 1; j < s.nodes.length; j++) {
          const a = s.nodes[i];
          const b = s.nodes[j];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = 1800 / (dist * dist);
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;
          a.vx -= fx;
          a.vy -= fy;
          b.vx += fx;
          b.vy += fy;
        }
      }

      // Attraction along links
      for (const link of s.links) {
        const a = nodeMap.get(link.source);
        const b = nodeMap.get(link.target);
        if (!a || !b) continue;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const target = 120;
        const force = (dist - target) * 0.03;
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        a.vx += fx;
        a.vy += fy;
        b.vx -= fx;
        b.vy -= fy;
      }

      // Center gravity
      for (const n of s.nodes) {
        n.vx -= n.x * 0.005;
        n.vy -= n.y * 0.005;
      }

      // Integrate + dampen
      for (const n of s.nodes) {
        n.vx *= 0.85;
        n.vy *= 0.85;
        n.x += n.vx;
        n.y += n.vy;
      }

      draw();
      requestAnimationFrame(tick);
    }

    function draw() {
      const ctx = canvas?.getContext("2d");
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.translate(s.offsetX, s.offsetY);
      ctx.scale(s.scale, s.scale);

      // Draw links
      for (const link of s.links) {
        const a = nodeMap.get(link.source);
        const b = nodeMap.get(link.target);
        if (!a || !b) continue;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle =
          s.hovered === link.source || s.hovered === link.target
            ? "#3366cc66"
            : "#a2a9b122";
        ctx.lineWidth =
          s.hovered === link.source || s.hovered === link.target ? 1.5 : 0.8;
        ctx.stroke();
      }

      // Draw nodes
      for (const n of s.nodes) {
        const r = nodeRadius(n);
        const isHovered = s.hovered === n.id;
        ctx.beginPath();
        ctx.arc(n.x, n.y, isHovered ? r + 2 : r, 0, Math.PI * 2);
        ctx.fillStyle = getColor(n.directory);
        ctx.globalAlpha = isHovered ? 1 : 0.85;
        ctx.fill();
        ctx.globalAlpha = 1;
        if (isHovered) {
          ctx.strokeStyle = "#000";
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }

        // Labels for larger/hovered nodes
        if (r > 8 || isHovered) {
          ctx.fillStyle = isHovered ? "#000" : "#202122";
          ctx.font = `${isHovered ? "bold " : ""}${Math.min(11, r + 2)}px sans-serif`;
          ctx.textAlign = "center";
          ctx.fillText(
            n.title.length > 20 ? n.title.slice(0, 18) + "…" : n.title,
            n.x,
            n.y + r + 12
          );
        }
      }

      ctx.restore();
    }

    requestAnimationFrame(tick);

    // Stop simulation after a while
    const stopTimer = setTimeout(() => {
      s.animating = false;
      draw();
    }, 6000);

    return () => {
      s.animating = false;
      clearTimeout(stopTimer);
    };
  }, [nodes, links]);

  // Pan
  function onMouseDown(e: React.MouseEvent) {
    const s = stateRef.current;
    s.dragging = true;
    s.lastX = e.clientX;
    s.lastY = e.clientY;
  }

  function onMouseMove(e: React.MouseEvent) {
    const s = stateRef.current;
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (s.dragging) {
      s.offsetX += e.clientX - s.lastX;
      s.offsetY += e.clientY - s.lastY;
      s.lastX = e.clientX;
      s.lastY = e.clientY;
      if (!s.animating) redraw();
      return;
    }

    // Hit-test for hover
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left - s.offsetX) / s.scale;
    const my = (e.clientY - rect.top - s.offsetY) / s.scale;

    let found: (Node & { x: number; y: number }) | null = null;
    for (const n of s.nodes) {
      const r = nodeRadius(n);
      const dx = mx - (n as { x: number }).x;
      const dy = my - (n as { y: number }).y;
      if (Math.sqrt(dx * dx + dy * dy) < r + 4) {
        found = n as Node & { x: number; y: number };
        break;
      }
    }

    const prev = s.hovered;
    s.hovered = found ? found.id : null;
    if (s.hovered !== prev && !s.animating) redraw();

    if (found) {
      setTooltip({ title: found.title, x: e.clientX, y: e.clientY });
      canvas.style.cursor = "pointer";
    } else {
      setTooltip(null);
      canvas.style.cursor = s.dragging ? "grabbing" : "grab";
    }
  }

  function onMouseUp(e: React.MouseEvent) {
    const s = stateRef.current;
    s.dragging = false;

    // Click detection
    if (s.hovered) {
      router.push(`/wiki/${s.hovered}`);
    }
  }

  function onWheel(e: React.WheelEvent) {
    const s = stateRef.current;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    s.offsetX = mx + (s.offsetX - mx) * delta;
    s.offsetY = my + (s.offsetY - my) * delta;
    s.scale *= delta;
    s.scale = Math.min(Math.max(s.scale, 0.1), 8);
    if (!s.animating) redraw();
  }

  function redraw() {
    const canvas = canvasRef.current;
    const s = stateRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const nodeMap = new Map(s.nodes.map((n) => [n.id, n]));

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(s.offsetX, s.offsetY);
    ctx.scale(s.scale, s.scale);

    for (const link of s.links) {
      const a = nodeMap.get(link.source);
      const b = nodeMap.get(link.target);
      if (!a || !b) continue;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.strokeStyle =
        s.hovered === link.source || s.hovered === link.target
          ? "#3366cc66"
          : "#a2a9b122";
      ctx.lineWidth =
        s.hovered === link.source || s.hovered === link.target ? 1.5 : 0.8;
      ctx.stroke();
    }

    for (const n of s.nodes) {
      const r = nodeRadius(n);
      const isHovered = s.hovered === n.id;
      ctx.beginPath();
      ctx.arc(n.x, n.y, isHovered ? r + 2 : r, 0, Math.PI * 2);
      ctx.fillStyle = getColor(n.directory);
      ctx.globalAlpha = isHovered ? 1 : 0.85;
      ctx.fill();
      ctx.globalAlpha = 1;
      if (isHovered) {
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
      if (r > 8 || isHovered) {
        ctx.fillStyle = isHovered ? "#000" : "#202122";
        ctx.font = `${isHovered ? "bold " : ""}${Math.min(11, r + 2)}px sans-serif`;
        ctx.textAlign = "center";
        ctx.fillText(
          n.title.length > 20 ? n.title.slice(0, 18) + "…" : n.title,
          n.x,
          n.y + r + 12
        );
      }
    }
    ctx.restore();
  }

  // Legend entries (only dirs that appear)
  const dirs = [...new Set(nodes.map((n) => n.directory).filter(Boolean))].sort();

  return (
    <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
      <canvas
        ref={canvasRef}
        style={{ width: "100%", height: "100%", display: "block", cursor: "grab" }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={() => {
          stateRef.current.dragging = false;
          stateRef.current.hovered = null;
          setTooltip(null);
        }}
        onWheel={onWheel}
      />

      {/* Tooltip */}
      {tooltip && (
        <div
          style={{
            position: "fixed",
            left: tooltip.x + 12,
            top: tooltip.y - 8,
            background: "#000000cc",
            color: "#fff",
            padding: "4px 10px",
            borderRadius: 3,
            fontSize: 12,
            pointerEvents: "none",
            whiteSpace: "nowrap",
          }}
        >
          {tooltip.title}
        </div>
      )}

      {/* Legend */}
      {dirs.length > 0 && (
        <div
          style={{
            position: "absolute",
            bottom: 16,
            right: 16,
            background: "#ffffffee",
            border: "1px solid #eaecf0",
            padding: "8px 12px",
            fontSize: 11,
            borderRadius: 3,
            maxHeight: 220,
            overflowY: "auto",
          }}
        >
          {dirs.map((d) => (
            <div
              key={d}
              style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}
            >
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  background: getColor(d),
                  display: "inline-block",
                  flexShrink: 0,
                }}
              />
              <span style={{ textTransform: "capitalize", color: "#202122" }}>{d}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
