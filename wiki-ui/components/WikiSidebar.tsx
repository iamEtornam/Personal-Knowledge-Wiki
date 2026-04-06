"use client";

import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { AlignLeft, BarChart2, GitBranch, Home, LogOut, PlusCircle, Search } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

interface Directory { name: string; count: number }
interface WikiSidebarProps {
  directories: Directory[];
  totalArticles: number;
  siteName?: string;
  siteInitial?: string;
}

const DIR_COLORS: Record<string, string> = {
  people: "bg-blue-100 text-blue-700 border-blue-200",
  projects: "bg-orange-100 text-orange-700 border-orange-200",
  philosophies: "bg-purple-100 text-purple-700 border-purple-200",
  patterns: "bg-green-100 text-green-700 border-green-200",
  places: "bg-rose-100 text-rose-700 border-rose-200",
  films: "bg-pink-100 text-pink-700 border-pink-200",
  books: "bg-amber-100 text-amber-700 border-amber-200",
  music: "bg-teal-100 text-teal-700 border-teal-200",
  eras: "bg-slate-100 text-slate-700 border-slate-200",
  decisions: "bg-yellow-100 text-yellow-700 border-yellow-200",
  ideas: "bg-cyan-100 text-cyan-700 border-cyan-200",
  tools: "bg-indigo-100 text-indigo-700 border-indigo-200",
};

function getDirColor(name: string) {
  return DIR_COLORS[name] ?? "bg-gray-100 text-gray-600 border-gray-200";
}

export default function WikiSidebar({
  directories,
  totalArticles,
  siteName = "Personal Wiki",
  siteInitial = "W",
}: WikiSidebarProps) {
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
            {siteInitial}
          </div>
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-800 leading-none">{siteName}</p>
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
            <NavLink href="/" label="Main Page" icon={<Home className="w-3.5 h-3.5" />} active={pathname === "/"} />
            <NavLink href="/all" label="All Articles" icon={<AlignLeft className="w-3.5 h-3.5" />} active={pathname === "/all"} />
            <NavLink href="/graph" label="Graph View" icon={<GitBranch className="w-3.5 h-3.5" />} active={pathname === "/graph"} />
            <NavLink href="/stats" label="Stats" icon={<BarChart2 className="w-3.5 h-3.5" />} active={pathname === "/stats"} />
            <NavLink href="/onboarding" label="Add Data" icon={<PlusCircle className="w-3.5 h-3.5" />} active={pathname === "/onboarding"} highlight />
          </SidebarSection>

          {directories.length > 0 && (
            <>
              <Separator className="my-1 mx-3" />
              <SidebarSection title="Categories">
                {directories.map(d => (
                  <Link
                    key={d.name}
                    href={`/category/${d.name}`}
                    className={`flex items-center justify-between px-3 py-1.5 rounded-md mx-2 mb-0.5 no-underline transition-colors ${pathname === `/category/${d.name}`
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
      <div className="border-t border-gray-200 px-3 py-3">
        <UserFooter />
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
      className={`flex items-center gap-2 px-3 py-1.5 rounded-md mx-2 mb-0.5 no-underline text-[12.5px] font-medium transition-colors ${active
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

function UserFooter() {
  const { data: session } = useSession();
  const username = session?.user?.name ?? "…";

  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2 min-w-0">
        <div
          className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0"
          style={{ background: "linear-gradient(135deg, #1d4ed8 0%, #7c3aed 100%)" }}
        >
          {username.charAt(0).toUpperCase()}
        </div>
        <span className="text-[12px] font-medium text-gray-700 truncate">{username}</span>
      </div>
      <button
        onClick={() => signOut({ callbackUrl: "/login" })}
        title="Sign out"
        className="flex items-center justify-center w-6 h-6 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors shrink-0"
        style={{ border: "none", background: "transparent", cursor: "pointer" }}
      >
        <LogOut className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
