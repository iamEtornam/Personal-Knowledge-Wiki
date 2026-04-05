import fs from "fs";
import path from "path";
import matter from "gray-matter";

const WIKI_DIR = path.join(process.cwd(), "..", "wiki");

export interface WikiArticle {
  slug: string;
  filePath: string;
  title: string;
  type: string;
  created: string;
  last_updated: string;
  related: string[];
  sources: string[];
  content: string;
  directory: string;
  wordCount: number;
}

export interface WikiIndex {
  articles: { title: string; summary: string; path: string }[];
  totalArticles: number;
  lastRebuilt: string | null;
}

export interface BacklinksMap {
  [article: string]: string[];
}

function wikiExists(): boolean {
  return fs.existsSync(WIKI_DIR);
}

export function getAllArticles(): WikiArticle[] {
  if (!wikiExists()) return [];

  const articles: WikiArticle[] = [];
  walkDir(WIKI_DIR, articles);
  return articles.sort((a, b) => a.title.localeCompare(b.title));
}

function walkDir(dir: string, articles: WikiArticle[]) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      walkDir(fullPath, articles);
    } else if (
      entry.isFile() &&
      entry.name.endsWith(".md") &&
      !entry.name.startsWith("_")
    ) {
      const article = parseArticle(fullPath);
      if (article) articles.push(article);
    }
  }
}

function parseArticle(filePath: string): WikiArticle | null {
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    const { data, content } = matter(raw);
    const relativePath = path.relative(WIKI_DIR, filePath);
    const parts = relativePath.split(path.sep);
    const directory = parts.length > 1 ? parts[0] : "";
    const slug = relativePath.replace(/\.md$/, "").replace(/\\/g, "/");
    const title =
      data.title ||
      path
        .basename(filePath, ".md")
        .replace(/-/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());
    const wordCount = content.trim().split(/\s+/).length;

    return {
      slug,
      filePath,
      title,
      type: data.type || "article",
      created: data.created || "",
      last_updated: data.last_updated || "",
      related: data.related || [],
      sources: data.sources || [],
      content,
      directory,
      wordCount,
    };
  } catch {
    return null;
  }
}

export function getArticleBySlug(slug: string): WikiArticle | null {
  const fullPath = path.join(WIKI_DIR, `${slug}.md`);
  if (fs.existsSync(fullPath)) return parseArticle(fullPath);

  // Try with index
  const indexPath = path.join(WIKI_DIR, slug, "index.md");
  if (fs.existsSync(indexPath)) return parseArticle(indexPath);

  return null;
}

export function getBacklinks(): BacklinksMap {
  const jsonPath = path.join(WIKI_DIR, "_backlinks.json");
  if (!fs.existsSync(jsonPath)) return {};
  try {
    const raw = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
    const { _meta, ...links } = raw;
    return links as BacklinksMap;
  } catch {
    return {};
  }
}

export function getWikiIndex(): WikiIndex {
  const indexPath = path.join(WIKI_DIR, "_index.md");
  if (!fs.existsSync(indexPath)) {
    return { articles: [], totalArticles: 0, lastRebuilt: null };
  }
  const raw = fs.readFileSync(indexPath, "utf-8");
  const { data, content } = matter(raw);

  const totalMatch = content.match(/Total articles: (\d+)/);
  const total = totalMatch ? parseInt(totalMatch[1], 10) : 0;
  const rebuildMatch = content.match(/Last rebuilt: (.+)/);
  const lastRebuilt =
    rebuildMatch && rebuildMatch[1] !== "—" ? rebuildMatch[1].trim() : null;

  return { articles: [], totalArticles: total, lastRebuilt };
}

export function getDirectories(): { name: string; count: number }[] {
  if (!wikiExists()) return [];
  const dirs: Map<string, number> = new Map();

  const entries = fs.readdirSync(WIKI_DIR, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      const articles: WikiArticle[] = [];
      walkDir(path.join(WIKI_DIR, entry.name), articles);
      if (articles.length > 0) dirs.set(entry.name, articles.length);
    }
  }

  return Array.from(dirs.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

export function searchArticles(query: string): WikiArticle[] {
  const all = getAllArticles();
  const q = query.toLowerCase();
  return all.filter(
    (a) =>
      a.title.toLowerCase().includes(q) ||
      a.content.toLowerCase().includes(q) ||
      a.directory.toLowerCase().includes(q)
  );
}
