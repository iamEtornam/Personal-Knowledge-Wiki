import { getSiteName } from "@/lib/config";
import { getAllArticles, getBacklinks } from "@/lib/wiki";
import GraphView from "./GraphView";

export function generateMetadata() {
  return { title: `Graph View | ${getSiteName()}` };
}

export default function GraphPage() {
  const articles = getAllArticles();
  const backlinks = getBacklinks();

  const nodes = articles.map((a) => ({
    id: a.slug,
    title: a.title,
    directory: a.directory,
    wordCount: a.wordCount,
    linkCount: (backlinks[a.title] || []).length,
  }));

  const links: { source: string; target: string }[] = [];
  for (const article of articles) {
    const inbound = backlinks[article.title] || [];
    for (const fromTitle of inbound) {
      const fromArticle = articles.find((a) => a.title === fromTitle);
      if (fromArticle) {
        links.push({ source: fromArticle.slug, target: article.slug });
      }
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <div
        style={{
          padding: "12px 24px",
          borderBottom: "1px solid #a2a9b1",
          background: "#fff",
          display: "flex",
          alignItems: "center",
          gap: 16,
          flexShrink: 0,
        }}
      >
        <h1
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontWeight: "normal",
            fontSize: 20,
            margin: 0,
          }}
        >
          Graph View
        </h1>
        <span style={{ color: "#54595d", fontSize: 13 }}>
          {nodes.length} articles · {links.length} connections
        </span>
        <span style={{ color: "#54595d", fontSize: 12, marginLeft: "auto" }}>
          Drag to pan · Scroll to zoom · Click a node to open
        </span>
      </div>
      {nodes.length === 0 ? (
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#54595d",
            fontSize: 14,
          }}
        >
          No articles yet. Ask your agent to absorb entries first.
        </div>
      ) : (
        <GraphView nodes={nodes} links={links} />
      )}
    </div>
  );
}
