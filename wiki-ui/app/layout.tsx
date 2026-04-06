import WikiSidebar from "@/components/WikiSidebar";
import { getOwnerInitial, getSiteName } from "@/lib/config";
import { cn } from "@/lib/utils";
import { getAllArticles, getDirectories } from "@/lib/wiki";
import type { Metadata } from "next";
import { Open_Sans, Playfair_Display, Raleway } from "next/font/google";
import "./globals.css";

export const dynamic = "force-dynamic";

const openSans = Open_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

const raleway = Raleway({
  subsets: ["latin"],
  variable: "--font-raleway",
  display: "swap",
});

export function generateMetadata(): Metadata {
  const siteName = getSiteName();
  return {
    title: siteName,
    description: `${siteName} — a personal knowledge base compiled by AI`,
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const directories = getDirectories();
  const allArticles = getAllArticles();
  const siteName = getSiteName();
  const initial = getOwnerInitial();

  return (
    <html
      lang="en"
      className={cn(
        "font-sans antialiased",
        openSans.variable,
        playfairDisplay.variable,
        raleway.variable,
      )}
    >
      <body>
        <div style={{ display: "flex", minHeight: "100vh" }}>
          <WikiSidebar
            directories={directories}
            totalArticles={allArticles.length}
            siteName={siteName}
            siteInitial={initial}
          />
          <main style={{ flex: 1, minWidth: 0 }}>{children}</main>
        </div>
      </body>
    </html>
  );
}
