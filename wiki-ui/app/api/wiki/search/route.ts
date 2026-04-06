import { NextRequest, NextResponse } from "next/server";
import { getAllArticles } from "@/lib/wiki";

/** Plain text only; highlighting is done in the client to avoid HTML injection. */
function excerpt(content: string, query: string, length = 200): string {
  const idx = content.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) {
    const plain = content.replace(/[#*`\[\]]/g, "").trim();
    const slice = plain.slice(0, length) + (plain.length > length ? "..." : "");
    return slice;
  }

  const start = Math.max(0, idx - 80);
  const end = Math.min(content.length, idx + length - 80);
  const snippet = content.slice(start, end).replace(/[#*`\[\]]/g, "").trim();
  return (start > 0 ? "..." : "") + snippet + (end < content.length ? "..." : "");
}

export function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") || "";
  if (!q.trim()) {
    return NextResponse.json({ results: [] });
  }

  const articles = getAllArticles();
  const lower = q.toLowerCase();

  const scored = articles
    .map((a) => {
      const titleMatch = a.title.toLowerCase().includes(lower);
      const contentMatch = a.content.toLowerCase().includes(lower);
      const score =
        (titleMatch ? 10 : 0) +
        (contentMatch
          ? (a.content.toLowerCase().split(lower).length - 1)
          : 0);

      return { article: a, score, titleMatch, contentMatch };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 20);

  const results = scored.map(({ article }) => ({
    slug: article.slug,
    title: article.title,
    directory: article.directory,
    wordCount: article.wordCount,
    excerpt: excerpt(article.content, q),
  }));

  return NextResponse.json({ results });
}
