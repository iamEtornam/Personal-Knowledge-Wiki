"use client";

import { useEffect, useState } from "react";
import { List } from "lucide-react";

interface Heading { id: string; text: string; level: number }

function extractHeadings(content: string): Heading[] {
  const results: Heading[] = [];
  const re = /^(#{2,3})\s+(.+)$/gm;
  let m;
  while ((m = re.exec(content)) !== null) {
    const level = m[1].length;
    const text  = m[2].replace(/\*\*/g, "").trim();
    const id    = text.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    results.push({ id, text, level });
  }
  return results;
}

export default function TableOfContents({ content }: { content: string }) {
  const [activeId, setActiveId] = useState("");
  const [collapsed, setCollapsed] = useState(false);
  const headings = extractHeadings(content);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) setActiveId(e.target.id); }),
      { rootMargin: "-20% 0% -70% 0%" }
    );
    headings.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [headings]);

  if (headings.length < 3) return null;

  return (
    <div className="border border-blue-200 rounded-lg bg-blue-50 mb-5 inline-block min-w-[200px] max-w-xs text-sm">
      <button
        onClick={() => setCollapsed(c => !c)}
        className="flex items-center justify-between w-full px-3 py-2 text-left"
      >
        <span className="flex items-center gap-1.5 text-xs font-bold text-blue-800 uppercase tracking-wider">
          <List className="w-3.5 h-3.5" /> Contents
        </span>
        <span className="text-blue-400 text-xs">{collapsed ? "show" : "hide"}</span>
      </button>

      {!collapsed && (
        <ol className="px-3 pb-3 space-y-0.5 border-t border-blue-200">
          {headings.map((h, i) => (
            <li
              key={h.id}
              className={`${h.level === 3 ? "ml-4" : ""}`}
              style={{ listStyle: h.level === 3 ? "none" : "decimal" }}
            >
              <a
                href={`#${h.id}`}
                onClick={e => {
                  e.preventDefault();
                  document.getElementById(h.id)?.scrollIntoView({ behavior: "smooth" });
                }}
                className={`block py-0.5 no-underline text-[12.5px] leading-snug transition-colors ${
                  activeId === h.id
                    ? "text-blue-800 font-semibold"
                    : "text-blue-600 hover:text-blue-800"
                }`}
              >
                {h.level === 3 && <span className="text-blue-300 mr-1">↳</span>}
                {h.text}
              </a>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
