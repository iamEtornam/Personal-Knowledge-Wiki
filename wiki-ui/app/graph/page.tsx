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
    <div className="flex flex-col h-screen bg-[#0d1117]">
      {/* Header */}
      <header className="flex items-center gap-4 px-6 py-3 border-b border-gray-800 bg-gray-900/80 backdrop-blur-sm shrink-0">
        <h1 className="text-lg font-serif font-normal text-gray-100">
          Graph View
        </h1>
        <div className="flex items-center gap-1.5">
          <span className="text-[12px] text-gray-500 tabular-nums">
            {nodes.length} article{nodes.length !== 1 ? "s" : ""}
          </span>
          {links.length > 0 && (
            <>
              <span className="text-gray-700">·</span>
              <span className="text-[12px] text-gray-500 tabular-nums">
                {links.length} connection{links.length !== 1 ? "s" : ""}
              </span>
            </>
          )}
        </div>
      </header>

      {nodes.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center px-6">
          <div className="text-5xl opacity-30">🕸️</div>
          <p className="text-gray-500 text-sm">No articles yet.</p>
          <p className="text-gray-600 text-xs">Ask your agent to absorb entries first.</p>
        </div>
      ) : (
        <GraphView nodes={nodes} links={links} />
      )}
    </div>
  );
}
