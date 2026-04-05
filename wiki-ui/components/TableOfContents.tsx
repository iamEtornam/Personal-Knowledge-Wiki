"use client";

import { useEffect, useState } from "react";

interface Heading {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  content: string;
}

function extractHeadings(content: string): Heading[] {
  const headingRegex = /^(#{2,3})\s+(.+)$/gm;
  const headings: Heading[] = [];
  let match;

  while ((match = headingRegex.exec(content)) !== null) {
    const level = match[1].length;
    const text = match[2].replace(/\*\*/g, "").trim();
    const id = text
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
    headings.push({ id, text, level });
  }

  return headings;
}

export default function TableOfContents({ content }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>("");
  const headings = extractHeadings(content);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
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
    <div
      style={{
        border: "1px solid #a2a9b1",
        background: "#f8f9fa",
        padding: "12px 16px",
        marginBottom: "1.5em",
        display: "inline-block",
        minWidth: 200,
        maxWidth: 320,
        fontSize: 13,
      }}
    >
      <div
        style={{
          fontWeight: "bold",
          marginBottom: 6,
          textAlign: "center",
          fontSize: 12,
          color: "#54595d",
        }}
      >
        Contents
      </div>
      <ol style={{ margin: 0, padding: "0 0 0 20px" }}>
        {headings.map((h, i) => (
          <li
            key={h.id}
            style={{
              marginBottom: 2,
              marginLeft: h.level === 3 ? 16 : 0,
              listStyle: h.level === 3 ? "none" : "decimal",
            }}
          >
            <a
              href={`#${h.id}`}
              style={{
                color: activeId === h.id ? "#000" : "#3366cc",
                fontWeight: activeId === h.id ? "bold" : "normal",
                textDecoration: "none",
                fontSize: h.level === 3 ? 12 : 13,
              }}
              onClick={(e) => {
                e.preventDefault();
                document
                  .getElementById(h.id)
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              {h.level === 3 && (
                <span style={{ color: "#54595d", marginRight: 4 }}>↳</span>
              )}
              {h.text}
            </a>
          </li>
        ))}
      </ol>
    </div>
  );
}
