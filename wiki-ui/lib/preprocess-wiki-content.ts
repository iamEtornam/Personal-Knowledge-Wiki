/**
 * Match [[wikilinks]] to routes before markdown render. Shared by article body
 * and TOC extraction so heading ids stay aligned.
 */

export function resolveWikilinkHref(title: string, allSlugs: string[]): string {
  const slug = title
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
  const found = allSlugs.find((s) => {
    const base = s.split("/").pop() || "";
    return (
      base.toLowerCase() === slug ||
      base.toLowerCase().replace(/-/g, " ") === title.toLowerCase()
    );
  });
  return found ? `/wiki/${found}` : "";
}

export function preprocessWikiContent(
  content: string,
  allSlugs: string[],
): string {
  return content.replace(/\[\[([^\]]+)\]\]/g, (match, title: string) => {
    const href = resolveWikilinkHref(title, allSlugs);
    if (href) {
      return `[${title}](${href})`;
    }
    return `[${title}](#missing "Article does not exist yet")`;
  });
}
