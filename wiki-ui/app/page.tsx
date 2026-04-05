import { getAllArticles, getDirectories, getWikiIndex } from "@/lib/wiki";
import Link from "next/link";

export default function HomePage() {
  const articles = getAllArticles();
  const directories = getDirectories();
  const index = getWikiIndex();
  const recent = [...articles]
    .sort((a, b) => (b.last_updated || b.created) > (a.last_updated || a.created) ? 1 : -1)
    .slice(0, 10);
  const isEmpty = articles.length === 0;

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "24px 32px" }}>
      {/* Header */}
      <div
        style={{
          borderBottom: "1px solid #a2a9b1",
          paddingBottom: 16,
          marginBottom: 24,
        }}
      >
        <h1
          style={{
            fontFamily: "Georgia, serif",
            fontSize: 28,
            fontWeight: "normal",
            margin: 0,
            color: "#000",
          }}
        >
          Personal Wiki
        </h1>
        <p style={{ color: "#54595d", fontSize: 13, margin: "4px 0 0" }}>
          {isEmpty
            ? "No articles yet — drop your data in data/ and run /wiki ingest"
            : `${articles.length} articles across ${directories.length} categories`}
        </p>
      </div>

      {isEmpty ? (
        <EmptyState />
      ) : (
        <div style={{ display: "flex", gap: 32 }}>
          {/* Main column */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <Section title="Browse by Category">
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                  gap: 8,
                }}
              >
                {directories.map((d) => (
                  <Link
                    key={d.name}
                    href={`/category/${d.name}`}
                    style={{
                      display: "block",
                      border: "1px solid #eaecf0",
                      borderRadius: 3,
                      padding: "10px 14px",
                      textDecoration: "none",
                      background: "#fff",
                    }}
                  >
                    <div
                      style={{
                        fontWeight: "bold",
                        color: "#3366cc",
                        fontSize: 14,
                        textTransform: "capitalize",
                      }}
                    >
                      {d.name}
                    </div>
                    <div style={{ color: "#54595d", fontSize: 12 }}>
                      {d.count} article{d.count !== 1 ? "s" : ""}
                    </div>
                  </Link>
                ))}
              </div>
            </Section>

            {recent.length > 0 && (
              <Section title="Recently Updated">
                <ul style={{ margin: 0, padding: "0 0 0 20px" }}>
                  {recent.map((a) => (
                    <li key={a.slug} style={{ marginBottom: 6 }}>
                      <Link
                        href={`/wiki/${a.slug}`}
                        style={{ color: "#3366cc", textDecoration: "none" }}
                      >
                        {a.title}
                      </Link>
                      <span
                        style={{
                          color: "#54595d",
                          fontSize: 12,
                          marginLeft: 8,
                        }}
                      >
                        {a.directory && `${a.directory} · `}
                        {a.wordCount.toLocaleString()} words
                      </span>
                    </li>
                  ))}
                </ul>
              </Section>
            )}
          </div>

          {/* Right column — stats */}
          <div style={{ width: 220, flexShrink: 0 }}>
            <div
              style={{
                border: "1px solid #a2a9b1",
                background: "#f8f9fa",
                padding: 12,
                fontSize: 13,
              }}
            >
              <div
                style={{
                  fontWeight: "bold",
                  borderBottom: "1px solid #a2a9b1",
                  paddingBottom: 6,
                  marginBottom: 8,
                  fontSize: 14,
                }}
              >
                Wiki Stats
              </div>
              <StatRow
                label="Total articles"
                value={articles.length.toString()}
              />
              <StatRow
                label="Categories"
                value={directories.length.toString()}
              />
              <StatRow
                label="Total words"
                value={articles
                  .reduce((s, a) => s + a.wordCount, 0)
                  .toLocaleString()}
              />
              {index.lastRebuilt && (
                <StatRow label="Last rebuilt" value={index.lastRebuilt} />
              )}
            </div>
          </div>
        </div>
      )}
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
    <div style={{ marginBottom: 28 }}>
      <h2
        style={{
          fontFamily: "Georgia, serif",
          fontWeight: "normal",
          fontSize: 18,
          borderBottom: "1px solid #eaecf0",
          paddingBottom: 4,
          marginBottom: 12,
          color: "#000",
        }}
      >
        {title}
      </h2>
      {children}
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        padding: "3px 0",
        borderBottom: "1px solid #eaecf0",
        fontSize: 13,
      }}
    >
      <span style={{ color: "#54595d" }}>{label}</span>
      <span style={{ fontWeight: "bold" }}>{value}</span>
    </div>
  );
}

function EmptyState() {
  return (
    <div
      style={{
        maxWidth: 600,
        margin: "60px auto",
        textAlign: "center",
        color: "#54595d",
      }}
    >
      <div style={{ fontSize: 64, marginBottom: 16 }}>📚</div>
      <h2
        style={{
          fontFamily: "Georgia, serif",
          fontWeight: "normal",
          fontSize: 22,
          color: "#202122",
          marginBottom: 12,
        }}
      >
        Your wiki is empty
      </h2>
      <p style={{ fontSize: 14, lineHeight: 1.7, marginBottom: 20 }}>
        Drop your data files (journals, notes, messages) into the{" "}
        <code
          style={{
            background: "#f0f0f0",
            padding: "1px 5px",
            borderRadius: 2,
          }}
        >
          data/
        </code>{" "}
        directory, then use Claude Code with the wiki skill to generate your
        personal knowledge base.
      </p>
      <div
        style={{
          background: "#f8f9fa",
          border: "1px solid #eaecf0",
          padding: 16,
          borderRadius: 4,
          textAlign: "left",
          fontFamily: "monospace",
          fontSize: 13,
          lineHeight: 2,
        }}
      >
        <div>
          <span style={{ color: "#54595d" }}># In Claude Code:</span>
        </div>
        <div>/wiki ingest</div>
        <div>/wiki absorb all</div>
        <div>/wiki query &quot;Tell me about my projects&quot;</div>
      </div>
    </div>
  );
}
