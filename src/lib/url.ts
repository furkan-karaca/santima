// Site-relative links honour Astro's `base`, so one build works at the domain
// root and under a sub-path such as a GitHub Pages project page.
const BASE = import.meta.env.BASE_URL.replace(/\/+$/, "");

export const withBase = (path: string): string => `${BASE}${path}`;

// The first published month that has not ended yet (Yekaterinburg time), so the
// booking block never announces a month that is already over.
export function currentMonth<T extends { month?: string }>(months: T[] | undefined, now = new Date()): T | undefined {
  if (!months?.length) return undefined;
  const key = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Yekaterinburg", year: "numeric", month: "2-digit" }).format(now);
  return months.find((m) => typeof m.month !== "string" || m.month >= key) ?? undefined;
}
