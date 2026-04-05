"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import Link from "next/link";
import { Components } from "react-markdown";

interface ArticleContentProps {
  content: string;
  allSlugs: string[];
}

function resolveWikilink(text: string, allSlugs: string[]): string {
  const slug = text
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
  const found = allSlugs.find((s) => {
    const base = s.split("/").pop() || "";
    return (
      base.toLowerCase() === slug ||
      base.toLowerCase().replace(/-/g, " ") === text.toLowerCase()
    );
  });
  return found ? `/wiki/${found}` : "";
}

export default function ArticleContent({
  content,
  allSlugs,
}: ArticleContentProps) {
  const processedContent = content.replace(
    /\[\[([^\]]+)\]\]/g,
    (match, title) => {
      const href = resolveWikilink(title, allSlugs);
      if (href) {
        return `[${title}](${href})`;
      }
      return `[${title}](#missing "Article does not exist yet")`;
    }
  );

  const components: Components = {
    a({ href, children, title, ...props }) {
      const isMissing = title === "Article does not exist yet";
      const isExternal = href?.startsWith("http");
      const isInternal = href?.startsWith("/");

      if (isMissing) {
        return (
          <span
            style={{ color: "#cc2200", cursor: "not-allowed" }}
            title="This article does not exist yet"
          >
            {children}
          </span>
        );
      }

      if (isInternal && !isExternal) {
        return (
          <Link
            href={href || "#"}
            style={{ color: "#3366cc", textDecoration: "none" }}
            {...(props as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
          >
            {children}
          </Link>
        );
      }

      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "#3366cc" }}
          {...props}
        >
          {children}
          <sup style={{ fontSize: "0.7em", marginLeft: 1 }}>↗</sup>
        </a>
      );
    },
    img({ src, alt }) {
      return (
        <span
          style={{
            display: "block",
            margin: "1em 0",
            textAlign: "center",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt || ""}
            style={{
              maxWidth: "100%",
              maxHeight: 400,
              border: "1px solid #a2a9b1",
              padding: 4,
              background: "#fff",
            }}
          />
          {alt && (
            <span
              style={{
                display: "block",
                fontSize: 12,
                color: "#54595d",
                marginTop: 4,
                fontStyle: "italic",
              }}
            >
              {alt}
            </span>
          )}
        </span>
      );
    },
  };

  return (
    <div className="wiki-content">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={components}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
}
