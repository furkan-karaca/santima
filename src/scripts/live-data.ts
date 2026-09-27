// Refreshes works and slots from the files the CRM publishes, so a publish shows
// without rebuilding the site. The JSON is treated as untrusted: every value goes
// in through textContent or setAttribute, never innerHTML.
type PublicPhoto = { src: Record<string, string>; jpg: string; width: number; height: number; alt: string };
type PublicWork = { id: string; title: string; description: string | null; materials: string | null; photos: PublicPhoto[] };

import { currentMonth, withBase } from "../lib/url";

const SLOTS = ["a", "b", "c", "d", "e", "f"];
const SIZES = "(min-width: 60rem) 45vw, 92vw";
const safePath = (u: unknown) => (typeof u === "string" && /^\/media\/portfolio\/[a-z0-9-]+-\d+\.(webp|jpg)$/i.test(u) ? u : null);

async function getJson<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(path, { cache: "no-store", credentials: "omit" });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

function workItem(w: PublicWork, i: number, rich: boolean): HTMLLIElement | null {
  const p = w.photos?.[0];
  const path = safePath(p?.jpg);
  if (!p || !path) return null;
  const jpg = withBase(path);
  const srcset = Object.entries(p.src ?? {})
    .map(([width, url]) => (safePath(url) && /^\d+$/.test(width) ? `${withBase(url)} ${width}w` : null))
    .filter(Boolean)
    .join(", ");

  const li = document.createElement("li");
  li.className = `work work--${SLOTS[i % SLOTS.length]}`;
  li.setAttribute("data-work", "");
  const fig = document.createElement("figure");
  const frame = document.createElement("div");
  frame.className = "work__frame";
  frame.setAttribute("data-work-frame", "");
  const box = document.createElement("div");
  box.className = "photo work__photo";
  const img = document.createElement("img");
  img.src = jpg;
  if (srcset) img.srcset = srcset;
  img.sizes = SIZES;
  img.width = Number(p.width) || 1200;
  img.height = Number(p.height) || 1500;
  img.alt = String(p.alt ?? w.title ?? "").slice(0, 200);
  img.loading = "lazy";
  img.decoding = "async";
  box.append(img);
  frame.append(box);
  const cap = document.createElement("figcaption");
  cap.className = "work__cap";
  const title = document.createElement("span");
  title.className = "label";
  title.textContent = String(w.title ?? "").slice(0, 120);
  cap.append(title);
  if (w.materials) {
    const mat = document.createElement("span");
    mat.className = "work__mat";
    mat.textContent = String(w.materials).slice(0, 160);
    cap.append(mat);
  }
  if (rich && w.description) {
    const desc = document.createElement("span");
    desc.className = "work__desc";
    desc.textContent = String(w.description).slice(0, 600);
    cap.append(desc);
  }
  fig.append(frame, cap);
  li.append(fig);
  return li;
}

async function refreshWorks(): Promise<boolean> {
  const grid = document.querySelector<HTMLElement>("[data-works]");
  if (!grid) return false;
  const data = await getJson<{ version: number; updatedAt: string; works: PublicWork[] }>(withBase("/data/portfolio.json"));
  if (!data || data.version !== 1 || !Array.isArray(data.works) || !data.works.length) return false;
  if (data.updatedAt === grid.dataset.updatedAt) return false;
  const rich = data.works.length <= 3;
  const items = data.works.map((w, i) => workItem(w, i, rich)).filter((x): x is HTMLLIElement => !!x);
  if (!items.length) return false;
  grid.classList.remove("works__grid--n1", "works__grid--n2", "works__grid--n3");
  if (items.length <= 3) grid.classList.add(`works__grid--n${items.length}`);
  grid.replaceChildren(...items);
  grid.dataset.updatedAt = data.updatedAt;
  return true;
}

async function refreshSlots(): Promise<boolean> {
  if (!document.querySelector("[data-slots]")) return false;
  const data = await getJson<{ version: number; months: { month?: string; label: string; total: number; free: number }[] }>(withBase("/data/slots.json"));
  const m = data?.version === 1 ? currentMonth(data.months) : undefined;
  if (!m || !Number.isFinite(m.total) || !Number.isFinite(m.free)) return false;
  const total = Math.max(0, Math.min(60, Math.round(m.total)));
  const free = Math.max(0, Math.min(total, Math.round(m.free)));
  const monthEl = document.querySelector("[data-slot-month]");
  if (monthEl) monthEl.textContent = String(m.label ?? "").split(" ")[0] ?? "";
  const freeEl = document.querySelector("[data-slot-free]");
  const totalEl = document.querySelector("[data-slot-total]");
  if (freeEl) freeEl.textContent = String(free);
  if (totalEl) totalEl.textContent = String(total);
  const grid = document.querySelector(".slots__grid");
  if (grid) {
    const cells = Array.from({ length: total }, (_, i) => {
      const li = document.createElement("li");
      li.className = i < total - free ? "slot slot--taken" : "slot";
      li.setAttribute("data-slot", "");
      return li;
    });
    grid.replaceChildren(...cells);
  }
  return true;
}

export async function refreshPublished() {
  const [works, slots] = await Promise.all([refreshWorks(), refreshSlots()]);
  if (works || slots) document.dispatchEvent(new CustomEvent("santima:content", { detail: { works, slots } }));
}
