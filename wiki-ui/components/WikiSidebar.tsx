"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

interface Directory {
  name: string;
  count: number;
}

interface WikiSidebarProps {
  directories: Directory[];
  totalArticles: number;
}

export default function WikiSidebar({
  directories,
  totalArticles,
}: WikiSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [query, setQuery] = useState("");

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  }

  return (
    <aside
      style={{
        width: 200,
        minWidth: 200,
        borderRight: "1px solid #a2a9b1",
        background: "#f8f9fa",
        padding: "12px 0",
        fontSize: 13,
        height: "100vh",
        position: "sticky",
        top: 0,
        overflowY: "auto",
        flexShrink: 0,
      }}
    >
      {/* Logo */}
      <div style={{ padding: "0 12px 12px", borderBottom: "1px solid #eaecf0" }}>
        <Link href="/" style={{ textDecoration: "none" }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #36c 60%, #6b4ba1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontWeight: "bold",
                fontSize: 22,
                fontFamily: "Georgia, serif",
              }}
            >
              W
            </div>
            <span
              style={{
                color: "#000",
                fontFamily: "Georgia, serif",
                fontSize: 12,
                fontWeight: "bold",
                letterSpacing: 1,
                textTransform: "uppercase",
              }}
            >
              Personal Wiki
            </span>
            <span style={{ color: "#54595d", fontSize: 11 }}>
              {totalArticles} articles
            </span>
          </div>
        </Link>
      </div>

      {/* Search */}
      <div style={{ padding: "10px 12px", borderBottom: "1px solid #eaecf0" }}>
        <form onSubmit={handleSearch}>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search wiki..."
            style={{
              width: "100%",
              padding: "5px 8px",
              border: "1px solid #a2a9b1",
              borderRadius: 2,
              fontSize: 13,
              background: "#fff",
              color: "#202122",
              outline: "none",
            }}
          />
        </form>
      </div>

      {/* Navigation */}
      <div style={{ padding: "8px 0" }}>
        <SidebarSection title="Navigation">
          <SidebarLink href="/" label="Main Page" active={pathname === "/"} />
          <SidebarLink
            href="/all"
            label="All Articles"
            active={pathname === "/all"}
          />
          <SidebarLink
            href="/search"
            label="Search"
            active={pathname.startsWith("/search")}
          />
        </SidebarSection>

        {directories.length > 0 && (
          <SidebarSection title="Categories">
            {directories.map((d) => (
              <SidebarLink
                key={d.name}
                href={`/category/${d.name}`}
                label={`${capitalize(d.name)} (${d.count})`}
                active={pathname === `/category/${d.name}`}
              />
            ))}
          </SidebarSection>
        )}

        <SidebarSection title="Tools">
          <SidebarLink
            href="/graph"
            label="Graph View"
            active={pathname === "/graph"}
          />
          <SidebarLink
            href="/stats"
            label="Stats"
            active={pathname === "/stats"}
          />
        </SidebarSection>
      </div>
    </aside>
  );
}

function SidebarSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 4 }}>
      <div
        style={{
          padding: "6px 12px 2px",
          fontSize: 11,
          fontWeight: "bold",
          color: "#54595d",
          textTransform: "uppercase",
          letterSpacing: "0.5px",
        }}
      >
        {title}
      </div>
      {children}
    </div>
  );
}

function SidebarLink({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      style={{
        display: "block",
        padding: "3px 12px 3px 16px",
        color: active ? "#000" : "#3366cc",
        background: active ? "#eaf3fb" : "transparent",
        textDecoration: "none",
        fontSize: 13,
        borderLeft: active ? "3px solid #36c" : "3px solid transparent",
        fontWeight: active ? "bold" : "normal",
      }}
    >
      {label}
    </Link>
  );
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
