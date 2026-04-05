"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";

interface SearchResult {
  slug: string; title: string; directory: string; wordCount: number; excerpt: string;
}

function SearchContent() {
  const searchParams = useSearchParams();
  const router       = useRouter();
  const initialQ     = searchParams.get("q") || "";
  const [query, setQuery]   = useState(initialQ);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => { if (initialQ) doSearch(initialQ); }, [initialQ]);

  async function doSearch(q: string) {
    if (!q.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const res  = await fetch(`/api/wiki/search?q=${encodeURIComponent(q.trim())}`);
      const data = await res.json();
      setResults(data.results || []);
    } catch { setResults([]); }
    finally { setLoading(false); }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    doSearch(query);
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-6">
      <h1 className="text-2xl font-serif font-normal text-gray-900 border-b border-gray-200 pb-3 mb-5">Search</h1>

      <form onSubmit={handleSubmit} className="flex gap-2 mb-7">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <Input
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search your wiki…"
            autoFocus
            className="pl-9 text-base border-gray-200 focus:border-blue-400"
          />
        </div>
        <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6">Search</Button>
      </form>

      {loading && (
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <div className="w-4 h-4 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin" />
          Searching…
        </div>
      )}

      {!loading && searched && (
        <div>
          <p className="text-sm text-gray-400 mb-4">
            {results.length === 0
              ? `No results for "${initialQ}"`
              : `${results.length} result${results.length !== 1 ? "s" : ""} for "${initialQ}"`}
          </p>

          <div className="divide-y divide-gray-100">
            {results.map(r => (
              <div key={r.slug} className="py-4">
                <Link
                  href={`/wiki/${r.slug}`}
                  className="text-xl font-serif font-normal text-blue-700 hover:underline block mb-1"
                >
                  {r.title}
                </Link>
                <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                  {r.directory && (
                    <Badge variant="outline" className="text-[10px] capitalize border-gray-200 text-gray-500 py-0">
                      {r.directory}
                    </Badge>
                  )}
                  <span>{r.wordCount.toLocaleString()} words</span>
                </div>
                {r.excerpt && (
                  <p
                    className="text-sm text-gray-600 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: r.excerpt }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {!searched && (
        <div className="text-center py-16 text-gray-300">
          <Search className="w-12 h-12 mx-auto mb-3" />
          <p className="text-sm">Type something to search across all articles</p>
        </div>
      )}

      <style>{`mark { background: #fef08a; border-radius: 2px; padding: 0 2px; }`}</style>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="p-8 text-gray-400 text-sm">Loading…</div>}>
      <SearchContent />
    </Suspense>
  );
}
