import { Badge } from "@/components/ui/badge";
import { getSiteName } from "@/lib/config";
import { getAllArticles, getBacklinks, getDirectories } from "@/lib/wiki";
import { AlertCircle, FileText, Link2, Tag } from "lucide-react";
import Link from "next/link";

export function generateMetadata() {
  return { title: `Stats | ${getSiteName()}` };
}

export default function StatsPage() {
  const articles = getAllArticles();
  const dirs = getDirectories();
  const backlinks = getBacklinks();
  const totalWords = articles.reduce((s, a) => s + a.wordCount, 0);
  const avgWords = articles.length > 0 ? Math.round(totalWords / articles.length) : 0;

  const mostLinked = articles
    .map(a => ({ article: a, count: (backlinks[a.title] || []).length }))
    .sort((a, b) => b.count - a.count)
    .filter(x => x.count > 0)
    .slice(0, 10);

  const orphans = articles.filter(a => !(backlinks[a.title]?.length > 0));
  const longest = [...articles].sort((a, b) => b.wordCount - a.wordCount).slice(0, 10);

  return (
    <div className="max-w-4xl mx-auto px-6 py-5">
      <h1 className="text-2xl font-serif font-normal text-gray-900 border-b border-gray-200 pb-3 mb-6">
        Wiki Stats
      </h1>

      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-7">
        {[
          { label: "Articles", value: articles.length.toLocaleString(), color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100" },
          { label: "Categories", value: dirs.length.toString(), color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-100" },
          { label: "Total Words", value: totalWords.toLocaleString(), color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-100" },
          { label: "Avg Words", value: avgWords.toLocaleString(), color: "text-green-600", bg: "bg-green-50", border: "border-green-100" },
        ].map(s => (
          <div key={s.label} className={`rounded-xl border ${s.border} ${s.bg} p-4 text-center`}>
            <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-5">

        {/* Most linked */}
        <StatCard
          title="Most Linked"
          icon={<Link2 className="w-4 h-4 text-blue-500" />}
          color={{ header: "bg-blue-50", border: "border-blue-200" }}
          empty={mostLinked.length === 0}
          emptyMsg="No backlinks yet — run absorb to build them."
        >
          <table className="w-full text-[12.5px]">
            <tbody className="divide-y divide-gray-100">
              {mostLinked.map(({ article, count }) => (
                <tr key={article.slug}>
                  <td className="py-1.5 pr-2">
                    <Link href={`/wiki/${article.slug}`} className="text-blue-600 hover:underline">
                      {article.title}
                    </Link>
                  </td>
                  <td className="py-1.5 text-right text-gray-400 whitespace-nowrap">
                    {count} link{count !== 1 ? "s" : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </StatCard>

        {/* Longest */}
        <StatCard
          title="Longest Articles"
          icon={<FileText className="w-4 h-4 text-orange-500" />}
          color={{ header: "bg-orange-50", border: "border-orange-200" }}
          empty={longest.length === 0}
          emptyMsg="No articles yet."
        >
          <table className="w-full text-[12.5px]">
            <tbody className="divide-y divide-gray-100">
              {longest.map(a => (
                <tr key={a.slug}>
                  <td className="py-1.5 pr-2">
                    <Link href={`/wiki/${a.slug}`} className="text-blue-600 hover:underline">
                      {a.title}
                    </Link>
                  </td>
                  <td className="py-1.5 text-right text-gray-400 whitespace-nowrap">
                    {a.wordCount.toLocaleString()}w
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </StatCard>

        {/* By category */}
        <StatCard
          title="By Category"
          icon={<Tag className="w-4 h-4 text-purple-500" />}
          color={{ header: "bg-purple-50", border: "border-purple-200" }}
          empty={dirs.length === 0}
          emptyMsg="No categories yet."
        >
          <table className="w-full text-[12.5px]">
            <tbody className="divide-y divide-gray-100">
              {dirs.map(d => (
                <tr key={d.name}>
                  <td className="py-1.5 pr-2">
                    <Link href={`/category/${d.name}`} className="text-blue-600 hover:underline capitalize">
                      {d.name}
                    </Link>
                  </td>
                  <td className="py-1.5 text-right">
                    <Badge variant="outline" className="text-[10px] border-gray-200 text-gray-500 py-0">
                      {d.count}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </StatCard>

        {/* Orphans */}
        <StatCard
          title={`Orphan Articles (${orphans.length})`}
          icon={<AlertCircle className="w-4 h-4 text-rose-500" />}
          color={{ header: "bg-rose-50", border: "border-rose-200" }}
          empty={orphans.length === 0}
          emptyMsg="No orphans — every article is linked."
        >
          <ul className="space-y-1.5 text-[12.5px]">
            {orphans.slice(0, 15).map(a => (
              <li key={a.slug}>
                <Link href={`/wiki/${a.slug}`} className="text-blue-600 hover:underline">
                  {a.title}
                </Link>
              </li>
            ))}
            {orphans.length > 15 && (
              <li className="text-gray-400 text-xs">+{orphans.length - 15} more</li>
            )}
          </ul>
        </StatCard>
      </div>
    </div>
  );
}

function StatCard({
  title, icon, color, empty, emptyMsg, children,
}: {
  title: string;
  icon: React.ReactNode;
  color: { header: string; border: string };
  empty: boolean;
  emptyMsg: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`rounded-lg border ${color.border} overflow-hidden`}>
      <div className={`${color.header} px-4 py-2.5 border-b ${color.border} flex items-center gap-2`}>
        {icon}
        <h2 className="text-[12.5px] font-bold text-gray-800">{title}</h2>
      </div>
      <div className="bg-white px-4 py-3">
        {empty
          ? <p className="text-xs text-gray-400 italic">{emptyMsg}</p>
          : children
        }
      </div>
    </div>
  );
}
