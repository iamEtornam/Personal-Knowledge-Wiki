import { Badge } from "@/components/ui/badge";
import { getSiteName } from "@/lib/config";
import { getAllArticles } from "@/lib/wiki";
import Link from "next/link";

export function generateMetadata() {
  return { title: `All Articles | ${getSiteName()}` };
}

interface AllArticlesPageProps {
  searchParams: Promise<{ letter?: string }>;
}

export default async function AllArticlesPage({ searchParams }: AllArticlesPageProps) {
  const { letter: activeLetter } = await searchParams;
  const articles = getAllArticles();

  // Build full letter → articles map
  const byLetter: Record<string, typeof articles> = {};
  for (const a of articles) {
    const l = a.title[0]?.toUpperCase() || "#";
    if (!byLetter[l]) byLetter[l] = [];
    byLetter[l].push(a);
  }
  const allLetters = Object.keys(byLetter).sort();

  // What to actually display
  const displayLetters = activeLetter
    ? allLetters.filter(l => l === activeLetter.toUpperCase())
    : allLetters;

  const filteredCount = activeLetter
    ? (byLetter[activeLetter.toUpperCase()] ?? []).length
    : articles.length;

  return (
    <div className="max-w-4xl mx-auto px-6 py-5">
      {/* Header */}
      <div className="flex items-baseline gap-3 border-b border-gray-200 pb-3 mb-5">
        <h1 className="text-2xl font-serif font-normal text-gray-900">
          All Articles
        </h1>
        <span className="text-base text-gray-400">
          ({filteredCount}{activeLetter ? ` of ${articles.length}` : ""})
        </span>
        {activeLetter && (
          <Link
            href="/all"
            className="ml-auto text-xs text-blue-600 hover:underline"
          >
            Clear filter
          </Link>
        )}
      </div>

      {/* Letter filter bar */}
      <div className="flex flex-wrap gap-1.5 mb-7">
        {allLetters.map(l => {
          const isActive = activeLetter?.toUpperCase() === l;
          return (
            <Link
              key={l}
              href={isActive ? "/all" : `/all?letter=${l}`}
              className={
                isActive
                  ? "inline-flex items-center justify-center w-7 h-7 rounded border text-xs font-bold no-underline transition-colors bg-blue-600 border-blue-600 text-white shadow-sm"
                  : "inline-flex items-center justify-center w-7 h-7 rounded border text-xs font-bold no-underline transition-colors border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
              }
            >
              {l}
            </Link>
          );
        })}
      </div>

      {/* Articles grouped by letter */}
      <div className="space-y-8">
        {displayLetters.map(l => (
          <div key={l}>
            <h2 className="text-lg font-serif font-normal text-gray-700 border-b border-gray-100 pb-1 mb-3">
              {l}
              <span className="ml-2 text-sm text-gray-400 font-sans">
                {byLetter[l].length}
              </span>
            </h2>
            <ul className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-1.5">
              {byLetter[l].map(a => (
                <li key={a.slug} className="flex items-center gap-1.5 min-w-0">
                  <Link
                    href={`/wiki/${a.slug}`}
                    className="text-[13px] text-blue-700 hover:underline truncate"
                    title={a.title}
                  >
                    {a.title}
                  </Link>
                  {a.directory && (
                    <Badge
                      variant="outline"
                      className="text-[9px] capitalize border-gray-200 text-gray-400 py-0 px-1 shrink-0"
                    >
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
