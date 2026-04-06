"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { getCategoryTheme } from "@/lib/category-theme";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Search, AlignLeft, BarChart2, GitBranch, Home, PlusCircle } from "lucide-react";

interface Directory { name: string; count: number }
interface WikiSidebarProps { directories: Directory[]; totalArticles: number }

function getDirColor(name: string) {
  return getCategoryTheme(name).sidebarBadge;
}

export default function WikiSidebar({ directories, totalArticles }: WikiSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [query, setQuery] = useState("");

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) router.push(`/search?q=${encodeURIComponent(query.trim())}`);
  }

  return (
    <aside className="w-[220px] min-w-[220px] flex-shrink-0 border-r border-gray-200 bg-[#f8fafc] flex flex-col h-screen sticky top-0">

      {/* Logo */}
      <div className="px-4 py-5 border-b border-gray-200">
        <Link href="/" className="flex flex-col items-center gap-2 no-underline group">
          <div className="w-12 h-12 rounded-full flex items-center justify-center text-white text-2xl font-bold font-serif shadow-md"
            style={{ background: "linear-gradient(135deg, #1d4ed8 0%, #7c3aed 100%)" }}>
            W
          </div>
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-800 leading-none">Personal Wiki</p>
            <p className="text-[11px] text-gray-400 mt-0.5">{totalArticles} articles</p>
          </div>
        </Link>
      </div>

      {/* Search */}
      <div className="px-3 py-3 border-b border-gray-200">
        <form onSubmit={handleSearch} className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          <Input
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search wiki…"
            className="pl-8 h-8 text-xs bg-white border-gray-200 focus:border-blue-400 focus:ring-blue-100"
          />
        </form>
      </div>

      <ScrollArea className="flex-1">
        <div className="py-2">

          {/* Navigation */}
          <SidebarSection title="Navigation">
            <NavLink href="/"            label="Main Page"    icon={<Home className="w-3.5 h-3.5" />}       active={pathname === "/"} />
            <NavLink href="/all"         label="All Articles" icon={<AlignLeft className="w-3.5 h-3.5" />}  active={pathname === "/all"} />
            <NavLink href="/graph"       label="Graph View"   icon={<GitBranch className="w-3.5 h-3.5" />}  active={pathname === "/graph"} />
            <NavLink href="/stats"       label="Stats"        icon={<BarChart2 className="w-3.5 h-3.5" />}  active={pathname === "/stats"} />
            <NavLink href="/onboarding"  label="Add Data"     icon={<PlusCircle className="w-3.5 h-3.5" />} active={pathname === "/onboarding"} highlight />
          </SidebarSection>

          {directories.length > 0 && (
            <>
              <Separator className="my-1 mx-3" />
              <SidebarSection title="Categories">
                {directories.map(d => (
                  <Link
                    key={d.name}
                    href={`/category/${d.name}`}
                    className={`flex items-center justify-between px-3 py-1.5 rounded-md mx-2 mb-0.5 no-underline transition-colors ${
                      pathname === `/category/${d.name}`
                        ? "bg-blue-50 text-blue-700"
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    }`}
                  >
                    <span className="text-[12.5px] capitalize font-medium truncate">{d.name}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-semibold ml-1 shrink-0 ${getDirColor(d.name)}`}>
                      {d.count}
                    </span>
                  </Link>
                ))}
              </SidebarSection>
            </>
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="border-t border-gray-200 px-4 py-3">
        <p className="text-[10px] text-gray-400 text-center leading-relaxed">
          Maintained by your AI agent
        </p>
      </div>
    </aside>
  );
}

function SidebarSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-1">
      <p className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400">{title}</p>
      {children}
    </div>
  );
}

function NavLink({
  href,
  label,
  icon,
  active,
  highlight,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  active: boolean;
  highlight?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-md mx-2 mb-0.5 no-underline text-[12.5px] font-medium transition-colors ${
        active
          ? "bg-blue-600 text-white shadow-sm"
          : highlight
          ? "text-blue-600 hover:bg-blue-50 hover:text-blue-700 border border-blue-200 bg-blue-50/50"
          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
      }`}
    >
      {icon}
      {label}
    </Link>
  );
}
