"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import Link from "next/link";

interface SearchResult {
  slug: string;
  title: string;
  directory: string;
  wordCount: number;
  excerpt: string;
}

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQ = searchParams.get("q") || "";
  const [query, setQuery] = useState(initialQ);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (initialQ) {
      doSearch(initialQ);
    }
  }, [initialQ]);

  async function doSearch(q: string) {
    if (!q.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch(
        `/api/wiki/search?q=${encodeURIComponent(q.trim())}`
      );
      const data = await res.json();
      setResults(data.results || []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    doSearch(query);
  }

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "24px 32px" }}>
      <h1
        style={{
          fontFamily: "Georgia, serif",
          fontWeight: "normal",
          fontSize: 26,
          borderBottom: "1px solid #a2a9b1",
          paddingBottom: 6,
          marginBottom: 20,
        }}
      >
        Search
      </h1>

      <form onSubmit={handleSubmit} style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search articles..."
            autoFocus
            style={{
              flex: 1,
              padding: "8px 12px",
              border: "1px solid #a2a9b1",
              borderRadius: 2,
              fontSize: 15,
              outline: "none",
            }}
          />
          <button
            type="submit"
            style={{
              padding: "8px 20px",
              background: "#36c",
              color: "#fff",
              border: "none",
              borderRadius: 2,
              cursor: "pointer",
              fontSize: 14,
            }}
          >
            Search
          </button>
        </div>
      </form>

      {loading && (
        <div style={{ color: "#54595d", fontSize: 14 }}>Searching...</div>
      )}

      {!loading && searched && (
        <div>
          <div style={{ color: "#54595d", fontSize: 13, marginBottom: 16 }}>
            {results.length === 0
              ? `No results for "${initialQ}"`
              : `${results.length} result${results.length !== 1 ? "s" : ""} for "${initialQ}"`}
          </div>

          {results.map((r) => (
            <div
              key={r.slug}
              style={{
                borderBottom: "1px solid #eaecf0",
                padding: "14px 0",
              }}
            >
              <Link
                href={`/wiki/${r.slug}`}
                style={{
                  display: "block",
                  color: "#3366cc",
                  textDecoration: "none",
                  fontSize: 18,
                  fontFamily: "Georgia, serif",
                  marginBottom: 4,
                }}
              >
                {r.title}
              </Link>
              <div
                style={{ color: "#54595d", fontSize: 12, marginBottom: 6 }}
              >
                {r.directory && (
                  <>
                    <Link
                      href={`/category/${r.directory}`}
                      style={{ color: "#3366cc", textDecoration: "none" }}
                    >
                      {r.directory}
                    </Link>
                    {" · "}
                  </>
                )}
                {r.wordCount.toLocaleString()} words
              </div>
              {r.excerpt && (
                <p
                  style={{
                    margin: 0,
                    fontSize: 13,
                    color: "#202122",
                    lineHeight: 1.5,
                  }}
                  dangerouslySetInnerHTML={{ __html: r.excerpt }}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div style={{ padding: 32 }}>Loading...</div>}>
      <SearchContent />
    </Suspense>
  );
}
