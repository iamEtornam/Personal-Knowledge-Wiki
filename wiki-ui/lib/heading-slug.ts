import GithubSlugger from "github-slugger";
import type { Element as HastElement, RootContent } from "hast";

export interface TocHeading {
  id: string;
  text: string;
  level: number;
}

/** Plain text inside a hast heading node (matches GitHub-style slug input). */
export function hastHeadingPlainText(node: HastElement | undefined): string {
  if (!node?.children?.length) return "";
  return node.children.map(hastChildPlainText).join("");
}

function hastChildPlainText(child: RootContent): string {
  if (child.type === "text") return child.value;
  if (child.type === "element") return hastHeadingPlainText(child);
  return "";
}

/**
 * Approximate visible heading text so slugs match react-markdown hast output.
 */
function stripMarkdownDecorators(line: string): string {
  let s = line.trim();
  s = s.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1");
  s = s.replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1");
  s = s.replace(/\*\*([^*]+)\*\*/g, "$1");
  s = s.replace(/__([^_]+)__/g, "$1");
  s = s.replace(/\*([^*]+)\*/g, "$1");
  s = s.replace(/_([^_]+)_/g, "$1");
  s = s.replace(/`([^`]+)`/g, "$1");
  return s.trim();
}

/**
 * Headings ## / ### in document order, with ids matching {@link GithubSlugger}
 * after the same sequence of slug calls on rendered h2/h3.
 */
export function extractTocHeadings(markdown: string): TocHeading[] {
  const slugger = new GithubSlugger();
  const results: TocHeading[] = [];
  const re = /^(#{2,3})\s+(.+)$/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(markdown)) !== null) {
    const level = m[1].length;
    const text = stripMarkdownDecorators(m[2]);
    const id = slugger.slug(text);
    results.push({ id, text, level });
  }
  return results;
}
