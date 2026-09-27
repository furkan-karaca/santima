// Content published by the CRM into public/data. Read at build time so the
// static HTML is complete for search engines; the page refreshes it at runtime
// (src/scripts/live-data.ts) so a publish from the CRM shows without a rebuild.
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

export type PublicPhoto = { src: Record<string, string>; jpg: string; width: number; height: number; alt: string };
export type PublicWork = { id: string; title: string; description: string | null; materials: string | null; photos: PublicPhoto[] };
export type PortfolioFile = { version: 1; updatedAt: string; works: PublicWork[] };
export type SlotsFile = { version: 1; updatedAt: string; months: { month: string; label: string; total: number; free: number }[] };

function readJson<T>(name: string): T | null {
  const file = resolve(process.cwd(), "public/data", name);
  if (!existsSync(file)) return null;
  try {
    return JSON.parse(readFileSync(file, "utf8")) as T;
  } catch {
    return null;
  }
}

export function publishedPortfolio(): PortfolioFile | null {
  const data = readJson<PortfolioFile>("portfolio.json");
  return data && data.version === 1 && Array.isArray(data.works) ? data : null;
}

export function publishedSlots(): SlotsFile | null {
  const data = readJson<SlotsFile>("slots.json");
  return data && data.version === 1 && Array.isArray(data.months) ? data : null;
}

/** "октябрь 2026 г." -> "октябрь" for headings. */
export function monthWord(label: string): string {
  return label.split(" ")[0] ?? label;
}
