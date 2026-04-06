import { getCategoryTheme } from "@/lib/category-theme";
import { getSiteName } from "@/lib/config";
import { getAllArticles } from "@/lib/wiki";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

interface CategoryPageProps {
  params: Promise<{ name: string }>;
}

export async function generateStaticParams() {
  const articles = getAllArticles();
  const dirs = [...new Set(articles.map(a => a.directory).filter(Boolean))];
  return dirs.map(name => ({ name }));
}

export async function generateMetadata({ params }: CategoryPageProps) {
  const { name } = await params;
  return { title: `${name.charAt(0).toUpperCase() + name.slice(1)} | ${getSiteName()}` };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { name } = await params;
  const allArticles = getAllArticles();
  const articles = allArticles.filter(a => a.directory === name);
  if (articles.length === 0) notFound();

  const t = getCategoryTheme(name);
  const style = { bg: t.categoryBg, border: t.categoryBorder, text: t.categoryText };
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
            <p
              className="text-[13px] font-semibold group-hover:text-blue-700 text-gray-800 leading-snug mb-1 line-clamp-3 break-words"
              title={a.title}
            >
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
