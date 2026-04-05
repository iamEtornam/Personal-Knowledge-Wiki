import { getAllArticles, getArticleBySlug, getBacklinks, type WikiArticle } from "@/lib/wiki";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import ArticleContent from "@/components/ArticleContent";
import TableOfContents from "@/components/TableOfContents";
import { ChevronRight, Link2, FileText, Calendar, Clock } from "lucide-react";

interface ArticlePageProps {
  params: Promise<{ slug: string[] }>;
}

const TYPE_COLORS: Record<string, string> = {
  person:       "bg-blue-100 text-blue-700 border-blue-200",
  project:      "bg-orange-100 text-orange-700 border-orange-200",
  philosophy:   "bg-purple-100 text-purple-700 border-purple-200",
  pattern:      "bg-green-100 text-green-700 border-green-200",
  place:        "bg-rose-100 text-rose-700 border-rose-200",
  film:         "bg-pink-100 text-pink-700 border-pink-200",
  book:         "bg-amber-100 text-amber-700 border-amber-200",
  era:          "bg-slate-100 text-slate-700 border-slate-200",
  decision:     "bg-yellow-100 text-yellow-700 border-yellow-200",
  idea:         "bg-cyan-100 text-cyan-700 border-cyan-200",
  tool:         "bg-indigo-100 text-indigo-700 border-indigo-200",
  transition:   "bg-teal-100 text-teal-700 border-teal-200",
};

export async function generateStaticParams() {
  return getAllArticles().map(a => ({ slug: a.slug.split("/") }));
}

export async function generateMetadata({ params }: ArticlePageProps) {
  const { slug } = await params;
  const article  = getArticleBySlug(slug.join("/"));
  if (!article) return { title: "Not Found" };
  return { title: `${article.title} — Personal Wiki` };
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug }    = await params;
  const article     = getArticleBySlug(slug.join("/"));
  if (!article) notFound();

  const allArticles = getAllArticles();
  const allSlugs    = allArticles.map(a => a.slug);
  const backlinks   = getBacklinks();
  const inbound: string[] = backlinks[article.title] || [];

  const related = article.related
    .map(r => {
      const t = r.replace(/^\[\[|\]\]$/g, "");
      return allArticles.find(a => a.title === t);
    })
    .filter((a): a is NonNullable<typeof a> => a != null);

  const typeColor = TYPE_COLORS[article.type] ?? "bg-gray-100 text-gray-600 border-gray-200";

  return (
    <div className="max-w-5xl mx-auto px-6 py-5">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-xs text-gray-400 mb-3">
        <Link href="/" className="hover:text-blue-600">Wiki</Link>
        {article.directory && (
          <>
            <ChevronRight className="w-3 h-3" />
            <Link href={`/category/${article.directory}`} className="hover:text-blue-600 capitalize">
              {article.directory}
            </Link>
          </>
        )}
        <ChevronRight className="w-3 h-3" />
        <span className="text-gray-600">{article.title}</span>
      </nav>

      {/* Title row */}
      <div className="border-b border-gray-200 pb-3 mb-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <h1 className="text-3xl font-serif font-normal text-gray-900 leading-tight">
            {article.title}
          </h1>
          <div className="flex items-center gap-2 pt-1 flex-wrap">
            {article.type && (
              <Badge variant="outline" className={`capitalize text-xs ${typeColor}`}>
                {article.type}
              </Badge>
            )}
            {article.wordCount > 0 && (
              <Badge variant="outline" className="text-xs bg-gray-50 text-gray-500 border-gray-200">
                <FileText className="w-3 h-3 mr-1" />
                {article.wordCount.toLocaleString()} words
              </Badge>
            )}
          </div>
        </div>

        {/* Metadata chips */}
        <div className="flex items-center gap-4 mt-2 text-[11.5px] text-gray-400 flex-wrap">
          {article.created && (
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" /> Created {article.created}
            </span>
          )}
          {article.last_updated && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" /> Updated {article.last_updated}
            </span>
          )}
          {inbound.length > 0 && (
            <span className="flex items-center gap-1">
              <Link2 className="w-3 h-3" /> {inbound.length} article{inbound.length !== 1 ? "s" : ""} link here
            </span>
          )}
        </div>
      </div>

      {/* Body: article + right sidebar */}
      <div className="flex gap-6 items-start">

        {/* Main column */}
        <div className="flex-1 min-w-0">
          {/* Infobox (mobile — appears here; desktop moved to right) */}
          {(related.length > 0 || article.sources.length > 0) && (
            <div className="float-right ml-5 mb-4 w-56 hidden lg:block">
              <Infobox article={article} related={related} />
            </div>
          )}

          <TableOfContents content={article.content} />
          <ArticleContent content={article.content} allSlugs={allSlugs} />

          {/* Backlinks */}
          {inbound.length > 0 && (
            <div className="mt-8 pt-4 border-t border-gray-200">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Link2 className="w-4 h-4" /> What links here ({inbound.length})
              </h3>
              <ul className="columns-2 gap-4 text-sm">
                {inbound.map(bl => {
                  const linked = allArticles.find(a => a.title === bl);
                  return (
                    <li key={bl} className="mb-1.5 break-inside-avoid">
                      {linked
                        ? <Link href={`/wiki/${linked.slug}`} className="text-blue-600 hover:underline">{bl}</Link>
                        : <span className="text-gray-400">{bl}</span>
                      }
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>

        {/* Mobile infobox below content */}
        {(related.length > 0 || article.sources.length > 0) && (
          <div className="lg:hidden mt-4 w-full">
            <Infobox article={article} related={related} />
          </div>
        )}
      </div>
    </div>
  );
}

function Infobox({
  article,
  related,
}: {
  article: WikiArticle;
  related: WikiArticle[];
}) {
  return (
    <aside className="rounded-lg border border-gray-200 overflow-hidden text-[12.5px] bg-white shadow-sm">
      <div className="bg-gray-50 px-3 py-2 border-b border-gray-200 font-bold text-gray-700 text-xs uppercase tracking-wide">
        {article.title}
      </div>

      {article.type && (
        <InfoRow label="Type" value={
          <span className="capitalize">{article.type}</span>
        } />
      )}
      {article.created && <InfoRow label="Created" value={article.created} />}
      {article.last_updated && <InfoRow label="Updated" value={article.last_updated} />}
      {article.sources.length > 0 && (
        <InfoRow label="Sources" value={`${article.sources.length} entries`} />
      )}

      {related.length > 0 && (
        <div className="border-t border-gray-100 px-3 py-2">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Related</p>
          <ul className="space-y-1">
            {related.map(r => r && (
              <li key={r.slug}>
                <Link href={`/wiki/${r.slug}`} className="text-blue-600 hover:underline">
                  {r.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </aside>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex border-b border-gray-100 last:border-0">
      <dt className="w-20 shrink-0 px-3 py-1.5 font-semibold text-gray-500 bg-gray-50 border-r border-gray-100">
        {label}
      </dt>
      <dd className="px-3 py-1.5 text-gray-700">{value}</dd>
    </div>
  );
}
