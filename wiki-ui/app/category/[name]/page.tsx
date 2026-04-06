import { getAllArticles } from "@/lib/wiki";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { ChevronRight } from "lucide-react";

interface CategoryPageProps {
  params: Promise<{ name: string }>;
}

const HEADER_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  people:       { bg: "bg-blue-50",   border: "border-blue-200",  text: "text-blue-800" },
  projects:     { bg: "bg-orange-50", border: "border-orange-200",text: "text-orange-800" },
  philosophies: { bg: "bg-purple-50", border: "border-purple-200",text: "text-purple-800" },
  patterns:     { bg: "bg-green-50",  border: "border-green-200", text: "text-green-800" },
  places:       { bg: "bg-rose-50",   border: "border-rose-200",  text: "text-rose-800" },
  films:        { bg: "bg-pink-50",   border: "border-pink-200",  text: "text-pink-800" },
  books:        { bg: "bg-amber-50",  border: "border-amber-200", text: "text-amber-800" },
  music:        { bg: "bg-teal-50",   border: "border-teal-200",  text: "text-teal-800" },
  eras:         { bg: "bg-slate-50",  border: "border-slate-200", text: "text-slate-800" },
  decisions:    { bg: "bg-yellow-50", border: "border-yellow-200",text: "text-yellow-800" },
  ideas:        { bg: "bg-cyan-50",   border: "border-cyan-200",  text: "text-cyan-800" },
  tools:        { bg: "bg-indigo-50", border: "border-indigo-200",text: "text-indigo-800" },
};

export async function generateStaticParams() {
  const articles = getAllArticles();
  const dirs = [...new Set(articles.map(a => a.directory).filter(Boolean))];
  return dirs.map(name => ({ name }));
}

export async function generateMetadata({ params }: CategoryPageProps) {
  const { name } = await params;
  return { title: `${name.charAt(0).toUpperCase() + name.slice(1)} | Personal Wiki` };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { name }   = await params;
  const allArticles = getAllArticles();
  const articles   = allArticles.filter(a => a.directory === name);
  if (articles.length === 0) notFound();

  const style = HEADER_COLORS[name] ?? { bg: "bg-gray-50", border: "border-gray-200", text: "text-gray-800" };
  const sorted = [...articles].sort((a, b) => a.title.localeCompare(b.title));

  return (
    <div className="max-w-4xl mx-auto px-6 py-5">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-xs text-gray-400 mb-3">
        <Link href="/" className="hover:text-blue-600">Wiki</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-gray-600 capitalize">{name}</span>
      </nav>

      {/* Header */}
      <div className={`rounded-xl border ${style.border} ${style.bg} px-6 py-4 mb-6`}>
        <h1 className={`text-2xl font-serif font-normal capitalize ${style.text}`}>{name}</h1>
        <p className="text-sm text-gray-500 mt-1">{articles.length} article{articles.length !== 1 ? "s" : ""}</p>
      </div>

      {/* Articles grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {sorted.map(a => (
          <Link
            key={a.slug}
            href={`/wiki/${a.slug}`}
            className={`block rounded-lg border ${style.border} bg-white hover:shadow-md transition-all hover:border-opacity-80 p-3 no-underline group`}
          >
            <p className={`text-[13px] font-semibold group-hover:text-blue-700 text-gray-800 leading-snug mb-1`}>
              {a.title}
            </p>
            <p className="text-[11px] text-gray-400">
              {a.wordCount.toLocaleString()}w{a.last_updated ? ` · ${a.last_updated}` : ""}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
