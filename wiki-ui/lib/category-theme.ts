/**
 * Single source of truth for per-directory accent colors (home, category pages, sidebar).
 */

export type CategoryVisualTheme = {
  homeHeader: string;
  homeBorder: string;
  homeBadge: string;
  categoryBg: string;
  categoryBorder: string;
  categoryText: string;
  sidebarBadge: string;
};

const DEFAULT_THEME: CategoryVisualTheme = {
  homeHeader: "bg-gray-50",
  homeBorder: "border-gray-200",
  homeBadge: "bg-gray-100 text-gray-600 border-gray-200",
  categoryBg: "bg-gray-50",
  categoryBorder: "border-gray-200",
  categoryText: "text-gray-800",
  sidebarBadge: "bg-gray-100 text-gray-600 border-gray-200",
};

const THEMES: Record<string, CategoryVisualTheme> = {
  people: {
    homeHeader: "bg-blue-50",
    homeBorder: "border-blue-200",
    homeBadge: "bg-blue-100 text-blue-700 border-blue-200",
    categoryBg: "bg-blue-50",
    categoryBorder: "border-blue-200",
    categoryText: "text-blue-800",
    sidebarBadge: "bg-blue-100 text-blue-700 border-blue-200",
  },
  projects: {
    homeHeader: "bg-orange-50",
    homeBorder: "border-orange-200",
    homeBadge: "bg-orange-100 text-orange-700 border-orange-200",
    categoryBg: "bg-orange-50",
    categoryBorder: "border-orange-200",
    categoryText: "text-orange-800",
    sidebarBadge: "bg-orange-100 text-orange-700 border-orange-200",
  },
  philosophies: {
    homeHeader: "bg-purple-50",
    homeBorder: "border-purple-200",
    homeBadge: "bg-purple-100 text-purple-700 border-purple-200",
    categoryBg: "bg-purple-50",
    categoryBorder: "border-purple-200",
    categoryText: "text-purple-800",
    sidebarBadge: "bg-purple-100 text-purple-700 border-purple-200",
  },
  patterns: {
    homeHeader: "bg-green-50",
    homeBorder: "border-green-200",
    homeBadge: "bg-green-100 text-green-700 border-green-200",
    categoryBg: "bg-green-50",
    categoryBorder: "border-green-200",
    categoryText: "text-green-800",
    sidebarBadge: "bg-green-100 text-green-700 border-green-200",
  },
  places: {
    homeHeader: "bg-rose-50",
    homeBorder: "border-rose-200",
    homeBadge: "bg-rose-100 text-rose-700 border-rose-200",
    categoryBg: "bg-rose-50",
    categoryBorder: "border-rose-200",
    categoryText: "text-rose-800",
    sidebarBadge: "bg-rose-100 text-rose-700 border-rose-200",
  },
  films: {
    homeHeader: "bg-pink-50",
    homeBorder: "border-pink-200",
    homeBadge: "bg-pink-100 text-pink-700 border-pink-200",
    categoryBg: "bg-pink-50",
    categoryBorder: "border-pink-200",
    categoryText: "text-pink-800",
    sidebarBadge: "bg-pink-100 text-pink-700 border-pink-200",
  },
  books: {
    homeHeader: "bg-amber-50",
    homeBorder: "border-amber-200",
    homeBadge: "bg-amber-100 text-amber-700 border-amber-200",
    categoryBg: "bg-amber-50",
    categoryBorder: "border-amber-200",
    categoryText: "text-amber-800",
    sidebarBadge: "bg-amber-100 text-amber-700 border-amber-200",
  },
  music: {
    homeHeader: "bg-teal-50",
    homeBorder: "border-teal-200",
    homeBadge: "bg-teal-100 text-teal-700 border-teal-200",
    categoryBg: "bg-teal-50",
    categoryBorder: "border-teal-200",
    categoryText: "text-teal-800",
    sidebarBadge: "bg-teal-100 text-teal-700 border-teal-200",
  },
  eras: {
    homeHeader: "bg-slate-50",
    homeBorder: "border-slate-200",
    homeBadge: "bg-slate-100 text-slate-700 border-slate-200",
    categoryBg: "bg-slate-50",
    categoryBorder: "border-slate-200",
    categoryText: "text-slate-800",
    sidebarBadge: "bg-slate-100 text-slate-700 border-slate-200",
  },
  decisions: {
    homeHeader: "bg-yellow-50",
    homeBorder: "border-yellow-200",
    homeBadge: "bg-yellow-100 text-yellow-700 border-yellow-200",
    categoryBg: "bg-yellow-50",
    categoryBorder: "border-yellow-200",
    categoryText: "text-yellow-800",
    sidebarBadge: "bg-yellow-100 text-yellow-700 border-yellow-200",
  },
  ideas: {
    homeHeader: "bg-cyan-50",
    homeBorder: "border-cyan-200",
    homeBadge: "bg-cyan-100 text-cyan-700 border-cyan-200",
    categoryBg: "bg-cyan-50",
    categoryBorder: "border-cyan-200",
    categoryText: "text-cyan-800",
    sidebarBadge: "bg-cyan-100 text-cyan-700 border-cyan-200",
  },
  tools: {
    homeHeader: "bg-indigo-50",
    homeBorder: "border-indigo-200",
    homeBadge: "bg-indigo-100 text-indigo-700 border-indigo-200",
    categoryBg: "bg-indigo-50",
    categoryBorder: "border-indigo-200",
    categoryText: "text-indigo-800",
    sidebarBadge: "bg-indigo-100 text-indigo-700 border-indigo-200",
  },
};

export function getCategoryTheme(name: string): CategoryVisualTheme {
  return THEMES[name] ?? DEFAULT_THEME;
}
