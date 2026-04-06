import { getAllArticles, getDirectories, getWikiIndex } from "@/lib/wiki";
import { getCategoryTheme } from "@/lib/category-theme";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { BookOpen, Users, Lightbulb, Clock, TrendingUp, Star, Sparkles } from "lucide-react";
import type { ReactNode } from "react";

/** Optional icons per directory; colors come from {@link getCategoryTheme}. */
const SECTION_ICONS: Record<string, ReactNode> = {
  people: <Users className="w-4 h-4" />,
  philosophies: <Lightbulb className="w-4 h-4" />,
  books: <BookOpen className="w-4 h-4" />,
  eras: <Clock className="w-4 h-4" />,
};

function getSectionStyle(name: string) {
  const t = getCategoryTheme(name);
  return {
    header: t.homeHeader,
    border: t.homeBorder,
    badge: t.homeBadge,
    icon: SECTION_ICONS[name],
  };
}

export default function HomePage() {
  const articles  = getAllArticles();
  const dirs      = getDirectories();
  const index     = getWikiIndex();
  const totalWords = articles.reduce((s, a) => s + a.wordCount, 0);

  const recent = [...articles]
    .sort((a, b) => ((b.last_updated || b.created) > (a.last_updated || a.created) ? 1 : -1))
    .slice(0, 6);

  const isEmpty = articles.length === 0;

  if (isEmpty) return <EmptyState />;

  return (
    <div className="max-w-5xl mx-auto px-6 py-6">

      {/* ── Banner ─────────────────────────────── */}
      <div className="rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 px-8 py-6 mb-6 text-center shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900 font-serif mb-1">Welcome to your Personal Wiki</h1>
        <p className="text-sm text-gray-500 mb-4">The free encyclopedia of your life, maintained by your AI agent</p>
        <div className="flex justify-center gap-6 text-sm">
          <Stat label="Articles"   value={articles.length.toLocaleString()} />
          <Separator orientation="vertical" className="h-8" />
          <Stat label="Categories" value={dirs.length.toString()} />
          <Separator orientation="vertical" className="h-8" />
          <Stat label="Words"      value={totalWords.toLocaleString()} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-5">

        {/* ── Left 2/3 ───────────────────────────── */}
        <div className="col-span-2 space-y-5">

          {/* Recently updated */}
          {recent.length > 0 && (
            <WikiSection
              title="Recently Updated"
              color={{ header: "bg-teal-50", border: "border-teal-200" }}
              icon={<TrendingUp className="w-4 h-4 text-teal-600" />}
            >
              <ul className="divide-y divide-gray-100">
                {recent.map(a => (
                  <li key={a.slug} className="flex items-center justify-between py-2 gap-3">
                    <Link href={`/wiki/${a.slug}`} className="text-[13px] font-medium text-blue-700 hover:underline truncate">
                      {a.title}
                    </Link>
                    <div className="flex items-center gap-2 shrink-0">
                      {a.directory && (
                        <Badge variant="outline" className={`text-[10px] py-0 capitalize ${getSectionStyle(a.directory).badge}`}>
                          {a.directory}
                        </Badge>
                      )}
                      <span className="text-[11px] text-gray-400">{a.wordCount.toLocaleString()}w</span>
                    </div>
                  </li>
                ))}
              </ul>
            </WikiSection>
          )}

          {/* Category grid */}
          <div>
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Browse by Category</h2>
            <div className="grid grid-cols-2 gap-3">
              {dirs.map(d => {
                const style   = getSectionStyle(d.name);
                const topArticles = articles.filter(a => a.directory === d.name).slice(0, 3);
                return (
                  <Card key={d.name} className={`border ${style.border} hover:shadow-md transition-shadow`}>
                    <CardHeader className={`${style.header} rounded-t-lg py-2.5 px-4 flex-row items-center justify-between`}>
                      <div className="flex items-center gap-1.5">
                        {style.icon && <span className="text-gray-600">{style.icon}</span>}
                        <Link href={`/category/${d.name}`} className="text-[13px] font-bold capitalize text-gray-800 hover:text-blue-700 no-underline">
                          {d.name}
                        </Link>
                      </div>
                      <Badge variant="outline" className={`text-[10px] ${style.badge}`}>{d.count}</Badge>
                    </CardHeader>
                    <CardContent className="px-4 py-2">
                      <ul className="space-y-1">
                        {topArticles.map(a => (
                          <li key={a.slug}>
                            <Link href={`/wiki/${a.slug}`} className="text-[12.5px] text-blue-700 hover:underline">
                              {a.title}
                            </Link>
                          </li>
                        ))}
                        {d.count > 3 && (
                          <li>
                            <Link href={`/category/${d.name}`} className="text-[11px] text-gray-400 hover:text-blue-600 italic">
                              +{d.count - 3} more…
                            </Link>
                          </li>
                        )}
                      </ul>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Right 1/3 ──────────────────────────── */}
        <div className="space-y-4">

          {/* Stats card */}
          <WikiSection
            title="Wiki Stats"
            color={{ header: "bg-amber-50", border: "border-amber-200" }}
            icon={<Star className="w-4 h-4 text-amber-500" />}
          >
            <dl className="space-y-2 text-[13px]">
              <StatRow label="Total articles"  value={articles.length.toLocaleString()} />
              <StatRow label="Categories"       value={dirs.length.toString()} />
              <StatRow label="Total words"      value={totalWords.toLocaleString()} />
              {index.lastRebuilt && <StatRow label="Last rebuilt" value={index.lastRebuilt} />}
            </dl>
          </WikiSection>

          {/* Top articles by word count */}
          <WikiSection
            title="Longest Articles"
            color={{ header: "bg-purple-50", border: "border-purple-200" }}
          >
            <ul className="space-y-1.5">
              {[...articles].sort((a, b) => b.wordCount - a.wordCount).slice(0, 6).map(a => (
                <li key={a.slug} className="flex justify-between items-center text-[12.5px]">
                  <Link href={`/wiki/${a.slug}`} className="text-blue-700 hover:underline truncate mr-2">
                    {a.title}
                  </Link>
                  <span className="text-gray-400 shrink-0">{a.wordCount.toLocaleString()}w</span>
                </li>
              ))}
            </ul>
          </WikiSection>

          {/* Did you know */}
          <WikiSection
            title="Did you know?"
            color={{ header: "bg-green-50", border: "border-green-200" }}
          >
            <p className="text-[12.5px] text-gray-600 leading-relaxed italic">
              Ask your agent anything about your wiki — it navigates from{" "}
              <code className="bg-green-100 px-1 rounded text-green-800 not-italic text-[11px]">_index.md</code>{" "}
              and drills into articles without RAG.
            </p>
          </WikiSection>
        </div>
      </div>
    </div>
  );
}

/* ── Helpers ──────────────────────────────────────────────── */
function WikiSection({
  title, color, icon, children,
}: {
  title: string;
  color: { header: string; border: string };
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className={`rounded-lg border ${color.border} overflow-hidden`}>
      <div className={`${color.header} px-4 py-2 flex items-center gap-1.5 border-b ${color.border}`}>
        {icon}
        <h2 className="text-[12.5px] font-bold text-gray-800">{title}</h2>
      </div>
      <div className="bg-white px-4 py-3">{children}</div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <p className="text-2xl font-bold text-blue-700">{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center border-b border-gray-100 pb-1.5">
      <dt className="text-gray-500">{label}</dt>
      <dd className="font-semibold text-gray-800">{value}</dd>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="max-w-xl mx-auto py-24 px-6 text-center">
      <div className="text-6xl mb-6">📚</div>
      <h2 className="text-2xl font-serif font-normal text-gray-800 mb-3">Your wiki is empty</h2>
      <p className="text-sm text-gray-500 leading-relaxed mb-6">
        Connect your data sources to build a personal Wikipedia of your life — people,
        projects, memories, and everything in between.
      </p>
      <Link
        href="/onboarding"
        className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl text-sm font-semibold transition-colors shadow-md no-underline mb-8"
      >
        <Sparkles className="w-4 h-4" />
        Set up your wiki
      </Link>
      <div className="bg-gray-950 text-gray-100 rounded-xl p-5 text-left font-mono text-sm leading-8">
        <p><span className="text-gray-500"># Or tell your agent:</span></p>
        <p>Ingest my data</p>
        <p>Absorb all entries</p>
        <p>What are my recurring themes?</p>
      </div>
    </div>
  );
}
