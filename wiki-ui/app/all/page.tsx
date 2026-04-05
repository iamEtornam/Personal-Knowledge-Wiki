import { getAllArticles } from "@/lib/wiki";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "All Articles — Personal Wiki" };

export default function AllArticlesPage() {
  const articles = getAllArticles();

  const byLetter: Record<string, typeof articles> = {};
  for (const a of articles) {
    const l = a.title[0]?.toUpperCase() || "#";
    if (!byLetter[l]) byLetter[l] = [];
    byLetter[l].push(a);
  }
  const letters = Object.keys(byLetter).sort();

  return (
    <div className="max-w-4xl mx-auto px-6 py-5">
      <h1 className="text-2xl font-serif font-normal text-gray-900 border-b border-gray-200 pb-3 mb-5">
        All Articles <span className="text-base text-gray-400 ml-2">({articles.length})</span>
      </h1>

      {/* Letter jump */}
      <div className="flex flex-wrap gap-1.5 mb-7">
        {letters.map(l => (
          <a
            key={l}
            href={`#letter-${l}`}
            className="inline-flex items-center justify-center w-7 h-7 rounded border border-blue-200 bg-blue-50 text-blue-700 text-xs font-bold hover:bg-blue-100 no-underline transition-colors"
          >
            {l}
          </a>
        ))}
      </div>

      <div className="space-y-8">
        {letters.map(l => (
          <div key={l} id={`letter-${l}`}>
            <h2 className="text-lg font-serif font-normal text-gray-700 border-b border-gray-100 pb-1 mb-3">{l}</h2>
            <ul className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-1.5">
              {byLetter[l].map(a => (
                <li key={a.slug} className="flex items-center gap-1.5 min-w-0">
                  <Link
                    href={`/wiki/${a.slug}`}
                    className="text-[13px] text-blue-700 hover:underline truncate"
                  >
                    {a.title}
                  </Link>
                  {a.directory && (
                    <Badge variant="outline" className="text-[9px] capitalize border-gray-200 text-gray-400 py-0 px-1 shrink-0">
                      {a.directory}
                    </Badge>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}

        {articles.length === 0 && (
          <p className="text-gray-400 text-sm">No articles yet.</p>
        )}
      </div>
    </div>
  );
}
