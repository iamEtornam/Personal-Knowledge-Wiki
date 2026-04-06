import type { Metadata } from "next";
import "./globals.css";
import { getDirectories, getAllArticles } from "@/lib/wiki";
import WikiSidebar from "@/components/WikiSidebar";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: "Personal Wiki",
  description: "A personal knowledge base compiled by LLM",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const directories = getDirectories();
  const allArticles = getAllArticles();

  return (
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <body>
        <div style={{ display: "flex", minHeight: "100vh" }}>
          <WikiSidebar
            directories={directories}
            totalArticles={allArticles.length}
          />
          <main style={{ flex: 1, minWidth: 0 }}>{children}</main>
        </div>
      </body>
    </html>
  );
}
