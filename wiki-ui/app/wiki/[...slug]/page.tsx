import { getAllArticles, getArticleBySlug, getBacklinks } from "@/lib/wiki";
import { notFound } from "next/navigation";
import Link from "next/link";
import ArticleContent from "@/components/ArticleContent";
import TableOfContents from "@/components/TableOfContents";

interface ArticlePageProps {
  params: Promise<{ slug: string[] }>;
}

export async function generateStaticParams() {
  const articles = getAllArticles();
  return articles.map((a) => ({
    slug: a.slug.split("/"),
  }));
}

export async function generateMetadata({ params }: ArticlePageProps) {
  const { slug } = await params;
  const article = getArticleBySlug(slug.join("/"));
  if (!article) return { title: "Not Found" };
  return { title: `${article.title} — Personal Wiki` };
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const slugStr = slug.join("/");
  const article = getArticleBySlug(slugStr);

  if (!article) notFound();

  const allArticles = getAllArticles();
  const allSlugs = allArticles.map((a) => a.slug);
  const backlinks = getBacklinks();
  const articleBacklinks: string[] = backlinks[article.title] || [];

  const relatedArticles = article.related
    .map((r) => {
      const title = r.replace(/^\[\[|\]\]$/g, "");
      return allArticles.find((a) => a.title === title);
    })
    .filter(Boolean);

  return (
    <div style={{ display: "flex", maxWidth: 1100, margin: "0 auto" }}>
      {/* Article */}
      <div style={{ flex: 1, minWidth: 0, padding: "24px 32px 48px" }}>
        {/* Breadcrumb */}
        {article.directory && (
          <div style={{ fontSize: 12, color: "#54595d", marginBottom: 8 }}>
            <Link
              href="/"
              style={{ color: "#3366cc", textDecoration: "none" }}
            >
              Wiki
            </Link>
            {" › "}
            <Link
              href={`/category/${article.directory}`}
              style={{ color: "#3366cc", textDecoration: "none" }}
            >
              {article.directory}
            </Link>
            {" › "}
            <span>{article.title}</span>
          </div>
        )}

        {/* Title */}
        <h1
          style={{
            fontFamily: "Georgia, serif",
            fontSize: 26,
            fontWeight: "normal",
            borderBottom: "1px solid #a2a9b1",
            paddingBottom: 6,
            marginBottom: 16,
            color: "#000",
          }}
        >
          {article.title}
        </h1>

        {/* Metadata bar */}
        <div
          style={{
            display: "flex",
            gap: 16,
            fontSize: 12,
            color: "#54595d",
            marginBottom: 20,
            flexWrap: "wrap",
          }}
        >
          {article.type && (
            <span
              style={{
                background: "#eaf3fb",
                border: "1px solid #a2a9b1",
                padding: "1px 7px",
                borderRadius: 2,
                color: "#3366cc",
                textTransform: "capitalize",
              }}
            >
              {article.type}
            </span>
          )}
          {article.created && <span>Created: {article.created}</span>}
          {article.last_updated && (
            <span>Updated: {article.last_updated}</span>
          )}
          <span>{article.wordCount.toLocaleString()} words</span>
        </div>

        {/* TOC */}
        <TableOfContents content={article.content} />

        {/* Content */}
        <ArticleContent content={article.content} allSlugs={allSlugs} />

        {/* Backlinks */}
        {articleBacklinks.length > 0 && (
          <div
            style={{
              borderTop: "1px solid #eaecf0",
              marginTop: 32,
              paddingTop: 16,
            }}
          >
            <h3
              style={{
                fontSize: 14,
                fontWeight: "bold",
                marginBottom: 8,
                color: "#54595d",
              }}
            >
              What links here ({articleBacklinks.length})
            </h3>
            <ul
              style={{
                margin: 0,
                padding: "0 0 0 20px",
                columns: 2,
                fontSize: 13,
              }}
            >
              {articleBacklinks.map((bl) => {
                const linked = allArticles.find((a) => a.title === bl);
                return (
                  <li key={bl} style={{ marginBottom: 3 }}>
                    {linked ? (
                      <Link
                        href={`/wiki/${linked.slug}`}
                        style={{ color: "#3366cc", textDecoration: "none" }}
                      >
                        {bl}
                      </Link>
                    ) : (
                      <span style={{ color: "#54595d" }}>{bl}</span>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>

      {/* Right sidebar — infobox */}
      {(relatedArticles.length > 0 || article.sources.length > 0) && (
        <div
          style={{
            width: 220,
            flexShrink: 0,
            padding: "24px 16px 24px 0",
          }}
        >
          {relatedArticles.length > 0 && (
            <div
              style={{
                border: "1px solid #a2a9b1",
                background: "#f8f9fa",
                padding: 12,
                marginBottom: 16,
                fontSize: 13,
              }}
            >
              <div
                style={{
                  fontWeight: "bold",
                  borderBottom: "1px solid #a2a9b1",
                  paddingBottom: 4,
                  marginBottom: 8,
                }}
              >
                Related
              </div>
              <ul style={{ margin: 0, padding: "0 0 0 16px" }}>
                {relatedArticles.map((r) =>
                  r ? (
                    <li key={r.slug} style={{ marginBottom: 4 }}>
                      <Link
                        href={`/wiki/${r.slug}`}
                        style={{ color: "#3366cc", textDecoration: "none" }}
                      >
                        {r.title}
                      </Link>
                    </li>
                  ) : null
                )}
              </ul>
            </div>
          )}

          {article.sources.length > 0 && (
            <div
              style={{
                border: "1px solid #a2a9b1",
                background: "#f8f9fa",
                padding: 12,
                fontSize: 12,
              }}
            >
              <div
                style={{
                  fontWeight: "bold",
                  borderBottom: "1px solid #a2a9b1",
                  paddingBottom: 4,
                  marginBottom: 8,
                }}
              >
                Sources ({article.sources.length})
              </div>
              <ul style={{ margin: 0, padding: "0 0 0 14px", color: "#54595d" }}>
                {article.sources.slice(0, 5).map((s) => (
                  <li key={s} style={{ marginBottom: 2, wordBreak: "break-all" }}>
                    {s}
                  </li>
                ))}
                {article.sources.length > 5 && (
                  <li style={{ color: "#3366cc" }}>
                    +{article.sources.length - 5} more
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
