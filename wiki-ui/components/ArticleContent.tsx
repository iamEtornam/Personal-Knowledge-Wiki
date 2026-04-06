"use client";

import { preprocessWikiContent } from "@/lib/preprocess-wiki-content";
import GithubSlugger from "github-slugger";
import Link from "next/link";
import ReactMarkdown, { Components } from "react-markdown";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";

interface ArticleContentProps {
  content: string;
  allSlugs: string[];
}

// Strip markdown decorators to approximate plain heading text,
// matching what hastHeadingPlainText produces from the rendered hast.
function stripHeadingMarkdown(raw: string): string {
  return raw
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/_([^_]+)_/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .trim();
}

export default function ArticleContent({
  content,
  allSlugs,
}: ArticleContentProps) {
  const processedContent = preprocessWikiContent(content, allSlugs);

  // Pre-compute heading IDs from the processed markdown string.
  // Doing this outside the React render cycle makes server and client
  // always produce the same ID sequence, preventing hydration mismatches.
  const headingIds: string[] = [];
  const slugger = new GithubSlugger();
  for (const m of processedContent.matchAll(/^(#{2,3})\s+(.+)$/gm)) { // h1 is suppressed; only count h2/h3
    headingIds.push(slugger.slug(stripHeadingMarkdown(m[2])));
  }

  // Consumed in document order during rendering. Safe because React
  // processes each component invocation's JSX synchronously and sequentially.
  let hi = 0;

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
    // The page template already renders the article title as <h1>.
    // Suppress any # heading in the markdown body to avoid duplication.
    h1() {
      return null;
    },
    h2({ children, ...props }) {
      const id = headingIds[hi++] ?? "";
      return (
        <h2 {...props} id={id}>
          {children}
        </h2>
      );
    },
    h3({ children, ...props }) {
      const id = headingIds[hi++] ?? "";
      return (
        <h3 {...props} id={id}>
          {children}
        </h3>
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
