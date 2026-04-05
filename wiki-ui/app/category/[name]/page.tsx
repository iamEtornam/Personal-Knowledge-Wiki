import { getAllArticles } from "@/lib/wiki";
import Link from "next/link";
import { notFound } from "next/navigation";

interface CategoryPageProps {
  params: Promise<{ name: string }>;
}

export async function generateStaticParams() {
  const articles = getAllArticles();
  const dirs = [...new Set(articles.map((a) => a.directory).filter(Boolean))];
  return dirs.map((name) => ({ name }));
}

export async function generateMetadata({ params }: CategoryPageProps) {
  const { name } = await params;
  return {
    title: `${name.charAt(0).toUpperCase() + name.slice(1)} — Personal Wiki`,
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { name } = await params;
  const allArticles = getAllArticles();
  const articles = allArticles.filter((a) => a.directory === name);

  if (articles.length === 0) notFound();

  const sortedArticles = [...articles].sort((a, b) =>
    a.title.localeCompare(b.title)
  );

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 32px" }}>
      <div style={{ fontSize: 12, color: "#54595d", marginBottom: 8 }}>
        <Link href="/" style={{ color: "#3366cc", textDecoration: "none" }}>
          Wiki
        </Link>
        {" › "}
        <span style={{ textTransform: "capitalize" }}>{name}</span>
      </div>

      <h1
        style={{
          fontFamily: "Georgia, serif",
          fontWeight: "normal",
          fontSize: 26,
          borderBottom: "1px solid #a2a9b1",
          paddingBottom: 6,
          marginBottom: 20,
          textTransform: "capitalize",
        }}
      >
        {name}
        <span style={{ fontSize: 16, color: "#54595d", marginLeft: 12 }}>
          ({articles.length} article{articles.length !== 1 ? "s" : ""})
        </span>
      </h1>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          gap: 12,
        }}
      >
        {sortedArticles.map((a) => (
          <Link
            key={a.slug}
            href={`/wiki/${a.slug}`}
            style={{ textDecoration: "none" }}
          >
            <div
              style={{
                border: "1px solid #eaecf0",
                borderRadius: 3,
                padding: "10px 14px",
                background: "#fff",
                cursor: "pointer",
                transition: "border-color 0.15s",
              }}
            >
              <div
                style={{
                  fontWeight: "bold",
                  color: "#3366cc",
                  fontSize: 14,
                  marginBottom: 4,
                }}
              >
                {a.title}
              </div>
              <div style={{ color: "#54595d", fontSize: 12 }}>
                {a.wordCount.toLocaleString()} words
                {a.last_updated && ` · ${a.last_updated}`}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
