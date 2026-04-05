import { getAllArticles, getDirectories, getBacklinks } from "@/lib/wiki";
import Link from "next/link";

export const metadata = { title: "Stats — Personal Wiki" };

export default function StatsPage() {
  const articles = getAllArticles();
  const directories = getDirectories();
  const backlinks = getBacklinks();

  const totalWords = articles.reduce((s, a) => s + a.wordCount, 0);
  const avgWords =
    articles.length > 0 ? Math.round(totalWords / articles.length) : 0;

  const mostLinked = articles
    .map((a) => ({
      article: a,
      count: (backlinks[a.title] || []).length,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const orphans = articles.filter(
    (a) => !(backlinks[a.title]?.length > 0)
  );

  const longest = [...articles]
    .sort((a, b) => b.wordCount - a.wordCount)
    .slice(0, 10);

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 32px" }}>
      <h1
        style={{
          fontFamily: "Georgia, serif",
          fontWeight: "normal",
          fontSize: 26,
          borderBottom: "1px solid #a2a9b1",
          paddingBottom: 6,
          marginBottom: 24,
        }}
      >
        Wiki Stats
      </h1>

      {/* Overview */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 12,
          marginBottom: 32,
        }}
      >
        {[
          { label: "Articles", value: articles.length.toLocaleString() },
          { label: "Categories", value: directories.length.toString() },
          { label: "Total Words", value: totalWords.toLocaleString() },
          { label: "Avg Words", value: avgWords.toLocaleString() },
        ].map((s) => (
          <div
            key={s.label}
            style={{
              border: "1px solid #eaecf0",
              borderRadius: 4,
              padding: "12px 16px",
              background: "#fff",
              textAlign: "center",
            }}
          >
            <div
              style={{ fontSize: 28, fontWeight: "bold", color: "#3366cc" }}
            >
              {s.value}
            </div>
            <div style={{ fontSize: 12, color: "#54595d", marginTop: 2 }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        {/* Most linked */}
        <Section title={`Most Linked (${mostLinked.filter(x => x.count > 0).length})`}>
          {mostLinked.filter((x) => x.count > 0).length === 0 ? (
            <p style={{ color: "#54595d", fontSize: 13 }}>
              No backlinks yet — run /wiki absorb to build them.
            </p>
          ) : (
            <table style={{ width: "100%", fontSize: 13 }}>
              <tbody>
                {mostLinked
                  .filter((x) => x.count > 0)
                  .map(({ article, count }) => (
                    <tr key={article.slug}>
                      <td style={{ padding: "4px 0" }}>
                        <Link
                          href={`/wiki/${article.slug}`}
                          style={{
                            color: "#3366cc",
                            textDecoration: "none",
                          }}
                        >
                          {article.title}
                        </Link>
                      </td>
                      <td
                        style={{
                          textAlign: "right",
                          color: "#54595d",
                          paddingLeft: 8,
                        }}
                      >
                        {count} link{count !== 1 ? "s" : ""}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}
        </Section>

        {/* Longest articles */}
        <Section title="Longest Articles">
          {longest.length === 0 ? (
            <p style={{ color: "#54595d", fontSize: 13 }}>No articles yet.</p>
          ) : (
            <table style={{ width: "100%", fontSize: 13 }}>
              <tbody>
                {longest.map((a) => (
                  <tr key={a.slug}>
                    <td style={{ padding: "4px 0" }}>
                      <Link
                        href={`/wiki/${a.slug}`}
                        style={{ color: "#3366cc", textDecoration: "none" }}
                      >
                        {a.title}
                      </Link>
                    </td>
                    <td
                      style={{
                        textAlign: "right",
                        color: "#54595d",
                        paddingLeft: 8,
                      }}
                    >
                      {a.wordCount.toLocaleString()}w
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Section>

        {/* By category */}
        <Section title="Articles by Category">
          {directories.length === 0 ? (
            <p style={{ color: "#54595d", fontSize: 13 }}>No categories yet.</p>
          ) : (
            <table style={{ width: "100%", fontSize: 13 }}>
              <tbody>
                {directories.map((d) => (
                  <tr key={d.name}>
                    <td style={{ padding: "4px 0" }}>
                      <Link
                        href={`/category/${d.name}`}
                        style={{
                          color: "#3366cc",
                          textDecoration: "none",
                          textTransform: "capitalize",
                        }}
                      >
                        {d.name}
                      </Link>
                    </td>
                    <td
                      style={{
                        textAlign: "right",
                        color: "#54595d",
                        paddingLeft: 8,
                      }}
                    >
                      {d.count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Section>

        {/* Orphans */}
        <Section title={`Orphan Articles (${orphans.length})`}>
          {orphans.length === 0 ? (
            <p style={{ color: "#54595d", fontSize: 13 }}>
              No orphans — all articles are linked.
            </p>
          ) : (
            <ul style={{ margin: 0, padding: "0 0 0 16px", fontSize: 13 }}>
              {orphans.slice(0, 15).map((a) => (
                <li key={a.slug} style={{ marginBottom: 3 }}>
                  <Link
                    href={`/wiki/${a.slug}`}
                    style={{ color: "#3366cc", textDecoration: "none" }}
                  >
                    {a.title}
                  </Link>
                </li>
              ))}
              {orphans.length > 15 && (
                <li style={{ color: "#54595d" }}>
                  +{orphans.length - 15} more
                </li>
              )}
            </ul>
          )}
        </Section>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h2
        style={{
          fontFamily: "Georgia, serif",
          fontWeight: "normal",
          fontSize: 17,
          borderBottom: "1px solid #eaecf0",
          paddingBottom: 4,
          marginBottom: 10,
          color: "#000",
        }}
      >
        {title}
      </h2>
      {children}
    </div>
  );
}
