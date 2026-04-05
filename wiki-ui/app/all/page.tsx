import { getAllArticles } from "@/lib/wiki";
import Link from "next/link";

export const metadata = { title: "All Articles — Personal Wiki" };

export default function AllArticlesPage() {
  const articles = getAllArticles();

  const byLetter: Record<string, typeof articles> = {};
  for (const article of articles) {
    const letter = article.title[0]?.toUpperCase() || "#";
    if (!byLetter[letter]) byLetter[letter] = [];
    byLetter[letter].push(article);
  }
  const letters = Object.keys(byLetter).sort();

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 32px" }}>
      <h1
        style={{
          fontFamily: "Georgia, serif",
          fontWeight: "normal",
          fontSize: 26,
          borderBottom: "1px solid #a2a9b1",
          paddingBottom: 6,
          marginBottom: 16,
        }}
      >
        All Articles ({articles.length})
      </h1>

      {/* Letter index */}
      <div style={{ marginBottom: 20, display: "flex", flexWrap: "wrap", gap: 4 }}>
        {letters.map((l) => (
          <a
            key={l}
            href={`#letter-${l}`}
            style={{
              display: "inline-block",
              padding: "2px 8px",
              border: "1px solid #a2a9b1",
              color: "#3366cc",
              textDecoration: "none",
              fontSize: 13,
              borderRadius: 2,
            }}
          >
            {l}
          </a>
        ))}
      </div>

      {letters.map((l) => (
        <div key={l} id={`letter-${l}`} style={{ marginBottom: 24 }}>
          <h2
            style={{
              fontSize: 20,
              fontFamily: "Georgia, serif",
              fontWeight: "normal",
              borderBottom: "1px solid #eaecf0",
              paddingBottom: 4,
              marginBottom: 8,
              color: "#000",
            }}
          >
            {l}
          </h2>
          <ul
            style={{
              margin: 0,
              padding: 0,
              listStyle: "none",
              columns: 3,
              columnGap: 16,
            }}
          >
            {byLetter[l].map((a) => (
              <li key={a.slug} style={{ marginBottom: 4, breakInside: "avoid" }}>
                <Link
                  href={`/wiki/${a.slug}`}
                  style={{ color: "#3366cc", textDecoration: "none", fontSize: 13 }}
                >
                  {a.title}
                </Link>
                {a.directory && (
                  <span style={{ color: "#54595d", fontSize: 11, marginLeft: 4 }}>
                    ({a.directory})
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}

      {articles.length === 0 && (
        <p style={{ color: "#54595d" }}>No articles yet.</p>
      )}
    </div>
  );
}
